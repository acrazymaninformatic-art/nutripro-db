/**
 * @file screenings.ts
 * @description Batería de Cuestionarios y Cribados Clínicos Estandarizados (5.3)
 * para EVSoftware:
 * - SCOFF: Cribado de Trastornos de la Conducta Alimentaria (TCA)
 * - MEDAS: Adherencia a la Dieta Mediterránea (PREDIMED 14 ítems)
 * - FINDRISC: Riesgo de Diabetes Tipo 2 a 10 años
 * - MUST: Cribado Universal de Desnutrición (Malnutrition Universal Screening Tool)
 * - MNA: Mini Nutritional Assessment abreviado (Población geriátrica / clínica)
 * - IPAQ: Cuestionario Internacional de Actividad Física abreviado
 */

export interface ScreeningQuestion {
  id: string
  label: string
  description?: string
  options: Array<{
    label: string
    value: string | number
    points: number
  }>
}

export interface ScreeningDefinition {
  type: string
  name: string
  category: string
  description: string
  maxScore: number
  questions: ScreeningQuestion[]
  evaluate: (answers: Record<string, string | number | undefined>) => {
    score: number
    maxScore: number
    resultCategory: string
    interpretation: string
    trafficLight: 'normal' | 'warning' | 'danger'
  }
}

// ---------------------------------------------------------------------------
// 1. SCOFF (Cribado de TCA - Morgan et al.)
// ---------------------------------------------------------------------------
export const SCOFF_SCREENING: ScreeningDefinition = {
  type: 'SCOFF',
  name: 'Cuestionario SCOFF (Cribado TCA)',
  category: 'Conducta Alimentaria',
  description: 'Herramienta de despistaje rápido de trastornos de la conducta alimentaria (TCA: anorexia, bulimia, atracones). Una puntuación ≥ 2 indica alta sospecha y requiere evaluación especializada.',
  maxScore: 5,
  questions: [
    {
      id: 'sick',
      label: '¿Te provocas el vómito porque te sientes incómodamente lleno/a?',
      options: [
        { label: 'Sí', value: 'yes', points: 1 },
        { label: 'No', value: 'no', points: 0 },
      ],
    },
    {
      id: 'control',
      label: '¿Te preocupa haber perdido el control sobre la cantidad de comida que ingieres?',
      options: [
        { label: 'Sí', value: 'yes', points: 1 },
        { label: 'No', value: 'no', points: 0 },
      ],
    },
    {
      id: 'one_stone',
      label: '¿Has perdido recientemente más de 6 kg (una piedra) en un período de 3 meses?',
      options: [
        { label: 'Sí', value: 'yes', points: 1 },
        { label: 'No', value: 'no', points: 0 },
      ],
    },
    {
      id: 'fat',
      label: '¿Te consideras gordo/a aunque los demás te digan que estás demasiado delgado/a?',
      options: [
        { label: 'Sí', value: 'yes', points: 1 },
        { label: 'No', value: 'no', points: 0 },
      ],
    },
    {
      id: 'food',
      label: '¿Dirías que la comida domina tu vida y tus pensamientos diarios?',
      options: [
        { label: 'Sí', value: 'yes', points: 1 },
        { label: 'No', value: 'no', points: 0 },
      ],
    },
  ],
  evaluate: (answers) => {
    let score = 0
    for (const q of SCOFF_SCREENING.questions) {
      if (answers[q.id] === 'yes') score += 1
    }
    const isHighRisk = score >= 2
    return {
      score,
      maxScore: 5,
      resultCategory: isHighRisk ? 'ALTO_RIESGO' : 'BAJO_RIESGO',
      interpretation: isHighRisk
        ? 'Puntuación ≥ 2: Sospecha clínica significativa de trastorno de conducta alimentaria. Se recomienda activar el Protocolo TCA (evitar báscula obsesiva, enfoque en hábitos y derivación/coordinación psicológica).'
        : 'Puntuación < 2: No sugiere presencia de TCA en el momento actual.',
      trafficLight: isHighRisk ? 'danger' : 'normal',
    }
  },
}

