/**
 * Plantillas y Constructor de Cuestionarios Clínicos (EVSoftware - Sección 5.4)
 * 
 * "Constructor propio con preguntas condicionales y plantillas: deportiva, pediátrica,
 * embarazo, TCA, seguimiento semanal y satisfacción."
 */

export interface QuestionnaireQuestion {
  id: string
  label: string
  description?: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'boolean' | 'rating'
  options?: { value: string; label: string }[]
  required?: boolean
  unit?: string
  placeholder?: string
  conditionalOn?: {
    questionId: string
    equals?: string | number | boolean
    notEquals?: string | number | boolean
  }
}

export interface QuestionnaireTemplateDefinition {
  type: 'ALTA' | 'DEPORTIVA' | 'PEDIATRICA' | 'EMBARAZO' | 'TCA' | 'SEGUIMIENTO' | 'SATISFACCION' | 'PERSONALIZADO'
  title: string
  description: string
  category: string
  iconName: string
  estimatedTimeMin: number
  questions: QuestionnaireQuestion[]
}

export const BUILT_IN_TEMPLATES: QuestionnaireTemplateDefinition[] = [
  // 1. DEPORTIVA
  {
    type: 'DEPORTIVA',
    title: 'Cuestionario de Rendimiento y Nutrición Deportiva',
    description: 'Evaluación de cargas de entrenamiento, peri-entreno, timing de nutrientes, composición y suplementación deportiva.',
    category: 'Deportiva',
    iconName: 'Dumbbell',
    estimatedTimeMin: 6,
    questions: [
      {
        id: 'sportDiscipline',
        label: 'Disciplina o deporte principal',
        description: 'Crossfit, running de fondo, triatlón, hipertrofia en sala, fútbol, ciclismo...',
        type: 'text',
        required: true,
        placeholder: 'Ej: Running y entrenamiento de fuerza',
      },
      {
        id: 'weeklyVolumeHours',
        label: 'Volumen total de entrenamiento por semana',
        type: 'number',
        unit: 'horas/sem',
        required: true,
        placeholder: '6',
      },
      {
        id: 'hasDoubleSessions',
        label: '¿Realizas doblajes de sesión en el mismo día?',
        type: 'boolean',
      },
      {
        id: 'preWorkoutHabit',
        label: 'Comida previa al entrenamiento (Pre-entreno)',
        description: '¿Qué sueles comer antes de entrenar y con cuánto tiempo de margen?',
        type: 'textarea',
        placeholder: 'Ej: Plátano con café 45 min antes, o entreno en ayunas',
      },
      {
        id: 'intraWorkoutFuel',
        label: '¿Tomas hidratación o carbohidratos durante los entrenamientos?',
        description: 'Geles, sales minerales, isotónico, barritas...',
        type: 'select',
        options: [
          { value: 'solo_agua', label: 'Solo agua' },
          { value: 'sales_isotónico', label: 'Agua con sales / bebida isotónica' },
          { value: 'geles_carbos', label: 'Geles o hidratos líquidos en sesiones largas (>90 min)' },
          { value: 'nada', label: 'No suelo beber nada durante la sesión' },
        ],
      },
      {
        id: 'postWorkoutRecovery',
        label: 'Recuperación post-entreno',
        description: '¿Qué sueles tomar justo al terminar el entrenamiento?',
        type: 'text',
        placeholder: 'Ej: Batido de proteína de suero, fruta, comida principal...',
      },
      {
        id: 'currentSupplementsSport',
        label: 'Suplementos deportivos actuales',
        description: 'Creatina monohidrato, proteína aislada, cafeína, beta-alanina, etc.',
        type: 'textarea',
        placeholder: 'Indica qué suplementos tomas y en qué dosis si la sabes',
      },
      {
        id: 'upcomingCompetitions',
        label: 'Próximas competiciones o pruebas marcadas en el calendario',
        type: 'textarea',
        placeholder: 'Fechas y distancias o categorías previstas',
      },
      {
        id: 'injuryHistory',
        label: 'Lesiones articulares o musculares recientes',
        type: 'textarea',
        placeholder: 'Roturas fibrilares, tendinopatías, sobrecargas recurrentes...',
      },
    ],
  },

  // 2. PEDIÁTRICA
  {
    type: 'PEDIATRICA',
    title: 'Cuestionario de Nutrición Pediátrica y Familiar',
    description: 'Dirigido a madres, padres o tutores para valorar hábitos infantiles, entorno del comedor escolar y percentiles.',
    category: 'Pediátrica',
    iconName: 'Baby',
    estimatedTimeMin: 5,
    questions: [
      {
        id: 'childAgeMonths',
        label: 'Edad del menor (en años y meses)',
        type: 'text',
        required: true,
        placeholder: 'Ej: 4 años y 3 meses',
      },
      {
        id: 'knownPercentiles',
        label: 'Percentiles de peso y talla conocidos de la última revisión pediátrica',
        type: 'text',
        placeholder: 'Ej: Peso P50, Altura P75',
      },
      {
        id: 'schoolDining',
        label: '¿Come en el comedor escolar?',
        type: 'select',
        options: [
          { value: 'si_diario', label: 'Sí, de lunes a viernes' },
          { value: 'algunos_dias', label: 'Solo algunos días por semana' },
          { value: 'no_casa', label: 'No, come siempre en casa' },
        ],
      },
      {
        id: 'textureAcceptance',
        label: 'Aceptación de texturas y alimentos enteros',
        description: '¿Mastica con normalidad o rechaza trozos enteros, verduras o pieles?',
        type: 'select',
        options: [
          { value: 'buena', label: 'Buena aceptación general de cualquier textura' },
          { value: 'selectivo', label: 'Selectividad moderada (rechaza texturas fibrosas o verduras enteras)' },
          { value: 'muy_restringido', label: 'Dieta muy blanca o triturados (alta selectividad sensorial)' },
        ],
      },
      {
        id: 'favoriteFoodsChild',
        label: 'Alimentos favoritos que siempre come bien',
        type: 'textarea',
        placeholder: 'Pastas, frutas concretas, lácteos, carnes...',
      },
      {
        id: 'rejectedFoodsChild',
        label: 'Alimentos que rechaza sistemáticamente',
        type: 'textarea',
        placeholder: 'Verduras, pescados, legumbres enteras...',
      },
      {
        id: 'familyEatingAtmosphere',
        label: 'Ambiente en las comidas familiares',
        description: '¿Hay pantallas durante la comida, presiones para terminar el plato o comidas tranquilas?',
        type: 'select',
        options: [
          { value: 'tranquilo', label: 'Tranquilo, todos juntos sin pantallas' },
          { value: 'pantallas', label: 'Suele comer con móvil o televisión encendida' },
          { value: 'tension', label: 'Suele haber tensión o conflicto para que coma' },
        ],
      },
    ],
  },

  // 3. EMBARAZO Y LACTANCIA
  {
    type: 'EMBARAZO',
    title: 'Cuestionario de Salud Gestacional y Embarazo',
    description: 'Control de semana de gestación, suplementación obligatoria (ácido fólico, yodo), náuseas y seguridad alimentaria.',
    category: 'Maternidad',
    iconName: 'HeartHandshake',
    estimatedTimeMin: 5,
    questions: [
      {
        id: 'gestationalWeek',
        label: 'Semana actual de gestación',
        type: 'number',
        unit: 'semanas',
        required: true,
        placeholder: '14',
      },
      {
        id: 'prenatalSupplement',
        label: 'Suplemento prenatal que estás tomando actualmente',
        description: 'Ej: Natalben, Gestagyn, Yoduk, ácido fólico solo...',
        type: 'text',
        required: true,
        placeholder: 'Nombre comercial del suplemento',
      },
      {
        id: 'pregnancyNausea',
        label: 'Presencia de náuseas o vómitos matutinos',
        type: 'select',
        options: [
          { value: 'sin_nauseas', label: 'Sin náuseas' },
          { value: 'leves', label: 'Náuseas leves en momentos concretos' },
          { value: 'moderadas', label: 'Náuseas frecuentes que dificultan comer' },
          { value: 'hiperemesis', label: 'Vómitos continuos / diagnosticada hiperémesis gravídica' },
        ],
      },
      {
        id: 'foodSmellAversions',
        label: 'Aversiones por olores o sabores nuevos en el embarazo',
        type: 'textarea',
        placeholder: 'Olores que te producen rechazo inmediato',
      },
      {
        id: 'gestationalDiabetesScreening',
        label: 'Test de O\'Sullivan (curva de azúcar)',
        type: 'select',
        options: [
          { value: 'pendiente', label: 'Aún no realizada (corresponde a semana 24-28)' },
          { value: 'normal', label: 'Realizada y normal (<140 mg/dL)' },
          { value: 'positiva', label: 'Positiva o diagnóstico de diabetes gestacional' },
        ],
      },
      {
        id: 'toxoplasmosisStatus',
        label: 'Serología de Toxoplasmosis',
        type: 'select',
        options: [
          { value: 'inmune', label: 'Inmune (IgG positiva: puedes comer embutidos curados seguros)' },
          { value: 'no_inmune', label: 'No inmune (IgG negativa: requiere congelación o cocinado estricto)' },
          { value: 'desconocido', label: 'Pendiente de resultado analítico' },
        ],
      },
    ],
  },

  // 4. TCA (TRASTORNOS DE LA CONDUCTA ALIMENTARIA)
  {
    type: 'TCA',
    title: 'Cuestionario de Relación con la Comida y Conducta Alimentaria',
    description: 'Protocolo clínico respetuoso enfocado en la relación emocional, culpa, miedos y hábitos sin enfoque en números.',
    category: 'Conducta Alimentaria',
    iconName: 'ShieldAlert',
    estimatedTimeMin: 6,
    questions: [
      {
        id: 'scaleFrequency',
        label: 'Frecuencia con la que te pesas en casa',
        type: 'select',
        options: [
          { value: 'nunca', label: 'Casi nunca o no tengo báscula (recomendado)' },
          { value: 'semanal', label: 'Una vez por semana o quincenal' },
          { value: 'diario', label: 'A diario' },
          { value: 'compulsivo', label: 'Varias veces al día o antes y después de comer' },
        ],
      },
      {
        id: 'forbiddenFoodsFear',
        label: '¿Sientes miedo, ansiedad o culpa intensa al comer ciertos alimentos?',
        description: 'Pan, hidratos, dulces, fritos, salsas...',
        type: 'select',
        options: [
          { value: 'nada', label: 'No, disfruto de la comida con flexibilidad' },
          { value: 'a_veces', label: 'A veces siento cierta culpa tras comidas sociales' },
          { value: 'frecuente', label: 'Sí, tengo una lista mental de "alimentos prohibidos"' },
          { value: 'intenso', label: 'Miedo muy intenso que me lleva a cancelar planes sociales' },
        ],
      },
      {
        id: 'bingeOrEmotionalEating',
        label: 'Episodios de pérdida de control con la comida (ingestas compulsivas)',
        type: 'select',
        options: [
          { value: 'nunca', label: 'No experimento pérdida de control' },
          { value: 'esporadico', label: 'Ocasionalmente si he tenido un día de mucho estrés emocional' },
          { value: 'recurrente', label: '1 o más veces por semana en soledad y con malestar posterior' },
        ],
      },
      {
        id: 'compensatoryBehaviors',
        label: '¿Has realizado conductas compensatorias tras comer?',
        description: 'Ayunos extremos al día siguiente, ejercicio excesivo para quemar, vómitos provocados o laxantes.',
        type: 'select',
        options: [
          { value: 'nunca', label: 'Nunca' },
          { value: 'ejercicio_ayuno', label: 'Compensar saltándome la siguiente comida o entrenando de más' },
          { value: 'purgas', label: 'Vómitos autoprovocados o uso de diuréticos/laxantes' },
        ],
      },
      {
        id: 'preferredCommunicationApproach',
        label: 'Enfoque de trabajo preferido con Eva',
        type: 'select',
        options: [
          { value: 'sin_calorias', label: 'Menú estructurado 100% SIN calorías ni números (recomendado para sanar relación)' },
          { value: 'plato_saludable', label: 'Enfoque método del plato visual y sensaciones de hambre/saciedad' },
        ],
      },
    ],
  },

  // 5. SEGUIMIENTO SEMANAL
  {
    type: 'SEGUIMIENTO',
    title: 'Cuestionario de Seguimiento Semanal / Quincenal',
    description: 'Control ágil previo a la cita de revisión para valorar sensaciones, adherencia, digestión y dudas para Eva.',
    category: 'Seguimiento',
    iconName: 'CalendarCheck',
    estimatedTimeMin: 3,
    questions: [
      {
        id: 'menuAdherenceScore',
        label: 'Valoración global de tu adherencia al plan estas semanas (1 a 10)',
        description: '10 = he seguido el plan al 100% con facilidad; 1 = no he podido seguirlo nada',
        type: 'rating',
        required: true,
      },
      {
        id: 'energyLevel',
        label: 'Nivel medio de energía y vitalidad en el día a día',
        type: 'select',
        options: [
          { value: 'alta', label: 'Excelente: con mucha energía y sin bajones' },
          { value: 'normal', label: 'Normal / adecuada' },
          { value: 'baja', label: 'Cansancio o bajones notables de energía a media tarde' },
        ],
      },
      {
        id: 'hungerSatiety',
        label: 'Sensación de hambre y saciedad',
        type: 'select',
        options: [
          { value: 'saciado', label: 'Perfectamente saciado/a en todas las comidas' },
          { value: 'hambre_puntual', label: 'Hambre puntual en alguna hora concreta (ej: media tarde o antes de cenar)' },
          { value: 'hambre_frecuente', label: 'Paso hambre o las porciones se me quedan cortas' },
          { value: 'exceso', label: 'Me cuesta terminarme las cantidades de algunas tomas' },
        ],
      },
      {
        id: 'digestionFollowup',
        label: 'Digestiones y tránsito desde la última revisión',
        type: 'select',
        options: [
          { value: 'muy_buenas', label: 'Muy buenas, sin pesadez ni gases' },
          { value: 'leves_gases', label: 'Alguna molestia o hinchazón leve en días puntuales' },
          { value: 'empeorado', label: 'He notado más molestias o estreñimiento' },
        ],
      },
      {
        id: 'newMedicationOrDiagnosis',
        label: '¿Has empezado alguna medicación nueva o te han dado algún diagnóstico desde la última cita?',
        type: 'textarea',
        placeholder: 'Indica cualquier cambio farmacológico o médico',
      },
      {
        id: 'favoriteRecipesSoFar',
        label: '¿Qué recetas o combinaciones te han gustado más?',
        type: 'textarea',
        placeholder: 'Para que Eva las mantenga o potencie en tus siguientes semanas',
      },
      {
        id: 'questionsForEvaInSession',
        label: 'Dudas concretas que quieres tratar con Eva en la videollamada / consulta',
        type: 'textarea',
        placeholder: 'Apunta aquí tus preguntas para no olvidarlas en la cita',
      },
    ],
  },

  // 6. SATISFACCIÓN
  {
    type: 'SATISFACCION',
    title: 'Cuestionario de Calidad y Satisfacción del Servicio',
    description: 'Valoración anónima o identificada sobre la atención de Eva, la facilidad del portal y el resultado del tratamiento.',
    category: 'Calidad',
    iconName: 'Star',
    estimatedTimeMin: 2,
    questions: [
      {
        id: 'overallSatisfactionRating',
        label: 'Satisfacción global con el asesoramiento de Eva Vidal Nutrición (1 a 5 estrellas)',
        type: 'rating',
        required: true,
      },
      {
        id: 'portalUsabilityRating',
        label: 'Facilidad de uso del portal web y consulta de menús/recetas (1 a 5 estrellas)',
        type: 'rating',
        required: true,
      },
      {
        id: 'recipeClarityRating',
        label: 'Claridad de las recetas e ingredientes de la lista de la compra (1 a 5 estrellas)',
        type: 'rating',
        required: true,
      },
      {
        id: 'recommendationLikelihood',
        label: '¿Recomendarías los servicios de Eva a un familiar o amigo?',
        type: 'select',
        options: [
          { value: 'seguro_si', label: 'Sí, sin dudarlo' },
          { value: 'probablemente', label: 'Probablemente sí' },
          { value: 'neutral', label: 'Neutro' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'suggestionsOrComments',
        label: '¿Qué podríamos mejorar o añadir para hacer tu experiencia aún mejor?',
        type: 'textarea',
        placeholder: 'Tus sugerencias nos ayudan a seguir mejorando día a día',
      },
    ],
  },
]
