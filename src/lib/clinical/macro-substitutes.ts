/**
 * Motor de Sustitutos por Macros (EVSoftware Sección 5.8)
 * Sugiere alternativas nutricionalmente equivalentes (kcal y macronutrientes)
 * respetando estrictamente los alérgenos del paciente y emitiendo avisos ante aversiones/preferencias.
 */

import { prisma } from '@/lib/prisma'

export interface MacroTarget {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  quantityG: number
}

export interface FoodSubstituteSuggestion {
  foodId: number
  name: string
  category: string | null
  suggestedQuantityG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  diffKcal: number
  diffProteinG: number
  matchScore: number // 0-100, 100 being identical
  hasAversionWarning?: boolean
  aversionReason?: string
}

export async function findMacroSubstitutes({
  sourceFoodId,
  quantityG,
  patientAllergens = [],
  patientAversions = [],
  limit = 8,
}: {
  sourceFoodId: number
  quantityG: number
  patientAllergens?: string[]
  patientAversions?: string[]
  limit?: number
}): Promise<FoodSubstituteSuggestion[]> {
  const sourceFood = await prisma.food.findUnique({
    where: { id: sourceFoodId },
  })

  if (!sourceFood) return []

  const factor = quantityG / 100
  const targetCalories = sourceFood.calories * factor
  const targetProteinG = sourceFood.proteinG * factor
  const targetCarbsG = sourceFood.carbsG * factor
  const targetFatG = sourceFood.fatG * factor

  // Candidates in the same category or overall catalog
  const candidates = await prisma.food.findMany({
    where: {
      id: { not: sourceFoodId },
      calories: { gt: 10 },
    },
    take: 300,
  })

  const allergenLower = patientAllergens.map((a) => a.toLowerCase().trim())
  const aversionsLower = patientAversions.map((a) => a.toLowerCase().trim())

  const suggestions: FoodSubstituteSuggestion[] = []

  for (const cand of candidates) {
    // 1. Hard check: Allergen exclusion (Safety 5.1)
    let candAllergens: string[] = []
    try {
      candAllergens = cand.allergensJson ? JSON.parse(cand.allergensJson) : []
    } catch {
      candAllergens = []
    }

    const hasAllergenConflict = candAllergens.some((a) =>
      allergenLower.some((userAllergy) => a.toLowerCase().includes(userAllergy))
    )
    if (hasAllergenConflict) continue

    // 2. Soft check: Patient Aversions (Preference 5.8)
    const candNameLower = cand.name.toLowerCase()
    let hasAversion = false
    let aversionReason: string | undefined

    for (const av of aversionsLower) {
      if (av && candNameLower.includes(av)) {
        hasAversion = true
        aversionReason = `Rechazo anotado en ficha del paciente: "${av}"`
        break
      }
    }

    // 3. Compute equivalent portion based on primary macro or calories
    // If food has high protein, scale by protein; otherwise scale by calories
    let suggestedG = 100
    if (targetProteinG >= 10 && cand.proteinG > 5) {
      suggestedG = Math.round((targetProteinG / cand.proteinG) * 100)
    } else if (cand.calories > 0) {
      suggestedG = Math.round((targetCalories / cand.calories) * 100)
    }

    if (suggestedG <= 0 || suggestedG > 800) continue

    const candFactor = suggestedG / 100
    const candKcal = Math.round(cand.calories * candFactor)
    const candProt = Math.round(cand.proteinG * candFactor * 10) / 10
    const candCarbs = Math.round(cand.carbsG * candFactor * 10) / 10
    const candFat = Math.round(cand.fatG * candFactor * 10) / 10

    const diffKcal = Math.abs(candKcal - targetCalories)
    const diffProt = Math.abs(candProt - targetProteinG)
    const diffCarbs = Math.abs(candCarbs - targetCarbsG)
    const diffFat = Math.abs(candFat - targetFatG)

    // Match score based on macro proximity
    const kcalScore = Math.max(0, 40 - (diffKcal / Math.max(1, targetCalories)) * 40)
    const protScore = Math.max(0, 30 - (diffProt / Math.max(1, targetProteinG)) * 30)
    const carbsScore = Math.max(0, 15 - (diffCarbs / Math.max(1, targetCarbsG)) * 15)
    const fatScore = Math.max(0, 15 - (diffFat / Math.max(1, targetFatG)) * 15)
    const matchScore = Math.round(kcalScore + protScore + carbsScore + fatScore)

    // Category bonus
    const isSameCategory = cand.category === sourceFood.category

    suggestions.push({
      foodId: cand.id,
      name: cand.name,
      category: cand.category,
      suggestedQuantityG: suggestedG,
      calories: candKcal,
      proteinG: candProt,
      carbsG: candCarbs,
      fatG: candFat,
      diffKcal: Math.round(candKcal - targetCalories),
      diffProteinG: Math.round((candProt - targetProteinG) * 10) / 10,
      matchScore: isSameCategory ? Math.min(100, matchScore + 10) : matchScore,
      hasAversionWarning: hasAversion,
      aversionReason,
    })
  }

  // Sort by match score descending, placing foods without aversion warnings first
  return suggestions
    .sort((a, b) => {
      if (a.hasAversionWarning && !b.hasAversionWarning) return 1
      if (!a.hasAversionWarning && b.hasAversionWarning) return -1
      return b.matchScore - a.matchScore
    })
    .slice(0, limit)
}
