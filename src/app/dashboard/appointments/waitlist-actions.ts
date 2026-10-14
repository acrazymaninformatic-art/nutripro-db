'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function addToWaitlist(formData: FormData) {
  const userId = await requireUserId(); const patientId = String(formData.get('patientId') || '')
  if (!patientId || !await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })) throw new Error('Selecciona un paciente válido.')
  await prisma.waitlistEntry.create({ data: { userId, patientId, preferredFrom: formData.get('preferredFrom') ? new Date(String(formData.get('preferredFrom'))) : null, preferredTo: formData.get('preferredTo') ? new Date(String(formData.get('preferredTo'))) : null, notes: String(formData.get('notes') || '').trim().slice(0, 500) || null } })
  revalidatePath('/dashboard/appointments')
}

export async function updateWaitlistStatus(id: string, status: 'CONTACTED' | 'BOOKED' | 'CANCELLED') {
  const userId = await requireUserId(); const entry = await prisma.waitlistEntry.findFirst({ where: { id, userId }, select: { id: true, patientId: true } }); if (!entry) throw new Error('Entrada no encontrada.')
  await prisma.waitlistEntry.update({ where: { id }, data: { status } }); await prisma.auditLog.create({ data: { userId, patientId: entry.patientId, action: `WAITLIST_${status}`, entityType: 'WaitlistEntry', entityId: id } }); revalidatePath('/dashboard/appointments')
}
