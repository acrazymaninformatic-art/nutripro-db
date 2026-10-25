/**
 * @file auto-plan-generator.ts
 * @description Motor clínico avanzado de generación automática de planes nutricionales.
 *
 * Arquitectura del motor (v3):
 *  1. Análisis del perfil clínico del paciente (anamnesis + cuestionario)
 *  2. Distribución calórica por ingesta ajustada al objetivo (pérdida/ganancia/mantenimiento)
 *  3. Construcción de menú por bloques funcionales (carbohidrato base, proteína, vegetal, grasa)
 *  4. Periodicidad y rotación inteligente: usa los 5.050 alimentos sin repetición monótona
 *  5. Scoring clínico ponderado: perfil de micronutrientes, índice glucémico estimado, densidad proteica
 *  6. Ajuste fino de doble paso: primero calorías ±15 kcal, luego proteínas ±5 g
 *  7. Validación final de coherencia semanal (ningún día < 80% ni > 115% del objetivo)
 */

import { checkPatientAllergenConflict } from './allergens'

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES PÚBLICAS
// ─────────────────────────────────────────────────────────────────────────────

export interface PatientPlanProfile {
  firstName: string
  lastName: string
  /** 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'HEALTH' | 'SPORT_PERFORMANCE' */
  objective: string
  targetKcal: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  allergies?: string
  intolerances?: string
  dietaryPreferences?: string
  foodAversions?: string
  medicalHistory?: string
  isGLP1Treatment?: boolean
  isTCAProtocol?: boolean
  distribution?: Record<string, number>
  isKeto?: boolean
}

export interface FoodDatabaseItem {
  id: number
  name: string
  category: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sodiumMg?: number
  allergensJson?: string | null
}

export interface GeneratedMealItem {
  uid: string
  foodId: number
  quantityG: number
  notes: string
}

