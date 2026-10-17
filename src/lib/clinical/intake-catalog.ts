/**
 * Catálogo Unificado de Campos Clínicos (EVSoftware - Sección 5.4)
 * 
 * "Un solo catálogo de campos. La ficha y el cuestionario salen de la misma definición
 * de campos (nombre, tipo de respuesta y opciones). Si Eva añade, renombra o quita un
 * campo en la ficha, cambia también en el cuestionario, de modo que nunca pueden
 * quedar desalineados."
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'boolean' | 'date'

export interface IntakeFieldOption {
  value: string
  label: string
}

export interface IntakeFieldDefinition {
  id: string
  label: string
  description?: string
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 // 1-7 son los 7 pasos; 8 otros
  stepTitle: string
  type: FieldType
  options?: IntakeFieldOption[]
  unit?: string
  placeholder?: string
  isCritical?: boolean // Alergias, intolerancias, medicación, embarazo, etc.
  conditionalOn?: {
    fieldId: string
    equals?: string | number | boolean
    notEquals?: string | number | boolean
  }
  isDeclaredMeasurement?: boolean // Declarado no es medido (fuera de gráficas)
  patientVisible: boolean
}

export const INTAKE_STEPS = [
  { step: 1, title: 'Datos personales', description: 'Confirmación de datos de filiación y referencias básicas' },
  { step: 2, title: 'Historial clínico', description: 'Paso crítico: alergias, patologías, medicación y antecedentes' },
  { step: 3, title: 'Digestivo y metabolismo', description: 'Tránsito, síntomas digestivos, aversiones e hidratación' },
  { step: 4, title: 'Estilo de vida', description: 'Descanso, estrés, rutinas de trabajo y horarios' },
  { step: 5, title: 'Actividad física', description: 'Deporte, frecuencia, intensidad y objetivos de rendimiento' },
  { step: 6, title: 'Salud femenina', description: 'Ciclo menstrual, embarazo, lactancia y salud hormonal' },
  { step: 7, title: 'Objetivos', description: 'Expectativas, motivaciones y compromiso con el plan' },
] as const

export const INTAKE_CATALOG: IntakeFieldDefinition[] = [
  // === PASO 1: DATOS PERSONALES ===
  {
    id: 'firstName',
    label: 'Nombre',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'text',
    patientVisible: true,
  },
  {
    id: 'lastName',
    label: 'Apellidos',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'text',
    patientVisible: true,
  },
  {
    id: 'email',
    label: 'Correo electrónico',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'text',
    patientVisible: true,
  },
  {
    id: 'phone',
    label: 'Teléfono',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'text',
    patientVisible: true,
  },
  {
    id: 'birthDate',
    label: 'Fecha de nacimiento',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'date',
    patientVisible: true,
  },
  {
    id: 'sex',
    label: 'Sexo biológico',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'select',
    options: [
      { value: 'FEMALE', label: 'Femenino' },
      { value: 'MALE', label: 'Masculino' },
    ],
    patientVisible: true,
  },
  {
    id: 'occupation',
    label: 'Profesión u ocupación',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'text',
    placeholder: 'Ej: Profesora, administrativo, electricista...',
    patientVisible: true,
  },
  {
    id: 'declaredWeightKg',
    label: 'Peso habitual aproximado',
    description: 'Dato declarado por ti. Eva medirá tu peso y composición en consulta para la gráfica clínica.',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'number',
    unit: 'kg',
    isDeclaredMeasurement: true,
    patientVisible: true,
  },
  {
    id: 'declaredHeightCm',
    label: 'Altura aproximada',
    description: 'Dato declarado de referencia.',
    step: 1,
    stepTitle: 'Datos personales',
    type: 'number',
    unit: 'cm',
    isDeclaredMeasurement: true,
    patientVisible: true,
  },

  // === PASO 2: HISTORIAL CLÍNICO (PASO CRÍTICO) ===
  {
    id: 'allergies',
    label: 'Alergias alimentarias',
    description: 'Alergias diagnosticadas (frutos secos, marisco, huevo, etc.)',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'textarea',
    placeholder: 'Indica si tienes alergias o pon "Ninguna conocida"',
    isCritical: true,
    patientVisible: true,
  },
  {
    id: 'intolerances',
    label: 'Intolerancias alimentarias',
    description: 'Lactosa, fructosa, sorbitol, gluten no celíaco...',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'textarea',
    placeholder: 'Indica si tienes intolerancias confirmadas o sospechadas',
    isCritical: true,
    patientVisible: true,
  },
  {
    id: 'medicalHistory',
    label: 'Diagnósticos médicos y patologías',
    description: 'Diabetes, hipertensión, hipotiroidismo, SOP, colesterol alto, hígado graso, etc.',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'textarea',
    placeholder: 'Diagnósticos previos o actuales',
    isCritical: true,
    patientVisible: true,
  },
  {
    id: 'currentMedications',
    label: 'Medicación habitual prescrita',
    description: 'Fármacos actuales con dosis si la conoces (levotiroxina, metformina, estatinas, anticonceptivos, etc.)',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'textarea',
    placeholder: 'Nombre de los fármacos que tomas',
    isCritical: true,
    patientVisible: true,
  },
  {
    id: 'isGLP1Treatment',
    label: 'Tratamiento con análogos GLP-1',
    description: '¿Tomas o te inyectas fármacos como Ozempic, Wegovy, Mounjaro o Rybelsus?',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'boolean',
    isCritical: true,
    patientVisible: true,
  },
  {
    id: 'supplements',
    label: 'Suplementos y vitaminas',
    description: 'Proteína en polvo, creatina, vitamina D, magnesio, omega 3, probióticos...',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'textarea',
    placeholder: 'Suplementos que consumes actualmente',
    patientVisible: true,
  },
  {
    id: 'surgeries',
    label: 'Cirugías o intervenciones previas',
    description: 'Cirugía bariátrica, vesícula biliar, tiroides, etc.',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'textarea',
    placeholder: 'Intervenciones quirúrgicas relevantes',
    patientVisible: true,
  },
  {
    id: 'familyHistory',
    label: 'Antecedentes familiares',
    description: 'Diabetes familiar, problemas cardiovasculares, obesidad, celiaquía...',
    step: 2,
    stepTitle: 'Historial clínico',
    type: 'textarea',
    placeholder: 'Antecedentes familiares de interés',
    patientVisible: true,
  },

  // === PASO 3: DIGESTIVO Y METABOLISMO ===
  {
    id: 'digestiveIssues',
    label: 'Síntomas y molestias digestivas',
    description: 'Reflujo, acidez, gases, hinchazón postprandial, digestiones pesadas, dolor...',
    step: 3,
    stepTitle: 'Digestivo y metabolismo',
    type: 'textarea',
    placeholder: 'Describe las molestias habituales y cuándo aparecen',
    patientVisible: true,
  },
  {
    id: 'bowelFrequency',
    label: 'Frecuencia y ritmo intestinal',
    step: 3,
    stepTitle: 'Digestivo y metabolismo',
    type: 'select',
    options: [
      { value: 'diario_1_2', label: 'Diario (1 a 2 veces al día - normal)' },
      { value: 'diario_frecuente', label: 'Más de 3 veces al día o heces blandas' },
      { value: 'dias_alternos', label: 'Cada 2 o 3 días' },
      { value: 'estrenimiento', label: 'Estreñimiento frecuente (menos de 3 veces por semana)' },
      { value: 'irregular', label: 'Alternancia de estreñimiento y diarrea' },
    ],
    patientVisible: true,
  },
  {
    id: 'foodAversions',
    label: 'Alimentos que te desagradan o no toleras',
    description: 'Comidas que no quieres que Eva incluya en tu plan por aversión o malestar',
    step: 3,
    stepTitle: 'Digestivo y metabolismo',
    type: 'textarea',
    placeholder: 'Ej: No me gusta el pescado blanco, no tolero el ajo crudo...',
    patientVisible: true,
  },
  {
    id: 'waterIntakeLiters',
    label: 'Consumo diario de agua',
    step: 3,
    stepTitle: 'Digestivo y metabolismo',
    type: 'number',
    unit: 'L/día',
    placeholder: '1.5',
    patientVisible: true,
  },
  {
    id: 'caffeineDaily',
    label: 'Cafés o tés al día',
    step: 3,
    stepTitle: 'Digestivo y metabolismo',
    type: 'number',
    placeholder: '2',
    patientVisible: true,
  },
  {
    id: 'alcoholFrequency',
    label: 'Consumo de alcohol',
    step: 3,
    stepTitle: 'Digestivo y metabolismo',
    type: 'select',
    options: [
      { value: 'none', label: 'Nunca o casi nunca' },
      { value: 'occasional', label: 'Ocasional (eventos o celebraciones puntuales)' },
      { value: 'weekend', label: 'Fines de semana (1-3 consumiciones)' },
      { value: 'daily', label: 'Diario o habitual' },
    ],
    patientVisible: true,
  },
  {
    id: 'smoking',
    label: '¿Fumas habitualmente?',
    step: 3,
    stepTitle: 'Digestivo y metabolismo',
    type: 'boolean',
    patientVisible: true,
  },

  // === PASO 4: ESTILO DE VIDA ===
  {
    id: 'workSchedule',
    label: 'Horario laboral o académico',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'select',
    options: [
      { value: 'morning', label: 'Jornada continua de mañanas' },
      { value: 'split', label: 'Jornada partida (mañana y tarde)' },
      { value: 'afternoon', label: 'Tardes' },
      { value: 'night', label: 'Nocturno' },
      { value: 'rotating', label: 'Turnos rotatorios' },
      { value: 'flexible', label: 'Teletrabajo / horario flexible' },
    ],
    patientVisible: true,
  },
  {
    id: 'sleepHours',
    label: 'Horas de sueño habituales por noche',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'number',
    unit: 'horas',
    placeholder: '7.5',
    patientVisible: true,
  },
  {
    id: 'sleepQuality',
    label: 'Calidad de tu descanso',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'select',
    options: [
      { value: 'good', label: 'Buena: me despierto con energía' },
      { value: 'regular', label: 'Regular: me despierto varias veces' },
      { value: 'poor', label: 'Mala: descanso poco reparador' },
      { value: 'insomnia', label: 'Insomnio o dificultad grave para conciliar' },
    ],
    patientVisible: true,
  },
  {
    id: 'stressLevel',
    label: 'Nivel habitual de estrés',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'select',
    options: [
      { value: 'low', label: 'Bajo y controlado' },
      { value: 'moderate', label: 'Moderado (asumible)' },
      { value: 'high', label: 'Alto' },
      { value: 'very_high', label: 'Muy alto o desbordante' },
    ],
    patientVisible: true,
  },
  {
    id: 'mealsPerDay',
    label: 'Número habitual de tomas al día',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'number',
    placeholder: '3',
    patientVisible: true,
  },
  {
    id: 'mealSchedule',
    label: 'Horarios orientativos de comidas',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'textarea',
    placeholder: 'Ej: Desayuno 08:00, comida 14:30, merienda 18:00, cena 21:30',
    patientVisible: true,
  },
  {
    id: 'eatsOut',
    label: '¿Con qué frecuencia comes fuera de casa?',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'select',
    options: [
      { value: 'never', label: 'Casi nunca' },
      { value: 'rarely', label: '1 vez cada 15 días o menos' },
      { value: 'weekly', label: '1-3 veces por semana' },
      { value: 'daily', label: 'A diario por motivos laborales' },
    ],
    patientVisible: true,
  },
  {
    id: 'cooksAtHome',
    label: '¿Cocinas tú habitualmente en casa?',
    step: 4,
    stepTitle: 'Estilo de vida',
    type: 'boolean',
    patientVisible: true,
  },

  // === PASO 5: ACTIVIDAD FÍSICA ===
  {
    id: 'activityLevel',
    label: 'Nivel general de actividad física',
    step: 5,
    stepTitle: 'Actividad física',
    type: 'select',
    options: [
      { value: 'SEDENTARY', label: 'Sedentario (trabajo de mesa, pocos pasos)' },
      { value: 'LIGHT', label: 'Ligero (caminatas suaves, 5.000-7.000 pasos)' },
      { value: 'MODERATE', label: 'Moderado (ejercicio 3-4 días/sem o trabajo activo)' },
      { value: 'ACTIVE', label: 'Activo (entrenamiento 5+ días/sem o trabajo físico)' },
      { value: 'VERY_ACTIVE', label: 'Muy activo / deportista de competición' },
    ],
    patientVisible: true,
  },
  {
    id: 'exerciseType',
    label: 'Tipo de ejercicio o deporte practicado',
    step: 5,
    stepTitle: 'Actividad física',
    type: 'textarea',
    placeholder: 'Ej: Fuerza en gimnasio, running, natación, crossfit, pádel...',
    patientVisible: true,
  },
  {
    id: 'exerciseFrequency',
    label: 'Días por semana que entrenas',
    step: 5,
    stepTitle: 'Actividad física',
    type: 'number',
    unit: 'días/sem',
    placeholder: '3',
    patientVisible: true,
  },
  {
    id: 'exerciseDuration',
    label: 'Duración media de cada sesión',
    step: 5,
    stepTitle: 'Actividad física',
    type: 'number',
    unit: 'minutos',
    placeholder: '60',
    patientVisible: true,
  },
  {
    id: 'exerciseTime',
    label: 'Momento habitual del entrenamiento',
    step: 5,
    stepTitle: 'Actividad física',
    type: 'select',
    options: [
      { value: 'morning', label: 'Mañanas (en ayunas o tras desayunar)' },
      { value: 'midday', label: 'A mediodía' },
      { value: 'afternoon', label: 'Tarde' },
      { value: 'evening', label: 'Noche' },
      { value: 'variable', label: 'Variable según el día' },
    ],
    patientVisible: true,
  },
  {
    id: 'sportGoals',
    label: 'Objetivos deportivos o marcas',
    step: 5,
    stepTitle: 'Actividad física',
    type: 'textarea',
    placeholder: 'Carreras, campeonatos o progresión de fuerza',
    patientVisible: true,
  },
  {
    id: 'trainingExperience',
    label: 'Experiencia entrenando',
    step: 5,
    stepTitle: 'Actividad física',
    type: 'select',
    options: [
      { value: 'beginner', label: 'Principiante (menos de 6 meses)' },
      { value: 'intermediate', label: 'Intermedio (1 a 3 años de entrenamiento continuo)' },
      { value: 'advanced', label: 'Avanzado (más de 3 años con constancia)' },
      { value: 'elite', label: 'Competición / Alto rendimiento' },
    ],
    patientVisible: true,
  },

  // === PASO 6: SALUD FEMENINA (CONDICIONAL: SOLO SEX === 'FEMALE') ===
  {
    id: 'menstrualCycle',
    label: 'Ciclo menstrual',
    description: 'Características del ciclo o etapa biológica',
    step: 6,
    stepTitle: 'Salud femenina',
    type: 'select',
    options: [
      { value: 'regular', label: 'Regular (26 a 32 días)' },
      { value: 'irregular', label: 'Irregular (ciclos cortos o largos variables)' },
      { value: 'amenorrhea', label: 'Amenorrea (ausencia de menstruación)' },
      { value: 'menopause', label: 'Menopausia o perimenopausia' },
      { value: 'not_applicable', label: 'No aplica' },
    ],
    conditionalOn: { fieldId: 'sex', equals: 'FEMALE' },
    patientVisible: true,
  },
  {
    id: 'pregnant',
    label: '¿Estás embarazada actualmente?',
    description: 'Paso crítico: requiere adaptación calórica y exclusión de alimentos crudos',
    step: 6,
    stepTitle: 'Salud femenina',
    type: 'boolean',
    isCritical: true,
    conditionalOn: { fieldId: 'sex', equals: 'FEMALE' },
    patientVisible: true,
  },
  {
    id: 'breastfeeding',
    label: '¿Estás en periodo de lactancia materna?',
    description: 'Paso crítico: demanda energética extra e hidratación aumentada',
    step: 6,
    stepTitle: 'Salud femenina',
    type: 'boolean',
    isCritical: true,
    conditionalOn: { fieldId: 'sex', equals: 'FEMALE' },
    patientVisible: true,
  },
  {
    id: 'contraceptive',
    label: 'Método anticonceptivo',
    step: 6,
    stepTitle: 'Salud femenina',
    type: 'select',
    options: [
      { value: 'none', label: 'Ninguno' },
      { value: 'hormonal_oral', label: 'Anticonceptivos hormonales orales (píldora)' },
      { value: 'diu_hormonal', label: 'DIU hormonal (Mirena/Kyleena)' },
      { value: 'diu_cobre', label: 'DIU de cobre (no hormonal)' },
      { value: 'barrier', label: 'Preservativo / barrera' },
      { value: 'other', label: 'Otro' },
    ],
    conditionalOn: { fieldId: 'sex', equals: 'FEMALE' },
    patientVisible: true,
  },
  {
    id: 'hormoneTherapy',
    label: 'Terapia hormonal sustitutiva o tratamiento de fertilidad',
    step: 6,
    stepTitle: 'Salud femenina',
    type: 'boolean',
    conditionalOn: { fieldId: 'sex', equals: 'FEMALE' },
    patientVisible: true,
  },

  // === PASO 7: OBJETIVOS Y PRIORIDADES ===
  {
    id: 'objective',
    label: 'Objetivo principal con Eva',
    step: 7,
    stepTitle: 'Objetivos',
    type: 'select',
    options: [
      { value: 'WEIGHT_LOSS', label: 'Pérdida de masa grasa y recomposición' },
      { value: 'MUSCLE_GAIN', label: 'Ganancia de masa muscular / volumen limpio' },
      { value: 'HEALTH_IMPROVEMENT', label: 'Mejora de salud digestiva / patología metabólica' },
      { value: 'SPORTS_PERFORMANCE', label: 'Rendimiento deportivo y optimización de energía' },
      { value: 'MAINTENANCE', label: 'Educación nutricional y mantenimiento' },
    ],
    patientVisible: true,
  },
  {
    id: 'shortTermGoal',
    label: '¿Qué te gustaría conseguir en las primeras 4-6 semanas?',
    step: 7,
    stepTitle: 'Objetivos',
    type: 'textarea',
    placeholder: 'Ej: Menos hinchazón digestiva, más energía, aprender a organizarme...',
    patientVisible: true,
  },
  {
    id: 'longTermGoal',
    label: 'Objetivo a 6-12 meses vista',
    step: 7,
    stepTitle: 'Objetivos',
    type: 'textarea',
    placeholder: 'Ej: Consolidar hábitos sostenibles, preparar media maratón...',
    patientVisible: true,
  },
  {
    id: 'motivation',
    label: '¿Cuál es tu principal motivo para dar este paso ahora?',
    step: 7,
    stepTitle: 'Objetivos',
    type: 'textarea',
    placeholder: 'Salud, bienestar general, recomendación médica...',
    patientVisible: true,
  },
  {
    id: 'previousDiets',
    label: 'Experiencia previa con otras dietas o profesionales',
    step: 7,
    stepTitle: 'Objetivos',
    type: 'textarea',
    placeholder: 'Qué pautas has seguido antes y qué sensaciones te dejaron',
    patientVisible: true,
  },
  {
    id: 'dietDuration',
    label: 'Compromiso estimado de seguimiento',
    step: 7,
    stepTitle: 'Objetivos',
    type: 'select',
    options: [
      { value: '3_months', label: '3 meses (cambio inicial de hábitos)' },
      { value: '6_months', label: '6 meses (consolidación media)' },
      { value: 'long_term', label: 'Largo plazo / seguimiento continuado' },
    ],
    patientVisible: true,
  },
  {
    id: 'additionalNotes',
    label: 'Notas adicionales o comentarios para Eva',
    step: 7,
    stepTitle: 'Objetivos',
    type: 'textarea',
    placeholder: 'Cualquier detalle que consideres importante compartir con Eva',
    patientVisible: true,
  },
]

/**
 * Analizador de Banderas Rojas Clínicas (Sección 5.4)
 * "Resumen con banderas rojas al recibir las respuestas"
 */
