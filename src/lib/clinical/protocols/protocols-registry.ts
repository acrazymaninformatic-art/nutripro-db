/**
 * Registro de Protocolos Clínicos Especializados (EVSoftware Sección 5.9)
 * Metabólicos y renales, digestivos, etapas de la vida y casos específicos.
 */

export interface ClinicalProtocolDefinition {
  id: string
  category: 'METABOLIC_RENAL' | 'DIGESTIVE' | 'LIFE_STAGES' | 'SPECIFIC'
  name: string
  badge: string
  summary: string
  clinicalIndications: string[]
  phases?: Array<{
    id: string
    name: string
    durationWeeks?: number | string
    description: string
    keyGuidelines: string[]
    allowedFoods: string[]
    restrictedFoods: string[]
  }>
  keyNutrients: {
    name: string
    target: string
    notes: string
  }[]
  supplementsRecommended?: string[]
  warnings: string[]
}

export const CLINICAL_PROTOCOLS: ClinicalProtocolDefinition[] = [
  // === METABÓLICOS Y RENALES ===
  {
    id: 'DIABETES_CGM',
    category: 'METABOLIC_RENAL',
    name: 'Diabetes Mellitus y Monitorización Continua (CGM)',
    badge: 'Conteo HC & Ratios',
    summary: 'Protocolo de conteo de raciones de hidratos de carbono (1 ración = 10g HC en España), ratio insulina/HC, factor de sensibilidad y análisis de FreeStyle Libre o Dexcom.',
    clinicalIndications: [
      'Diabetes Tipo 1 y Tipo 2 con insulinoterapia o pautas avanzadas',
      'Diabetes Gestacional',
      'Pacientes con sensor continuo de glucosa (FreeStyle Libre 2/3, Dexcom G6/G7)',
    ],
    keyNutrients: [
      { name: 'Hidratos de carbono', target: 'Raciones pautadas según ratio I:HC', notes: 'Priorizar bajo índice glucémico y alta fibra' },
      { name: 'Fibra dietética', target: '≥ 35 g/día', notes: 'Especialmente soluble (ralentiza absorción de glucosa)' },
      { name: 'Grasas saturadas', target: '< 7% del VCT', notes: 'Prevención de riesgo cardiovascular' },
    ],
    warnings: [
      'Ajustar dosis de insulina rápida según raciones reales ingeridas y glucemia previa.',
      'Tener siempre a mano 15g de hidratos de acción rápida para la Regla del 15 ante hipoglucemias (< 70 mg/dL).',
    ],
  },
  {
    id: 'RENAL_CKD',
    category: 'METABOLIC_RENAL',
    name: 'Enfermedad Renal Crónica (ERC por Estadios)',
    badge: 'Proteínas, P, K & Na',
    summary: 'Pauta dietética ajustada al filtrado glomerular (Estadios 1-5 KDIGO): restricción proteica controlada en predialisis frente a reposición en diálisis, con manejo de fósforo y potasio.',
    clinicalIndications: [
      'ERC Estadios 3a, 3b, 4 (prediálisis: 0.6-0.8 g/kg/día proteína)',
      'ERC Estadio 5 en Hemodiálisis o DP (1.0-1.2 g/kg/día proteína)',
      'Hiperpotasemia e hiperfosfaturia',
    ],
    phases: [
      {
        id: 'PREDIALYSIS',
        name: 'Estadios 3-4 Prediálisis',
        description: 'Preservación de la función renal remanente y retraso de la uremia.',
        keyGuidelines: [
          'Proteínas: 0.6 - 0.8 g/kg peso seco/día (50% de alto valor biológico)',
          'Fósforo: < 800-1000 mg/día (evitar aditivos inorgánicos fosfatados E-338 a E-343)',
          'Potasio: < 2000-2500 mg/día si FG < 30 ml/min o hiperpotasemia',
          'Técnica de doble remojo y doble cocción para desmineralizar verduras y legumbres',
        ],
        allowedFoods: ['Clara de huevo', 'Pescados blancos en ración controlada', 'Arroz blanco', 'Manzana, pera'],
        restrictedFoods: ['Frutos secos', 'Cacao', 'Embutidos y quesos curados', 'Bebidas de cola y precocinados'],
      },
      {
        id: 'DIALYSIS',
        name: 'Estadio 5 en Terapia de Reemplazo (Hemodiálisis / DP)',
        description: 'Compensación de pérdidas proteicas dialíticas con restricción hídrica y de potasio.',
        keyGuidelines: [
          'Proteínas elevadas: 1.1 - 1.2 g/kg peso/día para evitar síndrome MIA (malnutrición-inflamación-aterosclerosis)',
          'Control estricto de líquidos: diuresis residual + 500 ml/día',
          'Sodio < 2000 mg/día',
        ],
        allowedFoods: ['Pescados frescos', 'Aves', 'Huevos', 'Pasta y arroz refinados'],
        restrictedFoods: ['Plátano, melón, aguacate (ricos en potasio)', 'Lácteos concentrados'],
      },
    ],
    keyNutrients: [
      { name: 'Sodio', target: '< 2.000 mg/día (< 5g sal)', notes: 'Evitar sobrecarga de volumen e HTA' },
      { name: 'Fósforo', target: '< 800 - 1.000 mg/día', notes: 'Relación fósforo/proteína < 16 mg/g' },
    ],
    warnings: [
      'Verificar siempre si el paciente toma quelantes de fósforo (deben ingerirse con las comidas).',
    ],
  },
  {
    id: 'DASH_HTA',
    category: 'METABOLIC_RENAL',
    name: 'Hipertensión Arterial y Dieta DASH',
    badge: 'Sodio < 1500mg & K/Mg/Ca',
    summary: 'Protocolo Dietary Approaches to Stop Hypertension (DASH) rico en potasio, magnesio y calcio con restricción de sodio (< 1500-2000 mg/día).',
    clinicalIndications: ['Hipertensión arterial esencial', 'Riesgo cardiovascular elevado', 'Insuficiencia cardíaca'],
    keyNutrients: [
      { name: 'Sodio', target: '< 1.500 - 2.000 mg/día', notes: 'Sustituir sal por hierbas aromáticas y especias' },
      { name: 'Potasio', target: '≥ 4.700 mg/día', notes: 'Frutas, verduras y legumbres (si función renal normal)' },
      { name: 'Calcio y Magnesio', target: 'DRI optimizado', notes: 'Lácteos desnatados, frutos secos y semillas' },
    ],
    warnings: ['Verificar compatibilidad de suplementos de potasio con IECA o ARA-II.'],
  },
  {
    id: 'DISLIPEMIA',
    category: 'METABOLIC_RENAL',
    name: 'Dislipemia y Riesgo Cardiovascular',
    badge: 'AGS < 7% & Fitoesteroles',
    summary: 'Manejo nutricional de hipercolesterolemia e hipertrigliceridemia con sustitución de grasas saturadas por mono/poliinsaturadas y fibra soluble.',
    clinicalIndications: ['Hipercolesterolemia aislada (LDL elevado)', 'Hipertrigliceridemia', 'Dislipemia mixta'],
    keyNutrients: [
      { name: 'Grasas saturadas', target: '< 7% de la energía total', notes: 'Reducir carnes grasas, nata y mantequilla' },
      { name: 'Fibra soluble / Betaglucanos', target: '≥ 10-15 g/día', notes: 'Avena, legumbres, cebada y psyllium' },
      { name: 'Omega-3 EPA + DHA', target: '1 - 2 g/día', notes: 'Pescado azul 2-3 veces/semana o aceite de algas' },
      { name: 'Fitoesteroles', target: '1.5 - 2.0 g/día', notes: 'Compiten por la absorción intestinal de colesterol' },
    ],
    warnings: ['En hipertrigliceridemia severa, eliminar azúcares simples y alcohol por completo.'],
  },
  {
    id: 'GOTA',
    category: 'METABOLIC_RENAL',
    name: 'Gota e Hiperuricemia',
    badge: 'Purinas < 150mg',
    summary: 'Pauta baja en purinas (< 150-200 mg/día), restricción de fructosa libre y alcohol, y alta alcalinización hídrica.',
    clinicalIndications: ['Crisis agudas de gota o tofos', 'Ácido úrico en sangre > 7.0 mg/dL'],
    keyNutrients: [
      { name: 'Purinas', target: '< 150 - 200 mg/día', notes: 'Excluir vísceras, mariscos, sardinas y extractos cárnicos' },
      { name: 'Agua', target: '≥ 2.5 - 3.0 Litros/día', notes: 'Favorecer eliminación renal de uratos' },
      { name: 'Fructosa', target: 'Baja en jarabes y refrescos', notes: 'La fructosa acelera degradación de nucleótidos a ácido úrico' },
    ],
    warnings: ['Las purinas de origen vegetal (lentejas, espárragos) no tienen el mismo impacto pro-gotoso que las animales.'],
  },
  {
    id: 'ANEMIA',
    category: 'METABOLIC_RENAL',
    name: 'Anemia Ferropénica y Déficit Nutricional',
    badge: 'Hierro Hemo & Potenciadores',
    summary: 'Protocolo de optimización de la biodisponibilidad del hierro, separación de inhibidores y asociación con vitamina C.',
    clinicalIndications: ['Anemia ferropénica', 'Ferritina baja (< 30 ng/mL) en mujeres o deportistas'],
    keyNutrients: [
      { name: 'Hierro hemo', target: '≥ 15 - 18 mg/día total', notes: 'Moluscos (almejas, mejillones), carnes magras' },
      { name: 'Vitamina C', target: '≥ 50-100 mg por toma rica en hierro', notes: 'Cítricos, kiwi, pimiento rojo crudo' },
    ],
    warnings: ['Separar lácteos, café, té y cacao al menos 1.5 horas antes y después de comidas principales con hierro.'],
  },

  // === DIGESTIVOS ===
  {
    id: 'CELIAQUIA',
    category: 'DIGESTIVE',
    name: 'Enfermedad Celíaca y Sensibilidad al Gluten',
    badge: 'Sin Gluten Estricto < 20ppm',
    summary: 'Eliminación permanente y total del gluten en alimentos, aditivos y medicamentos, con control riguroso de contaminación cruzada.',
    clinicalIndications: ['Celiaquía confirmada (biopsia / serología)', 'Sensibilidad al gluten no celíaca', 'Dermatitis herpetiforme'],
    keyNutrients: [
      { name: 'Gluten', target: '0 ppm (límite legal < 20 ppm)', notes: 'Excluir trigo, cebada, centeno, espelta y kamut' },
      { name: 'Avena', target: 'Solo si certificada sin gluten', notes: 'Introducir con precaución tras remisión' },
    ],
    warnings: ['Atención a la contaminación cruzada en tostadoras, freidoras compartidas y tablas de corte de madera.'],
  },
  {
    id: 'FODMAP_PHASES',
    category: 'DIGESTIVE',
    name: 'Protocolo FODMAP por Fases (SII / SIBO)',
    badge: '3 Fases & Diario Síntomas',
    summary: 'Protocolo de tres fases desarrollado por la Universidad de Monash para el Síndrome de Intestino Irritable y sobrecrecimiento bacteriano (SIBO).',
    clinicalIndications: ['Síndrome del Intestino Irritable (SII)', 'SIBO en fase de mantenimiento', 'Meteorismo y distensión abdominal'],
    phases: [
      {
        id: 'ELIMINATION',
        name: 'Fase 1: Eliminación Estricta',
        durationWeeks: '2 - 6 semanas',
        description: 'Supresión total de alimentos con alto contenido en oligosacáridos, disacáridos, monosacáridos y polioles fermentables.',
        keyGuidelines: [
          'Evaluar alivio de síntomas digestivos (escala Bristol, dolor y distensión)',
          'No prolongar más de 6 semanas para no empobrecer la microbiota intestinal beneficiosa',
        ],
        allowedFoods: ['Arroz', 'Avena', 'Pollo', 'Huevos', 'Zanahoria', 'Calabacín', 'Fresas', 'Plátano verde'],
        restrictedFoods: ['Ajo, cebolla', 'Manzana, pera', 'Legumbres no procesadas', 'Lácteos con lactosa', 'Trigo'],
      },
      {
        id: 'REINTRODUCTION',
        name: 'Fase 2: Reintroducción Reglada',
        durationWeeks: '6 - 8 semanas',
        description: 'Pruebas individuales de tolerancia por grupos FODMAP durante 3 días con dosis crecientes.',
        keyGuidelines: [
          'Día 1: Dosis baja | Día 2: Dosis media | Día 3: Dosis alta | Días 4-6: Lavado (vuelta a Fase 1)',
          'Grupos a testar por separado: Fructosa (miel), Sorbitol (aguacate), Manitol (champiñón), Lactosa (leche), Fructanos (ajo/cebolla/trigo), GOS (lentejas)',
        ],
        allowedFoods: ['Alimentos Fase 1 + alimento de prueba'],
        restrictedFoods: ['Resto de grupos FODMAP pendientes de testar'],
      },
      {
        id: 'PERSONALIZATION',
        name: 'Fase 3: Personalización a Largo Plazo',
        durationWeeks: 'Permanente',
        description: 'Reincorporación de todos los FODMAP tolerados y modulación de dosis de los parcialmente tolerados.',
        keyGuidelines: [
          'Maximizar la diversidad de plantas (> 30 plantas distintas a la semana)',
          'Mantener solo las restricciones estrictamente necesarias para el confort digestivo',
        ],
        allowedFoods: ['Dieta amplia adaptada a tolerancias personales'],
        restrictedFoods: ['Solo los grupos desencadenantes comprobados'],
      },
    ],
    keyNutrients: [
      { name: 'Fibra soluble no fermentable', target: '20 - 25 g/día', notes: 'Goma guar parcialmente hidrolizada (PHGG) o psyllium suave' },
    ],
    warnings: ['La Fase 1 no es una dieta para siempre; la reintroducción es obligatoria para la salud del microbioma.'],
  },
  {
    id: 'EII_SIBO',
    category: 'DIGESTIVE',
    name: 'Enfermedad Inflamatoria Intestinal (EII) y SIBO',
    badge: 'Remisión & Reparación Mucosa',
    summary: 'Manejo en brote frente a remisión en Crohn y Colitis Ulcerosa, y apoyo durante tratamiento antibiótico/herbal de SIBO.',
    clinicalIndications: ['Crohn', 'Colitis Ulcerosa', 'Sobrecrecimiento bacteriano (SIBO hidrógeno / metano)'],
    keyNutrients: [
      { name: 'Proteína', target: '1.2 - 1.5 g/kg/día', notes: 'Reparación de la mucosa y prevención de sarcopenia' },
      { name: 'Glutamina y Zinc', target: 'Dosis clínica', notes: 'Soporte de la integridad de las uniones estrechas intestinales' },
    ],
    warnings: ['En brote activo agudo de EII, reducir fibra insoluble y residuos; en remisión, aumentar progresivamente.'],
  },

  // === ETAPAS DE LA VIDA ===
  {
    id: 'EMBARAZO_LACTANCIA',
    category: 'LIFE_STAGES',
    name: 'Embarazo, Posparto y Lactancia Materna',
    badge: 'IOM, Folatos & Seguridad',
    summary: 'Ajuste calórico trimestral, suplementación esencial (ácido fólico, yodo, B12, hierro, colina) y normas estrictas de seguridad alimentaria.',
    clinicalIndications: ['Gestación (1T, 2T, 3T)', 'Lactancia materna exclusiva o mixta'],
    keyNutrients: [
      { name: 'Ácido fólico', target: '400 - 800 µg/día', notes: 'Metilfolato preferente; prevención de defectos del tubo neural' },
      { name: 'Yodo', target: '200 µg/día', notes: 'Desarrollo neurológico fetal y tiroides materna' },
      { name: 'Calorías adicionales', target: '+85 kcal (1T), +285 kcal (2T), +475 kcal (3T), +500 kcal (Lactancia)', notes: 'Ajustadas según IMC previo' },
      { name: 'DHA', target: '≥ 200 mg/día', notes: 'Desarrollo cerebral y visual del lactante' },
    ],
    warnings: [
      'Seguridad alimentaria: prohibidos quesos de leche cruda (listeria), carnes crudas/embutidos curados si toxoplasma negativa, y grandes túnidos/pez espada (mercurio).',
    ],
  },
  {
    id: 'PEDIATRIA',
    category: 'LIFE_STAGES',
    name: 'Pediatría y Alimentación Complementaria (BLW)',
    badge: 'Curvas OMS & Alérgenos',
    summary: 'Alimentación infantil desde los 6 meses: método Baby-Led Weaning (BLW) frente a triturados, introducción sistemática de alérgenos y alimentos prohibidos < 1 año.',
    clinicalIndications: ['Inicio de AC (6-12 meses)', 'Niños pequeños (1-5 años)', 'Retraso de crecimiento o selectividad'],
    keyNutrients: [
      { name: 'Hierro', target: 'Prioridad absoluta desde los 6 meses', notes: 'Carnes, pescados, yema de huevo o legumbres ricas en hierro' },
    ],
    warnings: [
      'Alimentos estrictamente prohibidos < 1 año: miel (riesgo de botulismo infantil), sal, azúcar, verduras de hoja alta en nitratos (espinacas/acelgas en exceso), y frutos secos enteros (riesgo de atragantamiento hasta los 4-5 años).',
    ],
  },
  {
    id: 'MENOPAUSIA',
    category: 'LIFE_STAGES',
    name: 'Perimenopausia y Menopausia',
    badge: 'Densidad Ósea & Masa Magra',
    summary: 'Estrategia metabólica para mitigar la redistribución de grasa androide, preservar masa muscular y optimizar el metabolismo óseo.',
    clinicalIndications: ['Perimenopausia', 'Posmenopausia', 'Osteopenia / Osteoporosis'],
    keyNutrients: [
      { name: 'Calcio', target: '1.200 mg/día', notes: 'Lácteos, sésamo, semillas de chía, almendras y aguas mineralizadas' },
      { name: 'Vitamina D3 + K2', target: '800 - 2.000 UI/día', notes: 'Fijación de calcio en matriz ósea' },
      { name: 'Proteína', target: '1.2 - 1.5 g/kg/día', notes: 'Estimulación de síntesis proteica muscular junto a ejercicio de fuerza' },
    ],
    warnings: ['Acompañar siempre de entrenamiento de fuerza con sobrecarga progresiva.'],
  },

  // === CASOS ESPECÍFICOS ===
  {
    id: 'BARIATRICA',
    category: 'SPECIFIC',
    name: 'Cirugía Bariátrica por Fases (Manga / Bypass)',
    badge: '4 Fases Posquirúrgicas',
    summary: 'Transición progresiva de texturas para proteger la línea de sutura gástrica, asegurar aporte proteico mínimo de 60-80 g/día y prevenir síndrome de dumping.',
    clinicalIndications: ['Manga gástrica (Sleeve)', 'Bypass gástrico en Y de Roux', 'Cirugía de revisión'],
    phases: [
      {
        id: 'PHASE_1_CLEAR',
        name: 'Fase 1: Líquidos Claros (Días 1 a 7)',
        description: 'Hidratación y descanso gástrico con líquidos transparentes a pequeños sorbos.',
        keyGuidelines: ['Beber 1.5 L en sorbos de 30 ml cada 15 min', 'Sin azúcar ni gas', 'Caldos desgrasados, infusiones'],
        allowedFoods: ['Caldo de verduras o pollo filtrado', 'Infusiones suaves', 'Agua mineral'],
        restrictedFoods: ['Lácteos', 'Zumos', 'Alimentos sólidos'],
      },
      {
        id: 'PHASE_2_FULL_LIQUID',
        name: 'Fase 2: Líquida Completa Hiperproteica (Días 8 a 21)',
        description: 'Inicio de batidos de aislado de proteína de suero y caldos enriquecidos.',
        keyGuidelines: ['Alcanzar ≥ 60-70g de proteína/día', 'Batidos de proteína whey isolate sin azúcar'],
        allowedFoods: ['Proteína aislada (whey isolate)', 'Leche o bebida vegetal sin azúcar', 'Yogur líquido natural proteico'],
        restrictedFoods: ['Comida sólida', 'Fibra gruesa'],
      },
      {
        id: 'PHASE_3_PUREE',
        name: 'Fase 3: Purés Homogéneos y Papillas (Semanas 4 a 6)',
        description: 'Textura puré suave sin tropezones ni hebras.',
        keyGuidelines: ['Masticar mentalmente', 'Priorizar la porción de proteína antes que el puré de verdura'],
        allowedFoods: ['Pescado blanco triturado con caldo', 'Pollo triturado fino', 'Huevo revuelto muy suave', 'Queso fresco batido'],
        restrictedFoods: ['Trozos enteros', 'Carnes fibrosas'],
      },
      {
        id: 'PHASE_4_SOFT_SOLID',
        name: 'Fase 4: Sólidos Suaves y Masticación Concienzuda (Semana 7 en adelante)',
        description: 'Reintroducción gradual de alimentos sólidos bien tolerados.',
        keyGuidelines: [
          'Regla de oro: masticar 20-30 veces cada bocado',
          'Separar líquidos de sólidos (no beber 30 min antes ni 30 min después de comer)',
          'Suplementación multivitamínica bariátrica específica de por vida',
        ],
        allowedFoods: ['Pescados al vapor', 'Carnes picadas magras', 'Tortilla francesa', 'Verduras cocidas tiernas'],
        restrictedFoods: ['Arroz blanco seco', 'Pan tierno gomoso', 'Carnes rojas duras', 'Bebidas carbonatadas'],
      },
    ],
    keyNutrients: [
      { name: 'Proteína diaria', target: '60 - 80 g/día mínimo', notes: 'Prevención de alopecia y pérdida de masa muscular' },
    ],
    warnings: ['Nunca beber líquidos durante la comida (provoca vómitos o paso rápido del alimento sin saciedad).'],
  },
  {
    id: 'DISFAGIA_IDDSI',
    category: 'SPECIFIC',
    name: 'Disfagia Orofaringea y Texturas IDDSI',
    badge: 'Niveles IDDSI 0 - 7',
    summary: 'Adaptación estandarizada internacional (International Dysphagia Diet Standardisation Initiative) para líquidos espesados y sólidos modificados.',
    clinicalIndications: ['Ictus / ACV', 'Enfermedades neurodegenerativas (Parkinson, ELA, demencias)', 'Cáncer de cabeza y cuello'],
    phases: [
      {
        id: 'IDDSI_LIQUIDS',
        name: 'Líquidos Espesados (Niveles 0 a 4)',
        description: 'Adaptación de bebidas según viscosidad requerida para prevenir aspiraciones a vía aérea.',
        keyGuidelines: [
          'Nivel 0: Fino | Nivel 1: Ligeramente espeso | Nivel 2: Poco espeso (Néctar) | Nivel 3: Moderadamente espeso (Miel) | Nivel 4: Extremadamente espeso (Pudding)',
          'Utilizar espesantes a base de goma xantana (no modifican sabor ni alteran viscosidad con la amilasa salival)',
        ],
        allowedFoods: ['Agua y zumos con dosificador exacto de espesante', 'Suplementos orales adaptados'],
        restrictedFoods: ['Líquidos libres no espesados', 'Hielo'],
      },
      {
        id: 'IDDSI_SOLIDS',
        name: 'Alimentos Modificados (Niveles 3 a 7)',
        description: 'Control de textura de sólidos para facilitar formación y propulsión del bolo.',
        keyGuidelines: [
          'Nivel 4: Puré homogéneo sin grumos | Nivel 5: Picado y húmedo (4mm) | Nivel 6: Suave y tamaño bocado (15mm) | Nivel 7: Fácil de masticar',
          'Evitar dobles texturas (ej. sopa con fideos, naranja con líquido y pulpa)',
        ],
        allowedFoods: ['Purés texturizados', 'Flanes y gelatinas específicas para disfagia'],
        restrictedFoods: ['Doble textura (líquido + sólido)', 'Alimentos pegajosos (pan blanco de molde) o crujientes (galletas secas)'],
      },
    ],
    keyNutrients: [
      { name: 'Hidratación', target: '≥ 1.500 ml/día', notes: 'Monitorear estreñimiento e infecciones urinarias por deshidratación' },
    ],
    warnings: ['Las dobles texturas son el mayor riesgo de broncoaspiración e infección respiratoria.'],
  },
  {
    id: 'DEPORTE',
    category: 'SPECIFIC',
    name: 'Nutrición Deportiva y Periodización',
    badge: 'Periodización & Carga HC',
    summary: 'Ajuste nutricional según microciclo de entrenamiento, cargas pre-competición (8-10 g/kg) y reposición glucogénica e hidroelectrolítica.',
    clinicalIndications: ['Deportistas de resistencia (running, ciclismo, triatlón)', 'Deportes de fuerza y crossfit'],
    keyNutrients: [
      { name: 'Carbohidratos pre-competición', target: '8 - 10 g/kg/día (36-48h antes)', notes: 'Saturación máxima de glucógeno muscular y hepático' },
      { name: 'Intra-entrenamiento', target: '30 - 90 g HC/hora (ratio 1:0.8 glucosa:fructosa)', notes: 'En esfuerzos superiores a 75-90 minutos' },
      { name: 'Sodio', target: '500 - 1.000 mg Na/hora', notes: 'En sudoración profusa o calor ambiental' },
    ],
    warnings: ['Entrenar el estómago y los geles previamente en tiradas largas; nunca experimentar en competición.'],
  },
  {
    id: 'KETO',
    category: 'SPECIFIC',
    name: 'Dieta Cetogénica Clínica (Keto)',
    badge: '70-75% Grasa & < 30g HC',
    summary: 'Protocolo de inducción de cetosis nutricional fisiológica con restricción estricta de carbohidratos netos y suplementación de electrolitos.',
    clinicalIndications: ['Epilepsia refractaria', 'Síndrome de ovario poliquístico (SOP)', 'Control glucémico en obesidad severa'],
    keyNutrients: [
      { name: 'Grasas saludables', target: '70 - 75% del VCT', notes: 'AOVE, aguacate, aceite de coco/MCT, pescado azul' },
      { name: 'Proteína moderada', target: '20 - 25% del VCT', notes: 'Evitar exceso de gluconeogénesis' },
      { name: 'Carbohidratos netos', target: '< 30 - 50 g/día', notes: 'Descontando fibra' },
      { name: 'Electrolitos', target: 'Sodio 4-5g, Potasio 3g, Magnesio 400mg', notes: 'Prevención del "keto flu" en la primera semana' },
    ],
    warnings: ['Contraindicada en porfiria, déficit de carnitina y pancreatitis aguda.'],
  },
]

