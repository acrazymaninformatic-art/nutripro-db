'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { destroySession, requirePatient } from '@/lib/auth'
import { getForwardedClientAddress, LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'
import { deletePrivateFileStrict, savePrivateFile } from '@/lib/storage/private-storage'
import { analyzeRedFlags } from '@/lib/clinical/intake-catalog'
import { sanitizeQuestionnaireAnswers } from '@/lib/clinical/questionnaire-answers'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}

export async function logout() {
  return logoutAction()
}

/**
 * Aceptación obligatoria de políticas RGPD, Cookies y Condiciones de uso al primer login
 */
export async function acceptPatientPoliciesAction(formData: FormData) {
  const { user, patientId, isAdminPreview } = await requirePatient({
    allowPendingConsent: true,
    allowPasswordChangePending: true,
  })
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal).')
  if (!patientId) {
    throw new Error('Paciente no identificado')
  }

  const acceptedFields = ['privacyNoticeAccepted', 'portalTermsAccepted', 'healthDataConsentAccepted']
  if (acceptedFields.some((field) => formData.get(field) !== 'on' && formData.get(field) !== 'true')) {
    throw new Error('Debes aceptar por separado la información de privacidad, las condiciones de uso y el tratamiento de datos de salud.')
  }

  const headerList = await headers()
  const acceptedAt = new Date()
  const ipAddress = getForwardedClientAddress(headerList.get('x-forwarded-for') || headerList.get('x-real-ip'))
  const userAgent = (headerList.get('user-agent') || 'no disponible').slice(0, 500)

  await prisma.$transaction(async (tx) => {
    const patientRow = await tx.patient.findUnique({
      where: { id: patientId },
      select: {
        isActive: true,
        isHardDeleted: true,
        portalAccessEnabled: true,
        consentAcceptedAt: true,
        consentPolicyVersion: true,
        consentRevokedAt: true,
      },
    })
    if (
      !patientRow ||
      !patientRow.isActive ||
      patientRow.isHardDeleted ||
      !patientRow.portalAccessEnabled
    ) {
      throw new Error('El acceso al portal ya no está disponible. Contacta con tu nutricionista.')
    }

    const requiredTypes = REQUIRED_PORTAL_CONSENTS.map((consent) => consent.type)
    const activeBefore = await tx.patientConsent.findMany({
      where: {
        patientId,
        type: { in: requiredTypes },
        version: LEGAL_POLICY_VERSION,
        accepted: true,
        revokedAt: null,
        status: 'COMPLETED',
      },
      select: { type: true },
    })
    const allRequiredActiveBefore = REQUIRED_PORTAL_CONSENTS.every((consent) =>
      activeBefore.some((row) => row.type === consent.type)
    )

    // Si ya consta la aceptación vigente, la acción es idempotente y no
    // reescribe firmas ni la fecha original de aceptación.
    if (
      allRequiredActiveBefore &&
      patientRow.consentAcceptedAt &&
      patientRow.consentPolicyVersion === LEGAL_POLICY_VERSION &&
      !patientRow.consentRevokedAt
    ) {
      return
    }

    for (const requiredConsent of REQUIRED_PORTAL_CONSENTS) {
      const existingConsent = await tx.patientConsent.findFirst({
        where: { patientId, type: requiredConsent.type, version: LEGAL_POLICY_VERSION },
        orderBy: { createdAt: 'desc' },
      })

      // Un consentimiento completado es inmutable: no se puede volver a
      // firmar ni sobrescribir su evidencia. Una aceptación nueva tras una
      // retirada se guarda como registro nuevo para conservar el histórico.
      if (
        existingConsent &&
        !existingConsent.revokedAt &&
        existingConsent.status === 'COMPLETED' &&
        existingConsent.accepted
      ) {
        continue
      }

      if (existingConsent && !existingConsent.revokedAt) {
        const updated = await tx.patientConsent.updateMany({
          where: {
            id: existingConsent.id,
            patientId,
            revokedAt: null,
            accepted: false,
            status: { in: ['NOT_SENT', 'SENT', 'IN_PROGRESS'] },
          },
          data: {
            status: 'COMPLETED',
            accepted: true,
            acceptedAt,
            signatureData: 'Aceptado digitalmente en el portal tras lectura separada del documento.',
            ipAddress,
            userAgent,
          },
        })
        if (updated.count !== 1) {
          const refreshed = await tx.patientConsent.findUnique({
            where: { id: existingConsent.id },
            select: { accepted: true, status: true, revokedAt: true },
          })
          if (refreshed && !refreshed.revokedAt && refreshed.status === 'COMPLETED' && refreshed.accepted) {
            continue
          }
          throw new Error('No se pudo registrar la aceptación. Recarga la página e inténtalo de nuevo.')
        }
      } else {
        await tx.patientConsent.create({
          data: {
            patientId,
            type: requiredConsent.type,
            title: requiredConsent.title,
            version: LEGAL_POLICY_VERSION,
            status: 'COMPLETED',
            accepted: true,
            acceptedAt,
            signatureData: 'Aceptado digitalmente en el portal tras lectura separada del documento.',
            ipAddress,
            userAgent,
          },
        })
      }
    }

    const activeAfter = await tx.patientConsent.findMany({
      where: {
        patientId,
        type: { in: requiredTypes },
        version: LEGAL_POLICY_VERSION,
        accepted: true,
        revokedAt: null,
        status: 'COMPLETED',
      },
      select: { type: true },
    })
    const allRequiredActive = REQUIRED_PORTAL_CONSENTS.every((consent) =>
      activeAfter.some((row) => row.type === consent.type)
    )
    if (!allRequiredActive) {
      throw new Error('No se pudieron registrar todos los consentimientos obligatorios. Inténtalo de nuevo.')
    }

    const patientUpdated = await tx.patient.updateMany({
      where: { id: patientId, isActive: true, isHardDeleted: false, portalAccessEnabled: true },
      data: {
        consentAcceptedAt: acceptedAt,
        consentPolicyVersion: LEGAL_POLICY_VERSION,
        consentDeliveryStatus: 'COMPLETED',
        consentRevokedAt: null,
        consentRevocationReason: null,
      },
    })
    if (patientUpdated.count !== 1) {
      throw new Error('El acceso al portal ya no está disponible. Contacta con tu nutricionista.')
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        patientId,
        action: 'PORTAL_LEGAL_POLICIES_ACCEPTED',
        entityType: 'PatientConsent',
        details: `Aceptación separada de privacidad, condiciones y datos de salud. Versión ${LEGAL_POLICY_VERSION}.`,
      },
    })
  })

  revalidatePath('/paciente')
  redirect('/paciente')
}

