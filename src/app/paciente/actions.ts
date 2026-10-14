'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { destroySession, requirePatient } from '@/lib/auth'

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}

export const logout = logoutAction

/**
 * Aceptación obligatoria de políticas RGPD, Cookies y Condiciones de uso al primer login
 */
export async function acceptPatientPoliciesAction() {
  const { patientId } = await requirePatient()
  if (!patientId) {
    throw new Error('Paciente no identificado')
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      consentAcceptedAt: new Date(),
      consentPolicyVersion: '1.0',
    },
  })

  // Asegurar que exista el registro formal en PatientConsent
  const existingConsent = await prisma.patientConsent.findFirst({
    where: { patientId, type: 'RGPD' },
  })

  if (!existingConsent) {
    await prisma.patientConsent.create({
      data: {
        patientId,
        type: 'RGPD',
        title: 'Tratamiento de Datos Personales y de Salud (Art. 9 RGPD)',
        version: '1.0',
        accepted: true,
        acceptedAt: new Date(),
        signatureData: 'Aceptado digitalmente en primer inicio de sesión en el portal',
      },
    })
  } else if (!existingConsent.accepted) {
    await prisma.patientConsent.update({
      where: { id: existingConsent.id },
      data: {
        accepted: true,
        acceptedAt: new Date(),
        signatureData: 'Aceptado digitalmente en primer inicio de sesión en el portal',
      },
    })
  }

  revalidatePath('/paciente')
  redirect('/paciente')
}

/**
 * Solicitud de Cita desde el portal del paciente
 * "El paciente solo la solicita sin elegir día ni hora; Eva fija la fecha y la hora" (PDF pág 3 y 15)
 */
export async function requestAppointmentAction(formData: FormData) {
  const { patientId } = await requirePatient()
  if (!patientId) throw new Error('Paciente no identificado')

  const modality = (formData.get('modality') as string) || 'ONLINE'
  const preferredTime = (formData.get('preferredTime') as string) || ''
  const notes = (formData.get('notes') as string) || ''

  const fullNotes = `[SOLICITUD PACIENTE] Preferencia: ${preferredTime}. Motivo: ${notes}`.trim()

  // Se crea con fecha tentativa (7 días en el futuro a las 10h) y estado REQUESTED para que Eva asigne la hora definitiva
  const tentativeDate = new Date()
  tentativeDate.setDate(tentativeDate.getDate() + 7)
  tentativeDate.setHours(10, 0, 0, 0)

  await prisma.appointment.create({
    data: {
      patientId,
      date: tentativeDate,
      durationMin: 45,
      modality: modality as 'ONLINE' | 'PRESENCIAL',
      status: 'REQUESTED',
      notes: fullNotes,
      location: modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal',
    },
  })

  revalidatePath('/paciente/citas')
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

/**
 * Solicitud de cambio o cancelación de una cita existente (PDF pág 15-16)
 */
export async function requestAppointmentChangeAction(formData: FormData) {
  const { patientId } = await requirePatient()
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

  revalidatePath('/paciente/citas')
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

/**
 * Firma de consentimiento informado desde el portal (PDF pág 13)
 */
export async function signConsentAction(consentId: string, signatureData: string) {
  const { patientId } = await requirePatient()
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
      accepted: true,
      acceptedAt: new Date(),
      signatureData: signatureData || 'Firma digital confirmada en pantalla por el paciente',
      ipAddress,
      userAgent,
    },
  })

  revalidatePath('/paciente/cuestionarios')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

/**
 * Envío de cuestionario de alta desde el portal del paciente (7 pasos espejo de la ficha)
 */
export async function submitPortalAnamnesisAction(data: any) {
  const { patientId } = await requirePatient()
  if (!patientId) throw new Error('Paciente no identificado')

  const existing = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { anamnesisSubmissions: true },
  })

  if (!existing) {
    throw new Error('Expediente no encontrado')
  }

  // 1. Guardar la respuesta detallada en AnamnesisSubmission
  await prisma.anamnesisSubmission.create({
    data: {
      patientId: existing.id,
      declaredName: data.name || `${existing.firstName} ${existing.lastName}`,
      declaredPhone: data.phone || existing.phone,
      declaredEmail: data.email || existing.email,
      declaredBirthDate: data.birthDate ? new Date(data.birthDate) : existing.birthDate,
      declaredGender: data.gender || existing.sex,

      // Hábitos y Nutrición
      foodPreferences: data.foodPreferences || null,
      foodAversions: data.foodAversions || null,
      mealsPerDay: data.mealsPerDay ? Number(data.mealsPerDay) : null,
      mealScheduleNotes: data.mealScheduleNotes || null,
      weekendHabits: data.weekendHabits || null,
      waterIntakeLiters: data.waterIntakeLiters ? Number(data.waterIntakeLiters) : null,
      otherBeverages: data.otherBeverages || null,
      recall24h: data.recall24h || null,

      // Salud y Síntomas
      digestiveIssues: data.digestiveIssues || null,
      digestiveSymptoms: data.digestiveSymptoms || null,
      medicalHistory: data.medicalHistory || null,
      currentMedications: data.currentMedications || null,
      isGLP1Treatment: Boolean(data.isGLP1Treatment),
      intolerancesOrAllergies: data.intolerancesOrAllergies || null,

      // Estilo de vida y bienestar
      exerciseRoutine: data.exerciseRoutine || null,
      sleepAndStress: data.sleepAndStress || null,
      emotionalEatingNotes: data.emotionalEatingNotes || null,
      previousDietsExp: data.previousDietsExp || null,
      supplementsNotes: data.supplementsNotes || null,
      shortTermGoal: data.shortTermGoal || null,
    },
  })

  // 2. Marcar el estado en el paciente como COMPLETADO
  await prisma.patient.update({
    where: { id: existing.id },
    data: {
      anamnesisStatus: 'COMPLETED',
      anamnesisCompletedAt: new Date(),
    },
  })

  revalidatePath('/paciente/cuestionarios')
  revalidatePath('/paciente')
  revalidatePath(`/dashboard/patients/${existing.id}`)
  return { success: true }
}

