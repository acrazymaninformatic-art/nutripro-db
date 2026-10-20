import { describe, expect, it } from 'vitest'
import {
  calculateAllBMR,
  calculateCunningham,
  calculateHarrisBenedict,
  calculateKatchMcArdle,
  calculateLeanMass,
  calculateMifflinStJeor,
} from '@/lib/nutrition/bmr'

const man = { weightKg: 80, heightCm: 180, ageYears: 40, sex: 'male' as const }
const woman = { weightKg: 65, heightCm: 165, ageYears: 35, sex: 'female' as const }

describe('masa libre de grasa', () => {
  it('calcula la masa magra a partir del porcentaje de grasa', () => {
    expect(calculateLeanMass(80, 20)).toBe(64)
    expect(calculateLeanMass(70, 25)).toBe(52.5)
  })

  it('rechaza pesos y porcentajes imposibles', () => {
    expect(() => calculateLeanMass(0, 20)).toThrow()
    expect(() => calculateLeanMass(80, 120)).toThrow()
  })
})

describe('Harris-Benedict revisado (Roza & Shizgal 1984)', () => {
  it('coincide con el valor de referencia en hombre', () => {
    // 88.362 + 13.397*80 + 4.799*180 - 5.677*40
    expect(calculateHarrisBenedict(man)).toBeCloseTo(1796.86, 1)
  })

  it('coincide con el valor de referencia en mujer', () => {
    // 447.593 + 9.247*65 + 3.098*165 - 4.33*35
    expect(calculateHarrisBenedict(woman)).toBeCloseTo(1408.27, 1)
  })

  it('exige valores positivos', () => {
    expect(() => calculateHarrisBenedict({ ...man, weightKg: 0 })).toThrow()
    expect(() => calculateHarrisBenedict({ ...man, ageYears: 0 })).toThrow()
  })
})

describe('Mifflin-St Jeor (1990)', () => {
  it('coincide con el valor de referencia en hombre', () => {
    // 10*80 + 6.25*180 - 5*40 + 5
    expect(calculateMifflinStJeor(man)).toBe(1730)
  })

  it('coincide con el valor de referencia en mujer', () => {
    // 10*65 + 6.25*165 - 5*35 - 161
    expect(calculateMifflinStJeor(woman)).toBeCloseTo(1345.25, 1)
  })
})

describe('fórmulas de composición corporal', () => {
  it('Katch-McArdle usa la masa magra', () => {
    // 370 + 21.6 * 64
    expect(calculateKatchMcArdle({ weightKg: 80, bodyFatPct: 20 })).toBeCloseTo(1752.4, 1)
  })

  it('Cunningham usa la masa magra', () => {
    // 500 + 22 * 64
    expect(calculateCunningham({ weightKg: 80, bodyFatPct: 20 })).toBeCloseTo(1908, 1)
  })
})

describe('calculateAllBMR', () => {
  it('devuelve siempre las dos fórmulas antropométricas', () => {
    const result = calculateAllBMR(man)
    expect(result.harrisBenedict).toBeGreaterThan(0)
    expect(result.mifflinStJeor).toBeGreaterThan(0)
    expect(result.katchMcArdle).toBeUndefined()
    expect(result.cunningham).toBeUndefined()
  })

  it('añade las fórmulas de composición cuando hay porcentaje de grasa', () => {
    const result = calculateAllBMR(man, 20)
    expect(result.katchMcArdle).toBeGreaterThan(0)
    expect(result.cunningham).toBeGreaterThan(0)
  })
})
