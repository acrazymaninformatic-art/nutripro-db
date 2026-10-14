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

export async function sendAnamnesisEmailAction({
  patientId,
  patientEmail,
  professionalEmail,
  professionalName,
  clinicName,
}: SendAnamnesisEmailActionParams) {
  try {
    const userId = await requireUserId()
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
      include: { user: { select: { name: true, email: true, clinicName: true } } },
    })

    if (!patient) {
      return {
        success: false,
        message: 'Paciente no encontrado en el sistema.',
      }
    }
    if (patient.anamnesisStatus === 'COMPLETED') {
      return { success: false, message: 'Este cuestionario ya consta como completado.', anamnesisUrl: '', mailtoUrl: '' }
    }

    const access = createAnamnesisToken()
    await prisma.patient.update({
      where: { id: patientId, userId },
      data: {
        email: patientEmail || undefined,
        anamnesisAccessTokenHash: access.hash,
        anamnesisAccessTokenExpiresAt: access.expiresAt,
        ...(patient.anamnesisStatus !== 'COMPLETED'
          ? {
              anamnesisStatus: 'PENDING',
              anamnesisSentAt: new Date(),
            }
          : {}),
      },
    })
    revalidatePath(`/dashboard/patients/${patientId}`)

    const profName = professionalName || patient.user?.name || 'Eva Vidal'
    const clinic = clinicName || 'Consulta Nutricional Eva Vidal'

    const result = await sendAnamnesisEmail({
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientEmail,
      accessToken: access.token,
      professionalName: patient.user?.name || profName,
      clinicName: patient.user?.clinicName || clinic,
    })

    return result
  } catch (error: any) {
    console.error('Error in sendAnamnesisEmailAction:', error)
    return {
      success: false,
      message: `Error al procesar el envío: ${error?.message || 'Error del servidor'}`,
      anamnesisUrl: '',
      mailtoUrl: '',
    }
  }
}

export async function markAnamnesisSentAction(patientId: string) {
  try {
    const userId = await requireUserId()
    const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
    if (!patient) throw new Error('Paciente no encontrado.')
    const fullPatient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { anamnesisStatus: true } })
    if (fullPatient?.anamnesisStatus === 'COMPLETED') throw new Error('El cuestionario ya está completado.')
    const access = createAnamnesisToken()
    await prisma.patient.update({
      where: { id: patientId, userId },
      data: {
        anamnesisStatus: 'PENDING',
        anamnesisSentAt: new Date(),
        anamnesisAccessTokenHash: access.hash,
        anamnesisAccessTokenExpiresAt: access.expiresAt,
      },
    })
    revalidatePath(`/dashboard/patients/${patientId}`)
    const baseUrl = process.env.APP_PUBLIC_URL || process.env.NEXTAUTH_URL || ''
    return { success: true, anamnesisUrl: `${baseUrl}/anamnesis?token=${encodeURIComponent(access.token)}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
