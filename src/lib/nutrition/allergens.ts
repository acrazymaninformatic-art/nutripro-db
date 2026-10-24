/**
 * @file allergens.ts
 * @description Clinical allergen & intolerance safety detection engine for EVSoftware.
 * Complies with EU Regulation 1169/2011 (14 major food allergens) + clinical intolerances.
 * Accurately cross-references patient clinical records (allergies, intolerances) against
 * foods and recipes to prevent critical safety hazards (e.g. gluten, lactose, nuts, shellfish, eggs).
 */

export interface AllergenDefinition {
  id: string
  name: string
  label: string
  icon: string
  keywords: string[]
  safeExceptions?: string[]
}

export const OFFICIAL_ALLERGENS: AllergenDefinition[] = [
  {
    id: 'GLUTEN',
    name: 'Gluten / Cereales con gluten',
    label: 'Gluten',
    icon: 'Wheat',
    keywords: [
      'gluten',
      'trigo',
      'pan',
      'baguette',
      'barra',
      'hogaza',
      'tostada',
      'picos',
      'colines',
      'biscote',
      'harina de trigo',
      'pasta',
      'espaguetis',
      'spaghetti',
      'macarrones',
      'penne',
      'tallarines',
      'fideos',
      'lasaña',
      'canelones',
      'cuscús',
      'cuscus',
      'couscous',
      'sémola',
      'semola',
      'avena',
      'avena integral',
      'copos de avena',
      'salvado de trigo',
      'germen de trigo',
      'cebada',
      'centeno',
      'espelta',
      'kamut',
      'triticale',
      'bizcocho',
      'galleta',
      'galletas',
      'bollería',
      'hojaldre',
      'pizza',
      'rebozado',
      'bechamel',
      'cerveza',
    ],
    safeExceptions: [
      'sin gluten',
      'gluten free',
      'gluten-free',
      'trigo sarraceno', // Sarraceno is naturally gluten-free pseudocereal
      'pan sin gluten',
      'pasta sin gluten',
      'avena sin gluten',
      'harina de maíz',
      'harina de arroz',
      'tortitas de maíz',
      'tortitas de arroz',
    ],
  },
  {
    id: 'LACTOSA',
    name: 'Lácteos / Lactosa',
    label: 'Lactosa / Lácteos',
    icon: 'Milk',
    keywords: [
      'lactosa',
      'leche',
      'queso',
      'yogur',
      'yogurt',
      'kéfir',
      'kefir',
      'nata',
      'mantequilla',
      'requesón',
      'requeson',
      'cuajada',
      'suero lácteo',
      'suero de leche',
      'caseína',
      'caseina',
      'skyr',
      'parmesano',
      'mozzarella',
      'gouda',
      'cheddar',
      'brie',
      'mascarpone',
      'ricotta',
      'queso fresco',
      'batido lácteo',
      'bechamel',
    ],
    safeExceptions: [
      'sin lactosa',
      'lactose free',
      'lactose-free',
      'leche de soja',
      'leche de avena',
      'leche de almendra',
      'leche de coco',
      'bebida de soja',
      'bebida de avena',
      'bebida de almendra',
      'bebida de almendras',
      'bebida de arroz',
      'bebida de coco',
      'bebida vegetal',
      'yogur de soja',
      'yogur vegetal',
      'queso vegano',
      'tofu',
    ],
  },
  {
    id: 'HUEVO',
    name: 'Huevos y ovoderivados',
    label: 'Huevo',
    icon: 'Egg',
    keywords: [
      'huevo',
      'huevos',
      'clara de huevo',
      'yema',
      'tortilla',
      'revuelto',
      'mayonesa',
      'merengue',
      'huevo poché',
      'huevo cocido',
    ],
    safeExceptions: ['sin huevo', 'vegano', 'vegana'],
  },
  {
    id: 'PESCADO',
    name: 'Pescados',
    label: 'Pescado',
    icon: 'Fish',
    keywords: [
      'pescado',
      'salmón',
      'salmon',
      'atún',
      'atun',
      'merluza',
      'bacalao',
      'lubina',
      'dorada',
      'sardina',
      'sardinas',
      'boquerón',
      'boqueron',
      'boquerones',
      'trucha',
      'rape',
      'lenguado',
      'pez espada',
      'emperador',
      'corvina',
      'bonito del norte',
      'caballa',
      'rodaballo',
      'anchoa',
      'anchoas',
      'abadejo',
      'mero',
      'pescadilla',
    ],
    safeExceptions: [],
  },
  {
    id: 'MARISCO',
    name: 'Crustáceos y Moluscos (Marisco)',
    label: 'Marisco / Crustáceos',
    icon: 'Shell',
    keywords: [
      'marisco',
      'mariscos',
      'gamba',
      'gambas',
      'langostino',
      'langostinos',
      'langosta',
      'bogavante',
      'cangrejo',
      'mejillón',
      'mejillon',
      'mejillones',
      'almeja',
      'almejas',
      'ostra',
      'ostras',
      'calamar',
      'calamares',
      'pulpo',
      'sepia',
      'berberecho',
      'berberechos',
      'navaja',
      'navajas',
      'chipirón',
      'chipiron',
      'chipirones',
      'pota',
      'gulas',
      'centollo',
      'nécora',
      'necora',
      'cigala',
      'cigalas',
      'percebe',
      'percebes',
    ],
    safeExceptions: [],
  },
  {
    id: 'FRUTOS_SECOS',
    name: 'Frutos de cáscara (Frutos secos)',
    label: 'Frutos Secos',
    icon: 'Nut',
    keywords: [
      'fruto seco',
      'frutos secos',
      'nuez',
      'nueces',
      'almendra',
      'almendras',
      'avellana',
      'avellanas',
      'anacardo',
      'anacardos',
      'pistacho',
      'pistachos',
      'piñón',
      'piñon',
      'piñones',
      'castaña',
      'castañas',
      'macadamia',
      'nuez de brasil',
      'pacana',
      'pecana',
    ],
    safeExceptions: [],
  },
  {
    id: 'CACAHUETE',
    name: 'Cacahuetes / Maní',
    label: 'Cacahuete',
    icon: 'Nut',
    keywords: [
      'cacahuete',
      'cacahuetes',
      'maní',
      'mani',
      'crema de cacahuete',
      'manteca de cacahuete',
      'mantequilla de cacahuete',
    ],
    safeExceptions: [],
  },
  {
    id: 'SOJA',
    name: 'Soja y derivados',
    label: 'Soja',
    icon: 'Bean',
    keywords: [
      'soja',
      'tofu',
      'tempeh',
      'edamame',
      'salsa de soja',
      'tamari',
      'miso',
      'bebida de soja',
      'leche de soja',
      'soja texturizada',
    ],
    safeExceptions: [],
  },
  {
    id: 'SESAMO',
    name: 'Granos de sésamo',
    label: 'Sésamo',
    icon: 'Sprout',
    keywords: [
      'sésamo',
      'sesamo',
      'ajonjolí',
      'ajonjoli',
      'tahini',
      'tahina',
      'semillas de sésamo',
    ],
    safeExceptions: [],
  },
  {
    id: 'APIO',
    name: 'Apio y derivados',
    label: 'Apio',
    icon: 'Leaf',
    keywords: ['apio', 'sal de apio'],
    safeExceptions: [],
  },
  {
    id: 'MOSTAZA',
    name: 'Mostaza y derivados',
    label: 'Mostaza',
    icon: 'Soup',
    keywords: ['mostaza', 'salsa de mostaza'],
    safeExceptions: [],
  },
  {
    id: 'SULFITOS',
    name: 'Dióxido de azufre y sulfitos',
    label: 'Sulfitos',
    icon: 'Wine',
    keywords: ['sulfito', 'sulfitos', 'vino', 'vinagre de vino'],
    safeExceptions: [],
  },
  {
    id: 'ALTRAMUCES',
    name: 'Altramuces y derivados',
    label: 'Altramuces',
    icon: 'Sprout',
    keywords: ['altramuz', 'altramuces', 'chocho'],
    safeExceptions: [],
  },
]