/**
 * Solicitud de Cita desde el portal del paciente
 * "El paciente solo la solicita sin elegir día ni hora; Eva fija la fecha y la hora" (PDF pág 3 y 15)
 */
/**
 * Solicitud de Cita desde el portal del paciente (Sección 5.5)
 * "El paciente solo la solicita sin elegir día ni hora; Eva fija la fecha y la hora"
 */
export async function requestAppointmentAction(formData: FormData) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal). Las solicitudes de cita están desactivadas en este modo.')
  if (!patientId) throw new Error('Paciente no identificado')

  const limit = await consumeRateLimit({
    key: rateLimitKey('patient-appointment-request', patientId),
    limit: 5,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  })
  if (!limit.allowed) {
    throw new Error(`Demasiadas solicitudes de cita. Espera ${limit.retryAfterSeconds} segundos antes de volver a intentarlo.`)
  }

  const requestedType = String(formData.get('appointmentType') || 'REVISION')
  const appointmentType = ['PRIMERA', 'REVISION', 'ONLINE', 'DOMICILIO', 'GRUPAL'].includes(requestedType)
    ? requestedType
    : 'REVISION'
  const modality = formData.get('modality') === 'PRESENCIAL' ? 'PRESENCIAL' : 'ONLINE'
  const preferredTime = String(formData.get('preferredTime') || '').trim().slice(0, 50)
  const preferredDays = String(formData.get('preferredDays') || '').trim().slice(0, 100)
  const notes = String(formData.get('notes') || '').trim().slice(0, 2_000)

  // Se crea fecha tentativa a 7 días vista
  const tentativeDate = new Date()
  tentativeDate.setDate(tentativeDate.getDate() + 7)
  tentativeDate.setHours(10, 0, 0, 0)

  // Asignar color según tipo de cita (5.5)
  const typeColors: Record<string, string> = {
    PRIMERA: '#2563eb', // Azul
    REVISION: '#16a34a', // Verde
    ONLINE: '#9333ea', // Morado
    DOMICILIO: '#d97706', // Ámbar
    GRUPAL: '#4f46e5', // Índigo
  }
  const typeColor = typeColors[appointmentType] || '#16a34a'

  // La cita provisional y su solicitud se crean juntas: si falla el registro
  // de la solicitud no queda una cita huérfana en la agenda.
  const appointment = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
      data: {
        patientId,
        date: tentativeDate,
        durationMin: appointmentType === 'PRIMERA' ? 60 : appointmentType === 'GRUPAL' ? 90 : 45,
        modality: modality as 'ONLINE' | 'PRESENCIAL',
        status: 'REQUESTED',
        appointmentType,
        typeColor,
        // Las notas libres del paciente viven en AppointmentRequest.patientNotes,
        // no en el campo clínico interno de la cita.
        location: modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal',
      },
    })

    await tx.appointmentRequest.create({
      data: {
        patientId,
        appointmentId: created.id,
        type: 'NEW',
        status: 'PENDING',
        appointmentType,
        modality,
        preferredTimeOfDay: preferredTime.includes('mañana') ? 'MORNING' : preferredTime.includes('tarde') ? 'AFTERNOON' : 'ANY',
        preferredDays: preferredDays || null,
        patientNotes: notes,
      },
    })

    return created
  })

  revalidatePath('/paciente/citas')
  revalidatePath('/dashboard/appointments')
  return { success: true, appointmentId: appointment.id }
}

