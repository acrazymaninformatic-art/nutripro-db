'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { destroySession, requirePatient } from '@/lib/auth'
import { getForwardedClientAddress, LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

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
  const { user, patientId, isAdminPreview } = await requirePatient()
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
    await tx.patient.update({
      where: { id: patientId },
      data: {
        consentAcceptedAt: acceptedAt,
        consentPolicyVersion: LEGAL_POLICY_VERSION,
        consentDeliveryStatus: 'COMPLETED',
      },
    })

    for (const requiredConsent of REQUIRED_PORTAL_CONSENTS) {
      const existingConsent = await tx.patientConsent.findFirst({
        where: { patientId, type: requiredConsent.type, version: LEGAL_POLICY_VERSION },
        orderBy: { createdAt: 'desc' },
      })

      if (existingConsent) {
        await tx.patientConsent.update({
          where: { id: existingConsent.id },
          data: {
            status: 'COMPLETED',
            accepted: true,
            acceptedAt,
            signatureData: 'Aceptado digitalmente en el portal tras lectura separada del documento.',
            ipAddress,
            userAgent,
            revokedAt: null,
            revocationReason: null,
          },
        })
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

  const appointmentType = (formData.get('appointmentType') as string) || 'REVISION'
  const modality = (formData.get('modality') as string) || 'ONLINE'
  const preferredTime = (formData.get('preferredTime') as string) || ''
  const preferredDays = (formData.get('preferredDays') as string) || ''
  const notes = (formData.get('notes') as string) || ''

  const fullNotes = `[SOLICITUD PACIENTE] Tipo: ${appointmentType}. Preferencia: ${preferredTime} ${preferredDays ? `(Días: ${preferredDays})` : ''}. Motivo: ${notes}`.trim()

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

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      date: tentativeDate,
      durationMin: appointmentType === 'PRIMERA' ? 60 : appointmentType === 'GRUPAL' ? 90 : 45,
      modality: modality as 'ONLINE' | 'PRESENCIAL',
      status: 'REQUESTED',
      appointmentType,
      typeColor,
      notes: fullNotes,
      location: modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal',
    },
  })

  // Registrar solicitud en modelo AppointmentRequest (5.5)
  await prisma.appointmentRequest.create({
    data: {
      patientId,
      appointmentId: appointment.id,
      type: 'NEW',
      status: 'PENDING',
      appointmentType,
      modality,
      preferredTimeOfDay: preferredTime.includes('mañana') ? 'MORNING' : preferredTime.includes('tarde') ? 'AFTERNOON' : 'ANY',
      preferredDays: preferredDays || null,
      patientNotes: notes,
    },
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

  const appointmentId = formData.get('appointmentId') as string
  const actionType = formData.get('actionType') as string // 'CANCEL' | 'CHANGE'
  const reason = (formData.get('reason') as string) || ''

  const app = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
  })

  if (!app) throw new Error('Cita no encontrada')

  const prefix = actionType === 'CANCEL' ? '[SOLICITUD CANCELACIÓN]' : '[SOLICITUD CAMBIO FECHA]'
  const updatedNotes = `${app.notes || ''}\n${prefix}: ${reason}`.trim()

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      notes: updatedNotes,
      status: actionType === 'CANCEL' ? 'CANCEL_REQUESTED' : 'RESCHEDULE_REQUESTED',
    },
  })

  await prisma.appointmentRequest.create({
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

  revalidatePath('/paciente/citas')
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

/**
 * Marcar consentimiento como visto cuando el paciente entra a revisarlo (Estado: IN_PROGRESS / pendiente)
 */
export async function markConsentViewedAction(consentId: string) {
  const { patientId } = await requirePatient()
  if (!patientId) return

  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId },
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
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal). La firma de consentimientos está desactivada en este modo.')
  if (!patientId) throw new Error('Paciente no identificado')

  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId },
  })

  if (!consent) throw new Error('Consentimiento no encontrado')

  const headerList = await headers()
  const ipAddress = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || 'portal'
  const userAgent = headerList.get('user-agent') || 'browser'

  await prisma.patientConsent.update({
    where: { id: consentId },
    data: {
      status: 'COMPLETED',
      accepted: true,
      acceptedAt: new Date(),
      signatureData: signatureData || 'Firma digital confirmada en pantalla por el paciente',
      ipAddress,
      userAgent,
    },
  })

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      consentDeliveryStatus: 'COMPLETED',
      consentAcceptedAt: new Date(),
    },
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
  const { patientId } = await requirePatient()
  if (!patientId) return

  const q = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patientId },
  })

  if (q && q.status === 'SENT') {
    await prisma.patientQuestionnaire.update({
      where: { id: questionnaireId },
      data: {
        status: 'IN_PROGRESS',
        openedAt: new Date(),
      },
    })
    await prisma.patient.update({
      where: { id: patientId },
      data: { questionnaireDeliveryStatus: 'IN_PROGRESS' },
    })
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

  const q = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patientId },
  })

  if (!q) throw new Error('Cuestionario no encontrado')
  if (q.status === 'COMPLETED' && !q.isReopened) {
    throw new Error('El cuestionario ya está completado y no puede editarse sin reapertura de Eva.')
  }

  await prisma.patientQuestionnaire.update({
    where: { id: questionnaireId },
    data: {
      draftAnswersJson: JSON.stringify(draftData),
      status: 'IN_PROGRESS',
      openedAt: q.openedAt || new Date(),
    },
  })

  await prisma.patient.update({
    where: { id: patientId },
    data: { questionnaireDeliveryStatus: 'IN_PROGRESS' },
  })

  return { success: true, savedAt: new Date().toISOString() }
}

