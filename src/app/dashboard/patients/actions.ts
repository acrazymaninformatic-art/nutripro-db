'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { calculateBMI, calculateWaistToHeightRatio, calculateCUNBAE, calculateHeathCarterSomatotype } from '@/lib/nutrition/anthropometry'
import { getScreeningDefinition } from '@/lib/clinical/screenings'
import { isMinorAtDate } from '@/lib/patient-age'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'
import { deletePrivateFileStrict, savePrivateFile } from '@/lib/storage/private-storage'
import { ACTIVITY_LEVEL_VALUES, OBJECTIVE_VALUES, SEX_VALUES } from '@/types'

const CLINICAL_STATUS_VALUES = new Set(['NO_CONSTA', 'NINGUNA_CONOCIDA', 'CONFIRMED'])
const GUARDIAN_CONSENT_METHODS = new Set(['PRESENCIAL', 'TELEFONO', 'DOCUMENTO', 'PROFESSIONAL_ATTESTATION'])

function parseClinicalStatus(value: FormDataEntryValue | null): string | undefined {
  return typeof value === 'string' && CLINICAL_STATUS_VALUES.has(value) ? value : undefined
}

function parseOptionalPatientNumber(
  value: FormDataEntryValue | null,
  label: string,
  options: { min: number; max: number; integer?: boolean }
): number | null {
  if (value === null || String(value).trim() === '') return null
  const numeric = Number(String(value).trim().replace(',', '.'))
  if (
    !Number.isFinite(numeric) ||
    numeric < options.min ||
    numeric > options.max ||
    (options.integer && !Number.isInteger(numeric))
  ) {
    throw new Error(`El campo "${label}" no contiene un valor válido.`)
  }
  return numeric
}

function parseAllowedValue<T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowed: T,
  fallback: T[number]
): T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback
}

// Helper to get or fallback to demo nutritionist user
async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: await requireUserId() } })
  if (!user) {
    throw new Error('No se encontró ningún usuario registrado en la base de datos.')
  }
  return user.id
}

export async function getPatients() {
  const userId = await requireUserId()
  return await prisma.patient.findMany({
    where: { userId },
    orderBy: { lastName: 'asc' },
    include: {
      anthropometries: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      appointments: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { id: true, date: true, status: true, modality: true, appointmentType: true },
      },
      mealPlans: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, name: true, targetKcal: true },
      },
    },
  })
}