/**
 * Solicitud de cambio o cancelación de una cita existente (Sección 5.5)
 */
export async function requestAppointmentChangeAction(formData: FormData) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal). Las modificaciones de cita están desactivadas en este modo.')
  if (!patientId) throw new Error('Paciente no identificado')

  const limit = await consumeRateLimit({
    key: rateLimitKey('patient-appointment-change', patientId),
    limit: 10,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  })
  if (!limit.allowed) {
    throw new Error(`Demasiadas solicitudes. Espera ${limit.retryAfterSeconds} segundos antes de volver a intentarlo.`)
  }

  const appointmentId = String(formData.get('appointmentId') || '')
  const actionTypeRaw = String(formData.get('actionType') || '')
  if (!['CANCEL', 'CHANGE'].includes(actionTypeRaw)) throw new Error('Tipo de solicitud no válido.')
  const actionType = actionTypeRaw as 'CANCEL' | 'CHANGE'
  const reason = String(formData.get('reason') || '').trim().slice(0, 2_000)

  const app = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
  })

  if (!app) throw new Error('Cita no encontrada')
  if (!['CONFIRMED', 'PENDING', 'REQUESTED'].includes(app.status)) {
    throw new Error('Esta cita ya no se puede modificar desde el portal.')
  }

  const nextStatus = actionType === 'CANCEL' ? 'CANCEL_REQUESTED' : 'RESCHEDULE_REQUESTED'

  // No se tocan las notas clínicas internas de la cita. El motivo del paciente
  // queda únicamente en AppointmentRequest.patientNotes y la actualización
  // solo se aplica si el estado no ha cambiado mientras el paciente decidía.
  await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.updateMany({
      where: { id: appointmentId, patientId, status: app.status },
      data: { status: nextStatus },
    })
    if (updated.count !== 1) {
      throw new Error('La cita ha cambiado mientras tramitabas la solicitud. Vuelve a intentarlo.')
    }

    await tx.appointmentRequest.create({
      data: {
        patientId,
        appointmentId,
        type: actionType === 'CANCEL' ? 'CANCEL' : 'RESCHEDULE',
        status: 'PENDING',
        appointmentType: app.appointmentType,
        modality: app.modality,
        reason,
        patientNotes: reason,
      },
    })
  })

  revalidatePath('/paciente/citas')
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

