'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { INTAKE_CATALOG, analyzeRedFlags, detectConflicts, type IntakeFieldDefinition } from '@/lib/clinical/intake-catalog'
import { BUILT_IN_TEMPLATES } from '@/lib/clinical/questionnaire-templates'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

const ALLOWED_PORTAL_CONSENT_TYPES = new Set([
  ...REQUIRED_PORTAL_CONSENTS.map((consent) => consent.type),
  'INFORMED_CONSENT',
  'IMAGE_RIGHTS',
  'ONLINE_CONSULTATION',
])

const FIELD_BY_ID = new Map(INTAKE_CATALOG.map((field) => [field.id, field]))
const INTEGER_FIELD_IDS = new Set(['caffeineDaily', 'mealsPerDay', 'exerciseFrequency', 'exerciseDuration'])

function parseStrictBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'si' || normalized === 'sí'
  }
  return false
}

/**
 * Convierte un valor recibido del navegador al tipo exacto del campo del
 * catálogo. Rechaza campos fuera de catálogo, opciones inventadas y fechas
 * inválidas. En particular, "false" nunca se interpreta como verdadero.
 */
function coerceCatalogValue(field: IntakeFieldDefinition, rawValue: unknown): unknown {
  if (rawValue === undefined || rawValue === null) return null

  if (field.type === 'boolean') return parseStrictBoolean(rawValue)

  if (field.type === 'number') {
    if (rawValue === '') return null
    const numeric = Number(rawValue)
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100000) {
      throw new Error(`Valor numérico no válido para «${field.label}».`)
    }
    return INTEGER_FIELD_IDS.has(field.id) ? Math.round(numeric) : numeric
  }

  if (field.type === 'date') {
    if (rawValue === '') return null
    const date = new Date(String(rawValue))
    if (Number.isNaN(date.getTime())) throw new Error(`Fecha no válida para «${field.label}».`)
    if (date.getFullYear() < 1900 || date.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      throw new Error(`Fecha fuera de rango para «${field.label}».`)
    }
    return date
  }

  const text = String(rawValue).trim().slice(0, 10000)
  if (field.type === 'select' && text && field.options?.length) {
    if (!field.options.some((option) => option.value === text)) {
      throw new Error(`Opción no válida para «${field.label}».`)
    }
  }
  if (field.type === 'multi-select' && text && field.options?.length) {
    const values = text.split(',').map((value) => value.trim()).filter(Boolean)
    if (values.some((value) => !field.options!.some((option) => option.value === value))) {
      throw new Error(`Opción no válida para «${field.label}».`)
    }
  }
  return text
}

function getCatalogField(fieldId: string): IntakeFieldDefinition {
  const field = FIELD_BY_ID.get(fieldId)
  if (!field) throw new Error('Campo clínico no permitido.')
  return field
}

function buildPatientUpdate(field: IntakeFieldDefinition, value: unknown): Record<string, unknown> {
  const data: Record<string, unknown> = { [field.id]: value }
  const text = typeof value === 'string' ? value.trim().toLowerCase() : ''
  const status = text && !text.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
  if (field.id === 'allergies') data.allergiesStatus = status
  if (field.id === 'intolerances') data.intolerancesStatus = status
  if (field.id === 'medicalHistory') data.pathologiesStatus = status
  if (field.id === 'currentMedications') data.medicationsStatus = status
  return data
}

async function requireQuestionnaireForPatient(questionnaireId: string, patientId: string) {
  const questionnaire = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patientId },
    select: { id: true, patientId: true, pendingFieldsCount: true, reviewedFieldsCount: true },
  })
  if (!questionnaire) throw new Error('Cuestionario no encontrado.')
  return questionnaire
}

/**
 * 5.4 Entrega dentro del portal: Envío del cuestionario al portal del paciente
 * "Eva envía el cuestionario a la cuenta del paciente; no se manda por correo ni por WhatsApp."
 */
