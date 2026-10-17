/**
 * Fórmulas Metabólicas Avanzadas y Gasto Energético (EVSoftware Sección 5.10)
 * Incluye: Schofield, FAO/OMS, Owen, Ireton-Jones, Penn State,
 * Gasto por METs / Pasos, y necesidades específicas (embarazo, lactancia, niños, mayores, renal).
 */

export type Sex = 'male' | 'female'

export interface BaseMetabolicInput {
  weightKg: number
  heightCm: number
  ageYears: number
  sex: Sex
  bodyFatPct?: number
}

// 1. Schofield (1985)
export function calculateSchofield(input: BaseMetabolicInput): number {
  const { weightKg, ageYears, sex } = input

  if (sex === 'male') {
    if (ageYears < 3) return 59.512 * weightKg - 30.4
    if (ageYears <= 10) return 22.706 * weightKg + 504.3
    if (ageYears <= 18) return 17.686 * weightKg + 658.2
    if (ageYears <= 30) return 15.057 * weightKg + 692.2
    if (ageYears <= 60) return 11.472 * weightKg + 873.1
    return 11.711 * weightKg + 587.7
  } else {
    if (ageYears < 3) return 58.317 * weightKg - 31.1
    if (ageYears <= 10) return 20.315 * weightKg + 485.9
    if (ageYears <= 18) return 13.384 * weightKg + 692.6
    if (ageYears <= 30) return 14.818 * weightKg + 486.6
    if (ageYears <= 60) return 8.126 * weightKg + 845.6
    return 9.082 * weightKg + 658.5
  }
}

// 2. FAO / OMS / UNU (1985 / 2004)
export function calculateFaoOms(input: BaseMetabolicInput): number {
  const { weightKg, ageYears, sex } = input

  if (sex === 'male') {
    if (ageYears < 3) return 60.9 * weightKg - 54
    if (ageYears <= 10) return 22.7 * weightKg + 495
    if (ageYears <= 18) return 17.5 * weightKg + 651
    if (ageYears <= 30) return 15.3 * weightKg + 679
    if (ageYears <= 60) return 11.6 * weightKg + 879
    return 13.5 * weightKg + 487
  } else {
    if (ageYears < 3) return 61.0 * weightKg - 51
    if (ageYears <= 10) return 22.5 * weightKg + 499
    if (ageYears <= 18) return 12.2 * weightKg + 746
    if (ageYears <= 30) return 14.7 * weightKg + 496
    if (ageYears <= 60) return 8.7 * weightKg + 829
    return 10.5 * weightKg + 596
  }
}

// 3. Owen (1986 / 1987)
export function calculateOwen(input: BaseMetabolicInput): number {
  const { weightKg, sex } = input
  if (sex === 'male') {
    return 879 + 10.2 * weightKg
  } else {
    return 795 + 7.18 * weightKg
  }
}

// 4. Ireton-Jones (1992 - Clínico / Hospitalario)
export function calculateIretonJones({
  weightKg,
  ageYears,
  sex,
  isVentilated = false,
  isTrauma = false,
  isBurn = false,
  isObese = false,
}: {
  weightKg: number
  ageYears: number
  sex: Sex
  isVentilated?: boolean
  isTrauma?: boolean
  isBurn?: boolean
  isObese?: boolean
}): number {
  if (isVentilated) {
    // EEE(v) = 1784 - (11 x age) + (5 x weight) + (244 x sex[1:male,0:fem]) + (239 x trauma) + (804 x burn)
    const sexVal = sex === 'male' ? 1 : 0
    const traumaVal = isTrauma ? 1 : 0
    const burnVal = isBurn ? 1 : 0
    return 1784 - 11 * ageYears + 5 * weightKg + 244 * sexVal + 239 * traumaVal + 804 * burnVal
  } else {
    // EEE(s) = 629 - (11 x age) + (25 x weight) - (609 x obese)
    const obeseVal = isObese ? 1 : 0
    return 629 - 11 * ageYears + 25 * weightKg - 609 * obeseVal
  }
}

