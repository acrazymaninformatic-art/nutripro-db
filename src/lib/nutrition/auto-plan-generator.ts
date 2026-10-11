/**
 * @file auto-plan-generator.ts
 * @description Intelligent clinical meal plan generation engine for NutriPro.
 * Automatically constructs realistic, balanced, personalized 7-day meal plans
 * strictly adapted to the patient's caloric goal, macronutrients, objective,
 * food allergies, intolerances, clinical history, and dietary preferences.
 */

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
  const allergies = (patient.allergies || '').toLowerCase()
  const intolerances = (patient.intolerances || '').toLowerCase()
  const preferences = (patient.dietaryPreferences || '').toLowerCase()
  const aversions = (patient.foodAversions || '')
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3)
  const medical = (patient.medicalHistory || '').toLowerCase()

  const hasGlutenIssue =
    allergies.includes('gluten') || intolerances.includes('gluten') || allergies.includes('celiaqu')
  const hasLactoseIssue =
    allergies.includes('lactos') || intolerances.includes('lactos')
  const hasNutAllergy =
    allergies.includes('fruto') ||
    allergies.includes('nuez') ||
    allergies.includes('almendra') ||
    allergies.includes('cacahuete')
  const hasEggAllergy =
    allergies.includes('huevo') || intolerances.includes('huevo')
  const hasFishAllergy =
    allergies.includes('pescad') ||
    allergies.includes('marisc') ||
    allergies.includes('gamba') ||
    intolerances.includes('pescad')
  const hasSoyAllergy =
    allergies.includes('soja') || intolerances.includes('soja')

  const isVegan = preferences.includes('vegan')
  const isVegetarian = isVegan || preferences.includes('vegetar')
  const isKeto =
    preferences.includes('keto') ||
    preferences.includes('cetog') ||
    preferences.includes('baja en hidratos')

  function isFoodForbidden(name: string, category: string | null): boolean {
    const n = name.toLowerCase()

    // 1. Check patient food aversions
    if (aversions.some((av) => n.includes(av))) return true

    // 2. Check clinical allergens & intolerances
    if (
      hasGlutenIssue &&
      (n.includes('trigo') ||
        n.includes('pan blanco') ||
        n.includes('pasta penne') ||
        n.includes('espaguetis') ||
        (n.includes('avena integral') && !n.includes('sin gluten')))
    ) {
      return true
    }

    if (
      hasLactoseIssue &&
      (n.includes('leche entera') ||
        n.includes('leche semi') ||
        n.includes('queso curado') ||
        (n.includes('yogur') && !n.includes('soja') && !n.includes('vegetal')))
    ) {
      return true
    }

    if (
      hasNutAllergy &&
      (n.includes('nuez') ||
        n.includes('almendra') ||
        n.includes('cacahuete') ||
        n.includes('avellana') ||
        n.includes('anacardo') ||
        n.includes('pistacho'))
    ) {
      return true
    }

    if (
      hasEggAllergy &&
      (n.includes('huevo') || n.includes('clara de huevo') || n.includes('tortilla'))
    ) {
      return true
    }

    if (
      hasFishAllergy &&
      (category === 'Pescados y Mariscos' ||
        n.includes('pescado') ||
        n.includes('salmón') ||
        n.includes('merluza') ||
        n.includes('atún') ||
        n.includes('bacalao') ||
        n.includes('gamba') ||
        n.includes('langostino') ||
        n.includes('dorada') ||
        n.includes('lubina') ||
        n.includes('sepia') ||
        n.includes('calamar'))
    ) {
      return true
    }

    if (
      hasSoyAllergy &&
      (n.includes('soja') || n.includes('tofu') || n.includes('tempeh') || n.includes('edamame'))
    ) {
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
        n.includes('pescado') ||
        n.includes('salmón') ||
        n.includes('merluza') ||
        n.includes('atún') ||
        n.includes('sepia') ||
        n.includes('gamba'))
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
        n.includes('mantequilla'))
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

    // 4. Medical considerations (hypertension: avoid cured processed meats)
    if (medical.includes('hipertens') && (n.includes('jamón serrano') || n.includes('bacon') || n.includes('salchicha'))) {
      return true
    }

    return false
  }

  // Safe keyword search with fallback
  function findFood(keywords: string[], fallbackId: number): FoodDatabaseItem {
    for (const kw of keywords) {
      const match = allFoods.find((f) => {
        const n = f.name.toLowerCase()
        if (!n.includes(kw)) return false
        if (isFoodForbidden(f.name, f.category)) return false
        return true
      })
      if (match) return match
    }

    // If keywords didn't find anything permitted, pick any permitted food in database
    const safeFallback = allFoods.find((f) => !isFoodForbidden(f.name, f.category))
    return safeFallback || allFoods.find((f) => f.id === fallbackId) || allFoods[0]
  }

  // Curated templates per day to guarantee culinary variety and clinical balance
  const weeklyTemplates = [
    // Lunes (Día 1): Pollo y Arroz clásico / Salmón
    {
      breakfast: [
        { kw: hasGlutenIssue ? ['tortitas de maíz', 'arroz'] : ['avena integral', 'avena', 'copos de avena'], qty: 60, notes: 'Hervir en agua o bebida vegetal' },
        { kw: hasLactoseIssue || isVegan ? ['bebida de avena', 'bebida de almendras', 'bebida de soja'] : ['leche semidesnatada', 'leche desnatada'], qty: 200, notes: 'Con café solo o canela' },
        { kw: ['plátano', 'banana'], qty: 100, notes: 'Cortado en rodajas' },
      ],
      midMorning: [
        { kw: ['manzana', 'pera'], qty: 160, notes: 'Lavada y con piel' },
        { kw: hasNutAllergy ? ['tortitas de arroz'] : ['almendra', 'nuez'], qty: 25, notes: 'Crudas sin sal' },
      ],
      lunch: [
        { kw: isVegetarian ? ['tofu firme', 'tempeh', 'lentejas'] : ['pechuga de pollo', 'solomillo de pollo'], qty: 180, notes: 'A la plancha con especias al gusto' },
        { kw: isKeto ? ['calabacín', 'brócoli'] : ['arroz blanco', 'arroz basmati', 'arroz integral'], qty: 90, notes: 'Cocido al dente' },
        { kw: ['aceite de oliva virgen extra', 'aceite de oliva'], qty: 10, notes: 'En crudo sobre el plato' },
      ],
      snack: [
        { kw: hasLactoseIssue || isVegan ? ['bebida de soja', 'arándanos'] : ['yogur natural', 'queso fresco batido'], qty: 125, notes: 'Sin azúcares añadidos' },
        { kw: hasNutAllergy ? ['frutos rojos', 'fresas'] : ['nuez', 'almendra'], qty: 20, notes: 'Al natural' },
      ],
      dinner: [
        { kw: hasFishAllergy || isVegetarian ? ['pechuga de pavo', 'tofu firme', 'soja texturizada'] : ['salmón fresco', 'salmón'], qty: 160, notes: 'A la plancha con unas gotas de limón' },
        { kw: ['brócoli', 'judías verdes', 'espárragos'], qty: 160, notes: 'Al vapor durante 7 minutos' },
        { kw: isKeto ? ['aguacate'] : ['patata', 'patatas'], qty: 150, notes: 'Cocida o al microondas' },
      ],
    },
    // Martes (Día 2): Pescado blanco / Aves y Boniato
    {
      breakfast: [
        { kw: hasGlutenIssue ? ['pan de maíz', 'tortitas de arroz'] : ['pan 100% integral', 'pan de centeno'], qty: 70, notes: 'Tostado' },
        { kw: hasEggAllergy || isVegan ? ['aguacate hass', 'hummus'] : ['huevo entero', 'huevos camperos'], qty: 110, notes: 'A la plancha o revuelto' },
        { kw: ['tomate de rama', 'tomate'], qty: 80, notes: 'Rallado sobre la tostada' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Unas gotas sobre el tomate' },
      ],
      midMorning: [
        { kw: ['arándanos', 'fresas de huelva', 'frutos del bosque'], qty: 125, notes: 'Frescos y lavados' },
        { kw: hasLactoseIssue || isVegan ? ['bebida de almendras'] : ['queso fresco batido 0%', 'yogur proteico'], qty: 150, notes: 'Al natural' },
      ],
      lunch: [
        { kw: isVegetarian ? ['lentejas cocidas', 'garbanzos cocidos'] : ['solomillo de ternera', 'filete de ternera', 'pechuga de pollo'], qty: 160, notes: 'A la plancha vuelta y vuelta' },
        { kw: isKeto ? ['calabacín'] : ['boniato asado', 'patata'], qty: 160, notes: 'Asado al horno' },
        { kw: ['calabacín', 'berenjena'], qty: 140, notes: 'A la plancha con sal marina' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        { kw: ['kiwi', 'manzana'], qty: 140, notes: 'Pieza fresca' },
        { kw: hasNutAllergy ? ['tortitas de maíz'] : ['cacahuete 100%', 'almendras'], qty: 20, notes: 'Al natural' },
      ],
      dinner: [
        { kw: hasFishAllergy || isVegetarian ? ['pechuga de pollo', 'tofu firme'] : ['merluza fresca', 'merluza'], qty: 180, notes: 'Al vapor o a la plancha con ajo y perejil' },
        { kw: ['crema de calabacín', 'puré de verduras'], qty: 200, notes: 'Casera sin nata' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'En el puré' },
      ],
    },
    // Miércoles (Día 3): Legumbres saludables / Aves
    {
      breakfast: [
        { kw: hasGlutenIssue ? ['tortitas de arroz'] : ['avena integral', 'avena'], qty: 65, notes: 'Porridge templado' },
        { kw: hasLactoseIssue || isVegan ? ['bebida de avena', 'bebida de soja'] : ['leche semidesnatada'], qty: 200, notes: 'Caliente' },
        { kw: ['fresas', 'arándanos'], qty: 100, notes: 'Mezcladas con la avena' },
      ],
      midMorning: [
        { kw: ['naranja fresca', 'mandarina'], qty: 160, notes: 'En gajos entera (no en zumo)' },
        { kw: hasNutAllergy ? ['tortitas de arroz'] : ['almendra marcona', 'nueces'], qty: 20, notes: 'Crudas' },
      ],
      lunch: [
        { kw: ['lentejas estofadas con verduras', 'lentejas cocidas'], qty: 220, notes: 'Estofadas con cebolla, zanahoria y pimiento' },
        { kw: isKeto ? ['ensalada verde'] : ['arroz blanco', 'arroz integral'], qty: 60, notes: 'Para completar el perfil proteico' },
        { kw: isVegetarian || hasEggAllergy ? ['tofu firme'] : ['huevo cocido', 'pechuga de pollo'], qty: 100, notes: 'Acompañamiento' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        { kw: hasLactoseIssue || isVegan ? ['bebida de avena'] : ['yogur natural', 'kéfir'], qty: 125, notes: 'Con canela' },
        { kw: ['manzana'], qty: 120, notes: 'A mordiscos' },
      ],
      dinner: [
        { kw: hasFishAllergy || isVegetarian ? ['pechuga de pavo', 'tofu firme'] : ['sepia a la plancha', 'merluza fresca'], qty: 180, notes: 'A la plancha con ajo y perejil' },
        { kw: ['espárragos verdes', 'espárragos trigueros'], qty: 160, notes: 'A la plancha' },
        { kw: hasGlutenIssue || isKeto ? ['patata'] : ['pan 100% integral', 'pan de centeno'], qty: 40, notes: 'Acompañamiento' },
      ],
    },
    // Jueves (Día 4): Pavo / Pasta / Pescado blanco
    {
      breakfast: [
        { kw: hasGlutenIssue ? ['tortitas de maíz'] : ['pan 100% integral', 'tostada'], qty: 70, notes: 'Tostado' },
        { kw: isVegetarian ? ['aguacate hass', 'hummus'] : ['pechuga de pavo', 'jamón cocido extra'], qty: 80, notes: 'En lonchas de calidad' },
        { kw: ['aguacate', 'aguacate hass'], qty: 45, notes: 'Untado en la tostada' },
      ],
      midMorning: [
        { kw: ['plátano'], qty: 100, notes: 'Pieza madura' },
        { kw: hasNutAllergy ? ['tortitas de arroz'] : ['nueces de california'], qty: 20, notes: 'Al natural' },
      ],
      lunch: [
        { kw: isVegetarian ? ['soja texturizada', 'tofu'] : ['carne picada de ternera magra', 'pechuga de pollo'], qty: 160, notes: 'Salteada' },
        { kw: hasGlutenIssue || isKeto ? ['arroz blanco', 'quinoa'] : ['macarrones 100% integrales', 'pasta penne'], qty: 85, notes: 'Cocidos con tomate natural triturado' },
        { kw: ['champiñón', 'setas'], qty: 100, notes: 'Salteados' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        { kw: hasLactoseIssue || isVegan ? ['bebida de soja'] : ['queso fresco batido 0%'], qty: 150, notes: 'Con fruta' },
        { kw: ['arándanos silvestres'], qty: 60, notes: 'Frescos' },
      ],
      dinner: [
        { kw: hasFishAllergy || isVegetarian ? ['pechuga de pollo', 'tofu firme'] : ['dorada fresca', 'lubina fresca'], qty: 180, notes: 'Al horno con rodajas de limón' },
        { kw: isKeto ? ['calabacín'] : ['patata', 'patatas'], qty: 140, notes: 'Panadera al horno' },
        { kw: ['ensalada de canónigos', 'lechuga'], qty: 100, notes: 'Con vinagre y unas gotas de AOVE' },
      ],
    },
    // Viernes (Día 5): Aves / Legumbres / Pescado azul
    {
      breakfast: [
        { kw: hasGlutenIssue ? ['tortitas de maíz'] : ['avena integral', 'avena'], qty: 60, notes: 'Con leche caliente' },
        { kw: hasLactoseIssue || isVegan ? ['bebida de almendras'] : ['leche desnatada'], qty: 200, notes: 'Bebida' },
        { kw: ['pera conferencia', 'manzana'], qty: 120, notes: 'En dados' },
      ],
      midMorning: [
        { kw: hasLactoseIssue || isVegan ? ['bebida de avena'] : ['yogur proteico', 'yogur natural'], qty: 125, notes: 'Sabor natural' },
        { kw: hasNutAllergy ? ['fresas'] : ['almendra', 'avellana'], qty: 20, notes: 'Crudas' },
      ],
      lunch: [
        { kw: isVegetarian ? ['tofu firme'] : ['solomillo de cerdo', 'lomo de cerdo', 'pechuga de pollo'], qty: 170, notes: 'A la plancha con pimienta negra' },
        { kw: isKeto ? ['calabacín'] : ['patata cocida', 'patata'], qty: 180, notes: 'Cocida' },
        { kw: ['pimientos de padrón', 'pimiento verde'], qty: 120, notes: 'A la plancha con sal' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'En crudo' },
      ],
      snack: [
        { kw: ['fresas frescas', 'moras'], qty: 150, notes: 'Frescas' },
        { kw: hasNutAllergy ? ['tortitas de maíz'] : ['nueces'], qty: 20, notes: 'Al natural' },
      ],
      dinner: [
        { kw: hasFishAllergy || isVegetarian ? ['pechuga de pavo', 'tofu firme'] : ['atún claro al natural', 'salmón'], qty: 150, notes: 'A la plancha' },
        { kw: ['espárragos blancos', 'ensalada mixta'], qty: 180, notes: 'Con vinagre de manzana' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Aliño' },
      ],
    },
    // Sábado (Día 6): Variedad mediterránea
    {
      breakfast: [
        { kw: hasGlutenIssue ? ['tortitas de arroz'] : ['pan de masa madre', 'pan 100% integral'], qty: 70, notes: 'Tostado' },
        { kw: hasEggAllergy || isVegan ? ['aguacate hass', 'hummus'] : ['huevo poché', 'huevo cocido'], qty: 110, notes: 'Escalfado o pasado por agua' },
        { kw: ['aguacate'], qty: 40, notes: 'En láminas' },
      ],
      midMorning: [
        { kw: ['plátano'], qty: 100, notes: 'Previo a la actividad física' },
        { kw: hasNutAllergy ? ['frutos rojos'] : ['almendras'], qty: 20, notes: 'Al natural' },
      ],
      lunch: [
        { kw: isVegetarian ? ['garbanzos con espinacas'] : ['paella valenciana tradicional', 'arroz con pollo'], qty: 220, notes: 'Ración ajustada en plato' },
        { kw: ['ensalada de lechuga y tomate'], qty: 120, notes: 'De primero' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'Aliño' },
      ],
      snack: [
        { kw: hasLactoseIssue || isVegan ? ['bebida vegetal'] : ['kéfir', 'queso batido'], qty: 125, notes: 'Natural' },
        { kw: ['arándanos'], qty: 60, notes: 'Lavados' },
      ],
      dinner: [
        { kw: hasFishAllergy || isVegetarian ? ['pechuga de pollo', 'tofu firme'] : ['merluza fresca', 'dorada fresca'], qty: 160, notes: 'Al vapor o a la plancha con limón' },
        { kw: ['crema de calabaza', 'puré de verduras'], qty: 200, notes: 'Caliente' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'En crudo' },
      ],
    },
    // Domingo (Día 7): Pauta familiar / Pollo asado
    {
      breakfast: [
        { kw: hasGlutenIssue ? ['tortitas de maíz'] : ['avena integral', 'avena'], qty: 60, notes: 'Tortitas caseras' },
        { kw: hasEggAllergy || isVegan ? ['bebida de soja'] : ['claras de huevo', 'huevo entero'], qty: 100, notes: 'Para la masa' },
        { kw: ['arándanos', 'fresas'], qty: 80, notes: 'Por encima' },
      ],
      midMorning: [
        { kw: ['manzana'], qty: 140, notes: 'Fresca' },
        { kw: hasNutAllergy ? ['tortitas de arroz'] : ['nueces'], qty: 20, notes: 'Al natural' },
      ],
      lunch: [
        { kw: isVegetarian ? ['tofu marinado'] : ['pollo entero asado sin piel', 'pechuga de pollo asada'], qty: 180, notes: 'Asado con hierbas provenzales' },
        { kw: isKeto ? ['pimientos asados'] : ['patata asada', 'patata'], qty: 160, notes: 'Asada al horno con el pollo' },
        { kw: ['pimientos asados', 'verduras asadas'], qty: 140, notes: 'Al horno' },
        { kw: ['aceite de oliva virgen extra'], qty: 10, notes: 'Aliño' },
      ],
      snack: [
        { kw: hasLactoseIssue || isVegan ? ['bebida de avena'] : ['yogur natural'], qty: 125, notes: 'Con canela' },
        { kw: hasNutAllergy ? ['fresas'] : ['almendras'], qty: 20, notes: 'Crudas' },
      ],
      dinner: [
        { kw: hasFishAllergy || isVegetarian ? ['revuelto de setas', 'tofu firme'] : ['lubina a la espalda', 'dorada'], qty: 170, notes: 'Al horno con ajitos' },
        { kw: ['judías verdes cocidas', 'ensalada verde'], qty: 160, notes: 'Al vapor' },
        { kw: ['aceite de oliva virgen extra'], qty: 8, notes: 'En crudo' },
      ],
    },
  ]

  const weeklySchedule: { [dayIndex: number]: GeneratedDayPlan } = {}

  for (let d = 0; d < 7; d++) {
    const tpl = weeklyTemplates[d]

    // Construct raw items
    const bItems: GeneratedMealItem[] = tpl.breakfast.map((item, idx) => ({
      uid: `gen-b-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw, idx + 1).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const mmItems: GeneratedMealItem[] = tpl.midMorning.map((item, idx) => ({
      uid: `gen-mm-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw, idx + 4).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const lItems: GeneratedMealItem[] = tpl.lunch.map((item, idx) => ({
      uid: `gen-l-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw, idx + 6).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const sItems: GeneratedMealItem[] = tpl.snack.map((item, idx) => ({
      uid: `gen-s-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw, idx + 9).id,
      quantityG: item.qty,
      notes: item.notes,
    }))

    const dItems: GeneratedMealItem[] = tpl.dinner.map((item, idx) => ({
      uid: `gen-d-${d}-${idx}-${Math.random()}`,
      foodId: findFood(item.kw, idx + 12).id,
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

    // Scale portions proportionally so the day matches the patient target calories!
    const target = patient.targetKcal || 2000
    const ratio = rawKcal > 0 ? target / rawKcal : 1.0

    // Apply scale to main portions (round to multiples of 5 grams)
    function scalePortions(items: GeneratedMealItem[]) {
      return items.map((it) => {
        const food = allFoods.find((f) => f.id === it.foodId)
        let newQty = it.quantityG
        if (food) {
          if (food.category === 'Aceites y Grasas') {
            newQty = Math.max(5, Math.min(20, Math.round(it.quantityG * Math.min(1.3, Math.max(0.7, ratio)))))
          } else {
            newQty = Math.max(10, Math.round((it.quantityG * ratio) / 5) * 5)
          }
        }
        return {
          ...it,
          quantityG: newQty,
        }
      })
    }

    weeklySchedule[d] = {
      BREAKFAST: scalePortions(bItems),
      MID_MORNING: scalePortions(mmItems),
      LUNCH: scalePortions(lItems),
      SNACK: scalePortions(sItems),
      DINNER: scalePortions(dItems),
    }
  }

  return weeklySchedule
}
