'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hashAnamnesisToken } from '@/lib/anamnesis-token'
import { headers } from 'next/headers'
import { getForwardedClientAddress, LEGAL_POLICY_VERSION } from '@/lib/legal'
import { isMinorAtDate } from '@/lib/patient-age'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'

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
  privacyNoticeAccepted?: boolean
  healthDataConsentAccepted?: boolean
}

export async function submitAnamnesis(data: AnamnesisPayload) {
  if (!data || typeof data !== 'object') {
    throw new Error('Los datos del cuestionario no son válidos.')
  }
  const token = typeof data.token === 'string' ? data.token : ''
  if (!token || token.length > 200) {
    throw new Error('Acceso no autorizado: Solo puedes enviar el cuestionario a través del enlace personal facilitado por tu nutricionista.')
  }

  // Los argumentos de una Server Action no son de fianza: el consentimiento
  // legal solo se registra con booleanos reales, no con cadenas truthy.
  if (data.privacyNoticeAccepted !== true || data.healthDataConsentAccepted !== true) {
    throw new Error('Debes leer la información de privacidad y confirmar por separado el tratamiento de datos de salud antes de enviar el cuestionario.')
  }

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > 8_000) {
      throw new Error(`El campo ${key} supera la longitud máxima permitida.`)
    }
  }
  if (data.name && String(data.name).trim().length < 2) {
    throw new Error('Indica tu nombre completo.')
  }
  const declaredBirthDate = data.birthDate ? new Date(data.birthDate) : null
  if (declaredBirthDate && Number.isNaN(declaredBirthDate.getTime())) {
    throw new Error('La fecha de nacimiento no es válida.')
  }
  const mealsPerDay = Number(data.mealsPerDay)
  const waterIntakeLiters = Number(data.waterIntakeLiters)

  const tokenHash = hashAnamnesisToken(token)
  const headerList = await headers()
  const submissionIpAddress = getForwardedClientAddress(
    headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')
  )

  const [ipLimit, tokenLimit] = await Promise.all([
    consumeRateLimit({
      key: rateLimitKey('public-anamnesis-ip', submissionIpAddress),
      limit: 15,
      windowMs: 60 * 60 * 1000,
      failClosed: true,
    }),
    consumeRateLimit({
      key: rateLimitKey('public-anamnesis-token', tokenHash),
      limit: 5,
      windowMs: 60 * 60 * 1000,
      failClosed: true,
    }),
  ])
  if (!ipLimit.allowed || !tokenLimit.allowed) {
    throw new Error('Demasiados intentos de envío. Espera unos minutos antes de volver a intentarlo.')
  }

  const existing = await prisma.patient.findFirst({
    where: {
      anamnesisAccessTokenHash: tokenHash,
      anamnesisAccessTokenExpiresAt: { gt: new Date() },
      isActive: true,
      portalAccessEnabled: true,
      isHardDeleted: false,
      consentRevokedAt: null,
    },
    include: { anamnesisSubmissions: true },
  })

  if (!existing) {
    throw new Error('No se ha encontrado el expediente del paciente asociado a este enlace.')
  }

  if (
    isMinorAtDate(existing.birthDate) &&
    (!existing.guardianName || !existing.guardianRelationship || !existing.guardianConsentAt)
  ) {
    throw new Error('Este enlace no puede recibir datos de una persona menor hasta que la consulta registre la intervención del representante legal.')
  }

  const submittedAt = new Date()
  const submissionUserAgent = (headerList.get('user-agent') || 'no disponible').slice(0, 500)

  // Comprobar si ya fue rellenado previamente (bloqueo estricto para evitar re-ediciones o duplicados)
  if (existing.anamnesisStatus === 'COMPLETED' || existing.anamnesisSubmissions.length > 0) {
    throw new Error('Este cuestionario ya ha sido completado y recibido por tu nutricionista. Para garantizar la seguridad del historial clínico, no se permite volver a editarlo ni enviar otro.')
  }

  // 1. Reclamar el envío y guardar la respuesta en una sola transacción. El
  // `updateMany` condicional evita duplicados si el paciente envía dos veces
  // a la vez o pulsa repetidamente el botón.
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.patient.updateMany({
      where: {
        id: existing.id,
        anamnesisAccessTokenHash: tokenHash,
        anamnesisAccessTokenExpiresAt: { gt: submittedAt },
        anamnesisStatus: { not: 'COMPLETED' },
        anamnesisSubmissions: { none: {} },
        isActive: true,
        portalAccessEnabled: true,
        isHardDeleted: false,
        consentRevokedAt: null,
      },
      data: {
        anamnesisStatus: 'COMPLETED',
        anamnesisCompletedAt: submittedAt,
        anamnesisAccessTokenHash: null,
        anamnesisAccessTokenExpiresAt: null,
      },
    })
    if (claimed.count !== 1) {
      throw new Error('Este cuestionario ya ha sido completado y recibido por tu nutricionista.')
    }

    await tx.anamnesisSubmission.create({
      data: {
        patientId: existing.id,
        declaredName: data.name || `${existing.firstName} ${existing.lastName}`,
        declaredPhone: data.phone || existing.phone,
        declaredEmail: data.email || existing.email,
        declaredBirthDate: declaredBirthDate || existing.birthDate,
        declaredGender: data.gender || existing.sex,

        // Hábitos y Nutrición
        foodPreferences: data.foodPreferences || null,
        foodAversions: data.foodAversions || null,
        mealsPerDay: Number.isFinite(mealsPerDay) && mealsPerDay > 0 && mealsPerDay <= 20 ? mealsPerDay : null,
        mealScheduleNotes: data.mealScheduleNotes || null,
        weekendHabits: data.weekendHabits || null,
        waterIntakeLiters:
          Number.isFinite(waterIntakeLiters) && waterIntakeLiters >= 0 && waterIntakeLiters <= 20
            ? waterIntakeLiters
            : null,
        otherBeverages: data.otherBeverages || null,
        recall24h: data.recall24h || null,

        // Salud y Síntomas
        digestiveIssues: data.digestiveIssues || null,
        digestiveSymptoms: data.digestiveSymptoms || null,
        medicalHistory: data.medicalHistory || null,
        currentMedications: data.currentMedications || null,
        isGLP1Treatment: data.isGLP1Treatment === true,
        intolerancesOrAllergies: data.intolerancesOrAllergies || null,

        // Estilo de vida y bienestar
        exerciseRoutine: data.exerciseRoutine || null,
        sleepAndStress: data.sleepAndStress || null,
        emotionalEatingNotes: data.emotionalEatingNotes || null,
        previousDietsExp: data.previousDietsExp || null,
        supplementsNotes: data.supplementsNotes || null,
        shortTermGoal: data.shortTermGoal || null,
        privacyNoticeVersion: LEGAL_POLICY_VERSION,
        privacyNoticeAcceptedAt: submittedAt,
        healthDataConsentVersion: LEGAL_POLICY_VERSION,
        healthDataConsentAt: submittedAt,
        submissionIpAddress,
        submissionUserAgent,
      },
    })
  })

  revalidatePath(`/dashboard/patients/${existing.id}`)
  revalidatePath('/dashboard/patients')
  return { success: true }
}
