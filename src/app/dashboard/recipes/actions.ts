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
  dietaryTags?: string[]
  difficulty?: string
  estimatedCost?: number
  equipment?: string[]
  isBatchCooking?: boolean
  isFreezable?: boolean
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
      dietaryTagsJson: JSON.stringify(input.dietaryTags || []),
      difficulty: input.difficulty || 'FACIL',
      estimatedCost: input.estimatedCost || null,
      equipmentJson: JSON.stringify(input.equipment || []),
      isBatchCooking: Boolean(input.isBatchCooking),
      isFreezable: Boolean(input.isFreezable),
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

/**
 * Duplica una receta con sus ingredientes para poder crear una variante
 * (por ejemplo, cambiar el pescado o las raciones de un ingrediente).
 */
export async function duplicateRecipe(id: string) {
  const userId = await requireUserId()

  const source = await prisma.recipe.findFirst({
    where: { id, userId },
    include: { ingredients: true },
  })

  if (!source) throw new Error('Receta no encontrada.')

  const copy = await prisma.recipe.create({
    data: {
      userId,
      name: `${source.name} (copia)`,
      description: source.description,
      servings: source.servings,
      prepTimeMin: source.prepTimeMin,
      cookTimeMin: source.cookTimeMin,
      instructions: source.instructions,
      category: source.category,
      imageUrl: source.imageUrl,
      dietaryTagsJson: source.dietaryTagsJson,
      difficulty: source.difficulty,
      estimatedCost: source.estimatedCost,
      equipmentJson: source.equipmentJson,
      isBatchCooking: source.isBatchCooking,
      isFreezable: source.isFreezable,
      ingredients: {
        create: source.ingredients.map((ingredient) => ({
          foodId: ingredient.foodId,
          quantityG: ingredient.quantityG,
          notes: ingredient.notes,
        })),
      },
    },
  })

  revalidatePath('/dashboard/recipes')

  return { id: copy.id }
}
