import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_MULTIPLIERS,
  calculateCalorieTarget,
  calculateTDEE,
  calculateTEF,
} from '@/lib/nutrition/tdee'

describe('TDEE (FAO/WHO/UNU)', () => {
  it('aplica el multiplicador de actividad', () => {
    expect(calculateTDEE(1800, 'sedentary')).toBe(2160)
    expect(calculateTDEE(1800, 'moderate')).toBe(2790)
    expect(calculateTDEE(1800, 'very_active')).toBe(3420)
  })

  it('mantiene la progresión de multiplicadores', () => {
    const values = Object.values(ACTIVITY_MULTIPLIERS)
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('rechaza valores no válidos', () => {
    expect(() => calculateTDEE(0, 'sedentary')).toThrow()
    expect(() => calculateTDEE(1800, 'invalid' as never)).toThrow()
  })
})

describe('TEF (efecto termogénico de los alimentos)', () => {
  it('calcula el 10 % por defecto', () => {
    expect(calculateTEF(2000)).toBe(200)
  })

  it('acepta tanto 10 como 0.10', () => {
    expect(calculateTEF(2000, 10)).toBe(200)
    expect(calculateTEF(2000, 0.1)).toBe(200)
  })

  it('rechaza porcentajes fuera de rango', () => {
    expect(() => calculateTEF(2000, 0.9)).toThrow()
    expect(() => calculateTEF(0)).toThrow()
  })
})

describe('objetivo calórico', () => {
  it('resta 500 kcal en pérdida de peso', () => {
    expect(calculateCalorieTarget(2500, 'weight_loss').calories).toBe(2000)
  })

  it('resta 750 kcal en pérdida agresiva', () => {
    expect(calculateCalorieTarget(2500, 'aggressive_loss').calories).toBe(1750)
  })

  it('suma 300 kcal en ganancia de masa', () => {
    expect(calculateCalorieTarget(2500, 'muscle_gain').calories).toBe(2800)
  })

  it('mantiene el mantenimiento sin cambios', () => {
    expect(calculateCalorieTarget(2500, 'maintenance').calories).toBe(2500)
  })
})
