'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'

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
    where: { id: patientId, userId },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!patient) throw new Error('Paciente no encontrado')

  const record = await prisma.calculatorResultRecord.create({
    data: {
      patientId,
      formula,
      bmrKcal,
      tdeeKcal,
      activityFactor,
      specialNeedsJson: specialNeeds ? JSON.stringify(specialNeeds) : null,
      stepsOrMetsJson: stepsOrMets ? JSON.stringify(stepsOrMets) : null,
      weightPredictionJson: weightPrediction ? JSON.stringify(weightPrediction) : null,
      cardiovascularRiskJson: cardiovascularRisk ? JSON.stringify(cardiovascularRisk) : null,
      micronutrientDriJson: micronutrientDri ? JSON.stringify(micronutrientDri) : null,
      notes: notes || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId,
      action: 'CALCULATOR_ASSESSMENT_SAVED',
      entityType: 'CALCULATOR',
      entityId: record.id,
      details: `Cálculo metabólico y evaluación clínica guardados en la ficha (TMB ${bmrKcal} kcal, Gasto ${tdeeKcal} kcal con fórmula ${formula}).`,
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

  const targetProteinG = Math.round(((newTargetKcal * (proteinPct / 100)) / 4) * 10) / 10
  const targetCarbsG = Math.round(((newTargetKcal * (carbsPct / 100)) / 4) * 10) / 10
  const targetFatG = Math.round(((newTargetKcal * (fatPct / 100)) / 9) * 10) / 10

  const updated = await prisma.mealPlan.update({
    where: { id: planId },
    data: {
      targetKcal: newTargetKcal,
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
      details: `Objetivos del plan recalculados tras nueva medición: ${newTargetKcal} kcal (Prot: ${targetProteinG}g, Carbs: ${targetCarbsG}g, Grasas: ${targetFatG}g).`,
    },
  })

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/patients/${plan.patientId}`)
  return updated
}
