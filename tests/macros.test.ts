import { describe, expect, it } from 'vitest'
import {
  MACRO_PRESETS,
  calculateMacros,
  calculateMacrosByBodyWeight,
  getMacroDistribution,
} from '@/lib/nutrition/macros'

describe('distribución de macros', () => {
  it('todas las distribuciones suman 100 %', () => {
    for (const [name, distribution] of Object.entries(MACRO_PRESETS)) {
      const total = distribution.proteinPct + distribution.carbsPct + distribution.fatPct
      expect(total, `distribución ${name}`).toBe(100)
    }
  })

  it('devuelve la distribución equilibrada por defecto', () => {
    expect(getMacroDistribution('balanced')).toEqual(MACRO_PRESETS.balanced)
  })

  it('usa la distribución equilibrada cuando el tipo es personalizado', () => {
    expect(getMacroDistribution('custom')).toEqual(MACRO_PRESETS.balanced)
  })

  it('rechaza un tipo de dieta inexistente', () => {
    expect(() => getMacroDistribution('inventada' as never)).toThrow()
  })
})

describe('cálculo de gramos de macros', () => {
  it('reparte las calorías según la distribución', () => {
    const macros = calculateMacros(2000, { proteinPct: 25, carbsPct: 50, fatPct: 25 })

    expect(macros.proteinG).toBe(125) // 2000 * 0.25 / 4
    expect(macros.carbsG).toBe(250) // 2000 * 0.5 / 4
    expect(macros.fatG).toBe(55.6) // 2000 * 0.25 / 9
    expect(macros.totalKcal).toBe(2000)
  })

  it('mantiene la suma de calorías dentro del objetivo', () => {
    const macros = calculateMacros(2200, MACRO_PRESETS.high_protein)
    expect(macros.totalKcal).toBeGreaterThan(2100)
    expect(macros.totalKcal).toBeLessThan(2300)
  })
})

describe('cálculo por peso corporal', () => {
  it('usa gramos por kilo para proteína y grasa', () => {
    const macros = calculateMacrosByBodyWeight(80, 1.6, 0.9, 2400)

    expect(macros.proteinG).toBe(128) // 80 kg * 1.6 g/kg
    expect(macros.fatG).toBe(72) // 80 kg * 0.9 g/kg
    expect(macros.carbsG).toBeGreaterThan(0)
  })
})