export async function getPatient(id: string) {
  const userId = await requireUserId()
  return await prisma.patient.findFirst({
    where: { id, userId },
    include: {
      anthropometries: {
        orderBy: { date: 'desc' },
      },
      consultations: {
        orderBy: { date: 'desc' },
      },
      mealPlans: {
        orderBy: { createdAt: 'desc' },
      },
      bloodAnalyses: {
        orderBy: { date: 'desc' },
      },
      appointments: {
        orderBy: { date: 'asc' },
      },
      anamnesisSubmissions: {
        orderBy: { submittedAt: 'desc' },
      },
      dataRequests: {
        orderBy: { createdAt: 'desc' },
      },
      clinicalCheckIns: {
        orderBy: { date: 'desc' },
      },
      consents: {
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      emailLogs: {
        orderBy: { sentAt: 'desc' },
      },
      screenings: {
        orderBy: { date: 'desc' },
      },
      photos: {
        orderBy: { date: 'desc' },
      },
      patientQuestionnaires: {
        orderBy: { createdAt: 'desc' },
      },
      appointmentRequests: {
        orderBy: { createdAt: 'desc' },
      },
      clinicalProtocols: {
        orderBy: { createdAt: 'desc' },
      },
      calculatorResults: {
        orderBy: { createdAt: 'desc' },
      },
      portalUser: {
        select: {
          id: true,
          email: true,
          passwordChangeRequired: true,
          role: true,
        },
      },
      user: { select: { id: true, name: true, email: true, licenseNumber: true, clinicName: true, phone: true, address: true } },
    },
  })
}

export async function createPatient(formData: FormData) {
  await requireUserId()
  const userId = await getDefaultUserId()
  const hasPrivacyNotice = formData.get('privacyNoticeAccepted') === 'true'
  const hasPortalTerms = formData.get('portalTermsAccepted') === 'true'
  const hasHealthDataConsent = formData.get('healthDataConsentAccepted') === 'true'
  if (!hasPrivacyNotice || !hasPortalTerms || !hasHealthDataConsent) {
    throw new Error('Es obligatorio registrar por separado la información de privacidad, las condiciones del portal y la base para tratar datos de salud.')
  }

  // Step 1: Datos Personales
  const firstName = String(formData.get('firstName') || '').trim()
  const lastName = String(formData.get('lastName') || '').trim()
  if (firstName.length < 1 || firstName.length > 100 || lastName.length < 1 || lastName.length > 100) {
    throw new Error('El nombre y los apellidos son obligatorios y no pueden superar 100 caracteres.')
  }
  const email = String(formData.get('email') || '').trim() || null
  const phone = String(formData.get('phone') || '').trim() || null
  const birthDateStr = formData.get('birthDate') as string
  const birthDate = new Date(birthDateStr)
  if (Number.isNaN(birthDate.getTime())) throw new Error('La fecha de nacimiento no es válida.')
  if (birthDate.getTime() > Date.now()) throw new Error('La fecha de nacimiento no puede estar en el futuro.')
  const isMinor = isMinorAtDate(birthDate)
  const guardianName = (formData.get('guardianName') as string)?.trim() || null
  const guardianRelationship = (formData.get('guardianRelationship') as string)?.trim() || null
  const guardianEmail = (formData.get('guardianEmail') as string)?.trim() || null
  const guardianPhone = (formData.get('guardianPhone') as string)?.trim() || null
  const guardianConsentAccepted = formData.get('guardianConsentAccepted') === 'true'
  const guardianConsentMethod = (formData.get('guardianConsentMethod') as string)?.trim() || null
  if (isMinor && (!guardianName || !guardianRelationship || !guardianConsentAccepted)) {
    throw new Error('Para un paciente menor de edad debes registrar al representante legal, su relación y la constancia de información/consentimiento.')
  }
  const sex = parseAllowedValue(formData.get('sex'), SEX_VALUES, 'FEMALE')
  const heightCm = parseOptionalPatientNumber(formData.get('heightCm'), 'altura', { min: 30, max: 250 }) ?? 165
  const referralSource = (formData.get('referralSource') as string) || null

  // Step 2: Historial Clínico
  const medicalHistory = (formData.get('medicalHistory') as string) || ''
  const currentMedications = (formData.get('currentMedications') as string) || ''
  const supplements = (formData.get('supplements') as string) || ''
  const surgeries = (formData.get('surgeries') as string) || ''
  const familyHistory = (formData.get('familyHistory') as string) || ''

  // Step 3: Sistema Digestivo y Metabolismo
  const digestiveIssues = (formData.get('digestiveIssues') as string) || ''
  const bowelFrequency = (formData.get('bowelFrequency') as string) || null
  const foodAversions = (formData.get('foodAversions') as string) || ''
  const waterIntakeLiters = parseOptionalPatientNumber(formData.get('waterIntakeLiters'), 'agua', { min: 0, max: 20 })
  const caffeineDaily = parseOptionalPatientNumber(formData.get('caffeineDaily'), 'cafeína', {
    min: 0,
    max: 3_000,
    integer: true,
  })
  const alcoholFrequency = (formData.get('alcoholFrequency') as string) || null
  const smoking = formData.get('smoking') === 'true' || formData.get('smoking') === 'on'

  // Step 4: Estilo de Vida y Hábitos
  const occupation = (formData.get('occupation') as string) || null
  const workSchedule = (formData.get('workSchedule') as string) || null
  const sleepHours = parseOptionalPatientNumber(formData.get('sleepHours'), 'horas de sueño', { min: 0, max: 24 })
  const sleepQuality = (formData.get('sleepQuality') as string) || null
  const stressLevel = (formData.get('stressLevel') as string) || null
  const mealSchedule = (formData.get('mealSchedule') as string) || ''
  const mealsPerDay = parseOptionalPatientNumber(formData.get('mealsPerDay'), 'comidas al día', {
    min: 0,
    max: 20,
    integer: true,
  })
  const eatsOut = (formData.get('eatsOut') as string) || null
  const cooksAtHome = formData.has('cooksAtHome') ? formData.get('cooksAtHome') === 'true' || formData.get('cooksAtHome') === 'on' : true

  // Step 5: Actividad Física y Deporte
  const activityLevel = parseAllowedValue(formData.get('activityLevel'), ACTIVITY_LEVEL_VALUES, 'MODERATE')
  const exerciseType = (formData.get('exerciseType') as string) || ''
  const exerciseFrequency = parseOptionalPatientNumber(formData.get('exerciseFrequency'), 'frecuencia de ejercicio', {
    min: 0,
    max: 21,
    integer: true,
  })
  const exerciseDuration = parseOptionalPatientNumber(formData.get('exerciseDuration'), 'duración del ejercicio', {
    min: 0,
    max: 600,
    integer: true,
  })
  const exerciseTime = (formData.get('exerciseTime') as string) || null
  const sportGoals = (formData.get('sportGoals') as string) || ''
  const trainingExperience = (formData.get('trainingExperience') as string) || null

  // Step 6: Salud Femenina
  const menstrualCycle = (formData.get('menstrualCycle') as string) || null
  const pregnant = formData.get('pregnant') === 'true' || formData.get('pregnant') === 'on'
  const breastfeeding = formData.get('breastfeeding') === 'true' || formData.get('breastfeeding') === 'on'
  const contraceptive = (formData.get('contraceptive') as string) || null
  const hormoneTherapy = formData.get('hormoneTherapy') === 'true' || formData.get('hormoneTherapy') === 'on'

  // Step 7: Objetivos y Primera Valoración
  const objective = parseAllowedValue(formData.get('objective'), OBJECTIVE_VALUES, 'WEIGHT_LOSS')
  const shortTermGoal = (formData.get('shortTermGoal') as string) || null
  const longTermGoal = (formData.get('longTermGoal') as string) || null
  const motivation = (formData.get('motivation') as string) || null
  const previousDiets = (formData.get('previousDiets') as string) || ''
  const dietDuration = (formData.get('dietDuration') as string) || null
  const consultationFrequency = (formData.get('consultationFrequency') as string) || null
  const budgetLevel = (formData.get('budgetLevel') as string) || null
  const allergies = (formData.get('allergies') as string) || ''
  const allergiesStatus = parseClinicalStatus(formData.get('allergiesStatus')) ?? (allergies ? 'CONFIRMED' : 'NO_CONSTA')
  const intolerances = (formData.get('intolerances') as string) || ''
  const intolerancesStatus = parseClinicalStatus(formData.get('intolerancesStatus')) ?? (intolerances ? 'CONFIRMED' : 'NO_CONSTA')
  const dietaryPreferences = (formData.get('dietaryPreferences') as string) || ''
  const additionalNotes = (formData.get('additionalNotes') as string) || null
  const notes = (formData.get('notes') as string) || additionalNotes

  // Initial anthropometry fields (optional in creation)
  const initialWeightKg = parseOptionalPatientNumber(formData.get('weightKg'), 'peso inicial', {
    min: 0.1,
    max: 500,
  })
  const initialBodyFatPct = parseOptionalPatientNumber(formData.get('bodyFatPct'), 'grasa corporal inicial', {
    min: 0,
    max: 100,
  })
  const initialWaistCm = parseOptionalPatientNumber(formData.get('waistCm'), 'cintura inicial', {
    min: 0,
    max: 300,
  })
  const initialHipCm = parseOptionalPatientNumber(formData.get('hipCm'), 'cadera inicial', {
    min: 0,
    max: 300,
  })

  const patient = await prisma.$transaction(async (tx) => {
    const created = await tx.patient.create({
      data: {
        userId,
        consentDeliveryStatus: 'SENT',
        firstName,
        lastName,
        email,
        phone,
        birthDate,
        guardianName: isMinor ? guardianName : null,
        guardianRelationship: isMinor ? guardianRelationship : null,
        guardianEmail: isMinor ? guardianEmail : null,
        guardianPhone: isMinor ? guardianPhone : null,
        guardianConsentAt: isMinor ? new Date() : null,
        guardianConsentPolicyVersion: isMinor ? LEGAL_POLICY_VERSION : null,
        guardianConsentMethod: isMinor ? guardianConsentMethod || 'PROFESSIONAL_ATTESTATION' : null,
        sex,
        heightCm,
        referralSource,
        objective,
        activityLevel,
        notes,
        allergies,
        allergiesStatus,
        intolerances,
        intolerancesStatus,
        dietaryPreferences,
        // Clinical History
        medicalHistory,
        pathologiesStatus: parseClinicalStatus(formData.get('pathologiesStatus')) ?? (medicalHistory ? 'CONFIRMED' : 'NO_CONSTA'),
        currentMedications,
        medicationsStatus: parseClinicalStatus(formData.get('medicationsStatus')) ?? (currentMedications ? 'CONFIRMED' : 'NO_CONSTA'),
        supplements,
        surgeries,
        familyHistory,
        // Digestive & Metabolism
        digestiveIssues,
        bowelFrequency,
        foodAversions,
        waterIntakeLiters,
        caffeineDaily,
        alcoholFrequency,
        smoking,
        // Lifestyle & Habits
        occupation,
        workSchedule,
        sleepHours,
        sleepQuality,
        stressLevel,
        mealSchedule,
        mealsPerDay,
        eatsOut,
        cooksAtHome,
        // Exercise & Sports
        exerciseType,
        exerciseFrequency,
        exerciseDuration,
        exerciseTime,
        sportGoals,
        trainingExperience,
        // Women's Health
        menstrualCycle,
        pregnant,
        breastfeeding,
        contraceptive,
        hormoneTherapy,
        // Goals & Priorities
        shortTermGoal,
        longTermGoal,
        motivation,
        previousDiets,
        dietDuration,
        consultationFrequency,
        budgetLevel,
        additionalNotes,
      },
    })

    // La profesional deja constancia de que ha informado, pero la aceptación
    // debe firmarla la persona interesada (o su representante legal). Nunca se
    // autoaceptan consentimientos en nombre del paciente.
    await tx.patientConsent.createMany({
      data: REQUIRED_PORTAL_CONSENTS.map((consent) => ({
        patientId: created.id,
        type: consent.type,
        title: consent.title,
        version: LEGAL_POLICY_VERSION,
        status: 'SENT',
        sentAt: new Date(),
        accepted: false,
        signatureData: null,
      })),
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId: created.id,
        action: 'PATIENT_CREATED_CONSENTS_PENDING',
        entityType: 'PATIENT',
        entityId: created.id,
        details: `Expediente creado. Información entregada, consentimientos pendientes de firma del paciente. Versión ${LEGAL_POLICY_VERSION}.`,
      },
    })

    // If initial weight was provided, create the first anthropometry entry.
    if (initialWeightKg !== null) {
      await tx.anthropometry.create({
        data: {
          patientId: created.id,
          date: new Date(),
          weightKg: initialWeightKg,
          bodyFatPct: initialBodyFatPct,
          waistCm: initialWaistCm,
          hipCm: initialHipCm,
        },
      })
    }

    return created
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  return patient
}

export async function updatePatient(id: string, formData: FormData) {
  const userId = await requireUserId()
  const currentPatient = await prisma.patient.findFirst({
    where: { id, userId },
    select: {
      id: true,
      birthDate: true,
      guardianName: true,
      guardianRelationship: true,
      guardianEmail: true,
      guardianPhone: true,
      guardianConsentAt: true,
      guardianConsentPolicyVersion: true,
      guardianConsentMethod: true,
    },
  })
  if (!currentPatient) throw new Error('Paciente no encontrado.')
  const firstName = String(formData.get('firstName') || '').trim()
  const lastName = String(formData.get('lastName') || '').trim()
  if (firstName.length < 1 || firstName.length > 100 || lastName.length < 1 || lastName.length > 100) {
    throw new Error('El nombre y los apellidos son obligatorios y no pueden superar 100 caracteres.')
  }
  const email = String(formData.get('email') || '').trim() || null
  const phone = String(formData.get('phone') || '').trim() || null
  const birthDateStr = formData.get('birthDate') as string
  const nextBirthDate = birthDateStr ? new Date(birthDateStr) : undefined
  if (nextBirthDate && Number.isNaN(nextBirthDate.getTime())) throw new Error('La fecha de nacimiento no es válida.')
  if (nextBirthDate && nextBirthDate.getTime() > Date.now()) {
    throw new Error('La fecha de nacimiento no puede estar en el futuro.')
  }
  const isMinor = isMinorAtDate(nextBirthDate || currentPatient.birthDate)
  const guardianName = formData.has('guardianName') ? ((formData.get('guardianName') as string)?.trim() || null) : currentPatient.guardianName
  const guardianRelationship = formData.has('guardianRelationship') ? ((formData.get('guardianRelationship') as string)?.trim() || null) : currentPatient.guardianRelationship
  const guardianEmail = formData.has('guardianEmail') ? ((formData.get('guardianEmail') as string)?.trim() || null) : currentPatient.guardianEmail
  const guardianPhone = formData.has('guardianPhone') ? ((formData.get('guardianPhone') as string)?.trim() || null) : currentPatient.guardianPhone
  const guardianConsentAccepted = formData.get('guardianConsentAccepted') === 'true'
  const guardianConsentAt = isMinor
    ? currentPatient.guardianConsentAt || (guardianConsentAccepted ? new Date() : null)
    : null
  if (isMinor && (!guardianName || !guardianRelationship || !guardianConsentAt)) {
    throw new Error('Para un paciente menor de edad debes mantener registrada la información y constancia del representante legal.')
  }
  const rawGuardianConsentMethod = formData.get('guardianConsentMethod')
  const guardianConsentMethod = isMinor
    ? typeof rawGuardianConsentMethod === 'string' && GUARDIAN_CONSENT_METHODS.has(rawGuardianConsentMethod)
      ? rawGuardianConsentMethod
      : currentPatient.guardianConsentMethod || 'PROFESSIONAL_ATTESTATION'
    : null
  const sexValue = formData.get('sex')
  const sex = typeof sexValue === 'string' && (SEX_VALUES as readonly string[]).includes(sexValue)
    ? sexValue
    : undefined
  const heightCm = parseOptionalPatientNumber(formData.get('heightCm'), 'altura', { min: 30, max: 250 })
  const objectiveValue = formData.get('objective')
  const objective = typeof objectiveValue === 'string' && (OBJECTIVE_VALUES as readonly string[]).includes(objectiveValue)
    ? objectiveValue
    : undefined
  const activityValue = formData.get('activityLevel')
  const activityLevel = typeof activityValue === 'string' && (ACTIVITY_LEVEL_VALUES as readonly string[]).includes(activityValue)
    ? activityValue
    : undefined
  const notes = (formData.get('notes') as string) || null
  const allergies = (formData.get('allergies') as string) || ''
  const intolerances = (formData.get('intolerances') as string) || ''
  const dietaryPreferences = (formData.get('dietaryPreferences') as string) || ''
  const medicalHistory = (formData.get('medicalHistory') as string) || ''
  const currentMedications = (formData.get('currentMedications') as string) || ''
  const isGLP1Treatment = formData.get('isGLP1Treatment') === 'true' || formData.get('isGLP1Treatment') === 'on'
  const isTCAProtocol = formData.get('isTCAProtocol') === 'true' || formData.get('isTCAProtocol') === 'on'

  const allergiesStatus = formData.has('allergiesStatus') ? parseClinicalStatus(formData.get('allergiesStatus')) : undefined
  const intolerancesStatus = formData.has('intolerancesStatus') ? parseClinicalStatus(formData.get('intolerancesStatus')) : undefined
  const medicationsStatus = formData.has('medicationsStatus') ? parseClinicalStatus(formData.get('medicationsStatus')) : undefined
  const pathologiesStatus = formData.has('pathologiesStatus') ? parseClinicalStatus(formData.get('pathologiesStatus')) : undefined

  const patient = await prisma.$transaction(async (tx) => {
    const updated = await tx.patient.update({
      where: { id, userId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        birthDate: nextBirthDate,
        guardianName: isMinor ? guardianName : null,
        guardianRelationship: isMinor ? guardianRelationship : null,
        guardianEmail: isMinor ? guardianEmail : null,
        guardianPhone: isMinor ? guardianPhone : null,
        guardianConsentAt,
        guardianConsentPolicyVersion: isMinor && guardianConsentAt ? (currentPatient.guardianConsentPolicyVersion || LEGAL_POLICY_VERSION) : null,
        guardianConsentMethod,
        sex: sex || undefined,
        heightCm: heightCm ?? undefined,
        objective: objective || undefined,
        activityLevel: activityLevel || undefined,
        notes,
        allergies,
        allergiesStatus,
        intolerances,
        intolerancesStatus,
        dietaryPreferences,
        medicalHistory,
        pathologiesStatus,
        currentMedications,
        medicationsStatus,
        isGLP1Treatment,
        isTCAProtocol,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId: updated.id,
        action: 'PATIENT_UPDATED',
        entityType: 'PATIENT',
        entityId: updated.id,
        details: 'Datos clínicos y de contacto del expediente actualizados.',
      },
    })
    return updated
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${id}`)
  return patient
}

export async function deletePatient(id: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  await prisma.$transaction(async (tx) => {
    await tx.patient.update({
      where: { id: patient.id },
      data: { isActive: false, portalAccessEnabled: false },
    })
    await tx.user.updateMany({
      where: { patientId: patient.id },
      data: {
        sessionRevokedAt: new Date(),
        sessionVersion: { increment: 1 },
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId: patient.id,
        action: 'PATIENT_ARCHIVED_ACCESS_REVOKED',
        entityType: 'PATIENT',
        entityId: patient.id,
        details: 'Borrado lógico del expediente. Portal desactivado y sesiones invalidadas.',
      },
    })
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
}

export async function restorePatient(id: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id, userId, isActive: false, isHardDeleted: false },
    select: {
      id: true,
      birthDate: true,
      guardianName: true,
      guardianRelationship: true,
      guardianConsentAt: true,
    },
  })
  if (!patient) throw new Error('Paciente no encontrado o no archivado.')
  if (
    isMinorAtDate(patient.birthDate) &&
    (!patient.guardianName || !patient.guardianRelationship || !patient.guardianConsentAt)
  ) {
    throw new Error(
      'No se puede reabrir un expediente de un menor sin la constancia del representante legal.'
    )
  }

  await prisma.$transaction([
    prisma.patient.update({ where: { id: patient.id }, data: { isActive: true } }),
    prisma.auditLog.create({
      data: {
        userId,
        patientId: patient.id,
        action: 'PATIENT_RESTORED',
        entityType: 'PATIENT',
        entityId: patient.id,
        details: 'Expediente restaurado. El acceso al portal permanece suspendido hasta reactivarlo expresamente.',
      },
    }),
  ])

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
}

function readAnthropometryNumber(
  formData: FormData,
  field: string,
  label: string,
  options: { min: number; max: number; required?: boolean }
): number | null {
  const raw = formData.get(field)
  if (raw === null || String(raw).trim() === '') {
    if (options.required) throw new Error(`El campo "${label}" es obligatorio.`)
    return null
  }
  const numeric = Number(String(raw).trim().replace(',', '.'))
  if (!Number.isFinite(numeric) || numeric < options.min || numeric > options.max) {
    throw new Error(`El campo "${label}" no contiene un valor válido.`)
  }
  return numeric
}

export async function createAnthropometry(patientId: string, formData: FormData) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true, heightCm: true, birthDate: true, sex: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const dateStr = (formData.get('date') as string) || new Date().toISOString()
  const measurementDate = new Date(dateStr)
  if (Number.isNaN(measurementDate.getTime())) throw new Error('La fecha de la medición no es válida.')

  const weightKg = readAnthropometryNumber(formData, 'weightKg', 'peso', {
    min: 0.1,
    max: 500,
    required: true,
  }) as number
  let bodyFatPct = readAnthropometryNumber(formData, 'bodyFatPct', 'grasa corporal', { min: 0, max: 100 })
  const muscleMassKg = readAnthropometryNumber(formData, 'muscleMassKg', 'masa muscular', { min: 0, max: 300 })
  const waistCm = readAnthropometryNumber(formData, 'waistCm', 'cintura', { min: 0, max: 300 })
  const hipCm = readAnthropometryNumber(formData, 'hipCm', 'cadera', { min: 0, max: 300 })
  const chestCm = readAnthropometryNumber(formData, 'chestCm', 'pecho', { min: 0, max: 300 })
  const armCm = readAnthropometryNumber(formData, 'armCm', 'brazo', { min: 0, max: 300 })
  const thighCm = readAnthropometryNumber(formData, 'thighCm', 'muslo', { min: 0, max: 300 })

  // Extended ISAK skinfolds & bone diameters
  const skinfoldTriceps = readAnthropometryNumber(formData, 'skinfoldTriceps', 'pliegue tricipital', { min: 0, max: 100 })
  const skinfoldSubscapular = readAnthropometryNumber(formData, 'skinfoldSubscapular', 'pliegue subescapular', { min: 0, max: 100 })
  const skinfoldSuprailiac = readAnthropometryNumber(formData, 'skinfoldSuprailiac', 'pliegue suprailíaco', { min: 0, max: 100 })
  const skinfoldAbdominal = readAnthropometryNumber(formData, 'skinfoldAbdominal', 'pliegue abdominal', { min: 0, max: 100 })
  const skinfoldBiceps = readAnthropometryNumber(formData, 'skinfoldBiceps', 'pliegue bicipital', { min: 0, max: 100 })
  const skinfoldCalf = readAnthropometryNumber(formData, 'skinfoldCalf', 'pliegue gemelar', { min: 0, max: 100 })

  const boneDiameterWrist = readAnthropometryNumber(formData, 'boneDiameterWrist', 'diámetro de muñeca', { min: 0, max: 20 })
  const boneDiameterFemur = readAnthropometryNumber(formData, 'boneDiameterFemur', 'diámetro de fémur', { min: 0, max: 30 })
  const boneDiameterHumerus = readAnthropometryNumber(formData, 'boneDiameterHumerus', 'diámetro de húmero', { min: 0, max: 30 })
  const phaseAngle = readAnthropometryNumber(formData, 'phaseAngle', 'ángulo de fase', { min: 0, max: 20 })

  const notes = String(formData.get('notes') || '').trim().slice(0, 5_000) || null
  const isPublishedToPatient = formData.get('isPublishedToPatient') === 'true' || formData.get('isPublishedToPatient') === 'on'

  // Calculated: Waist-to-Height Ratio (ICT)
  let waistToHeightRatio: number | null = null
  if (waistCm && patient.heightCm) {
    try {
      const whtrRes = calculateWaistToHeightRatio(waistCm, patient.heightCm)
      waistToHeightRatio = whtrRes.ratio
    } catch {}
  }

  // Calculated: CUN-BAE body fat equation
  let cunBaeFatPct: number | null = null
  if (weightKg && patient.heightCm && patient.birthDate) {
    try {
      const birth = new Date(patient.birthDate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      const bmiRes = calculateBMI(weightKg, patient.heightCm)
      const sexParam = patient.sex?.toLowerCase() === 'male' ? 'male' : 'female'
      cunBaeFatPct = calculateCUNBAE(bmiRes.bmi, age, sexParam)
      if (bodyFatPct === null && cunBaeFatPct) {
        bodyFatPct = cunBaeFatPct
      }
    } catch {}
  }

  // Calculated: Heath-Carter Somatotype
  let somatotypeEndo: number | null = null
  let somatotypeMeso: number | null = null
  let somatotypeEcto: number | null = null
  if (
    skinfoldTriceps &&
    skinfoldSubscapular &&
    skinfoldSuprailiac &&
    boneDiameterHumerus &&
    boneDiameterFemur &&
    armCm &&
    thighCm &&
    weightKg &&
    patient.heightCm
  ) {
    try {
      const soma = calculateHeathCarterSomatotype({
        heightCm: patient.heightCm,
        weightKg,
        tricepsMm: skinfoldTriceps,
        subscapularMm: skinfoldSubscapular,
        suprailiacMm: skinfoldSuprailiac,
        humerusDiamCm: boneDiameterHumerus,
        femurDiamCm: boneDiameterFemur,
        armCircCm: armCm,
        calfCircCm: thighCm,
      })
      somatotypeEndo = soma.endomorphy
      somatotypeMeso = soma.mesomorphy
      somatotypeEcto = soma.ectomorphy
    } catch {}
  }

  const anthropometry = await prisma.$transaction(async (tx) => {
    const created = await tx.anthropometry.create({
      data: {
        patientId,
        date: measurementDate,
        weightKg,
        bodyFatPct,
        muscleMassKg,
        waistCm,
        hipCm,
        chestCm,
        armCm,
        thighCm,
        skinfoldTriceps,
        skinfoldSubscapular,
        skinfoldSuprailiac,
        skinfoldAbdominal,
        skinfoldBiceps,
        skinfoldCalf,
        boneDiameterWrist,
        boneDiameterFemur,
        boneDiameterHumerus,
        somatotypeEndo,
        somatotypeMeso,
        somatotypeEcto,
        waistToHeightRatio,
        cunBaeFatPct,
        phaseAngle,
        notes,
        isPublishedToPatient,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'ANTHROPOMETRY_CREATED',
        entityType: 'Anthropometry',
        entityId: created.id,
        details: isPublishedToPatient
          ? 'Medición antropométrica creada y publicada al portal del paciente.'
          : 'Medición antropométrica creada sin publicar al portal.',
      },
    })
    return created
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/evolucion')
  return anthropometry
}

export async function toggleAnthropometryPublish(id: string, patientId: string, isPublished: boolean) {
  const userId = await requireUserId()
  if (typeof isPublished !== 'boolean') {
    throw new Error('El estado de publicación de la medición no es válido.')
  }
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.anthropometry.updateMany({
      where: { id, patientId },
      data: { isPublishedToPatient: isPublished },
    })
    if (result.count !== 1) throw new Error('Medición no encontrada para este paciente.')
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'ANTHROPOMETRY_PUBLICATION_CHANGED',
        entityType: 'Anthropometry',
        entityId: id,
        details: isPublished
          ? 'Medición publicada al portal del paciente.'
          : 'Medición retirada del portal del paciente.',
      },
    })
    return tx.anthropometry.findUniqueOrThrow({ where: { id } })
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/evolucion')
  return updated
}

export async function createClinicalCheckIn(patientId: string, formData: FormData) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado o archivado.')

  const adherencePct = Number(formData.get('adherencePct'))
  const digestionRaw = String(formData.get('digestionScore') || '').trim()
  const habitsRaw = String(formData.get('habitsScore') || '').trim()
  const digestionScore = digestionRaw ? Number(digestionRaw) : null
  const habitsScore = habitsRaw ? Number(habitsRaw) : null
  const dateRaw = String(formData.get('date') || '')

  if (!Number.isInteger(adherencePct) || adherencePct < 0 || adherencePct > 100) {
    throw new Error('La adherencia debe estar entre 0 y 100%.')
  }
  if (digestionScore !== null && (!Number.isInteger(digestionScore) || digestionScore < 0 || digestionScore > 10)) {
    throw new Error('La puntuación digestiva debe estar entre 0 y 10.')
  }
  if (habitsScore !== null && (!Number.isInteger(habitsScore) || habitsScore < 0 || habitsScore > 10)) {
    throw new Error('La puntuación de hábitos debe estar entre 0 y 10.')
  }
  const date = dateRaw ? new Date(dateRaw) : new Date()
  if (Number.isNaN(date.getTime())) throw new Error('La fecha de seguimiento no es válida.')
  if (date.getTime() > Date.now()) throw new Error('La fecha de seguimiento no puede estar en el futuro.')

  const checkIn = await prisma.$transaction(async (tx) => {
    const created = await tx.clinicalCheckIn.create({
      data: {
        patientId,
        date,
        adherencePct,
        digestionScore,
        habitsScore,
        notes: String(formData.get('notes') || '').trim().slice(0, 2000) || null,
      },
    })
    await tx.auditLog.create({
      data: { userId, patientId, action: 'CLINICAL_CHECKIN_CREATED', entityType: 'ClinicalCheckIn', entityId: created.id },
    })
    return created
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return checkIn
}


export async function exportPatientData(patientId: string): Promise<string> {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    include: {
      anthropometries: { orderBy: { date: 'asc' } },
      consultations: { orderBy: { date: 'asc' } },
      mealPlans: {
        orderBy: { createdAt: 'asc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              meals: {
                orderBy: { order: 'asc' },
                include: {
                  items: {
                    include: {
                      food: {
                        select: {
                          name: true, category: true, calories: true, proteinG: true, carbsG: true, fatG: true,
                          fiberG: true, sodiumMg: true, allergensJson: true,
                        },
                      },
                      recipe: {
                        select: {
                          name: true, servings: true, instructions: true,
                          ingredients: { include: { food: { select: { name: true, calories: true, proteinG: true, carbsG: true, fatG: true } } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      bloodAnalyses: { orderBy: { date: 'asc' } },
      appointments: { orderBy: { date: 'asc' } },
      anamnesisSubmissions: { orderBy: { submittedAt: 'asc' } },
      clinicalCheckIns: { orderBy: { date: 'asc' } },
      consents: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { uploadedAt: 'asc' } },
      emailLogs: { orderBy: { sentAt: 'asc' } },
      screenings: { orderBy: { date: 'asc' } },
      photos: { orderBy: { date: 'asc' } },
      patientQuestionnaires: { orderBy: { createdAt: 'asc' } },
      appointmentRequests: { orderBy: { createdAt: 'asc' } },
      clinicalProtocols: { orderBy: { createdAt: 'asc' } },
      calculatorResults: { orderBy: { createdAt: 'asc' } },
      dataRequests: { orderBy: { createdAt: 'asc' } },
      auditLogs: { orderBy: { createdAt: 'asc' }, take: 5000 },
    },
  })
  if (!patient) throw new Error('Paciente no encontrado')

  // Los binarios se exportan como metadatos y se sirven por la ruta privada.
  // Se excluyen las claves internas `private://` del JSON entregable, también
  // las que viven dentro de los adjuntos de los cuestionarios.
  const { documents, photos, patientQuestionnaires, ...patientWithoutFiles } = patient
  const exportedQuestionnaires = patientQuestionnaires.map((questionnaire) => {
    let attachments: Array<{ id?: string; name?: string; type?: string }> = []
    if (questionnaire.attachmentsJson) {
      try {
        const parsed: unknown = JSON.parse(questionnaire.attachmentsJson)
        if (Array.isArray(parsed)) {
          attachments = parsed
            .filter((attachment): attachment is Record<string, unknown> =>
              Boolean(attachment) && typeof attachment === 'object'
            )
            .map((attachment) => ({
              id: typeof attachment.id === 'string' ? attachment.id : undefined,
              name: typeof attachment.name === 'string' ? attachment.name : undefined,
              type: typeof attachment.type === 'string' ? attachment.type : undefined,
            }))
        }
      } catch {
        // Un adjunto legado corrupto no impide exportar el resto del expediente.
      }
    }
    return { ...questionnaire, attachmentsJson: null, attachments }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId: patient.id,
      action: 'PATIENT_DATA_EXPORTED',
      entityType: 'PATIENT',
      entityId: patient.id,
      details: 'Exportación completa de datos clínicos y de salud realizada por la profesional. Incluye documentos y fotografías como metadatos; los archivos binarios se descargan por su vía privada.',
    },
  })

  return JSON.stringify({
    exportVersion: '2.0',
    exportDate: new Date().toISOString(),
    software: 'EVSoftware',
    legalBasis: 'Derecho de acceso y portabilidad (RGPD arts. 15 y 20). Revisión legal pendiente antes de entrega a terceros.',
    patient: patientWithoutFiles,
    questionnaires: exportedQuestionnaires,
    files: {
      documents: documents.map((document) => ({
        id: document.id,
        title: document.title,
        category: document.category,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSizeKb: document.fileSizeKb,
        notes: document.notes,
        isSharedWithPatient: document.isSharedWithPatient,
        uploadedAt: document.uploadedAt,
        storage: document.fileUrl.startsWith('private://') ? 'PRIVATE_AUTHENTICATED' : 'LEGACY_EXTERNAL_URL',
      })),
      photos: photos.map((photo) => ({
        id: photo.id,
        date: photo.date,
        label: photo.label,
        notes: photo.notes,
        consentGiven: photo.consentGiven,
        storage: photo.photoUrl.startsWith('private://') ? 'PRIVATE_AUTHENTICATED' : 'LEGACY_EXTERNAL_URL',
      })),
    },
  }, null, 2)
}

export async function importPatientFromCSV(content: string) {
  await requireUserId()
  // Comprehensive scale parser supporting:
  // 1. JSON exports from apps / bioimpedance software
  // 2. Tabular CSV/TXT/TSV with metadata preambles (Tanita MC-780, SECA mBCA, InBody 770/270)
  // 3. Single evaluation Key-Value sheets (InBody / Tanita test summaries)
  // 4. European comma decimals ("74,5 kg") and English decimals ("74.5")
  const trimmed = (content || '').trim()
  if (!trimmed) throw new Error('El archivo seleccionado está vacío.')

  // --- FORMAT 1: JSON ---
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed)
      const items = Array.isArray(data)
        ? data
        : data.measurements || data.data || data.evaluations || [data]

      const jsonMeasurements = items
        .map((it: any) => ({
          date: parseScaleDate(it.date || it.fecha || it.time || it.datetime),
          weightKg: cleanScaleNumber(it.weightKg || it.weight || it.peso) || 0,
          bodyFatPct: cleanScaleNumber(
            it.bodyFatPct || it.bodyFat || it.fat || it.grasa || it.pbf || it.fatPct
          ),
          muscleMassKg: cleanScaleNumber(
            it.muscleMassKg || it.muscleMass || it.muscle || it.smm || it.musculo || it.ffm
          ),
          visceralFat: cleanScaleNumber(
            it.visceralFat || it.visceral || it.vfl || it.vat || it.grasaVisceral
          ),
          waistCm: cleanScaleNumber(it.waistCm || it.waist || it.cintura),
          hipCm: cleanScaleNumber(it.hipCm || it.hip || it.cadera),
        }))
        .filter((m: any) => m.weightKg > 0)

      if (jsonMeasurements.length > 0) {
        return jsonMeasurements
      }
    } catch {
      // Fallback to text parsing
    }
  }

  const rawLines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (rawLines.length === 0) throw new Error('No se encontraron líneas con contenido en el archivo.')

  // --- FORMAT 2: KEY-VALUE TEST REPORT (Single test summary from InBody / Tanita / SECA) ---
  const kvMatches = rawLines.filter((l) =>
    /^(peso|weight|grasa|fat|pbf|smm|m[uú]scul|visceral|cintura|waist|cadera|hip|fecha|date)\s*[:=,\t]/i.test(l)
  )

  if (kvMatches.length >= 2) {
    const single: any = {
      date: new Date(),
      weightKg: 0,
      bodyFatPct: null,
      muscleMassKg: null,
      visceralFat: null,
      waistCm: null,
      hipCm: null,
    }

    for (const line of rawLines) {
      const parts = line.split(/[:=]|\t/).map((p) => p.trim())
      if (parts.length < 2) continue
      const key = parts[0].toLowerCase()
      const val = parts.slice(1).join(':').trim()

      if (/fecha|date/i.test(key)) single.date = parseScaleDate(val)
      else if (/peso|weight|wt/i.test(key)) single.weightKg = cleanScaleNumber(val) || 0
      else if (/grasa|fat|pbf/i.test(key)) single.bodyFatPct = cleanScaleNumber(val)
      else if (/(m[uú]scul|muscle|smm|ffm)/i.test(key)) single.muscleMassKg = cleanScaleNumber(val)
      else if (/visceral|vfl|vat/i.test(key)) single.visceralFat = cleanScaleNumber(val)
      else if (/cintura|waist/i.test(key)) single.waistCm = cleanScaleNumber(val)
      else if (/cadera|hip/i.test(key)) single.hipCm = cleanScaleNumber(val)
    }

    if (single.weightKg > 0) {
      return [single]
    }
  }

  // --- FORMAT 3: TABULAR CSV / TXT / TSV ---
  // Detect where the table header row is located (skip machine preambles / serial number lines)
  let headerIndex = -1
  let delimiter = ','

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].toLowerCase()
    const hasWeight = line.includes('peso') || line.includes('weight') || line.includes('wt') || line.includes('kg')
    const hasOther =
      line.includes('grasa') ||
      line.includes('fat') ||
      line.includes('fecha') ||
      line.includes('date') ||
      line.includes('smm') ||
      line.includes('pbf') ||
      line.includes('bmi') ||
      line.includes('imc')

    if (hasWeight && hasOther) {
      headerIndex = i
      if (line.includes(';')) delimiter = ';'
      else if (line.includes('\t')) delimiter = '\t'
      else delimiter = ','
      break
    }
  }

  if (headerIndex === -1) {
    // If not detected by combination, try the first line with delimiter
    headerIndex = 0
    if (rawLines[0].includes(';')) delimiter = ';'
    else if (rawLines[0].includes('\t')) delimiter = '\t'
  }

  const headerCols = rawLines[headerIndex]
    .split(delimiter)
    .map((c) =>
      c
        .trim()
        .toLowerCase()
        .replace(/["'()%]/g, '')
    )

  const measurements: any[] = []

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const cols = rawLines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''))
    if (cols.length < 2) continue

    const row: Record<string, string> = {}
    headerCols.forEach((h, idx) => {
      row[h] = cols[idx] || ''
    })

    let weightKg = 0
    let date = new Date()
    let bodyFatPct: number | null = null
    let muscleMassKg: number | null = null
    let visceralFat: number | null = null
    let waistCm: number | null = null
    let hipCm: number | null = null

    for (const [k, v] of Object.entries(row)) {
      if (/fecha|date|dia/i.test(k)) date = parseScaleDate(v)
      else if (/peso|weight|wt/i.test(k) && !weightKg) weightKg = cleanScaleNumber(v) || 0
      else if (/grasa|fat|pbf/i.test(k) && bodyFatPct === null) bodyFatPct = cleanScaleNumber(v)
      else if (/(m[uú]scul|muscle|smm|ffm)/i.test(k) && muscleMassKg === null) muscleMassKg = cleanScaleNumber(v)
      else if (/visceral|vfl|vat/i.test(k) && visceralFat === null) visceralFat = cleanScaleNumber(v)
      else if (/cintura|waist/i.test(k) && waistCm === null) waistCm = cleanScaleNumber(v)
      else if (/cadera|hip/i.test(k) && hipCm === null) hipCm = cleanScaleNumber(v)
    }

    if (weightKg > 0) {
      measurements.push({
        date,
        weightKg,
        bodyFatPct,
        muscleMassKg,
        visceralFat,
        waistCm,
        hipCm,
      })
    }
  }

  if (measurements.length === 0) {
    throw new Error(
      'No se encontraron mediciones válidas con columna de Peso en el archivo. Verifica que contenga cabeceras como Peso/Weight y valores numéricos.'
    )
  }

  return measurements
}

