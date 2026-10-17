/**
 * Motor de Interacciones y Absorción de Nutrientes (EVSoftware Sección 5.8)
 * Analiza combinaciones en cada toma (hierro vs inhibidores/potenciadores, calcio vs oxalatos)
 * emitiendo recomendaciones y ajustes sugeridos basados en AbsorptionInteractionRule.
 */

import { prisma } from '@/lib/prisma'

export interface MealItemAnalysisInput {
  foodId?: number | null
  foodName: string
  quantityG: number
  ironMg?: number
  calciumMg?: number
  vitaminCMg?: number
  zincMg?: number
  oxalatesMg?: number
  category?: string | null
}

export interface NutrientInteractionAlert {
  ruleId: string
  ruleName: string
  nutrientTarget: string
  severity: 'WARNING' | 'SUGGESTION' | 'OPTIMIZATION'
  message: string
  suggestedAdjustment: string
  involvedFoods: string[]
}

const DEFAULT_ABSORPTION_RULES = [
  {
    name: 'Interacción Hierro no hemo e inhibidores (Café, Té, Calcio)',
    nutrientTarget: 'HIERRO',
    inhibitorKeywords: ['cafe', 'café', 'te', 'té', 'leche', 'queso', 'yogur', 'lacteo', 'lácteo'],
    enhancerKeywords: ['naranja', 'limon', 'limón', 'kiwi', 'pimiento', 'fresas', 'tomate', 'mandarina'],
    recommendationMessage:
      'La toma contiene alimentos ricos en hierro no hemo junto a inhibidores de la absorción (café, té o lácteos ricos en calcio).',
    suggestedAdjustment:
      'Separar el café/té o lácteos 1-2 horas de la comida principal o añadir una fuente de vitamina C (cítricos, kiwi, pimiento crudo) para potenciar la biodisponibilidad del hierro.',
  },
  {
    name: 'Biodisponibilidad de Calcio frente a Oxalatos',
    nutrientTarget: 'CALCIO',
    inhibitorKeywords: ['espinaca', 'espinacas', 'acelga', 'acelgas', 'remolacha', 'ruibarbo', 'cacao_puro'],
    enhancerKeywords: [],
    recommendationMessage:
      'Alimentos con alto contenido en oxalatos reducen la biodisponibilidad del calcio presente en esta toma.',
    suggestedAdjustment:
      'Optar por verduras de hoja baja en oxalatos (brócoli, col rizada, berros) o asegurar fuentes de calcio en tomas separadas.',
  },
  {
    name: 'Interacción Cinc y Fitatos / Exceso de Fibra',
    nutrientTarget: 'ZINC',
    inhibitorKeywords: ['salvado', 'fibra_pura', 'cereales_integrales_crudos'],
    enhancerKeywords: ['proteina_animal', 'huevo', 'pescado', 'carne'],
    recommendationMessage:
      'Alta concentración de fitatos o salvado que puede competir con la absorción intestinal de zinc.',
    suggestedAdjustment:
      'Recomendar técnicas de remojo, fermentación o germinación de cereales y legumbres para reducir el ácido fítico.',
  },
]

export async function analyzeMealAbsorptionInteractions(
  mealItems: MealItemAnalysisInput[],
  userId?: string
): Promise<NutrientInteractionAlert[]> {
  if (!mealItems || mealItems.length === 0) return []

  // Load custom rules from database or fallback to defaults
  let dbRules = await prisma.absorptionInteractionRule.findMany({
    where: {
      isEnabled: true,
      OR: [{ userId: null }, { userId }],
    },
  })

  // Seed default rules if database is empty
  if (dbRules.length === 0) {
    for (const r of DEFAULT_ABSORPTION_RULES) {
      await prisma.absorptionInteractionRule.create({
        data: {
          name: r.name,
          nutrientTarget: r.nutrientTarget,
          inhibitorKeywordsJson: JSON.stringify(r.inhibitorKeywords),
          enhancerKeywordsJson: JSON.stringify(r.enhancerKeywords),
          recommendationMessage: r.recommendationMessage,
          suggestedAdjustment: r.suggestedAdjustment,
          isEnabled: true,
          isCustom: false,
        },
      })
    }
    dbRules = await prisma.absorptionInteractionRule.findMany({
      where: { isEnabled: true },
    })
  }

  const alerts: NutrientInteractionAlert[] = []

  for (const rule of dbRules) {
    let inhibitors: string[] = []
    let enhancers: string[] = []
    try {
      inhibitors = JSON.parse(rule.inhibitorKeywordsJson)
      enhancers = JSON.parse(rule.enhancerKeywordsJson)
    } catch {
      continue
    }

    const involvedInhibitors: string[] = []
    const involvedEnhancers: string[] = []
    let hasTargetNutrient = false

    // Check presence of target nutrient (e.g. Iron, Calcium)
    for (const item of mealItems) {
      const nameLower = item.foodName.toLowerCase()

      if (rule.nutrientTarget === 'HIERRO') {
        if ((item.ironMg && item.ironMg >= 1.5) || nameLower.includes('lenteja') || nameLower.includes('garbanzo') || nameLower.includes('espinaca') || nameLower.includes('tofu')) {
          hasTargetNutrient = true
        }
      } else if (rule.nutrientTarget === 'CALCIO') {
        if ((item.calciumMg && item.calciumMg >= 100) || nameLower.includes('leche') || nameLower.includes('queso') || nameLower.includes('yogur') || nameLower.includes('semillas')) {
          hasTargetNutrient = true
        }
      } else if (rule.nutrientTarget === 'ZINC') {
        if ((item.zincMg && item.zincMg >= 1.5) || nameLower.includes('carne') || nameLower.includes('semilla')) {
          hasTargetNutrient = true
        }
      }

      // Check inhibitors
      for (const inh of inhibitors) {
        if (nameLower.includes(inh.toLowerCase())) {
          involvedInhibitors.push(item.foodName)
          break
        }
      }

      // Check enhancers
      for (const enh of enhancers) {
        if (nameLower.includes(enh.toLowerCase()) || (item.vitaminCMg && item.vitaminCMg >= 30)) {
          involvedEnhancers.push(item.foodName)
          break
        }
      }
    }

    // If target nutrient and inhibitor are both present and no enhancers are present
    if (hasTargetNutrient && involvedInhibitors.length > 0) {
      if (involvedEnhancers.length === 0) {
        alerts.push({
          ruleId: rule.id,
          ruleName: rule.name,
          nutrientTarget: rule.nutrientTarget,
          severity: 'WARNING',
          message: rule.recommendationMessage,
          suggestedAdjustment: rule.suggestedAdjustment || 'Ajustar la combinación de la toma.',
          involvedFoods: [...new Set(involvedInhibitors)],
        })
      } else {
        // Inhibitor present but neutralized by enhancer
        alerts.push({
          ruleId: rule.id,
          ruleName: rule.name,
          nutrientTarget: rule.nutrientTarget,
          severity: 'OPTIMIZATION',
          message: `Combinación compensada: los inhibidores (${involvedInhibitors.join(', ')}) se equilibran con potenciadores presentes (${involvedEnhancers.join(', ')}).`,
          suggestedAdjustment: 'Mantener la presencia del potenciador en esta comida.',
          involvedFoods: [...new Set([...involvedInhibitors, ...involvedEnhancers])],
        })
      }
    }
  }

  return alerts
}
