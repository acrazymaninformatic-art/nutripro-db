import { describe, expect, it } from 'vitest'
import {
  buildShoppingList,
  expandMealItem,
  getMealItemNutrition,
  getRecipeServingFraction,
  type NutritionFood,
} from '@/lib/nutrition/plan-nutrition'

const chicken: NutritionFood = {
  id: 1,
  name: 'Pechuga de pollo',
  category: 'Carnes',
  calories: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
  fiberG: 0,
  sodiumMg: 74,
}

const rice: NutritionFood = {
  id: 2,
  name: 'Arroz cocido',
  category: 'Cereales',
  calories: 130,
  proteinG: 2.7,
  carbsG: 28,
  fatG: 0.3,
  fiberG: 0.4,
}

describe('cálculo nutricional de planes', () => {
  it('escala alimentos por los gramos servidos', () => {
    const nutrition = getMealItemNutrition({ food: chicken, quantityG: 200 })
    expect(nutrition.kcal).toBe(330)
    expect(nutrition.proteinG).toBe(62)
    expect(nutrition.displayQuantityG).toBe(200)
  })

  it('expande una receta por ración servida y no como si fuera un alimento', () => {
    const recipe = {
      id: 'recipe-1',
      name: 'Pollo con arroz',
      servings: 2,
      ingredients: [
        { quantityG: 200, food: chicken },
        { quantityG: 150, food: rice },
      ],
    }

    expect(getRecipeServingFraction({ recipe, quantityG: 350, servings: 1 })).toBe(0.5)

    const expanded = expandMealItem({ recipe, quantityG: 350, servings: 1 })
    expect(expanded).toHaveLength(2)
    expect(expanded[0].quantityG).toBe(100)
    expect(expanded[1].quantityG).toBe(75)

    const nutrition = getMealItemNutrition({ recipe, quantityG: 350, servings: 1 })
    // 100 g de pollo + 75 g de arroz
    expect(nutrition.kcal).toBeCloseTo(165 + 97.5, 5)
    expect(nutrition.displayQuantityG).toBe(175)
  })

  it('usa el peso frente al total de la receta cuando no hay raciones explícitas', () => {
    const recipe = {
      name: 'Receta',
      servings: 4,
      ingredients: [
        { quantityG: 100, food: chicken },
        { quantityG: 300, food: rice },
      ],
    }
    expect(getRecipeServingFraction({ recipe, quantityG: 200, servings: null })).toBe(0.5)
  })

  it('genera la lista de la compra agregando ingredientes y omitiendo alternativas', () => {
    const meals = [
      {
        items: [
          { food: chicken, quantityG: 100 },
          { recipe: { name: 'Arroz', servings: 1, ingredients: [{ quantityG: 200, food: rice }] }, quantityG: 200, servings: 1 },
          { food: rice, quantityG: 50, isAlternative: true },
        ],
      },
      {
        items: [{ food: chicken, quantityG: 50 }],
      },
    ]

    const list = buildShoppingList(meals)
    expect(list).toHaveLength(2)
    expect(list.find((entry) => entry.name === 'Pechuga de pollo')?.totalG).toBe(150)
    expect(list.find((entry) => entry.name === 'Arroz cocido')?.totalG).toBe(200)
  })
})