/**
 * Marcar consentimiento como visto cuando el paciente entra a revisarlo (Estado: IN_PROGRESS / pendiente)
 */
export async function markConsentViewedAction(consentId: string) {
  const { patientId, isAdminPreview } = await requirePatient({
    allowPendingConsent: true,
    allowPasswordChangePending: true,
  })
  if (isAdminPreview) return
  if (!patientId) return

  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId, version: LEGAL_POLICY_VERSION },
  })

  if (consent && !consent.accepted && consent.status === 'SENT') {
    await prisma.patientConsent.update({
      where: { id: consentId },
      data: {
        status: 'IN_PROGRESS',
        viewedAt: new Date(),
      },
    })
    await prisma.patient.update({
      where: { id: patientId },
      data: { consentDeliveryStatus: 'IN_PROGRESS' },
    })
  }
}

/**
 * Firma de consentimiento informado desde el portal (Sección 5.4)
 */
export async function signConsentAction(consentId: string, signatureData: string) {
  const { user, patientId, isAdminPreview } = await requirePatient({
    allowPendingConsent: true,
    allowPasswordChangePending: true,
  })
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal). La firma de consentimientos está desactivada en este modo.')
  if (!patientId) throw new Error('Paciente no identificado')

  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId },
  })

  if (!consent) throw new Error('Consentimiento no encontrado')
  if (consent.version !== LEGAL_POLICY_VERSION) {
    throw new Error('Este documento pertenece a una versión anterior. Solicita a tu nutricionista la versión vigente.')
  }
  if (consent.revokedAt) {
    throw new Error('Este consentimiento fue retirado. Solicita a tu nutricionista un documento nuevo.')
  }
  if (consent.status === 'NOT_SENT') {
    throw new Error('Este consentimiento todavía no está disponible para firma.')
  }
  if (consent.status === 'COMPLETED') {
    throw new Error('Este consentimiento ya está firmado y no puede modificarse.')
  }

  const headerList = await headers()
  const ipAddress = getForwardedClientAddress(headerList.get('x-forwarded-for') || headerList.get('x-real-ip')).slice(0, 64)
  const userAgent = (headerList.get('user-agent') || 'browser').slice(0, 500)
  const safeSignatureData =
    String(signatureData || '').trim().slice(0, 200_000) ||
    'Firma digital confirmada en pantalla por el paciente'

  const acceptedAt = new Date()
  const requiredTypes = REQUIRED_PORTAL_CONSENTS.map((item) => item.type)

  // La firma, el estado global del expediente y su auditoría se actualizan en
  // una sola transacción. Si el paciente firma un consentimiento opcional
  // cuando los obligatorios ya estaban completos, se conserva la fecha
  // original de aceptación en lugar de sobrescribirla.
  await prisma.$transaction(async (tx) => {
    const updated = await tx.patientConsent.updateMany({
      where: {
        id: consentId,
        patientId,
        revokedAt: null,
        status: { in: ['SENT', 'IN_PROGRESS'] },
      },
      data: {
        status: 'COMPLETED',
        accepted: true,
        acceptedAt,
        signatureData: safeSignatureData,
        ipAddress,
        userAgent,
      },
    })
    if (updated.count !== 1) {
      throw new Error('El consentimiento ya no está disponible para firma. Solicita uno nuevo a tu nutricionista.')
    }

    const activeRequiredConsents = await tx.patientConsent.findMany({
      where: {
        patientId,
        type: { in: requiredTypes },
        version: LEGAL_POLICY_VERSION,
        accepted: true,
        revokedAt: null,
        status: 'COMPLETED',
      },
      select: { type: true },
    })
    const allRequiredAccepted = requiredTypes.every((type) =>
      activeRequiredConsents.some((activeConsent) => activeConsent.type === type)
    )
    const patient = await tx.patient.findUnique({
      where: { id: patientId },
      select: {
        consentAcceptedAt: true,
        consentPolicyVersion: true,
        consentRevokedAt: true,
      },
    })
    const alreadyCurrent = Boolean(
      patient?.consentAcceptedAt &&
      patient.consentPolicyVersion === LEGAL_POLICY_VERSION &&
      !patient.consentRevokedAt
    )
    const finalAcceptedAt = allRequiredAccepted
      ? alreadyCurrent
        ? patient!.consentAcceptedAt
        : acceptedAt
      : null

    await tx.patient.update({
      where: { id: patientId },
      data: {
        consentDeliveryStatus: allRequiredAccepted ? 'COMPLETED' : 'IN_PROGRESS',
        consentAcceptedAt: finalAcceptedAt,
        consentPolicyVersion: allRequiredAccepted ? LEGAL_POLICY_VERSION : null,
        ...(allRequiredAccepted && !alreadyCurrent
          ? { consentRevokedAt: null, consentRevocationReason: null }
          : {}),
      },
    })

    await tx.auditLog.create({
      data: {
        userId: user.id,
        patientId,
        action: 'CONSENT_SIGNED_PORTAL',
        entityType: 'PatientConsent',
        entityId: consent.id,
        details: `Consentimiento "${consent.title}" (versión ${consent.version}) firmado digitalmente desde el portal.`,
      },
    })
  })

  revalidatePath('/paciente/cuestionarios')
  revalidatePath('/paciente')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/dashboard/questionnaires')
  return { success: true }
}

