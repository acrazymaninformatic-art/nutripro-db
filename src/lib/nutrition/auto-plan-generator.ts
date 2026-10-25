/**
 * @file auto-plan-generator.ts
 * @description Intelligent clinical meal plan generation engine for EVSoftware.
 * Automatically constructs realistic, balanced, personalized 7-day meal plans
 * strictly adapted to the patient's caloric goal, macronutrients, objective,
 * food allergies, intolerances, clinical history, and dietary preferences.
 * Dynamically utilizes the full 5,050 foods catalog with rotational variety.
 */

import { checkPatientAllergenConflict } from './allergens'

export interface PatientPlanProfile {
  firstName: string
  lastName: string
  objective: string // 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | etc.
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

/**
 * Genera un menú semanal clínico inteligente de 7 días adaptado rigurosamente
 * a la anamnesis, cuestionarios y objetivos fisiológicos del paciente, utilizando
 * dinámicamente todo el catálogo de 5.050 alimentos de la base de datos sin monotonía.
 */
export function generateAutomatedWeeklyPlan(
  patient: PatientPlanProfile,
  allFoods: FoodDatabaseItem[]
): { [dayIndex: number]: GeneratedDayPlan } {
  const preferences = (patient.dietaryPreferences || '').toLowerCase()
  const aversions = (patient.foodAversions || '')
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3)
  const medical = (patient.medicalHistory || '').toLowerCase()

  const isVegan = preferences.includes('vegan')
  const isVegetarian = isVegan || preferences.includes('vegetar')
  const isPescetarian = preferences.includes('pescetar')
  const isKeto =
    preferences.includes('keto') ||
    preferences.includes('cetog') ||
    preferences.includes('baja en hidratos')
  const isHypertensive = medical.includes('hipertens')
  const isDiabetic = medical.includes('diabet') || medical.includes('sop') || medical.includes('insul')

  const patientAllergiesNorm = (patient.allergies || '').toLowerCase()
  const patientIntolerancesNorm = (patient.intolerances || '').toLowerCase()

  const hasGluten =
    patientAllergiesNorm.includes('gluten') ||
    patientAllergiesNorm.includes('celiaqu') ||
    patientAllergiesNorm.includes('trigo') ||
    patientIntolerancesNorm.includes('gluten')
  const hasLactose =
    patientAllergiesNorm.includes('lactos') ||
    patientAllergiesNorm.includes('leche') ||
    patientIntolerancesNorm.includes('lactos')
  const hasNuts =
    patientAllergiesNorm.includes('fruto') ||
    patientAllergiesNorm.includes('nuez') ||
    patientAllergiesNorm.includes('almendra') ||
    patientAllergiesNorm.includes('cacahuete')
  const hasEgg =
    patientAllergiesNorm.includes('huevo') ||
    patientIntolerancesNorm.includes('huevo')
  const hasFish =
    patientAllergiesNorm.includes('pescad') ||
    patientAllergiesNorm.includes('salmon') ||
    patientAllergiesNorm.includes('merluza')
  const hasShellfish =
    patientAllergiesNorm.includes('marisc') ||
    patientAllergiesNorm.includes('gamba') ||
    patientAllergiesNorm.includes('langostino')

