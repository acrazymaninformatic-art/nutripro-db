import { describe, expect, it } from 'vitest'
import {
  calculateEnergyFromMETs,
  calculateFaoOms,
  calculateOwen,
  calculateSchofield,
} from '@/lib/clinical/calculator/energy-formulas'
import {
  calculateFindrisc,
  calculateRegicor,
  calculateScore2,
  evaluateMetabolicSyndrome,
  getMicronutrientDRI,
} from '@/lib/clinical/calculator/cardiovascular-risk'

const man = { weightKg: 80, heightCm: 180, ageYears: 40, sex: 'male' as const }
const woman = { weightKg: 65, heightCm: 165, ageYears: 40, sex: 'female' as const }

describe('fórmulas de gasto energético (calculadora clínica)', () => {
  it('Schofield devuelve un valor positivo y fisiológico', () => {
    const value = calculateSchofield(man)
    expect(value).toBeGreaterThan(1000)
    expect(value).toBeLessThan(2500)
  })

  it('FAO/OMS distingue por sexo', () => {
    expect(calculateFaoOms(man)).toBeGreaterThan(calculateFaoOms(woman))
  })

  it('Owen tiene en cuenta la composición corporal', () => {
    const value = calculateOwen({ ...man, bodyFatPct: 20 })
    expect(value).toBeGreaterThan(1000)
  })

  it('calcula la energía a partir de METs', () => {
    // kcal = MET x peso x (minutos / 60)
    expect(calculateEnergyFromMETs({ met: 5, weightKg: 80, durationMinutes: 60 })).toBe(400)
  })
})

describe('riesgo cardiovascular', () => {
  const base = {
    ageYears: 55,
    sex: 'male' as const,
    isSmoker: true,
    systolicBpMmHg: 145,
    totalCholesterolMgDl: 230,
    hdlCholesterolMgDl: 42,
  }

  it('SCORE2 devuelve puntuación y categoría de riesgo', () => {
    const result = calculateScore2(base)
    expect(result.scorePct).toBeGreaterThan(0)
    expect(['BAJO_MODERADO', 'ALTO', 'MUY_ALTO']).toContain(result.riskCategory)
    expect(result.description).toBeTruthy()
  })

  it('REGICOR devuelve categoría de riesgo', () => {
    const result = calculateRegicor({ ...base, diastolicBpMmHg: 92 })
    expect(result.riskCategory).toBeTruthy()
    expect(result.description).toBeTruthy()
  })

  it('FINDRISC puntúa el riesgo de diabetes y recomienda medidas', () => {
    const result = calculateFindrisc({
      ageYears: 55,
      bmi: 30,
      waistCm: 100,
      sex: 'male',
    })
    expect(result.score).toBeGreaterThan(0)
    expect(['BAJO', 'LIGERAMENTE_ELEVADO', 'MODERADO', 'ALTO', 'MUY_ALTO']).toContain(
      result.riskLevel
    )
    expect(Array.isArray(result.recommendations)).toBe(true)
  })

  it('el síndrome metabólico se evalúa con los criterios clínicos', () => {
    const result = evaluateMetabolicSyndrome({
      sex: 'male',
      waistCm: 100,
      triglyceridesMgDl: 200,
      hdlCholesterolMgDl: 38,
      systolicBpMmHg: 140,
      diastolicBpMmHg: 90,
      fastingGlucoseMgDl: 110,
    })
    expect(typeof result.hasMetabolicSyndrome).toBe('boolean')
    expect(result.criteriaMetCount).toBeGreaterThanOrEqual(0)
    expect(result.criteriaDetails.length).toBeGreaterThan(0)
  })

  it('las referencias de micronutrientes aumentan en el embarazo', () => {
    const normal = getMicronutrientDRI(30, 'female')
    const pregnant = getMicronutrientDRI(30, 'female', true)
    expect(pregnant.ironMg).toBeGreaterThan(normal.ironMg)
  })
})
