/**
 * Tipos y utilidades del editor de menús (cuadrícula semanal).
 * Compartidos entre la pantalla de creación de pautas y el panel lateral.
 */

import {
  computeIngestaTotals,
  computeTotals,
  resolveDayTargets,
  type MenuIngestaSetting,
  type MenuMacroTargets,
  type MenuSettings,
  type MenuTotals,
} from '@/lib/menu-config'

export interface EditorFood {
  id: number
  name: string
  category: string | null
  imageUrl: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  saturatedFatG: number
  sodiumMg: number
}

export interface EditorItem {
  uid: string
  foodId: number
  quantityG: number
  notes: string
}

export type EditorGrid = Record<string, Record<number, EditorItem[]>>

export interface EditorDayMeta {
  name: string
  notes: string
  completed: boolean
}

export interface EditorIngestaMeta {
  label: string
  time: string
  enabled: boolean
  collapsed: boolean
  locked: boolean
  notes: string
  color: string
  percent: number
}

export const DAY_NAMES = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

export const DEFAULT_INGESTA_META: EditorIngestaMeta[] = [
  {
    label: 'Desayuno',
    time: '08:00',
    enabled: true,
    collapsed: false,
    locked: false,
    notes: '',
    color: '#f59e0b',
    percent: 25,
  },
  {
    label: 'Media mañana',
    time: '11:00',
    enabled: true,
    collapsed: false,
    locked: false,
    notes: '',
    color: '#38bdf8',
    percent: 10,
  },
  {
    label: 'Comida',
    time: '14:00',
    enabled: true,
    collapsed: false,
    locked: false,
    notes: '',
    color: '#22c55e',
    percent: 35,
  },
  {
    label: 'Merienda',
    time: '17:30',
    enabled: true,
    collapsed: false,
    locked: false,
    notes: '',
    color: '#a855f7',
    percent: 10,
  },
  {
    label: 'Cena',
    time: '21:00',
    enabled: true,
    collapsed: false,
    locked: false,
    notes: '',
    color: '#ef4444',
    percent: 20,
  },
]

export const MACRO_CHIP_STYLES = {
  kcal: 'bg-blue-100 text-blue-800 border-blue-200',
  carbs: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  protein: 'bg-red-100 text-red-800 border-red-200',
  fat: 'bg-amber-100 text-amber-900 border-amber-200',
  fiber: 'bg-purple-100 text-purple-800 border-purple-200',
} as const

