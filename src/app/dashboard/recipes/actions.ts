'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { assertFoodIdsAccessible } from '@/lib/authorization'

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

function readRecipeNumber(
  value: unknown,
  label: string,
  options: { min: number; max: number; integer?: boolean }
): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (
    !Number.isFinite(parsed) ||
    parsed < options.min ||
    parsed > options.max ||
    (options.integer && !Number.isInteger(parsed))
  ) {
    throw new Error(`El campo "${label}" no contiene un número válido.`)
  }
  return parsed
}

function readOptionalRecipeNumber(
  value: unknown,
  label: string,
  options: { min: number; max: number }
): number | null {
  if (value === undefined || value === null || value === '') return null
  return readRecipeNumber(value, label, options)
}

function readStringList(value: unknown, label: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 50) {
    throw new Error(`El campo "${label}" no contiene una lista válida.`)
  }
  if (value.some((item) => typeof item !== 'string' || item.length > 100)) {
    throw new Error(`El campo "${label}" contiene valores no válidos.`)
  }
  return value
}

export async function createRecipe(input: CreateRecipeInput) {
  const userId = await getDefaultUserId()
  if (!input || typeof input !== 'object') throw new Error('Los datos de la receta no son válidos.')

  const name = String(input.name || '').trim()
  if (name.length < 2 || name.length > 200) {
    throw new Error('El nombre de la receta debe tener entre 2 y 200 caracteres.')
  }
  const description = String(input.description || '').trim().slice(0, 5_000) || null
  const instructions = String(input.instructions || '').trim().slice(0, 20_000)
  const servings = readRecipeNumber(input.servings ?? 1, 'raciones', { min: 0.5, max: 100 })
  const prepTimeMin = readOptionalRecipeNumber(input.prepTimeMin, 'tiempo de preparación', {
    min: 0,
    max: 10_000,
  })
  const cookTimeMin = readOptionalRecipeNumber(input.cookTimeMin, 'tiempo de cocción', {
    min: 0,
    max: 10_000,
  })
  const estimatedCost = readOptionalRecipeNumber(input.estimatedCost, 'coste estimado', {
    min: 0,
    max: 1_000_000,
  })
  const dietaryTags = readStringList(input.dietaryTags, 'etiquetas dietéticas')
  const equipment = readStringList(input.equipment, 'equipamiento')

  if (!Array.isArray(input.ingredients) || input.ingredients.length === 0 || input.ingredients.length > 200) {
    throw new Error('La receta debe tener entre 1 y 200 ingredientes.')
  }
  const ingredients = input.ingredients.map((ingredient, index) => {
    if (!ingredient || typeof ingredient !== 'object') {
      throw new Error(`El ingrediente ${index + 1} no es válido.`)
    }
    const foodId = readRecipeNumber(ingredient.foodId, `alimento del ingrediente ${index + 1}`, {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      integer: true,
    })
    const quantityG = readRecipeNumber(ingredient.quantityG, `cantidad del ingrediente ${index + 1}`, {
      min: 0.1,
      max: 100_000,
    })
    return {
      foodId,
      quantityG,
      notes: String(ingredient.notes || '').trim().slice(0, 500) || null,
    }
  })
  await assertFoodIdsAccessible(
    userId,
    ingredients.map((ingredient) => ingredient.foodId)
  )

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      name,
      description,
      servings,
      prepTimeMin,
      cookTimeMin,
      instructions,
      category: String(input.category || 'General').trim().slice(0, 100) || 'General',
      dietaryTagsJson: JSON.stringify(dietaryTags),
      difficulty: String(input.difficulty || 'FACIL').trim().slice(0, 50) || 'FACIL',
      estimatedCost,
      equipmentJson: JSON.stringify(equipment),
      isBatchCooking: Boolean(input.isBatchCooking),
      isFreezable: Boolean(input.isFreezable),
      ingredients: {
        create: ingredients,
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