/**
 * Marcar cuestionario como visto/abierto en el portal (Estado: IN_PROGRESS / pendiente de hacer)
 */
export async function markQuestionnaireViewedAction(questionnaireId: string) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) return
  if (!patientId) return

  const q = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patientId },
  })

  if (q && q.status === 'SENT') {
    const updated = await prisma.patientQuestionnaire.updateMany({
      where: { id: questionnaireId, patientId, status: 'SENT' },
      data: {
        status: 'IN_PROGRESS',
        openedAt: new Date(),
      },
    })
    if (updated.count === 1) {
      await prisma.patient.update({
        where: { id: patientId },
        data: { questionnaireDeliveryStatus: 'IN_PROGRESS' },
      })
    }
  }
}

/**
 * Autoguardado en borrador del cuestionario dentro del portal (Sección 5.4)
 * "Autoguardado y adjuntar analíticas o fotos dentro del formulario."
 */
export async function saveQuestionnaireDraftAction(
  questionnaireId: string,
  draftData: Record<string, any>
) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) return { success: true }
  if (!patientId) throw new Error('Paciente no identificado')

  let serialized: string
  try {
    serialized = JSON.stringify(sanitizeQuestionnaireAnswers(draftData))
  } catch {
    throw new Error('El borrador no se pudo serializar.')
  }
  if (serialized.length > 150_000) throw new Error('El borrador supera el tamaño máximo permitido.')

  const q = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patientId },
  })

  if (!q) throw new Error('Cuestionario no encontrado')
  if (q.status === 'COMPLETED' && !q.isReopened) {
    throw new Error('El cuestionario ya está completado y no puede editarse sin reapertura de Eva.')
  }

  const updated = await prisma.patientQuestionnaire.updateMany({
    where: {
      id: questionnaireId,
      patientId,
      OR: [{ status: { not: 'COMPLETED' } }, { isReopened: true }],
    },
    data: {
      draftAnswersJson: serialized,
      status: 'IN_PROGRESS',
      openedAt: q.openedAt || new Date(),
    },
  })
  if (updated.count !== 1) {
    throw new Error('El cuestionario ya está completado y no puede editarse sin reapertura de Eva.')
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: { questionnaireDeliveryStatus: 'IN_PROGRESS' },
  })

  return { success: true, savedAt: new Date().toISOString() }
}

/**
 * Autoguardado del cuestionario de alta. Crea el registro si aún no existe y
 * guarda el borrador exclusivamente en el servidor, nunca en localStorage.
 */
