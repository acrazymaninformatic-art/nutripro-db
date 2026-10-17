/**
 * @file clinical-templates.ts
 * @description Plantillas Dietéticas Clínicas de 1 Clic con escalado automático proporcional
 * para EVSoftware (Pérdida de Grasa 1.500 kcal, SOP / Resistencia a la Insulina,
 * Antiinflamatoria FODMAP, Hipertrofia 2.500 kcal, Mediterránea Cardio-Protectora).
 */

import { checkPatientAllergenConflict } from './allergens'

export interface ClinicalDietTemplate {
  id: string
  name: string
  badge: string
  category: string
  baseCalories: number
  description: string
  clinicalIndications: string
  macroRatio: { proteinPct: number; carbsPct: number; fatPct: number }
  keyFeatures: string[]
  recommendedWaterLiters: number
  // Daily structure (each meal has archetypal items with base quantities)
  daysStructure: {
    BREAKFAST: Array<{ foodQuery: string; baseG: number; notes: string }>
    MID_MORNING: Array<{ foodQuery: string; baseG: number; notes: string }>
    LUNCH: Array<{ foodQuery: string; baseG: number; notes: string }>
    SNACK: Array<{ foodQuery: string; baseG: number; notes: string }>
    DINNER: Array<{ foodQuery: string; baseG: number; notes: string }>
  }[]
}

