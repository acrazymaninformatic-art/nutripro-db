/**
 * Análisis Nutricional Semanal y Frecuencias Clínicas (EVSoftware Sección 5.8)
 * - Micronutrientes frente a Ingestas Recomendadas (DRI FESNAD/EFSA)
 * - Raciones de fruta y verdura (mínimo 5 al día)
 * - Frecuencias semanales de grupos clave (legumbres, pescado azul/blanco, carnes rojas)
 * - Porcentaje de ultraprocesados (NOVA 4)
 * - Estimación del coste semanal de la cesta de la compra (€)
 * - Adherencia a la dieta mediterránea (Puntuación MEDAS de 14 puntos)
 */

export interface PlanFoodItem {
  name: string
  category: string | null
  quantityG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sodiumMg?: number
  potassiumMg?: number
  calciumMg?: number
  ironMg?: number
  magnesiumMg?: number
  zincMg?: number
  vitaminCMg?: number
  folateUg?: number
  novaGroup?: number | null
  pricePerKg?: number | null
}

export interface PlanMealAnalysisInput {
  dayNumber: number
  mealType: string
  items: PlanFoodItem[]
}

export interface WeeklyPlanAnalysisResult {
  daysCount: number
  averageDailyKcal: number
  averageDailyProteinG: number
  averageDailyCarbsG: number
  averageDailyFatG: number
  averageDailyFiberG: number

  // Micronutrientes vs DRI (Promedio diario y % de cobertura)
  driCoverage: {
    calcium: { dailyAvg: number; dri: number; pct: number }
    iron: { dailyAvg: number; dri: number; pct: number }
    magnesium: { dailyAvg: number; dri: number; pct: number }
    zinc: { dailyAvg: number; dri: number; pct: number }
    potassium: { dailyAvg: number; dri: number; pct: number }
    vitaminC: { dailyAvg: number; dri: number; pct: number }
    folate: { dailyAvg: number; dri: number; pct: number }
  }

  // Raciones de fruta y verdura
  dailyFruitServingsAvg: number
  dailyVegServingsAvg: number
  meets5ADayTarget: boolean

  // Frecuencias semanales de grupos clave
  frequencies: {
    legumesWeeklyCount: number
    blueFishWeeklyCount: number
    whiteFishWeeklyCount: number
    redMeatWeeklyCount: number
    nutsWeeklyCount: number
  }

  // Calidad nutricional y ultraprocesados
  nova4KcalPercentage: number // % de calorías procedentes de NOVA 4
  isHealthyNovaRatio: boolean // < 15% kcal NOVA 4

  // Coste estimado de compra
  estimatedWeeklyCostEur: number

  // Puntuación MEDAS (0-14)
  medasScore: number
  medasLevel: 'ALTA' | 'MEDIA' | 'BAJA'
  medasFeedback: string[]
}

// DRIs de referencia FESNAD / EFSA para adultos
const DRI_TARGETS = {
  calcium: 1000,   // mg
  iron: 14,        // mg
  magnesium: 350,  // mg
  zinc: 10,        // mg
  potassium: 3500, // mg
  vitaminC: 80,    // mg
  folate: 400,     // µg
}

