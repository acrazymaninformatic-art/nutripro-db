/**
 * Configuración clínica del "menú" (pauta): objetivos, reparto por ingesta,
 * tolerancia, modo cetogénico y evaluación de requisitos.
 *
 * Este módulo es puro (sin Prisma ni React) para poder usarse tanto en el
 * servidor como en el cliente.
 */

import { calculateAllBMR, calculateTDEE, type ActivityLevel } from '@/lib/nutrition'

export type MenuStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type TargetUnit = 'ABSOLUTE' | 'PERCENT_KCAL' | 'PER_KG'
export type SemaphoreStatus = 'green' | 'yellow' | 'red'
export type AllergenPolicy = 'BLOCK' | 'CONFIRM' | 'WARN'
export type AutoCalcMode = 'TDEE' | 'DEFICIT' | 'SURPLUS'

export interface MenuMacroTargets {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

export interface MenuTotals extends MenuMacroTargets {
  sugarG: number
  saturatedFatG: number
  sodiumMg: number
}

export interface MenuIngestaSetting {
  mealType: string
  label: string
  enabled: boolean
  order: number
  time: string | null
  percent: number
  overrides?: Partial<MenuMacroTargets>
}

export interface MenuAutoCalc {
  enabled: boolean
  formula: 'MIFFLIN' | 'HARRIS_BENEDICT' | 'KATCH' | 'CUNNINGHAM'
  mode: AutoCalcMode
  activityLevel: ActivityLevel
  deficitPct: number
  surplusPct: number
  proteinPerKg: number
}

export interface MenuSettings {
  targetUnit: TargetUnit
  dailyTargets: MenuMacroTargets
  perDayOverrides: Record<string, Partial<MenuMacroTargets>>
  tolerancePct: number
  ketoMode: boolean
  showMicros: boolean
  microTargets: {
    sodiumMg: number | null
    sugarG: number | null
    saturatedFatG: number | null
  }
  autoCalc: MenuAutoCalc
  ingestas: MenuIngestaSetting[]
  allergenPolicy: AllergenPolicy
}

export interface MenuPatientProfile {
  patientId: string
  firstName: string
  lastName: string
  weightKg: number | null
  heightCm: number | null
  age: number | null
  sex: string | null
  objective: string | null
  allergies: string | null
  intolerances: string | null
  dietaryPreferences: string | null
  dislikedFoods: string | null
  activityLevel: string | null
  servings: number
  importedAt: string
}

export interface MenuIngestaTotals extends MenuTotals {
  mealType: string
  label: string
  order: number
  time: string | null
  percent: number
  items: number
}

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MID_MORNING: 'Media mañana',
  LUNCH: 'Comida',
  SNACK: 'Merienda',
  DINNER: 'Cena',
  LATE_SNACK: 'Recena',
}

export const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export const DEFAULT_INGESTAS: MenuIngestaSetting[] = [
  { mealType: 'BREAKFAST', label: 'Desayuno', enabled: true, order: 0, time: '08:00', percent: 25 },
  { mealType: 'MID_MORNING', label: 'Media mañana', enabled: true, order: 1, time: '11:00', percent: 10 },
  { mealType: 'LUNCH', label: 'Comida', enabled: true, order: 2, time: '14:00', percent: 35 },
  { mealType: 'SNACK', label: 'Merienda', enabled: true, order: 3, time: '17:30', percent: 10 },
  { mealType: 'DINNER', label: 'Cena', enabled: true, order: 4, time: '21:00', percent: 20 },
]

export const STATUS_LABELS: Record<MenuStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
}

export const TARGET_UNIT_LABELS: Record<TargetUnit, string> = {
  ABSOLUTE: 'Valores absolutos (g y kcal)',
  PERCENT_KCAL: 'Porcentaje de las kcal',
  PER_KG: 'Gramos por kilo de peso',
}