export async function sendQuestionnaireToPortalAction(
  patientId: string,
  templateType: string = 'ALTA',
  customTitle?: string
) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id, isActive: true, isHardDeleted: false },
  })

  if (!patient) throw new Error('Paciente no encontrado.')

  const template = BUILT_IN_TEMPLATES.find((t) => t.type === templateType)
  const safeTemplateType = template?.type || 'ALTA'
  const safeTitle = String(customTitle || template?.title || 'Cuestionario Clínico de Alta').trim().slice(0, 200)
  const title = safeTitle || 'Cuestionario Clínico de Alta'

  // Crear o actualizar PatientQuestionnaire con estado SENT
  const pQ = await prisma.patientQuestionnaire.create({
    data: {
      patientId,
      type: safeTemplateType,
      title,
      status: 'SENT',
      sentAt: new Date(),
      pendingFieldsCount: 0,
      reviewedFieldsCount: 0,
      isReopened: false,
    },
  })

  // Solo la anamnesis de alta modifica el estado de anamnesis del paciente.
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      questionnaireDeliveryStatus: 'SENT',
      ...(safeTemplateType === 'ALTA'
        ? { anamnesisStatus: 'PENDING', anamnesisSentAt: new Date() }
        : {}),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId,
      action: 'QUESTIONNAIRE_SENT_TO_PORTAL',
      entityType: 'PatientQuestionnaire',
      entityId: pQ.id,
    },
  })

  revalidatePath('/dashboard/questionnaires')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente')
  revalidatePath('/paciente/cuestionarios')

  return { success: true, id: pQ.id }
}

/**
 * 5.4 Entrega dentro del portal: Envío de documento de consentimiento para firma digital
 * "Lo mismo con los consentimientos que hay que firmar. Al entrar, el paciente ve un aviso..."
 */
