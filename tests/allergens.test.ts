import { describe, expect, it } from 'vitest'
import {
  checkPatientAllergenConflict,
  detectAllergensInFood,
  scanPlanForAllergenConflicts,
} from '@/lib/nutrition/allergens'

describe('detección de alérgenos', () => {
  it('detecta alérgenos declarados en la ficha del alimento', () => {
    const detected = detectAllergensInFood({
      name: 'Bebida vegetal de avena',
      allergensJson: JSON.stringify(['GLUTEN']),
    })
    expect(detected.some((item) => item.allergenId === 'GLUTEN')).toBe(true)
  })

  it('respeta excepciones seguras como "sin gluten"', () => {
    const detected = detectAllergensInFood({ name: 'Pan sin gluten' })
    expect(detected.some((item) => item.allergenId === 'GLUTEN')).toBe(false)
  })

  it('marca alergia crítica frente a intolerancia', () => {
    const food = { name: 'Leche entera', category: 'Lácteos' }

    const allergy = checkPatientAllergenConflict(food, { allergies: 'leche' })
    expect(allergy?.severity).toBe('CRITICAL_ALLERGY')

    const intolerance = checkPatientAllergenConflict(food, { intolerances: 'lactosa' })
    expect(intolerance?.severity).toBe('INTOLERANCE')
  })

  it('detecta alergias declaradas fuera de los 14 alérgenos oficiales', () => {
    const allergy = checkPatientAllergenConflict(
      { name: 'Kiwi' },
      { allergies: 'alergia al kiwi, melocotón' }
    )
    expect(allergy?.severity).toBe('CRITICAL_ALLERGY')
    expect(allergy?.matchedPatientTerm).toBe('kiwi')

    const intolerance = checkPatientAllergenConflict(
      { name: 'Melocotón en almíbar' },
      { intolerances: 'intolerancia al melocotón' }
    )
    expect(intolerance?.severity).toBe('INTOLERANCE')
  })

  it('no reintroduce alérgenos oficiales con excepción segura ni falsos positivos por subcadena', () => {
    expect(
      checkPatientAllergenConflict({ name: 'Pan sin gluten' }, { allergies: 'gluten' })
    ).toBeNull()
    expect(
      checkPatientAllergenConflict({ name: 'Salmón fresco' }, { allergies: 'sal' })
    ).toBeNull()
  })
})

describe('escaneo completo del plan', () => {
  it('detecta alérgenos ocultos en ingredientes de recetas', () => {
    const plan = {
      days: [
        {
          dayNumber: 1,
          meals: [
            {
              mealType: 'LUNCH',
              items: [
                {
                  recipe: {
                    name: 'Salsa de queso',
                    servings: 2,
                    ingredients: [
                      { quantityG: 100, food: { name: 'Queso curado', category: 'Lácteos' } },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    const conflicts = scanPlanForAllergenConflicts(plan, {
      allergies: 'lácteos',
      firstName: 'Ana',
    })

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].recipeName).toBe('Salsa de queso')
    expect(conflicts[0].foodName).toBe('Queso curado')
    expect(conflicts[0].conflict.severity).toBe('CRITICAL_ALLERGY')
  })

  it('no bloquea un plan sin alérgenos declarados por el paciente', () => {
    const plan = {
      days: [
        {
          dayNumber: 1,
          meals: [
            {
              mealType: 'LUNCH',
              items: [{ food: { name: 'Pechuga de pollo', category: 'Carnes' } }],
            },
          ],
        },
      ],
    }
    expect(scanPlanForAllergenConflicts(plan, { allergies: 'frutos secos' })).toHaveLength(0)
  })
})
