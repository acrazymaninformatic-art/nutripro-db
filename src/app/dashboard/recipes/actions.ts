'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst()
  if (!user) {
    throw new Error('Usuario no encontrado.')
  }
  return user.id
}

export async function getRecipes() {
  return await prisma.recipe.findMany({
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
  return await prisma.recipe.findUnique({
    where: { id },
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
  await prisma.recipe.delete({
    where: { id },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/recipes')
}
