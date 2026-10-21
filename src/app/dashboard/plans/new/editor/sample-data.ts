/**
 * Datos de ejemplo para probar el editor de menús sin depender de datos
 * reales: una semana completa de 5 ingestas con alimentos del catálogo.
 */

import { DAY_NAMES, DEFAULT_INGESTA_META, uid, type EditorDayMeta, type EditorGrid, type EditorFood } from './types'

interface SampleItem {
  name: string
  grams: number
}

const BREAKFAST: SampleItem[] = [
  { name: 'Avena integral', grams: 40 },
  { name: 'Leche desnatada', grams: 200 },
  { name: 'Plátano', grams: 120 },
]

const MID_MORNING: SampleItem[] = [
  { name: 'Yogur natural', grams: 125 },
  { name: 'Nueces', grams: 20 },
]

const LUNCH: SampleItem[] = [
  { name: 'Pechuga de pollo', grams: 150 },
  { name: 'Arroz integral', grams: 80 },
  { name: 'Ensalada verde', grams: 150 },
  { name: 'Aceite de oliva virgen extra', grams: 10 },
]

const SNACK: SampleItem[] = [
  { name: 'Manzana', grams: 150 },
  { name: 'Queso fresco', grams: 60 },
]

const DINNER: SampleItem[] = [
  { name: 'Merluza', grams: 150 },
  { name: 'Patata', grams: 180 },
  { name: 'Tomate', grams: 120 },
  { name: 'Aceite de oliva virgen extra', grams: 8 },
]

const SAMPLE_WEEK: SampleItem[][] = [
  BREAKFAST,
  MID_MORNING,
  LUNCH,
  SNACK,
  DINNER,
]

const MEAL_TYPE_BY_LABEL: Record<string, string> = {
  'Desayuno': 'BREAKFAST',
  'Media mañana': 'MID_MORNING',
  'Comida': 'LUNCH',
  'Merienda': 'SNACK',
  'Cena': 'DINNER',
}

function findFood(foods: EditorFood[], name: string): EditorFood | undefined {
  const normalized = name.toLowerCase()
  return (
    foods.find((food) => food.name.toLowerCase() === normalized) ||
    foods.find((food) => food.name.toLowerCase().includes(normalized)) ||
    foods.find((food) => normalized.includes(food.name.toLowerCase().split(' ')[0]))
  )
}

/**
 * Construye una cuadrícula de ejemplo a partir de los alimentos cargados.
 * Si algún alimento no existe en el catálogo, se omite (sin romper la demo).
 */
export function buildSampleGrid(foods: EditorFood[]): EditorGrid {
  const grid: EditorGrid = {}

  Object.entries(MEAL_TYPE_BY_LABEL).forEach(([label, mealType]) => {
    grid[mealType] = {}
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const rotation = SAMPLE_WEEK[dayIndex % SAMPLE_WEEK.length].map((item, itemIndex) => ({
        ...item,
        name:
          itemIndex === 0 && dayIndex % 3 === 1
            ? 'Tostada de tomate'
            : itemIndex === 1 && dayIndex % 4 === 2
              ? 'Té verde'
              : item.name,
      }))

      grid[mealType][dayIndex] = rotation
        .map((item) => {
          const food = findFood(foods, item.name)
          if (!food) return null
          return {
            uid: uid('sample'),
            foodId: food.id,
            quantityG: item.grams,
            notes: 'Preparación al gusto',
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    }
  })

  return grid
}

export function buildSampleDayMeta(): EditorDayMeta[] {
  return DAY_NAMES.map((name, index) => ({
    name,
    notes: index === 0 ? 'Primer día de la semana: priorizar hidratación.' : '',
    completed: false,
  }))
}

export function buildSampleIngestaMeta() {
  return DEFAULT_INGESTA_META.map((ingesta) => ({ ...ingesta }))
}

export const SAMPLE_PATIENT = {
  id: 'sample-patient',
  name: 'Paciente de ejemplo',
  firstName: 'Paciente',
  allergies: 'frutos secos',
  intolerances: 'lactosa',
  dietaryPreferences: 'mediterránea',
}
