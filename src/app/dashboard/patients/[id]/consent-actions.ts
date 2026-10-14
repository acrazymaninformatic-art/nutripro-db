'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createPatientConsent(patientId: string, type: string, title: string) {
  await requireAdmin()

  const consent = await prisma.patientConsent.create({
    data: {
      patientId,
      type,
      title,
      version: '1.0',
      accepted: false,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return consent
}

export async function acceptPatientConsentByAdmin(consentId: string, patientId: string) {
  const admin = await requireAdmin()

  await prisma.patientConsent.update({
    where: { id: consentId },
    data: {
      accepted: true,
      acceptedAt: new Date(),
      signatureData: `Verificado presencialmente por ${admin.name}`,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function revokePatientConsent(consentId: string, patientId: string, reason: string) {
  await requireAdmin()

  await prisma.patientConsent.update({
    where: { id: consentId },
    data: {
      accepted: false,
      revokedAt: new Date(),
      revocationReason: reason || 'Revocado por solicitud del interesado',
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