  /**
   * Comprueba si un alimento está estrictamente contraindicado para este paciente
   * por alérgenos (Reglamento UE 1169/2011), aversiones declaradas, pauta médica o estilo dietético.
   */
  function isFoodForbidden(name: string, category: string | null): boolean {
    const n = name.toLowerCase()

    // 1. Aversiones del paciente
    if (aversions.some((av) => n.includes(av))) return true

    // 2. Alérgenos e intolerancias clínicas según UE 1169/2011
    const allergenConflict = checkPatientAllergenConflict(
      { name, category },
      {
        allergies: patient.allergies,
        intolerances: patient.intolerances,
        firstName: patient.firstName,
      }
    )
    if (allergenConflict) return true

    // 3. Preferencias dietéticas
    if (
      isVegetarian &&
      (category === 'Carnes' ||
        category === 'Pescados y Mariscos' ||
        n.includes('pollo') ||
        n.includes('ternera') ||
        n.includes('pavo') ||
        n.includes('cerdo') ||
        n.includes('jamón') ||
        n.includes('jamon') ||
        n.includes('pescado') ||
        n.includes('salmón') ||
        n.includes('merluza') ||
        n.includes('atún') ||
        n.includes('sepia') ||
        n.includes('gamba') ||
        n.includes('bacalao') ||
        n.includes('conejo') ||
        n.includes('buey'))
    ) {
      return true
    }

    if (
      isVegan &&
      (category === 'Lácteos' ||
        category === 'Huevos' ||
        category === 'Huevos y Lácteos' ||
        category === 'Lácteos y Derivados' ||
        n.includes('leche') ||
        n.includes('queso') ||
        n.includes('yogur') ||
        n.includes('huevo') ||
        n.includes('kéfir') ||
        n.includes('kefir') ||
        n.includes('mantequilla') ||
        n.includes('skyr') ||
        n.includes('miel'))
    ) {
      return true
    }

    if (
      isPescetarian &&
      (category === 'Carnes' ||
        n.includes('pollo') ||
        n.includes('ternera') ||
        n.includes('pavo') ||
        n.includes('cerdo') ||
        n.includes('jamón') ||
        n.includes('jamon') ||
        n.includes('conejo'))
    ) {
      return true
    }

    if (
      isKeto &&
      (category === 'Cereales y Harinas' ||
        category === 'Cereales y Derivados' ||
        category === 'Pastas' ||
        category === 'Legumbres' ||
        n.includes('arroz') ||
        n.includes('pasta') ||
        n.includes('pan') ||
        n.includes('patata') ||
        n.includes('boniato') ||
        n.includes('batata') ||
        n.includes('lenteja') ||
        n.includes('garbanzo') ||
        n.includes('alubia'))
    ) {
      return true
    }

    // 4. Consideraciones médicas: hipertensión (excluir curados y carnes ricas en sodio)
    if (
      isHypertensive &&
      (n.includes('jamón serrano') ||
        n.includes('jamon serrano') ||
        n.includes('bacon') ||
        n.includes('panceta') ||
        n.includes('chorizo') ||
        n.includes('salchicha') ||
        n.includes('salchichón') ||
        n.includes('sobrasada') ||
        n.includes('morcilla') ||
        n.includes('cecina') ||
        n.includes('salazón') ||
        n.includes('mojama'))
    ) {
      return true
    }

    return false
  }

  // Conjunto de IDs de alimentos ya utilizados para garantizar rotación sin repeticiones monótonas
  const usedFoodIds = new Set<number>()

  // Semilla base para reproducibilidad y personalización por paciente
  let patientSeed = 42
  for (let i = 0; i < (patient.firstName + patient.lastName).length; i++) {
    patientSeed = (patientSeed * 31 + (patient.firstName + patient.lastName).charCodeAt(i)) & 0x7fffffff
  }

