'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'

function foodScope(userId: string) {
  // The seeded catalogue is shared (userId = null). Custom foods remain
  // private to their owner.
  return { OR: [{ userId: null, isPrivate: false }, { userId }] }
}

export async function getFoods(
  search?: string,
  category?: string,
  page: number = 1,
  pageSize: number = 40
) {
  const userId = await requireUserId()
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
  const safePageSize = Number.isFinite(pageSize) ? Math.min(200, Math.max(1, Math.floor(pageSize))) : 40
  const searchTerm = typeof search === 'string' ? search.trim().slice(0, 100) : ''
  const where: any = { AND: [foodScope(userId)] }

  if (searchTerm) {
    where.AND.push({ name: {
      contains: searchTerm,
    } })
  }

  if (category && category !== 'ALL') {
    where.AND.push({ category: String(category).slice(0, 100) })
  }

  const [total, foods] = await Promise.all([
    prisma.food.count({ where }),
    prisma.food.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
  ])

  return {
    foods,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  }
}


export async function getCategories() {
  const userId = await requireUserId()
  const foods = await prisma.food.findMany({
    where: foodScope(userId),
    select: { category: true },
    distinct: ['category'],
  })
  return foods.map(f => f.category).filter(Boolean) as string[]
}

export async function getAllFoodsForBrowser() {
  const userId = await requireUserId()
  return prisma.food.findMany({
    where: foodScope(userId),
    select: {
      id: true,
      name: true,
      category: true,
      calories: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
      fiberG: true,
      sugarG: true,
      saturatedFatG: true,
      monounsaturatedFatG: true,
      polyunsaturatedFatG: true,
      cholesterolMg: true,
      sodiumMg: true,
      potassiumMg: true,
      calciumMg: true,
      ironMg: true,
      magnesiumMg: true,
      zincMg: true,
      iodineUg: true,
      omega3G: true,
      addedSugarsG: true,
      solubleFiberG: true,
      insolubleFiberG: true,
      glycemicIndex: true,
      glycemicLoad: true,
      fodmapCategory: true,
      purinesMg: true,
      oxalatesMg: true,
      nutriScore: true,
      novaGroup: true,
      householdMeasuresJson: true,
      cookedConversionFactor: true,
      ediblePartPercentage: true,
      allergensJson: true,
      dietaryTagsJson: true,
      barcode: true,
      brandName: true,
      dataSource: true,
      isFavorite: true,
      isPrivate: true,
      isSupplement: true,
      supplementDose: true,
      seasonMonthsJson: true,
      pricePerKg: true,
      carbonFootprintKgCo2: true,
      waterFootprintLiters: true,
      imageUrl: true,
      source: true,
    },
    orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
  })
}

export async function getFoodByBarcode(barcode: string) {
  const userId = await requireUserId()
  if (!barcode || !barcode.trim()) return null
  return prisma.food.findFirst({
    where: {
      AND: [foodScope(userId), { barcode: barcode.trim() }],
    },
  })
}

export async function toggleFoodFavorite(foodId: number) {
  const userId = await requireUserId()
  const food = await prisma.food.findFirst({
    where: { AND: [foodScope(userId), { id: foodId }] },
    select: { isFavorite: true },
  })
  if (!food) throw new Error('Alimento no encontrado')

  const updated = await prisma.food.update({
    where: { id: foodId },
    data: { isFavorite: !food.isFavorite },
  })

  revalidatePath('/dashboard/foods')
  return updated
}

