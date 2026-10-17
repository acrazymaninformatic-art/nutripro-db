/**
 * Modelo Dinámico de Predicción de Peso Corporal (Tipo NIH Body Weight Planner - Hall et al.)
 * EVSoftware Sección 5.10
 *
 * Supera la regla lineal clásica de Wishnofsky (7.700 kcal/kg) integrando la desaceleración metabólica,
 * la reducción del efecto termogénico y el nuevo punto de equilibrio (plateau).
 */

export interface DynamicWeightPredictionInput {
  currentWeightKg: number
  targetWeightKg: number
  heightCm: number
  ageYears: number
  sex: 'male' | 'female'
  baselineTdee: number
  dailyDeficitKcal: number // e.g. 500 kcal deficit
  activityIncreaseKcal?: number // e.g. 150 kcal from extra steps
  startDate?: Date
}

export interface TrajectoryPoint {
  week: number
  dateString: string
  projectedWeightKg: number
  currentTdeeKcal: number
  cumulativeLossKg: number
}

export interface WeightPredictionResult {
  currentWeightKg: number
  targetWeightKg: number
  totalTargetLossKg: number
  isGoalAchievableWithDeficit: boolean
  estimatedWeeksToGoal: number | null
  estimatedGoalDate: string | null
  plateauWeightKg: number
  weeklyTrajectory: TrajectoryPoint[]
  scenariosComparison: {
    moderateScenario: { label: string; deficitKcal: number; weeksToGoal: number | null; plateauKg: number }
    recommendedScenario: { label: string; deficitKcal: number; weeksToGoal: number | null; plateauKg: number }
    activeScenario: { label: string; deficitKcal: number; extraActivityKcal: number; weeksToGoal: number | null; plateauKg: number }
  }
}

export function calculateDynamicWeightPrediction(
  input: DynamicWeightPredictionInput
): WeightPredictionResult {
  const {
    currentWeightKg,
    targetWeightKg,
    baselineTdee,
    dailyDeficitKcal,
    activityIncreaseKcal = 0,
    startDate = new Date(),
  } = input

  const totalTargetLossKg = Math.round((currentWeightKg - targetWeightKg) * 10) / 10

  // Simulation parameters (Hall et al. model approximation)
  // Dynamic constant: ~22 kcal/day drop in expenditure per kg lost (metabolic adaptation + less mass to move)
  const METABOLIC_ADAPTATION_PER_KG = 22
  const EFFECTIVE_DEFICIT = dailyDeficitKcal + activityIncreaseKcal
  // The plateau occurs when the metabolic reduction equals the deficit
  const maxPossibleLossKg = EFFECTIVE_DEFICIT / METABOLIC_ADAPTATION_PER_KG
  const plateauWeightKg = Math.round((currentWeightKg - maxPossibleLossKg) * 10) / 10

  const isGoalAchievableWithDeficit = targetWeightKg >= plateauWeightKg

  // Run weekly dynamic simulation over 52 weeks (1 year)
  const weeklyTrajectory: TrajectoryPoint[] = []
  let simulatedWeight = currentWeightKg
  let estimatedWeeksToGoal: number | null = null

  // 1 kg of human tissue lost is ~75% fat (7100 kcal/kg) and 25% lean mass (1020 kcal/kg) ≈ 5.580 kcal/kg effective energy density
  const ENERGY_DENSITY_PER_KG_LOST = 5580

  for (let week = 0; week <= 52; week++) {
    const pointDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000)
    const cumulativeLoss = Math.round((currentWeightKg - simulatedWeight) * 10) / 10

    // Current expenditure drops dynamically
    const currentExpenditure = Math.round(
      baselineTdee - cumulativeLoss * METABOLIC_ADAPTATION_PER_KG + activityIncreaseKcal
    )

    weeklyTrajectory.push({
      week,
      dateString: pointDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      projectedWeightKg: Math.round(simulatedWeight * 10) / 10,
      currentTdeeKcal: currentExpenditure,
      cumulativeLossKg: cumulativeLoss,
    })

    if (estimatedWeeksToGoal === null && simulatedWeight <= targetWeightKg) {
      estimatedWeeksToGoal = week
    }

    // Step forward 1 week (7 days)
    const weeklyDeficit = (dailyDeficitKcal + activityIncreaseKcal - cumulativeLoss * METABOLIC_ADAPTATION_PER_KG) * 7
    if (weeklyDeficit > 0) {
      const weeklyWeightLossKg = weeklyDeficit / ENERGY_DENSITY_PER_KG_LOST
      simulatedWeight -= weeklyWeightLossKg
    }
  }

  let estimatedGoalDate: string | null = null
  if (estimatedWeeksToGoal !== null) {
    const goalDate = new Date(startDate.getTime() + estimatedWeeksToGoal * 7 * 24 * 60 * 60 * 1000)
    estimatedGoalDate = goalDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  // Helper for comparison scenarios
  function simulateScenarioWeeks(deficit: number, extraAct: number): { weeks: number | null; plateauKg: number } {
    const totalDef = deficit + extraAct
    const plat = Math.round((currentWeightKg - totalDef / METABOLIC_ADAPTATION_PER_KG) * 10) / 10
    if (targetWeightKg < plat) return { weeks: null, plateauKg: plat }

    let w = currentWeightKg
    for (let wk = 1; wk <= 104; wk++) {
      const cum = currentWeightKg - w
      const netDefWeek = (totalDef - cum * METABOLIC_ADAPTATION_PER_KG) * 7
      if (netDefWeek <= 0) break
      w -= netDefWeek / ENERGY_DENSITY_PER_KG_LOST
      if (w <= targetWeightKg) return { weeks: wk, plateauKg: plat }
    }
    return { weeks: null, plateauKg: plat }
  }

  const moderate = simulateScenarioWeeks(300, 0)
  const recommended = simulateScenarioWeeks(500, 0)
  const active = simulateScenarioWeeks(400, 200)

  return {
    currentWeightKg,
    targetWeightKg,
    totalTargetLossKg,
    isGoalAchievableWithDeficit,
    estimatedWeeksToGoal,
    estimatedGoalDate,
    plateauWeightKg,
    weeklyTrajectory,
    scenariosComparison: {
      moderateScenario: {
        label: 'Déficit Suave (-300 kcal/día)',
        deficitKcal: 300,
        weeksToGoal: moderate.weeks,
        plateauKg: moderate.plateauKg,
      },
      recommendedScenario: {
        label: 'Déficit Clínico Estándar (-500 kcal/día)',
        deficitKcal: 500,
        weeksToGoal: recommended.weeks,
        plateauKg: recommended.plateauKg,
      },
      activeScenario: {
        label: 'Déficit + Actividad Extra (-400 kcal dieta + 200 kcal ejercicio/pasos)',
        deficitKcal: 400,
        extraActivityKcal: 200,
        weeksToGoal: active.weeks,
        plateauKg: active.plateauKg,
      },
    },
  }
}
