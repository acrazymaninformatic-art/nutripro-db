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

/**
 * -----------------------------------------------------------------------------
 * ÍNDICE CINTURA-TALLA (ICT / Waist-to-Height Ratio - WHtR)
 * -----------------------------------------------------------------------------
 * Indicador de riesgo cardiometabólico y adiposidad central según la regla de Ashwell.
 * Umbral general: "Mantén tu cintura a menos de la mitad de tu altura" (ICT < 0.50).
 */
export interface WHtRResult {
  ratio: number;
  category: 'Delgadez' | 'Saludable / Óptimo' | 'Riesgo Aumentado' | 'Riesgo Muy Elevado';
  riskLevel: 'bajo' | 'normal' | 'moderado' | 'alto';
}

export function calculateWaistToHeightRatio(waistCm: number, heightCm: number): WHtRResult {
  if (waistCm <= 0 || heightCm <= 0) {
    throw new Error('La cintura y la altura deben ser valores mayores a 0');
  }

  const ratio = Math.round((waistCm / heightCm) * 100) / 100;
  if (ratio < 0.40) {
    return { ratio, category: 'Delgadez', riskLevel: 'bajo' };
  } else if (ratio < 0.50) {
    return { ratio, category: 'Saludable / Óptimo', riskLevel: 'normal' };
  } else if (ratio < 0.60) {
    return { ratio, category: 'Riesgo Aumentado', riskLevel: 'moderado' };
  } else {
    return { ratio, category: 'Riesgo Muy Elevado', riskLevel: 'alto' };
  }
}

/**
 * -----------------------------------------------------------------------------
 * ECUACIÓN CUN-BAE (Clínica Universidad de Navarra - Body Adiposity Estimator)
 * -----------------------------------------------------------------------------
 * Estimación de % de grasa corporal validada en población española (Gómez-Ambrosi et al., 2012).
 * Precisión superior al IMC aislado frente a DEXA.
 */
export function calculateCUNBAE(bmi: number, ageYears: number, sex: 'male' | 'female'): number {
  if (bmi <= 0 || ageYears <= 0) return 0;
  // sexCoef: 0 para varones, 1 para mujeres
  const sexCoef = sex === 'female' ? 1 : 0;
  const bmi2 = bmi * bmi;

  const bfPct =
    -44.988 +
    (0.503 * ageYears) +
    (10.689 * sexCoef) +
    (3.172 * bmi) -
    (0.026 * bmi2) +
    (0.181 * bmi * sexCoef) -
    (0.02 * bmi * ageYears) -
    (0.005 * bmi2 * sexCoef) +
    (0.00021 * bmi2 * ageYears);

  return Math.max(3, Math.min(65, Math.round(bfPct * 10) / 10));
}

/**
 * -----------------------------------------------------------------------------
 * SOMATOTIPO DE HEATH-CARTER (Antropometría ISAK)
 * -----------------------------------------------------------------------------
 * Endomorfia (adiposidad relativa), Mesomorfia (robustez músculo-esquelética) y Ectomorfia (linealidad relativa).
 */
export interface HeathCarterSomatotype {
  endomorphy: number;
  mesomorphy: number;
  ectomorphy: number;
  dominantType: string;
}