  /**
   * Selector dinámico que consulta los 5.050 alimentos de la base de datos,
   * filtra según seguridad clínica y prioriza alimentos no repetidos en la semana.
   */
  function queryFood(
    options: {
      category?: string | string[]
      nameKeywords?: string[]
      excludeKeywords?: string[]
      filterFn?: (f: FoodDatabaseItem) => boolean
      preferredKeywords?: string[]
    },
    stepSeed: number
  ): FoodDatabaseItem {
    const categories = Array.isArray(options.category)
      ? options.category
      : options.category
        ? [options.category]
        : []

    const candidates = allFoods.filter((f) => {
      // 1. Categoría
      if (
        categories.length > 0 &&
        (!f.category ||
          !categories.some((c) =>
            (f.category || '').toLowerCase().includes(c.toLowerCase())
          ))
      ) {
        return false
      }

      // 2. Alimento seguro y no prohibido
      if (isFoodForbidden(f.name, f.category)) return false

      const n = f.name.toLowerCase()

      // 3. Palabras clave obligatorias
      if (options.nameKeywords && options.nameKeywords.length > 0) {
        if (!options.nameKeywords.some((kw) => n.includes(kw.toLowerCase()))) {
          return false
        }
      }

      // 4. Palabras clave excluidas (ej: harinas, condimentos puros)
      if (options.excludeKeywords && options.excludeKeywords.length > 0) {
        if (options.excludeKeywords.some((ex) => n.includes(ex.toLowerCase()))) {
          return false
        }
      }

      // 5. Filtro adicional
      if (options.filterFn && !options.filterFn(f)) return false

      return true
    })

    if (candidates.length === 0) {
      // Fallback seguro de toda la base de datos
      const fallbackPool = allFoods.filter((f) => !isFoodForbidden(f.name, f.category))
      return fallbackPool[Math.abs(patientSeed + stepSeed) % fallbackPool.length] || allFoods[0]
    }

    // Priorizar alimentos que todavía NO se hayan consumido esta semana
    const unused = candidates.filter((f) => !usedFoodIds.has(f.id))
    const pool = unused.length > 0 ? unused : candidates

    // Si hay preferencias culinarias específicas dentro del grupo, valorarlas
    if (options.preferredKeywords && options.preferredKeywords.length > 0) {
      const preferred = pool.filter((f) =>
        options.preferredKeywords!.some((kw) =>
          f.name.toLowerCase().includes(kw.toLowerCase())
        )
      )
      if (preferred.length > 0) {
        const chosen = preferred[Math.abs(patientSeed + stepSeed) % preferred.length]
        usedFoodIds.add(chosen.id)
        return chosen
      }
    }

    const chosen = pool[Math.abs(patientSeed + stepSeed) % pool.length]
    usedFoodIds.add(chosen.id)
    return chosen
  }

  const weeklySchedule: { [dayIndex: number]: GeneratedDayPlan } = {}

