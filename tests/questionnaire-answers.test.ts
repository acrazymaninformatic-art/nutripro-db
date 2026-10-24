import { describe, expect, it } from 'vitest'
import { sanitizeQuestionnaireAnswers } from '@/lib/clinical/questionnaire-answers'

describe('sanitización del cuestionario', () => {
  it('conserva solo campos del catálogo y coacciona sus tipos', () => {
    const result = sanitizeQuestionnaireAnswers({
      firstName: '  Ana  ',
      birthDate: '1990-05-12',
      mealsPerDay: '4.6',
      isGLP1Treatment: true,
      name: 'Ana Pérez',
      campoInventado: 'no debe guardarse',
      otroObjeto: { peligro: true },
    })

    expect(result).toEqual({
      firstName: 'Ana',
      birthDate: '1990-05-12',
      mealsPerDay: 5,
      isGLP1Treatment: true,
      name: 'Ana Pérez',
    })
  })

  it('acepta los campos extra conocidos del formulario de alta', () => {
    const result = sanitizeQuestionnaireAnswers({
      gender: 'FEMALE',
      intolerancesOrAllergies: 'lactosa',
      digestiveSymptoms: 'hinchazón',
    })
    expect(result).toEqual({
      gender: 'FEMALE',
      intolerancesOrAllergies: 'lactosa',
      digestiveSymptoms: 'hinchazón',
    })
  })

  it('rechaza booleanos que no sean booleanos reales', () => {
    expect(() => sanitizeQuestionnaireAnswers({ isGLP1Treatment: 'true' })).toThrow(
      'verdadero o falso'
    )
  })

  it('rechaza números no finitos y fuera de rango', () => {
    expect(() => sanitizeQuestionnaireAnswers({ mealsPerDay: 'muchas' })).toThrow('no es válido')
    expect(() => sanitizeQuestionnaireAnswers({ mealsPerDay: -1 })).toThrow('no es válido')
  })

  it('rechaza fechas futuras o inválidas', () => {
    expect(() => sanitizeQuestionnaireAnswers({ birthDate: '2999-01-01' })).toThrow(
      'fecha de Fecha de nacimiento no es válida'
    )
    expect(() => sanitizeQuestionnaireAnswers({ birthDate: 'ayer' })).toThrow(
      'fecha de Fecha de nacimiento no es válida'
    )
  })

  it('rechaza opciones que no existan en el catálogo', () => {
    expect(() => sanitizeQuestionnaireAnswers({ sex: 'OTRO' })).toThrow(
      'opción seleccionada'
    )
  })

  it('rechaza cargas que no sean objetos', () => {
    expect(() => sanitizeQuestionnaireAnswers(null)).toThrow('formato válido')
    expect(() => sanitizeQuestionnaireAnswers([])).toThrow('formato válido')
    expect(() => sanitizeQuestionnaireAnswers('texto')).toThrow('formato válido')
  })
})
