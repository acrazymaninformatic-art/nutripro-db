'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const WAITLIST_STATUSES = new Set(['CONTACTED', 'BOOKED', 'CANCELLED'])

function parseOptionalDate(value: string | null, label: string): Date | null {
  if (!value || !value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`${label} no es válida.`)
  return date
}

export async function addToWaitlist(formData: FormData) {
  const userId = await requireUserId()
  const patientId = String(formData.get('patientId') || '')
  if (!patientId) throw new Error('Selecciona un paciente válido.')

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      userId,
      isActive: true,
      isHardDeleted: false,
      consentRevokedAt: null,
    },
    select: { id: true },
  })
  if (!patient) {
    throw new Error('El paciente no existe, está archivado o no tiene consentimiento vigente.')
  }

  const preferredFrom = parseOptionalDate(
    String(formData.get('preferredFrom') || ''),
    'La fecha de inicio de preferencia'
  )
  const preferredTo = parseOptionalDate(
    String(formData.get('preferredTo') || ''),
    'La fecha de fin de preferencia'
  )
  if (preferredFrom && preferredTo && preferredTo < preferredFrom) {
    throw new Error('La fecha de fin de preferencia debe ser posterior a la de inicio.')
  }
  const notes = String(formData.get('notes') || '').trim().slice(0, 1_000) || null

  await prisma.$transaction(async (tx) => {
    const entry = await tx.waitlistEntry.create({
      data: { userId, patientId, preferredFrom, preferredTo, notes },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'WAITLIST_ENTRY_CREATED',
        entityType: 'WaitlistEntry',
        entityId: entry.id,
      },
    })
  })
  revalidatePath('/dashboard/appointments')
}

export async function updateWaitlistStatus(
  id: string,
  status: 'CONTACTED' | 'BOOKED' | 'CANCELLED'
) {
  const userId = await requireUserId()
  if (!WAITLIST_STATUSES.has(status)) {
    throw new Error('El estado de la lista de espera no es válido.')
  }
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id, userId },
    select: { id: true, patientId: true },
  })
  if (!entry) throw new Error('Entrada no encontrada.')

  await prisma.$transaction(async (tx) => {
    const updated = await tx.waitlistEntry.updateMany({
      where: { id, userId },
      data: { status },
    })
    if (updated.count !== 1) throw new Error('La entrada de lista de espera ya no está disponible.')
    await tx.auditLog.create({
      data: {
        userId,
        patientId: entry.patientId,
        action: `WAITLIST_${status}`,
        entityType: 'WaitlistEntry',
        entityId: id,
      },
    })
  })
  revalidatePath('/dashboard/appointments')
}
