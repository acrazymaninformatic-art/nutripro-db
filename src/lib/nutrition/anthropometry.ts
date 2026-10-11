/**
 * @file anthropometry.ts
 * @description Anthropometric and body composition calculation module.
 * Implements clinical formulas for BMI, Ideal Body Weight (IBW), Waist-to-Hip Ratio (WHR),
 * and Body Fat estimation via skinfolds (Durnin-Womersley + Siri).
 */

import { Sex } from './bmr';

export interface BMICategory {
  bmi: number;
  category:
    | 'Bajo peso'
    | 'Normal'
    | 'Sobrepeso'
    | 'Obesidad grado I'
    | 'Obesidad grado II'
    | 'Obesidad grado III';
}

export interface IdealWeightResults {
  lorentz: number;
  devine: number;
  robinson: number;
}

export interface WaistToHipRatioResult {
  ratio: number;
  risk: 'Bajo' | 'Moderado' | 'Alto';
}

export interface SkinfoldsInput {
  triceps: number;
  subscapular: number;
  suprailiac: number;
  abdominal: number;
  biceps?: number;
}

/**
 * Calculates Body Mass Index (BMI / IMC - Índice de Masa Corporal)
 * and classifies it according to World Health Organization (WHO) standards.
 *
 * Scientific Source:
 * World Health Organization. "Physical status: the use and interpretation of
 * anthropometry. Report of a WHO Expert Committee." WHO Technical Report Series 854; 1995.
 *
 * Formula:
 * BMI = weight (kg) / (height (m))²
 *
 * Classification:
 * - < 18.5: Bajo peso
 * - 18.5 - 24.9: Normal
 * - 25.0 - 29.9: Sobrepeso
 * - 30.0 - 34.9: Obesidad grado I
 * - 35.0 - 39.9: Obesidad grado II
 * - ≥ 40.0: Obesidad grado III
 *
 * @param weightKg Weight in kilograms.
 * @param heightCm Height in centimeters.
 * @returns Object with calculated BMI and clinical classification category.
 */
export function calculateBMI(weightKg: number, heightCm: number): BMICategory {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error('El peso y la altura deben ser mayores a 0');
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 100) / 100;

  let category: BMICategory['category'];
  if (bmi < 18.5) {
    category = 'Bajo peso';
  } else if (bmi < 25) {
    category = 'Normal';
  } else if (bmi < 30) {
    category = 'Sobrepeso';
  } else if (bmi < 35) {
    category = 'Obesidad grado I';
  } else if (bmi < 40) {
    category = 'Obesidad grado II';
  } else {
    category = 'Obesidad grado III';
  }

  return { bmi, category };
}

/**
 * Calculates Ideal Body Weight (IBW / Peso Ideal Teórico) using three classic formulas:
 * Lorentz, Devine, and Robinson.
 *
 * Scientific Sources:
 * 1. Lorentz FH. "Der Konstitutionsindex der Frau." Klin Wochenschr. 1929;8:734-736.
 * 2. Devine BJ. "Gentamicin therapy." Drug Intell Clin Pharm. 1974;8:650-655.
 * 3. Robinson JD, Lupkiewicz SM, Palenik L, Lopez LM, Fuenzalida M. "Determination of ideal body weight for drug dosage."
 *    Am J Hosp Pharm. 1983 Jun;40(6):1016-9.
 *
 * Formulas:
 * - Lorentz:
 *   - Male:   heightCm − 100 − (heightCm − 150) / 4
 *   - Female: heightCm − 100 − (heightCm − 150) / 2.5
 * - Devine:
 *   - Male:   50.0 + 2.3 × ((heightCm / 2.54) − 60)
 *   - Female: 45.5 + 2.3 × ((heightCm / 2.54) − 60)
 * - Robinson:
 *   - Male:   52.0 + 1.9 × ((heightCm / 2.54) − 60)
 *   - Female: 49.0 + 1.7 × ((heightCm / 2.54) − 60)
 *
 * @param heightCm Patient height in centimeters.
 * @param sex Biological sex ('male' | 'female').
 * @returns IdealWeightResults containing lorentz, devine, and robinson ideal weights in kg.
 */
export function calculateIdealWeight(
  heightCm: number,
  sex: Sex
): IdealWeightResults {
  if (heightCm <= 0) {
    throw new Error('La altura debe ser mayor a 0 cm');
  }

  // Lorentz Formula
  let lorentz: number;
  if (sex === 'male') {
    lorentz = heightCm - 100 - (heightCm - 150) / 4;
  } else {
    lorentz = heightCm - 100 - (heightCm - 150) / 2.5;
  }

  // Height in inches for Devine and Robinson equations
  const heightInches = heightCm / 2.54;
  const inchesOver60 = heightInches - 60;

  // Devine Formula
  let devine: number;
  if (sex === 'male') {
    devine = 50 + 2.3 * inchesOver60;
  } else {
    devine = 45.5 + 2.3 * inchesOver60;
  }

  // Robinson Formula
  let robinson: number;
  if (sex === 'male') {
    robinson = 52 + 1.9 * inchesOver60;
  } else {
    robinson = 49 + 1.7 * inchesOver60;
  }

  return {
    lorentz: Math.round(lorentz * 100) / 100,
    devine: Math.round(devine * 100) / 100,
    robinson: Math.round(robinson * 100) / 100,
  };
}