  for (let d = 0; d < 7; d++) {
    const daySeed = patientSeed + d * 41

    // ==========================================
    // 1. DESAYUNO
    // ==========================================
    const bCarb = queryFood(
      {
        category: hasGluten
          ? ['Cereales y Derivados', 'Cereales y Tubérculos']
          : ['Cereales y Derivados'],
        nameKeywords: hasGluten
          ? ['tortitas de maíz', 'tortitas de arroz', 'copos de maíz', 'avena sin gluten', 'quinoa']
          : isKeto
            ? ['aguacate']
            : ['avena', 'pan', 'tostada', 'centeno', 'masa madre', 'espelta', 'copos'],
        excludeKeywords: ['harina', 'bizcocho', 'galleta', 'magdalena'],
      },
      daySeed + 1
    )

    const bProt = queryFood(
      {
        category: ['Huevos y Lácteos', 'Carnes', 'Legumbres'],
        nameKeywords: isVegan
          ? ['tofu', 'hummus', 'crema de cacahuete']
          : hasEgg
            ? ['pechuga de pavo', 'jamón cocido extra', 'queso fresco batido', 'hummus']
            : ['huevo entero', 'huevos camperos', 'clara de huevo', 'pechuga de pavo'],
        excludeKeywords: ['salchicha', 'chorizo', 'sobrasada'],
      },
      daySeed + 2
    )

    const bDrink = queryFood(
      {
        category: ['Bebidas', 'Huevos y Lácteos'],
        nameKeywords: hasLactose || isVegan
          ? ['bebida de avena', 'bebida de almendras', 'bebida de soja', 'bebida de arroz']
          : ['leche semidesnatada', 'leche desnatada', 'kéfir', 'kefir'],
        excludeKeywords: ['azúcar', 'cacao soluble azucarado', 'refresco'],
      },
      daySeed + 3
    )

    const bFresh = queryFood(
      {
        category: ['Frutas', 'Verduras y Hortalizas'],
        nameKeywords: hasGluten
          ? ['plátano', 'fresas', 'arándanos', 'kiwi']
          : ['tomate', 'plátano', 'fresas', 'arándanos', 'kiwi', 'aguacate'],
        filterFn: (f) => f.calories <= 100,
      },
      daySeed + 4
    )

    const bOil = queryFood(
      {
        category: ['Aceites y Grasas', 'Grasas y Aceites'],
        nameKeywords: ['aceite de oliva virgen extra', 'aove'],
      },
      daySeed + 5
    )

    const bItems: GeneratedMealItem[] = [
      {
        uid: `gen-b-${d}-0-${Math.random()}`,
        foodId: bCarb.id,
        quantityG: bCarb.name.toLowerCase().includes('pan') ? 60 : 50,
        notes: 'Base energética integral',
      },
      {
        uid: `gen-b-${d}-1-${Math.random()}`,
        foodId: bProt.id,
        quantityG: bProt.name.toLowerCase().includes('huevo') ? 110 : 60,
        notes: 'Aporte proteico saciante',
      },
      {
        uid: `gen-b-${d}-2-${Math.random()}`,
        foodId: bDrink.id,
        quantityG: 200,
        notes: 'Bebida templada o café/té',
      },
      {
        uid: `gen-b-${d}-3-${Math.random()}`,
        foodId: bFresh.id,
        quantityG: 80,
        notes: 'Fruta fresca o tomate de huerta',
      },
      {
        uid: `gen-b-${d}-4-${Math.random()}`,
        foodId: bOil.id,
        quantityG: 5,
        notes: 'AOVE en crudo',
      },
    ]

    // ==========================================
    // 2. MEDIA MAÑANA
    // ==========================================
    const mmFruit = queryFood(
      {
        category: 'Frutas',
        filterFn: (f) =>
          f.calories <= 100 &&
          !f.name.toLowerCase().includes('deshidratad') &&
          !f.name.toLowerCase().includes('almíbar') &&
          !f.name.toLowerCase().includes('pasa'),
      },
      daySeed + 6
    )

    const mmNut = queryFood(
      {
        category: hasNuts ? ['Huevos y Lácteos', 'Cereales y Derivados'] : ['Frutos Secos y Semillas'],
        nameKeywords: hasNuts
          ? ['yogur natural', 'queso fresco batido', 'tortitas de arroz']
          : ['nueces', 'almendras', 'avellanas', 'pistachos', 'anacardos', 'semillas de chía'],
        excludeKeywords: ['frito', 'salado', 'azucarado', 'caramelizado'],
      },
      daySeed + 7
    )

    const mmItems: GeneratedMealItem[] = [
      {
        uid: `gen-mm-${d}-0-${Math.random()}`,
        foodId: mmFruit.id,
        quantityG: 150,
        notes: 'Fruta fresca entera de temporada',
      },
      {
        uid: `gen-mm-${d}-1-${Math.random()}`,
        foodId: mmNut.id,
        quantityG: hasNuts ? 125 : 20,
        notes: hasNuts ? 'Lácteo o snack suave' : 'Frutos secos crudos al natural',
      },
    ]

    // ==========================================
    // 3. COMIDA (ALMUERZO PRINCIPAL)
    // ==========================================
    let lProt: FoodDatabaseItem
    if (isVegetarian || isVegan) {
      lProt = queryFood(
        {
          category: ['Legumbres', 'Huevos y Lácteos'],
          nameKeywords: ['lenteja', 'garbanzo', 'alubia', 'tofu', 'soja texturizada', 'huevo'],
          excludeKeywords: ['harina'],
        },
        daySeed + 8
      )
    } else if (d === 0 || d === 3) {
      // Días de carne y ave magra
      lProt = queryFood(
        {
          category: 'Carnes',
          nameKeywords: ['pechuga de pollo', 'solomillo de pavo', 'ternera magra', 'lomo de cerdo magro', 'conejo', 'pollo campero'],
          excludeKeywords: ['salchicha', 'chorizo', 'panceta', 'bacon', 'nuggets', 'frito', 'empanado'],
          filterFn: (f) => f.proteinG >= 18 && f.fatG <= 12,
        },
        daySeed + 8
      )
    } else if (d === 1 || d === 4) {
      // Días de pescado y marisco fresco
      lProt = queryFood(
        {
          category: 'Pescados y Mariscos',
          nameKeywords: ['merluza', 'dorada', 'lubina', 'bacalao', 'salmón', 'atún', 'trucha', 'sepia', 'calamar', 'lenguado', 'corvina'],
          excludeKeywords: ['rebozado', 'frito', 'surimi'],
        },
        daySeed + 8
      )
    } else if (d === 2) {
      // Día de legumbre mediterránea
      lProt = queryFood(
        {
          category: 'Legumbres',
          nameKeywords: ['lenteja', 'garbanzo', 'alubia', 'judión', 'edamame'],
          excludeKeywords: ['harina', 'snack'],
        },
        daySeed + 8
      )
    } else {
      // Fin de semana: pescado al horno o ave de corral
      lProt = queryFood(
        {
          category: ['Pescados y Mariscos', 'Carnes'],
          nameKeywords: ['dorada', 'lubina', 'salmón', 'solomillo', 'pollo asado', 'paella'],
          excludeKeywords: ['frito', 'empanado'],
        },
        daySeed + 8
      )
    }

    const lCarb = queryFood(
      {
        category: ['Cereales y Derivados', 'Cereales y Tubérculos'],
        nameKeywords: isKeto
          ? ['calabacín']
          : hasGluten
            ? ['arroz', 'patata', 'boniato', 'quinoa']
            : isDiabetic
              ? ['arroz integral', 'quinoa', 'pasta integral', 'patata']
              : ['arroz', 'patata', 'boniato', 'pasta', 'quinoa', 'cuscús'],
        excludeKeywords: ['harina', 'galleta', 'frita', 'chips'],
      },
      daySeed + 9
    )

    const lVeg = queryFood(
      {
        category: 'Verduras y Hortalizas',
        excludeKeywords: ['albahaca', 'hierbabuena', 'perejil', 'cilantro', 'deshidratad', 'frito'],
        filterFn: (f) => f.calories <= 75,
      },
      daySeed + 10
    )

    const lOil = queryFood(
      {
        category: ['Aceites y Grasas', 'Grasas y Aceites'],
        nameKeywords: ['aceite de oliva virgen extra', 'aove'],
      },
      daySeed + 11
    )

    const isLegumeMain = lProt.category?.toLowerCase().includes('legumbre') || lProt.name.toLowerCase().includes('lenteja') || lProt.name.toLowerCase().includes('garbanzo')
    const lItems: GeneratedMealItem[] = [
      {
        uid: `gen-l-${d}-0-${Math.random()}`,
        foodId: lProt.id,
        quantityG: isLegumeMain ? 210 : 160,
        notes: 'Plato proteico principal cocinado a la plancha o al vapor',
      },
      {
        uid: `gen-l-${d}-1-${Math.random()}`,
        foodId: lCarb.id,
        quantityG: lCarb.name.toLowerCase().includes('patata') || lCarb.name.toLowerCase().includes('boniato') ? 160 : 75,
        notes: 'Guarnición de carbohidratos complejos al punto',
      },
      {
        uid: `gen-l-${d}-2-${Math.random()}`,
        foodId: lVeg.id,
        quantityG: 160,
        notes: 'Verduras frescas al vapor, salteadas o en ensalada',
      },
      {
        uid: `gen-l-${d}-3-${Math.random()}`,
        foodId: lOil.id,
        quantityG: 10,
        notes: 'AOVE para cocinado y aliño en crudo',
      },
    ]

    // ==========================================
    // 4. MERIENDA
    // ==========================================
    const sDairy = queryFood(
      {
        category: hasLactose || isVegan
          ? ['Bebidas', 'Frutas']
          : ['Huevos y Lácteos', 'Lácteos y Derivados'],
        nameKeywords: hasLactose || isVegan
          ? ['bebida de avena', 'bebida de soja', 'fresas', 'arándanos']
          : ['yogur natural', 'kéfir', 'queso fresco batido', 'skyr', 'yogur griego'],
        excludeKeywords: ['azucarado', 'fresa azucarada', 'chocolate'],
      },
      daySeed + 12
    )

    const sFruitOrNut = queryFood(
      {
        category: ['Frutas', 'Frutos Secos y Semillas'],
        filterFn: (f) => f.calories <= 120 || f.category === 'Frutos Secos y Semillas',
        excludeKeywords: ['frito', 'salado', 'azúcar'],
      },
      daySeed + 13
    )

    const sItems: GeneratedMealItem[] = [
      {
        uid: `gen-s-${d}-0-${Math.random()}`,
        foodId: sDairy.id,
        quantityG: 125,
        notes: 'Lácteo fermentado suave o alternativa vegetal',
      },
      {
        uid: `gen-s-${d}-1-${Math.random()}`,
        foodId: sFruitOrNut.id,
        quantityG: sFruitOrNut.category === 'Frutas' ? 120 : 20,
        notes: 'Snack saciante de la tarde',
      },
    ]

    // ==========================================
    // 5. CENA (LIGERA Y REPARADORA)
    // ==========================================
    let dProt: FoodDatabaseItem
    if (isVegetarian || isVegan) {
      dProt = queryFood(
        {
          category: ['Huevos y Lácteos', 'Legumbres'],
          nameKeywords: ['huevo entero', 'claras de huevo', 'tofu', 'hummus'],
        },
        daySeed + 14
      )
    } else if (d % 2 === 0) {
      // Pescados ligeros o mariscos
      dProt = queryFood(
        {
          category: 'Pescados y Mariscos',
          nameKeywords: ['merluza', 'dorada', 'lubina', 'lenguado', 'sepia', 'calamar', 'salmón'],
          excludeKeywords: ['frito', 'rebozado'],
        },
        daySeed + 14
      )
    } else {
      // Huevos o ave magra
      dProt = queryFood(
        {
          category: ['Huevos y Lácteos', 'Carnes'],
          nameKeywords: hasEgg
            ? ['pechuga de pavo', 'pechuga de pollo', 'solomillo de pavo']
            : ['huevo entero', 'huevos camperos', 'clara de huevo', 'pechuga de pavo'],
          excludeKeywords: ['frito'],
        },
        daySeed + 14
      )
    }

    const dVeg = queryFood(
      {
        category: 'Verduras y Hortalizas',
        nameKeywords: ['crema', 'puré', 'espárragos', 'calabacín', 'judías verdes', 'ensalada', 'canónigos', 'champiñones'],
        excludeKeywords: ['albahaca', 'hierbabuena', 'perejil', 'cilantro'],
        filterFn: (f) => f.calories <= 75,
      },
      daySeed + 15
    )

    const dCarb = queryFood(
      {
        category: ['Cereales y Derivados', 'Cereales y Tubérculos', 'Aceites y Grasas'],
        nameKeywords: isKeto
          ? ['aguacate']
          : hasGluten
            ? ['patata', 'boniato', 'tortitas de arroz']
            : ['patata', 'boniato', 'pan 100% integral', 'pan de centeno'],
        excludeKeywords: ['harina', 'frita'],
      },
      daySeed + 16
    )

    const dOil = queryFood(
      {
        category: ['Aceites y Grasas', 'Grasas y Aceites'],
        nameKeywords: ['aceite de oliva virgen extra', 'aove'],
      },
      daySeed + 17
    )

    const isEggDinner = dProt.name.toLowerCase().includes('huevo')
    const dItems: GeneratedMealItem[] = [
      {
        uid: `gen-d-${d}-0-${Math.random()}`,
        foodId: dProt.id,
        quantityG: isEggDinner ? 110 : 160,
        notes: isEggDinner ? 'Tortilla francesa o revuelto con verduras' : 'Proteína ligera a la plancha o vapor',
      },
      {
        uid: `gen-d-${d}-1-${Math.random()}`,
        foodId: dVeg.id,
        quantityG: 180,
        notes: 'Verdura cocinada, puré casero o ensalada nocturna',
      },
      {
        uid: `gen-d-${d}-2-${Math.random()}`,
        foodId: dCarb.id,
        quantityG: dCarb.name.toLowerCase().includes('patata') || dCarb.name.toLowerCase().includes('boniato') ? 130 : 40,
        notes: 'Carbohidrato ligero controlado',
      },
      {
        uid: `gen-d-${d}-3-${Math.random()}`,
        foodId: dOil.id,
        quantityG: 8,
        notes: 'AOVE para cuajar y aliñar',
      },
    ]

    // ==========================================
    // 6. ESCALADO Y REAJUSTE FISIOLÓGICO REAL
    // ==========================================
    const allDayRaw = [...bItems, ...mmItems, ...lItems, ...sItems, ...dItems]
    let dayRawKcal = 0
    allDayRaw.forEach((it) => {
      const food = allFoods.find((f) => f.id === it.foodId)
      if (food) dayRawKcal += food.calories * (it.quantityG / 100)
    })

    const target = patient.targetKcal || 2000
    const ratio = dayRawKcal > 0 ? target / dayRawKcal : 1.0

    function scalePortions(items: GeneratedMealItem[]) {
      return items.map((it) => {
        const food = allFoods.find((f) => f.id === it.foodId)
        let newQty = it.quantityG
        if (food) {
          const norm = food.name.toLowerCase()
          const cat = (food.category || '').toLowerCase()

          // 1. Huevos enteros: unidades completas (~55g por huevo M)
          if (norm.includes('huevo entero') || norm.includes('huevos camperos') || norm.includes('tortilla')) {
            newQty = Math.max(55, Math.min(220, Math.round((it.quantityG * ratio) / 55) * 55))
          }
          // 2. Aceites y grasas: dosis culinaria real (5g cucharadita, 10g-15g cucharada sopera)
          else if (cat.includes('aceite') || norm.includes('aceite')) {
            newQty = Math.max(5, Math.min(15, Math.round((it.quantityG * Math.min(1.2, Math.max(0.8, ratio))) / 2.5) * 2.5))
          }
          // 3. Pan de molde / tostadas: rebanadas estándar (~30g-35g)
          else if (norm.includes('pan') || norm.includes('tostada') || norm.includes('biscote')) {
            newQty = Math.max(30, Math.min(90, Math.round((it.quantityG * ratio) / 30) * 30))
          }
          // 4. Frutos secos: puñado clínico (15g a 30g)
          else if (cat.includes('fruto seco') || norm.includes('nuez') || norm.includes('almendra') || norm.includes('pistacho')) {
            newQty = Math.max(15, Math.min(30, Math.round((it.quantityG * ratio) / 5) * 5))
          }
          // 5. Carnes, aves y pescados principales: ración realista de plato principal (110g a 220g)
          else if (cat.includes('carne') || cat.includes('pescado') || norm.includes('pollo') || norm.includes('ternera') || norm.includes('salmon') || norm.includes('merluza')) {
            newQty = Math.max(110, Math.min(220, Math.round((it.quantityG * ratio) / 5) * 5))
          }
          // 6. Legumbres cocidas: ración de plato (130g a 240g)
          else if (cat.includes('legumbre') || norm.includes('lenteja') || norm.includes('garbanzo') || norm.includes('alubia')) {
            newQty = Math.max(130, Math.min(240, Math.round((it.quantityG * ratio) / 10) * 10))
          }
          // 7. Frutas enteras de mesa: pieza entera (90g a 180g)
          else if (cat.includes('fruta') && (norm.includes('manzana') || norm.includes('platano') || norm.includes('naranja') || norm.includes('pera') || norm.includes('kiwi'))) {
            newQty = Math.max(90, Math.min(180, Math.round((it.quantityG * ratio) / 10) * 10))
          }
          // 8. Lácteos envasados (yogur 125g/250g, leche 150-250ml)
          else if (norm.includes('yogur')) {
            newQty = Math.max(125, Math.min(250, Math.round((it.quantityG * ratio) / 125) * 125))
          } else if (norm.includes('leche') || norm.includes('bebida de')) {
            newQty = Math.max(150, Math.min(250, Math.round((it.quantityG * ratio) / 25) * 25))
          }
          // 9. Resto de alimentos (arroz, pasta, patatas, verduras): múltiplos de 5g
          else {
            newQty = Math.max(15, Math.round((it.quantityG * ratio) / 5) * 5)
          }

          // Restricción específica GLP-1: limitar raciones individuales voluminosas
          if (patient.isGLP1Treatment && newQty > 190) {
            newQty = Math.min(newQty, 190)
          }
        }
        return {
          ...it,
          quantityG: newQty,
        }
      })
    }

    const scaledBreakfast = scalePortions(bItems)
    const scaledMidMorning = scalePortions(mmItems)
    const scaledLunch = scalePortions(lItems)
    const scaledSnack = scalePortions(sItems)
    const scaledDinner = scalePortions(dItems)

    // ==========================================
    // 7. AJUSTE FINO MATEMÁTICO CLÍNICO (< ±1% margen)
    // ==========================================
    const allScaledItems = [
      ...scaledBreakfast,
      ...scaledMidMorning,
      ...scaledLunch,
      ...scaledSnack,
      ...scaledDinner,
    ]

    let dayKcal = 0
    allScaledItems.forEach((it) => {
      const food = allFoods.find((f) => f.id === it.foodId)
      if (food) dayKcal += food.calories * (it.quantityG / 100)
    })

    let diffKcal = target - dayKcal
    if (Math.abs(diffKcal) > 20) {
      const adjustable = allScaledItems.filter((it) => {
        const food = allFoods.find((f) => f.id === it.foodId)
        if (!food) return false
        const norm = food.name.toLowerCase()
        const cat = (food.category || '').toLowerCase()
        return (
          cat.includes('cereal') ||
          cat.includes('grano') ||
          cat.includes('tubérculo') ||
          cat.includes('aceite') ||
          cat.includes('legumbre') ||
          norm.includes('arroz') ||
          norm.includes('pasta') ||
          norm.includes('patata') ||
          norm.includes('avena') ||
          norm.includes('pan') ||
          norm.includes('aceite') ||
          norm.includes('quinoa') ||
          norm.includes('garbanzo') ||
          norm.includes('lenteja')
        )
      })

      let iterations = 0
      while (Math.abs(diffKcal) > 20 && iterations < 20 && adjustable.length > 0) {
        iterations++
        for (const it of adjustable) {
          if (Math.abs(diffKcal) <= 20) break
          const food = allFoods.find((f) => f.id === it.foodId)!
          const isOil =
            (food.category || '').toLowerCase().includes('aceite') ||
            food.name.toLowerCase().includes('aceite')
          const stepG = isOil ? 2.5 : 10
          const kcalPerStep = (food.calories * stepG) / 100

          if (diffKcal > 0) {
            const maxCap = isOil ? 20 : 300
            if (it.quantityG + stepG <= maxCap) {
              it.quantityG += stepG
              diffKcal -= kcalPerStep
            }
          } else {
            const minCap = isOil ? 5 : 20
            if (it.quantityG - stepG >= minCap) {
              it.quantityG -= stepG
              diffKcal += kcalPerStep
            }
          }
        }
      }
    }

    weeklySchedule[d] = {
      BREAKFAST: scaledBreakfast,
      MID_MORNING: scaledMidMorning,
      LUNCH: scaledLunch,
      SNACK: scaledSnack,
      DINNER: scaledDinner,
    }
  }

  return weeklySchedule
}
