import { describe, expect, it } from 'vitest'
import { calculateFoodExchanges, FOOD_EXCHANGE_GROUPS } from '@/lib/nutrition/exchange-system'
import { calculateAgeAtDate, isMinorAtDate } from '@/lib/patient-age'

describe('sistema de intercambios (CESNID)', () => {
  it('convierte carbohidratos, proteínas y grasa en intercambios', () => {
    const result = calculateFoodExchanges({ carbsG: 30, proteinG: 20, fatG: 10 })

    expect(result.carbsExchanges).toBe(3)
    expect(result.proteinExchanges).toBe(2)
    expect(result.fatExchanges).toBe(1)
  })

  it('redondea a un decimal', () => {
    const result = calculateFoodExchanges({ carbsG: 12, proteinG: 7, fatG: 3 })
    expect(result.carbsExchanges).toBe(1.2)
    expect(result.proteinExchanges).toBe(0.7)
    expect(result.fatExchanges).toBe(0.3)
  })

  it('devuelve 0 intercambios para un alimento sin macronutrientes', () => {
    const result = calculateFoodExchanges({ carbsG: 0, proteinG: 0, fatG: 0 })
    expect(result.carbsExchanges).toBe(0)
    expect(result.proteinExchanges).toBe(0)
    expect(result.fatExchanges).toBe(0)
  })

  it('mantiene los grupos de intercambio con su descripción', () => {
    expect(Object.keys(FOOD_EXCHANGE_GROUPS).length).toBeGreaterThan(0)
    for (const group of Object.values(FOOD_EXCHANGE_GROUPS)) {
      expect(group.name).toBeTruthy()
    }
  })
})

describe('edad del paciente', () => {
  const reference = new Date('2026-06-15T00:00:00Z')

  it('calcula la edad exacta en años completados', () => {
    expect(calculateAgeAtDate('1990-01-01', reference)).toBe(36)
    expect(calculateAgeAtDate('2000-06-15', reference)).toBe(26)
  })

  it('resta un año si aún no ha cumplido en la fecha de referencia', () => {
    expect(calculateAgeAtDate('1990-07-01', reference)).toBe(35)
    expect(calculateAgeAtDate('1990-06-14', reference)).toBe(36)
  })

  it('detecta menores de edad', () => {
    expect(isMinorAtDate('2015-01-01', reference)).toBe(true)
    expect(isMinorAtDate('2005-01-01', reference)).toBe(false)
  })
})