export const CLINICAL_TEMPLATES: ClinicalDietTemplate[] = [
  {
    id: 'FAT_LOSS_1500',
    name: 'Pérdida de Grasa Equilibrada',
    badge: '1.500 kcal Base',
    category: 'Composición Corporal',
    baseCalories: 1500,
    description: 'Protocolo de déficit calórico moderado con alto índice de saciedad, 1.8-2.0 g/kg de proteína y alta densidad de micronutrientes y fibra vegetal.',
    clinicalIndications: 'Sobrepeso, obesidad, control de apetito y preservación de masa muscular magra.',
    macroRatio: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
    keyFeatures: [
      'Alta saciedad gástrica con verduras de baja densidad calórica',
      'Proteína magra en todas las tomas (pescados blancos, aves, huevos, skyr)',
      'Grasas monoinsaturadas cardiosaludables (AOVE y frutos secos controlados)',
      'Hidratos complejos de lenta asimilación (avena, patata cocida, legumbres)',
    ],
    recommendedWaterLiters: 2.5,
    daysStructure: [
      {
        BREAKFAST: [
          { foodQuery: 'avena', baseG: 45, notes: 'Copos suaves cocidos o en porridge con canela' },
          { foodQuery: 'skyr', baseG: 150, notes: 'Yogur skyr o queso fresco batido 0%' },
          { foodQuery: 'arandanos', baseG: 60, notes: 'Ricos en antocianinas y antioxidantes' },
          { foodQuery: 'nueces', baseG: 15, notes: 'Ácidos grasos esenciales omega-3' },
        ],
        MID_MORNING: [
          { foodQuery: 'manzana', baseG: 160, notes: 'Con piel bien lavada (fibra pectina)' },
          { foodQuery: 'almendras', baseG: 15, notes: 'Crudas sin sal' },
        ],
        LUNCH: [
          { foodQuery: 'pechuga de pollo', baseG: 140, notes: 'A la plancha con hierbas provenzales' },
          { foodQuery: 'arroz integral', baseG: 50, notes: 'Peso en seco (o 130g cocido)' },
          { foodQuery: 'brocoli', baseG: 180, notes: 'Al vapor al dente' },
          { foodQuery: 'aceite de oliva', baseG: 10, notes: '1 cucharada sopera en crudo' },
        ],
        SNACK: [
          { foodQuery: 'queso fresco batido', baseG: 150, notes: '0% materia grasa' },
          { foodQuery: 'fresas', baseG: 100, notes: 'Fruta baja en calorías y rica en vitamina C' },
        ],
        DINNER: [
          { foodQuery: 'merluza', baseG: 160, notes: 'Al vapor o a la plancha con limón' },
          { foodQuery: 'calabacin', baseG: 180, notes: 'Salteado o crema ligera' },
          { foodQuery: 'patata', baseG: 120, notes: 'Cocida o al vapor (almidón resistente)' },
          { foodQuery: 'aceite de oliva', baseG: 10, notes: '1 cucharada sopera para aderezar' },
        ],
      },
      {
        BREAKFAST: [
          { foodQuery: 'huevo', baseG: 110, notes: '2 huevos revueltos o a la plancha' },
          { foodQuery: 'pan integral', baseG: 50, notes: '1 rebanada de masa madre integral tostada' },
          { foodQuery: 'tomate', baseG: 60, notes: 'Rallado natural' },
          { foodQuery: 'aceite de oliva', baseG: 5, notes: '1 cucharadita para la tostada' },
        ],
        MID_MORNING: [
          { foodQuery: 'pera', baseG: 160, notes: 'Pieza de fruta de temporada' },
          { foodQuery: 'nueces', baseG: 15, notes: 'Ricas en ALA' },
        ],
        LUNCH: [
          { foodQuery: 'lentejas', baseG: 60, notes: 'En seco estofadas con verduras (pimiento, cebolla, zanahoria)' },
          { foodQuery: 'zanahoria', baseG: 80, notes: 'En el estofado' },
          { foodQuery: 'espinacas', baseG: 120, notes: 'Hojas tiernas' },
          { foodQuery: 'aceite de oliva', baseG: 10, notes: '1 cucharada en la cocción' },
        ],
        SNACK: [
          { foodQuery: 'yogur griego', baseG: 125, notes: 'Natural sin azúcares añadidos' },
          { foodQuery: 'kiwi', baseG: 90, notes: '1 unidad madura' },
        ],
        DINNER: [
          { foodQuery: 'salmon', baseG: 130, notes: 'Al horno con limón y eneldo' },
          { foodQuery: 'esparragos', baseG: 160, notes: 'Verdes a la plancha' },
          { foodQuery: 'ensalada', baseG: 100, notes: 'Hojas verdes variadas' },
          { foodQuery: 'aceite de oliva', baseG: 5, notes: '1 cucharadita de AOVE' },
        ],
      },
    ],
  },
  {
    id: 'PCOS_INSULIN_RESISTANCE',
    name: 'SOP & Resistencia a la Insulina',
    badge: 'Bajo IG / Anti-Picos',
    category: 'Endocrinología & Salud Femenina',
    baseCalories: 1600,
    description: 'Protocolo de bajo impacto glucémico, rico en inositol, canela, magnesio y grasas monoinsaturadas. Diseñado para mitigar la hiperinsulinemia compensatoria.',
    clinicalIndications: 'Síndrome de Ovario Poliquístico (SOP), hiperinsulinismo, prediabetes y acantosis nigricans.',
    macroRatio: { proteinPct: 28, carbsPct: 35, fatPct: 37 },
    keyFeatures: [
      'Eliminación de carbohidratos refinados y azúcares simples',
      'Priorización de fibra soluble (semillas de chía, lino, legumbres) para retardar el vaciado gástrico',
      'Grasas saludables ricas en Omega-3 para atenuar la inflamación ovárica y sistémica',
      'Inclusión de canela de Ceylán y frutos rojos por sus fitoquímicos sensibilizadores de insulina',
    ],
    recommendedWaterLiters: 2.5,
    daysStructure: [
      {
        BREAKFAST: [
          { foodQuery: 'huevo', baseG: 110, notes: 'Huevos de gallinas camperas (colina y proteína)' },
          { foodQuery: 'aguacate', baseG: 45, notes: 'Grasas monoinsaturadas y fibra saciante' },
          { foodQuery: 'pan de centeno', baseG: 45, notes: 'Centeno o grano entero 100% (bajo índice glucémico)' },
          { foodQuery: 'chia', baseG: 10, notes: 'Semillas hidratadas para reducir absorción de glucosa' },
        ],
        MID_MORNING: [
          { foodQuery: 'yogur griego', baseG: 125, notes: 'Natural sin azúcar con canela de Ceylán' },
          { foodQuery: 'frambuesas', baseG: 60, notes: 'Bajo contenido glucémico y alta fibra' },
        ],
        LUNCH: [
          { foodQuery: 'pechuga de pavo', baseG: 140, notes: 'Filete magro marinado con cúrcuma' },
          { foodQuery: 'quinoa', baseG: 45, notes: 'Peso en seco (cereal de bajo índice glucémico y aminoácidos completos)' },
          { foodQuery: 'calabacin', baseG: 150, notes: 'Asado con hierbas' },
          { foodQuery: 'aceite de oliva', baseG: 12, notes: 'AOVE virgen extra' },
        ],
        SNACK: [
          { foodQuery: 'nueces', baseG: 20, notes: 'Ricas en ácidos grasos poliinsaturados y magnesio' },
          { foodQuery: 'infusion', baseG: 200, notes: 'Té verde o infusión de hierbabuena/canela' },
        ],
        DINNER: [
          { foodQuery: 'lubina', baseG: 150, notes: 'A la espalda con ajo laminado' },
          { foodQuery: 'judias verdes', baseG: 160, notes: 'Al vapor' },
          { foodQuery: 'tomate', baseG: 100, notes: 'Con orégano y sal marina' },
          { foodQuery: 'aceite de oliva', baseG: 10, notes: '1 cucharada para aliño' },
        ],
      },
    ],
  },
  {
    id: 'LOW_FODMAP_ANTIINFLAMMATORY',
    name: 'Antiinflamatoria & Protocolo FODMAP',
    badge: 'Salud Digestiva',
    category: 'Gastroenterología Clínica',
    baseCalories: 1650,
    description: 'Protocolo clínico restringido en carbohidratos fermentables de cadena corta para remitir distensión abdominal, disbiosis, dolor y permeabilidad intestinal.',
    clinicalIndications: 'Síndrome de Intestino Irritable (SII), SIBO en fase de erradicación, distensión recurrente y permeabilidad intestinal.',
    macroRatio: { proteinPct: 25, carbsPct: 45, fatPct: 30 },
    keyFeatures: [
      'Exclusión estricta de cebolla, ajo, trigo, legumbres no procesadas y lácteos con lactosa',
      'Verduras toleradas de baja fermentación (calabacín pelado, zanahoria, espinaca tierna, pepino)',
      'Frutas seguras en porciones controladas (plátano no muy maduro, fresas, kiwi)',
      'Especias carminativas y antiinflamatorias (jengibre, cúrcuma, orégano)',
    ],
    recommendedWaterLiters: 2.2,
    daysStructure: [
      {
        BREAKFAST: [
          { foodQuery: 'avena', baseG: 45, notes: 'Avena certificada sin gluten o copos finos tolerados' },
          { foodQuery: 'bebida de almendras', baseG: 180, notes: 'Sin azúcares añadidos ni aditivos espesantes' },
          { foodQuery: 'platano', baseG: 80, notes: 'Plátano verde o ligeramente maduro (bajo en fructanos)' },
          { foodQuery: 'chia', baseG: 10, notes: 'Semillas mucilaginosas protectoras de mucosa' },
        ],
        MID_MORNING: [
          { foodQuery: 'fresas', baseG: 120, notes: 'Fruta segura baja en FODMAPs' },
          { foodQuery: 'nueces', baseG: 15, notes: 'Nueces de nogal en porción segura' },
        ],
        LUNCH: [
          { foodQuery: 'pechuga de pollo', baseG: 140, notes: 'Cocinado con aceite infusionado con ajo (sin trozos) y jengibre' },
          { foodQuery: 'arroz blanco', baseG: 60, notes: 'En seco (excelente digestibilidad y mínima fermentación cecal)' },
          { foodQuery: 'zanahoria', baseG: 150, notes: 'Cocida o al vapor (muy baja en fermentables)' },
          { foodQuery: 'aceite de oliva', baseG: 12, notes: 'AOVE virgen extra' },
        ],
        SNACK: [
          { foodQuery: 'tortitas de arroz', baseG: 25, notes: '2 tortitas 100% arroz' },
          { foodQuery: 'pavo', baseG: 50, notes: 'Fiambre de pechuga de pavo >90% carne o huevo cocido' },
        ],
        DINNER: [
          { foodQuery: 'merluza', baseG: 160, notes: 'O bacalao al vapor con patata y calabacín pelado' },
          { foodQuery: 'calabacin', baseG: 150, notes: 'Pelado y cocido al dente' },
          { foodQuery: 'patata', baseG: 130, notes: 'Cocida al vapor' },
          { foodQuery: 'aceite de oliva', baseG: 10, notes: 'AOVE para aderezar' },
        ],
      },
    ],
  },
  {
    id: 'HYPERTROPHY_PERFORMANCE',
    name: 'Hipertrofia & Rendimiento Deportivo',
    badge: '2.500 kcal Base',
    category: 'Nutrición Deportiva & Fuerza',
    baseCalories: 2500,
    description: 'Superávit calórico controlado (+250-400 kcal) con reparto proteico óptimo (2.0-2.2 g/kg) y elevado volumen de glucógeno muscular para entrenamientos de sobrecarga progresiva.',
    clinicalIndications: 'Ganancia de masa muscular magra, atletas de fuerza e hipertrofia, deportes de alta demanda energética.',
    macroRatio: { proteinPct: 25, carbsPct: 50, fatPct: 25 },
    keyFeatures: [
      'Timing de carbohidratos perientrenamiento (pre y post-workout de alta asimilación)',
      'Distribución de 30-40g de leucina/proteína por comida cada 3-4 horas',
      'Densidad calórica equilibrada con frutos secos, arroz y avena para evitar pesadez gástrica',
      'Alta concentración de electrolitos y agua para reposición intramuscular',
    ],
    recommendedWaterLiters: 3.2,
    daysStructure: [
      {
        BREAKFAST: [
          { foodQuery: 'avena', baseG: 80, notes: 'Copos suaves o harina de avena micronizada' },
          { foodQuery: 'leche semidesnatada', baseG: 200, notes: 'O bebida vegetal enriquecida' },
          { foodQuery: 'huevo', baseG: 120, notes: '2 huevos enteros + claras' },
          { foodQuery: 'platano', baseG: 100, notes: '1 unidad madura' },
          { foodQuery: 'mantequilla de cacahuete', baseG: 20, notes: '100% cacahuete tostado sin azúcar' },
        ],
        MID_MORNING: [
          { foodQuery: 'pan integral', baseG: 80, notes: '2 rebanadas de pan de masa madre' },
          { foodQuery: 'atun', baseG: 100, notes: 'Atún al natural escurrido' },
          { foodQuery: 'tomate', baseG: 50, notes: 'En rodajas' },
          { foodQuery: 'aceite de oliva', baseG: 10, notes: '1 cucharada para la tostada' },
        ],
        LUNCH: [
          { foodQuery: 'pechuga de pollo', baseG: 180, notes: 'A la plancha o asada con especias' },
          { foodQuery: 'arroz blanco', baseG: 100, notes: 'Peso en seco (250g cocido) para recarga de glucógeno' },
          { foodQuery: 'judias verdes', baseG: 120, notes: 'O ensalada mixta de acompañamiento' },
          { foodQuery: 'aceite de oliva', baseG: 15, notes: '1.5 cucharadas de AOVE virgen extra' },
        ],
        SNACK: [
          { foodQuery: 'skyr', baseG: 200, notes: 'Yogur proteico skyr o queso batido' },
          { foodQuery: 'avena', baseG: 40, notes: 'O granola natural sin azúcares' },
          { foodQuery: 'arandanos', baseG: 80, notes: 'Fruta fresca para modulación oxidativa' },
          { foodQuery: 'nueces', baseG: 20, notes: 'Frutos secos' },
        ],
        DINNER: [
          { foodQuery: 'salmon', baseG: 170, notes: 'Lomo de salmón rico en Omega-3 y creatina' },
          { foodQuery: 'patata', baseG: 250, notes: 'Asada al horno o cocida' },
          { foodQuery: 'esparragos', baseG: 150, notes: 'Verdes a la plancha' },
          { foodQuery: 'aceite de oliva', baseG: 10, notes: '1 cucharada de aderezo' },
        ],
      },
    ],
  },
  {
    id: 'MEDITERRANEAN_CARDIO',
    name: 'Mediterránea Cardio-Protectora',
    badge: '1.800 kcal Base',
    category: 'Salud Cardiovascular & Longevidad',
    baseCalories: 1800,
    description: 'Patrón dietético mediterráneo auténtico basado en el estudio PREDIMED: alto consumo de AOVE, legumbres, pescados grasos, verduras y frutas frescas.',
    clinicalIndications: 'Hipercolesterolemia, hipertensión arterial, prevención cardiovascular primaria y secundaria.',
    macroRatio: { proteinPct: 22, carbsPct: 48, fatPct: 30 },
    keyFeatures: [
      'Predominio absoluto de ácidos grasos monoinsaturados (ácido oleico del AOVE)',
      'Elevada presencia de fitoesteroles, polifenoles y flavonoides',
      'Pescados azules pequeños ricos en EPA/DHA de bajo contenido en mercurio',
      'Bajo contenido en sodio y nulo en grasas trans/procesados',
    ],
    recommendedWaterLiters: 2.5,
    daysStructure: [
      {
        BREAKFAST: [
          { foodQuery: 'pan integral', baseG: 60, notes: 'Pan de masa madre tostado' },
          { foodQuery: 'tomate', baseG: 80, notes: 'Rallado natural con ajo' },
          { foodQuery: 'aceite de oliva', baseG: 15, notes: 'AOVE virgen extra de extracción en frío' },
          { foodQuery: 'huevo', baseG: 55, notes: '1 huevo poché o cocido' },
        ],
        MID_MORNING: [
          { foodQuery: 'naranja', baseG: 180, notes: 'Pieza de fruta entera (no en zumo)' },
          { foodQuery: 'nueces', baseG: 20, notes: 'Ricas en ácido alfa-linolénico (ALA)' },
        ],
        LUNCH: [
          { foodQuery: 'garbanzos', baseG: 70, notes: 'Peso en seco (o 180g cocidos) con espinacas y pimentón' },
          { foodQuery: 'espinacas', baseG: 150, notes: 'Hojas frescas' },
          { foodQuery: 'bacalao', baseG: 100, notes: 'Desmigado en el potaje' },
          { foodQuery: 'aceite de oliva', baseG: 12, notes: '1 cucharada sopera en el sofrito' },
        ],
        SNACK: [
          { foodQuery: 'yogur natural', baseG: 125, notes: 'Fermentado natural sin azúcar' },
          { foodQuery: 'manzana', baseG: 140, notes: 'Con piel' },
        ],
        DINNER: [
          { foodQuery: 'sardina', baseG: 140, notes: 'O caballa/lubina a la plancha' },
          { foodQuery: 'ensalada', baseG: 150, notes: 'Tomate, pepino, cebolla morada y lechuga' },
          { foodQuery: 'patata', baseG: 120, notes: 'Cocida con piel' },
          { foodQuery: 'aceite de oliva', baseG: 12, notes: 'AOVE virgen extra' },
        ],
      },
    ],
  },
]