function cleanScaleNumber(val: any): number | null {
  if (val === undefined || val === null) return null
  let str = String(val).trim()
  if (!str || str === '-' || str === 'N/A' || str === 'null') return null
  const isLbs = /lbs?$/i.test(str)
  str = str.replace(/[^\d,.-]/g, '').trim()
  if (!str) return null
  str = str.replace(',', '.')
  const num = parseFloat(str)
  if (isNaN(num)) return null
  return isLbs ? Math.round(num * 0.453592 * 10) / 10 : Math.round(num * 100) / 100
}

function parseScaleDate(dateStr: any): Date {
  if (!dateStr) return new Date()
  const str = String(dateStr).trim()
  const direct = new Date(str)
  if (!isNaN(direct.getTime()) && str.includes('-') && str.indexOf('-') === 4) return direct
  const match = str.match(
    /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  )
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    let year = parseInt(match[3], 10)
    if (year < 100) year += 2000
    const hours = match[4] ? parseInt(match[4], 10) : 0
    const minutes = match[5] ? parseInt(match[5], 10) : 0
    return new Date(year, month, day, hours, minutes)
  }
  return isNaN(direct.getTime()) ? new Date() : direct
}

export async function importAnthropometryBatch(patientId: string, measurements: unknown[]) {
  const userId = await requireUserId()
  if (!await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })) throw new Error('Paciente no encontrado.')
  if (!Array.isArray(measurements) || measurements.length === 0 || measurements.length > 2_000) {
    throw new Error('El archivo debe contener entre 1 y 2.000 mediciones.')
  }

  const rows = measurements.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error(`La medición ${index + 1} no es válida.`)
    }
    const measurement = raw as Record<string, unknown>
    const date = measurement.date instanceof Date ? measurement.date : new Date(String(measurement.date || ''))
    if (Number.isNaN(date.getTime())) throw new Error(`La fecha de la medición ${index + 1} no es válida.`)

    const readOptional = (field: string, label: string, min: number, max: number) => {
      const value = measurement[field]
      if (value === undefined || value === null || value === '') return null
      const numeric = Number(value)
      if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
        throw new Error(`El campo "${label}" de la medición ${index + 1} no es válido.`)
      }
      return numeric
    }

    const weightKg = readOptional('weightKg', 'peso', 0.1, 500)
    if (weightKg === null) throw new Error(`La medición ${index + 1} no tiene un peso válido.`)

    return {
      patientId,
      date,
      weightKg,
      bodyFatPct: readOptional('bodyFatPct', 'grasa corporal', 0, 100),
      muscleMassKg: readOptional('muscleMassKg', 'masa muscular', 0, 300),
      visceralFat: readOptional('visceralFat', 'grasa visceral', 0, 60),
      waistCm: readOptional('waistCm', 'cintura', 0, 300),
      hipCm: readOptional('hipCm', 'cadera', 0, 300),
    }
  })

  await prisma.anthropometry.createMany({ data: rows })

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return rows.length
}