export interface DetectedFoodAllergen {
  allergenId: string
  label: string
  icon: string
  matchedKeyword: string
}

export interface PatientAllergenConflict {
  hasConflict: boolean
  allergenId: string
  allergenLabel: string
  allergenIcon: string
  severity: 'CRITICAL_ALLERGY' | 'INTOLERANCE'
  matchedPatientTerm: string
  matchedFoodTerm: string
  alertTitle: string
  alertMessage: string
}

/**
 * Normalizes text removing diacritics and excessive punctuation for resilient substring matching.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const DECLARED_TERM_STOPWORDS = new Set([
  'alergia',
  'alergias',
  'alergico',
  'alergica',
  'intolerancia',
  'intolerancias',
  'intolerante',
  'ninguna',
  'ninguno',
  'conocida',
  'conocido',
  'consta',
  'sin',
  'leve',
  'moderada',
  'grave',
  'severa',
])

/**
 * Extrae términos concretos de una lista libre de alergias o intolerancias
 * ("alergia al kiwi, melocotón") para poder detectar también alimentos que no
 * pertenecen a los 14 alérgenos oficiales. Es deliberadamente conservador:
 * solo compara términos de tres o más caracteres y descarta conectores.
 */
function extractDeclaredTerms(raw: string): string[] {
  return raw
    .split(/[,;/\n]+|\s+y\s+/i)
    .map((part) =>
      normalizeText(part)
        .replace(/^(alergias?|alergicos?|alergicas?|intolerancias?|intolerantes?)\s+(a\s+|al\s+|a\s+la\s+|a\s+los\s+|a\s+las\s+)?/, '')
        .trim()
    )
    .filter((term) => term.length >= 3 && !DECLARED_TERM_STOPWORDS.has(term))
}

