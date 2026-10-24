'use server'

import { prisma } from '@/lib/prisma'
import { sendAnamnesisEmail } from '@/lib/email/anamnesis-email'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { createAnamnesisToken } from '@/lib/anamnesis-token'

interface SendAnamnesisEmailActionParams {
  patientId: string
  patientEmail: string
  professionalEmail?: string
  professionalName?: string
  clinicName?: string
}

function normalizeEmail(value: string): string | null {
  const email = String(value || '').trim().toLowerCase()
  if (email.length > 254 || /[\r\n]/.test(email)) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export async function sendAnamnesisEmailAction({
  patientId,
  patientEmail,
  professionalName,
  clinicName,
}: SendAnamnesisEmailActionParams) {
  try {
    const userId = await requireUserId()
    const normalizedEmail = normalizeEmail(patientEmail)
    if (!normalizedEmail) {
      return {
        success: false,
        message: 'El correo electrónico del paciente no es válido.',
        anamnesisUrl: '',
        mailtoUrl: '',
      }
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId,
        isActive: true,
        isHardDeleted: false,
        consentRevokedAt: null,
      },
      include: { user: { select: { name: true, email: true, clinicName: true } } },
    })

    if (!patient) {
      return {
        success: false,
        message: 'Paciente no encontrado, archivado o sin consentimiento vigente.',
        anamnesisUrl: '',
        mailtoUrl: '',
      }
    }
    if (patient.anamnesisStatus === 'COMPLETED') {
      return { success: false, message: 'Este cuestionario ya consta como completado.', anamnesisUrl: '', mailtoUrl: '' }
    }

    const access = createAnamnesisToken()
    await prisma.$transaction(async (tx) => {
      const updated = await tx.patient.updateMany({
        where: {
          id: patientId,
          userId,
          isActive: true,
          isHardDeleted: false,
          consentRevokedAt: null,
          anamnesisStatus: { not: 'COMPLETED' },
        },
        data: {
          email: normalizedEmail,
          anamnesisAccessTokenHash: access.hash,
          anamnesisAccessTokenExpiresAt: access.expiresAt,
          anamnesisStatus: 'PENDING',
          anamnesisSentAt: new Date(),
        },
      })
      if (updated.count !== 1) {
        throw new Error('El expediente cambió de estado antes de generar el enlace.')
      }
      await tx.auditLog.create({
        data: {
          userId,
          patientId,
          action: 'ANAMNESIS_LINK_SENT',
          entityType: 'PATIENT',
          entityId: patientId,
          details: `Enlace de cuestionario generado y enviado a ${normalizedEmail}.`,
        },
      })
    })
    revalidatePath(`/dashboard/patients/${patientId}`)

    const profName = professionalName || patient.user?.name || 'Eva Vidal'
    const clinic = clinicName || 'Consulta Nutricional Eva Vidal'

    const result = await sendAnamnesisEmail({
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientEmail: normalizedEmail,
      accessToken: access.token,
      professionalName: patient.user?.name || profName,
      clinicName: patient.user?.clinicName || clinic,
    })

    return result
  } catch (error: unknown) {
    console.error('Error in sendAnamnesisEmailAction:', error)
    return {
      success: false,
      message: 'No se pudo procesar el envío. Revisa la configuración de correo e inténtalo de nuevo.',
      anamnesisUrl: '',
      mailtoUrl: '',
    }
  }
}

export async function markAnamnesisSentAction(patientId: string) {
  try {
    const userId = await requireUserId()
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        userId,
        isActive: true,
        isHardDeleted: false,
        consentRevokedAt: null,
      },
      select: { id: true, anamnesisStatus: true },
    })
    if (!patient) throw new Error('Paciente no encontrado, archivado o sin consentimiento vigente.')
    if (patient.anamnesisStatus === 'COMPLETED') throw new Error('El cuestionario ya está completado.')
    const access = createAnamnesisToken()
    await prisma.$transaction(async (tx) => {
      const updated = await tx.patient.updateMany({
        where: {
          id: patientId,
          userId,
          isActive: true,
          isHardDeleted: false,
          consentRevokedAt: null,
          anamnesisStatus: { not: 'COMPLETED' },
        },
        data: {
          anamnesisStatus: 'PENDING',
          anamnesisSentAt: new Date(),
          anamnesisAccessTokenHash: access.hash,
          anamnesisAccessTokenExpiresAt: access.expiresAt,
        },
      })
      if (updated.count !== 1) {
        throw new Error('El expediente cambió de estado antes de generar el enlace.')
      }
      await tx.auditLog.create({
        data: {
          userId,
          patientId,
          action: 'ANAMNESIS_LINK_CREATED',
          entityType: 'PATIENT',
          entityId: patientId,
          details: 'Enlace de cuestionario generado para envío manual.',
        },
      })
    })
    revalidatePath(`/dashboard/patients/${patientId}`)
    const baseUrl = process.env.APP_PUBLIC_URL || process.env.NEXTAUTH_URL || ''
    return { success: true, anamnesisUrl: `${baseUrl}/anamnesis?token=${encodeURIComponent(access.token)}` }
  } catch (error: unknown) {
    console.error('Error in markAnamnesisSentAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo generar el enlace.',
    }
  }
}