// ---------------------------------------------------------------------------
// 2. MEDAS (Adherencia a la Dieta Mediterránea PREDIMED 14 ítems)
// ---------------------------------------------------------------------------
export const MEDAS_SCREENING: ScreeningDefinition = {
  type: 'MEDAS',
  name: 'Cuestionario MEDAS (PREDIMED 14 Ítems)',
  category: 'Patrón Dietético',
  description: 'Valora la adherencia al patrón dietético mediterráneo cardioprotector validado en el ensayo clínico multicéntrico PREDIMED.',
  maxScore: 14,
  questions: [
    {
      id: 'q1_aove_main',
      label: '1. ¿Usa el aceite de oliva como principal grasa culinaria para cocinar y aderezar?',
      options: [
        { label: 'Sí (1 punto)', value: 1, points: 1 },
        { label: 'No', value: 0, points: 0 },
      ],
    },
    {
      id: 'q2_aove_qty',
      label: '2. ¿Cuánto aceite de oliva consume al día (incluyendo fritos, ensaladas, comidas)?',
      options: [
        { label: '≥ 4 cucharadas soperas (≥ 40 ml) (1 punto)', value: 1, points: 1 },
        { label: '< 4 cucharadas al día', value: 0, points: 0 },
      ],
    },
    {
      id: 'q3_vegetables',
      label: '3. ¿Cuántas raciones de verdura u hortalizas consume al día? (1 ración = 200g)',
      options: [
        { label: '≥ 2 raciones al día (al menos 1 en ensalada/cruda) (1 punto)', value: 1, points: 1 },
        { label: '< 2 raciones al día', value: 0, points: 0 },
      ],
    },
    {
      id: 'q4_fruits',
      label: '4. ¿Cuántas piezas de fruta (incluyendo zumo natural) consume al día?',
      options: [
        { label: '≥ 3 piezas o raciones al día (1 punto)', value: 1, points: 1 },
        { label: '< 3 raciones al día', value: 0, points: 0 },
      ],
    },
    {
      id: 'q5_red_meat',
      label: '5. ¿Cuántas raciones de carnes rojas, hamburguesas o embutidos consume al día?',
      options: [
        { label: '< 1 ración al día (< 100-150g) (1 punto)', value: 1, points: 1 },
        { label: '≥ 1 ración al día', value: 0, points: 0 },
      ],
    },
    {
      id: 'q6_butter',
      label: '6. ¿Cuántas porciones de mantequilla, margarina o nata consume al día? (1 porción = 12g)',
      options: [
        { label: '< 1 porción al día (1 punto)', value: 1, points: 1 },
        { label: '≥ 1 porción al día', value: 0, points: 0 },
      ],
    },
    {
      id: 'q7_soda',
      label: '7. ¿Cuántas bebidas azucaradas o carbonatadas (refrescos) consume al día?',
      options: [
        { label: '< 1 refresco al día (1 punto)', value: 1, points: 1 },
        { label: '≥ 1 refresco al día', value: 0, points: 0 },
      ],
    },
    {
      id: 'q8_wine',
      label: '8. ¿Bebe vino tinto de forma moderada con las comidas?',
      options: [
        { label: '≥ 7 vasos a la semana (o abstemio con buen hábito) (1 punto)', value: 1, points: 1 },
        { label: 'No / Consumo excesivo', value: 0, points: 0 },
      ],
    },
    {
      id: 'q9_legumes',
      label: '9. ¿Cuántas raciones de legumbres consume por semana? (1 plato = 150g cocidas)',
      options: [
        { label: '≥ 3 raciones por semana (1 punto)', value: 1, points: 1 },
        { label: '< 3 raciones a la semana', value: 0, points: 0 },
      ],
    },
    {
      id: 'q10_fish',
      label: '10. ¿Cuántas raciones de pescado o mariscos consume a la semana? (1 ración = 100-150g)',
      options: [
        { label: '≥ 3 raciones por semana (1 punto)', value: 1, points: 1 },
        { label: '< 3 raciones por semana', value: 0, points: 0 },
      ],
    },
    {
      id: 'q11_sweets',
      label: '11. ¿Cuántas veces consume repostería, bollería industrial o galletas a la semana?',
      options: [
        { label: '< 3 veces a la semana (1 punto)', value: 1, points: 1 },
        { label: '≥ 3 veces por semana', value: 0, points: 0 },
      ],
    },
    {
      id: 'q12_nuts',
      label: '12. ¿Cuántas raciones de frutos secos consume por semana? (1 ración = 30g)',
      options: [
        { label: '≥ 3 raciones a la semana (1 punto)', value: 1, points: 1 },
        { label: '< 3 raciones a la semana', value: 0, points: 0 },
      ],
    },
    {
      id: 'q13_poultry',
      label: '13. ¿Prefiere y consume preferentemente carne blanca (pollo, pavo, conejo) sobre roja?',
      options: [
        { label: 'Sí (1 punto)', value: 1, points: 1 },
        { label: 'No', value: 0, points: 0 },
      ],
    },
    {
      id: 'q14_sofrito',
      label: '14. ¿Cuántas veces a la semana consume platos guisados con sofrito casero con AOVE?',
      options: [
        { label: '≥ 2 veces a la semana (1 punto)', value: 1, points: 1 },
        { label: '< 2 veces a la semana', value: 0, points: 0 },
      ],
    },
  ],
  evaluate: (answers) => {
    let score = 0
    for (const q of MEDAS_SCREENING.questions) {
      if (Number(answers[q.id]) === 1) score += 1
    }
    if (score >= 9) {
      return {
        score,
        maxScore: 14,
        resultCategory: 'ADHERENCIA_ALTA',
        interpretation: 'Alta adherencia a la Dieta Mediterránea (≥ 9 puntos). Patrón cardioprotector excelente.',
        trafficLight: 'normal',
      }
    } else if (score >= 7) {
      return {
        score,
        maxScore: 14,
        resultCategory: 'ADHERENCIA_MEDIA',
        interpretation: 'Adherencia media (7 - 8 puntos). Se recomienda reforzar consumo de legumbres, pescado azul y frutos secos.',
        trafficLight: 'warning',
      }
    }
    return {
      score,
      maxScore: 14,
      resultCategory: 'ADHERENCIA_BAJA',
      interpretation: 'Baja adherencia (< 7 puntos). Elevado margen de optimización nutricional y prevención cardiovascular.',
      trafficLight: 'danger',
    }
  },
}