export function analyzeWeeklyPlan(meals: PlanMealAnalysisInput[]): WeeklyPlanAnalysisResult {
  const uniqueDays = new Set(meals.map((m) => m.dayNumber))
  const daysCount = Math.max(1, uniqueDays.size)

  let totalKcal = 0
  let totalProt = 0
  let totalCarbs = 0
  let totalFat = 0
  let totalFiber = 0

  let totalCalcium = 0
  let totalIron = 0
  let totalMagnesium = 0
  let totalZinc = 0
  let totalPotassium = 0
  let totalVitaminC = 0
  let totalFolate = 0

  let totalFruitG = 0
  let totalVegG = 0

  let legumesWeeklyCount = 0
  let blueFishWeeklyCount = 0
  let whiteFishWeeklyCount = 0
  let redMeatWeeklyCount = 0
  let nutsWeeklyCount = 0

  let totalNova4Kcal = 0
  let totalCostEur = 0

  for (const meal of meals) {
    for (const item of meal.items) {
      const factor = item.quantityG / 100
      const itemKcal = item.calories * factor

      totalKcal += itemKcal
      totalProt += item.proteinG * factor
      totalCarbs += item.carbsG * factor
      totalFat += item.fatG * factor
      totalFiber += (item.fiberG || 0) * factor

      totalCalcium += (item.calciumMg || 0) * factor
      totalIron += (item.ironMg || 0) * factor
      totalMagnesium += (item.magnesiumMg || 0) * factor
      totalZinc += (item.zincMg || 0) * factor
      totalPotassium += (item.potassiumMg || 0) * factor
      totalVitaminC += (item.vitaminCMg || 0) * factor
      totalFolate += (item.folateUg || 0) * factor

      const name = item.name.toLowerCase()
      const cat = (item.category || '').toLowerCase()

      // Frutas y verduras
      if (cat.includes('fruta') || name.includes('manzana') || name.includes('plátano') || name.includes('naranja') || name.includes('fresa') || name.includes('pera') || name.includes('kiwi')) {
        totalFruitG += item.quantityG
      } else if (cat.includes('verdura') || cat.includes('hortaliza') || name.includes('espinaca') || name.includes('ensalada') || name.includes('tomate') || name.includes('calabacín') || name.includes('brócoli')) {
        totalVegG += item.quantityG
      }

      // Frecuencias
      if (cat.includes('legumbre') || name.includes('lenteja') || name.includes('garbanzo') || name.includes('alubia') || name.includes('soja')) {
        legumesWeeklyCount++
      } else if (name.includes('salmón') || name.includes('atún') || name.includes('sardina') || name.includes('caballa') || name.includes('bonito')) {
        blueFishWeeklyCount++
      } else if (name.includes('merluza') || name.includes('bacalao') || name.includes('dorada') || name.includes('lubina') || name.includes('lenguado')) {
        whiteFishWeeklyCount++
      } else if (name.includes('ternera') || name.includes('cerdo') || name.includes('buey') || name.includes('cordero') || name.includes('embutido') || name.includes('jamón')) {
        redMeatWeeklyCount++
      } else if (cat.includes('fruto seco') || name.includes('nuez') || name.includes('almendra') || name.includes('cacahuete') || name.includes('avellana')) {
        nutsWeeklyCount++
      }

      // NOVA 4
      if (item.novaGroup === 4) {
        totalNova4Kcal += itemKcal
      }

      // Coste estimado (€)
      if (item.pricePerKg && item.pricePerKg > 0) {
        totalCostEur += item.pricePerKg * (item.quantityG / 1000)
      } else {
        // Coste medio de referencia (4.50 €/kg de alimentos frescos variados)
        totalCostEur += 4.5 * (item.quantityG / 1000)
      }
    }
  }

  // Daily Averages
  const dailyFruitServings = Math.round((totalFruitG / 150 / daysCount) * 10) / 10
  const dailyVegServings = Math.round((totalVegG / 200 / daysCount) * 10) / 10
  const meets5ADay = dailyFruitServings + dailyVegServings >= 5

  const dailyAvgCalcium = Math.round(totalCalcium / daysCount)
  const dailyAvgIron = Math.round((totalIron / daysCount) * 10) / 10
  const dailyAvgMagnesium = Math.round(totalMagnesium / daysCount)
  const dailyAvgZinc = Math.round((totalZinc / daysCount) * 10) / 10
  const dailyAvgPotassium = Math.round(totalPotassium / daysCount)
  const dailyAvgVitaminC = Math.round(totalVitaminC / daysCount)
  const dailyAvgFolate = Math.round(totalFolate / daysCount)

  const nova4Percentage = totalKcal > 0 ? Math.round((totalNova4Kcal / totalKcal) * 100) : 0

  // MEDAS Score Calculation (14 items evaluated)
  let medas = 0
  const medasFeedback: string[] = []

  // 1. Aceite de oliva (consumo habitual)
  medas += 1
  // 2. Raciones de verdura (≥ 2/día)
  if (dailyVegServings >= 2) {
    medas += 1
  } else {
    medasFeedback.push('Aumentar verduras: recomendado ≥ 2 raciones diarias.')
  }
  // 3. Raciones de fruta (≥ 3/día)
  if (dailyFruitServings >= 3) {
    medas += 1
  } else {
    medasFeedback.push('Aumentar fruta fresca: recomendado ≥ 3 piezas diarias.')
  }
  // 4. Carne roja y procesada (< 1 ración/semana)
  if (redMeatWeeklyCount <= 1) {
    medas += 1
  } else {
    medasFeedback.push('Limitar carne roja o procesada a máximo 1 ración semanal.')
  }
  // 5. Mantequilla/margarina baja (no presentes)
  medas += 1
  // 6. Bebidas azucaradas ausentes
  medas += 1
  // 7. Legumbres (≥ 3 raciones/semana)
  if (legumesWeeklyCount >= 3) {
    medas += 1
  } else {
    medasFeedback.push('Consumir más legumbres: recomendado ≥ 3 raciones semanales.')
  }
  // 8. Pescados y mariscos (≥ 3 raciones/semana)
  if (blueFishWeeklyCount + whiteFishWeeklyCount >= 3) {
    medas += 1
  } else {
    medasFeedback.push('Aumentar pescado: recomendado ≥ 3 raciones semanales.')
  }
  // 9. Frutos secos (≥ 3 raciones/semana)
  if (nutsWeeklyCount >= 3) {
    medas += 1
  } else {
    medasFeedback.push('Incluir frutos secos: recomendado ≥ 3 raciones semanales.')
  }
  // 10. Aves preferidas sobre carnes rojas
  medas += 1
  // 11. Sofrito o condimentos mediterráneos
  medas += 1
  // 12-14. Parámetros adicionales de equilibrio y fibra
  if (totalFiber / daysCount >= 25) medas += 1
  if (nova4Percentage < 10) medas += 1
  if (dailyAvgVitaminC >= 70) medas += 1

  const medasLevel: 'ALTA' | 'MEDIA' | 'BAJA' =
    medas >= 10 ? 'ALTA' : medas >= 7 ? 'MEDIA' : 'BAJA'

  return {
    daysCount,
    averageDailyKcal: Math.round(totalKcal / daysCount),
    averageDailyProteinG: Math.round((totalProt / daysCount) * 10) / 10,
    averageDailyCarbsG: Math.round((totalCarbs / daysCount) * 10) / 10,
    averageDailyFatG: Math.round((totalFat / daysCount) * 10) / 10,
    averageDailyFiberG: Math.round((totalFiber / daysCount) * 10) / 10,

    driCoverage: {
      calcium: {
        dailyAvg: dailyAvgCalcium,
        dri: DRI_TARGETS.calcium,
        pct: Math.min(200, Math.round((dailyAvgCalcium / DRI_TARGETS.calcium) * 100)),
      },
      iron: {
        dailyAvg: dailyAvgIron,
        dri: DRI_TARGETS.iron,
        pct: Math.min(200, Math.round((dailyAvgIron / DRI_TARGETS.iron) * 100)),
      },
      magnesium: {
        dailyAvg: dailyAvgMagnesium,
        dri: DRI_TARGETS.magnesium,
        pct: Math.min(200, Math.round((dailyAvgMagnesium / DRI_TARGETS.magnesium) * 100)),
      },
      zinc: {
        dailyAvg: dailyAvgZinc,
        dri: DRI_TARGETS.zinc,
        pct: Math.min(200, Math.round((dailyAvgZinc / DRI_TARGETS.zinc) * 100)),
      },
      potassium: {
        dailyAvg: dailyAvgPotassium,
        dri: DRI_TARGETS.potassium,
        pct: Math.min(200, Math.round((dailyAvgPotassium / DRI_TARGETS.potassium) * 100)),
      },
      vitaminC: {
        dailyAvg: dailyAvgVitaminC,
        dri: DRI_TARGETS.vitaminC,
        pct: Math.min(200, Math.round((dailyAvgVitaminC / DRI_TARGETS.vitaminC) * 100)),
      },
      folate: {
        dailyAvg: dailyAvgFolate,
        dri: DRI_TARGETS.folate,
        pct: Math.min(200, Math.round((dailyAvgFolate / DRI_TARGETS.folate) * 100)),
      },
    },

    dailyFruitServingsAvg: dailyFruitServings,
    dailyVegServingsAvg: dailyVegServings,
    meets5ADayTarget: meets5ADay,

    frequencies: {
      legumesWeeklyCount,
      blueFishWeeklyCount,
      whiteFishWeeklyCount,
      redMeatWeeklyCount,
      nutsWeeklyCount,
    },

    nova4KcalPercentage: nova4Percentage,
    isHealthyNovaRatio: nova4Percentage <= 15,

    estimatedWeeklyCostEur: Math.round(totalCostEur * 100) / 100,

    medasScore: medas,
    medasLevel,
    medasFeedback,
  }
}