export function calculateHeathCarterSomatotype(params: {
  heightCm: number;
  weightKg: number;
  tricepsMm: number;
  subscapularMm: number;
  suprailiacMm: number;
  humerusDiamCm?: number;
  femurDiamCm?: number;
  armCircCm?: number;
  calfCircCm?: number;
}): HeathCarterSomatotype {
  const { heightCm, weightKg, tricepsMm, subscapularMm, suprailiacMm } = params;

  // 1. Endomorfia (Cálculo corregido por altura)
  const sum3 = tricepsMm + subscapularMm + suprailiacMm;
  const sum3Corrected = sum3 * (170.18 / heightCm);
  const endomorphy =
    -0.7182 +
    0.1451 * sum3Corrected -
    0.00068 * Math.pow(sum3Corrected, 2) +
    0.0000014 * Math.pow(sum3Corrected, 3);

  // 2. Mesomorfia (Diámetros y perímetros corregidos, o aproximación estándar si no constan)
  const humerus = params.humerusDiamCm || 6.8;
  const femur = params.femurDiamCm || 9.4;
  const armCorrected = (params.armCircCm || 30) - (tricepsMm / 10);
  const calfCorrected = (params.calfCircCm || 36) - (params.tricepsMm * 0.7 / 10);
  const mesomorphy =
    0.858 * humerus +
    0.601 * femur +
    0.188 * armCorrected +
    0.161 * calfCorrected -
    0.131 * heightCm +
    4.5;

  // 3. Ectomorfia (Índice ponderal HMR = height / cbrt(weight))
  const hmr = heightCm / Math.cbrt(weightKg);
  let ectomorphy = 0.1;
  if (hmr >= 40.75) {
    ectomorphy = 0.732 * hmr - 28.58;
  } else if (hmr > 38.25) {
    ectomorphy = 0.463 * hmr - 17.63;
  } else {
    ectomorphy = 0.1;
  }

  const endo = Math.max(0.5, Math.round(endomorphy * 10) / 10);
  const meso = Math.max(0.5, Math.round(mesomorphy * 10) / 10);
  const ecto = Math.max(0.5, Math.round(ectomorphy * 10) / 10);

  let dominantType = 'Equilibrado';
  if (endo > meso && endo > ecto) dominantType = 'Endomorfo Predominante';
  else if (meso > endo && meso > ecto) dominantType = 'Mesomorfo Predominante';
  else if (ecto > endo && ecto > meso) dominantType = 'Ectomorfo Predominante';
  else if (endo === meso) dominantType = 'Endo-Mesomorfo';
  else if (meso === ecto) dominantType = 'Meso-Ectomorfo';

  return { endomorphy: endo, mesomorphy: meso, ectomorphy: ecto, dominantType };
}

/**
 * -----------------------------------------------------------------------------
 * GANANCIA DE PESO EN EL EMBARAZO (Guía IOM 2009)
 * -----------------------------------------------------------------------------
 */
export interface PregnancyWeightGainTarget {
  recommendedTotalMinKg: number;
  recommendedTotalMaxKg: number;
  expectedGainAtWeekMinKg: number;
  expectedGainAtWeekMaxKg: number;
  actualGainKg: number;
  status: 'Por debajo' | 'Dentro del rango óptimo' | 'Por encima';
}

export function calculateGestationalWeightGain(
  pregestationalBmi: number,
  pregestationalWeightKg: number,
  currentWeightKg: number,
  weekOfPregnancy: number
): PregnancyWeightGainTarget {
  let totalMin = 11.5;
  let totalMax = 16.0;
  let rateKgPerWeek = 0.42;

  if (pregestationalBmi < 18.5) {
    totalMin = 12.5;
    totalMax = 18.0;
    rateKgPerWeek = 0.51;
  } else if (pregestationalBmi < 25) {
    totalMin = 11.5;
    totalMax = 16.0;
    rateKgPerWeek = 0.42;
  } else if (pregestationalBmi < 30) {
    totalMin = 7.0;
    totalMax = 11.5;
    rateKgPerWeek = 0.28;
  } else {
    totalMin = 5.0;
    totalMax = 9.0;
    rateKgPerWeek = 0.22;
  }

  // En el 1er trimestre (semanas 1-13) ganancia esperada: 0.5 - 2.0 kg
  const weeksAfterT1 = Math.max(0, weekOfPregnancy - 13);
  const expectedGainMin = Math.round((Math.min(weekOfPregnancy / 13, 1) * 0.5 + weeksAfterT1 * (rateKgPerWeek * 0.8)) * 10) / 10;
  const expectedGainMax = Math.round((Math.min(weekOfPregnancy / 13, 1) * 2.0 + weeksAfterT1 * (rateKgPerWeek * 1.2)) * 10) / 10;

  const actualGain = Math.round((currentWeightKg - pregestationalWeightKg) * 10) / 10;

  let status: PregnancyWeightGainTarget['status'] = 'Dentro del rango óptimo';
  if (actualGain < expectedGainMin - 0.5) status = 'Por debajo';
  else if (actualGain > expectedGainMax + 0.5) status = 'Por encima';

  return {
    recommendedTotalMinKg: totalMin,
    recommendedTotalMaxKg: totalMax,
    expectedGainAtWeekMinKg: expectedGainMin,
    expectedGainAtWeekMaxKg: expectedGainMax,
    actualGainKg: actualGain,
    status,
  };
}

/**
 * -----------------------------------------------------------------------------
 * ÍNDICES CALCULADOS EN ANALÍTICAS SANGUÍNEAS (5.3)
 * -----------------------------------------------------------------------------
 */
export interface BloodIndicesResult {
  tgHdlRatio: { value: number; interpretation: string; status: 'normal' | 'warning' | 'danger' } | null;
  friedewaldLdl: { value: number; valid: boolean; status: 'normal' | 'warning' | 'danger' } | null;
  homaIr: { value: number; interpretation: string; status: 'normal' | 'warning' | 'danger' } | null;
  fib4: { value: number; interpretation: string; status: 'normal' | 'warning' | 'danger' } | null;
}

