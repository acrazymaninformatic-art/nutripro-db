import type {
  MenuIngestaSetting,
  MenuMacroTargets,
  MenuSettings,
} from '@/lib/menu-config'

/**
 * Validación de la configuración de menú que cruza la frontera del servidor.
 * El editor puede enviar cualquier JSON: aquí se comprueba la forma, se
 * limitan los rangos clínicos y se reconstruye un objeto sin campos extra.
 */

const TARGET_UNITS = new Set(['ABSOLUTE', 'PERCENT_KCAL', 'PER_KG'])
const AUTO_FORMULAS = new Set(['MIFFLIN', 'HARRIS_BENEDICT', 'KATCH', 'CUNNINGHAM'])
const AUTO_MODES = new Set(['TDEE', 'DEFICIT', 'SURPLUS'])
const ACTIVITY_LEVELS = new Set(['sedentary', 'light', 'moderate', 'active', 'very_active'])
const ALLERGEN_POLICIES = new Set(['BLOCK', 'CONFIRM', 'WARN'])
const MEAL_TYPES = new Set([
  'BREAKFAST',
  'MID_MORNING',
  'LUNCH',
  'SNACK',
  'DINNER',
  'LATE_SNACK',
  'OTHER',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readNumber(
  value: unknown,
  label: string,
  min: number,
  max: number,
  options: { integer?: boolean } = {}
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} debe ser un número válido.`)
  }
  if (value < min || value > max) {
    throw new Error(`${label} debe estar entre ${min} y ${max}.`)
  }
  if (options.integer && !Number.isInteger(value)) {
    throw new Error(`${label} debe ser un número entero.`)
  }
  return value
}

function readBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} debe ser verdadero o falso.`)
  return value
}

function readString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') throw new Error(`${label} debe ser texto.`)
  const normalized = value.trim()
  if (!normalized) throw new Error(`${label} no puede estar vacío.`)
  if (normalized.length > maxLength) {
    throw new Error(`${label} supera el tamaño máximo permitido.`)
  }
  return normalized
}

function readMacros(value: unknown, label: string, partial: boolean): Partial<MenuMacroTargets> {
  if (!isRecord(value)) throw new Error(`${label} no tiene un formato válido.`)

  const fields: Array<keyof MenuMacroTargets> = ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG']
  const result: Partial<MenuMacroTargets> = {}
  for (const field of fields) {
    if (value[field] === undefined) {
      if (!partial) throw new Error(`${label} debe incluir ${field}.`)
      continue
    }
    result[field] = readNumber(
      value[field],
      `${label}.${field}`,
      field === 'kcal' ? 0 : 0,
      field === 'kcal' ? 10_000 : field === 'fiberG' ? 500 : 2_000
    )
  }
  if (partial && Object.keys(result).length === 0) {
    throw new Error(`${label} no contiene ningún objetivo válido.`)
  }
  return result
}

function readIngesta(value: unknown, index: number): MenuIngestaSetting {
  if (!isRecord(value)) throw new Error(`La ingesta ${index + 1} no tiene un formato válido.`)
  const mealType = readString(value.mealType, `La ingesta ${index + 1}`, 40)
  if (!MEAL_TYPES.has(mealType)) throw new Error(`El tipo de ingesta "${mealType}" no es válido.`)
  const label = readString(value.label, `La etiqueta de la ingesta ${index + 1}`, 80)
  const enabled = readBoolean(value.enabled, `El estado de la ingesta ${index + 1}`)
  const order = readNumber(value.order, `El orden de la ingesta ${index + 1}`, 0, 20, {
    integer: true,
  })
  const percent = readNumber(value.percent, `El porcentaje de la ingesta ${index + 1}`, 0, 100)
  let time: string | null = null
  if (value.time !== null) {
    if (typeof value.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)) {
      throw new Error(`La hora de la ingesta ${index + 1} no es válida.`)
    }
    time = value.time
  }

  const overrides =
    value.overrides === undefined
      ? undefined
      : readMacros(value.overrides, `Los objetivos de la ingesta ${index + 1}`, true)

  return {
    mealType,
    label,
    enabled,
    order,
    time,
    percent,
    ...(overrides ? { overrides } : {}),
  }
}