// ---------------------------------------------------------------------------
// 3. FINDRISC (Riesgo de Diabetes Tipo 2 a 10 años)
// ---------------------------------------------------------------------------
export const FINDRISC_SCREENING: ScreeningDefinition = {
  type: 'FINDRISC',
  name: 'Test FINDRISC (Riesgo de Diabetes Mellitus 2)',
  category: 'Riesgo Metabólico',
  description: 'Puntuación finlandesa validada internacionalmente para estimar la probabilidad de desarrollar diabetes mellitus tipo 2 en los próximos 10 años.',
  maxScore: 26,
  questions: [
    {
      id: 'age',
      label: '1. Edad del paciente',
      options: [
        { label: 'Menos de 45 años (0 p)', value: 0, points: 0 },
        { label: '45 - 54 años (2 p)', value: 2, points: 2 },
        { label: '55 - 64 años (3 p)', value: 3, points: 3 },
        { label: 'Más de 64 años (4 p)', value: 4, points: 4 },
      ],
    },
    {
      id: 'bmi',
      label: '2. Índice de Masa Corporal (IMC)',
      options: [
        { label: '< 25 kg/m² (0 p)', value: 0, points: 0 },
        { label: '25 - 30 kg/m² (Sobrepeso) (1 p)', value: 1, points: 1 },
        { label: '> 30 kg/m² (Obesidad) (3 p)', value: 3, points: 3 },
      ],
    },
    {
      id: 'waist',
      label: '3. Perímetro de cintura (medido a nivel umbilical)',
      options: [
        { label: 'Hombre < 94 cm / Mujer < 80 cm (0 p)', value: 0, points: 0 },
        { label: 'Hombre 94-102 cm / Mujer 80-88 cm (3 p)', value: 3, points: 3 },
        { label: 'Hombre > 102 cm / Mujer > 88 cm (4 p)', value: 4, points: 4 },
      ],
    },
    {
      id: 'activity',
      label: '4. ¿Realiza habitualmente al menos 30 min diarios de actividad física o deporte?',
      options: [
        { label: 'Sí (0 p)', value: 0, points: 0 },
        { label: 'No (2 p)', value: 2, points: 2 },
      ],
    },
    {
      id: 'vegetables',
      label: '5. ¿Con qué frecuencia come verduras, hortalizas o frutas?',
      options: [
        { label: 'A diario (0 p)', value: 0, points: 0 },
        { label: 'No a diario (1 p)', value: 1, points: 1 },
      ],
    },
    {
      id: 'bp_meds',
      label: '6. ¿Toma habitualmente medicación para la hipertensión arterial?',
      options: [
        { label: 'No (0 p)', value: 0, points: 0 },
        { label: 'Sí (2 p)', value: 2, points: 2 },
      ],
    },
    {
      id: 'glucose_history',
      label: '7. ¿Le han encontrado alguna vez valores de glucosa altos (en analítica, embarazo o enfermedad)?',
      options: [
        { label: 'No (0 p)', value: 0, points: 0 },
        { label: 'Sí (5 p)', value: 5, points: 5 },
      ],
    },
    {
      id: 'family_diabetes',
      label: '8. ¿Tiene antecedentes familiares de diabetes mellitus tipo 1 o tipo 2?',
      options: [
        { label: 'No (0 p)', value: 0, points: 0 },
        { label: 'Sí: abuelos, tíos o primos hermanos (3 p)', value: 3, points: 3 },
        { label: 'Sí: padres, hermanos o hijos (5 p)', value: 5, points: 5 },
      ],
    },
  ],
  evaluate: (answers) => {
    let score = 0
    for (const q of FINDRISC_SCREENING.questions) {
      score += Number(answers[q.id] || 0)
    }
    if (score < 7) {
      return {
        score,
        maxScore: 26,
        resultCategory: 'BAJO_RIESGO',
        interpretation: 'Riesgo Bajo (1 de cada 100 desarrollará DM2 en 10 años). Mantener estilo de vida cardiosaludable.',
        trafficLight: 'normal',
      }
    } else if (score <= 11) {
      return {
        score,
        maxScore: 26,
        resultCategory: 'LIGERAMENTE_ELEVADO',
        interpretation: 'Riesgo Ligeramente Elevado (1 de cada 25 desarrollará DM2). Se recomienda perder peso y aumentar actividad física.',
        trafficLight: 'normal',
      }
    } else if (score <= 14) {
      return {
        score,
        maxScore: 26,
        resultCategory: 'MODERADO',
        interpretation: 'Riesgo Moderado (1 de cada 6 desarrollará DM2). Intervención nutricional pautada prioritaria.',
        trafficLight: 'warning',
      }
    } else if (score <= 20) {
      return {
        score,
        maxScore: 26,
        resultCategory: 'ALTO_RIESGO',
        interpretation: 'Riesgo Alto (1 de cada 3 desarrollará DM2). Analítica con HbA1c y HOMA-IR requerida inmediatamente.',
        trafficLight: 'danger',
      }
    }
    return {
      score,
      maxScore: 26,
      resultCategory: 'MUY_ALTO_RIESGO',
      interpretation: 'Riesgo Muy Alto (1 de cada 2 desarrollará DM2). Manejo clínico estrecho y protocolo intensivo.',
      trafficLight: 'danger',
    }
  },
}