// === HERRAMIENTA CGM: PARSER CONTINUOUS GLUCOSE MONITORING (FreeStyle Libre & Dexcom) ===
export interface CGMAnalysisSummary {
  recordCount: number
  meanGlucoseMgDl: number
  gmiEstimatedHba1c: number // GMI = 3.31 + (0.02392 * media)
  timeInRangePct: number // 70 - 180 mg/dL (target > 70%)
  timeAboveRangePct: number // > 180 mg/dL (target < 25%)
  timeVeryHighPct: number // > 250 mg/dL (target < 5%)
  timeBelowRangePct: number // < 70 mg/dL (target < 4%)
  timeVeryLowPct: number // < 54 mg/dL (target < 1%)
  coefficientOfVariationPct: number // CV = (SD / Media) * 100 (target ≤ 36%)
  assessment: string
}

export function parseCGMData(glucoseReadings: number[]): CGMAnalysisSummary {
  if (glucoseReadings.length === 0) {
    throw new Error('No se han proporcionado lecturas de glucosa para el análisis.')
  }

  const n = glucoseReadings.length
  const sum = glucoseReadings.reduce((acc, v) => acc + v, 0)
  const mean = sum / n

  // Standard deviation
  const variance = glucoseReadings.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n
  const sd = Math.sqrt(variance)
  const cv = (sd / mean) * 100

  // GMI calculation (consensus formula)
  const gmi = 3.31 + 0.02392 * mean

  // Ranges
  const inRange = glucoseReadings.filter((g) => g >= 70 && g <= 180).length
  const aboveRange = glucoseReadings.filter((g) => g > 180 && g <= 250).length
  const veryHigh = glucoseReadings.filter((g) => g > 250).length
  const belowRange = glucoseReadings.filter((g) => g >= 54 && g < 70).length
  const veryLow = glucoseReadings.filter((g) => g < 54).length

  const tirPct = Math.round((inRange / n) * 1000) / 10
  const tarPct = Math.round(((aboveRange + veryHigh) / n) * 1000) / 10
  const veryHighPct = Math.round((veryHigh / n) * 1000) / 10
  const tbrPct = Math.round(((belowRange + veryLow) / n) * 1000) / 10
  const veryLowPct = Math.round((veryLow / n) * 1000) / 10
  const cvPct = Math.round(cv * 10) / 10

  let assessment = 'Excelente control glucémico: TIR > 70% y variabilidad estable (CV ≤ 36%).'
  if (tbrPct > 4) {
    assessment = 'Alerta de Hipoglucemias: Tiempo bajo rango > 4%. Requiere reducir dosis basal o aumentar colación nocturna.'
  } else if (tarPct > 25) {
    assessment = 'Hiperglucemias frecuentes: Tiempo sobre rango > 25%. Requiere revisar conteo de hidratos o ratio I:HC.'
  } else if (cvPct > 36) {
    assessment = 'Alta variabilidad glucémica (CV > 36%). Se recomiendan hidratos de absorción más lenta y espaciar ingestas.'
  }

  return {
    recordCount: n,
    meanGlucoseMgDl: Math.round(mean),
    gmiEstimatedHba1c: Math.round(gmi * 10) / 10,
    timeInRangePct: tirPct,
    timeAboveRangePct: tarPct,
    timeVeryHighPct: veryHighPct,
    timeBelowRangePct: tbrPct,
    timeVeryLowPct: veryLowPct,
    coefficientOfVariationPct: cvPct,
    assessment,
  }
}