export async function savePortalAnamnesisDraftAction(draftData: Record<string, unknown>) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) return { success: true, savedAt: new Date().toISOString() }
  if (!patientId) throw new Error('Paciente no identificado')

  let serialized: string
  try {
    serialized = JSON.stringify(sanitizeQuestionnaireAnswers(draftData))
  } catch {
    throw new Error('El borrador no se pudo serializar.')
  }
  if (serialized.length > 150_000) throw new Error('El borrador supera el tamaño máximo permitido.')

  let questionnaire = await prisma.patientQuestionnaire.findFirst({
    where: { patientId, type: 'ALTA' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, isReopened: true, openedAt: true },
  })

  if (!questionnaire) {
    questionnaire = await prisma.patientQuestionnaire.create({
      data: {
        patientId,
        type: 'ALTA',
        title: 'Cuestionario de Alta Pre-Consulta',
        status: 'IN_PROGRESS',
        sentAt: new Date(),
      },
      select: { id: true, status: true, isReopened: true, openedAt: true },
    })
  }

  if (questionnaire.status === 'COMPLETED' && !questionnaire.isReopened) {
    throw new Error('El cuestionario ya está completado y no puede editarse sin reapertura de Eva.')
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.patientQuestionnaire.updateMany({
      where: {
        id: questionnaire.id,
        patientId,
        OR: [{ status: { not: 'COMPLETED' } }, { isReopened: true }],
      },
      data: {
        draftAnswersJson: serialized,
        status: 'IN_PROGRESS',
        openedAt: questionnaire.openedAt || new Date(),
      },
    })
    if (updated.count !== 1) {
      throw new Error('El cuestionario ya está completado y no puede editarse sin reapertura de Eva.')
    }
    await tx.patient.update({
      where: { id: patientId },
      data: { questionnaireDeliveryStatus: 'IN_PROGRESS' },
    })
  })

  return { success: true, savedAt: new Date().toISOString() }
}

const QUESTIONNAIRE_ATTACHMENT_CATEGORIES: Record<string, string> = {
  ANALYSIS_PDF: 'ANALYSIS',
  MEDICAL_REPORT: 'MEDICAL_REPORT',
  BODY_PHOTO: 'BODY_COMP',
  OTHER: 'OTHER',
}

const QUESTIONNAIRE_ATTACHMENT_MARKER = 'Adjunto privado del cuestionario de anamnesis'

/**
 * Subida de analíticas o fotos desde el portal. El archivo va directamente al
 * almacenamiento privado y queda ligado al expediente del paciente.
 */
export async function uploadQuestionnaireAttachmentAction(formData: FormData) {
  const { user, patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal).')
  if (!patientId) throw new Error('Paciente no identificado')

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) throw new Error('Selecciona un archivo para adjuntar.')
  const typeRaw = String(formData.get('type') || 'OTHER')
  const category = QUESTIONNAIRE_ATTACHMENT_CATEGORIES[typeRaw] || 'OTHER'
  const title = String(formData.get('title') || '').trim().slice(0, 200)

  const stored = await savePrivateFile({ patientId, category: 'documents', file })
  let document
  try {
    document = await prisma.$transaction(async (tx) => {
      const created = await tx.patientDocument.create({
        data: {
          patientId,
          title: title || stored.fileName,
          category,
          fileUrl: stored.storageKey,
          fileName: stored.fileName,
          fileSizeKb: stored.fileSizeKb,
          mimeType: stored.mimeType,
          notes: QUESTIONNAIRE_ATTACHMENT_MARKER,
          isSharedWithPatient: true,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id,
          patientId,
          action: 'PATIENT_QUESTIONNAIRE_ATTACHMENT_UPLOADED',
          entityType: 'PatientDocument',
          entityId: created.id,
          details: `Adjunto del cuestionario "${created.title}" guardado en almacenamiento privado (${stored.mimeType}, ${stored.fileSizeKb} KB).`,
        },
      })
      return created
    })
  } catch (error) {
    // Si falla la persistencia de metadatos, no dejamos el binario huérfano.
    await deletePrivateFileStrict(stored.storageKey).catch((cleanupError) => {
      console.error('No se pudo limpiar el adjunto huérfano:', cleanupError)
    })
    throw error
  }

  revalidatePath('/paciente/cuestionarios/alta')
  revalidatePath('/paciente/documentos')
  return {
    id: document.id,
    name: document.title,
    url: document.fileUrl,
    type: typeRaw,
    mimeType: document.mimeType,
    fileSizeKb: document.fileSizeKb,
  }
}