export async function sendConsentToPortalAction(
  patientId: string,
  consentType: string = 'INFORMED_CONSENT',
  title: string = 'Consentimiento Informado para Tratamiento Nutricional y Clínico'
) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id, isActive: true, isHardDeleted: false },
  })

  if (!patient) throw new Error('Paciente no encontrado.')
  if (!ALLOWED_PORTAL_CONSENT_TYPES.has(consentType)) {
    throw new Error('Tipo de consentimiento no permitido.')
  }
  const requiredConsent = REQUIRED_PORTAL_CONSENTS.find((consent) => consent.type === consentType)
  const requestedTitle = requiredConsent?.title || (typeof title === 'string' ? title : '')
  const safeTitle = requestedTitle.trim().slice(0, 200)
  if (!safeTitle) throw new Error('El consentimiento debe tener un título.')
  const targetVersion = requiredConsent ? LEGAL_POLICY_VERSION : '1.0'
  const sentAt = new Date()

  const consentId = await prisma.$transaction(async (tx) => {
    const completed = await tx.patientConsent.findFirst({
      where: {
        patientId,
        type: consentType,
        version: targetVersion,
        accepted: true,
        revokedAt: null,
        status: 'COMPLETED',
      },
      select: { id: true },
    })
    if (completed) {
      throw new Error('Este consentimiento ya está firmado. Para cambiar su contenido emite uno nuevo.')
    }

    const existingConsent = await tx.patientConsent.findFirst({
      where: {
        patientId,
        type: consentType,
        version: targetVersion,
        accepted: false,
        revokedAt: null,
        status: { in: ['NOT_SENT', 'SENT', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    let generatedConsentId: string
    if (existingConsent) {
      const updated = await tx.patientConsent.updateMany({
        where: {
          id: existingConsent.id,
          accepted: false,
          revokedAt: null,
          status: { in: ['NOT_SENT', 'SENT', 'IN_PROGRESS'] },
        },
        data: {
          title: safeTitle,
          status: 'SENT',
          sentAt,
        },
      })
      if (updated.count !== 1) {
        throw new Error(
          'El consentimiento ha cambiado mientras se enviaba. Recarga la ficha e inténtalo de nuevo.'
        )
      }
      generatedConsentId = existingConsent.id
    } else {
      const created = await tx.patientConsent.create({
        data: {
          patientId,
          type: consentType,
          title: safeTitle,
          version: targetVersion,
          status: 'SENT',
          sentAt,
          accepted: false,
        },
      })
      generatedConsentId = created.id
    }

    // No se pisa un estado global COMPLETED si el paciente acaba de firmar
    // todos los documentos obligatorios en paralelo.
    await tx.patient.updateMany({
      where: { id: patientId, consentDeliveryStatus: { not: 'COMPLETED' } },
      data: { consentDeliveryStatus: 'SENT' },
    })

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId,
        action: 'CONSENT_SENT_TO_PORTAL',
        entityType: 'PatientConsent',
        entityId: generatedConsentId,
        details: `Consentimiento "${safeTitle}" (versión ${targetVersion}) enviado al portal.`,
      },
    })

    return generatedConsentId
  })

  revalidatePath('/dashboard/questionnaires')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente')
  revalidatePath('/paciente/cuestionarios')

  return { success: true, id: consentId }
}

/**
 * Reabrir un cuestionario ya completado si Eva necesita que el paciente rectifique o amplíe
 * "Una respuesta ya enviada no se puede cambiar sin que Eva la reabra." (Sección 5.4)
 */
export async function reopenQuestionnaireAction(questionnaireId: string) {
  const admin = await requireAdmin()

  const q = await prisma.patientQuestionnaire.findUnique({
    where: { id: questionnaireId },
    include: { patient: true },
  })

  if (!q || q.patient.userId !== admin.id) {
    throw new Error('Cuestionario no encontrado.')
  }

  await prisma.patientQuestionnaire.update({
    where: { id: questionnaireId },
    data: {
      status: 'IN_PROGRESS',
      isReopened: true,
    },
  })

  await prisma.patient.update({
    where: { id: q.patientId },
    data: {
      questionnaireDeliveryStatus: 'IN_PROGRESS',
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId: q.patientId,
      action: 'QUESTIONNAIRE_REOPENED_BY_ADMIN',
      entityType: 'PatientQuestionnaire',
      entityId: q.id,
    },
  })

  revalidatePath('/dashboard/questionnaires')
  revalidatePath(`/dashboard/patients/${q.patientId}`)
  revalidatePath('/paciente/cuestionarios')

  return { success: true }
}

/**
 * Obtener datos para la pantalla de revisión lado a lado (Ficha vs. Respuesta de paciente)
 */
export async function getQuestionnaireReviewDataAction(patientQuestionnaireId: string) {
  const admin = await requireAdmin()

  const questionnaire = await prisma.patientQuestionnaire.findUnique({
    where: { id: patientQuestionnaireId },
    include: {
      patient: true,
    },
  })

  if (!questionnaire || questionnaire.patient.userId !== admin.id) {
    throw new Error('Cuestionario no encontrado.')
  }

  const patient = questionnaire.patient
  const answers: Record<string, any> = questionnaire.answersJson
    ? JSON.parse(questionnaire.answersJson)
    : {}

  // Parsear trazabilidad existente
  const provenance: Record<string, any> = patient.fieldProvenanceJson
    ? JSON.parse(patient.fieldProvenanceJson)
    : {}

  // Extraer valores actuales de la ficha
  const currentRecord: Record<string, any> = { ...patient }

  // Calcular banderas rojas
  const redFlags = analyzeRedFlags(answers)

  // Detectar conflictos críticos
  const conflicts = detectConflicts(currentRecord, answers)

  return {
    questionnaire,
    patient,
    answers,
    currentRecord,
    provenance,
    redFlags,
    conflicts,
    catalog: INTAKE_CATALOG,
  }
}

/**
 * Aceptar un campo individual a la ficha del paciente (Sección 5.4)
 * "Revisión antes de escribir en la ficha. Eva acepta campo a campo...
 * Nada se escribe en la ficha sin su confirmación.
 * Origen de cada dato: guarda quién lo aportó y cuándo."
 */
export async function acceptFieldToPatientRecordAction(
  patientId: string,
  questionnaireId: string,
  fieldId: string,
  valueToCommit: any
) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id },
  })

  if (!patient) throw new Error('Paciente no encontrado.')

  const field = getCatalogField(fieldId)
  const value = coerceCatalogValue(field, valueToCommit)
  const q = await requireQuestionnaireForPatient(questionnaireId, patientId)

  // Guardar trazabilidad de origen
  const existingProvenance: Record<string, any> = patient.fieldProvenanceJson
    ? JSON.parse(patient.fieldProvenanceJson)
    : {}

  const priorValue = (patient as any)[field.id]

  existingProvenance[field.id] = {
    source: 'PATIENT_DECLARED',
    acceptedBy: admin.name || 'Eva Vidal',
    acceptedAt: new Date().toISOString(),
    priorValue: priorValue !== undefined ? priorValue : null,
    newValue: value,
  }

  const updateData: Record<string, unknown> = {
    fieldProvenanceJson: JSON.stringify(existingProvenance),
    ...buildPatientUpdate(field, value),
  }

  // Decrementar contador pendiente
  const newPending = Math.max(0, (q.pendingFieldsCount || 1) - 1)
  const newReviewed = (q.reviewedFieldsCount || 0) + 1

  await prisma.$transaction(async (tx) => {
    const patientUpdate = await tx.patient.updateMany({
      where: { id: patient.id, userId: admin.id },
      data: {
        ...updateData,
        pendingReviewFieldsCount: Math.max(0, (patient.pendingReviewFieldsCount || 1) - 1),
      },
    })
    if (patientUpdate.count !== 1) throw new Error('Paciente no encontrado.')

    const questionnaireUpdate = await tx.patientQuestionnaire.updateMany({
      where: { id: q.id, patientId: patient.id },
      data: {
        pendingFieldsCount: newPending,
        reviewedFieldsCount: newReviewed,
      },
    })
    if (questionnaireUpdate.count !== 1) throw new Error('Cuestionario no encontrado.')

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId: patient.id,
        action: 'QUESTIONNAIRE_FIELD_ACCEPTED',
        entityType: 'PatientQuestionnaire',
        entityId: q.id,
        details: `Campo «${field.label}» aceptado en la ficha desde el cuestionario.`,
      },
    })
  })

  revalidatePath('/dashboard/questionnaires')
  revalidatePath(`/dashboard/patients/${patientId}`)

  return { success: true, remainingPending: newPending }
}

