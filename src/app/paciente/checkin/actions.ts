'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePatient } from '@/lib/auth'

export interface CheckInResult {
  ok: boolean
  message: string
}

const DAY_MS = 24 * 60 * 60 * 1000

function clampNumber(value: FormDataEntryValue | null, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.min(max, Math.max(min, parsed))
}

/**
 * Registro de seguimiento del paciente entre visitas.
 * Crea un ClinicalCheckIn (adherencia, digestivo, hábitos, notas) y, si el
 * paciente declara un peso, se guarda en `declaredWeightKg`, que el modelo
 * reserva para pesos autodeclarados (no entran en las gráficas de evolución
 * ni en los cálculos del profesional).
 */
export async function createCheckInAction(formData: FormData): Promise<CheckInResult> {
  const { user, patientId, isAdminPreview } = await requirePatient()

  if (isAdminPreview) {
    return { ok: false, message: 'Modo vista previa de solo lectura (Eva Vidal).' }
  }

  if (!patientId) {
    return { ok: false, message: 'No se ha podido identificar al paciente.' }
  }

  const adherencePct = clampNumber(formData.get('adherencePct'), 0, 100)
  const digestionScore = clampNumber(formData.get('digestionScore'), 0, 10)
  const habitsScore = clampNumber(formData.get('habitsScore'), 0, 10)
  const declaredWeightKg = clampNumber(formData.get('declaredWeightKg'), 20, 400)
  const notes = String(formData.get('notes') || '').trim().slice(0, 600)

  if (adherencePct === null && digestionScore === null && habitsScore === null && !notes) {
    return { ok: false, message: 'Rellena al menos un dato del seguimiento.' }
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const existingToday = await prisma.clinicalCheckIn.findFirst({
    where: { patientId, date: { gte: startOfToday } },
    orderBy: { date: 'desc' },
  })

  if (existingToday && Date.now() - existingToday.createdAt.getTime() < DAY_MS) {
    return {
      ok: false,
      message: 'Ya has registrado tu seguimiento de hoy. Se actualizará mañana.',
    }
  }

  const date = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.clinicalCheckIn.create({
      data: {
        patientId,
        date,
        adherencePct: adherencePct ?? 0,
        digestionScore: digestionScore ?? null,
        habitsScore: habitsScore ?? null,
        notes: notes || undefined,
      },
    })

    if (declaredWeightKg !== null) {
      await tx.patient.update({
        where: { id: patientId },
        data: { declaredWeightKg },
      })
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        patientId,
        action: 'CLINICAL_CHECKIN_CREATED',
        entityType: 'ClinicalCheckIn',
        details: `Seguimiento del paciente: adherencia ${adherencePct ?? '-'}%, digestivo ${digestionScore ?? '-'}0, hábitos ${habitsScore ?? '-'}0${declaredWeightKg !== null ? `, peso declarado ${declaredWeightKg} kg` : ''}`,
      },
    })
  })

  revalidatePath('/paciente/checkin')
  revalidatePath('/paciente')

  return {
    ok: true,
    message: '¡Gracias! Tu seguimiento ha quedado registrado y Eva lo verá en tu ficha.',
  }
}