export async function saveClinicalScreening(
  patientId: string,
  type: string,
  answers: Record<string, string | number | undefined>,
  notes?: string
) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado o archivado.')

  const def = getScreeningDefinition(type)
  if (!def) throw new Error(`Tipo de cribado desconocido: ${type}`)
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new Error('Las respuestas del cribado no son válidas.')
  }

  const safeAnswers: Record<string, string | number | undefined> = {}
  for (const [key, value] of Object.entries(answers)) {
    if (key.length > 100) throw new Error('El cribado contiene una pregunta no válida.')
    if (value === undefined) continue
    if (typeof value === 'string') {
      if (value.length > 500) throw new Error('Una respuesta del cribado es demasiado larga.')
      safeAnswers[key] = value
      continue
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      safeAnswers[key] = value
      continue
    }
    throw new Error('El cribado contiene una respuesta no válida.')
  }

  const answersJson = JSON.stringify(safeAnswers)
  if (answersJson.length > 20_000) throw new Error('El cribado contiene demasiados datos.')

  const result = def.evaluate(safeAnswers)
  const safeNotes =
    (typeof notes === 'string' ? notes.trim().slice(0, 5_000) : '') || result.interpretation

  const screening = await prisma.$transaction(async (tx) => {
    const created = await tx.clinicalScreening.create({
      data: {
        patientId,
        date: new Date(),
        type,
        score: result.score,
        maxScore: result.maxScore,
        resultCategory: result.resultCategory,
        answersJson,
        notes: safeNotes,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'CLINICAL_SCREENING_CREATED',
        entityType: 'ClinicalScreening',
        entityId: created.id,
        details: `Cribado ${type} registrado. Resultado: ${result.resultCategory}.`,
      },
    })
    return created
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return screening
}

export async function deleteClinicalScreening(screeningId: string, patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  await prisma.$transaction(async (tx) => {
    const deleted = await tx.clinicalScreening.deleteMany({ where: { id: screeningId, patientId } })
    if (deleted.count !== 1) throw new Error('Cribado no encontrado para este paciente.')
    await tx.auditLog.create({
      data: { userId, patientId, action: 'CLINICAL_SCREENING_DELETED', entityType: 'ClinicalScreening', entityId: screeningId },
    })
  })
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function updatePatientGoalsAndTags(
  patientId: string,
  data: {
    targetWeightKg?: number | null
    targetWeightDate?: string | null
    weeklyChangeTargetKg?: number | null
    tags?: string
    medicationSchedule?: string
    milestonesMessage?: string | null
  }
) {
  const userId = await requireUserId()
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Los datos de objetivos no son válidos.')
  }
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado o archivado.')

  if (
    data.targetWeightKg !== undefined &&
    data.targetWeightKg !== null &&
    (!Number.isFinite(data.targetWeightKg) || data.targetWeightKg < 20 || data.targetWeightKg > 500)
  ) {
    throw new Error('El peso objetivo debe estar entre 20 y 500 kg.')
  }
  if (
    data.weeklyChangeTargetKg !== undefined &&
    data.weeklyChangeTargetKg !== null &&
    (!Number.isFinite(data.weeklyChangeTargetKg) ||
      data.weeklyChangeTargetKg < -3 ||
      data.weeklyChangeTargetKg > 3)
  ) {
    throw new Error('El cambio semanal objetivo debe estar entre -3 y 3 kg.')
  }
  let targetWeightDate: Date | null | undefined
  if (data.targetWeightDate === undefined) {
    targetWeightDate = undefined
  } else if (data.targetWeightDate === null || data.targetWeightDate.trim() === '') {
    targetWeightDate = null
  } else {
    targetWeightDate = new Date(data.targetWeightDate)
    if (Number.isNaN(targetWeightDate.getTime())) {
      throw new Error('La fecha objetivo no es válida.')
    }
  }
  if (data.tags !== undefined && typeof data.tags !== 'string') {
    throw new Error('Las etiquetas no son válidas.')
  }
  if (data.medicationSchedule !== undefined && typeof data.medicationSchedule !== 'string') {
    throw new Error('La pauta de medicación no es válida.')
  }
  if (
    data.milestonesMessage !== undefined &&
    data.milestonesMessage !== null &&
    typeof data.milestonesMessage !== 'string'
  ) {
    throw new Error('El mensaje de hitos no es válido.')
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.patient.update({
      where: { id: patientId, userId },
      data: {
        targetWeightKg: data.targetWeightKg !== undefined ? data.targetWeightKg : undefined,
        targetWeightDate,
        weeklyChangeTargetKg: data.weeklyChangeTargetKg !== undefined ? data.weeklyChangeTargetKg : undefined,
        tags: data.tags !== undefined ? data.tags.trim().slice(0, 1_000) : undefined,
        medicationSchedule:
          data.medicationSchedule !== undefined
            ? data.medicationSchedule.trim().slice(0, 5_000)
            : undefined,
        milestonesMessage:
          data.milestonesMessage !== undefined
            ? data.milestonesMessage === null
              ? null
              : data.milestonesMessage.trim().slice(0, 2_000)
            : undefined,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'PATIENT_GOALS_UPDATED',
        entityType: 'PATIENT',
        entityId: patientId,
        details: 'Objetivos, etiquetas o pauta de seguimiento actualizados.',
      },
    })
    return result
  })

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return updated
}