export interface ClinicalRedFlag {
  severity: 'HIGH' | 'MEDIUM' | 'INFO'
  category: 'ALLERGY' | 'MEDICATION' | 'DIGESTIVE' | 'PREGNANCY' | 'GLP1' | 'TCA' | 'LIFESTYLE'
  title: string
  description: string
  fieldId: string
}

export function analyzeRedFlags(answers: Record<string, unknown>): ClinicalRedFlag[] {
  const flags: ClinicalRedFlag[] = []

  // 1. Alergias
  const allergies = String(answers.allergies || '').trim().toLowerCase()
  if (allergies && !allergies.includes('ningun') && !allergies.includes('no const')) {
    flags.push({
      severity: 'HIGH',
      category: 'ALLERGY',
      title: 'Alergia alimentaria declarada',
      description: `El paciente declara alergia a: "${answers.allergies}". Requiere exclusión estricta en el motor de menús.`,
      fieldId: 'allergies',
    })
  }

  // 2. Intolerancias
  const intolerances = String(answers.intolerances || '').trim().toLowerCase()
  if (intolerances && !intolerances.includes('ningun') && !intolerances.includes('no const')) {
    flags.push({
      severity: 'MEDIUM',
      category: 'ALLERGY',
      title: 'Intolerancia alimentaria declarada',
      description: `Reporta intolerancia: "${answers.intolerances}".`,
      fieldId: 'intolerances',
    })
  }

  // 3. Medicación de alto impacto
  const meds = String(answers.currentMedications || '').trim().toLowerCase()
  if (meds && !meds.includes('ningun') && !meds.includes('no tom')) {
    const criticalMeds = [
      { term: 'sintrom', desc: 'Anticoagulante (interacción con vitamina K y verduras de hoja verde)' },
      { term: 'warfarina', desc: 'Anticoagulante (interacción con vitamina K)' },
      { term: 'levotiroxina', desc: 'Hormona tiroidea (requiere espaciar desayuno, soja, calcio y hierro)' },
      { term: 'eutirox', desc: 'Levotiroxina (espaciar ayuno de calcio y fibra)' },
      { term: 'metformina', desc: 'Antidiabético oral (precisa vigilar B12 y tolerancia gastrointestinal)' },
      { term: 'estatina', desc: 'Estatina (evitar pomelo y vigilar función hepática)' },
      { term: 'atorvastatina', desc: 'Estatina (evitar pomelo)' },
      { term: 'omiprazol', desc: 'IBP (puede reducir absorción de B12, hierro y magnesio)' },
      { term: 'omeprazol', desc: 'IBP (reduce absorción micronutrientes)' },
    ]

    for (const cm of criticalMeds) {
      if (meds.includes(cm.term)) {
        flags.push({
          severity: 'HIGH',
          category: 'MEDICATION',
          title: `Interacción farmacológica: ${cm.term.toUpperCase()}`,
          description: cm.desc,
          fieldId: 'currentMedications',
        })
      }
    }
  }

  // 4. Tratamiento GLP-1
  if (answers.isGLP1Treatment === true || String(answers.isGLP1Treatment) === 'true') {
    flags.push({
      severity: 'HIGH',
      category: 'GLP1',
      title: 'Tratamiento activo con análogos GLP-1',
      description: 'Requiere protocolo clínico GLP-1: asegurar 1.6-2.0 g/kg proteína para preservar masa magra e hidratación forzada.',
      fieldId: 'isGLP1Treatment',
    })
  }

  // 5. Embarazo o Lactancia
  if (answers.pregnant === true || String(answers.pregnant) === 'true') {
    flags.push({
      severity: 'HIGH',
      category: 'PREGNANCY',
      title: 'Embarazo activo declarado',
      description: 'Estado gestacional: exclusión de alimentos crudos (toxoplasmosis/listeria), control de cafeína y ácido fólico/yodo.',
      fieldId: 'pregnant',
    })
  }

  if (answers.breastfeeding === true || String(answers.breastfeeding) === 'true') {
    flags.push({
      severity: 'MEDIUM',
      category: 'PREGNANCY',
      title: 'Periodo de lactancia materna',
      description: 'Demanda energética incrementada (~+500 kcal) e hidratación clave.',
      fieldId: 'breastfeeding',
    })
  }

  // 6. Síntomas digestivos de alerta
  const dig = String(answers.digestiveIssues || '').toLowerCase()
  if (dig.includes('sangre') || dig.includes('sangrado') || dig.includes('dolor agudo') || dig.includes('vomito')) {
    flags.push({
      severity: 'HIGH',
      category: 'DIGESTIVE',
      title: 'Síntoma digestivo de alarma',
      description: 'Menciona sangrado, vómitos o dolor agudo. Requiere derivación o confirmación médica antes de pautar.',
      fieldId: 'digestiveIssues',
    })
  }

  // 7. Alcohol o tabaco habitual
  if (answers.alcoholFrequency === 'daily') {
    flags.push({
      severity: 'MEDIUM',
      category: 'LIFESTYLE',
      title: 'Consumo diario de alcohol',
      description: 'Consumo diario declarado; valorar impacto hepático, metabólico y de descanso.',
      fieldId: 'alcoholFrequency',
    })
  }

  // 8. Sueño e insomnio
  if (answers.sleepQuality === 'insomnia') {
    flags.push({
      severity: 'INFO',
      category: 'LIFESTYLE',
      title: 'Insomnio o descanso muy deficiente',
      description: 'Reporta insomnio crónico; condiciona grelina/leptina y apetito emocional.',
      fieldId: 'sleepQuality',
    })
  }

  return flags
}

