'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'

async function getDefaultUserId(): Promise<string> {
  return requireUserId()
}

export async function getRecipes() {
  const userId = await requireUserId()
  return await prisma.recipe.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      ingredients: {
        include: {
          food: true,
        },
      },
    },
  })
}

export async function getRecipe(id: string) {
  const userId = await requireUserId()
  return await prisma.recipe.findFirst({
    where: { id, userId },
    include: {
      ingredients: {
        include: {
          food: true,
        },
      },
    },
  })
}

export interface CreateRecipeInput {
  name: string
  description?: string
  servings: number
  prepTimeMin?: number
  cookTimeMin?: number
  instructions: string
  category?: string
  ingredients: {
    foodId: number
    quantityG: number
    notes?: string
  }[]
}

export async function createRecipe(input: CreateRecipeInput) {
  const userId = await getDefaultUserId()

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      name: input.name,
      description: input.description || null,
      servings: input.servings || 1,
      prepTimeMin: input.prepTimeMin || null,
      cookTimeMin: input.cookTimeMin || null,
      instructions: input.instructions,
      category: input.category || 'General',
      ingredients: {
        create: input.ingredients.map(ing => ({
          foodId: ing.foodId,
          quantityG: ing.quantityG,
          notes: ing.notes || null,
        })),
      },
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/recipes')
  return recipe
}

export async function deleteRecipe(id: string) {
  const userId = await requireUserId()
  await prisma.recipe.delete({
    where: { id, userId },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/recipes')
}
