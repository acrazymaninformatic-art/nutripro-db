'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { INTAKE_CATALOG, analyzeRedFlags, detectConflicts } from '@/lib/clinical/intake-catalog'
import { BUILT_IN_TEMPLATES } from '@/lib/clinical/questionnaire-templates'

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
    where: { id: patientId, userId: admin.id },
  })

  if (!patient) throw new Error('Paciente no encontrado.')

  const template = BUILT_IN_TEMPLATES.find((t) => t.type === templateType)
  const title = customTitle || template?.title || 'Cuestionario Clínico de Alta'

  // Crear o actualizar PatientQuestionnaire con estado SENT
  const pQ = await prisma.patientQuestionnaire.create({
    data: {
      patientId,
      type: templateType,
      title,
      status: 'SENT',
      sentAt: new Date(),
      pendingFieldsCount: 0,
      reviewedFieldsCount: 0,
      isReopened: false,
    },
  })

  // Actualizar estado general en ficha del paciente
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      questionnaireDeliveryStatus: 'SENT',
      anamnesisStatus: 'PENDING',
      anamnesisSentAt: new Date(),
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
    where: { id: patientId, userId: admin.id },
  })

  if (!patient) throw new Error('Paciente no encontrado.')

  const existingConsent = await prisma.patientConsent.findFirst({
    where: { patientId, type: consentType, accepted: false },
  })

  let consentId: string
  if (existingConsent) {
    const updated = await prisma.patientConsent.update({
      where: { id: existingConsent.id },
      data: {
        title,
        status: 'SENT',
        sentAt: new Date(),
      },
    })
    consentId = updated.id
  } else {
    const created = await prisma.patientConsent.create({
      data: {
        patientId,
        type: consentType,
        title,
        version: '1.0',
        status: 'SENT',
        sentAt: new Date(),
        accepted: false,
      },
    })
    consentId = created.id
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      consentDeliveryStatus: 'SENT',
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId,
      action: 'CONSENT_SENT_TO_PORTAL',
      entityType: 'PatientConsent',
      entityId: consentId,
    },
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

  const q = await prisma.patientQuestionnaire.findUnique({
    where: { id: questionnaireId },
  })

  if (!q) throw new Error('Cuestionario no encontrado.')

  // Guardar trazabilidad de origen
  const existingProvenance: Record<string, any> = patient.fieldProvenanceJson
    ? JSON.parse(patient.fieldProvenanceJson)
    : {}

  const priorValue = (patient as any)[fieldId]

  existingProvenance[fieldId] = {
    source: 'PATIENT_DECLARED',
    acceptedBy: admin.name || 'Eva Vidal',
    acceptedAt: new Date().toISOString(),
    priorValue: priorValue !== undefined ? priorValue : null,
    newValue: valueToCommit,
  }

  // Preparar actualización en la entidad Patient
  const updateData: Record<string, any> = {
    fieldProvenanceJson: JSON.stringify(existingProvenance),
  }

  // Manejar tipo de dato según esquema de Prisma
  if (fieldId === 'birthDate' && valueToCommit) {
    updateData[fieldId] = new Date(valueToCommit)
  } else if (
    fieldId === 'declaredWeightKg' ||
    fieldId === 'declaredHeightCm' ||
    fieldId === 'waterIntakeLiters' ||
    fieldId === 'sleepHours'
  ) {
    updateData[fieldId] = valueToCommit ? Number(valueToCommit) : null
  } else if (
    fieldId === 'caffeineDaily' ||
    fieldId === 'mealsPerDay' ||
    fieldId === 'exerciseFrequency' ||
    fieldId === 'exerciseDuration'
  ) {
    updateData[fieldId] = valueToCommit ? parseInt(String(valueToCommit), 10) : null
  } else if (
    fieldId === 'isGLP1Treatment' ||
    fieldId === 'smoking' ||
    fieldId === 'cooksAtHome' ||
    fieldId === 'pregnant' ||
    fieldId === 'breastfeeding' ||
    fieldId === 'hormoneTherapy'
  ) {
    updateData[fieldId] = Boolean(valueToCommit)
  } else {
    updateData[fieldId] = valueToCommit ?? ''
  }

  // Si es campo crítico, actualizar también estados de alerta clínica
  if (fieldId === 'allergies') {
    const val = String(valueToCommit || '').trim().toLowerCase()
    updateData.allergiesStatus = val && !val.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
  } else if (fieldId === 'intolerances') {
    const val = String(valueToCommit || '').trim().toLowerCase()
    updateData.intolerancesStatus = val && !val.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
  } else if (fieldId === 'medicalHistory') {
    const val = String(valueToCommit || '').trim().toLowerCase()
    updateData.pathologiesStatus = val && !val.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
  } else if (fieldId === 'currentMedications') {
    const val = String(valueToCommit || '').trim().toLowerCase()
    updateData.medicationsStatus = val && !val.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
  }

  // Decrementar contador pendiente
  const newPending = Math.max(0, (q.pendingFieldsCount || 1) - 1)
  const newReviewed = (q.reviewedFieldsCount || 0) + 1

  await prisma.$transaction([
    prisma.patient.update({
      where: { id: patientId },
      data: {
        ...updateData,
        pendingReviewFieldsCount: Math.max(0, (patient.pendingReviewFieldsCount || 1) - 1),
      },
    }),
    prisma.patientQuestionnaire.update({
      where: { id: questionnaireId },
      data: {
        pendingFieldsCount: newPending,
        reviewedFieldsCount: newReviewed,
      },
    }),
  ])

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

  const q = await prisma.patientQuestionnaire.findUnique({
    where: { id: questionnaireId },
  })

  if (!q) throw new Error('Cuestionario no encontrado.')

  const existingProvenance: Record<string, any> = patient.fieldProvenanceJson
    ? JSON.parse(patient.fieldProvenanceJson)
    : {}

  const updateData: Record<string, any> = {}

  let fieldsCount = 0
  for (const [fieldId, val] of Object.entries(fieldsToCommit)) {
    if (val === undefined || val === null) continue

    fieldsCount++
    const priorValue = (patient as any)[fieldId]
    existingProvenance[fieldId] = {
      source: 'PATIENT_DECLARED',
      acceptedBy: admin.name || 'Eva Vidal',
      acceptedAt: new Date().toISOString(),
      priorValue: priorValue !== undefined ? priorValue : null,
      newValue: val,
    }

    if (fieldId === 'birthDate' && val) {
      updateData[fieldId] = new Date(val)
    } else if (
      fieldId === 'declaredWeightKg' ||
      fieldId === 'declaredHeightCm' ||
      fieldId === 'waterIntakeLiters' ||
      fieldId === 'sleepHours'
    ) {
      updateData[fieldId] = val ? Number(val) : null
    } else if (
      fieldId === 'caffeineDaily' ||
      fieldId === 'mealsPerDay' ||
      fieldId === 'exerciseFrequency' ||
      fieldId === 'exerciseDuration'
    ) {
      updateData[fieldId] = val ? parseInt(String(val), 10) : null
    } else if (
      fieldId === 'isGLP1Treatment' ||
      fieldId === 'smoking' ||
      fieldId === 'cooksAtHome' ||
      fieldId === 'pregnant' ||
      fieldId === 'breastfeeding' ||
      fieldId === 'hormoneTherapy'
    ) {
      updateData[fieldId] = Boolean(val)
    } else {
      updateData[fieldId] = val
    }

    // Alertas críticas
    if (fieldId === 'allergies') {
      const s = String(val).trim().toLowerCase()
      updateData.allergiesStatus = s && !s.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
    } else if (fieldId === 'intolerances') {
      const s = String(val).trim().toLowerCase()
      updateData.intolerancesStatus = s && !s.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
    } else if (fieldId === 'medicalHistory') {
      const s = String(val).trim().toLowerCase()
      updateData.pathologiesStatus = s && !s.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
    } else if (fieldId === 'currentMedications') {
      const s = String(val).trim().toLowerCase()
      updateData.medicationsStatus = s && !s.includes('ningun') ? 'CONFIRMED' : 'NINGUNA_CONOCIDA'
    }
  }

  updateData.fieldProvenanceJson = JSON.stringify(existingProvenance)

  const newPending = Math.max(0, (q.pendingFieldsCount || fieldsCount) - fieldsCount)
  const newReviewed = (q.reviewedFieldsCount || 0) + fieldsCount

  await prisma.$transaction([
    prisma.patient.update({
      where: { id: patientId },
      data: {
        ...updateData,
        pendingReviewFieldsCount: Math.max(0, (patient.pendingReviewFieldsCount || fieldsCount) - fieldsCount),
      },
    }),
    prisma.patientQuestionnaire.update({
      where: { id: questionnaireId },
      data: {
        pendingFieldsCount: newPending,
        reviewedFieldsCount: newReviewed,
      },
    }),
  ])

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

  const q = await prisma.patientQuestionnaire.findUnique({
    where: { id: questionnaireId },
    include: { patient: true },
  })

  if (!q || q.patient.userId !== admin.id) throw new Error('Cuestionario no encontrado.')

  const newPending = Math.max(0, (q.pendingFieldsCount || 1) - 1)
  const newReviewed = (q.reviewedFieldsCount || 0) + 1

  await prisma.$transaction([
    prisma.patientQuestionnaire.update({
      where: { id: questionnaireId },
      data: {
        pendingFieldsCount: newPending,
        reviewedFieldsCount: newReviewed,
      },
    }),
    prisma.patient.update({
      where: { id: patientId },
      data: {
        pendingReviewFieldsCount: Math.max(0, (q.patient.pendingReviewFieldsCount || 1) - 1),
      },
    }),
  ])

  revalidatePath('/dashboard/questionnaires')
  revalidatePath(`/dashboard/patients/${patientId}`)

  return { success: true, remainingPending: newPending }
}