export async function mergeDuplicateFoods(primaryFoodId: number, duplicateFoodId: number) {
  const userId = await requireUserId()
  if (primaryFoodId === duplicateFoodId) {
    throw new Error('El alimento principal y el duplicado no pueden ser el mismo.')
  }

  const [primary, duplicate] = await Promise.all([
    prisma.food.findFirst({ where: { AND: [foodScope(userId), { id: primaryFoodId }] } }),
    prisma.food.findFirst({ where: { AND: [foodScope(userId), { id: duplicateFoodId }] } }),
  ])

  if (!primary || !duplicate) {
    throw new Error('Uno o ambos alimentos a fusionar no existen.')
  }
  // Los alimentos globales son compartidos por toda la instalación. Fusionar
  // o borrar uno de ellos alteraría recetas y planes ajenos al profesional.
  if (primary.userId !== userId || duplicate.userId !== userId) {
    throw new Error('Solo puedes fusionar alimentos propios; los alimentos globales son de solo lectura.')
  }

  // La reasignación, la auditoría y el borrado forman una sola operación. Si
  // algo falla, no queda un duplicado a medio fusionar ni referencias movidas.
  const counts = await prisma.$transaction(async (tx) => {
    const reassignRecipes = await tx.recipeIngredient.updateMany({
      where: { foodId: duplicateFoodId, recipe: { userId } },
      data: { foodId: primaryFoodId },
    })

    const reassignMeals = await tx.mealItem.updateMany({
      where: {
        foodId: duplicateFoodId,
        meal: { dayPlan: { mealPlan: { userId } } },
      },
      data: { foodId: primaryFoodId },
    })

    await tx.foodDuplicateMergeLog.create({
      data: {
        userId,
        primaryFoodId,
        mergedFoodId: duplicateFoodId,
        primaryFoodName: primary.name,
        mergedFoodName: duplicate.name,
        mergedRecipeItemsCount: reassignRecipes.count,
        mergedMealItemsCount: reassignMeals.count,
      },
    })

    const deleted = await tx.food.deleteMany({
      where: { id: duplicateFoodId, userId },
    })
    if (deleted.count !== 1) throw new Error('El alimento duplicado ha cambiado. Recarga e inténtalo de nuevo.')

    return {
      recipes: reassignRecipes.count,
      meals: reassignMeals.count,
    }
  })

  revalidatePath('/dashboard/foods')
  revalidatePath('/dashboard/recipes')
  revalidatePath('/dashboard/plans')

  return {
    success: true,
    mergedName: duplicate.name,
    primaryName: primary.name,
    reassignedRecipes: counts.recipes,
    reassignedMeals: counts.meals,
  }
}

export async function bulkUpdateFoods(
  foodIds: number[],
  updates: {
    category?: string
    isFavorite?: boolean
    isPrivate?: boolean
    dietaryTags?: string[]
  }
) {
  const userId = await requireUserId()
  if (!updates || typeof updates !== 'object') {
    throw new Error('Los cambios del catálogo no son válidos.')
  }
  if (
    !Array.isArray(foodIds) ||
    foodIds.length === 0 ||
    foodIds.length > 500 ||
    foodIds.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    return { updatedCount: 0 }
  }

  const dataToUpdate: {
    category?: string
    isFavorite?: boolean
    isPrivate?: boolean
    dietaryTagsJson?: string
  } = {}
  if (updates.category !== undefined) {
    const category = String(updates.category).trim().slice(0, 100)
    if (!category) throw new Error('La categoría no es válida.')
    dataToUpdate.category = category
  }
  if (typeof updates.isFavorite === 'boolean') dataToUpdate.isFavorite = updates.isFavorite
  if (typeof updates.isPrivate === 'boolean') dataToUpdate.isPrivate = updates.isPrivate
  if (updates.dietaryTags !== undefined) {
    if (
      !Array.isArray(updates.dietaryTags) ||
      updates.dietaryTags.length > 100 ||
      updates.dietaryTags.some((tag) => typeof tag !== 'string' || tag.length > 100)
    ) {
      throw new Error('Las etiquetas dietéticas no son válidas.')
    }
    dataToUpdate.dietaryTagsJson = JSON.stringify(updates.dietaryTags)
  }

  if (Object.keys(dataToUpdate).length === 0) return { updatedCount: 0 }

  // Los campos clínicos y de catálogo (categoría, privacidad, etiquetas) solo
  // se pueden modificar en alimentos propios. El favorito es una preferencia
  // cosmética y puede aplicarse también a los alimentos globales.
  const touchesSharedFields =
    dataToUpdate.category !== undefined ||
    dataToUpdate.isPrivate !== undefined ||
    dataToUpdate.dietaryTagsJson !== undefined
  const where = touchesSharedFields
    ? { AND: [{ userId }, { id: { in: foodIds } }] }
    : { AND: [foodScope(userId), { id: { in: foodIds } }] }

  const result = await prisma.food.updateMany({
    where,
    data: dataToUpdate,
  })

  revalidatePath('/dashboard/foods')
  return { updatedCount: result.count }
}

