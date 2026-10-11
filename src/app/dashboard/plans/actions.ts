'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst()
  if (!user) throw new Error('Usuario no encontrado.')
  return user.id
}

export async function getMealPlans() {
  return await prisma.mealPlan.findMany({
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
  return await prisma.mealPlan.findUnique({
    where: { id },
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
  await prisma.mealPlan.delete({
    where: { id },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')
}
