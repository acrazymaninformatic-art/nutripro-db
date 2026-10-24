'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'

const CALCULATOR_FORMULAS = new Set([
  'MIFFLIN',
  'HARRIS_BENEDICT',
  'KATCH',
  'CUNNINGHAM',
  'SCHOFIELD',
  'FAO_OMS',
  'OWEN',
  'IRETON_JONES',
  'PENN_STATE',
])

function finiteInRange(value: unknown, label: string, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`El campo "${label}" no contiene un valor válido.`)
  }
  return numeric
}

function boundedJson(value: unknown, label: string, maxLength = 50_000): string | null {
  if (value === undefined || value === null) return null
  const serialized = JSON.stringify(value)
  if (serialized.length > maxLength) throw new Error(`${label} es demasiado extenso.`)
  return serialized
}

export async function saveCalculatorResultAction({
  patientId,
  formula,
  bmrKcal,
  tdeeKcal,
  activityFactor,
  specialNeeds,
  stepsOrMets,
  weightPrediction,
  cardiovascularRisk,
  micronutrientDri,
  notes,
}: {
  patientId: string
  formula: string
  bmrKcal: number
  tdeeKcal: number
  activityFactor: number
  specialNeeds?: unknown
  stepsOrMets?: unknown
  weightPrediction?: unknown
  cardiovascularRisk?: unknown
  micronutrientDri?: unknown
  notes?: string
}) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!patient) throw new Error('Paciente no encontrado')

  const safeFormula = String(formula || '').trim().toUpperCase()
  if (!CALCULATOR_FORMULAS.has(safeFormula)) throw new Error('Fórmula metabólica no reconocida.')
  const safeBmr = finiteInRange(bmrKcal, 'TMB', 0, 10_000)
  const safeTdee = finiteInRange(tdeeKcal, 'gasto energético', 0, 20_000)
  const safeActivityFactor = finiteInRange(activityFactor, 'factor de actividad', 0.5, 3)

  const record = await prisma.calculatorResultRecord.create({
    data: {
      patientId,
      formula: safeFormula,
      bmrKcal: safeBmr,
      tdeeKcal: safeTdee,
      activityFactor: safeActivityFactor,
      specialNeedsJson: boundedJson(specialNeeds, 'Los ajustes por necesidades especiales'),
      stepsOrMetsJson: boundedJson(stepsOrMets, 'Los datos de actividad'),
      weightPredictionJson: boundedJson(weightPrediction, 'La predicción de peso'),
      cardiovascularRiskJson: boundedJson(cardiovascularRisk, 'El riesgo cardiovascular'),
      micronutrientDriJson: boundedJson(micronutrientDri, 'Los micronutrientes'),
      notes: String(notes || '').trim().slice(0, 5_000) || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId,
      action: 'CALCULATOR_ASSESSMENT_SAVED',
      entityType: 'CALCULATOR',
      entityId: record.id,
      details: `Cálculo metabólico y evaluación clínica guardados en la ficha (TMB ${safeBmr} kcal, Gasto ${safeTdee} kcal con fórmula ${safeFormula}).`,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return record
}

/**
 * 5.10 Proponer recalcular objetivos cuando entra una medición nueva
 * Compara el nuevo peso con el peso del plan activo y sugiere el ajuste calórico correspondiente.
 */
export async function checkAnthropometryGoalRecalculationAction(patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    include: {
      anthropometries: {
        orderBy: { date: 'desc' },
        take: 2,
      },
      mealPlans: {
        where: { status: 'PUBLISHED', isActive: true },
        orderBy: { publishedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!patient) return null

  const latestAnthro = patient.anthropometries[0]
  const previousAnthro = patient.anthropometries[1]
  const activePlan = patient.mealPlans[0]

  if (!latestAnthro || !activePlan) {
    return null
  }

  // Calculate weight change
  const weightDiff = previousAnthro ? Math.round((latestAnthro.weightKg - previousAnthro.weightKg) * 10) / 10 : 0

  // Standard approximation: Mifflin TMB change ≈ 10 kcal per kg of weight change
  const estimatedKcalChange = Math.round(weightDiff * 10 * 1.4) // with average activity factor 1.4

  // If weight difference is significant (≥ 1.5 kg or ≥ 50 kcal difference)
  if (Math.abs(weightDiff) >= 1.5) {
    const suggestedTargetKcal = Math.max(1200, Math.round(activePlan.targetKcal + estimatedKcalChange))
    return {
      needsRecalculation: true,
      patientName: `${patient.firstName} ${patient.lastName}`,
      planId: activePlan.id,
      planName: activePlan.name,
      currentTargetKcal: Math.round(activePlan.targetKcal),
      latestWeightKg: latestAnthro.weightKg,
      previousWeightKg: previousAnthro ? previousAnthro.weightKg : null,
      weightDiffKg: weightDiff,
      suggestedTargetKcal,
      message: `Nueva medición registrada (${latestAnthro.weightKg} kg, variación de ${weightDiff > 0 ? '+' : ''}${weightDiff} kg). Se recomienda recalcular los objetivos energéticos del plan "${activePlan.name}" de ${Math.round(activePlan.targetKcal)} kcal a ~${suggestedTargetKcal} kcal.`,
    }
  }

  return {
    needsRecalculation: false,
    weightDiffKg: weightDiff,
    currentTargetKcal: Math.round(activePlan.targetKcal),
  }
}

export async function applyRecalculatedTargetsToPlanAction({
  planId,
  newTargetKcal,
  proteinPct = 30,
  carbsPct = 40,
  fatPct = 30,
}: {
  planId: string
  newTargetKcal: number
  proteinPct?: number
  carbsPct?: number
  fatPct?: number
}) {
  const userId = await requireUserId()
  const plan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
  })
  if (!plan) throw new Error('Plan no encontrado')

  const safeKcal = finiteInRange(newTargetKcal, 'objetivo calórico', 500, 6_000)
  const safeProteinPct = finiteInRange(proteinPct, 'porcentaje de proteína', 0, 100)
  const safeCarbsPct = finiteInRange(carbsPct, 'porcentaje de hidratos', 0, 100)
  const safeFatPct = finiteInRange(fatPct, 'porcentaje de grasas', 0, 100)
  if (Math.abs(safeProteinPct + safeCarbsPct + safeFatPct - 100) > 0.5) {
    throw new Error('Los porcentajes de macros deben sumar 100 %.')
  }

  const targetProteinG = Math.round(((safeKcal * (safeProteinPct / 100)) / 4) * 10) / 10
  const targetCarbsG = Math.round(((safeKcal * (safeCarbsPct / 100)) / 4) * 10) / 10
  const targetFatG = Math.round(((safeKcal * (safeFatPct / 100)) / 9) * 10) / 10

  const updated = await prisma.mealPlan.update({
    where: { id: planId },
    data: {
      targetKcal: safeKcal,
      targetProteinG,
      targetCarbsG,
      targetFatG,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId: plan.patientId,
      action: 'MEAL_PLAN_RECALCULATED',
      entityType: 'MEAL_PLAN',
      entityId: planId,
      details: `Objetivos del plan recalculados tras nueva medición: ${safeKcal} kcal (Prot: ${targetProteinG}g, Carbs: ${targetCarbsG}g, Grasas: ${targetFatG}g).`,
    },
  })

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/patients/${plan.patientId}`)
  return updated
}
