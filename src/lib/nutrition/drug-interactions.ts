/**
 * @file drug-interactions.ts
 * @description Motor clínico de detección de interacciones Fármaco-Nutriente y Fármaco-Alimento
 * para consulta nutricional profesional (estilo Gajuz y DietoPRO).
 */

export interface DrugInteractionAlert {
  id: string
  drugName: string
  drugCategory: string
  severity: 'ALTA' | 'MEDIA' | 'INFORMATIVA'
  title: string
  mechanism: string
  affectedFoods: string[]
  clinicalRecommendation: string
  iconType: 'danger' | 'warning' | 'info'
}

interface DrugRule {
  keywords: string[]
  drugName: string
  drugCategory: string
  severity: 'ALTA' | 'MEDIA' | 'INFORMATIVA'
  title: string
  mechanism: string
  affectedFoods: string[]
  clinicalRecommendation: string
  iconType: 'danger' | 'warning' | 'info'
}

export const CLINICAL_DRUG_RULES: DrugRule[] = [
  {
    keywords: ['sintrom', 'warfarina', 'acenocumarol', 'anticoagulante'],
    drugName: 'Sintrom / Acenocumarol / Warfarina',
    drugCategory: 'Anticoagulante Oral (Antagonista Vitamina K)',
    severity: 'ALTA',
    title: 'Interacción con Vitamina K (Riesgo de trombosis o sangrado)',
    mechanism: 'La ingesta fluctuante de Vitamina K antagoniza directamente el efecto del fármaco alterando el INR objetivo.',
    affectedFoods: ['Espinacas', 'Acelgas', 'Brócoli', 'Col kale', 'Té verde', 'Endivias', 'Perejil concentrado'],
    clinicalRecommendation: 'NO es necesario suprimir las verduras de hoja verde, pero es CRÍTICO mantener un consumo constante y regular semana a semana sin picos ni restricciones bruscas.',
    iconType: 'danger',
  },
  {
    keywords: ['eutirox', 'levotiroxina', 'tiroxina', 'dexnon', 'tiroides'],
    drugName: 'Levotiroxina (Eutirox / Dexnon)',
    drugCategory: 'Hormona Tiroidea Sintética',
    severity: 'ALTA',
    title: 'Quelación y Reducción de Absorción Gastrointestinal',
    mechanism: 'El calcio, el hierro, el café y la soja compiten y reducen drásticamente la biodisponibilidad de la levotiroxina.',
    affectedFoods: ['Café solo o con leche', 'Leche y yogures (calcio)', 'Bebida de soja y tofu', 'Salvado de trigo / Fibra concentrada', 'Suplementos de hierro o calcio'],
    clinicalRecommendation: 'Tomar la levotiroxina estrictamente en ayunas con agua corriente y esperar un mínimo de 30 a 60 minutos antes de desayunar, tomar café o ingerir cualquier lácteo o suplemento.',
    iconType: 'danger',
  },
  {
    keywords: ['metformina', 'dianben', 'stagid', 'janumet'],
    drugName: 'Metformina (Dianben)',
    drugCategory: 'Antidiabético Biguanida',
    severity: 'MEDIA',
    title: 'Déficit de Vitamina B12 y Riesgo de Acidosis Láctica',
    mechanism: 'El tratamiento crónico disminuye la absorción ileal de vitamina B12 en un 30%. El alcohol potencia el riesgo de acidosis láctica.',
    affectedFoods: ['Bebidas alcohólicas', 'Alimentos con déficit de Vitamina B12'],
    clinicalRecommendation: 'Monitorizar analíticamente la Vitamina B12 y folatos cada 6-12 meses. Evitar totalmente el alcohol. Tomar el fármaco junto o después de las comidas para minimizar molestias digestivas.',
    iconType: 'warning',
  },
  {
    keywords: ['atorvastatina', 'simvastatina', 'lovastatina', 'lipitor', 'zarator', 'estatina'],
    drugName: 'Estatinas (Atorvastatina / Simvastatina)',
    drugCategory: 'Hipolipemiante (Inhibidor HMG-CoA Reductasa)',
    severity: 'ALTA',
    title: 'Inhibición enzimática por Pomelo / Toronja',
    mechanism: 'Los furanocumarinas del pomelo inhiben irreversiblemente la enzima intestinal CYP3A4, multiplicando los niveles plasmáticos del fármaco y el riesgo de toxicidad muscular (rabdomiólisis).',
    affectedFoods: ['Pomelo / Toronja (fruta y zumo)', 'Naranjas amargas de Sevilla'],
    clinicalRecommendation: 'Suprimir totalmente el consumo de pomelo y zumo de pomelo en pacientes tratados con atorvastatina o simvastatina.',
    iconType: 'danger',
  },
  {
    keywords: ['enalapril', 'losartan', 'ramipril', 'candesartan', 'valsartan', 'espironolactona'],
    drugName: 'IECAs / ARA-II / Espironolactona',
    drugCategory: 'Antihipertensivo / Ahorrador de Potasio',
    severity: 'MEDIA',
    title: 'Riesgo de Hiperpotasemia (Exceso de Potasio)',
    mechanism: 'Reducen la excreción renal de potasio. El consumo simultáneo de suplementos o sales de potasio puede provocar arritmias cardíacas.',
    affectedFoods: ['Sales de régimen dietéticas ricas en Cloruro Potásico (K)', 'Consumo masivo de plátanos, frutos secos y concentrados de tomate'],
    clinicalRecommendation: 'Desaconsejar el uso de sales dietéticas "sin sodio" a base de potasio. Mantener una ingesta equilibrada de frutas y verduras sin suplementos de potasio.',
    iconType: 'warning',
  },
  {
    keywords: ['omeprazol', 'pantoprazol', 'lansoprazol', 'esomeprazol', 'protector'],
    drugName: 'Inhibidores de Bomba de Protones (Omeprazol)',
    drugCategory: 'Antisecretor Gástrico (IBP)',
    severity: 'INFORMATIVA',
    title: 'Hipoacidez y Malabsorción de Micronutrientes Clave',
    mechanism: 'La elevación prolongada del pH gástrico reduce la liberación y asimilación de vitamina B12, hierro no hemo, magnesio y calcio.',
    affectedFoods: ['Fuentes vegetales de hierro', 'Calcio dietético'],
    clinicalRecommendation: 'Priorizar alimentos ricos en vitamina C junto con fuentes vegetales de hierro para favorecer la reducción química a hierro ferroso absorbible.',
    iconType: 'info',
  },
  {
    keywords: ['ibuprofeno', 'naproxeno', 'dexketoprofeno', 'enantyum', 'aspirina', 'aine'],
    drugName: 'AINEs (Ibuprofeno / Enantyum / Naproxeno)',
    drugCategory: 'Antiinflamatorio No Esteroideo',
    severity: 'MEDIA',
    title: 'Lesión de la Mucosa Gástrica e Irritación',
    mechanism: 'Inhiben la síntesis de prostaglandinas protectoras de la mucosa gástrica provocando erosiones o hemorragias digestivas.',
    affectedFoods: ['Alcohol', 'Café concentrado', 'Especias muy picantes', 'Cítricos en ayunas'],
    clinicalRecommendation: 'Ingerir siempre junto con comidas principales sólidas. Evitar estimulantes o irritantes gástricos concomitantes.',
    iconType: 'warning',
  },
  {
    keywords: ['ozempic', 'wegovy', 'rybelsus', 'mounjaro', 'saxenda', 'semaglutida', 'tirzepatida', 'glp1', 'glp-1'],
    drugName: 'Análogos GLP-1 / GIP (Ozempic / Wegovy / Mounjaro)',
    drugCategory: 'Agonista Receptor GLP-1 (Tratamiento Obesidad y DM2)',
    severity: 'ALTA',
    title: 'Gastroparesia, Pérdida de Masa Magra y Estreñimiento',
    mechanism: 'Enlentecen drásticamente el vaciado gástrico y reducen el apetito de forma extrema, induciendo pérdida acelerada de masa muscular si la proteína no es priorizada.',
    affectedFoods: ['Comidas copiosas o ricas en grasas pesadas', 'Ultraprocesados', 'Bajo consumo de agua'],
    clinicalRecommendation: 'Fijar suelo proteico prioritario (1.4-1.6 g/kg peso objetivo). Fraccionar en 4-5 tomas de pequeño volumen. Asegurar 2.5 L de agua diaria y fibra soluble suave.',
    iconType: 'danger',
  },
]

/**
 * Analiza el texto de medicación de un paciente y devuelve las alertas clínicas aplicables
 */
export function checkDrugInteractions(patientMedicationsText: string, medicalHistoryText: string = ''): DrugInteractionAlert[] {
  const combined = `${patientMedicationsText || ''} ${medicalHistoryText || ''}`.toLowerCase()
  if (!combined.trim()) return []

  const detected: DrugInteractionAlert[] = []

  for (const rule of CLINICAL_DRUG_RULES) {
    const matches = rule.keywords.some((kw) => combined.includes(kw))
    if (matches) {
      detected.push({
        id: `alert-${rule.keywords[0]}`,
        drugName: rule.drugName,
        drugCategory: rule.drugCategory,
        severity: rule.severity,
        title: rule.title,
        mechanism: rule.mechanism,
        affectedFoods: rule.affectedFoods,
        clinicalRecommendation: rule.clinicalRecommendation,
        iconType: rule.iconType,
      })
    }
  }

  return detected
}