export const FORMULA_LABELS: Record<MenuAutoCalc['formula'], string> = {
  MIFFLIN: 'Mifflin-St Jeor',
  HARRIS_BENEDICT: 'Harris-Benedict',
  KATCH: 'Katch-McArdle',
  CUNNINGHAM: 'Cunningham',
}

/* ------------------------------------------------------------------ */
/* Totales                                                            */
/* ------------------------------------------------------------------ */

export interface MenuFoodLike {
  name: string
  category?: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number | null
  sugarG?: number | null
  saturatedFatG?: number | null
  sodiumMg?: number | null
}

export interface MenuItemLike {
  quantityG: number
  food?: MenuFoodLike | null
}

export interface MenuMealLike {
  mealType: string
  order: number
  items: MenuItemLike[]
}

export function emptyTotals(): MenuTotals {
  return {
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    saturatedFatG: 0,
    sodiumMg: 0,
  }
}

export function computeTotals(meals: MenuMealLike[]): MenuTotals {
  const totals = emptyTotals()

  for (const meal of meals) {
    for (const item of meal.items) {
      const food = item.food
      if (!food) continue
      const factor = (item.quantityG || 0) / 100
      if (!factor) continue

      totals.kcal += food.calories * factor
      totals.proteinG += food.proteinG * factor
      totals.carbsG += food.carbsG * factor
      totals.fatG += food.fatG * factor
      totals.fiberG += (food.fiberG || 0) * factor
      totals.sugarG += (food.sugarG || 0) * factor
      totals.saturatedFatG += (food.saturatedFatG || 0) * factor
      totals.sodiumMg += (food.sodiumMg || 0) * factor
    }
  }

  return totals
}

export function computeIngestaTotals(
  meals: MenuMealLike[],
  settings: MenuSettings
): MenuIngestaTotals[] {
  const byType = new Map<string, MenuIngestaTotals>()

  for (const meal of meals) {
    const setting =
      settings.ingestas.find((ingesta) => ingesta.mealType === meal.mealType) ||
      settings.ingestas.find((ingesta) => ingesta.mealType === 'OTHER')

    const totals = computeTotals([meal])
    const entry: MenuIngestaTotals = {
      ...totals,
      mealType: meal.mealType,
      label: setting?.label || MEAL_TYPE_LABELS[meal.mealType] || meal.mealType,
      order: setting?.order ?? 99,
      time: setting?.time ?? null,
      percent: setting?.percent ?? 0,
      items: meal.items.length,
    }
    byType.set(meal.mealType, entry)
  }

  return Array.from(byType.values()).sort((a, b) => a.order - b.order)
}

/* ------------------------------------------------------------------ */
/* Objetivos                                                           */
/* ------------------------------------------------------------------ */

export function defaultMenuSettings(plan: {
  targetKcal?: number
  targetProteinG?: number
  targetCarbsG?: number
  targetFatG?: number
  weightKg?: number | null
}): MenuSettings {
  const kcal = Math.round(plan.targetKcal || 2000)
  const fiberG = Math.round((kcal / 1000) * 14)

  return {
    targetUnit: 'ABSOLUTE',
    dailyTargets: {
      kcal,
      proteinG: Math.round(plan.targetProteinG || 120),
      carbsG: Math.round(plan.targetCarbsG || 220),
      fatG: Math.round(plan.targetFatG || 70),
      fiberG,
    },
    perDayOverrides: {},
    tolerancePct: 5,
    ketoMode: false,
    showMicros: false,
    microTargets: {
      sodiumMg: 2000,
      sugarG: null,
      saturatedFatG: null,
    },
    autoCalc: {
      enabled: false,
      formula: 'MIFFLIN',
      mode: 'DEFICIT',
      activityLevel: 'moderate',
      deficitPct: 20,
      surplusPct: 10,
      proteinPerKg: 1.6,
    },
    ingestas: DEFAULT_INGESTAS.map((ingesta) => ({ ...ingesta })),
    allergenPolicy: 'CONFIRM',
  }
}