// ---------------------------------------------------------------------------
// 4. MUST (Cribado Universal de Desnutrición en Adultos)
// ---------------------------------------------------------------------------
export const MUST_SCREENING: ScreeningDefinition = {
  type: 'MUST',
  name: 'Cribado MUST (Malnutrition Universal Screening Tool)',
  category: 'Desnutrición Clínica',
  description: 'Herramienta en 3 pasos para detectar desnutrición o riesgo de desnutrición en adultos según IMC, pérdida involuntaria de peso y efecto de enfermedad aguda.',
  maxScore: 6,
  questions: [
    {
      id: 'bmi_step',
      label: 'Paso 1: Puntuación de IMC',
      options: [
        { label: 'IMC > 20.0 kg/m² (0 puntos)', value: 0, points: 0 },
        { label: 'IMC 18.5 - 20.0 kg/m² (1 punto)', value: 1, points: 1 },
        { label: 'IMC < 18.5 kg/m² (2 puntos)', value: 2, points: 2 },
      ],
    },
    {
      id: 'weight_loss_step',
      label: 'Paso 2: Pérdida de peso involuntaria en los últimos 3-6 meses',
      options: [
        { label: '< 5% de pérdida de peso (0 puntos)', value: 0, points: 0 },
        { label: '5% - 10% de pérdida de peso (1 punto)', value: 1, points: 1 },
        { label: '> 10% de pérdida de peso (2 puntos)', value: 2, points: 2 },
      ],
    },
    {
      id: 'acute_disease_step',
      label: 'Paso 3: Efecto de enfermedad aguda (gravemente enfermo sin ingesta > 5 días)',
      options: [
        { label: 'No aplica o ingesta conservada (0 puntos)', value: 0, points: 0 },
        { label: 'Enfermedad aguda grave sin aporte nutricional > 5 días (2 puntos)', value: 2, points: 2 },
      ],
    },
  ],
  evaluate: (answers) => {
    let score = 0
    for (const q of MUST_SCREENING.questions) {
      score += Number(answers[q.id] || 0)
    }
    if (score === 0) {
      return {
        score,
        maxScore: 6,
        resultCategory: 'BAJO_RIESGO',
        interpretation: 'Bajo Riesgo de Desnutrición (Puntuación 0). Cuidados clínicos rutinarios.',
        trafficLight: 'normal',
      }
    } else if (score === 1) {
      return {
        score,
        maxScore: 6,
        resultCategory: 'RIESGO_MEDIO',
        interpretation: 'Riesgo Medio de Desnutrición (Puntuación 1). Monitorización de ingestas durante 3 días y reevaluación periódica.',
        trafficLight: 'warning',
      }
    }
    return {
      score,
      maxScore: 6,
      resultCategory: 'ALTO_RIESGO',
      interpretation: 'Alto Riesgo de Desnutrición (Puntuación ≥ 2). Tratamiento nutricional activo, suplementación oral o hiperproteica urgente.',
      trafficLight: 'danger',
    }
  },
}