export function validateMenuSettings(value: unknown): MenuSettings {
  if (!isRecord(value)) throw new Error('La configuración del menú no es válida.')

  const targetUnit = readString(value.targetUnit, 'La unidad de objetivos', 30)
  if (!TARGET_UNITS.has(targetUnit)) throw new Error('La unidad de objetivos no es válida.')

  const dailyTargets = readMacros(value.dailyTargets, 'Los objetivos diarios', false) as MenuMacroTargets

  if (!isRecord(value.perDayOverrides)) {
    throw new Error('Los objetivos por día no tienen un formato válido.')
  }
  const perDayOverrides: Record<string, Partial<MenuMacroTargets>> = {}
  for (const [day, override] of Object.entries(value.perDayOverrides)) {
    if (!/^([1-9]|[12][0-9]|3[01])$/.test(day)) {
      throw new Error('Los objetivos por día contienen un día no válido.')
    }
    perDayOverrides[day] = readMacros(override, `Los objetivos del día ${day}`, true)
  }

  const tolerancePct = readNumber(value.tolerancePct, 'La tolerancia', 0, 50)
  const ketoMode = readBoolean(value.ketoMode, 'El modo cetogénico')
  const showMicros = readBoolean(value.showMicros, 'La visualización de micronutrientes')

  if (!isRecord(value.microTargets)) {
    throw new Error('Los objetivos de micronutrientes no tienen un formato válido.')
  }
  const readOptionalMicro = (field: 'sodiumMg' | 'sugarG' | 'saturatedFatG', max: number) => {
    const raw = value.microTargets
    if (!isRecord(raw)) throw new Error('Los objetivos de micronutrientes no son válidos.')
    if (raw[field] === null) return null
    return readNumber(raw[field], `El micronutriente ${field}`, 0, max)
  }
  const microTargets = {
    sodiumMg: readOptionalMicro('sodiumMg', 100_000),
    sugarG: readOptionalMicro('sugarG', 2_000),
    saturatedFatG: readOptionalMicro('saturatedFatG', 2_000),
  }

  if (!isRecord(value.autoCalc)) throw new Error('El cálculo automático no es válido.')
  const autoCalcValue = value.autoCalc
  const formula = readString(autoCalcValue.formula, 'La fórmula de cálculo', 40)
  if (!AUTO_FORMULAS.has(formula)) throw new Error('La fórmula de cálculo no es válida.')
  const mode = readString(autoCalcValue.mode, 'El modo de cálculo', 20)
  if (!AUTO_MODES.has(mode)) throw new Error('El modo de cálculo no es válido.')
  const activityLevel = readString(autoCalcValue.activityLevel, 'El nivel de actividad', 30)
  if (!ACTIVITY_LEVELS.has(activityLevel)) {
    throw new Error('El nivel de actividad no es válido.')
  }
  const autoCalc = {
    enabled: readBoolean(autoCalcValue.enabled, 'El cálculo automático'),
    formula: formula as MenuSettings['autoCalc']['formula'],
    mode: mode as MenuSettings['autoCalc']['mode'],
    activityLevel: activityLevel as MenuSettings['autoCalc']['activityLevel'],
    deficitPct: readNumber(autoCalcValue.deficitPct, 'El déficit', 0, 50),
    surplusPct: readNumber(autoCalcValue.surplusPct, 'El superávit', 0, 50),
    proteinPerKg: readNumber(autoCalcValue.proteinPerKg, 'La proteína por kg', 0.5, 4),
  }

  if (!Array.isArray(value.ingestas) || value.ingestas.length < 1 || value.ingestas.length > 12) {
    throw new Error('Debe haber entre 1 y 12 ingestas configuradas.')
  }
  const seenMealTypes = new Set<string>()
  const seenOrders = new Set<number>()
  const ingestas = value.ingestas.map((ingesta, index) => {
    const parsed = readIngesta(ingesta, index)
    if (seenMealTypes.has(parsed.mealType)) {
      throw new Error(`El tipo de ingesta "${parsed.mealType}" está duplicado.`)
    }
    if (seenOrders.has(parsed.order)) {
      throw new Error(`El orden de la ingesta "${parsed.mealType}" está duplicado.`)
    }
    seenMealTypes.add(parsed.mealType)
    seenOrders.add(parsed.order)
    return parsed
  })

  const allergenPolicy = readString(value.allergenPolicy, 'La política de alérgenos', 20)
  if (!ALLERGEN_POLICIES.has(allergenPolicy)) {
    throw new Error('La política de alérgenos no es válida.')
  }

  return {
    targetUnit: targetUnit as MenuSettings['targetUnit'],
    dailyTargets,
    perDayOverrides,
    tolerancePct,
    ketoMode,
    showMicros,
    microTargets,
    autoCalc,
    ingestas,
    allergenPolicy: allergenPolicy as MenuSettings['allergenPolicy'],
  }
}