/**
 * Aceptar todos los campos de un paso completo (Sección 5.4)
 * "o con «Aceptar todo» por paso, y puede editar antes de aceptar"
 */
export async function acceptStepToPatientRecordAction(
  patientId: string,
  questionnaireId: string,
  stepNumber: number,
  fieldsToCommit: Record<string, any>
) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id },
  })

  if (!patient) throw new Error('Paciente no encontrado.')

  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 8) {
    throw new Error('Paso de cuestionario no válido.')
  }

  const q = await requireQuestionnaireForPatient(questionnaireId, patientId)

  const existingProvenance: Record<string, any> = patient.fieldProvenanceJson
    ? JSON.parse(patient.fieldProvenanceJson)
    : {}

  const updateData: Record<string, unknown> = {}
  const acceptedLabels: string[] = []
  let fieldsCount = 0

  for (const [fieldId, rawValue] of Object.entries(fieldsToCommit)) {
    if (rawValue === undefined || rawValue === null) continue

    const field = getCatalogField(fieldId)
    if (field.step !== stepNumber) {
      throw new Error(`El campo «${field.label}» no pertenece al paso ${stepNumber}.`)
    }
    const value = coerceCatalogValue(field, rawValue)
    fieldsCount += 1
    acceptedLabels.push(field.label)

    const priorValue = (patient as any)[field.id]
    existingProvenance[field.id] = {
      source: 'PATIENT_DECLARED',
      acceptedBy: admin.name || 'Eva Vidal',
      acceptedAt: new Date().toISOString(),
      priorValue: priorValue !== undefined ? priorValue : null,
      newValue: value,
    }

    Object.assign(updateData, buildPatientUpdate(field, value))
  }

  if (fieldsCount === 0) {
    return { success: true, countAccepted: 0, remainingPending: q.pendingFieldsCount || 0 }
  }

  updateData.fieldProvenanceJson = JSON.stringify(existingProvenance)

  const newPending = Math.max(0, (q.pendingFieldsCount || fieldsCount) - fieldsCount)
  const newReviewed = (q.reviewedFieldsCount || 0) + fieldsCount

  await prisma.$transaction(async (tx) => {
    const patientUpdate = await tx.patient.updateMany({
      where: { id: patient.id, userId: admin.id },
      data: {
        ...updateData,
        pendingReviewFieldsCount: Math.max(0, (patient.pendingReviewFieldsCount || fieldsCount) - fieldsCount),
      },
    })
    if (patientUpdate.count !== 1) throw new Error('Paciente no encontrado.')

    const questionnaireUpdate = await tx.patientQuestionnaire.updateMany({
      where: { id: q.id, patientId: patient.id },
      data: {
        pendingFieldsCount: newPending,
        reviewedFieldsCount: newReviewed,
      },
    })
    if (questionnaireUpdate.count !== 1) throw new Error('Cuestionario no encontrado.')

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId: patient.id,
        action: 'QUESTIONNAIRE_STEP_ACCEPTED',
        entityType: 'PatientQuestionnaire',
        entityId: q.id,
        details: `Paso ${stepNumber} aceptado (${fieldsCount} campos): ${acceptedLabels.join(', ')}.`,
      },
    })
  })

  revalidatePath('/dashboard/questionnaires')
  revalidatePath(`/dashboard/patients/${patientId}`)

  return { success: true, countAccepted: fieldsCount, remainingPending: newPending }
}