function readNumericField(
  formData: FormData,
  field: string,
  options: { min?: number; max?: number; fallback?: number } = {}
): number {
  const raw = formData.get(field)
  if (raw === null || String(raw).trim() === '') return options.fallback ?? 0
  const value = Number(String(raw).trim().replace(',', '.'))
  const min = options.min ?? 0
  const max = options.max ?? 1_000_000
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`El campo "${field}" no contiene un número válido.`)
  }
  return value
}

function readOptionalNumericField(
  formData: FormData,
  field: string,
  options: { min?: number; max?: number } = {}
): number | null {
  const raw = formData.get(field)
  if (raw === null || String(raw).trim() === '') return null
  return readNumericField(formData, field, options)
}

function readStringArrayField(formData: FormData, field: string): string[] {
  const raw = formData.get(field)
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    throw new Error(`El campo "${field}" no contiene una lista válida.`)
  }
  if (!Array.isArray(parsed) || parsed.length > 100) {
    throw new Error(`El campo "${field}" no contiene una lista válida.`)
  }
  if (parsed.some((value) => typeof value !== 'string' || value.length > 100)) {
    throw new Error(`El campo "${field}" contiene valores no válidos.`)
  }
  return parsed
}

function readJsonArrayField(formData: FormData, field: string): unknown[] {
  const raw = formData.get(field)
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    throw new Error(`El campo "${field}" no contiene una lista válida.`)
  }
  if (!Array.isArray(parsed) || parsed.length > 100) {
    throw new Error(`El campo "${field}" no contiene una lista válida.`)
  }
  return parsed
}

