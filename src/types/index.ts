// Application-level type definitions for enum fields stored as strings in SQLite

export const SEX_VALUES = ['MALE', 'FEMALE'] as const
export type Sex = typeof SEX_VALUES[number]

export const OBJECTIVE_VALUES = [
  'WEIGHT_LOSS',
  'MUSCLE_GAIN',
  'MAINTENANCE',
  'HEALTH_IMPROVEMENT',
  'SPORTS_PERFORMANCE',
] as const
export type Objective = typeof OBJECTIVE_VALUES[number]

export const ACTIVITY_LEVEL_VALUES = [
  'SEDENTARY',
  'LIGHT',
  'MODERATE',
  'ACTIVE',
  'VERY_ACTIVE',
] as const
export type ActivityLevel = typeof ACTIVITY_LEVEL_VALUES[number]

export const MEAL_TYPE_VALUES = [
  'BREAKFAST',
  'MID_MORNING',
  'LUNCH',
  'SNACK',
  'DINNER',
  'LATE_SNACK',
] as const
export type MealType = typeof MEAL_TYPE_VALUES[number]

// Spanish display labels
export const SEX_LABELS: Record<Sex, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
}

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento',
  HEALTH_IMPROVEMENT: 'Mejora de salud',
  SPORTS_PERFORMANCE: 'Rendimiento deportivo',
}

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: 'Sedentario',
  LIGHT: 'Actividad ligera',
  MODERATE: 'Actividad moderada',
  ACTIVE: 'Activo',
  VERY_ACTIVE: 'Muy activo',
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Desayuno',
  MID_MORNING: 'Media mañana',
  LUNCH: 'Comida',
  SNACK: 'Merienda',
  DINNER: 'Cena',
  LATE_SNACK: 'Recena',
}

// Helper to parse comma-separated string fields
export function parseCommaSeparated(value: string): string[] {
  if (!value || value.trim() === '') return []
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export function toCommaSeparated(values: string[]): string {
  return values.filter(Boolean).join(',')
}

export const APPOINTMENT_TYPE_CONFIG: Record<
  string,
  { label: string; durationMin: number; color: string }
> = {
  PRIMERA: { label: 'Primera Consulta', durationMin: 60, color: '#2563eb' },
  REVISION: { label: 'Revisión y Seguimiento', durationMin: 45, color: '#16a34a' },
  ONLINE: { label: 'Consulta Online (Meet)', durationMin: 45, color: '#9333ea' },
  DOMICILIO: { label: 'Consulta a Domicilio', durationMin: 60, color: '#d97706' },
  GRUPAL: { label: 'Sesión Grupal / Taller', durationMin: 90, color: '#4f46e5' },
}