function foodMatchesDeclaredTerm(foodNorm: string, term: string): boolean {
  if (!/^[a-z0-9]+$/.test(term)) return foodNorm.includes(term)
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}(?:s|es)?([^a-z0-9]|$)`).test(foodNorm)
}

/**
 * Detects which allergens are present in a given food by analyzing its name and category.
 */
export function detectAllergensInFood(food: {
  name: string
  category?: string | null
  /** Lista explícita de alérgenos declarados en la ficha del alimento. */
  allergensJson?: string | null
}): DetectedFoodAllergen[] {
  const foodNorm = normalizeText(food.name)
  const categoryNorm = food.category ? normalizeText(food.category) : ''
  const detected: DetectedFoodAllergen[] = []

  for (const allergen of OFFICIAL_ALLERGENS) {
    // Check safe exceptions first (e.g. "pan sin gluten" must NOT flag GLUTEN)
    const isSafeException = allergen.safeExceptions?.some((safe) =>
      foodNorm.includes(normalizeText(safe))
    )
    if (isSafeException) continue

    // Check category match
    if (
      allergen.id === 'PESCADO' &&
      categoryNorm.includes('pescado') &&
      !foodNorm.includes('marisco')
    ) {
      detected.push({
        allergenId: allergen.id,
        label: allergen.label,
        icon: allergen.icon,
        matchedKeyword: 'Categoría Pescados',
      })
      continue
    }

    if (
      allergen.id === 'LACTOSA' &&
      categoryNorm.includes('lacteo') &&
      !isSafeException
    ) {
      detected.push({
        allergenId: allergen.id,
        label: allergen.label,
        icon: allergen.icon,
        matchedKeyword: 'Categoría Lácteos',
      })
      continue
    }

    // Check keyword match in food name
    for (const kw of allergen.keywords) {
      const kwNorm = normalizeText(kw)
      // Word boundary or substring matching
      const regex = new RegExp(`(^|\\s|[,\\.-])${kwNorm}(\\s|[,\\.-]|$)`, 'i')
      const matchesWord = regex.test(foodNorm) || foodNorm.includes(kwNorm)

      if (matchesWord) {
        detected.push({
          allergenId: allergen.id,
          label: allergen.label,
          icon: allergen.icon,
          matchedKeyword: kw,
        })
        break
      }
    }
  }

  // Alérgenos declarados de forma estructurada en la ficha del alimento.
  // Tienen prioridad sobre la inferencia por nombre y no se saltan por una
  // etiqueta "sin..." del nombre comercial.
  if (food.allergensJson) {
    try {
      const declared = JSON.parse(food.allergensJson)
      if (Array.isArray(declared)) {
        for (const token of declared) {
          if (typeof token !== 'string' || !token.trim()) continue
          const tokenNorm = normalizeText(token)
          const allergen = OFFICIAL_ALLERGENS.find((candidate) => {
            const identifiers = [candidate.id, candidate.name, candidate.label, ...candidate.keywords]
            return identifiers.some((identifier) => {
              const normalized = normalizeText(identifier)
              return tokenNorm === normalized || tokenNorm.includes(normalized)
            })
          })
          if (allergen && !detected.some((item) => item.allergenId === allergen.id)) {
            detected.push({
              allergenId: allergen.id,
              label: allergen.label,
              icon: allergen.icon,
              matchedKeyword: `Ficha del alimento: ${token}`,
            })
          }
        }
      }
    } catch {
      // Un JSON corrupto no debe silenciar el resto de comprobaciones.
    }
  }

  return detected
}

export interface PlanAllergenConflict {
  dayNumber: number
  mealType: string
  foodName: string
  recipeName?: string
  conflict: PatientAllergenConflict
}

interface PlanForAllergenScan {
  days: Array<{
    dayNumber: number
    meals: Array<{
      mealType: string
      items: Array<{
        food?: { name: string; category?: string | null; allergensJson?: string | null } | null
        recipe?: {
          name: string
          ingredients?: Array<{
            quantityG: number
            food?: { name: string; category?: string | null; allergensJson?: string | null } | null
          }> | null
        } | null
      }>
    }>
  }>
}

/**
 * Recorre un plan completo (incluidas recetas y alternativas) y devuelve todos
 * los conflictos detectados. Se usa como bloqueo duro en la publicación.
 */
export function scanPlanForAllergenConflicts(
  plan: PlanForAllergenScan,
  patient: {
    allergies?: string | null
    intolerances?: string | null
    firstName?: string
    lastName?: string
  }
): PlanAllergenConflict[] {
  const conflicts: PlanAllergenConflict[] = []
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        if (item.food) {
          const conflict = checkPatientAllergenConflict(item.food, patient)
          if (conflict) {
            conflicts.push({
              dayNumber: day.dayNumber,
              mealType: meal.mealType,
              foodName: item.food.name,
              conflict,
            })
          }
          continue
        }
        if (item.recipe) {
          const ingredients = item.recipe.ingredients || []
          if (ingredients.length === 0) {
            const conflict = checkPatientAllergenConflict({ name: item.recipe.name }, patient)
            if (conflict) {
              conflicts.push({
                dayNumber: day.dayNumber,
                mealType: meal.mealType,
                foodName: item.recipe.name,
                recipeName: item.recipe.name,
                conflict,
              })
            }
            continue
          }
          for (const ingredient of ingredients) {
            if (!ingredient.food) continue
            const conflict = checkPatientAllergenConflict(ingredient.food, patient)
            if (conflict) {
              conflicts.push({
                dayNumber: day.dayNumber,
                mealType: meal.mealType,
                foodName: ingredient.food.name,
                recipeName: item.recipe.name,
                conflict,
              })
            }
          }
        }
      }
    }
  }
  return conflicts
}

/**
 * Checks if a food conflicts with a patient's documented allergies or intolerances.
 */
export function checkPatientAllergenConflict(
  food: { name: string; category?: string | null; allergensJson?: string | null },
  patient?: {
    allergies?: string | null
    intolerances?: string | null
    firstName?: string
    lastName?: string
  } | null
): PatientAllergenConflict | null {
  if (!patient) return null

  const rawAllergies = (patient.allergies || '').trim()
  const rawIntolerances = (patient.intolerances || '').trim()
  if (!rawAllergies && !rawIntolerances) return null

  const patientName = patient.firstName
    ? `${patient.firstName}${patient.lastName ? ' ' + patient.lastName : ''}`
    : 'el paciente'

  // Detect allergens in food
  const foodAllergens = detectAllergensInFood(food)
  const allergiesNorm = normalizeText(rawAllergies)
  const intolerancesNorm = normalizeText(rawIntolerances)

  // Map of patient terms to allergen IDs
  const patientTermMap: { [key: string]: string[] } = {
    GLUTEN: [
      'gluten',
      'celiac',
      'celiaqu',
      'trigo',
      'trigo sarraceno',
      'avena',
      'cebada',
      'centeno',
      'harina',
      'pan',
    ],
    LACTOSA: [
      'lactos',
      'leche',
      'lacteo',
      'lactea',
      'caseina',
      'queso',
      'yogur',
    ],
    HUEVO: ['huevo', 'huevos', 'clara', 'yema', 'tortilla'],
    PESCADO: ['pescad', 'salmon', 'atun', 'merluza'],
    MARISCO: ['marisc', 'gamba', 'crustace', 'molusc', 'calamar', 'pulpo', 'almeja'],
    FRUTOS_SECOS: ['fruto', 'frutos secos', 'nuez', 'nueces', 'almendra', 'avellana', 'anacardo', 'pistacho'],
    CACAHUETE: ['cacahuete', 'mani'],
    SOJA: ['soja', 'tofu'],
    SESAMO: ['sesamo', 'tahini'],
    APIO: ['apio'],
    MOSTAZA: ['mostaza'],
    SULFITOS: ['sulfito', 'vino'],
    ALTRAMUCES: ['altramuz'],
  }

  // Los términos que ya cubre el catálogo oficial se resuelven con su lógica
  // de excepciones seguras ("sin gluten", "sin lactosa") y no deben volver a
  // marcarse por la vía genérica.
  const officialPatientTerms = new Set(
    Object.values(patientTermMap).flat().map((term) => normalizeText(term))
  )

  for (const foodAllergen of foodAllergens) {
    const allergenTerms = patientTermMap[foodAllergen.allergenId] || [
      foodAllergen.allergenId.toLowerCase(),
    ]

    // 1. Check CRITICAL ALLERGIES first
    for (const term of allergenTerms) {
      const termNorm = normalizeText(term)
      if (allergiesNorm.includes(termNorm)) {
        return {
          hasConflict: true,
          allergenId: foodAllergen.allergenId,
          allergenLabel: foodAllergen.label,
          allergenIcon: foodAllergen.icon,
          severity: 'CRITICAL_ALLERGY',
          matchedPatientTerm: term,
          matchedFoodTerm: foodAllergen.matchedKeyword,
          alertTitle: ` ALERTA CRÍTICA: ${foodAllergen.label.toUpperCase()}`,
          alertMessage: `El paciente ${patientName} tiene ALERGIA registrada a ${foodAllergen.label}. El alimento "${food.name}" contiene ${foodAllergen.matchedKeyword}. Su prescripción representa un riesgo directo de reacción alérgica grave.`,
        }
      }
    }

    // 2. Check INTOLERANCES second
    for (const term of allergenTerms) {
      const termNorm = normalizeText(term)
      if (intolerancesNorm.includes(termNorm)) {
        return {
          hasConflict: true,
          allergenId: foodAllergen.allergenId,
          allergenLabel: foodAllergen.label,
          allergenIcon: foodAllergen.icon,
          severity: 'INTOLERANCE',
          matchedPatientTerm: term,
          matchedFoodTerm: foodAllergen.matchedKeyword,
          alertTitle: ` INTOLERANCIA CLÍNICA: ${foodAllergen.label.toUpperCase()}`,
          alertMessage: `El paciente ${patientName} presenta INTOLERANCIA clínica a ${foodAllergen.label}. El alimento "${food.name}" contiene ${foodAllergen.matchedKeyword} y puede provocar sintomatología digestiva o inflamatoria.`,
        }
      }
    }
  }

  // 3. Alergias o intolerancias declaradas que no forman parte del catálogo
  // oficial de 14 alérgenos (kiwi, melocotón, chía...). Sin esta comprobación
  // un plan podría publicarse con un alimento clínicamente incompatible.
  const declaredFoodName = normalizeText(food.name)
  const declaredAllergyTerm = extractDeclaredTerms(rawAllergies).find(
    (term) => !officialPatientTerms.has(term) && foodMatchesDeclaredTerm(declaredFoodName, term)
  )
  if (declaredAllergyTerm) {
    return {
      hasConflict: true,
      allergenId: 'DECLARED_ALLERGY',
      allergenLabel: declaredAllergyTerm,
      allergenIcon: 'AlertTriangle',
      severity: 'CRITICAL_ALLERGY',
      matchedPatientTerm: declaredAllergyTerm,
      matchedFoodTerm: food.name,
      alertTitle: ` ALERTA CRÍTICA: ALERGIA DECLARADA A ${declaredAllergyTerm.toUpperCase()}`,
      alertMessage: `El paciente ${patientName} tiene registrada una alergia a "${declaredAllergyTerm}". El alimento "${food.name}" coincide con ese término. Revisa la ficha y sustituye el alimento antes de publicar.`,
    }
  }

  const declaredIntoleranceTerm = extractDeclaredTerms(rawIntolerances).find(
    (term) => !officialPatientTerms.has(term) && foodMatchesDeclaredTerm(declaredFoodName, term)
  )
  if (declaredIntoleranceTerm) {
    return {
      hasConflict: true,
      allergenId: 'DECLARED_INTOLERANCE',
      allergenLabel: declaredIntoleranceTerm,
      allergenIcon: 'AlertTriangle',
      severity: 'INTOLERANCE',
      matchedPatientTerm: declaredIntoleranceTerm,
      matchedFoodTerm: food.name,
      alertTitle: ` INTOLERANCIA DECLARADA: ${declaredIntoleranceTerm.toUpperCase()}`,
      alertMessage: `El paciente ${patientName} tiene registrada una intolerancia a "${declaredIntoleranceTerm}". El alimento "${food.name}" coincide con ese término. Revisa la ficha y sustituye el alimento antes de publicar.`,
    }
  }

  return null
}

/**
 * Scans an entire weekly plan grid and reports all allergen conflicts for a patient.
 */
export function scanPlanForAllergens(
  gridSchedule: { [mealType: string]: { [dayIndex: number]: Array<{ foodId: number }> } },
  foodMap: Map<number, { name: string; category?: string | null }>,
  patient?: {
    allergies?: string | null
    intolerances?: string | null
    firstName?: string
    lastName?: string
  } | null,
  dayNames: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  mealLabels: { [key: string]: string } = {
    BREAKFAST: 'Desayuno',
    MID_MORNING: 'Media Mañana',
    LUNCH: 'Comida',
    SNACK: 'Merienda',
    DINNER: 'Cena',
  }
): Array<{
  mealType: string
  mealLabel: string
  dayIndex: number
  dayName: string
  foodId: number
  foodName: string
  conflict: PatientAllergenConflict
}> {
  if (!patient || (!patient.allergies && !patient.intolerances)) return []

  const reports: Array<{
    mealType: string
    mealLabel: string
    dayIndex: number
    dayName: string
    foodId: number
    foodName: string
    conflict: PatientAllergenConflict
  }> = []

  Object.entries(gridSchedule || {}).forEach(([mealType, days]) => {
    Object.entries(days || {}).forEach(([dayStr, items]) => {
      const dayIndex = parseInt(dayStr, 10)
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const food = foodMap.get(item.foodId)
          if (food) {
            const conflict = checkPatientAllergenConflict(food, patient)
            if (conflict) {
              reports.push({
                mealType,
                mealLabel: mealLabels[mealType] || mealType,
                dayIndex,
                dayName: dayNames[dayIndex] || `Día ${dayIndex + 1}`,
                foodId: item.foodId,
                foodName: food.name,
                conflict,
              })
            }
          }
        })
      }
    })
  })

  return reports
}