export function calculateBloodIndices(params: {
  cholesterolTotalMgDl?: number | null;
  hdlMgDl?: number | null;
  triglyceridesMgDl?: number | null;
  glucoseMgDl?: number | null;
  insulinUiuMl?: number | null;
  ageYears?: number | null;
  astUL?: number | null;
  altUL?: number | null;
  plateletsKUl?: number | null;
}): BloodIndicesResult {
  const { cholesterolTotalMgDl, hdlMgDl, triglyceridesMgDl, glucoseMgDl, insulinUiuMl, ageYears, astUL, altUL, plateletsKUl } = params;

  // 1. Ratio Triglicéridos / HDL (Marcador de resistencia a la insulina y aterogenicidad)
  let tgHdlRatio: BloodIndicesResult['tgHdlRatio'] = null;
  if (triglyceridesMgDl && hdlMgDl && hdlMgDl > 0) {
    const ratio = Math.round((triglyceridesMgDl / hdlMgDl) * 100) / 100;
    let interpretation = 'Óptimo (Sensibilidad insulínica normal)';
    let status: 'normal' | 'warning' | 'danger' = 'normal';
    if (ratio > 3.0) {
      interpretation = 'Elevado: Alta sospecha de resistencia insulínica y patrón B LDL';
      status = 'danger';
    } else if (ratio > 2.0) {
      interpretation = 'Límite / Riesgo moderado';
      status = 'warning';
    }
    tgHdlRatio = { value: ratio, interpretation, status };
  }

  // 2. LDL Calculado de Friedewald: LDL = CT - HDL - (TG / 5) (Válido si TG < 400 mg/dL)
  let friedewaldLdl: BloodIndicesResult['friedewaldLdl'] = null;
  if (cholesterolTotalMgDl && hdlMgDl && triglyceridesMgDl) {
    const valid = triglyceridesMgDl < 400;
    const ldlCalc = Math.round((cholesterolTotalMgDl - hdlMgDl - (triglyceridesMgDl / 5)) * 10) / 10;
    const status: 'normal' | 'warning' | 'danger' = ldlCalc >= 160 ? 'danger' : ldlCalc >= 130 ? 'warning' : 'normal';
    friedewaldLdl = { value: ldlCalc, valid, status };
  }

  // 3. HOMA-IR (Homeostatic Model Assessment of Insulin Resistance): (Glucosa mg/dL * Insulina µIU/mL) / 405
  let homaIr: BloodIndicesResult['homaIr'] = null;
  if (glucoseMgDl && insulinUiuMl && glucoseMgDl > 0 && insulinUiuMl > 0) {
    const homa = Math.round(((glucoseMgDl * insulinUiuMl) / 405) * 100) / 100;
    let interpretation = 'Sensibilidad a la insulina normal (< 2.0)';
    let status: 'normal' | 'warning' | 'danger' = 'normal';
    if (homa >= 3.0) {
      interpretation = 'Resistencia a la insulina manifiesta (HOMA-IR ≥ 3.0)';
      status = 'danger';
    } else if (homa >= 2.0) {
      interpretation = 'Sospecha de resistencia incipiente (2.0 - 2.9)';
      status = 'warning';
    }
    homaIr = { value: homa, interpretation, status };
  }

  // 4. FIB-4 (Fibrosis-4 Index para hígado graso no alcohólico): (Edad * AST) / (Plaquetas * sqrt(ALT))
  let fib4: BloodIndicesResult['fib4'] = null;
  if (ageYears && astUL && altUL && plateletsKUl && altUL > 0 && plateletsKUl > 0) {
    const fibVal = Math.round(((ageYears * astUL) / (plateletsKUl * Math.sqrt(altUL))) * 100) / 100;
    let interpretation = 'Bajo riesgo de fibrosis avanzada (< 1.30)';
    let status: 'normal' | 'warning' | 'danger' = 'normal';
    if (fibVal > 2.67) {
      interpretation = 'Alto riesgo de fibrosis hepática avanzada (> 2.67)';
      status = 'danger';
    } else if (fibVal >= 1.30) {
      interpretation = 'Zona indeterminada (1.30 - 2.67)';
      status = 'warning';
    }
    fib4 = { value: fibVal, interpretation, status };
  }

  return { tgHdlRatio, friedewaldLdl, homaIr, fib4 };
}
