'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hashAnamnesisToken } from '@/lib/anamnesis-token'

export interface AnamnesisPayload {
  token: string
  name: string
  birthDate?: string
  gender?: string
  phone?: string
  email?: string
  
  // Salud y medicación
  medicalHistory?: string
  currentMedications?: string
  isGLP1Treatment?: boolean
  intolerancesOrAllergies?: string

  // Síntomas digestivos
  digestiveIssues?: string
  digestiveSymptoms?: string

  // Hábitos alimenticios
  foodPreferences?: string
  foodAversions?: string
  mealsPerDay?: number
  mealScheduleNotes?: string
  weekendHabits?: string
  recall24h?: string

  // Hidratación y estilo de vida
  waterIntakeLiters?: number
  otherBeverages?: string
  exerciseRoutine?: string
  sleepAndStress?: string

  // Emocional, suplementación y objetivos
  emotionalEatingNotes?: string
  previousDietsExp?: string
  supplementsNotes?: string
  shortTermGoal?: string
}

export async function submitAnamnesis(data: AnamnesisPayload) {
  if (!data.token || data.token.length > 200) {
    throw new Error('Acceso no autorizado: Solo puedes enviar el cuestionario a través del enlace personal facilitado por tu nutricionista.')
  }

  const tokenHash = hashAnamnesisToken(data.token)
  const existing = await prisma.patient.findFirst({
    where: { anamnesisAccessTokenHash: tokenHash, anamnesisAccessTokenExpiresAt: { gt: new Date() } },
    include: { anamnesisSubmissions: true },
  })

  if (!existing) {
    throw new Error('No se ha encontrado el expediente del paciente asociado a este enlace.')
  }

  // Comprobar si ya fue rellenado previamente (bloqueo estricto para evitar re-ediciones o duplicados)
  if (existing.anamnesisStatus === 'COMPLETED' || existing.anamnesisSubmissions.length > 0) {
    throw new Error('Este cuestionario ya ha sido completado y recibido por tu nutricionista. Para garantizar la seguridad del historial clínico, no se permite volver a editarlo ni enviar otro.')
  }

  // 1. Guardar la respuesta detallada en la entidad dedicada de Anamnesis (NO sobrescribe la ficha técnica del profesional)
  const submission = await prisma.anamnesisSubmission.create({
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

  // 2. Marcar el estado en el paciente como COMPLETADO sin tocar las notas clínicas del nutricionista
  await prisma.patient.update({
    where: { id: existing.id },
    data: {
      anamnesisStatus: 'COMPLETED',
      anamnesisCompletedAt: new Date(),
      anamnesisAccessTokenHash: null,
      anamnesisAccessTokenExpiresAt: null,
      phone: existing.phone || data.phone || undefined,
      email: existing.email || data.email || undefined,
    },
  })

  revalidatePath(`/dashboard/patients/${existing.id}`)
  revalidatePath('/dashboard/patients')
  return { success: true }
}
