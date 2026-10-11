/**
 * @file macros.ts
 * @description Macronutrient distribution and calculation engine.
 * Supports standard clinical presets, percentage distribution, and g/kg body weight calculations.
 */

export type DietType =
  | 'balanced'
  | 'high_protein'
  | 'ketogenic'
  | 'mediterranean'
  | 'low_carb'
  | 'vegetarian'
  | 'custom';

export interface MacroDistribution {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export interface MacroGrams {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinKcal: number;
  carbsKcal: number;
  fatKcal: number;
  totalKcal: number;
}

/**
 * Caloric density constants (Atwater General Factor System).
 * - Protein: 4.0 kcal/g
 * - Carbohydrates: 4.0 kcal/g
 * - Fat: 9.0 kcal/g
 */
export const ATWATER_FACTORS = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

/**
 * Standard Macronutrient Presets based on evidence-based dietary patterns.
 */
export const MACRO_PRESETS: Record<Exclude<DietType, 'custom'>, MacroDistribution> = {
  balanced: {
    proteinPct: 25,
    carbsPct: 50,
    fatPct: 25,
  },
  high_protein: {
    proteinPct: 35,
    carbsPct: 40,
    fatPct: 25,
  },
  ketogenic: {
    proteinPct: 20,
    carbsPct: 5,
    fatPct: 75,
  },
  mediterranean: {
    proteinPct: 20,
    carbsPct: 50,
    fatPct: 30,
  },
  low_carb: {
    proteinPct: 30,
    carbsPct: 25,
    fatPct: 45,
  },
  vegetarian: {
    proteinPct: 20,
    carbsPct: 55,
    fatPct: 25,
  },
};

/**
 * Spanish descriptive labels for diet types.
 */
export const DIET_TYPE_LABELS: Record<DietType, { title: string; description: string }> = {
  balanced: {
    title: 'Equilibrada',
    description: '25% Proteínas, 50% Carbohidratos, 25% Grasas',
  },
  high_protein: {
    title: 'Alta en proteínas',
    description: '35% Proteínas, 40% Carbohidratos, 25% Grasas',
  },
  ketogenic: {
    title: 'Cetogénica',
    description: '20% Proteínas, 5% Carbohidratos, 75% Grasas',
  },
  mediterranean: {
    title: 'Mediterránea',
    description: '20% Proteínas, 50% Carbohidratos, 30% Grasas',
  },
  low_carb: {
    title: 'Baja en carbohidratos',
    description: '30% Proteínas, 25% Carbohidratos, 45% Grasas',
  },
  vegetarian: {
    title: 'Vegetariana',
    description: '20% Proteínas, 55% Carbohidratos, 25% Grasas',
  },
  custom: {
    title: 'Personalizada',
    description: 'Distribución configurable según criterio clínico',
  },
};

/**
 * Returns macro percentage distribution for a given diet type preset.
 * Defaults to balanced distribution if 'custom' is requested without prior configuration.
 *
 * @param dietType Dietary pattern key.
 * @returns MacroDistribution with percentage targets.
 */
export function getMacroDistribution(dietType: DietType): MacroDistribution {
  if (dietType === 'custom') {
    return { ...MACRO_PRESETS.balanced };
  }

  const preset = MACRO_PRESETS[dietType];
  if (!preset) {
    throw new Error(`Tipo de dieta no válido: ${dietType}`);
  }

  return { ...preset };
}

/**
 * Calculates macronutrient gram quantities and respective caloric contributions
 * from a target daily caloric intake and percentage distribution.
 *
 * @param targetKcal Target energy intake in kcal.
 * @param distribution Percentage distribution (summing to ~100%).
 * @returns MacroGrams with grams and calories per nutrient.
 */
export function calculateMacros(
  targetKcal: number,
  distribution: MacroDistribution
): MacroGrams {
  if (targetKcal <= 0) {
    throw new Error('El objetivo calórico debe ser mayor a 0 kcal');
  }

  const totalPct = distribution.proteinPct + distribution.carbsPct + distribution.fatPct;
  if (Math.abs(totalPct - 100) > 1) {
    throw new Error(
      `La suma de porcentajes de macronutrientes debe ser 100% (actual: ${totalPct}%)`
    );
  }

  const proteinKcal = (targetKcal * distribution.proteinPct) / 100;
  const carbsKcal = (targetKcal * distribution.carbsPct) / 100;
  const fatKcal = (targetKcal * distribution.fatPct) / 100;

  const proteinG = proteinKcal / ATWATER_FACTORS.protein;
  const carbsG = carbsKcal / ATWATER_FACTORS.carbs;
  const fatG = fatKcal / ATWATER_FACTORS.fat;

  return {
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
    proteinKcal: Math.round(proteinKcal * 10) / 10,
    carbsKcal: Math.round(carbsKcal * 10) / 10,
    fatKcal: Math.round(fatKcal * 10) / 10,
    totalKcal: Math.round((proteinKcal + carbsKcal + fatKcal) * 10) / 10,
  };
}

/**
 * Calculates macronutrients prioritizing protein and fat by grams per kilogram
 * of body weight (common clinical & sports nutrition protocol), allocating
 * the remaining caloric budget to carbohydrates.
 *
 * @param weightKg Patient body weight in kg.
 * @param proteinPerKg Target protein intake (g/kg body weight, e.g. 1.6 - 2.2).
 * @param fatPerKg Target dietary fat intake (g/kg body weight, e.g. 0.8 - 1.2).
 * @param targetKcal Total daily target caloric intake in kcal.
 * @returns MacroGrams with grams and calories per nutrient.
 */
export function calculateMacrosByBodyWeight(
  weightKg: number,
  proteinPerKg: number,
  fatPerKg: number,
  targetKcal: number
): MacroGrams {
  if (weightKg <= 0) {
    throw new Error('El peso corporal debe ser mayor a 0 kg');
  }
  if (proteinPerKg < 0 || fatPerKg < 0) {
    throw new Error('Los gramos por kilogramo deben ser valores no negativos');
  }
  if (targetKcal <= 0) {
    throw new Error('El objetivo calórico debe ser mayor a 0 kcal');
  }

  const proteinG = weightKg * proteinPerKg;
  const proteinKcal = proteinG * ATWATER_FACTORS.protein;

  const fatG = weightKg * fatPerKg;
  const fatKcal = fatG * ATWATER_FACTORS.fat;

  const remainingKcal = targetKcal - (proteinKcal + fatKcal);
  const carbsKcal = Math.max(0, remainingKcal);
  const carbsG = carbsKcal / ATWATER_FACTORS.carbs;

  const effectiveTotalKcal = proteinKcal + fatKcal + carbsKcal;

  return {
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
    proteinKcal: Math.round(proteinKcal * 10) / 10,
    carbsKcal: Math.round(carbsKcal * 10) / 10,
    fatKcal: Math.round(fatKcal * 10) / 10,
    totalKcal: Math.round(effectiveTotalKcal * 10) / 10,
  };
}