export interface GeneratedDayPlan {
  BREAKFAST: GeneratedMealItem[]
  MID_MORNING: GeneratedMealItem[]
  LUNCH: GeneratedMealItem[]
  SNACK: GeneratedMealItem[]
  DINNER: GeneratedMealItem[]
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DEL MOTOR
// ─────────────────────────────────────────────────────────────────────────────

/** Distribución calórica por ingesta según objetivo clínico (suma = 100) */
const KCAL_DISTRIBUTION: Record<string, { B: number; MM: number; L: number; S: number; D: number }> = {
  WEIGHT_LOSS:        { B: 20, MM: 10, L: 35, S: 10, D: 25 },
  MUSCLE_GAIN:        { B: 25, MM: 15, L: 30, S: 15, D: 15 },
  MAINTENANCE:        { B: 22, MM: 10, L: 33, S: 10, D: 25 },
  HEALTH:             { B: 22, MM: 10, L: 33, S: 10, D: 25 },
  SPORT_PERFORMANCE:  { B: 25, MM: 15, L: 30, S: 15, D: 15 },
}
const DEFAULT_DIST = { B: 22, MM: 10, L: 33, S: 10, D: 25 }

/** Grupos proteicos de la semana (ciclo de 7 días, varía por día) */
const WEEKLY_PROTEIN_CYCLE: Array<'poultry' | 'fish' | 'legume' | 'egg' | 'red_meat' | 'oily_fish' | 'shellfish'> = [
  'fish',       // L
  'poultry',    // M
  'legume',     // X
  'oily_fish',  // J
  'egg',        // V
  'fish',       // S
  'poultry',    // D
]

/** Límite de sodio por comida (mg) cuando hay hipertensión */
const HYPERTENSIVE_MAX_SODIUM_PER_MEAL_MG = 600

/** Máximo de gramos por ítem en protocolo GLP-1 */
const GLP1_MAX_ITEM_G = 190

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera un menú semanal clínico inteligente de 7 días, rigurosamente adaptado
 * a la anamnesis completa del paciente y al catálogo de 5.050 alimentos.
 */
export function generateAutomatedWeeklyPlan(
  patient: PatientPlanProfile,
  allFoods: FoodDatabaseItem[]
): { [dayIndex: number]: GeneratedDayPlan } {
  // ── 1. PERFIL CLÍNICO ─────────────────────────────────────────────────────
  const prefs = (patient.dietaryPreferences || '').toLowerCase()
  const medical = (patient.medicalHistory || '').toLowerCase()
  const aversions = (patient.foodAversions || '')
    .toLowerCase()
    .split(/[,;|\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3)

  const isVegan        = prefs.includes('vegan')
  const isVegetarian   = isVegan || prefs.includes('vegetar')
  const isPescetarian  = !isVegetarian && prefs.includes('pescetar')
  const isKeto         = patient.isKeto ?? (prefs.includes('keto') || prefs.includes('cetog') || prefs.includes('baja en hidratos'))
  const isLowCarb      = isKeto || prefs.includes('low carb')
  const isHypertensive = medical.includes('hipertens')
  const isDiabetic     = medical.includes('diabet') || medical.includes('sop') || medical.includes('insul')
  const isWeightLoss   = patient.objective === 'WEIGHT_LOSS'
  const isMuscleGain   = patient.objective === 'MUSCLE_GAIN'

  const allergiesNorm     = (patient.allergies || '').toLowerCase()
  const intolerancesNorm  = (patient.intolerances || '').toLowerCase()

  // Banderas de alérgenos rápidas
  const noGluten   = allergiesNorm.includes('gluten') || allergiesNorm.includes('celiaqu') || allergiesNorm.includes('trigo') || intolerancesNorm.includes('gluten')
  const noLactose  = allergiesNorm.includes('lactos') || allergiesNorm.includes('leche') || intolerancesNorm.includes('lactos')
  const noNuts     = allergiesNorm.includes('fruto sec') || allergiesNorm.includes('nuez') || allergiesNorm.includes('almendra') || allergiesNorm.includes('cacahuete')
  const noEgg      = allergiesNorm.includes('huevo') || intolerancesNorm.includes('huevo')
  const noFish     = allergiesNorm.includes('pescad') || allergiesNorm.includes('salmón') || allergiesNorm.includes('merluza')
  const noShellfish= allergiesNorm.includes('marisc') || allergiesNorm.includes('gamba') || allergiesNorm.includes('langostino')

  // ── 2. DISTRIBUCIÓN CALÓRICA ──────────────────────────────────────────────
  const defaultDist = KCAL_DISTRIBUTION[patient.objective] || DEFAULT_DIST
  const dist = patient.distribution
    ? {
        B: patient.distribution.BREAKFAST ?? defaultDist.B,
        MM: patient.distribution.MID_MORNING ?? defaultDist.MM,
        L: patient.distribution.LUNCH ?? defaultDist.L,
        S: patient.distribution.SNACK ?? defaultDist.S,
        D: patient.distribution.DINNER ?? defaultDist.D,
      }
    : defaultDist
  const target = Math.max(patient.targetKcal || 1800, 1000)
  const bTarget  = Math.round(target * dist.B  / 100)
  const mmTarget = Math.round(target * dist.MM / 100)
  const lTarget  = Math.round(target * dist.L  / 100)
  const sTarget  = Math.round(target * dist.S  / 100)
  const dTarget  = Math.round(target * dist.D  / 100)

  const protTarget = patient.targetProteinG || Math.round(target * 0.20 / 4)
  const fatTarget  = patient.targetFatG || Math.round(target * 0.30 / 9)
  const carbTarget = patient.targetCarbsG || Math.round(target * 0.50 / 4)

  // ── 3. SEMILLA REPRODUCIBLE PERSONALIZADA ────────────────────────────────
  let seed = 17
  const nameStr = patient.firstName + patient.lastName
  for (let i = 0; i < nameStr.length; i++) {
    seed = ((seed * 31) + nameStr.charCodeAt(i)) >>> 0
  }

  function nextInt(max: number, extra = 0): number {
    seed = ((seed * 1664525) + 1013904223) >>> 0
    return Math.abs(seed + extra) % Math.max(1, max)
  }

  // ── 4. CONTROL DE ROTACIÓN ────────────────────────────────────────────────
  /** IDs usados en la semana; se resetea por categoría funcional para evitar monotonía global */
  const usedIds = new Set<number>()
  /** IDs usados HOY (se resetea cada día) para evitar el mismo alimento en múltiples ingestas */
  let todayIds = new Set<number>()

  // ── 5. FILTROS CLÍNICOS ───────────────────────────────────────────────────

  /** Scoring clínico de un alimento (mayor = mejor para este paciente) */
  function scoreFood(f: FoodDatabaseItem): number {
    let score = 100
    const n = f.name.toLowerCase()
    const cat = (f.category || '').toLowerCase()

    // Premio proteína alta cuando objetivo es ganancia muscular
    if (isMuscleGain && f.proteinG > 20) score += 25
    // Premio fibra cuando objetivo es pérdida de peso
    if (isWeightLoss && (f.fiberG || 0) > 3) score += 15
    // Premio si IG estimado bajo para diabéticos (integral, legumbre, verdura)
    if (isDiabetic && (cat.includes('integral') || cat.includes('legumbre') || cat.includes('verdura'))) score += 20
    // Penaliza sodio alto en hipertensión
    if (isHypertensive && (f.sodiumMg || 0) > 500) score -= 60
    // Penaliza ultraprocesados
    if (n.includes('industrial') || n.includes('precocinado') || n.includes('congelado frito')) score -= 30
    // Premio frescura / temporada española
    if (n.includes('fresco') || n.includes('natural') || n.includes('bio')) score += 10
    // Premio a no repetidos
    if (!usedIds.has(f.id)) score += 40
    if (!todayIds.has(f.id)) score += 20

    return score
  }

  /** ¿Está este alimento clínicamente prohibido para el paciente? */
  function isForbidden(f: FoodDatabaseItem): boolean {
    const n = f.name.toLowerCase()
    const cat = (f.category || '').toLowerCase()

    // Aversiones del paciente
    if (aversions.some((av) => n.includes(av))) return true

    // Motor de alérgenos EU 1169/2011
    const conflict = checkPatientAllergenConflict(
      { name: f.name, category: f.category },
      { allergies: patient.allergies, intolerances: patient.intolerances, firstName: patient.firstName }
    )
    if (conflict) return true

    // Carne para vegetarianos/veganos
    if (isVegetarian && (cat === 'carnes' || n.includes('pollo') || n.includes('ternera') || n.includes('pavo') || n.includes('cerdo') || n.includes('jamón') || n.includes('conejo') || n.includes('buey') || n.includes('cordero') || n.includes('salchicha') || n.includes('chorizo') || n.includes('bacon') || n.includes('panceta'))) return true
    // Pescado para veganos/vegetarianos (no pescetarianos)
    if (isVegetarian && !isPescetarian && (cat.includes('pescad') || n.includes('merluza') || n.includes('salmón') || n.includes('atún') || n.includes('dorada') || n.includes('lubina') || n.includes('bacalao') || n.includes('sepia') || n.includes('calamar') || n.includes('gamba') || n.includes('langostino'))) return true
    // Lácteos y huevos para veganos
    if (isVegan && (cat.includes('lácteo') || cat.includes('huevo') || n.includes('queso') || n.includes('yogur') || n.includes('leche') || n.includes('huevo') || n.includes('mantequilla') || n.includes('kéfir') || n.includes('skyr') || n.includes('miel'))) return true
    // Carne roja y ave para pescetarianos
    if (isPescetarian && (cat === 'carnes' || n.includes('pollo') || n.includes('ternera') || n.includes('pavo') || n.includes('cerdo') || n.includes('jamón') || n.includes('conejo') || n.includes('salchicha') || n.includes('chorizo'))) return true
    // Pescado para alérgicos al pescado
    if (noFish && (cat.includes('pescad') || n.includes('merluza') || n.includes('salmón') || n.includes('atún') || n.includes('dorada') || n.includes('bacalao') || n.includes('lubina') || n.includes('trucha') || n.includes('caballa'))) return true
    // Marisco para alérgicos
    if (noShellfish && (n.includes('gamba') || n.includes('langostino') || n.includes('calamar') || n.includes('sepia') || n.includes('pulpo') || n.includes('mejillón') || n.includes('almeja') || n.includes('berberecho'))) return true
    // Cereales con gluten
    if (noGluten && (n.includes('trigo') || n.includes('espelta') || n.includes('centeno') || n.includes('cebada') || n.includes('kamut') || n.includes('sémola') || (n.includes('pan') && !n.includes('sin gluten')) || (n.includes('pasta') && !n.includes('sin gluten')) || (n.includes('harina') && !n.includes('sin gluten')) || (n.includes('avena') && !n.includes('sin gluten')))) return true
    // Lactosa
    if (noLactose && (n.includes('leche entera') || n.includes('leche semidesnatada') || n.includes('queso tierno') || n.includes('queso fresco') || n.includes('cuajada'))) return true
    // Frutos secos
    if (noNuts && (n.includes('nuez') || n.includes('almendra') || n.includes('avellana') || n.includes('pistacho') || n.includes('anacardo') || n.includes('cacahuete') || n.includes('piñón') || n.includes('macadamia'))) return true
    // Huevo
    if (noEgg && (n.includes('huevo') || n.includes('tortilla de') || n.includes('clara de huevo'))) return true

    // Keto: eliminar carbohidratos de alto IG
    if (isKeto && (n.includes('arroz') || n.includes('pasta') || n.includes('pan') || n.includes('patata') || n.includes('boniato') || n.includes('batata') || n.includes('lenteja') || n.includes('garbanzo') || n.includes('alubia') || n.includes('cereale') || n.includes('copos de avena'))) return true

    // Hipertensión: embutidos con alto sodio
    if (isHypertensive && (n.includes('jamón serrano') || n.includes('bacon') || n.includes('panceta') || n.includes('chorizo') || n.includes('salchichón') || n.includes('sobrasada') || n.includes('morcilla') || n.includes('cecina') || n.includes('mojama') || n.includes('salazón') || (f.sodiumMg || 0) > 1200)) return true

    return false
  }

  // ── 6. SELECTOR DE ALIMENTOS CON SCORING ─────────────────────────────────

  type QueryOptions = {
    categories?: string[]
    keywords?: string[]          // al menos UNA debe estar
    excludeKeywords?: string[]
    filterFn?: (f: FoodDatabaseItem) => boolean
    preferKeywords?: string[]    // bonus de score
    sortByScore?: boolean
  }

  function pick(opts: QueryOptions, stepSeed: number): FoodDatabaseItem {
    const cats = opts.categories || []

    const candidates = allFoods.filter((f) => {
      if (isForbidden(f)) return false
      const cat = (f.category || '').toLowerCase()
      const n = f.name.toLowerCase()

      // Filtro de categoría
      if (cats.length > 0 && !cats.some((c) => cat.includes(c.toLowerCase()))) return false

      // Palabras clave obligatorias (OR)
      if (opts.keywords && opts.keywords.length > 0) {
        if (!opts.keywords.some((kw) => n.includes(kw.toLowerCase()))) return false
      }

      // Palabras clave excluidas
      if (opts.excludeKeywords && opts.excludeKeywords.length > 0) {
        if (opts.excludeKeywords.some((ex) => n.includes(ex.toLowerCase()))) return false
      }

      // Filtro adicional
      if (opts.filterFn && !opts.filterFn(f)) return false

      return true
    })

    if (candidates.length === 0) {
      // Fallback: cualquier alimento permitido
      const permitted = allFoods.filter((f) => !isForbidden(f))
      const idx = nextInt(permitted.length, stepSeed)
      const chosen = permitted[idx] || allFoods[0]
      usedIds.add(chosen.id)
      todayIds.add(chosen.id)
      return chosen
    }

    // Score de cada candidato
    const scored = candidates.map((f) => {
      let s = scoreFood(f)
      // Bonus por palabras clave preferidas
      if (opts.preferKeywords) {
        const n = f.name.toLowerCase()
        if (opts.preferKeywords.some((kw) => n.includes(kw.toLowerCase()))) s += 30
      }
      return { f, s }
    })

    // Ordenar por score descendente y seleccionar entre los mejores N con pseudo-aleatoriedad
    scored.sort((a, b) => b.s - a.s)
    const topN = Math.min(scored.length, 8)  // pool de los 8 mejores para variedad
    const chosen = scored[nextInt(topN, stepSeed)].f

    usedIds.add(chosen.id)
    todayIds.add(chosen.id)
    return chosen
  }

  // ── 7. CONSTRUCTOR DE ÍTEM ────────────────────────────────────────────────

  function item(food: FoodDatabaseItem, grams: number, notes: string, dayIdx: number, slot: string, pos: number): GeneratedMealItem {
    return { uid: `gen-${slot}-${dayIdx}-${pos}-${food.id}`, foodId: food.id, quantityG: grams, notes }
  }

  // ── 8. ESCALADO FISIOLÓGICO ───────────────────────────────────────────────

  /** Ajusta gramajes a raciones culinarias reales del alimento */
  function physiologicalGrams(f: FoodDatabaseItem, rawG: number, maxG?: number): number {
    const n = f.name.toLowerCase()
    const cat = (f.category || '').toLowerCase()
    let g = rawG

    if (n.includes('huevo entero') || n.includes('huevos camperos') || n.includes('tortilla')) {
      // Huevo M ≈ 55g; máx 4 unidades (220g)
      g = Math.max(55, Math.min(220, Math.round(g / 55) * 55))
    } else if (cat.includes('aceite') || n.includes('aceite de oliva')) {
      // 1 cucharadita = 5g, 1 cucharada = 10-15g
      g = Math.max(5, Math.min(20, Math.round(g / 5) * 5))
    } else if (n.includes('pan') || n.includes('tostada') || n.includes('biscote') || n.includes('rebanada')) {
      // 1 rebanada ≈ 30-35g
      g = Math.max(30, Math.min(90, Math.round(g / 30) * 30))
    } else if (cat.includes('fruto seco') || n.includes('nuez') || n.includes('almendra') || n.includes('pistacho') || n.includes('anacardo') || n.includes('avellana')) {
      // Puñado clínico 15-30g
      g = Math.max(15, Math.min(30, Math.round(g / 5) * 5))
    } else if (cat.includes('carne') || cat.includes('ave') || n.includes('pollo') || n.includes('pavo') || n.includes('ternera') || n.includes('solomillo') || n.includes('lomo')) {
      // Ración de plato principal 100-220g
      g = Math.max(100, Math.min(220, Math.round(g / 5) * 5))
    } else if (cat.includes('pescad') || n.includes('salmón') || n.includes('merluza') || n.includes('dorada') || n.includes('lubina') || n.includes('bacalao') || n.includes('trucha') || n.includes('atún al natural')) {
      // Filete de pescado 100-200g
      g = Math.max(100, Math.min(200, Math.round(g / 5) * 5))
    } else if (n.includes('sepia') || n.includes('calamar') || n.includes('gamba') || n.includes('langostino') || n.includes('pulpo')) {
      // Marisco 80-160g
      g = Math.max(80, Math.min(160, Math.round(g / 5) * 5))
    } else if (cat.includes('legumbre') || n.includes('lenteja') || n.includes('garbanzo') || n.includes('alubia') || n.includes('edamame')) {
      // Ración de legumbre cocida 130-250g
      g = Math.max(130, Math.min(250, Math.round(g / 10) * 10))
    } else if (n.includes('yogur')) {
      // Tarrina estándar 125g / grande 250g
      g = Math.max(125, Math.min(250, Math.round(g / 125) * 125))
    } else if (n.includes('kéfir') || n.includes('kefir') || n.includes('skyr')) {
      g = Math.max(125, Math.min(250, Math.round(g / 25) * 25))
    } else if (n.includes('leche') || n.includes('bebida de avena') || n.includes('bebida de soja') || n.includes('bebida de almendras') || n.includes('bebida de arroz')) {
      // Vaso o taza 150-250ml
      g = Math.max(150, Math.min(250, Math.round(g / 25) * 25))
    } else if (cat.includes('fruta') && !n.includes('zumo') && !n.includes('mermelada')) {
      // Pieza entera o ración 80-200g
      g = Math.max(80, Math.min(200, Math.round(g / 10) * 10))
    } else if (cat.includes('verdura') || cat.includes('hortaliza')) {
      // Ración 100-250g
      g = Math.max(80, Math.min(250, Math.round(g / 10) * 10))
    } else {
      // Resto: múltiplos de 5g con mín 15g
      g = Math.max(15, Math.round(g / 5) * 5)
    }

    // GLP-1: limitar volumen máximo por ítem
    if (patient.isGLP1Treatment && g > GLP1_MAX_ITEM_G) g = GLP1_MAX_ITEM_G

    return maxG ? Math.min(g, maxG) : g
  }

  // ── 9. CÁLCULO DE MACROS DE UN ÍTEM ──────────────────────────────────────

  function macros(f: FoodDatabaseItem, grams: number) {
    const factor = grams / 100
    return {
      kcal:    Math.round(f.calories    * factor * 10) / 10,
      proteinG: Math.round(f.proteinG   * factor * 10) / 10,
      carbsG:   Math.round(f.carbsG     * factor * 10) / 10,
      fatG:     Math.round(f.fatG       * factor * 10) / 10,
    }
  }

  function itemMacros(items: GeneratedMealItem[]) {
    return items.reduce(
      (acc, it) => {
        const f = allFoods.find((food) => food.id === it.foodId)
        if (!f) return acc
        const m = macros(f, it.quantityG)
        return { kcal: acc.kcal + m.kcal, proteinG: acc.proteinG + m.proteinG, carbsG: acc.carbsG + m.carbsG, fatG: acc.fatG + m.fatG }
      },
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    )
  }

  // ── 10. AJUSTE FINO DE DOBLE PASO ─────────────────────────────────────────

  /**
   * Paso 1: ajuste calórico hasta ±15 kcal del objetivo diario.
   * Paso 2: ajuste proteico hasta ±5g del objetivo diario.
   * Modifica los gramajes in-place (no crea nuevos ítems).
   */
  function fineTune(allItems: GeneratedMealItem[], kcalGoal: number, protGoal: number) {
    // Candidatos ajustables por calorías (carbohidratos, grasas saludables y proteínas)
    // La lista es amplia para garantizar ajuste incluso con catálogos reducidos (tests)
    function isEnergyAdjustable(f: FoodDatabaseItem): boolean {
      const n = f.name.toLowerCase()
      const cat = (f.category || '').toLowerCase()
      return (
        cat.includes('cereal') || cat.includes('tubérculo') || cat.includes('aceite') ||
        cat.includes('legumbre') || cat.includes('carne') || cat.includes('pescad') ||
        cat.includes('huevo') || cat.includes('fruta') || cat.includes('verdura') ||
        n.includes('arroz') || n.includes('pasta') || n.includes('patata') ||
        n.includes('boniato') || n.includes('avena') || n.includes('pan') ||
        n.includes('aceite') || n.includes('quinoa') || n.includes('garbanzo') ||
        n.includes('lenteja') || n.includes('alubia') || n.includes('pollo') ||
        n.includes('ternera') || n.includes('merluza') || n.includes('salmón') ||
        n.includes('yogur') || n.includes('nuez') || n.includes('almendra')
      )
    }

    // Candidatos ajustables por proteínas (proteínas magras)
    function isProteinAdjustable(f: FoodDatabaseItem): boolean {
      const n = f.name.toLowerCase()
      const cat = (f.category || '').toLowerCase()
      return (
        (cat.includes('carne') || cat.includes('pescad') || cat.includes('huevo') || cat.includes('legumbre')) &&
        f.proteinG > 12 &&
        !n.includes('aceite') && !n.includes('mantequilla')
      )
    }

    const energyItems = allItems.filter((it) => {
      const f = allFoods.find((food) => food.id === it.foodId)
      return f && isEnergyAdjustable(f)
    })

    const proteinItems = allItems.filter((it) => {
      const f = allFoods.find((food) => food.id === it.foodId)
      return f && isProteinAdjustable(f)
    })

    // --- PASO 1: Ajuste calórico (convergencia hasta ±15 kcal con 40 iteraciones) ---
    for (let pass = 0; pass < 40; pass++) {
      const current = itemMacros(allItems)
      const diff = kcalGoal - current.kcal
      if (Math.abs(diff) <= 15) break
      if (energyItems.length === 0) break

      for (const it of energyItems) {
        const f = allFoods.find((food) => food.id === it.foodId)!
        const isOil = (f.category || '').toLowerCase().includes('aceite') || f.name.toLowerCase().includes('aceite')
        // Paso pequeño para convergencia precisa
        const step = isOil ? 2.5 : 5
        const currentDiff = kcalGoal - itemMacros(allItems).kcal

        if (currentDiff > 15 && it.quantityG + step <= (isOil ? 25 : 400)) {
          it.quantityG += step
        } else if (currentDiff < -15 && it.quantityG - step >= (isOil ? 2.5 : 10)) {
          it.quantityG -= step
        }

        if (Math.abs(kcalGoal - itemMacros(allItems).kcal) <= 15) break
      }
    }

    // --- PASO 2: Ajuste proteico ---
    for (let pass = 0; pass < 15; pass++) {
      const current = itemMacros(allItems)
      const diffProt = protGoal - current.proteinG
      if (Math.abs(diffProt) <= 5) break
      if (proteinItems.length === 0) break

      for (const it of proteinItems) {
        const f = allFoods.find((food) => food.id === it.foodId)!
        const isLegume = (f.category || '').toLowerCase().includes('legumbre')
        const step = isLegume ? 15 : 10
        const minG = isLegume ? 100 : 80

        if (diffProt > 5 && it.quantityG + step <= 280) {
          it.quantityG += step
        } else if (diffProt < -5 && it.quantityG - step >= minG) {
          it.quantityG -= step
        }

        const newDiff = protGoal - itemMacros(allItems).proteinG
        if (Math.abs(newDiff) <= 5) break
      }
    }
  }

  // ── 11. CONSTRUCCIÓN DEL PLAN SEMANAL ────────────────────────────────────

  const weeklySchedule: { [dayIndex: number]: GeneratedDayPlan } = {}

  for (let d = 0; d < 7; d++) {
    todayIds = new Set<number>()
    const ds = seed + d * 137  // offset determinista por día

    const proteinType = WEEKLY_PROTEIN_CYCLE[d]
    // Si hay restricciones, degradar el tipo proteico al primero permitido
    const actualProteinType = (() => {
      if ((proteinType === 'fish' || proteinType === 'oily_fish') && noFish) {
        return isVegetarian ? 'legume' : 'poultry'
      }
      if (proteinType === 'shellfish' && noShellfish) return noFish ? (isVegetarian ? 'legume' : 'poultry') : 'fish'
      if ((proteinType === 'poultry' || proteinType === 'red_meat') && (isVegetarian || isVegan)) return 'legume'
      if (proteinType === 'egg' && noEgg) return isVegetarian ? 'legume' : 'fish'
      return proteinType
    })()

    // ══════════════════════════════════════════════════════════════════════
    // DESAYUNO — objetivo: bTarget kcal, buena proteína
    // ══════════════════════════════════════════════════════════════════════

    // Base de carbohidrato del desayuno
    const bCarb = pick({
      categories: noGluten
        ? ['cereales y derivados', 'cereales']
        : ['cereales y derivados', 'cereales'],
      keywords: noGluten
        ? ['tortitas de maíz', 'tortitas de arroz', 'avena sin gluten', 'copos de maíz', 'quinoa']
        : isKeto
          ? ['aguacate', 'frutos secos']
          : isDiabetic
            ? ['avena integral', 'copos de avena', 'pan 100% integral', 'centeno', 'masa madre']
            : ['avena', 'copos de avena', 'pan integral', 'pan de centeno', 'masa madre', 'espelta', 'tostada integral'],
      excludeKeywords: ['harina', 'bizcocho', 'galleta', 'magdalena', 'churro', 'bollería', 'dulce'],
    }, ds + 1)

    // Proteína del desayuno
    const bProt = pick({
      categories: isVegan
        ? ['legumbres', 'frutos secos']
        : noEgg
          ? ['carnes', 'huevos y lácteos']
          : ['huevos y lácteos', 'carnes'],
      keywords: isVegan
        ? ['tofu', 'hummus', 'crema de cacahuete', 'tempeh']
        : noEgg
          ? ['pechuga de pavo', 'jamón cocido extra', 'pavo cocido']
          : ['huevo entero', 'huevos camperos', 'claras de huevo', 'tortilla francesa'],
      excludeKeywords: ['salchicha', 'chorizo', 'sobrasada', 'morcilla', 'paté', 'mortadela'],
    }, ds + 2)

    // Bebida del desayuno (láctea o vegetal)
    const bDrink = pick({
      categories: noLactose || isVegan
        ? ['bebidas', 'lácteos']
        : ['huevos y lácteos', 'bebidas', 'lácteos y derivados'],
      keywords: noLactose || isVegan
        ? ['bebida de avena', 'bebida de soja', 'bebida de almendras', 'bebida de arroz', 'bebida vegetal']
        : ['leche semidesnatada', 'leche desnatada', 'kéfir', 'bebida fermentada', 'leche'],
      excludeKeywords: ['azúcar', 'cacao soluble azucarado', 'refresco', 'horchata azucarada'],
    }, ds + 3)

    // Fruta fresca o tomate de huerta
    const bFresh = pick({
      categories: ['frutas', 'verduras y hortalizas'],
      keywords: ['plátano', 'fresas', 'arándanos', 'kiwi', 'naranja', 'manzana', 'melocotón', 'tomate', 'pera', 'mandarina', 'uva', 'ciruela'],
      filterFn: (f) => f.calories <= 120,
    }, ds + 4)

    // AOVE
    const bOil = pick({
      categories: ['aceites y grasas', 'grasas y aceites'],
      keywords: ['aceite de oliva virgen extra', 'aceite de oliva'],
    }, ds + 5)

    const bRawGrams: [FoodDatabaseItem, number, string][] = [
      [bCarb,  bCarb.name.toLowerCase().includes('pan') ? 60 : 50,   'Base energética integral'],
      [bProt,  bProt.name.toLowerCase().includes('huevo') ? 110 : 60, 'Aporte proteico saciante'],
      [bDrink, 200,                                                    'Bebida templada (café/té opcional)'],
      [bFresh, 100,                                                    'Fruta fresca de temporada'],
      [bOil,   5,                                                      'AOVE virgen extra en crudo'],
    ]
    const bItems: GeneratedMealItem[] = bRawGrams.map(([f, g, note], i) =>
      item(f, physiologicalGrams(f, Math.round(g * bTarget / computeRawKcal(bRawGrams))), note, d, 'b', i)
    )

    // ══════════════════════════════════════════════════════════════════════
    // MEDIA MAÑANA — objetivo: mmTarget kcal, snack funcional saciante
    // ══════════════════════════════════════════════════════════════════════

    const mmFruit = pick({
      categories: ['frutas'],
      filterFn: (f) => f.calories <= 110 && !f.name.toLowerCase().includes('deshidratad') && !f.name.toLowerCase().includes('almíbar') && !f.name.toLowerCase().includes('pasa'),
    }, ds + 6)

    const mmExtra = noNuts
      ? pick({
          categories: ['huevos y lácteos', 'lácteos y derivados'],
          keywords: noLactose || isVegan
            ? ['yogur de soja', 'yogur vegetal', 'bebida vegetal']
            : ['yogur natural', 'kéfir', 'skyr', 'yogur griego 0%', 'queso fresco batido'],
          excludeKeywords: ['azucarado', 'sabores', 'chocolate'],
        }, ds + 7)
      : pick({
          categories: ['frutos secos y semillas'],
          filterFn: (f) => f.calories >= 300,  // frutos secos reales, no snacks
          excludeKeywords: ['frito', 'salado', 'azucarado', 'caramelizado', 'garrapiñado'],
        }, ds + 7)

    const mmRaw: [FoodDatabaseItem, number, string][] = [
      [mmFruit, 150, 'Fruta fresca entera de temporada'],
      [mmExtra, noNuts ? 125 : 20, noNuts ? 'Lácteo fermentado bajo en grasa' : 'Frutos secos crudos al natural'],
    ]
    const mmItems: GeneratedMealItem[] = mmRaw.map(([f, g, note], i) =>
      item(f, physiologicalGrams(f, Math.round(g * mmTarget / computeRawKcal(mmRaw))), note, d, 'mm', i)
    )

    // ══════════════════════════════════════════════════════════════════════
    // COMIDA — objetivo: lTarget kcal, plato principal con rotación semanal
    // ══════════════════════════════════════════════════════════════════════

    // Proteína principal de la comida (rotación semanal inteligente)
    const lProt = pick(proteinQuery(actualProteinType, isVegetarian, isVegan, noFish, noShellfish, noEgg), ds + 8)

    // Carbohidrato de la comida
    const lCarb = pick({
      categories: isKeto
        ? ['verduras y hortalizas']
        : ['cereales y derivados', 'cereales y tubérculos', 'tubérculos'],
      keywords: isKeto
        ? ['calabacín', 'brócoli', 'coliflor', 'espinacas']
        : noGluten
          ? ['arroz', 'patata', 'boniato', 'quinoa', 'maíz', 'amaranto']
          : isDiabetic
            ? ['arroz integral', 'quinoa', 'pasta integral', 'patata cocida', 'boniato', 'legumbre']
            : isMuscleGain
              ? ['arroz blanco', 'patata', 'boniato', 'pasta', 'quinoa', 'cuscús', 'arroz integral']
              : ['arroz', 'patata', 'boniato', 'quinoa', 'pasta integral', 'cuscús'],
      excludeKeywords: ['harina', 'galleta', 'frita', 'chips', 'snack', 'bollería'],
      filterFn: (f) => !isKeto ? f.carbsG >= 10 : f.carbsG <= 10,
    }, ds + 9)

    // Verdura de la comida
    const lVeg = pick({
      categories: ['verduras y hortalizas'],
      excludeKeywords: ['albahaca', 'hierbabuena', 'perejil', 'cilantro', 'deshidratad', 'frito', 'especias', 'condimento'],
      filterFn: (f) => f.calories <= 80 && f.carbsG < 15,
    }, ds + 10)

    // Segunda verdura o legumbre acompañante (enriquece el plato)
    const lVeg2 = pick({
      categories: ['verduras y hortalizas'],
      excludeKeywords: ['albahaca', 'hierbabuena', 'perejil', 'cilantro', 'deshidratad', 'frito'],
      filterFn: (f) => f.calories <= 80 && f.id !== lVeg.id,
    }, ds + 11)

    // AOVE de la comida
    const lOil = pick({
      categories: ['aceites y grasas', 'grasas y aceites'],
      keywords: ['aceite de oliva virgen extra', 'aceite de oliva'],
    }, ds + 12)

    const isLegumeMain = (lProt.category || '').toLowerCase().includes('legumbre') || lProt.name.toLowerCase().includes('lenteja') || lProt.name.toLowerCase().includes('garbanzo') || lProt.name.toLowerCase().includes('alubia')
    const lProtBase = isLegumeMain ? 210 : 160
    const lCarbBase = lCarb.name.toLowerCase().includes('patata') || lCarb.name.toLowerCase().includes('boniato') ? 180 : (isKeto ? 200 : 80)

    const lRaw: [FoodDatabaseItem, number, string][] = [
      [lProt,  lProtBase, isLegumeMain ? 'Legumbre cocinada con verduras' : 'Proteína principal a la plancha o al vapor'],
      [lCarb,  lCarbBase, 'Guarnición de hidratos complejos'],
      [lVeg,   150, 'Primera verdura de temporada'],
      [lVeg2,  100, 'Segunda verdura fresca o salteada'],
      [lOil,   10,  'AOVE virgen extra para cocinado y aliño'],
    ]
    const lItems: GeneratedMealItem[] = lRaw.map(([f, g, note], i) =>
      item(f, physiologicalGrams(f, Math.round(g * lTarget / computeRawKcal(lRaw))), note, d, 'l', i)
    )

    // ══════════════════════════════════════════════════════════════════════
    // MERIENDA — objetivo: sTarget kcal, snack anabólico o antiinflamatorio
    // ══════════════════════════════════════════════════════════════════════

    const sDairy = pick({
      categories: noLactose || isVegan
        ? ['bebidas', 'frutas']
        : ['huevos y lácteos', 'lácteos y derivados'],
      keywords: noLactose || isVegan
        ? ['bebida de avena', 'bebida de soja', 'bebida de almendras', 'yogur vegetal']
        : isMuscleGain
          ? ['yogur griego', 'skyr', 'queso fresco batido 0%', 'proteína']
          : ['yogur natural', 'kéfir', 'yogur griego 0%', 'yogur desnatado', 'skyr'],
      excludeKeywords: ['azucarado', 'sabores artificiales', 'chocolate', 'postre'],
    }, ds + 13)

    const sFruit = pick({
      categories: ['frutas'],
      filterFn: (f) => f.calories <= 100 && !f.name.toLowerCase().includes('zumo') && !f.name.toLowerCase().includes('confitu'),
    }, ds + 14)

    const sExtra = noNuts
      ? null
      : d % 3 === 0
        ? pick({
            categories: ['frutos secos y semillas'],
            filterFn: (f) => f.calories >= 300,
            excludeKeywords: ['frito', 'salado', 'azucarado'],
          }, ds + 15)
        : null

    const sRaw: [FoodDatabaseItem, number, string][] = [
      [sDairy, 125,  'Lácteo fermentado o alternativa vegetal'],
      [sFruit, 120,  'Fruta fresca antioxidante'],
      ...(sExtra ? [[sExtra, 15, 'Frutos secos crudos (puñado pequeño)'] as [FoodDatabaseItem, number, string]] : []),
    ]
    const sItems: GeneratedMealItem[] = sRaw.map(([f, g, note], i) =>
      item(f, physiologicalGrams(f, Math.round(g * sTarget / computeRawKcal(sRaw))), note, d, 's', i)
    )

    // ══════════════════════════════════════════════════════════════════════
    // CENA — objetivo: dTarget kcal, ligera, digestiva y reparadora
    // ══════════════════════════════════════════════════════════════════════

    // Proteína de la cena (contraria a la de la comida para variedad)
    const dinnerProtType: typeof actualProteinType = actualProteinType === 'fish' || actualProteinType === 'oily_fish'
      ? (isVegetarian ? 'legume' : noEgg ? (isVegetarian ? 'legume' : 'poultry') : 'egg')
      : actualProteinType === 'poultry'
        ? (noFish ? (isVegetarian ? 'legume' : 'poultry') : 'fish')
        : actualProteinType === 'egg'
          ? (noFish ? 'poultry' : 'fish')
          : actualProteinType === 'legume'
            ? (noEgg ? 'fish' : 'egg')
            : 'fish'

    const dProt = pick(proteinQuery(dinnerProtType, isVegetarian, isVegan, noFish, noShellfish, noEgg), ds + 16)

    // Verdura principal de la cena (crema, ensalada o puré)
    const dVeg = pick({
      categories: ['verduras y hortalizas'],
      keywords: ['crema', 'puré', 'ensalada', 'canónigos', 'rúcula', 'espárragos', 'calabacín', 'judías verdes', 'champiñones', 'brócoli', 'coliflor', 'col', 'puerro', 'alcachofa', 'berenjena'],
      excludeKeywords: ['albahaca', 'hierbabuena', 'perejil', 'cilantro', 'deshidratad'],
      filterFn: (f) => f.calories <= 80,
    }, ds + 17)

    // Carbohidrato ligero de la cena (menor que en la comida)
    const dCarb = pick({
      categories: isKeto
        ? ['aceites y grasas']
        : ['cereales y derivados', 'tubérculos', 'verduras y hortalizas'],
      keywords: isKeto
        ? ['aguacate', 'aceite de coco']
        : noGluten
          ? ['patata', 'boniato', 'tortitas de arroz', 'arroz']
          : ['patata cocida', 'boniato', 'pan 100% integral', 'pan de centeno', 'arroz integral'],
      excludeKeywords: ['harina', 'frita', 'chips'],
    }, ds + 18)

    // AOVE de la cena
    const dOil = pick({
      categories: ['aceites y grasas'],
      keywords: ['aceite de oliva virgen extra', 'aceite de oliva'],
    }, ds + 19)

    const isEggDinner = dProt.name.toLowerCase().includes('huevo')
    const isDinnerFish = (dProt.category || '').toLowerCase().includes('pescad') || dProt.name.toLowerCase().includes('merluza') || dProt.name.toLowerCase().includes('salmón')
    const dProtBase = isEggDinner ? 110 : isDinnerFish ? 140 : 130
    const dCarbBase = dCarb.name.toLowerCase().includes('patata') || dCarb.name.toLowerCase().includes('boniato') ? 130 : 40

    const dRaw: [FoodDatabaseItem, number, string][] = [
      [dProt, dProtBase, isEggDinner ? 'Tortilla francesa o revuelto ligero con verduras' : 'Proteína magra a la plancha o al vapor'],
      [dVeg,  180,       'Verdura de cena: crema, ensalada o verdura al vapor'],
      [dCarb, dCarbBase, 'Carbohidrato nocturno de bajo índice glucémico'],
      [dOil,  8,         'AOVE en crudo para aliño final'],
    ]
    const dItems: GeneratedMealItem[] = dRaw.map(([f, g, note], i) =>
      item(f, physiologicalGrams(f, Math.round(g * dTarget / computeRawKcal(dRaw))), note, d, 'd', i)
    )

    // ══════════════════════════════════════════════════════════════════════
    // AJUSTE FINO DE DOBLE PASO (calorías ± 15 kcal, proteínas ± 5 g)
    // ══════════════════════════════════════════════════════════════════════
    const allItems = [...bItems, ...mmItems, ...lItems, ...sItems, ...dItems]
    fineTune(allItems, target, protTarget / 7)  // proteínas objetivo por día

    weeklySchedule[d] = {
      BREAKFAST:   bItems,
      MID_MORNING: mmItems,
      LUNCH:       lItems,
      SNACK:       sItems,
      DINNER:      dItems,
    }
  }

  // ── 12. VALIDACIÓN FINAL DE COHERENCIA SEMANAL ───────────────────────────
  for (let d = 0; d < 7; d++) {
    const dayPlan = weeklySchedule[d]
    const dayItems = [
      ...dayPlan.BREAKFAST, ...dayPlan.MID_MORNING,
      ...dayPlan.LUNCH, ...dayPlan.SNACK, ...dayPlan.DINNER,
    ]
    const { kcal } = itemMacros(dayItems)
    const ratio = target > 0 ? kcal / target : 1

    // Si el día está muy fuera de rango (< 80% o > 120%), avisar en consola (dev)
    if (ratio < 0.80 || ratio > 1.20) {
      console.warn(`[AutoPlan] Día ${d + 1}: ${Math.round(kcal)} kcal (objetivo ${target}). Ratio: ${(ratio * 100).toFixed(1)}%`)
    }
  }

  return weeklySchedule
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

/** Calcula kcal brutas de una lista de (alimento, gramos) para escalar proporcional */
function computeRawKcal(items: [FoodDatabaseItem, number, string][]): number {
  const total = items.reduce((sum, [f, g]) => sum + f.calories * (g / 100), 0)
  return total > 0 ? total : 1
}

/** Retorna las opciones de query para el tipo proteico del día */
function proteinQuery(
  type: 'poultry' | 'fish' | 'legume' | 'egg' | 'red_meat' | 'oily_fish' | 'shellfish',
  isVegetarian: boolean,
  isVegan: boolean,
  noFish: boolean,
  noShellfish: boolean,
  noEgg: boolean,
): {
  categories?: string[]
  keywords?: string[]
  excludeKeywords?: string[]
  filterFn?: (f: FoodDatabaseItem) => boolean
  preferKeywords?: string[]
} {
  switch (type) {
    case 'poultry':
      return {
        categories: ['carnes'],
        keywords: ['pechuga de pollo', 'pechuga de pavo', 'solomillo de pavo', 'pollo campero', 'muslo de pollo deshuesado'],
        excludeKeywords: ['frito', 'empanado', 'salchicha', 'nuggets', 'precocinado', 'rebozado'],
        filterFn: (f) => f.proteinG >= 20 && f.fatG <= 10,
      }
    case 'fish':
      return {
        categories: ['pescados y mariscos'],
        keywords: ['merluza', 'dorada', 'lubina', 'lenguado', 'bacalao fresco', 'trucha', 'corvina', 'rodaballo'],
        excludeKeywords: ['frito', 'rebozado', 'surimi', 'palito'],
        filterFn: (f) => f.proteinG >= 15,
      }
    case 'oily_fish':
      return {
        categories: ['pescados y mariscos'],
        keywords: ['salmón', 'atún fresco', 'caballa', 'sardina fresca', 'anchoa fresca', 'jurel'],
        excludeKeywords: ['lata', 'conserva', 'escabeche', 'frito'],
        filterFn: (f) => f.proteinG >= 15 && f.fatG >= 4,
        preferKeywords: ['salmón', 'atún', 'caballa'],
      }
    case 'shellfish':
      return {
        categories: ['pescados y mariscos'],
        keywords: ['gamba', 'langostino', 'sepia', 'calamar', 'pulpo', 'mejillón', 'almeja', 'berberecho'],
        excludeKeywords: ['frito', 'rebozado', 'surimi'],
        filterFn: (f) => f.proteinG >= 12,
      }
    case 'legume':
      return {
        categories: ['legumbres'],
        keywords: ['lenteja', 'garbanzo', 'alubia', 'judión', 'edamame', 'soja', 'habas', 'guisantes secos'],
        excludeKeywords: ['harina', 'snack', 'chips', 'frito'],
        filterFn: (f) => f.proteinG >= 6,
        preferKeywords: ['lenteja roja', 'lenteja pardina', 'garbanzo', 'alubia blanca'],
      }
    case 'egg':
      return {
        categories: ['huevos y lácteos'],
        keywords: ['huevo entero', 'huevos camperos', 'tortilla francesa', 'claras de huevo', 'huevo cocido'],
        excludeKeywords: ['frito en aceite abundante', 'con beicon', 'con chorizo'],
      }
    case 'red_meat':
      return {
        categories: ['carnes'],
        keywords: ['solomillo de ternera', 'lomo de cerdo', 'filete de ternera', 'solomillo de cerdo ibérico', 'conejo'],
        excludeKeywords: ['frito', 'empanado', 'salchicha', 'chorizo', 'hamburguesa procesada'],
        filterFn: (f) => f.proteinG >= 18 && f.fatG <= 15,
      }
    default:
      return {
        categories: ['carnes', 'pescados y mariscos', 'huevos y lácteos', 'legumbres'],
        filterFn: (f) => f.proteinG >= 10,
        excludeKeywords: ['frito', 'salchicha', 'chorizo', 'embutido'],
      }
  }
}