export function resolveDayTargets(
  settings: MenuSettings,
  dayNumber: number
): MenuMacroTargets {
  const base = settings.dailyTargets
  const override = settings.perDayOverrides[String(dayNumber)]
  if (!override) return base

  return {
    kcal: override.kcal ?? base.kcal,
    proteinG: override.proteinG ?? base.proteinG,
    carbsG: override.carbsG ?? base.carbsG,
    fatG: override.fatG ?? base.fatG,
    fiberG: override.fiberG ?? base.fiberG,
  }
}

export function resolveIngestaTargets(
  settings: MenuSettings,
  ingesta: MenuIngestaSetting,
  dayTargets: MenuMacroTargets
): MenuMacroTargets {
  const ratio = ingesta.percent / 100
  const derived: MenuMacroTargets = {
    kcal: dayTargets.kcal * ratio,
    proteinG: dayTargets.proteinG * ratio,
    carbsG: dayTargets.carbsG * ratio,
    fatG: dayTargets.fatG * ratio,
    fiberG: dayTargets.fiberG * ratio,
  }

  const overrides = ingesta.overrides || {}
  return {
    kcal: overrides.kcal ?? derived.kcal,
    proteinG: overrides.proteinG ?? derived.proteinG,
    carbsG: overrides.carbsG ?? derived.carbsG,
    fatG: overrides.fatG ?? derived.fatG,
    fiberG: overrides.fiberG ?? derived.fiberG,
  }
}

/* ------------------------------------------------------------------ */
/* Semáforo y ratios                                                   */
/* ------------------------------------------------------------------ */

export interface NutrientEvaluation {
  status: SemaphoreStatus
  pct: number
  delta: number
  message: string
}

/**
 * Semáforo: verde dentro de la tolerancia, amarillo cerca y rojo cuando se
 * pasa con claridad o se queda corto.
 */
export function evaluateNutrient(
  consumed: number,
  target: number,
  tolerancePct: number
): NutrientEvaluation {
  if (!target || target <= 0) {
    return { status: 'green', pct: 0, delta: 0, message: 'Sin objetivo definido' }
  }

  const pct = (consumed / target) * 100
  const deviation = Math.abs(pct - 100)
  const near = tolerancePct * 2

  let status: SemaphoreStatus = 'green'
  if (deviation > near) status = 'red'
  else if (deviation > tolerancePct) status = 'yellow'

  const delta = consumed - target
  let message: string
  if (Math.abs(delta) < 0.5) message = 'Objetivo alcanzado'
  else if (delta < 0) message = `Faltan ${formatNumber(Math.abs(delta))}`
  else message = `Te pasas ${formatNumber(Math.abs(delta))}`

  return { status, pct, delta, message }
}

export function formatNumber(value: number, decimals = 1) {
  if (!Number.isFinite(value)) return '0'
  const rounded = Number(value.toFixed(decimals))
  return rounded.toLocaleString('es-ES', {
    minimumFractionDigits: decimals > 0 ? 1 : 0,
    maximumFractionDigits: decimals > 0 ? 1 : 0,
  })
}

const OBJECTIVE_LABELS: Record<string, string> = {
  weight_loss: 'Pérdida de peso',
  maintenance: 'Mantenimiento',
  muscle_gain: 'Ganancia de masa',
  performance: 'Rendimiento deportivo',
  health: 'Salud general',
  health_improvement: 'Mejora de la salud',
  sports_performance: 'Rendimiento deportivo',
  other: 'Otro',
}

/** Etiqueta legible del objetivo almacenado en la ficha del paciente. */
export function objectiveLabel(objective: string | null | undefined) {
  if (!objective) return '—'
  return OBJECTIVE_LABELS[objective.toLowerCase()] || objective
}

export function ketoRatio(totals: Pick<MenuTotals, 'fatG' | 'proteinG' | 'carbsG'>) {
  const denominator = totals.proteinG + totals.carbsG
  if (!denominator) return 0
  return totals.fatG / denominator
}