export async function dischargePatient(patientId: string, summary: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const safeSummary =
    (typeof summary === 'string' ? summary.trim().slice(0, 5_000) : '') ||
    'Alta clínica sin resumen adicional.'
  const dischargedAt = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    const discharged = await tx.patient.update({
      where: { id: patient.id },
      data: {
        isDischarged: true,
        dischargedAt,
        dischargeSummary: safeSummary,
        portalAccessEnabled: false,
      },
    })
    await tx.user.updateMany({
      where: { patientId: patient.id },
      data: {
        sessionRevokedAt: dischargedAt,
        sessionVersion: { increment: 1 },
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'PATIENT_DISCHARGED',
        entityType: 'PATIENT',
        entityId: patientId,
        details: 'Alta clínica y cierre de seguimiento. Acceso al portal de paciente desactivado.',
      },
    })
    return discharged
  })

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return updated
}

export async function reopenPatient(patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: {
      id: true,
      birthDate: true,
      guardianName: true,
      guardianRelationship: true,
      guardianConsentAt: true,
    },
  })
  if (!patient) throw new Error('Paciente no encontrado o archivado.')
  if (
    isMinorAtDate(patient.birthDate) &&
    (!patient.guardianName || !patient.guardianRelationship || !patient.guardianConsentAt)
  ) {
    throw new Error(
      'No se puede reactivar el portal de un menor sin la constancia vigente del representante legal.'
    )
  }

  const updated = await prisma.$transaction(async (tx) => {
    const reopened = await tx.patient.update({
      where: { id: patient.id },
      data: {
        isDischarged: false,
        dischargedAt: null,
        dischargeSummary: null,
        portalAccessEnabled: true,
      },
    })
    await tx.user.updateMany({
      where: { patientId: patient.id },
      data: {
        sessionRevokedAt: null,
        sessionVersion: { increment: 1 },
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'PATIENT_REOPENED',
        entityType: 'PATIENT',
        entityId: patientId,
        details: 'Reapertura de seguimiento clínico y reactivación de acceso al portal.',
      },
    })
    return reopened
  })

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return updated
}

