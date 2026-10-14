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
  daysCount: number
  daysData: {
    dayNumber: number
    customName?: string
    meals: {
      mealType: string
      order: number
      items: {
        foodId?: number
        recipeId?: string
        quantityG: number
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
      days: {
        create: input.daysData.map((d) => ({
          dayNumber: d.dayNumber,
          customName: d.customName || null,
          meals: {
            create: d.meals.map((m) => ({
              mealType: m.mealType,
              order: m.order,
              items: {
                create: m.items.map((it) => ({
                  foodId: it.foodId || null,
                  recipeId: it.recipeId || null,
                  quantityG: it.quantityG,
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
  await prisma.mealPlan.delete({
    where: { id, userId },
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

