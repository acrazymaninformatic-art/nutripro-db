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
  const where: any = { AND: [foodScope(userId)] }

  if (search && search.trim() !== '') {
    where.AND.push({ name: {
      contains: search.trim(),
    } })
  }

  if (category && category !== 'ALL') {
    where.AND.push({ category })
  }

  const [total, foods] = await Promise.all([
    prisma.food.count({ where }),
    prisma.food.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: Math.max(0, (page - 1) * pageSize),
      take: pageSize,
    }),
  ])

  return {
    foods,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
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

  // Reassign RecipeIngredient items from duplicate to primary
  const reassignRecipes = await prisma.recipeIngredient.updateMany({
    where: { foodId: duplicateFoodId },
    data: { foodId: primaryFoodId },
  })

  // Reassign MealItem items from duplicate to primary
  const reassignMeals = await prisma.mealItem.updateMany({
    where: { foodId: duplicateFoodId },
    data: { foodId: primaryFoodId },
  })

  // Record audit merge log
  await prisma.foodDuplicateMergeLog.create({
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

  // Safely delete duplicate food
  await prisma.food.delete({
    where: { id: duplicateFoodId },
  })

  revalidatePath('/dashboard/foods')
  revalidatePath('/dashboard/recipes')
  revalidatePath('/dashboard/plans')

  return {
    success: true,
    mergedName: duplicate.name,
    primaryName: primary.name,
    reassignedRecipes: reassignRecipes.count,
    reassignedMeals: reassignMeals.count,
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
  if (!foodIds || foodIds.length === 0) return { updatedCount: 0 }

  const dataToUpdate: any = {}
  if (updates.category) dataToUpdate.category = updates.category
  if (typeof updates.isFavorite === 'boolean') dataToUpdate.isFavorite = updates.isFavorite
  if (typeof updates.isPrivate === 'boolean') dataToUpdate.isPrivate = updates.isPrivate
  if (updates.dietaryTags) dataToUpdate.dietaryTagsJson = JSON.stringify(updates.dietaryTags)

  const result = await prisma.food.updateMany({
    where: { AND: [foodScope(userId), { id: { in: foodIds } }] },
    data: dataToUpdate,
  })

  revalidatePath('/dashboard/foods')
  return { updatedCount: result.count }
}

export async function createFood(formData: FormData) {
  const userId = await requireUserId()
  const name = formData.get('name') as string
  const category = (formData.get('category') as string) || 'Otros'
  const servingSize = parseFloat(formData.get('servingSize') as string) || 100
  const calories = parseFloat(formData.get('calories') as string) || 0
  const proteinG = parseFloat(formData.get('proteinG') as string) || 0
  const carbsG = parseFloat(formData.get('carbsG') as string) || 0
  const fatG = parseFloat(formData.get('fatG') as string) || 0
  const fiberG = parseFloat(formData.get('fiberG') as string) || 0
  const sodiumMg = parseFloat(formData.get('sodiumMg') as string) || 0

  // 5.6 Extras
  const potassiumMg = parseFloat(formData.get('potassiumMg') as string) || 0
  const calciumMg = parseFloat(formData.get('calciumMg') as string) || 0
  const ironMg = parseFloat(formData.get('ironMg') as string) || 0
  const magnesiumMg = parseFloat(formData.get('magnesiumMg') as string) || 0
  const zincMg = parseFloat(formData.get('zincMg') as string) || 0
  const iodineUg = parseFloat(formData.get('iodineUg') as string) || 0
  const omega3G = parseFloat(formData.get('omega3G') as string) || 0
  const addedSugarsG = parseFloat(formData.get('addedSugarsG') as string) || 0
  const solubleFiberG = parseFloat(formData.get('solubleFiberG') as string) || 0
  const insolubleFiberG = parseFloat(formData.get('insolubleFiberG') as string) || 0
  const glycemicIndex = formData.get('glycemicIndex') ? parseFloat(formData.get('glycemicIndex') as string) : null
  const glycemicLoad = formData.get('glycemicLoad') ? parseFloat(formData.get('glycemicLoad') as string) : null
  const fodmapCategory = (formData.get('fodmapCategory') as string) || null
  const purinesMg = parseFloat(formData.get('purinesMg') as string) || 0
  const oxalatesMg = parseFloat(formData.get('oxalatesMg') as string) || 0
  const nutriScore = (formData.get('nutriScore') as string) || null
  const novaGroup = formData.get('novaGroup') ? parseInt(formData.get('novaGroup') as string) : null
  const cookedConversionFactor = formData.get('cookedConversionFactor') ? parseFloat(formData.get('cookedConversionFactor') as string) : null
  const ediblePartPercentage = formData.get('ediblePartPercentage') ? parseFloat(formData.get('ediblePartPercentage') as string) : 100
  const barcode = (formData.get('barcode') as string) || null
  const brandName = (formData.get('brandName') as string) || null
  const dataSource = (formData.get('dataSource') as string) || 'PROPIO'
  const isSupplement = formData.get('isSupplement') === 'true'
  const supplementDose = (formData.get('supplementDose') as string) || null
  const pricePerKg = formData.get('pricePerKg') ? parseFloat(formData.get('pricePerKg') as string) : null
  const carbonFootprintKgCo2 = formData.get('carbonFootprintKgCo2') ? parseFloat(formData.get('carbonFootprintKgCo2') as string) : null
  const waterFootprintLiters = formData.get('waterFootprintLiters') ? parseFloat(formData.get('waterFootprintLiters') as string) : null

  const allergensRaw = formData.get('allergensJson') as string
  const dietaryTagsRaw = formData.get('dietaryTagsJson') as string
  const householdMeasuresRaw = formData.get('householdMeasuresJson') as string

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
      allergensJson: allergensRaw || '[]',
      dietaryTagsJson: dietaryTagsRaw || '[]',
      householdMeasuresJson: householdMeasuresRaw || '[]',
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
