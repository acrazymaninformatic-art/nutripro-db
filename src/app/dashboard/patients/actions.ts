'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { calculateBMI, calculateWaistToHeightRatio, calculateCUNBAE, calculateHeathCarterSomatotype } from '@/lib/nutrition/anthropometry'
import { getScreeningDefinition } from '@/lib/clinical/screenings'
import { isMinorAtDate } from '@/lib/patient-age'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

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
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = (formData.get('email') as string) || null
  const phone = (formData.get('phone') as string) || null
  const birthDateStr = formData.get('birthDate') as string
  const birthDate = new Date(birthDateStr)
  if (Number.isNaN(birthDate.getTime())) throw new Error('La fecha de nacimiento no es válida.')
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
  const sex = (formData.get('sex') as string) || 'FEMALE'
  const heightCm = parseFloat(formData.get('heightCm') as string) || 165
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
  const waterIntakeStr = formData.get('waterIntakeLiters') as string
  const waterIntakeLiters = waterIntakeStr && !isNaN(parseFloat(waterIntakeStr)) ? parseFloat(waterIntakeStr) : null
  const caffeineDailyStr = formData.get('caffeineDaily') as string
  const caffeineDaily = caffeineDailyStr && !isNaN(parseInt(caffeineDailyStr, 10)) ? parseInt(caffeineDailyStr, 10) : null
  const alcoholFrequency = (formData.get('alcoholFrequency') as string) || null
  const smoking = formData.get('smoking') === 'true' || formData.get('smoking') === 'on'

  // Step 4: Estilo de Vida y Hábitos
  const occupation = (formData.get('occupation') as string) || null
  const workSchedule = (formData.get('workSchedule') as string) || null
  const sleepHoursStr = formData.get('sleepHours') as string
  const sleepHours = sleepHoursStr && !isNaN(parseFloat(sleepHoursStr)) ? parseFloat(sleepHoursStr) : null
  const sleepQuality = (formData.get('sleepQuality') as string) || null
  const stressLevel = (formData.get('stressLevel') as string) || null
  const mealSchedule = (formData.get('mealSchedule') as string) || ''
  const mealsPerDayStr = formData.get('mealsPerDay') as string
  const mealsPerDay = mealsPerDayStr && !isNaN(parseInt(mealsPerDayStr, 10)) ? parseInt(mealsPerDayStr, 10) : null
  const eatsOut = (formData.get('eatsOut') as string) || null
  const cooksAtHome = formData.has('cooksAtHome') ? formData.get('cooksAtHome') === 'true' || formData.get('cooksAtHome') === 'on' : true

  // Step 5: Actividad Física y Deporte
  const activityLevel = (formData.get('activityLevel') as string) || 'MODERATE'
  const exerciseType = (formData.get('exerciseType') as string) || ''
  const exerciseFreqStr = formData.get('exerciseFrequency') as string
  const exerciseFrequency = exerciseFreqStr && !isNaN(parseInt(exerciseFreqStr, 10)) ? parseInt(exerciseFreqStr, 10) : null
  const exerciseDurStr = formData.get('exerciseDuration') as string
  const exerciseDuration = exerciseDurStr && !isNaN(parseInt(exerciseDurStr, 10)) ? parseInt(exerciseDurStr, 10) : null
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
  const objective = (formData.get('objective') as string) || 'WEIGHT_LOSS'
  const shortTermGoal = (formData.get('shortTermGoal') as string) || null
  const longTermGoal = (formData.get('longTermGoal') as string) || null
  const motivation = (formData.get('motivation') as string) || null
  const previousDiets = (formData.get('previousDiets') as string) || ''
  const dietDuration = (formData.get('dietDuration') as string) || null
  const consultationFrequency = (formData.get('consultationFrequency') as string) || null
  const budgetLevel = (formData.get('budgetLevel') as string) || null
  const allergies = (formData.get('allergies') as string) || ''
  const allergiesStatus = (formData.get('allergiesStatus') as string) || (allergies ? 'CONFIRMED' : 'NO_CONSTA')
  const intolerances = (formData.get('intolerances') as string) || ''
  const intolerancesStatus = (formData.get('intolerancesStatus') as string) || (intolerances ? 'CONFIRMED' : 'NO_CONSTA')
  const dietaryPreferences = (formData.get('dietaryPreferences') as string) || ''
  const additionalNotes = (formData.get('additionalNotes') as string) || null
  const notes = (formData.get('notes') as string) || additionalNotes

  // Initial anthropometry fields (optional in creation)
  const initialWeightStr = formData.get('weightKg') as string
  const initialBodyFatStr = formData.get('bodyFatPct') as string
  const initialWaistStr = formData.get('waistCm') as string
  const initialHipStr = formData.get('hipCm') as string

  const patient = await prisma.patient.create({
    data: {
      userId,
      consentAcceptedAt: new Date(),
      consentPolicyVersion: LEGAL_POLICY_VERSION,
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
      pathologiesStatus: (formData.get('pathologiesStatus') as string) || (medicalHistory ? 'CONFIRMED' : 'NO_CONSTA'),
      currentMedications,
      medicationsStatus: (formData.get('medicationsStatus') as string) || (currentMedications ? 'CONFIRMED' : 'NO_CONSTA'),
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

  await prisma.patientConsent.createMany({
    data: REQUIRED_PORTAL_CONSENTS.map((consent) => ({
      patientId: patient.id,
      type: consent.type,
      title: consent.title,
      version: LEGAL_POLICY_VERSION,
      status: 'COMPLETED',
      accepted: true,
      acceptedAt: new Date(),
      signatureData: 'Registrado por la profesional tras informar a la persona interesada.',
    })),
  })

  // If initial weight was provided, create the first anthropometry entry
  if (initialWeightStr && !isNaN(parseFloat(initialWeightStr))) {
    await prisma.anthropometry.create({
      data: {
        patientId: patient.id,
        date: new Date(),
        weightKg: parseFloat(initialWeightStr),
        bodyFatPct: initialBodyFatStr && !isNaN(parseFloat(initialBodyFatStr)) ? parseFloat(initialBodyFatStr) : null,
        waistCm: initialWaistStr && !isNaN(parseFloat(initialWaistStr)) ? parseFloat(initialWaistStr) : null,
        hipCm: initialHipStr && !isNaN(parseFloat(initialHipStr)) ? parseFloat(initialHipStr) : null,
      },
    })
  }

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
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = (formData.get('email') as string) || null
  const phone = (formData.get('phone') as string) || null
  const birthDateStr = formData.get('birthDate') as string
  const nextBirthDate = birthDateStr ? new Date(birthDateStr) : undefined
  if (nextBirthDate && Number.isNaN(nextBirthDate.getTime())) throw new Error('La fecha de nacimiento no es válida.')
  const isMinor = isMinorAtDate(nextBirthDate || currentPatient.birthDate)
  const guardianName = formData.has('guardianName') ? ((formData.get('guardianName') as string)?.trim() || null) : currentPatient.guardianName
  const guardianRelationship = formData.has('guardianRelationship') ? ((formData.get('guardianRelationship') as string)?.trim() || null) : currentPatient.guardianRelationship
  const guardianEmail = formData.has('guardianEmail') ? ((formData.get('guardianEmail') as string)?.trim() || null) : currentPatient.guardianEmail
  const guardianPhone = formData.has('guardianPhone') ? ((formData.get('guardianPhone') as string)?.trim() || null) : currentPatient.guardianPhone
  const guardianConsentAccepted = formData.get('guardianConsentAccepted') === 'true'
  const guardianConsentAt = currentPatient.guardianConsentAt || (guardianConsentAccepted ? new Date() : null)
  if (isMinor && (!guardianName || !guardianRelationship || !guardianConsentAt)) {
    throw new Error('Para un paciente menor de edad debes mantener registrada la información y constancia del representante legal.')
  }
  const guardianConsentMethod = formData.has('guardianConsentMethod')
    ? ((formData.get('guardianConsentMethod') as string)?.trim() || 'PROFESSIONAL_ATTESTATION')
    : currentPatient.guardianConsentMethod
  const sex = formData.get('sex') as string
  const heightCm = parseFloat(formData.get('heightCm') as string)
  const objective = formData.get('objective') as string
  const activityLevel = formData.get('activityLevel') as string
  const notes = (formData.get('notes') as string) || null
  const allergies = (formData.get('allergies') as string) || ''
  const intolerances = (formData.get('intolerances') as string) || ''
  const dietaryPreferences = (formData.get('dietaryPreferences') as string) || ''
  const medicalHistory = (formData.get('medicalHistory') as string) || ''
  const currentMedications = (formData.get('currentMedications') as string) || ''
  const isGLP1Treatment = formData.get('isGLP1Treatment') === 'true' || formData.get('isGLP1Treatment') === 'on'
  const isTCAProtocol = formData.get('isTCAProtocol') === 'true' || formData.get('isTCAProtocol') === 'on'
  const isActive = formData.get('isActive') !== 'false'

  const allergiesStatus = formData.has('allergiesStatus') ? (formData.get('allergiesStatus') as string) : undefined
  const intolerancesStatus = formData.has('intolerancesStatus') ? (formData.get('intolerancesStatus') as string) : undefined
  const medicationsStatus = formData.has('medicationsStatus') ? (formData.get('medicationsStatus') as string) : undefined
  const pathologiesStatus = formData.has('pathologiesStatus') ? (formData.get('pathologiesStatus') as string) : undefined

  const patient = await prisma.patient.update({
    where: { id, userId },
    data: {
      firstName,
      lastName,
      email,
      phone,
      birthDate: nextBirthDate,
      guardianName,
      guardianRelationship,
      guardianEmail,
      guardianPhone,
      guardianConsentAt,
      guardianConsentPolicyVersion: guardianConsentAt ? (currentPatient.guardianConsentPolicyVersion || LEGAL_POLICY_VERSION) : null,
      guardianConsentMethod,
      sex: sex || undefined,
      heightCm: isNaN(heightCm) ? undefined : heightCm,
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
      isActive,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${id}`)
  return patient
}

export async function deletePatient(id: string) {
  const userId = await requireUserId()
  await prisma.patient.update({
    where: { id, userId },
    data: { isActive: false },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
}

export async function restorePatient(id: string) {
  const userId = await requireUserId()
  await prisma.patient.update({
    where: { id, userId },
    data: { isActive: true },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
}

export async function hardDeletePatient(patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'HARD_DELETE_PATIENT',
      entityType: 'PATIENT',
      entityId: patientId,
      details: 'Eliminación definitiva de expediente RGPD solicitada por la profesional autorizada. Se conserva únicamente la trazabilidad mínima del evento.',
    },
  })

  await prisma.patient.delete({
    where: { id: patientId, userId },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  return { success: true }
}

export async function createAnthropometry(patientId: string, formData: FormData) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true, heightCm: true, birthDate: true, sex: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const dateStr = (formData.get('date') as string) || new Date().toISOString()
  const weightKg = parseFloat(formData.get('weightKg') as string)
  let bodyFatPct = formData.get('bodyFatPct') ? parseFloat(formData.get('bodyFatPct') as string) : null
  const muscleMassKg = formData.get('muscleMassKg') ? parseFloat(formData.get('muscleMassKg') as string) : null
  const waistCm = formData.get('waistCm') ? parseFloat(formData.get('waistCm') as string) : null
  const hipCm = formData.get('hipCm') ? parseFloat(formData.get('hipCm') as string) : null
  const chestCm = formData.get('chestCm') ? parseFloat(formData.get('chestCm') as string) : null
  const armCm = formData.get('armCm') ? parseFloat(formData.get('armCm') as string) : null
  const thighCm = formData.get('thighCm') ? parseFloat(formData.get('thighCm') as string) : null

  // Extended ISAK skinfolds & bone diameters
  const skinfoldTriceps = formData.get('skinfoldTriceps') ? parseFloat(formData.get('skinfoldTriceps') as string) : null
  const skinfoldSubscapular = formData.get('skinfoldSubscapular') ? parseFloat(formData.get('skinfoldSubscapular') as string) : null
  const skinfoldSuprailiac = formData.get('skinfoldSuprailiac') ? parseFloat(formData.get('skinfoldSuprailiac') as string) : null
  const skinfoldAbdominal = formData.get('skinfoldAbdominal') ? parseFloat(formData.get('skinfoldAbdominal') as string) : null
  const skinfoldBiceps = formData.get('skinfoldBiceps') ? parseFloat(formData.get('skinfoldBiceps') as string) : null
  const skinfoldCalf = formData.get('skinfoldCalf') ? parseFloat(formData.get('skinfoldCalf') as string) : null

  const boneDiameterWrist = formData.get('boneDiameterWrist') ? parseFloat(formData.get('boneDiameterWrist') as string) : null
  const boneDiameterFemur = formData.get('boneDiameterFemur') ? parseFloat(formData.get('boneDiameterFemur') as string) : null
  const boneDiameterHumerus = formData.get('boneDiameterHumerus') ? parseFloat(formData.get('boneDiameterHumerus') as string) : null
  const phaseAngle = formData.get('phaseAngle') ? parseFloat(formData.get('phaseAngle') as string) : null

  const notes = (formData.get('notes') as string) || null
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

  const anthropometry = await prisma.anthropometry.create({
    data: {
      patientId,
      date: new Date(dateStr),
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

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/evolucion')
  return anthropometry
}

export async function toggleAnthropometryPublish(id: string, patientId: string, isPublished: boolean) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  const updated = await prisma.anthropometry.update({
    where: { id },
    data: { isPublishedToPatient: isPublished },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/evolucion')
  return updated
}

export async function createClinicalCheckIn(patientId: string, formData: FormData) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

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
  // Fetch patient with all anthropometries
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    include: { anthropometries: { orderBy: { date: 'desc' } } }
  })
  if (!patient) throw new Error('Paciente no encontrado')
  
  // Return JSON string with all patient data
  return JSON.stringify({
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    software: 'EVSoftware',
    patient: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      birthDate: patient.birthDate,
      sex: patient.sex,
      heightCm: patient.heightCm,
      objective: patient.objective,
      activityLevel: patient.activityLevel,
      notes: patient.notes,
      allergies: patient.allergies,
      intolerances: patient.intolerances,
      dietaryPreferences: patient.dietaryPreferences,
    },
    anthropometries: patient.anthropometries.map(a => ({
      date: a.date,
      weightKg: a.weightKg,
      bodyFatPct: a.bodyFatPct,
      muscleMassKg: a.muscleMassKg,
      visceralFat: a.visceralFat,
      waistCm: a.waistCm,
      hipCm: a.hipCm,
      chestCm: a.chestCm,
      armCm: a.armCm,
      thighCm: a.thighCm,
      skinfoldTriceps: a.skinfoldTriceps,
      skinfoldSubscapular: a.skinfoldSubscapular,
      skinfoldSuprailiac: a.skinfoldSuprailiac,
      skinfoldAbdominal: a.skinfoldAbdominal,
      notes: a.notes,
    })),
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

export async function importAnthropometryBatch(patientId: string, measurements: any[]) {
  const userId = await requireUserId()
  if (!await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })) throw new Error('Paciente no encontrado.')
  for (const m of measurements) {
    await prisma.anthropometry.create({
      data: {
        patientId,
        date: m.date instanceof Date ? m.date : new Date(m.date),
        weightKg: m.weightKg,
        bodyFatPct: m.bodyFatPct || null,
        muscleMassKg: m.muscleMassKg || null,
        visceralFat: m.visceralFat || null,
        waistCm: m.waistCm || null,
        hipCm: m.hipCm || null,
      },
    })
  }

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return measurements.length
}

export async function saveClinicalScreening(patientId: string, type: string, answers: Record<string, any>, notes?: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  const def = getScreeningDefinition(type)
  if (!def) throw new Error(`Tipo de cribado desconocido: ${type}`)

  const result = def.evaluate(answers)

  const screening = await prisma.clinicalScreening.create({
    data: {
      patientId,
      date: new Date(),
      type,
      score: result.score,
      maxScore: result.maxScore,
      resultCategory: result.resultCategory,
      answersJson: JSON.stringify(answers),
      notes: notes || result.interpretation,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return screening
}

export async function deleteClinicalScreening(screeningId: string, patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  await prisma.clinicalScreening.delete({ where: { id: screeningId, patientId } })
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
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  const updated = await prisma.patient.update({
    where: { id: patientId, userId },
    data: {
      targetWeightKg: data.targetWeightKg !== undefined ? data.targetWeightKg : undefined,
      targetWeightDate: data.targetWeightDate ? new Date(data.targetWeightDate) : data.targetWeightDate === null ? null : undefined,
      weeklyChangeTargetKg: data.weeklyChangeTargetKg !== undefined ? data.weeklyChangeTargetKg : undefined,
      tags: data.tags !== undefined ? data.tags : undefined,
      medicationSchedule: data.medicationSchedule !== undefined ? data.medicationSchedule : undefined,
      milestonesMessage: data.milestonesMessage !== undefined ? data.milestonesMessage : undefined,
    },
  })

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return updated
}

export async function dischargePatient(patientId: string, summary: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  const updated = await prisma.patient.update({
    where: { id: patientId, userId },
    data: {
      isDischarged: true,
      dischargedAt: new Date(),
      dischargeSummary: summary,
      portalAccessEnabled: false, // Sección 5.2: desactivación automática del portal al archivar / alta
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId,
      action: 'PATIENT_DISCHARGED',
      entityType: 'PATIENT',
      entityId: patientId,
      details: 'Alta clínica y cierre de seguimiento. Acceso al portal de paciente desactivado.',
    },
  })

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return updated
}

export async function reopenPatient(patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  const updated = await prisma.patient.update({
    where: { id: patientId, userId },
    data: {
      isDischarged: false,
      dischargedAt: null,
      dischargeSummary: null,
      portalAccessEnabled: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId,
      action: 'PATIENT_REOPENED',
      entityType: 'PATIENT',
      entityId: patientId,
      details: 'Reapertura de seguimiento clínico y reactivación de acceso al portal.',
    },
  })

  revalidatePath('/dashboard/patients')
  revalidatePath(`/dashboard/patients/${patientId}`)
  return updated
}

export async function saveProgressPhoto(
  patientId: string,
  data: {
    photoUrl: string
    label?: string
    notes?: string
    consentGiven: boolean
  }
) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')
  if (!data.consentGiven) throw new Error('Es obligatorio contar con el consentimiento explícito del paciente para registrar fotografías corporales.')

  const photo = await prisma.progressPhoto.create({
    data: {
      patientId,
      date: new Date(),
      photoUrl: data.photoUrl,
      label: data.label || 'Frontal',
      notes: data.notes || null,
      consentGiven: true,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return photo
}

export async function deleteProgressPhoto(photoId: string, patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')

  await prisma.progressPhoto.delete({ where: { id: photoId, patientId } })
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