export function uid(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Copia profunda del grid (los arrays de items son inmutables). */
export function cloneGrid(grid: EditorGrid): EditorGrid {
  const next: EditorGrid = {}
  for (const [mealType, days] of Object.entries(grid)) {
    next[mealType] = {}
    for (const [dayIndex, items] of Object.entries(days)) {
      next[mealType][Number(dayIndex)] = items.map((item) => ({ ...item }))
    }
  }
  return next
}

/** Estructura canónica de días (la misma que consume el panel de información). */
export interface CanonicalDay {
  dayNumber: number
  name: string
  meals: Array<{
    mealType: string
    order: number
    items: Array<{
      quantityG: number
      food: EditorFood | null
    }>
  }>
}

export function buildCanonicalDays(
  grid: EditorGrid,
  foodMap: Map<number, EditorFood>,
  dayMeta: EditorDayMeta[],
  ingestas: Array<{ type: string; order: number }>
): CanonicalDay[] {
  return dayMeta.map((day, dayIndex) => ({
    dayNumber: dayIndex + 1,
    name: day.name,
    meals: ingestas.map((ingesta) => ({
      mealType: ingesta.type,
      order: ingesta.order,
      items: (grid[ingesta.type]?.[dayIndex] || []).map((item) => ({
        quantityG: item.quantityG,
        food: foodMap.get(item.foodId) || null,
      })),
    })),
  }))
}

export interface PanelMetrics {
  dayTotals: MenuTotals[]
  weekAverage: MenuTotals
  weekPoints: Array<{ dayNumber: number; label: string; totals: MenuTotals }>
  ingestasByDay: Array<ReturnType<typeof computeIngestaTotals>>
}

/** Calcula todos los indicadores del panel lateral en tiempo real. */
export function computePanelMetrics(
  days: CanonicalDay[],
  settings: MenuSettings,
  dayMeta: EditorDayMeta[]
): PanelMetrics {
  const dayTotals = days.map((day) => computeTotals(day.meals))
  const weekPoints = days.map((day, index) => ({
    dayNumber: day.dayNumber,
    label: dayMeta[index]?.name || `Día ${day.dayNumber}`,
    totals: dayTotals[index],
  }))

  const weekAverage = weekPoints.length
    ? weekPoints.reduce(
        (acc, point) => ({
          kcal: acc.kcal + point.totals.kcal / weekPoints.length,
          proteinG: acc.proteinG + point.totals.proteinG / weekPoints.length,
          carbsG: acc.carbsG + point.totals.carbsG / weekPoints.length,
          fatG: acc.fatG + point.totals.fatG / weekPoints.length,
          fiberG: acc.fiberG + point.totals.fiberG / weekPoints.length,
          sugarG: acc.sugarG + point.totals.sugarG / weekPoints.length,
          saturatedFatG: acc.saturatedFatG + point.totals.saturatedFatG / weekPoints.length,
          sodiumMg: acc.sodiumMg + point.totals.sodiumMg / weekPoints.length,
        }),
        {
          kcal: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          fiberG: 0,
          sugarG: 0,
          saturatedFatG: 0,
          sodiumMg: 0,
        }
      )
    : computeTotals([])

  const ingestasByDay = days.map((day) => computeIngestaTotals(day.meals, settings))

  return { dayTotals, weekAverage, weekPoints, ingestasByDay }
}

/** Objetivos del día (con los ajustes por día de entrenamiento/descanso). */
export function targetsForDay(settings: MenuSettings, dayNumber: number): MenuMacroTargets {
  return resolveDayTargets(settings, dayNumber)
}

/** Reparto de las ingestas: normaliza a 100 % cuando procede. */
export function ingestasToSettings(
  ingestas: EditorIngestaMeta[],
  existing: MenuSettings
): MenuSettings {
  const order = new Map(ingestas.map((ingesta) => [ingesta.label, ingesta.percent]))
  const settingsIngestas: MenuIngestaSetting[] = existing.ingestas.map((ingesta) => ({
    ...ingesta,
    enabled: ingestas.find((item) => item.label === ingesta.label)?.enabled ?? ingesta.enabled,
    label: ingestas.find((item) => item.label === ingesta.label)?.label ?? ingesta.label,
    time: ingestas.find((item) => item.label === ingesta.label)?.time ?? ingesta.time,
    percent:
      order.get(ingesta.label) ??
      ingestas.find((item) => item.label === ingesta.label)?.percent ??
      ingesta.percent,
  }))

  return { ...existing, ingestas: settingsIngestas }
}

/** Suma del reparto porcentual de las ingestas activas. */
export function percentSum(ingestas: EditorIngestaMeta[]) {
  return ingestas
    .filter((ingesta) => ingesta.enabled)
    .reduce((total, ingesta) => total + (ingesta.percent || 0), 0)
}

/** Reparte el porcentaje de forma equitativa entre las ingestas activas. */
export function distributeEquitably(ingestas: EditorIngestaMeta[]): EditorIngestaMeta[] {
  const active = ingestas.filter((ingesta) => ingesta.enabled)
  if (active.length === 0) return ingestas

  const base = Math.floor((100 / active.length) * 10) / 10
  let assigned = 0

  return ingestas.map((ingesta) => {
    if (!ingesta.enabled) return { ...ingesta, percent: 0 }

    const activeIndex = active.findIndex((item) => item.label === ingesta.label)
    const isLast = activeIndex === active.length - 1
    const percent = isLast ? Math.round((100 - assigned) * 10) / 10 : base
    assigned = Math.round((assigned + percent) * 10) / 10
    return { ...ingesta, percent }
  })
}
