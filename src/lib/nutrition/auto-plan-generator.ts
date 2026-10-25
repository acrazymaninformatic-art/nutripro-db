/**
 * @file auto-plan-generator.ts
 * @description Intelligent clinical meal plan generation engine for EVSoftware.
 * Automatically constructs realistic, balanced, personalized 7-day meal plans
 * strictly adapted to the patient's caloric goal, macronutrients, objective,
 * food allergies, intolerances, clinical history, and dietary preferences.
 */

import {
  checkPatientAllergenConflict,
} from './allergens'

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
  const isKeto =
    preferences.includes('keto') ||
    preferences.includes('cetog') ||
    preferences.includes('baja en hidratos')

  /**
   * Evaluates whether a food is forbidden for this patient due to:
   * 1. Official allergens & intolerances (using EU 1169/2011 engine)
   * 2. Patient-specific food aversions
   * 3. Dietary preferences (vegan, vegetarian, keto)
   * 4. Medical contraindications (e.g. hypertension -> avoid processed meats)
   */
  function isFoodForbidden(name: string, category: string | null): boolean {
    const n = name.toLowerCase()

    // 1. Check patient food aversions
    if (aversions.some((av) => n.includes(av))) return true

    // 2. Strict EU Clinical Allergens & Intolerances Check
    const allergenConflict = checkPatientAllergenConflict(
      { name, category },
      {
        allergies: patient.allergies,
        intolerances: patient.intolerances,
        firstName: patient.firstName,
      }
    )
    if (allergenConflict) {
      return true
    }

    // 3. Dietary preferences
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
        n.includes('bacalao'))
    ) {
      return true
    }

    if (
      isVegan &&
      (category === 'Lácteos' ||
        category === 'Huevos' ||
        n.includes('leche') ||
        n.includes('queso') ||
        n.includes('yogur') ||
        n.includes('huevo') ||
        n.includes('kéfir') ||
        n.includes('mantequilla') ||
        n.includes('skyr'))
    ) {
      return true
    }

    if (
      isKeto &&
      (category === 'Cereales y Harinas' ||
        category === 'Pastas' ||
        n.includes('arroz blanco') ||
        n.includes('pasta') ||
        n.includes('pan blanco') ||
        n.includes('patata') ||
        n.includes('boniato'))
    ) {
      return true
    }

    // 4. Medical considerations (hypertension: avoid cured sodium-heavy meats)
    if (
      medical.includes('hipertens') &&
      (n.includes('jamón serrano') ||
        n.includes('bacon') ||
        n.includes('salchicha') ||
        n.includes('chorizo'))
    ) {
      return true
    }

    return false
  }

  /**
   * Safe keyword search with fallback that NEVER returns a forbidden or allergen-conflicting food.
   */
  function findFood(keywords: string[], fallbackId?: number): FoodDatabaseItem {
    for (const kw of keywords) {
      const match = allFoods.find((f) => {
        const n = f.name.toLowerCase()
        if (!n.includes(kw.toLowerCase())) return false
        if (isFoodForbidden(f.name, f.category)) return false
        return true
      })
      if (match) return match
    }

    // If direct keywords didn't find permitted item, try broader keyword match
    for (const kw of keywords) {
      const tokens = kw.toLowerCase().split(' ')
      for (const token of tokens) {
        if (token.length < 4) continue
        const partial = allFoods.find((f) => {
          if (!f.name.toLowerCase().includes(token)) return false
          if (isFoodForbidden(f.name, f.category)) return false
          return true
        })
        if (partial) return partial
      }
    }

    // If fallbackId provided and safe, use it
    if (fallbackId) {
      const fallback = allFoods.find((f) => f.id === fallbackId)
      if (fallback && !isFoodForbidden(fallback.name, fallback.category)) {
        return fallback
      }
    }

    // Safe permitted fallback from database
    const safeFallback = allFoods.find((f) => !isFoodForbidden(f.name, f.category))
    return safeFallback || allFoods[0]
  }

  // Precompute patient allergies to select realistic everyday culinary alternatives
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

  // Realistic Spanish Mediterranean weekly meal plans
  const weeklyTemplates = [
    // Lunes (Día 1): Pollo al horno con patatas / Salmón a la plancha
    {
      breakfast: [
        {
          kw: hasGluten
            ? ['tortitas de maíz', 'tortitas de arroz', 'copos de avena sin gluten']
            : ['avena integral', 'copos de avena', 'pan integral'],
          qty: 60,
          notes: 'Porridge templado con canela o tostada',
        },
        {
          kw: hasLactose || isVegan
            ? ['bebida de avena', 'bebida de almendras', 'bebida de soja']
            : ['leche semidesnatada', 'leche desnatada'],
          qty: 200,
          notes: 'Con café solo o té verde',
        },
        { kw: ['plátano', 'platano'], qty: 100, notes: 'En rodajas sobre la avena' },
      ],
      midMorning: [
        { kw: ['manzana', 'pera'], qty: 160, notes: 'Pieza fresca bien lavada' },
        {
          kw: hasNuts ? ['tortitas de arroz', 'arándanos'] : ['nuez', 'almendras'],
          qty: 20,
          notes: 'Crudas al natural',
        },
      ],
      lunch: [
        {
          kw: isVegetarian
            ? ['lentejas cocidas', 'tofu firme']
            : ['pechuga de pollo', 'solomillo de pollo'],
          qty: 180,
          notes: 'A la plancha con unas gotas de limón y perejil',
        },
        {
          kw: isKeto ? ['calabacín'] : ['arroz blanco', 'arroz basmati', 'arroz integral'],
          qty: 85,
          notes: 'Cocido al punto',
        },
        { kw: ['brócoli', 'brocoli', 'judías verdes'], qty: 160, notes: 'Al vapor' },
        { kw: ['aceite de oliva virgen extra', 'aceite de oliva'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        {
          kw: hasLactose || isVegan
            ? ['bebida de soja', 'arándanos']
            : ['yogur natural', 'queso fresco batido'],
          qty: 125,
          notes: 'Natural sin azúcar',
        },
        {
          kw: hasNuts ? ['fresas'] : ['almendras', 'nueces'],
          qty: 15,
          notes: 'Al natural',
        },
      ],
      dinner: [
        {
          kw: hasFish || isVegetarian
            ? ['pechuga de pavo', 'tofu firme']
            : ['salmón fresco', 'salmon'],
          qty: 160,
          notes: 'A la plancha con limón',
        },
        { kw: ['judías verdes', 'espárragos verdes', 'calabacín'], qty: 160, notes: 'Salteado' },
        {
          kw: isKeto ? ['aguacate'] : ['patata', 'patatas'],
          qty: 140,
          notes: 'Cocida o al vapor con piel',
        },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Aliño en crudo' },
      ],
    },

    // Martes (Día 2): Pescado blanco y verduras / Ternera magra
    {
      breakfast: [
        {
          kw: hasGluten
            ? ['tortitas de maíz', 'tortitas de arroz']
            : ['pan 100% integral', 'pan de centeno', 'pan de masa madre'],
          qty: 70,
          notes: 'Tostado',
        },
        {
          kw: hasEgg || isVegan
            ? ['aguacate', 'hummus']
            : ['huevo entero', 'huevos camperos', 'clara de huevo'],
          qty: 110,
          notes: 'A la plancha o pasado por agua',
        },
        { kw: ['tomate de rama', 'tomate'], qty: 80, notes: 'Rallado sobre la tostada' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: '1 cucharadita sobre el tomate' },
      ],
      midMorning: [
        { kw: ['arándanos', 'fresas', 'frutos rojos'], qty: 125, notes: 'Frescos' },
        {
          kw: hasLactose || isVegan
            ? ['bebida de almendras', 'tortitas de arroz']
            : ['queso fresco batido', 'yogur natural'],
          qty: 140,
          notes: 'Al natural',
        },
      ],
      lunch: [
        {
          kw: isVegetarian
            ? ['garbanzos cocidos', 'lentejas']
            : ['filete de ternera magra', 'solomillo de ternera', 'pechuga de pavo'],
          qty: 160,
          notes: 'A la plancha vuelta y vuelta',
        },
        {
          kw: isKeto ? ['calabacín'] : ['boniato asado', 'patata cocida'],
          qty: 160,
          notes: 'Asado al horno con especias',
        },
        { kw: ['calabacín', 'berenjena a la plancha'], qty: 140, notes: 'A la plancha' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        { kw: ['kiwi', 'manzana'], qty: 140, notes: 'Pieza madura' },
        {
          kw: hasNuts ? ['tortitas de maíz'] : ['nueces', 'almendras'],
          qty: 20,
          notes: 'Al natural',
        },
      ],
      dinner: [
        {
          kw: hasFish || isVegetarian
            ? ['pechuga de pollo', 'tofu firme']
            : ['merluza fresca', 'merluza'],
          qty: 180,
          notes: 'Al vapor o a la plancha con ajo y perejil',
        },
        { kw: ['crema de calabacín', 'puré de verduras'], qty: 200, notes: 'Casera sin nata' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'En el puré' },
      ],
    },

    // Miércoles (Día 3): Legumbres mediterráneas / Merluza o Sepia
    {
      breakfast: [
        {
          kw: hasGluten
            ? ['tortitas de arroz', 'copos de maíz']
            : ['avena integral', 'copos de avena'],
          qty: 65,
          notes: 'Porridge o tazón',
        },
        {
          kw: hasLactose || isVegan
            ? ['bebida de avena', 'bebida de soja']
            : ['leche semidesnatada'],
          qty: 200,
          notes: 'Templada',
        },
        { kw: ['fresas', 'arándanos'], qty: 90, notes: 'Fruta fresca' },
      ],
      midMorning: [
        { kw: ['naranja fresca', 'mandarina'], qty: 160, notes: 'En gajos entera (no en zumo)' },
        {
          kw: hasNuts ? ['tortitas de arroz'] : ['almendras', 'avellanas'],
          qty: 20,
          notes: 'Crudas',
        },
      ],
      lunch: [
        {
          kw: ['lentejas estofadas con verduras', 'lentejas cocidas'],
          qty: 220,
          notes: 'Estofadas con cebolla, zanahoria y pimiento dulce',
        },
        {
          kw: isKeto ? ['ensalada verde'] : ['arroz blanco', 'arroz integral'],
          qty: 60,
          notes: 'Acompañamiento clásico',
        },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En el guiso' },
      ],
      snack: [
        {
          kw: hasLactose || isVegan
            ? ['bebida de avena', 'plátano']
            : ['yogur natural', 'kéfir'],
          qty: 125,
          notes: 'Con canela espolvoreada',
        },
        { kw: ['manzana'], qty: 120, notes: 'Fresca' },
      ],
      dinner: [
        {
          kw: hasFish || hasShellfish || isVegetarian
            ? ['pechuga de pavo', 'tofu firme']
            : ['sepia a la plancha', 'merluza fresca'],
          qty: 170,
          notes: 'A la plancha con limón',
        },
        { kw: ['espárragos verdes', 'espárragos trigueros'], qty: 160, notes: 'A la plancha' },
        {
          kw: hasGluten || isKeto
            ? ['patata cocida', 'patata']
            : ['pan 100% integral', 'pan de centeno'],
          qty: 40,
          notes: 'Ración controlada',
        },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Aliño' },
      ],
    },

    // Jueves (Día 4): Pasta integral con carne magra / Dorada al horno
    {
      breakfast: [
        {
          kw: hasGluten
            ? ['tortitas de maíz', 'tortitas de arroz']
            : ['pan 100% integral', 'tostada'],
          qty: 70,
          notes: 'Tostado',
        },
        {
          kw: isVegetarian
            ? ['hummus', 'aguacate']
            : ['pechuga de pavo', 'jamón cocido extra'],
          qty: 70,
          notes: 'Embutido magro de calidad',
        },
        { kw: ['aguacate'], qty: 40, notes: 'En láminas' },
      ],
      midMorning: [
        { kw: ['plátano'], qty: 100, notes: 'Pieza madura' },
        {
          kw: hasNuts ? ['tortitas de maíz'] : ['nueces', 'almendras'],
          qty: 20,
          notes: 'Al natural',
        },
      ],
      lunch: [
        {
          kw: isVegetarian
            ? ['soja texturizada', 'tofu firme']
            : ['carne picada de ternera magra', 'pechuga de pollo'],
          qty: 160,
          notes: 'Salteada con orégano y salsa de tomate casera',
        },
        {
          kw: hasGluten || isKeto
            ? ['arroz blanco', 'quinoa', 'patata']
            : ['macarrones 100% integrales', 'pasta penne'],
          qty: 80,
          notes: 'Al dente',
        },
        { kw: ['champiñón', 'champiñones'], qty: 100, notes: 'Salteados con la salsa' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        {
          kw: hasLactose || isVegan
            ? ['bebida de soja']
            : ['queso fresco batido', 'yogur natural'],
          qty: 140,
          notes: 'Con fruta',
        },
        { kw: ['arándanos silvestres', 'arándanos'], qty: 60, notes: 'Lavados' },
      ],
      dinner: [
        {
          kw: hasFish || isVegetarian
            ? ['pechuga de pollo', 'tofu firme']
            : ['dorada fresca', 'lubina fresca'],
          qty: 180,
          notes: 'Al horno con limón',
        },
        {
          kw: isKeto ? ['calabacín'] : ['patata', 'patatas'],
          qty: 140,
          notes: 'Panadera al horno',
        },
        { kw: ['ensalada de canónigos', 'lechuga'], qty: 100, notes: 'Aliñada con vinagre' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'En crudo' },
      ],
    },

    // Viernes (Día 5): Aves magras / Pescado azul y verduras
    {
      breakfast: [
        {
          kw: hasGluten
            ? ['tortitas de maíz', 'tortitas de arroz']
            : ['avena integral', 'copos de avena'],
          qty: 60,
          notes: 'Con bebida caliente',
        },
        {
          kw: hasLactose || isVegan
            ? ['bebida de almendras', 'bebida de avena']
            : ['leche desnatada', 'leche semidesnatada'],
          qty: 200,
          notes: 'Bebida',
        },
        { kw: ['pera', 'manzana'], qty: 120, notes: 'En dados' },
      ],
      midMorning: [
        {
          kw: hasLactose || isVegan
            ? ['bebida de avena']
            : ['yogur natural', 'yogur proteico'],
          qty: 125,
          notes: 'Natural',
        },
        {
          kw: hasNuts ? ['fresas'] : ['almendras', 'avellanas'],
          qty: 20,
          notes: 'Crudas',
        },
      ],
      lunch: [
        {
          kw: isVegetarian
            ? ['tofu firme']
            : ['solomillo de cerdo', 'lomo de cerdo magro', 'pechuga de pollo'],
          qty: 170,
          notes: 'A la plancha con pimienta negra',
        },
        {
          kw: isKeto ? ['calabacín'] : ['patata cocida', 'patata'],
          qty: 170,
          notes: 'Cocida al vapor',
        },
        { kw: ['pimientos asados', 'pimiento verde'], qty: 120, notes: 'Asados' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        { kw: ['fresas frescas', 'moras'], qty: 140, notes: 'Fruta fresca' },
        {
          kw: hasNuts ? ['tortitas de maíz'] : ['nueces'],
          qty: 20,
          notes: 'Al natural',
        },
      ],
      dinner: [
        {
          kw: hasFish || isVegetarian
            ? ['pechuga de pavo', 'tofu firme']
            : ['atún claro al natural', 'salmón'],
          qty: 150,
          notes: 'A la plancha con unas gotas de limón',
        },
        { kw: ['espárragos blancos', 'ensalada mixta'], qty: 180, notes: 'Con vinagre de manzana' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Aliño' },
      ],
    },

    // Sábado (Día 6): Arroz mediterráneo / Merluza al vapor
    {
      breakfast: [
        {
          kw: hasGluten
            ? ['tortitas de arroz']
            : ['pan de masa madre', 'pan 100% integral'],
          qty: 70,
          notes: 'Tostado',
        },
        {
          kw: hasEgg || isVegan
            ? ['aguacate', 'hummus']
            : ['huevo entero', 'huevos camperos'],
          qty: 110,
          notes: 'Escalfado o revuelto',
        },
        { kw: ['aguacate'], qty: 40, notes: 'En láminas' },
      ],
      midMorning: [
        { kw: ['plátano'], qty: 100, notes: 'Pieza madura' },
        {
          kw: hasNuts ? ['frutos rojos'] : ['almendras'],
          qty: 20,
          notes: 'Al natural',
        },
      ],
      lunch: [
        {
          kw: isVegetarian
            ? ['garbanzos con espinacas', 'lentejas']
            : ['paella valenciana tradicional', 'arroz con pollo'],
          qty: 220,
          notes: 'Plato mediterráneo completo',
        },
        { kw: ['ensalada de lechuga y tomate'], qty: 120, notes: 'De acompañamiento' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Aliño' },
      ],
      snack: [
        {
          kw: hasLactose || isVegan
            ? ['bebida vegetal']
            : ['kéfir', 'yogur natural'],
          qty: 125,
          notes: 'Natural',
        },
        { kw: ['arándanos'], qty: 60, notes: 'Lavados' },
      ],
      dinner: [
        {
          kw: hasFish || isVegetarian
            ? ['pechuga de pollo', 'tofu firme']
            : ['merluza fresca', 'dorada fresca'],
          qty: 170,
          notes: 'Al vapor con perejil',
        },
        { kw: ['crema de calabaza', 'puré de verduras'], qty: 200, notes: 'Casera' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'En crudo' },
      ],
    },

    // Domingo (Día 7): Pauta dominical / Pollo asado con verduras / Tortilla
    {
      breakfast: [
        {
          kw: hasGluten
            ? ['tortitas de maíz', 'tortitas de arroz']
            : ['avena integral', 'copos de avena'],
          qty: 60,
          notes: 'Tortitas saludables de avena o porridge',
        },
        {
          kw: hasEgg || isVegan
            ? ['bebida de soja']
            : ['claras de huevo', 'huevo entero'],
          qty: 100,
          notes: 'Para las tortitas o revuelto',
        },
        { kw: ['arándanos', 'fresas'], qty: 80, notes: 'Fruta por encima' },
      ],
      midMorning: [
        { kw: ['manzana'], qty: 140, notes: 'Pieza fresca' },
        {
          kw: hasNuts ? ['tortitas de arroz'] : ['nueces'],
          qty: 20,
          notes: 'Al natural',
        },
      ],
      lunch: [
        {
          kw: isVegetarian
            ? ['tofu marinado', 'lentejas']
            : ['pollo entero asado sin piel', 'pechuga de pollo asada'],
          qty: 180,
          notes: 'Asado con hierbas provenzales',
        },
        {
          kw: isKeto ? ['pimientos asados'] : ['patata asada', 'patata'],
          qty: 160,
          notes: 'Asada al horno',
        },
        { kw: ['pimientos asados', 'verduras asadas'], qty: 140, notes: 'Al horno' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'Aliño' },
      ],
      snack: [
        {
          kw: hasLactose || isVegan
            ? ['bebida de avena']
            : ['yogur natural'],
          qty: 125,
          notes: 'Con canela',
        },
        {
          kw: hasNuts ? ['fresas'] : ['almendras'],
          qty: 20,
          notes: 'Crudas',
        },
      ],
      dinner: [
        {
          kw: hasEgg || isVegetarian
            ? ['tofu firme', 'pechuga de pavo']
            : ['huevo entero', 'huevos camperos'],
          qty: 110,
          notes: 'Tortilla francesa de dos huevos con calabacín',
        },
        { kw: ['calabacín', 'judías verdes cocidas'], qty: 160, notes: 'Salteado en la tortilla' },
        { kw: ['tomate de ensalada', 'ensalada verde'], qty: 120, notes: 'Con orégano' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Para cuajar y aliñar' },
      ],
    },
  ]

  const weeklySchedule: { [dayIndex: number]: GeneratedDayPlan } = {}

  for (let d = 0; d < 7; d++) {
    const tpl = weeklyTemplates[d]

    // Construct raw items with guaranteed allergen safety
    const bItems: GeneratedMealItem[] = tpl.breakfast.map((item, idx) => ({
      uid: `gen-b-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const mmItems: GeneratedMealItem[] = tpl.midMorning.map((item, idx) => ({
      uid: `gen-mm-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const lItems: GeneratedMealItem[] = tpl.lunch.map((item, idx) => ({
      uid: `gen-l-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const sItems: GeneratedMealItem[] = tpl.snack.map((item, idx) => ({
      uid: `gen-s-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const dItems: GeneratedMealItem[] = tpl.dinner.map((item, idx) => ({
      uid: `gen-d-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    // Calculate preliminary calories for this day
    const allDayItems = [...bItems, ...mmItems, ...lItems, ...sItems, ...dItems]
    let rawKcal = 0
    allDayItems.forEach((it) => {
      const food = allFoods.find((f) => f.id === it.foodId)
      if (food) rawKcal += food.calories * (it.quantityG / 100)
    })

    // Scale portions proportionally with realistic physiological boundaries per food type
    const target = patient.targetKcal || 2000
    const ratio = rawKcal > 0 ? target / rawKcal : 1.0

    // Realistic Spanish portion boundaries
    function scalePortions(items: GeneratedMealItem[]) {
      return items.map((it) => {
        const food = allFoods.find((f) => f.id === it.foodId)
        let newQty = it.quantityG
        if (food) {
          const norm = food.name.toLowerCase()
          const cat = (food.category || '').toLowerCase()

          // 1. Huevos enteros: unidades completas (~55g por huevo M)
          if (norm.includes('huevo entero') || norm.includes('huevos camperos') || norm.includes('tortilla francesa')) {
            newQty = Math.max(55, Math.min(220, Math.round((it.quantityG * ratio) / 55) * 55))
          }
          // 2. Aceites y grasas: dosis culinaria real (5g cucharadita, 10g-15g cucharada sopera)
          else if (cat.includes('aceite') || norm.includes('aceite')) {
            newQty = Math.max(5, Math.min(15, Math.round((it.quantityG * Math.min(1.2, Math.max(0.8, ratio))) / 2.5) * 2.5))
          }
          // 3. Pan de molde / tostadas: rebanadas estándar (~30g-35g)
          else if (norm.includes('pan de molde') || norm.includes('tostada') || norm.includes('biscote')) {
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
          // 7. Frutas enteras de mesa: pieza entera (100g a 180g)
          else if (cat.includes('fruta') && (norm.includes('manzana') || norm.includes('platano') || norm.includes('naranja') || norm.includes('pera') || norm.includes('kiwi'))) {
            newQty = Math.max(90, Math.min(180, Math.round((it.quantityG * ratio) / 10) * 10))
          }
          // 8. Lácteos envasados (yogur 125g/250g, leche 200ml)
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
          if (patient.isGLP1Treatment && newQty > 200) {
            newQty = Math.min(newQty, 200)
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

    // Ajuste fino clínico: absorbe la desviación producida por el acotado de raciones discretas
    // (ej. huevos en unidades enteras o pan en rebanadas) usando los carbohidratos/aceites base
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
    if (Math.abs(diffKcal) > 25) {
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
      while (Math.abs(diffKcal) > 25 && iterations < 15 && adjustable.length > 0) {
        iterations++
        for (const it of adjustable) {
          if (Math.abs(diffKcal) <= 25) break
          const food = allFoods.find((f) => f.id === it.foodId)!
          const isOil = (food.category || '').toLowerCase().includes('aceite') || food.name.toLowerCase().includes('aceite')
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