export function formatKetoRatio(value: number) {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ------------------------------------------------------------------ */
/* Cálculo automático de kcal desde la ficha del paciente             */
/* ------------------------------------------------------------------ */

export interface AutoCalcInput {
  weightKg: number
  heightCm: number
  age: number
  sex: 'male' | 'female'
  bodyFatPct?: number | null
  activityLevel: ActivityLevel
  formula: MenuAutoCalc['formula']
  mode: AutoCalcMode
  deficitPct: number
  surplusPct: number
  proteinPerKg: number
}

export interface AutoCalcResult {
  bmr: number
  tdee: number
  kcal: number
  proteinG: number
  note: string
}

export function autoCalculateTargets(input: AutoCalcInput): AutoCalcResult {
  const bmrResults = calculateAllBMR(
    {
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      ageYears: input.age,
      sex: input.sex,
    },
    input.bodyFatPct ?? undefined
  )

  const bmr =
    input.formula === 'HARRIS_BENEDICT'
      ? bmrResults.harrisBenedict
      : input.formula === 'KATCH'
        ? bmrResults.katchMcArdle ?? 0
        : input.formula === 'CUNNINGHAM'
          ? bmrResults.cunningham ?? 0
          : bmrResults.mifflinStJeor

  const usableBmr = bmr > 0 ? bmr : bmrResults.mifflinStJeor
  const tdee = calculateTDEE(usableBmr, input.activityLevel)

  let kcal = tdee
  let note = 'Mantenimiento calórico (TDEE)'

  if (input.mode === 'DEFICIT') {
    kcal = tdee * (1 - input.deficitPct / 100)
    note = `Déficit del ${input.deficitPct} % sobre el TDEE`
  } else if (input.mode === 'SURPLUS') {
    kcal = tdee * (1 + input.surplusPct / 100)
    note = `Superávit del ${input.surplusPct} % sobre el TDEE`
  }

  const proteinG = Math.round(input.weightKg * input.proteinPerKg)

  return {
    bmr: Math.round(usableBmr),
    tdee: Math.round(tdee),
    kcal: Math.round(kcal),
    proteinG,
    note,
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades varias                                                  */
/* ------------------------------------------------------------------ */

export function buildInternalCode() {
  const random = Math.random().toString(16).slice(2, 10).toUpperCase()
  const stamp = Date.now().toString(16).toUpperCase()
  return `MENU_${stamp}${random}`
}

export function ingestasPercentSum(settings: MenuSettings) {
  return settings.ingestas
    .filter((ingesta) => ingesta.enabled)
    .reduce((total, ingesta) => total + (ingesta.percent || 0), 0)
}

export function distributeIngestasEvenly(settings: MenuSettings): MenuSettings {
  const active = settings.ingestas.filter((ingesta) => ingesta.enabled)
  if (active.length === 0) return settings

  const base = Math.floor((100 / active.length) * 10) / 10
  const distributed = active.map((ingesta, index) => ({
    ...ingesta,
    percent: index === active.length - 1 ? Number((100 - base * (active.length - 1)).toFixed(1)) : base,
  }))

  return {
    ...settings,
    ingestas: settings.ingestas.map((ingesta) => {
      const match = distributed.find((item) => item.mealType === ingesta.mealType)
      return match ? { ...ingesta, percent: match.percent } : ingesta
    }),
  }
}

export function moveIngesta(settings: MenuSettings, mealType: string, direction: -1 | 1): MenuSettings {
  const ordered = [...settings.ingestas].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex((ingesta) => ingesta.mealType === mealType)
  const target = index + direction
  if (index < 0 || target < 0 || target >= ordered.length) return settings

  const swapped = [...ordered]
  ;[swapped[index], swapped[target]] = [swapped[target], swapped[index]]

  return {
    ...settings,
    ingestas: settings.ingestas.map((ingesta) => {
      const newIndex = swapped.findIndex((item) => item.mealType === ingesta.mealType)
      return { ...ingesta, order: newIndex }
    }),
  }
}

export function safeParseSettings(raw: string | null | undefined): MenuSettings | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as MenuSettings
  } catch {
    return null
  }
}
