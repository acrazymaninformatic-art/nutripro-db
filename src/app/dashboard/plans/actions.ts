'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'

async function getDefaultUserId(): Promise<string> {
  return requireUserId()
}

export async function getMealPlans() {
  const userId = await requireUserId()
  return await prisma.mealPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: true,
      days: {
        include: {
          meals: {
            include: {
              items: {
                include: {
                  food: true,
                  recipe: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function getMealPlan(id: string) {
  const userId = await requireUserId()
  return await prisma.mealPlan.findFirst({
    where: { id, userId },
    include: {
      patient: true,
      days: {
        orderBy: { dayNumber: 'asc' },
        include: {
          meals: {
            orderBy: { order: 'asc' },
            include: {
              items: {
                include: {
                  food: true,
                  recipe: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

export interface CreateMealPlanInput {
  patientId: string
  name: string
  startDate: string
  endDate?: string
  targetKcal: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  notes?: string
  hideCaloriesTCA?: boolean
  isGLP1?: boolean
  planningModel?: string
  currentPhase?: string
  autoTransitionDate?: string
  targetKcalRest?: number
  targetCarbsGRest?: number
  targetProteinGRest?: number
  targetFatGRest?: number
  targetKcalMin?: number
  targetKcalMax?: number
  targetProteinGMin?: number
  targetProteinGMax?: number
  hydrationTargetLiters?: number
  eatingOutGuide?: string
  daysCount: number
  daysData: {
    dayNumber: number
    customName?: string
    meals: {
      mealType: string
      order: number
      isOptionB?: boolean
      optionGroup?: string
      isCheatMeal?: boolean
      timingType?: string
      items: {
        foodId?: number
        recipeId?: string
        quantityG: number
        servings?: number
        exchangeServings?: number
        exchangeGroup?: string
        portionMeasureName?: string
        portionMeasureGrams?: number
        isAlternative?: boolean
        notes?: string
      }[]
    }[]
  }[]
}

export async function createMealPlan(input: CreateMealPlanInput) {
  const userId = await getDefaultUserId()
  if (!await prisma.patient.findFirst({ where: { id: input.patientId, userId }, select: { id: true } })) throw new Error('Paciente no encontrado.')

  const mealPlan = await prisma.mealPlan.create({
    data: {
      patientId: input.patientId,
      userId,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      targetKcal: input.targetKcal,
      targetProteinG: input.targetProteinG,
      targetCarbsG: input.targetCarbsG,
      targetFatG: input.targetFatG,
      notes: input.notes || null,
      hideCaloriesTCA: Boolean(input.hideCaloriesTCA),
      isGLP1: Boolean(input.isGLP1),
      planningModel: input.planningModel || 'TRADITIONAL',
      currentPhase: input.currentPhase || null,
      autoTransitionDate: input.autoTransitionDate ? new Date(input.autoTransitionDate) : null,
      targetKcalRest: input.targetKcalRest || null,
      targetCarbsGRest: input.targetCarbsGRest || null,
      targetProteinGRest: input.targetProteinGRest || null,
      targetFatGRest: input.targetFatGRest || null,
      targetKcalMin: input.targetKcalMin || null,
      targetKcalMax: input.targetKcalMax || null,
      targetProteinGMin: input.targetProteinGMin || null,
      targetProteinGMax: input.targetProteinGMax || null,
      hydrationTargetLiters: input.hydrationTargetLiters || 2.0,
      eatingOutGuide: input.eatingOutGuide || null,
      status: 'DRAFT',
      isSharedWithPatient: false,
      days: {
        create: input.daysData.map((d) => ({
          dayNumber: d.dayNumber,
          customName: d.customName || null,
          meals: {
            create: d.meals.map((m) => ({
              mealType: m.mealType,
              order: m.order,
              isOptionB: Boolean(m.isOptionB),
              optionGroup: m.optionGroup || null,
              isCheatMeal: Boolean(m.isCheatMeal),
              timingType: m.timingType || 'REGULAR',
              items: {
                create: m.items.map((it) => ({
                  foodId: it.foodId || null,
                  recipeId: it.recipeId || null,
                  quantityG: it.quantityG,
                  servings: it.servings || 1,
                  exchangeServings: it.exchangeServings || null,
                  exchangeGroup: it.exchangeGroup || null,
                  portionMeasureName: it.portionMeasureName || null,
                  portionMeasureGrams: it.portionMeasureGrams || null,
                  isAlternative: Boolean(it.isAlternative),
                  notes: it.notes || null,
                })),
              },
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/patients/${input.patientId}`)
  return mealPlan
}

export async function deleteMealPlan(id: string) {
  const userId = await requireUserId()
  await prisma.mealPlan.update({
    where: { id, userId },
    data: { isActive: false, status: 'ARCHIVED' },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')
}

export async function restoreMealPlan(id: string) {
  const userId = await requireUserId()
  await prisma.mealPlan.update({
    where: { id, userId },
    data: { isActive: true, status: 'PUBLISHED' },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')
}

export async function publishMealPlan(planId: string, checklistNotes?: string) {
  const userId = await requireUserId()
  const plan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true, patientId: true, name: true },
  })
  if (!plan) throw new Error('Plan no encontrado.')

  const updated = await prisma.mealPlan.update({
    where: { id: planId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedBy: 'Eva Vidal',
      checklistPassed: true,
      clinicalChecklistNotes: checklistNotes || null,
      isSharedWithPatient: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId: plan.patientId,
      action: 'MEAL_PLAN_PUBLISHED',
      entityType: 'MEAL_PLAN',
      entityId: planId,
      details: `Plan nutricional "${plan.name}" validado clínicamente y publicado para el paciente.`,
    },
  })

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/patients/${plan.patientId}`)
  revalidatePath('/paciente/plan')
  return updated
}

export async function duplicateMealPlan(planId: string, targetPatientId?: string) {
  const userId = await requireUserId()
  const sourcePlan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
    include: {
      days: {
        include: {
          meals: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  if (!sourcePlan) throw new Error('Plan no encontrado para duplicar')

  const patientId = targetPatientId || sourcePlan.patientId

  const duplicated = await prisma.mealPlan.create({
    data: {
      userId,
      patientId,
      name: `${sourcePlan.name} (Copia)`,
      startDate: new Date(),
      endDate: sourcePlan.endDate,
      targetKcal: sourcePlan.targetKcal,
      targetProteinG: sourcePlan.targetProteinG,
      targetCarbsG: sourcePlan.targetCarbsG,
      targetFatG: sourcePlan.targetFatG,
      notes: sourcePlan.notes,
      hideCaloriesTCA: sourcePlan.hideCaloriesTCA,
      isGLP1: sourcePlan.isGLP1,
      planningModel: sourcePlan.planningModel,
      currentPhase: sourcePlan.currentPhase,
      targetKcalRest: sourcePlan.targetKcalRest,
      targetCarbsGRest: sourcePlan.targetCarbsGRest,
      targetProteinGRest: sourcePlan.targetProteinGRest,
      targetFatGRest: sourcePlan.targetFatGRest,
      targetKcalMin: sourcePlan.targetKcalMin,
      targetKcalMax: sourcePlan.targetKcalMax,
      targetProteinGMin: sourcePlan.targetProteinGMin,
      targetProteinGMax: sourcePlan.targetProteinGMax,
      hydrationTargetLiters: sourcePlan.hydrationTargetLiters,
      eatingOutGuide: sourcePlan.eatingOutGuide,
      status: 'DRAFT',
      isSharedWithPatient: false,
      days: {
        create: sourcePlan.days.map((d) => ({
          dayNumber: d.dayNumber,
          customName: d.customName,
          meals: {
            create: d.meals.map((m) => ({
              mealType: m.mealType,
              order: m.order,
              isOptionB: m.isOptionB,
              optionGroup: m.optionGroup,
              isCheatMeal: m.isCheatMeal,
              timingType: m.timingType,
              items: {
                create: m.items.map((it) => ({
                  foodId: it.foodId,
                  recipeId: it.recipeId,
                  quantityG: it.quantityG,
                  servings: it.servings,
                  exchangeServings: it.exchangeServings,
                  exchangeGroup: it.exchangeGroup,
                  portionMeasureName: it.portionMeasureName,
                  portionMeasureGrams: it.portionMeasureGrams,
                  isAlternative: it.isAlternative,
                  notes: it.notes,
                })),
              },
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/dashboard/plans')
  return duplicated
}

export async function renewMealPlanVersion(planId: string) {
  const userId = await requireUserId()
  const sourcePlan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
    include: {
      days: {
        include: {
          meals: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  if (!sourcePlan) throw new Error('Plan original no encontrado')

  const nextVersion = sourcePlan.version + 1

  const newVersion = await prisma.mealPlan.create({
    data: {
      userId,
      patientId: sourcePlan.patientId,
      name: `${sourcePlan.name.replace(/\s*\(v\d+\)$/, '')} (v${nextVersion})`,
      startDate: new Date(),
      endDate: null,
      targetKcal: sourcePlan.targetKcal,
      targetProteinG: sourcePlan.targetProteinG,
      targetCarbsG: sourcePlan.targetCarbsG,
      targetFatG: sourcePlan.targetFatG,
      notes: sourcePlan.notes,
      hideCaloriesTCA: sourcePlan.hideCaloriesTCA,
      isGLP1: sourcePlan.isGLP1,
      planningModel: sourcePlan.planningModel,
      currentPhase: sourcePlan.currentPhase,
      version: nextVersion,
      previousVersionId: sourcePlan.id,
      status: 'DRAFT',
      isSharedWithPatient: false,
      days: {
        create: sourcePlan.days.map((d) => ({
          dayNumber: d.dayNumber,
          customName: d.customName,
          meals: {
            create: d.meals.map((m) => ({
              mealType: m.mealType,
              order: m.order,
              isOptionB: m.isOptionB,
              optionGroup: m.optionGroup,
              isCheatMeal: m.isCheatMeal,
              timingType: m.timingType,
              items: {
                create: m.items.map((it) => ({
                  foodId: it.foodId,
                  recipeId: it.recipeId,
                  quantityG: it.quantityG,
                  servings: it.servings,
                  exchangeServings: it.exchangeServings,
                  exchangeGroup: it.exchangeGroup,
                  portionMeasureName: it.portionMeasureName,
                  portionMeasureGrams: it.portionMeasureGrams,
                  isAlternative: it.isAlternative,
                  notes: it.notes,
                })),
              },
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/dashboard/plans')
  return newVersion
}

export async function checkPatientAversionWarning(patientId: string, foodName: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { foodAversions: true },
  })

  if (!patient || !patient.foodAversions) return null

  const aversions = patient.foodAversions
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const foodLower = foodName.toLowerCase()
  for (const av of aversions) {
    if (foodLower.includes(av)) {
      return `Aviso clínico: El alimento "${foodName}" coincide con el rechazo/aversión anotado en la ficha del paciente ("${av}").`
    }
  }

  return null
}