export async function saveProgressPhoto(
  patientId: string,
  data: {
    file: File
    label?: string
    notes?: string
    consentGiven: boolean
  }
) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')
  if (!data || typeof data !== 'object') throw new Error('Los datos de la fotografía no son válidos.')
  if (data.consentGiven !== true) {
    throw new Error('Es obligatorio contar con el consentimiento explícito del paciente para registrar fotografías corporales.')
  }
  if (!data.file) throw new Error('Selecciona una fotografía para guardarla.')
  const label = String(data.label || 'Frontal').trim().slice(0, 100) || 'Frontal'
  const notes = String(data.notes || '').trim().slice(0, 2_000) || null

  const stored = await savePrivateFile({ patientId, category: 'photos', file: data.file })
  let photo
  try {
    photo = await prisma.$transaction(async (tx) => {
      const created = await tx.progressPhoto.create({
        data: {
          patientId,
          date: new Date(),
          photoUrl: stored.storageKey,
          label,
          notes,
          consentGiven: true,
        },
      })
      await tx.auditLog.create({
        data: {
          userId,
          patientId,
          action: 'PROGRESS_PHOTO_UPLOADED',
          entityType: 'ProgressPhoto',
          entityId: created.id,
          details: `Fotografía de evolución almacenada en almacenamiento privado (${stored.fileName}). Consentimiento explícito registrado por la profesional.`,
        },
      })
      return created
    })
  } catch (error) {
    await deletePrivateFileStrict(stored.storageKey).catch((cleanupError) => {
      console.error('No se pudo limpiar la fotografía huérfana:', cleanupError)
    })
    throw error
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return photo
}

export async function deleteProgressPhoto(photoId: string, patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const photo = await prisma.progressPhoto.findFirst({ where: { id: photoId, patientId }, select: { id: true, photoUrl: true } })
  if (!photo) throw new Error('Fotografía no encontrada.')
  await deletePrivateFileStrict(photo.photoUrl)
  await prisma.$transaction([
    prisma.progressPhoto.delete({ where: { id: photo.id } }),
    prisma.auditLog.create({
      data: { userId, patientId, action: 'PROGRESS_PHOTO_DELETED', entityType: 'ProgressPhoto', entityId: photo.id },
    }),
  ])
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