export async function deleteQuestionnaireAttachmentAction(documentId: string) {
  const { user, patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal).')
  if (!patientId) throw new Error('Paciente no identificado')

  const document = await prisma.patientDocument.findFirst({
    where: {
      id: documentId,
      patientId,
      notes: QUESTIONNAIRE_ATTACHMENT_MARKER,
    },
    select: { id: true, title: true, fileUrl: true },
  })
  if (!document) throw new Error('Adjunto no encontrado.')

  // Se borra primero el binario de forma estricta. Si el storage falla, el
  // registro sigue existiendo y el paciente puede reintentar sin dejar huérfanos.
  await deletePrivateFileStrict(document.fileUrl)
  await prisma.$transaction([
    prisma.patientDocument.delete({ where: { id: document.id } }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        patientId,
        action: 'PATIENT_QUESTIONNAIRE_ATTACHMENT_DELETED',
        entityType: 'PatientDocument',
        entityId: document.id,
        details: `Adjunto del cuestionario "${document.title}" eliminado por el paciente.`,
      },
    }),
  ])

  revalidatePath('/paciente/cuestionarios/alta')
  revalidatePath('/paciente/documentos')
  return { success: true }
}

/**
 * Envío final de cuestionario completado desde el portal (Sección 5.4)
 */