/**
 * Calculates Waist-to-Hip Ratio (Índice Cintura-Cadera - ICC) and evaluates cardiovascular/metabolic risk
 * based on World Health Organization thresholds.
 *
 * Scientific Source:
 * World Health Organization. "Waist circumference and waist-hip ratio: report of a WHO expert consultation."
 * Geneva, 8-11 December 2008.
 *
 * Risk Thresholds:
 * - Men:
 *   - < 0.90: Bajo
 *   - 0.90 - 0.99: Moderado
 *   - ≥ 1.00: Alto
 * - Women:
 *   - < 0.80: Bajo
 *   - 0.80 - 0.84: Moderado
 *   - ≥ 0.85: Alto
 *
 * @param waistCm Waist circumference in cm (measured at midpoint between lower margin of last palpable rib and top of iliac crest).
 * @param hipCm Hip circumference in cm (measured at widest portion of buttocks).
 * @param sex Biological sex ('male' | 'female').
 * @returns Object with ratio and risk level ('Bajo', 'Moderado', 'Alto').
 */
export function calculateWaistToHipRatio(
  waistCm: number,
  hipCm: number,
  sex: Sex
): WaistToHipRatioResult {
  if (waistCm <= 0 || hipCm <= 0) {
    throw new Error('Las medidas de cintura y cadera deben ser mayores a 0 cm');
  }

  const rawRatio = waistCm / hipCm;
  const ratio = Math.round(rawRatio * 100) / 100;

  let risk: WaistToHipRatioResult['risk'];
  if (sex === 'male') {
    if (ratio < 0.9) {
      risk = 'Bajo';
    } else if (ratio < 1.0) {
      risk = 'Moderado';
    } else {
      risk = 'Alto';
    }
  } else {
    if (ratio < 0.8) {
      risk = 'Bajo';
    } else if (ratio < 0.85) {
      risk = 'Moderado';
    } else {
      risk = 'Alto';
    }
  }

  return { ratio, risk };
}

/**
 * Coefficients table for Durnin-Womersley body density equation.
 * Density (D) = c − m × log10(sum of 4 skinfolds in mm)
 */
interface DurninWomersleyCoefficients {
  c: number;
  m: number;
}

function getDurninWomersleyCoefficients(
  sex: Sex,
  ageYears: number
): DurninWomersleyCoefficients {
  if (sex === 'male') {
    if (ageYears < 20) return { c: 1.162, m: 0.063 };
    if (ageYears < 30) return { c: 1.1631, m: 0.0632 };
    if (ageYears < 40) return { c: 1.1422, m: 0.0544 };
    if (ageYears < 50) return { c: 1.162, m: 0.07 };
    return { c: 1.1715, m: 0.0779 };
  } else {
    if (ageYears < 20) return { c: 1.1549, m: 0.0678 };
    if (ageYears < 30) return { c: 1.1599, m: 0.0717 };
    if (ageYears < 40) return { c: 1.1423, m: 0.0632 };
    if (ageYears < 50) return { c: 1.1333, m: 0.0612 };
    return { c: 1.1339, m: 0.0645 };
  }
}

/**
 * Estimates body fat percentage from 4-site skinfold measurements using the
 * Durnin & Womersley equation (1974) combined with the Siri (1956) equation.
 *
 * Scientific Sources:
 * 1. Durnin JV, Womersley J. "Body fat assessed from total body density and its estimation
 *    from skinfold thickness: measurements on 481 men and women aged from 16 to 72 years."
 *    Br J Nutr. 1974 Jul;32(1):77-97.
 * 2. Siri WE. "The gross composition of the body."
 *    Adv Biol Med Phys. 1956;4:239-280.
 *
 * Methodology:
 * 1. Sum of 4 skinfolds (triceps, subscapular, suprailiac, plus abdominal or biceps) in mm.
 * 2. Body Density (D) = c − m × log10(sum4)
 * 3. Body Fat % = ((495 / D) − 450)
 *
 * @param skinfolds Four caliper skinfold measurements in millimeters (mm).
 * @param sex Biological sex ('male' | 'female').
 * @param ageYears Patient age in years.
 * @returns Estimated body fat percentage (% Grasa Corporal) rounded to 2 decimal places.
 */
export function estimateBodyFatFromSkinfolds(
  skinfolds: SkinfoldsInput,
  sex: Sex,
  ageYears: number
): number {
  const { triceps, subscapular, suprailiac, abdominal, biceps } = skinfolds;

  // The 4th site uses biceps if supplied, or abdominal
  const fourthFold = biceps ?? abdominal;

  if (
    triceps <= 0 ||
    subscapular <= 0 ||
    suprailiac <= 0 ||
    fourthFold <= 0 ||
    ageYears <= 0
  ) {
    throw new Error('Los pliegues cutáneos y la edad deben ser valores positivos mayores a 0');
  }

  const sumOfFolds = triceps + subscapular + suprailiac + fourthFold;
  const logSum = Math.log10(sumOfFolds);

  const { c, m } = getDurninWomersleyCoefficients(sex, ageYears);
  const bodyDensity = c - m * logSum;

  if (bodyDensity <= 0) {
    throw new Error('Densidad corporal calculada no válida');
  }

  // Siri equation: % Fat = (495 / Density) - 450
  const bodyFatPct = 495 / bodyDensity - 450;
  const clampedBodyFat = Math.max(0, Math.min(100, bodyFatPct));

  return Math.round(clampedBodyFat * 100) / 100;
}