/**
 * Detector de Conflictos entre el expediente actual y las respuestas del paciente
 * "Si una respuesta contradice lo que ya constaba (antes «sin alergias», ahora «alergia a frutos secos»), se marca en rojo."
 */
export interface FieldConflict {
  fieldId: string
  label: string
  currentValue: unknown
  newValue: unknown
  message: string
}

export function detectConflicts(
  currentRecord: Record<string, unknown>,
  newAnswers: Record<string, unknown>
): FieldConflict[] {
  const conflicts: FieldConflict[] = []

  for (const field of INTAKE_CATALOG) {
    const cur = currentRecord[field.id]
    const next = newAnswers[field.id]

    if (next === undefined || next === null || next === '') continue

    // Detectar si el valor previo constaba expresamente como negativo o vacío y el nuevo añade alertas
    if (field.isCritical) {
      const curStr = String(cur || '').trim().toLowerCase()
      const nextStr = String(next || '').trim().toLowerCase()

      if (curStr && nextStr && curStr !== nextStr) {
        conflicts.push({
          fieldId: field.id,
          label: field.label,
          currentValue: cur,
          newValue: next,
          message: `Cambio crítico respecto a la ficha previa (constaba "${cur}" y ahora declara "${next}")`,
        })
      }
    }
  }

  return conflicts
}
