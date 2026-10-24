import { describe, expect, it } from 'vitest'
import { defaultMenuSettings } from '@/lib/menu-config'
import { validateMenuSettings } from '@/lib/menu-settings-validation'

function validSettings() {
  return structuredClone(defaultMenuSettings({ targetKcal: 2000 }))
}

describe('validación de la configuración del menú', () => {
  it('acepta la configuración por defecto y conserva los objetivos por día', () => {
    const settings = validSettings()
    settings.perDayOverrides = { '2': { proteinG: 150 } }

    const parsed = validateMenuSettings(settings)

    expect(parsed.dailyTargets.kcal).toBe(2000)
    expect(parsed.perDayOverrides['2']).toEqual({ proteinG: 150 })
    expect(parsed.ingestas).toHaveLength(5)
  })

  it('rechaza objetivos fuera de rango', () => {
    const settings = validSettings()
    settings.dailyTargets.kcal = 20_000

    expect(() => validateMenuSettings(settings)).toThrow(/entre 0 y 10000/)
  })

  it('rechaza días de override no válidos', () => {
    const settings = validSettings()
    settings.perDayOverrides = JSON.parse('{"__proto__":{"kcal":2000}}') as Record<string, { kcal: number }>

    expect(() => validateMenuSettings(settings)).toThrow(/día no válido/)
  })

  it('rechaza ingestas duplicadas por tipo u orden', () => {
    const duplicatedType = validSettings()
    duplicatedType.ingestas[1] = { ...duplicatedType.ingestas[1], mealType: duplicatedType.ingestas[0].mealType }
    expect(() => validateMenuSettings(duplicatedType)).toThrow(/duplicado/)

    const duplicatedOrder = validSettings()
    duplicatedOrder.ingestas[1] = { ...duplicatedOrder.ingestas[1], order: duplicatedOrder.ingestas[0].order }
    expect(() => validateMenuSettings(duplicatedOrder)).toThrow(/duplicado/)
  })

  it('rechaza horas y fórmulas no válidas', () => {
    const invalidTime = validSettings()
    invalidTime.ingestas[0] = { ...invalidTime.ingestas[0], time: '25:99' }
    expect(() => validateMenuSettings(invalidTime)).toThrow(/hora/)

    const invalidFormula = validSettings()
    invalidFormula.autoCalc = { ...invalidFormula.autoCalc, formula: 'OTRA' as typeof invalidFormula.autoCalc.formula }
    expect(() => validateMenuSettings(invalidFormula)).toThrow(/fórmula/)
  })

  it('rechaza un override vacío y elimina campos extra', () => {
    const emptyOverride = validSettings()
    emptyOverride.perDayOverrides = { '3': {} }
    expect(() => validateMenuSettings(emptyOverride)).toThrow(/ningún objetivo/)

    const extra = validSettings() as ReturnType<typeof validSettings> & { extra?: string }
    extra.extra = 'no debe persistirse'
    expect('extra' in validateMenuSettings(extra)).toBe(false)
  })
})
