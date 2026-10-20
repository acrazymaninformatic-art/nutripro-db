import { describe, expect, it } from 'vitest'
import { checkDrugInteractions } from '@/lib/nutrition/drug-interactions'

describe('detección de interacciones farmacológicas', () => {
  it('no genera avisos cuando no hay medicación', () => {
    expect(checkDrugInteractions('')).toEqual([])
    expect(checkDrugInteractions('Paracetamol 1 g cuando haga falta')).toEqual([])
  })

  it('detecta anticoagulantes con severidad alta', () => {
    const alerts = checkDrugInteractions('Sintrom 4 mg al día')
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts.some((alert) => alert.severity === 'ALTA')).toBe(true)
  })

  it('detecta estatinas', () => {
    const alerts = checkDrugInteractions('Atorvastatina 20 mg')
    expect(alerts.length).toBeGreaterThan(0)
  })

  it('detecta GLP-1 en pacientes con antecedentes de pancreatitis', () => {
    const alerts = checkDrugInteractions('Ozempic 1 mg semanal', 'Pancreatitis recurrente')
    expect(alerts.length).toBeGreaterThan(0)
  })

  it('devuelve siempre la severidad, el mecanismo y la recomendación', () => {
    const alerts = checkDrugInteractions('Omeprazol 20 mg')
    for (const alert of alerts) {
      expect(alert.severity).toBeTruthy()
      expect(alert.mechanism).toBeTruthy()
      expect(alert.clinicalRecommendation).toBeTruthy()
    }
  })
})
