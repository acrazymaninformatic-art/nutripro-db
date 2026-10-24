import { INTAKE_CATALOG } from '@/lib/clinical/intake-catalog'

const QUESTIONNAIRE_FIELD_BY_ID = new Map(INTAKE_CATALOG.map((field) => [field.id, field]))
const EXTRA_QUESTIONNAIRE_FIELDS = new Set([
  'name',
  'gender',
  'intolerancesOrAllergies',
  'digestiveSymptoms',
])
const INTEGER_QUESTIONNAIRE_FIELDS = new Set([
  'caffeineDaily',
  'mealsPerDay',
  'exerciseFrequency',
  'exerciseDuration',
])

export type SanitizedQuestionnaireAnswers = Record<string, string | number | boolean>

/**
 * Allowlist y coerción estricta de las respuestas del cuestionario. El
 * navegador nunca decide el tipo final ni puede introducir campos de la ficha
 * que no formen parte del catálogo clínico.
 */
export function sanitizeQuestionnaireAnswers(input: unknown): SanitizedQuestionnaireAnswers {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Las respuestas del cuestionario no tienen un formato válido.')
  }

  const output: SanitizedQuestionnaireAnswers = {}

  for (const [key, rawValue] of Object.entries(input as Record<string, unknown>)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue

    const field = QUESTIONNAIRE_FIELD_BY_ID.get(key)
    if (!field) {
      if (!EXTRA_QUESTIONNAIRE_FIELDS.has(key)) continue
      if (typeof rawValue !== 'string') throw new Error(`El campo ${key} no es válido.`)
      output[key] = rawValue.trim().slice(0, 5_000)
      continue
    }

    if (field.type === 'boolean') {
      if (typeof rawValue !== 'boolean') {
        throw new Error(`El campo ${field.label} debe ser verdadero o falso.`)
      }
      output[key] = rawValue
      continue
    }

    if (field.type === 'number') {
      const numeric = Number(rawValue)
      if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100_000) {
        throw new Error(`El valor de ${field.label} no es válido.`)
      }
      output[key] = INTEGER_QUESTIONNAIRE_FIELDS.has(key) ? Math.round(numeric) : numeric
      continue
    }

    if (field.type === 'date') {
      if (typeof rawValue !== 'string') throw new Error(`La fecha de ${field.label} no es válida.`)
      const parsed = new Date(rawValue)
      if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 1900 || parsed.getTime() > Date.now() + 86400000) {
        throw new Error(`La fecha de ${field.label} no es válida.`)
      }
      output[key] = rawValue.slice(0, 10)
      continue
    }

    if (typeof rawValue !== 'string') throw new Error(`El campo ${field.label} no es válido.`)
    const text = rawValue.trim().slice(0, 5_000)
    if (field.type === 'select' && text && field.options?.length) {
      if (!field.options.some((option) => option.value === text)) {
        throw new Error(`La opción seleccionada para ${field.label} no es válida.`)
      }
    }
    output[key] = text
  }

  return output
}
