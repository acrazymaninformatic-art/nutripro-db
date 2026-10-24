/**
 * Cálculo nutricional único para planes, comparador, dossier, portal y lista
 * de la compra. Los valores nutricionales de `Food` están expresados por 100 g.
 * Las recetas se expanden a sus ingredientes y se escalan por el número de
 * raciones servidas; nunca se tratan como si fueran un alimento.
 */

export interface NutritionFood {
  id?: number
  name: string
  category?: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sodiumMg?: number
  potassiumMg?: number
  calciumMg?: number
  ironMg?: number
  magnesiumMg?: number
  zincMg?: number
  vitaminCMg?: number
  folateUg?: number
  novaGroup?: number | null
  pricePerKg?: number | null
}

export interface NutritionRecipeIngredient {
  quantityG: number
  food?: NutritionFood | null
}

export interface NutritionRecipe {
  id?: string
  name: string
  servings: number
  ingredients?: NutritionRecipeIngredient[] | null
}

export interface NutritionMealItem {
  quantityG: number
  servings?: number | null
  food?: NutritionFood | null
  recipe?: NutritionRecipe | null
}

export interface NutritionTotals {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sodiumMg: number
  potassiumMg: number
  calciumMg: number
  ironMg: number
  magnesiumMg: number
  zincMg: number
  vitaminCMg: number
  folateUg: number
}

export interface ExpandedPlanFood {
  food: NutritionFood
  quantityG: number
  /** Fracción de la ración de receta servida (1 = una ración completa). */
  recipeFraction?: number
  recipeName?: string
}

export interface MealItemNutrition extends NutritionTotals {
  /** Gramos equivalentes totales que se muestran al paciente. */
  displayQuantityG: number
}

export function emptyNutritionTotals(): NutritionTotals {
  return {
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sodiumMg: 0,
    potassiumMg: 0,
    calciumMg: 0,
    ironMg: 0,
    magnesiumMg: 0,
    zincMg: 0,
    vitaminCMg: 0,
    folateUg: 0,
  }
}

function scaleFood(food: NutritionFood, grams: number): NutritionTotals {
  const factor = Math.max(0, grams) / 100
  return {
    kcal: (food.calories || 0) * factor,
    proteinG: (food.proteinG || 0) * factor,
    carbsG: (food.carbsG || 0) * factor,
    fatG: (food.fatG || 0) * factor,
    fiberG: (food.fiberG || 0) * factor,
    sodiumMg: (food.sodiumMg || 0) * factor,
    potassiumMg: (food.potassiumMg || 0) * factor,
    calciumMg: (food.calciumMg || 0) * factor,
    ironMg: (food.ironMg || 0) * factor,
    magnesiumMg: (food.magnesiumMg || 0) * factor,
    zincMg: (food.zincMg || 0) * factor,
    vitaminCMg: (food.vitaminCMg || 0) * factor,
    folateUg: (food.folateUg || 0) * factor,
  }
}

export function addNutritionTotals(target: NutritionTotals, addition: NutritionTotals): NutritionTotals {
  return {
    kcal: target.kcal + addition.kcal,
    proteinG: target.proteinG + addition.proteinG,
    carbsG: target.carbsG + addition.carbsG,
    fatG: target.fatG + addition.fatG,
    fiberG: target.fiberG + addition.fiberG,
    sodiumMg: target.sodiumMg + addition.sodiumMg,
    potassiumMg: target.potassiumMg + addition.potassiumMg,
    calciumMg: target.calciumMg + addition.calciumMg,
    ironMg: target.ironMg + addition.ironMg,
    magnesiumMg: target.magnesiumMg + addition.magnesiumMg,
    zincMg: target.zincMg + addition.zincMg,
    vitaminCMg: target.vitaminCMg + addition.vitaminCMg,
    folateUg: target.folateUg + addition.folateUg,
  }
}

/**
 * Fracción de receta servida por una línea del plan. `servings` es la fuente
 * principal porque es lo que se muestra al paciente; si no está disponible se
 * usa el peso de la ración frente al peso total de los ingredientes.
 */
export function getRecipeServingFraction(item: NutritionMealItem): number {
  const recipe = item.recipe
  if (!recipe) return 0
  const recipeServings = Math.max(1, Number(recipe.servings) || 1)
  const servedServings = Number(item.servings)
  if (Number.isFinite(servedServings) && servedServings > 0) {
    return servedServings / recipeServings
  }
  const totalRecipeGrams = (recipe.ingredients || []).reduce(
    (sum, ingredient) => sum + Math.max(0, Number(ingredient.quantityG) || 0),
    0
  )
  if (totalRecipeGrams > 0 && item.quantityG > 0) {
    return Math.min(10, item.quantityG / totalRecipeGrams)
  }
  return 1 / recipeServings
}

export function expandMealItem(item: NutritionMealItem): ExpandedPlanFood[] {
  if (item.food) {
    return [{ food: item.food, quantityG: Math.max(0, Number(item.quantityG) || 0) }]
  }
  if (!item.recipe) return []
  const fraction = getRecipeServingFraction(item)
  return (item.recipe.ingredients || [])
    .filter((ingredient) => Boolean(ingredient.food))
    .map((ingredient) => ({
      food: ingredient.food!,
      quantityG: Math.max(0, Number(ingredient.quantityG) || 0) * fraction,
      recipeFraction: fraction,
      recipeName: item.recipe!.name,
    }))
}

export function getMealItemNutrition(item: NutritionMealItem): MealItemNutrition {
  const totals = emptyNutritionTotals()
  let displayQuantityG = 0
  for (const expanded of expandMealItem(item)) {
    const scaled = scaleFood(expanded.food, expanded.quantityG)
    Object.assign(totals, addNutritionTotals(totals, scaled))
    displayQuantityG += expanded.quantityG
  }
  if (item.food) displayQuantityG = Math.max(0, Number(item.quantityG) || 0)
  return { ...totals, displayQuantityG }
}

export function getMealNutrition(items: NutritionMealItem[]): NutritionTotals {
  return items.reduce((totals, item) => {
    const summary = getMealItemNutrition(item)
    return addNutritionTotals(totals, summary)
  }, emptyNutritionTotals())
}

export function getDayNutrition(items: NutritionMealItem[]): NutritionTotals {
  return getMealNutrition(items)
}

export interface ShoppingListEntry {
  name: string
  category?: string | null
  totalG: number
  food: NutritionFood
}

/**
 * Lista de la compra real: expande recetas y agrega por alimento, no por plato.
 * Ignora las alternativas opcionales para no duplicar la compra.
 */
export function buildShoppingList(
  meals: Array<{ items: Array<NutritionMealItem & { isAlternative?: boolean }> }>
): ShoppingListEntry[] {
  const aggregated = new Map<string, ShoppingListEntry>()
  for (const meal of meals) {
    for (const item of meal.items) {
      if (item.isAlternative) continue
      for (const expanded of expandMealItem(item)) {
        const key = `${expanded.food.id ?? expanded.food.name}|${expanded.food.name}`.toLowerCase()
        const existing = aggregated.get(key)
        if (existing) {
          existing.totalG += expanded.quantityG
        } else {
          aggregated.set(key, {
            name: expanded.food.name,
            category: expanded.food.category,
            totalG: expanded.quantityG,
            food: expanded.food,
          })
        }
      }
    }
  }
  return Array.from(aggregated.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
