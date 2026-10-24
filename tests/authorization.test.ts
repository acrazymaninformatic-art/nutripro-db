import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    patient: { findFirst: vi.fn() },
    patientQuestionnaire: { findFirst: vi.fn() },
    patientConsent: { findFirst: vi.fn() },
    food: { count: vi.fn() },
    recipe: { count: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  assertFoodIdsAccessible,
  assertRecipeIdsOwned,
  requireOwnedConsent,
  requireOwnedPatient,
  requireOwnedQuestionnaire,
} from '@/lib/authorization'

const patientFind = prisma.patient.findFirst as unknown as ReturnType<typeof vi.fn>
const questionnaireFind = prisma.patientQuestionnaire.findFirst as unknown as ReturnType<typeof vi.fn>
const consentFind = prisma.patientConsent.findFirst as unknown as ReturnType<typeof vi.fn>
const foodCount = prisma.food.count as unknown as ReturnType<typeof vi.fn>
const recipeCount = prisma.recipe.count as unknown as ReturnType<typeof vi.fn>

describe('autorización por propietario', () => {
  beforeEach(() => {
    patientFind.mockReset()
    questionnaireFind.mockReset()
    consentFind.mockReset()
    foodCount.mockReset()
    recipeCount.mockReset()
  })

  it('busca siempre el paciente por id y profesional', async () => {
    patientFind.mockResolvedValueOnce({ id: 'patient-1' })
    await requireOwnedPatient('patient-1', 'admin-1')
    expect(patientFind).toHaveBeenCalledWith({ where: { id: 'patient-1', userId: 'admin-1' } })
  })

  it('oculta cuestionarios de otros profesionales', async () => {
    questionnaireFind.mockResolvedValueOnce(null)
    await expect(requireOwnedQuestionnaire('q-1', 'admin-1')).rejects.toThrow(
      'Cuestionario no encontrado.'
    )
    expect(questionnaireFind).toHaveBeenCalledWith({
      where: { id: 'q-1', patient: { userId: 'admin-1' } },
      include: { patient: true },
    })
  })

  it('exige que el consentimiento pertenezca al paciente y al profesional', async () => {
    consentFind.mockResolvedValueOnce(null)
    await expect(requireOwnedConsent('consent-1', 'patient-1', 'admin-1')).rejects.toThrow(
      'Consentimiento no encontrado.'
    )
    expect(consentFind).toHaveBeenCalledWith({
      where: { id: 'consent-1', patientId: 'patient-1', patient: { userId: 'admin-1' } },
    })
  })
})

describe('allowlist de alimentos y recetas', () => {
  beforeEach(() => {
    foodCount.mockReset()
    recipeCount.mockReset()
  })

  it('deduplica alimentos y acepta solo los globales o del profesional', async () => {
    foodCount.mockResolvedValueOnce(2)
    await assertFoodIdsAccessible('admin-1', [1, 1, 2, Number.NaN, -1])
    expect(foodCount).toHaveBeenCalledWith({
      where: {
        id: { in: [1, 2] },
        OR: [{ userId: null, isPrivate: false }, { userId: 'admin-1' }],
      },
    })
  })

  it('bloquea alimentos que no existen o son de otro profesional', async () => {
    foodCount.mockResolvedValueOnce(1)
    await expect(assertFoodIdsAccessible('admin-1', [1, 2])).rejects.toThrow(
      'no existen o no pertenecen a tu catálogo'
    )
  })

  it('bloquea recetas ajenas y acepta las propias', async () => {
    recipeCount.mockResolvedValueOnce(1)
    await expect(assertRecipeIdsOwned('admin-1', ['recipe-1', 'recipe-2'])).rejects.toThrow(
      'no pertenecen a tu recetario'
    )
    recipeCount.mockResolvedValueOnce(2)
    await expect(assertRecipeIdsOwned('admin-1', ['recipe-1', 'recipe-2'])).resolves.toBeUndefined()
  })
})