export async function createFood(formData: FormData) {
  const userId = await requireUserId()
  const name = String(formData.get('name') || '').trim()
  if (name.length < 2 || name.length > 200) throw new Error('El nombre del alimento debe tener entre 2 y 200 caracteres.')
  const category = String(formData.get('category') || 'Otros').trim().slice(0, 100) || 'Otros'
  const servingSize = readNumericField(formData, 'servingSize', { min: 1, max: 100_000, fallback: 100 })
  const calories = readNumericField(formData, 'calories', { max: 100_000 })
  const proteinG = readNumericField(formData, 'proteinG', { max: 100_000 })
  const carbsG = readNumericField(formData, 'carbsG', { max: 100_000 })
  const fatG = readNumericField(formData, 'fatG', { max: 100_000 })
  const fiberG = readNumericField(formData, 'fiberG', { max: 100_000 })
  const sodiumMg = readNumericField(formData, 'sodiumMg', { max: 1_000_000 })

  // 5.6 Extras
  const potassiumMg = readNumericField(formData, 'potassiumMg', { max: 1_000_000 })
  const calciumMg = readNumericField(formData, 'calciumMg', { max: 1_000_000 })
  const ironMg = readNumericField(formData, 'ironMg', { max: 100_000 })
  const magnesiumMg = readNumericField(formData, 'magnesiumMg', { max: 1_000_000 })
  const zincMg = readNumericField(formData, 'zincMg', { max: 100_000 })
  const iodineUg = readNumericField(formData, 'iodineUg', { max: 100_000 })
  const omega3G = readNumericField(formData, 'omega3G', { max: 100_000 })
  const addedSugarsG = readNumericField(formData, 'addedSugarsG', { max: 100_000 })
  const solubleFiberG = readNumericField(formData, 'solubleFiberG', { max: 100_000 })
  const insolubleFiberG = readNumericField(formData, 'insolubleFiberG', { max: 100_000 })
  const glycemicIndex = readOptionalNumericField(formData, 'glycemicIndex', { max: 100 })
  const glycemicLoad = readOptionalNumericField(formData, 'glycemicLoad', { max: 1_000 })
  const fodmapCategory = String(formData.get('fodmapCategory') || '').trim().slice(0, 100) || null
  const purinesMg = readNumericField(formData, 'purinesMg', { max: 100_000 })
  const oxalatesMg = readNumericField(formData, 'oxalatesMg', { max: 100_000 })
  const nutriScore = String(formData.get('nutriScore') || '').trim().slice(0, 10) || null
  const novaGroup = readOptionalNumericField(formData, 'novaGroup', { min: 1, max: 4 })
  if (novaGroup !== null && !Number.isInteger(novaGroup)) {
    throw new Error('El grupo NOVA debe ser un número entero entre 1 y 4.')
  }
  const cookedConversionFactor = readOptionalNumericField(formData, 'cookedConversionFactor', { min: 0.1, max: 10 })
  const ediblePartPercentage = readOptionalNumericField(formData, 'ediblePartPercentage', { max: 100 }) ?? 100
  const barcode = String(formData.get('barcode') || '').trim().slice(0, 64) || null
  const brandName = String(formData.get('brandName') || '').trim().slice(0, 200) || null
  const dataSource = String(formData.get('dataSource') || 'PROPIO').trim().slice(0, 50) || 'PROPIO'
  const isSupplement = formData.get('isSupplement') === 'true'
  const supplementDose = String(formData.get('supplementDose') || '').trim().slice(0, 200) || null
  const pricePerKg = readOptionalNumericField(formData, 'pricePerKg', { max: 1_000_000_000 })
  const carbonFootprintKgCo2 = readOptionalNumericField(formData, 'carbonFootprintKgCo2', { max: 1_000_000_000 })
  const waterFootprintLiters = readOptionalNumericField(formData, 'waterFootprintLiters', { max: 1_000_000_000 })

  const allergens = readStringArrayField(formData, 'allergensJson')
  const dietaryTags = readStringArrayField(formData, 'dietaryTagsJson')
  const householdMeasures = readJsonArrayField(formData, 'householdMeasuresJson')

  const food = await prisma.food.create({
    data: {
      userId,
      name,
      category,
      servingSize,
      servingUnit: 'g',
      calories,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      sodiumMg,
      potassiumMg,
      calciumMg,
      ironMg,
      magnesiumMg,
      zincMg,
      iodineUg,
      omega3G,
      addedSugarsG,
      solubleFiberG,
      insolubleFiberG,
      glycemicIndex,
      glycemicLoad,
      fodmapCategory,
      purinesMg,
      oxalatesMg,
      nutriScore,
      novaGroup,
      cookedConversionFactor,
      ediblePartPercentage,
      barcode: barcode?.trim() || null,
      brandName: brandName?.trim() || null,
      dataSource,
      isSupplement,
      supplementDose,
      pricePerKg,
      carbonFootprintKgCo2,
      waterFootprintLiters,
      allergensJson: JSON.stringify(allergens),
      dietaryTagsJson: JSON.stringify(dietaryTags),
      householdMeasuresJson: JSON.stringify(householdMeasures),
      source: 'custom',
    },
  })

  revalidatePath('/dashboard/foods')
  revalidatePath('/dashboard/recipes')
  revalidatePath('/dashboard/plans')
  return food
}

export async function deleteFood(id: number) {
  const userId = await requireUserId()
  if (!await prisma.food.findFirst({ where: { id, userId }, select: { id: true } })) throw new Error('Alimento no encontrado.')
  await prisma.food.delete({
    where: { id },
  })

  revalidatePath('/dashboard/foods')
}