/**
 * Applies a clinical template to the weekly grid, scaling all quantities proportionally
 * to match the patient's exact targetKcal.
 */
export function buildPlanFromClinicalTemplate(
  templateId: string,
  targetKcal: number,
  allFoods: Array<{ id: number; name: string; category: string | null }>,
  patient?: { allergies?: string | null; intolerances?: string | null; firstName?: string; lastName?: string } | null
): { [mealType: string]: { [dayIndex: number]: Array<{ uid: string; foodId: number; quantityG: number; notes: string }> } } {
  const template = CLINICAL_TEMPLATES.find((t) => t.id === templateId) || CLINICAL_TEMPLATES[0]

  // Calculate scaling factor with minimum of 0.6 and max of 2.2 for safety
  const rawRatio = targetKcal / template.baseCalories
  const scaleRatio = Math.max(0.65, Math.min(2.2, rawRatio))

  const grid: Record<string, Record<number, Array<{ uid: string; foodId: number; quantityG: number; notes: string }>>> = {
    BREAKFAST: {},
    MID_MORNING: {},
    LUNCH: {},
    SNACK: {},
    DINNER: {},
  }

  // Pre-initialize grid
  for (const m of ['BREAKFAST', 'MID_MORNING', 'LUNCH', 'SNACK', 'DINNER']) {
    for (let d = 0; d < 7; d++) {
      grid[m][d] = []
    }
  }

  // Helper to find best matching food in database with strict allergen checking
  function findFood(query: string): number | null {
    let q = query.toLowerCase().trim()

    // Automatic safe substitution mapping if patient has allergies
    if (patient?.allergies || patient?.intolerances) {
      const allNorm = ((patient.allergies || '') + ' ' + (patient.intolerances || '')).toLowerCase()
      if ((allNorm.includes('gluten') || allNorm.includes('celiaqu')) && (q.includes('pan') || q.includes('avena') || q.includes('pasta'))) {
        q = 'tortitas de arroz'
      }
      if ((allNorm.includes('lactos') || allNorm.includes('leche')) && (q.includes('yogur') || q.includes('skyr') || q.includes('queso') || q.includes('leche'))) {
        q = 'bebida de avena'
      }
      if (allNorm.includes('fruto') && (q.includes('nuez') || q.includes('almendra'))) {
        q = 'frutas'
      }
    }

    // Exact or contains match, strictly filtering out any allergen conflict
    const matches = allFoods.filter((f) => {
      if (!f.name.toLowerCase().includes(q)) return false
      if (patient) {
        const conflict = checkPatientAllergenConflict(f, patient)
        if (conflict) return false
      }
      return true
    })

    if (matches.length > 0) return matches[0].id

    // Fallback safe food
    const safeFallback = allFoods.find((f) => {
      if (patient) {
        const conflict = checkPatientAllergenConflict(f, patient)
        if (conflict) return false
      }
      return true
    })

    return safeFallback?.id || allFoods[0]?.id || 1
  }

  const numTemplates = template.daysStructure.length

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    // Pick daily structure (cycles through available template variations)
    const daySpec = template.daysStructure[dayIndex % numTemplates]

    const mealKeys: Array<'BREAKFAST' | 'MID_MORNING' | 'LUNCH' | 'SNACK' | 'DINNER'> = [
      'BREAKFAST',
      'MID_MORNING',
      'LUNCH',
      'SNACK',
      'DINNER',
    ]

    for (const mealKey of mealKeys) {
      const itemsSpec = daySpec[mealKey] || []
      const mealItems: Array<{ uid: string; foodId: number; quantityG: number; notes: string }> = []

      for (const spec of itemsSpec) {
        const foodId = findFood(spec.foodQuery)
        if (!foodId) continue

        // Scale proportionally and round to nearest 5g (or 1g if small like oils)
        let scaledG = spec.baseG * scaleRatio
        if (scaledG <= 15) {
          scaledG = Math.max(3, Math.round(scaledG))
        } else {
          scaledG = Math.max(10, Math.round(scaledG / 5) * 5)
        }

        mealItems.push({
          uid: `${mealKey}-${dayIndex}-${foodId}-${Math.random().toString(36).substring(2, 7)}`,
          foodId,
          quantityG: scaledG,
          notes: spec.notes,
        })
      }

      grid[mealKey][dayIndex] = mealItems
    }
  }

  return grid
}
