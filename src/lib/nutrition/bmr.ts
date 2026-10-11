/**
 * @file bmr.ts
 * @description Basal Metabolic Rate (BMR / Tasa Metabólica Basal) calculation engine.
 * Implements clinically validated formulas: Harris-Benedict Revised, Mifflin-St Jeor,
 * Katch-McArdle, and Cunningham.
 */

export type Sex = 'male' | 'female';

export interface BMRInput {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
}

export interface BMRWithLeanMassInput {
  weightKg: number;
  bodyFatPct: number; // Percentage, e.g. 20 for 20%
}

export interface BMRResults {
  harrisBenedict: number;
  mifflinStJeor: number;
  katchMcArdle?: number;
  cunningham?: number;
}

/**
 * Calculates Lean Body Mass (Masa Libre de Grasa) in kilograms.
 *
 * @param weightKg Total body weight in kg.
 * @param bodyFatPct Body fat percentage (0 to 100).
 * @returns Lean body mass in kg rounded to 2 decimal places.
 */
export function calculateLeanMass(weightKg: number, bodyFatPct: number): number {
  if (weightKg <= 0) {
    throw new Error('El peso debe ser mayor a 0 kg');
  }
  if (bodyFatPct < 0 || bodyFatPct > 100) {
    throw new Error('El porcentaje de grasa corporal debe estar entre 0 y 100');
  }
  const lbm = weightKg * (1 - bodyFatPct / 100);
  return Math.round(lbm * 100) / 100;
}

/**
 * Calculates BMR using the revised Harris-Benedict equation (Roza & Shizgal, 1984).
 *
 * Scientific Source:
 * Roza AM, Shizgal HM. "The Harris Benedict equation reevaluated: resting energy
 * requirements and the body cell mass." Am J Clin Nutr. 1984 Jul;40(1):168-82.
 *
 * Formulas:
 * - Male:   88.362 + (13.397 × weight kg) + (4.799 × height cm) − (5.677 × age)
 * - Female: 447.593 + (9.247 × weight kg) + (3.098 × height cm) − (4.330 × age)
 *
 * @param input Physical parameters including weight, height, age, and sex.
 * @returns BMR in kcal/day rounded to 2 decimal places.
 */
export function calculateHarrisBenedict(input: BMRInput): number {
  const { weightKg, heightCm, ageYears, sex } = input;

  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) {
    throw new Error('El peso, la altura y la edad deben ser valores positivos');
  }

  let bmr: number;
  if (sex === 'male') {
    bmr = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  } else {
    bmr = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
  }

  return Math.round(bmr * 100) / 100;
}

/**
 * Calculates BMR using the Mifflin-St Jeor equation (1990).
 * Recognized by the Academy of Nutrition and Dietetics as the most accurate
 * predictive equation for the non-obese and obese general population.
 *
 * Scientific Source:
 * Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.
 * "A new predictive equation for resting energy expenditure in healthy individuals."
 * Am J Clin Nutr. 1990 Feb;51(2):241-7.
 *
 * Formulas:
 * - Male:   (10 × weight kg) + (6.25 × height cm) − (5 × age) + 5
 * - Female: (10 × weight kg) + (6.25 × height cm) − (5 × age) − 161
 *
 * @param input Physical parameters including weight, height, age, and sex.
 * @returns BMR in kcal/day rounded to 2 decimal places.
 */
export function calculateMifflinStJeor(input: BMRInput): number {
  const { weightKg, heightCm, ageYears, sex } = input;

  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) {
    throw new Error('El peso, la altura y la edad deben ser valores positivos');
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const bmr = sex === 'male' ? base + 5 : base - 161;

  return Math.round(bmr * 100) / 100;
}

/**
 * Calculates BMR using the Katch-McArdle formula.
 * Takes lean body mass into account, making it superior for individuals
 * whose body composition deviates from average population norms.
 *
 * Scientific Source:
 * McArdle WD, Katch FI, Katch VL. "Exercise Physiology: Energy, Nutrition,
 * and Human Performance." Lea & Febiger / Lippincott Williams & Wilkins.
 *
 * Formula:
 * BMR = 370 + (21.6 × lean body mass in kg)
 * where lean body mass = weight × (1 − bodyFatPct / 100)
 *
 * @param input Weight in kg and body fat percentage.
 * @returns BMR in kcal/day rounded to 2 decimal places.
 */
export function calculateKatchMcArdle(input: BMRWithLeanMassInput): number {
  const leanMass = calculateLeanMass(input.weightKg, input.bodyFatPct);
  const bmr = 370 + 21.6 * leanMass;

  return Math.round(bmr * 100) / 100;
}

/**
 * Calculates BMR using the Cunningham formula (1991).
 * Specifically calibrated for athletic populations and individuals with
 * high muscular development.
 *
 * Scientific Source:
 * Cunningham JJ. "Body composition as a determinant of energy expenditure:
 * a synthetic review and a proposed general prediction equation."
 * Am J Clin Nutr. 1991 Dec;54(6):963-9.
 *
 * Formula:
 * BMR = 500 + (22 × lean body mass in kg)
 * where lean body mass = weight × (1 − bodyFatPct / 100)
 *
 * @param input Weight in kg and body fat percentage.
 * @returns BMR in kcal/day rounded to 2 decimal places.
 */
export function calculateCunningham(input: BMRWithLeanMassInput): number {
  const leanMass = calculateLeanMass(input.weightKg, input.bodyFatPct);
  const bmr = 500 + 22 * leanMass;

  return Math.round(bmr * 100) / 100;
}

/**
 * Calculates BMR across all applicable clinical formulas.
 *
 * @param input Core anthropometric input (weight, height, age, sex).
 * @param bodyFatPct Optional body fat percentage to calculate composition-based equations.
 * @returns BMRResults containing values for each formula.
 */
export function calculateAllBMR(input: BMRInput, bodyFatPct?: number): BMRResults {
  const results: BMRResults = {
    harrisBenedict: calculateHarrisBenedict(input),
    mifflinStJeor: calculateMifflinStJeor(input),
  };

  if (typeof bodyFatPct === 'number' && !isNaN(bodyFatPct)) {
    const leanMassInput: BMRWithLeanMassInput = {
      weightKg: input.weightKg,
      bodyFatPct,
    };
    results.katchMcArdle = calculateKatchMcArdle(leanMassInput);
    results.cunningham = calculateCunningham(leanMassInput);
  }

  return results;
}
