/**
 * @file tdee.ts
 * @description Total Daily Energy Expenditure (TDEE / Gasto Energético Total)
 * and Caloric Target calculations with clinical precision.
 */

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type CalorieObjective =
  | 'weight_loss'
  | 'muscle_gain'
  | 'maintenance'
  | 'aggressive_loss';

export interface CalorieTargetResult {
  calories: number;
  deficit: number;
}

/**
 * Standard Physical Activity Multipliers (FAO/WHO/UNU and Katch-McArdle conventions).
 *
 * - Sedentary (1.2): Little to no exercise, desk job
 * - Light (1.375): Light exercise or sports 1-3 days/week
 * - Moderate (1.55): Moderate exercise or sports 3-5 days/week
 * - Active (1.725): Hard exercise or sports 6-7 days/week
 * - Very active (1.9): Very hard exercise, physical labor or 2x/day training
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Human-readable descriptions for activity levels in Spanish.
 */
export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, { title: string; description: string }> = {
  sedentary: {
    title: 'Sedentario',
    description: 'Poco o ningún ejercicio, trabajo de escritorio',
  },
  light: {
    title: 'Ligero',
    description: 'Ejercicio ligero o deportes 1-3 días por semana',
  },
  moderate: {
    title: 'Moderado',
    description: 'Ejercicio moderado o deportes 3-5 días por semana',
  },
  active: {
    title: 'Activo',
    description: 'Entrenamiento intenso 6-7 días por semana',
  },
  very_active: {
    title: 'Muy activo',
    description: 'Ejercicio muy intenso, trabajo físico o entrenamiento doble',
  },
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE / GET).
 *
 * Scientific Source:
 * FAO/WHO/UNU Expert Consultation. "Human energy requirements."
 * Food and Nutrition Technical Report Series 1. Rome: FAO; 2004.
 *
 * Formula:
 * TDEE = BMR × Activity Multiplier
 *
 * @param bmr Basal Metabolic Rate in kcal/day.
 * @param activityLevel Physical activity tier.
 * @returns TDEE in kcal/day rounded to 2 decimal places.
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  if (bmr <= 0) {
    throw new Error('La TMB (BMR) debe ser mayor a 0 kcal');
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!multiplier) {
    throw new Error(`Nivel de actividad no válido: ${activityLevel}`);
  }

  const tdee = bmr * multiplier;
  return Math.round(tdee * 100) / 100;
}

/**
 * Calculates the Thermic Effect of Food (TEF / Efecto Termogénico de los Alimentos - ETA).
 * Accounts for the metabolic cost of digesting, absorbing, and storing nutrients.
 * Typically represents 8-15% of TDEE (defaulting to 10% on a standard balanced diet).
 *
 * Scientific Source:
 * Westerterp KR. "Diet induced thermogenesis."
 * Nutr Metab (Lond). 2004 Aug 18;1(1):5.
 *
 * @param tdee Total Daily Energy Expenditure in kcal/day.
 * @param tefPercentage Percentage as decimal (e.g., 0.10 for 10%) or whole number (10). Defaults to 0.10.
 * @returns TEF in kcal/day rounded to 2 decimal places.
 */
export function calculateTEF(tdee: number, tefPercentage: number = 0.1): number {
  if (tdee <= 0) {
    throw new Error('El GET (TDEE) debe ser mayor a 0 kcal');
  }

  // Handle both 10 and 0.10 input formats
  const normalizedFraction = tefPercentage > 1 ? tefPercentage / 100 : tefPercentage;

  if (normalizedFraction < 0 || normalizedFraction > 0.5) {
    throw new Error('El porcentaje de TEF debe estar entre 0% y 50%');
  }

  const tef = tdee * normalizedFraction;
  return Math.round(tef * 100) / 100;
}

/**
 * Objective caloric adjustments based on clinical guidelines:
 * - weight_loss: -500 kcal/day (aims for ~0.45 - 0.5 kg fat loss/week)
 * - aggressive_loss: -750 kcal/day (aims for ~0.7 - 0.75 kg loss/week with strict supervision)
 * - muscle_gain: +300 kcal/day (moderate lean mass surplus to minimize fat gain)
 * - maintenance: 0 kcal/day
 */
const OBJECTIVE_ADJUSTMENTS: Record<CalorieObjective, number> = {
  weight_loss: -500,
  aggressive_loss: -750,
  muscle_gain: 300,
  maintenance: 0,
};

/**
 * Calculates Caloric Target based on clinical goal.
 *
 * Scientific Source:
 * Hall KD, et al. "Quantification of the effect of energy imbalance on bodyweight."
 * Lancet. 2011 Aug 27;378(9793):826-37.
 *
 * @param tdee Total Daily Energy Expenditure in kcal/day.
 * @param objective Clinical goal for body composition.
 * @returns Object with target daily calories and the applied caloric deficit/surplus.
 */
export function calculateCalorieTarget(
  tdee: number,
  objective: CalorieObjective
): CalorieTargetResult {
  if (tdee <= 0) {
    throw new Error('El GET (TDEE) debe ser mayor a 0 kcal');
  }

  const deficit = OBJECTIVE_ADJUSTMENTS[objective];
  if (deficit === undefined) {
    throw new Error(`Objetivo calórico no válido: ${objective}`);
  }

  const target = Math.max(0, Math.round(tdee + deficit));

  return {
    calories: target,
    deficit,
  };
}