// 5. Penn State (2003b / 2010 - Cuidados Intensivos / Críticos)
export function calculatePennState({
  mifflinBmr,
  minuteVentilationLitersMin = 8.0, // VE (L/min)
  maxTemperatureCelsius = 37.0, // Tmax (°C)
  isObeseBmi30 = false,
}: {
  mifflinBmr: number
  minuteVentilationLitersMin?: number
  maxTemperatureCelsius?: number
  isObeseBmi30?: boolean
}): number {
  if (isObeseBmi30) {
    // PSU 2010 (BMI >= 30)
    // RMR = Mifflin(0.71) + VE(64) + Tmax(85) - 3085
    return mifflinBmr * 0.71 + minuteVentilationLitersMin * 64 + maxTemperatureCelsius * 85 - 3085
  } else {
    // PSU 2003b (BMI < 30)
    // RMR = Mifflin(0.96) + VE(31) + Tmax(167) - 6212
    return mifflinBmr * 0.96 + minuteVentilationLitersMin * 31 + maxTemperatureCelsius * 167 - 6212
  }
}

// 6. Gasto Calórico por Pasos y METs
export function calculateEnergyFromSteps({
  steps,
  weightKg,
  heightCm,
}: {
  steps: number
  weightKg: number
  heightCm: number
}): {
  distanceKm: number
  caloriesBurnedKcal: number
} {
  // Stride length ~ 0.415 of height in meters
  const strideMeters = (heightCm / 100) * 0.415
  const distanceKm = Math.round(((steps * strideMeters) / 1000) * 100) / 100
  // Standard human walking energy cost: ~0.75 kcal per kg per km
  const caloriesBurned = Math.round(distanceKm * weightKg * 0.75)
  return { distanceKm, caloriesBurnedKcal: caloriesBurned }
}

export function calculateEnergyFromMETs({
  met,
  weightKg,
  durationMinutes,
}: {
  met: number
  weightKg: number
  durationMinutes: number
}): number {
  // Kcal = MET x weight (kg) x (durationMin / 60)
  return Math.round(met * weightKg * (durationMinutes / 60))
}

// 7. Ajustes por Necesidades Especiales
export interface SpecialNeedsAdjustment {
  pregnancyTrimester?: 1 | 2 | 3
  isLactating?: boolean
  kidneyDiseaseStage?: 1 | 2 | 3 | 4 | 5
  isElderlySarcopenia?: boolean
}

export function applySpecialNeedsToTDEE(
  baseTdee: number,
  weightKg: number,
  specialNeeds: SpecialNeedsAdjustment
): {
  adjustedTdee: number
  adjustmentsApplied: Array<{ label: string; extraKcal: number }>
  proteinTargetGKg: number
} {
  let adjusted = baseTdee
  const applied: Array<{ label: string; extraKcal: number }> = []
  let proteinTarget = 1.0 // g/kg base

  if (specialNeeds.pregnancyTrimester === 1) {
    adjusted += 85
    applied.push({ label: 'Embarazo 1º Trimestre (+85 kcal/d)', extraKcal: 85 })
    proteinTarget = 1.2
  } else if (specialNeeds.pregnancyTrimester === 2) {
    adjusted += 285
    applied.push({ label: 'Embarazo 2º Trimestre (+285 kcal/d)', extraKcal: 285 })
    proteinTarget = 1.3
  } else if (specialNeeds.pregnancyTrimester === 3) {
    adjusted += 475
    applied.push({ label: 'Embarazo 3º Trimestre (+475 kcal/d)', extraKcal: 475 })
    proteinTarget = 1.4
  }

  if (specialNeeds.isLactating) {
    adjusted += 500
    applied.push({ label: 'Lactancia Materna (+500 kcal/d)', extraKcal: 500 })
    proteinTarget = Math.max(proteinTarget, 1.4)
  }

  if (specialNeeds.isElderlySarcopenia) {
    proteinTarget = Math.max(proteinTarget, 1.2) // Preservación sarcopenia en mayores
  }

  if (specialNeeds.kidneyDiseaseStage) {
    if (specialNeeds.kidneyDiseaseStage <= 4) {
      // Predialysis KDOQI: 30-35 kcal/kg, low protein
      adjusted = Math.max(adjusted, weightKg * 30)
      proteinTarget = 0.7
      applied.push({ label: `Enfermedad Renal Estadio ${specialNeeds.kidneyDiseaseStage} (KDOQI 30-35 kcal/kg, 0.6-0.8g prot/kg)`, extraKcal: 0 })
    } else {
      // Dialysis: higher protein
      proteinTarget = 1.2
      applied.push({ label: 'Enfermedad Renal Estadio 5 en Diálisis (1.2g prot/kg)', extraKcal: 0 })
    }
  }

  return {
    adjustedTdee: Math.round(adjusted),
    adjustmentsApplied: applied,
    proteinTargetGKg: Math.round(proteinTarget * 10) / 10,
  }
}