/**
 * Descartar la importación de un campo específico (Eva no desea sobreescribir la ficha con ese valor)
 */
export async function discardFieldReviewAction(
  patientId: string,
  questionnaireId: string,
  fieldId: string
) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id },
    select: { id: true, pendingReviewFieldsCount: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const field = getCatalogField(fieldId)
  const q = await requireQuestionnaireForPatient(questionnaireId, patientId)

  const newPending = Math.max(0, (q.pendingFieldsCount || 1) - 1)
  const newReviewed = (q.reviewedFieldsCount || 0) + 1

  await prisma.$transaction(async (tx) => {
    const questionnaireUpdate = await tx.patientQuestionnaire.updateMany({
      where: { id: q.id, patientId: patient.id },
      data: {
        pendingFieldsCount: newPending,
        reviewedFieldsCount: newReviewed,
      },
    })
    if (questionnaireUpdate.count !== 1) throw new Error('Cuestionario no encontrado.')

    await tx.patient.updateMany({
      where: { id: patient.id, userId: admin.id },
      data: {
        pendingReviewFieldsCount: Math.max(0, (patient.pendingReviewFieldsCount || 1) - 1),
      },
    })

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId: patient.id,
        action: 'QUESTIONNAIRE_FIELD_DISCARDED',
        entityType: 'PatientQuestionnaire',
        entityId: q.id,
        details: `Campo «${field.label}» descartado; no se escribe en la ficha.`,
      },
    })
  })

  revalidatePath('/dashboard/questionnaires')
  revalidatePath(`/dashboard/patients/${patientId}`)

  return { success: true, remainingPending: newPending }
}
