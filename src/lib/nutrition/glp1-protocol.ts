/**
 * @file glp1-protocol.ts
 * @description Protocolo clínico nutricional para pacientes en tratamiento farmacológico
 * con agonistas del receptor GLP-1 (Semaglutida / Ozempic / Wegovy / Mounjaro / Tirzepatida).
 */

export interface GLP1NutritionTargets {
  targetProteinG: number
  proteinPerKgTarget: number
  minimumHydrationLiters: number
  recommendedMealsCount: number
  fiberTargetG: number
  clinicalNotes: string[]
  foodTips: string[]
}

/**
 * Calcula los objetivos nutricionales obligatorios para preservar masa muscular (SMM)
 * en pacientes bajo terapia GLP-1
 */
export function calculateGLP1Protocol(targetWeightKg: number): GLP1NutritionTargets {
  // Suelo proteico clínico recomendado por guías internacionales: 1.4 - 1.6 g/kg
  const proteinFactor = 1.5
  const targetProteinG = Math.round(targetWeightKg * proteinFactor)

  return {
    targetProteinG,
    proteinPerKgTarget: proteinFactor,
    minimumHydrationLiters: 2.5,
    recommendedMealsCount: 4, // 4 tomas pequeñas para evitar náuseas
    fiberTargetG: 28,
    clinicalNotes: [
      `Suelo proteico clínico fijado en ${proteinFactor} g/kg (${targetProteinG} g/día) para prevenir sarcopenia y pérdida de masa muscular esquelética (SMM).`,
      'El vaciado gástrico está enlentecido: las tomas deben ser de volumen moderado y masticación pausada.',
      'Riesgo elevado de estreñimiento severo si la hidratación desciende de 2.0 litros diarios.',
      'Control antropométrico riguroso: monitorizar que la masa muscular no caiga más de un 15% del total del peso perdido.',
    ],
    foodTips: [
      'Priorizar la proteína en primer lugar en cada comida antes que las guarniciones.',
      'Evitar frituras y comidas excesivamente ricas en grasas saturadas, que exacerban el reflujo y las náuseas.',
      'Separar la ingesta de agua 20-30 minutos de las comidas sólidas para no sobrecargar el estómago.',
      'Incluir frutas con piel y fibra soluble (kiwi, avena, semillas de lino o chía remojadas) para favorecer el tránsito regular.',
    ],
  }
}