/**
 * Envío final de cuestionario completado desde el portal (Sección 5.4)
 */
export async function submitPatientQuestionnaireAction(
  questionnaireId: string,
  answers: Record<string, any>,
  attachments: { name: string; url: string; type: string }[] = []
) {
  const { patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal).')
  if (!patientId) throw new Error('Paciente no identificado')

  const { analyzeRedFlags } = await import('@/lib/clinical/intake-catalog')

  const q = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patientId },
    include: { patient: true },
  })

  if (!q) throw new Error('Cuestionario no encontrado')
  if (q.status === 'COMPLETED' && !q.isReopened) {
    throw new Error('Este cuestionario ya fue enviado. Solicita a Eva que lo reabra si necesitas modificarlo.')
  }

  // 1. Analizar banderas rojas clínicas
  const redFlags = analyzeRedFlags(answers)

  // 2. Contar campos respondidos para revisión
  const answeredFieldKeys = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== ''
  )
  const pendingFieldsCount = answeredFieldKeys.length

  // 3. Guardar en PatientQuestionnaire con estado COMPLETED
  await prisma.patientQuestionnaire.update({
    where: { id: questionnaireId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      answersJson: JSON.stringify(answers),
      attachmentsJson: attachments.length > 0 ? JSON.stringify(attachments) : null,
      redFlagsJson: JSON.stringify(redFlags),
      pendingFieldsCount,
      reviewedFieldsCount: 0,
      isReopened: false,
    },
  })

  // 4. Actualizar estado y contador en Patient (sin modificar los campos clínicos todavía: Eva revisa primero)
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      questionnaireDeliveryStatus: 'COMPLETED',
      anamnesisStatus: 'COMPLETED',
      anamnesisCompletedAt: new Date(),
      pendingReviewFieldsCount: (q.patient.pendingReviewFieldsCount || 0) + pendingFieldsCount,
    },
  })

  // 5. Crear también registro AnamnesisSubmission para historial intacto y compatibilidad
  await prisma.anamnesisSubmission.create({
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
      isGLP1Treatment: Boolean(answers.isGLP1Treatment),
      intolerancesOrAllergies: answers.allergies || answers.intolerances || null,

      exerciseRoutine: answers.exerciseType || null,
      sleepAndStress: answers.sleepHours ? `${answers.sleepHours}h de sueño. Estrés: ${answers.stressLevel || 'no indicado'}` : null,
      supplementsNotes: answers.supplements || null,
      shortTermGoal: answers.shortTermGoal || answers.objective || null,
    },
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
  const { patientId } = await requirePatient()
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
