import { prisma } from '@/lib/prisma'

/**
 * Helpers de autorización reutilizables. Todas las acciones que reciben un
 * identificador de paciente, cuestionario, consentimiento o plan desde el
 * navegador deben pasar por aquí antes de leer o escribir datos clínicos.
 */

export async function requireOwnedPatient(patientId: string, userId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
  })
  if (!patient) throw new Error('Paciente no encontrado.')
  return patient
}

export async function requireOwnedQuestionnaire(questionnaireId: string, userId: string) {
  const questionnaire = await prisma.patientQuestionnaire.findFirst({
    where: { id: questionnaireId, patient: { userId } },
    include: { patient: true },
  })
  if (!questionnaire) throw new Error('Cuestionario no encontrado.')
  return questionnaire
}

export async function requireOwnedConsent(consentId: string, patientId: string, userId: string) {
  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId, patient: { userId } },
  })
  if (!consent) throw new Error('Consentimiento no encontrado.')
  return consent
}

export async function assertFoodIdsAccessible(userId: string, foodIds: number[]) {
  const uniqueIds = Array.from(new Set(foodIds.filter((id) => Number.isFinite(id) && id > 0)))
  if (uniqueIds.length === 0) return
  const count = await prisma.food.count({
    where: {
      id: { in: uniqueIds },
      OR: [{ userId: null, isPrivate: false }, { userId }],
    },
  })
  if (count !== uniqueIds.length) {
    throw new Error('Uno o más alimentos del plan no existen o no pertenecen a tu catálogo.')
  }
}

export async function assertRecipeIdsOwned(userId: string, recipeIds: string[]) {
  const uniqueIds = Array.from(new Set(recipeIds.filter(Boolean)))
  if (uniqueIds.length === 0) return
  const count = await prisma.recipe.count({ where: { id: { in: uniqueIds }, userId } })
  if (count !== uniqueIds.length) {
    throw new Error('Una o más recetas del plan no existen o no pertenecen a tu recetario.')
  }
}