// === CALCULADORA DE CONTEO DE RACIONES E INSULINA ===
export function calculateInsulinCarbBolus({
  carbGrams,
  insulinCarbRatio, // Gramos de HC cubiertos por 1 unidad de insulina (e.g. 10g o 15g)
  currentGlucose,
  targetGlucose = 100,
  correctionFactor = 50, // Sensibilidad: mg/dL que baja 1 unidad de insulina
}: {
  carbGrams: number
  insulinCarbRatio: number
  currentGlucose?: number
  targetGlucose?: number
  correctionFactor?: number
}): {
  carbPortionsSpain: number // 1 ración = 10g
  foodBolusUnits: number
  correctionBolusUnits: number
  totalRecommendedBolusUnits: number
} {
  const carbPortionsSpain = Math.round((carbGrams / 10) * 10) / 10
  const foodBolus = carbGrams / insulinCarbRatio

  let correctionBolus = 0
  if (currentGlucose && currentGlucose > targetGlucose) {
    correctionBolus = (currentGlucose - targetGlucose) / correctionFactor
  }

  const total = Math.max(0, foodBolus + correctionBolus)

  return {
    carbPortionsSpain,
    foodBolusUnits: Math.round(foodBolus * 10) / 10,
    correctionBolusUnits: Math.round(correctionBolus * 10) / 10,
    totalRecommendedBolusUnits: Math.round(total * 10) / 10,
  }
}
