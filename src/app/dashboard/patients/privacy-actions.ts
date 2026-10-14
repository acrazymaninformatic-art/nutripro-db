'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function ownedPatient(patientId: string, userId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')
}

export async function revokePatientConsent(patientId: string, reason: string) {
  const userId = await requireUserId()
  await ownedPatient(patientId, userId)
  await prisma.$transaction([
    prisma.patient.update({ where: { id: patientId }, data: { consentRevokedAt: new Date(), consentRevocationReason: reason.trim().slice(0, 500) || null } }),
    prisma.auditLog.create({ data: { userId, patientId, action: 'CONSENT_REVOKED', entityType: 'Patient', entityId: patientId } }),
  ])
  revalidatePath(`/dashboard/patients/${patientId}`)
}

export async function registerDataSubjectRequest(patientId: string, requestType: 'EXPORT' | 'ERASURE') {
  const userId = await requireUserId()
  await ownedPatient(patientId, userId)
  const existing = await prisma.dataSubjectRequest.findFirst({ where: { userId, patientId, requestType, status: { in: ['PENDING', 'IN_PROGRESS'] } }, select: { id: true } })
  if (existing) return { message: 'Ya existe una solicitud abierta de este tipo.' }
  await prisma.$transaction([
    prisma.dataSubjectRequest.create({ data: { userId, patientId, requestType } }),
    prisma.auditLog.create({ data: { userId, patientId, action: `RGPD_${requestType}_REQUESTED`, entityType: 'Patient', entityId: patientId } }),
  ])
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { message: requestType === 'EXPORT' ? 'Solicitud de exportación registrada. Ya puedes descargar la copia desde esta ficha.' : 'Solicitud de eliminación registrada para revisión antes de borrar permanentemente.' }
}