export async function submitPatientQuestionnaireAction(
  questionnaireId: string,
  answers: Record<string, any>,
  attachments: { name: string; url: string; type: string; id?: string }[] = []
) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal).')
  if (!patientId) throw new Error('Paciente no identificado')

  answers = sanitizeQuestionnaireAnswers(answers)
  const answersJson = JSON.stringify(answers)
  if (answersJson.length > 250_000) throw new Error('Las respuestas superan el tamaño máximo permitido.')

  // Los adjuntos se resuelven contra documentos privados del propio paciente.
  // Nunca se confía en la URL enviada por el navegador.
  const attachmentIds = Array.isArray(attachments)
    ? attachments
        .map((attachment) => (typeof attachment === 'string' ? attachment : attachment?.id))
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .slice(0, 20)
    : []
  const attachmentDocuments = attachmentIds.length
    ? await prisma.patientDocument.findMany({
        where: {
          id: { in: attachmentIds },
          patientId,
          notes: QUESTIONNAIRE_ATTACHMENT_MARKER,
        },
        select: { id: true, title: true, fileUrl: true, category: true },
      })
    : []
  const safeAttachments = attachmentDocuments.map((document) => ({
    id: document.id,
    name: document.title,
    url: document.fileUrl,
    type: document.category,
  }))

  const q = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patientId },
    select: { status: true, isReopened: true, type: true },
  })

  if (!q) throw new Error('Cuestionario no encontrado')
  if (q.status === 'COMPLETED' && !q.isReopened) {
    throw new Error('Este cuestionario ya fue enviado. Solicita a Eva que lo reabra si necesitas modificarlo.')
  }
  const isIntakeQuestionnaire = q.type === 'ALTA'

  // 1. Analizar banderas rojas clínicas
  const redFlags = analyzeRedFlags(answers)

  // 2. Contar campos respondidos para revisión
  const answeredFieldKeys = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== ''
  )
  const pendingFieldsCount = answeredFieldKeys.length

  const completedAt = new Date()

  // 3. Reclamar el envío de forma atómica y guardar todos los registros juntos.
  // El `updateMany` condicional evita duplicados si el paciente pulsa dos veces
  // o si dos peticiones llegan a la vez.
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.patientQuestionnaire.updateMany({
      where: {
        id: questionnaireId,
        patientId,
        OR: [{ status: { not: 'COMPLETED' } }, { isReopened: true }],
      },
      data: {
        status: 'COMPLETED',
        completedAt,
        answersJson,
        attachmentsJson: safeAttachments.length > 0 ? JSON.stringify(safeAttachments) : null,
        redFlagsJson: JSON.stringify(redFlags),
        pendingFieldsCount,
        reviewedFieldsCount: 0,
        isReopened: false,
      },
    })
    if (claimed.count !== 1) {
      throw new Error('Este cuestionario ya fue enviado. Solicita a Eva que lo reabra si necesitas modificarlo.')
    }

    // 4. Actualizar estado y contador en Patient (sin modificar los campos
    // clínicos todavía: Eva revisa primero). El incremento es atómico y el
    // filtro impide aceptar el envío si el acceso se ha suspendido entre la
    // autenticación y esta transacción.
    const patientUpdated = await tx.patient.updateMany({
      where: {
        id: patientId,
        isActive: true,
        isHardDeleted: false,
        portalAccessEnabled: true,
        consentRevokedAt: null,
      },
      data: {
        questionnaireDeliveryStatus: 'COMPLETED',
        ...(isIntakeQuestionnaire
          ? {
              anamnesisStatus: 'COMPLETED',
              anamnesisCompletedAt: completedAt,
            }
          : {}),
        pendingReviewFieldsCount: { increment: pendingFieldsCount },
      },
    })
    if (patientUpdated.count !== 1) {
      throw new Error('El acceso al portal ya no está disponible. Contacta con tu nutricionista.')
    }

    // 5. El historial de anamnesis solo se crea con el cuestionario de alta.
    // Los seguimientos y encuestas no deben sobrescribir el estado clínico de alta.
    if (isIntakeQuestionnaire) {
      await tx.anamnesisSubmission.create({
        data: {
          patientId,
          declaredName: answers.firstName && answers.lastName ? `${answers.firstName} ${answers.lastName}` : null,
          declaredPhone: answers.phone || null,
          declaredEmail: answers.email || null,
          declaredBirthDate: answers.birthDate ? new Date(answers.birthDate) : null,
          declaredGender: answers.sex || null,

          foodPreferences: answers.foodPreferences || null,
          foodAversions: answers.foodAversions || null,
          mealsPerDay: answers.mealsPerDay ? Number(answers.mealsPerDay) : null,
          mealScheduleNotes: answers.mealSchedule || null,
          waterIntakeLiters: answers.waterIntakeLiters ? Number(answers.waterIntakeLiters) : null,
          otherBeverages: answers.otherBeverages || null,
          weekendHabits: answers.weekendHabits || null,

          digestiveIssues: answers.digestiveIssues || null,
          digestiveSymptoms: answers.digestiveSymptoms || null,
          medicalHistory: answers.medicalHistory || null,
          currentMedications: answers.currentMedications || null,
          isGLP1Treatment: answers.isGLP1Treatment === true,
          intolerancesOrAllergies: answers.allergies || answers.intolerances || null,

          exerciseRoutine: answers.exerciseType || null,
          sleepAndStress: answers.sleepHours ? `${answers.sleepHours}h de sueño. Estrés: ${answers.stressLevel || 'no indicado'}` : null,
          supplementsNotes: answers.supplements || null,
          shortTermGoal: answers.shortTermGoal || answers.objective || null,
        },
      })
    }
  })

  revalidatePath('/paciente/cuestionarios')
  revalidatePath('/paciente')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/dashboard/questionnaires')

  return { success: true, pendingFieldsCount, redFlagsCount: redFlags.length }
}

/**
 * Compatible legacy submit para anamnesis rápida
 */
export async function submitPortalAnamnesisAction(data: any) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal).')
  if (!patientId) throw new Error('Paciente no identificado')

  let q = await prisma.patientQuestionnaire.findFirst({
    where: { patientId, type: 'ALTA' },
    orderBy: { createdAt: 'desc' },
  })

  if (!q) {
    q = await prisma.patientQuestionnaire.create({
      data: {
        patientId,
        type: 'ALTA',
        title: 'Cuestionario de Alta Pre-Consulta',
        status: 'IN_PROGRESS',
        sentAt: new Date(),
      },
    })
  }

  return submitPatientQuestionnaireAction(q.id, data)
}