// ---------------------------------------------------------------------------
// 5. MNA (Mini Nutritional Assessment Abreviado)
// ---------------------------------------------------------------------------
export const MNA_SCREENING: ScreeningDefinition = {
  type: 'MNA',
  name: 'Cuestionario MNA-SF (Mini Nutritional Assessment)',
  category: 'Nutrición Geriátrica',
  description: 'Evaluación rápida de 6 preguntas validada por Nestlé Nutrition Institute y la ESPEN para adultos mayores.',
  maxScore: 14,
  questions: [
    {
      id: 'appetite',
      label: 'A. ¿Ha disminuido la ingesta de alimentos en los últimos 3 meses por pérdida de apetito, problemas digestivos o dificultades de masticación?',
      options: [
        { label: '0 = Disminución grave de ingesta', value: 0, points: 0 },
        { label: '1 = Disminución moderada', value: 1, points: 1 },
        { label: '2 = Sin disminución', value: 2, points: 2 },
      ],
    },
    {
      id: 'weight_loss',
      label: 'B. Pérdida reciente de peso (< 3 meses)',
      options: [
        { label: '0 = Pérdida > 3 kg', value: 0, points: 0 },
        { label: '1 = No sabe', value: 1, points: 1 },
        { label: '2 = Pérdida entre 1 y 3 kg', value: 2, points: 2 },
        { label: '3 = No ha habido pérdida de peso', value: 3, points: 3 },
      ],
    },
    {
      id: 'mobility',
      label: 'C. Movilidad',
      options: [
        { label: '0 = De la cama al sillón', value: 0, points: 0 },
        { label: '1 = Sale de la cama/sillón pero no sale a la calle', value: 1, points: 1 },
        { label: '2 = Sale del domicilio / totalmente autónomo', value: 2, points: 2 },
      ],
    },
    {
      id: 'stress',
      label: 'D. ¿Ha sufrido estrés psicológico o enfermedad aguda en los últimos 3 meses?',
      options: [
        { label: '0 = Sí', value: 0, points: 0 },
        { label: '2 = No', value: 2, points: 2 },
      ],
    },
    {
      id: 'neuro',
      label: 'E. Problemas neuropsicológicos',
      options: [
        { label: '0 = Demencia o depresión grave', value: 0, points: 0 },
        { label: '1 = Demencia leve', value: 1, points: 1 },
        { label: '2 = Sin problemas psicológicos', value: 2, points: 2 },
      ],
    },
    {
      id: 'bmi_or_calf',
      label: 'F. Índice de Masa Corporal (IMC)',
      options: [
        { label: '0 = IMC < 19', value: 0, points: 0 },
        { label: '1 = IMC 19 - 21', value: 1, points: 1 },
        { label: '2 = IMC 21 - 23', value: 2, points: 2 },
        { label: '3 = IMC ≥ 23', value: 3, points: 3 },
      ],
    },
  ],
  evaluate: (answers) => {
    let score = 0
    for (const q of MNA_SCREENING.questions) {
      score += Number(answers[q.id] || 0)
    }
    if (score >= 12) {
      return {
        score,
        maxScore: 14,
        resultCategory: 'ESTADO_NORMAL',
        interpretation: 'Estado nutricional normal (12 - 14 puntos).',
        trafficLight: 'normal',
      }
    } else if (score >= 8) {
      return {
        score,
        maxScore: 14,
        resultCategory: 'RIESGO_DESNUTRICION',
        interpretation: 'Riesgo de desnutrición (8 - 11 puntos). Intervención preventiva indicada.',
        trafficLight: 'warning',
      }
    }
    return {
      score,
      maxScore: 14,
      resultCategory: 'DESNUTRIDO',
      interpretation: 'Desnutrición manifiesta (0 - 7 puntos). Requiere plan de soporte nutricional y seguimiento médico.',
      trafficLight: 'danger',
    }
  },
}

// ---------------------------------------------------------------------------
// Registro de todos los cribados disponibles
// ---------------------------------------------------------------------------
export const ALL_SCREENINGS: Record<string, ScreeningDefinition> = {
  SCOFF: SCOFF_SCREENING,
  MEDAS: MEDAS_SCREENING,
  FINDRISC: FINDRISC_SCREENING,
  MUST: MUST_SCREENING,
  MNA: MNA_SCREENING,
}

export function getScreeningDefinition(type: string): ScreeningDefinition | undefined {
  return ALL_SCREENINGS[type]
}
