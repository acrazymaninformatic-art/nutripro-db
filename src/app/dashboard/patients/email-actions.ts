'use server'

import { prisma } from '@/lib/prisma'
import { sendAnamnesisEmail } from '@/lib/email/anamnesis-email'
import { revalidatePath } from 'next/cache'

interface SendAnamnesisEmailActionParams {
  patientId: string
  patientEmail: string
  professionalEmail?: string
  professionalName?: string
  clinicName?: string
  baseUrl?: string
}

export async function sendAnamnesisEmailAction({
  patientId,
  patientEmail,
  professionalEmail,
  professionalName,
  clinicName,
  baseUrl,
}: SendAnamnesisEmailActionParams) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    })

    if (!patient) {
      return {
        success: false,
        message: 'Paciente no encontrado en el sistema.',
      }
    }

    // Actualizar el correo del paciente y marcar estado PENDIENTE si no estaba ya completado
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        email: patientEmail || undefined,
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
      patientId: patient.id,
      professionalName: profName,
      clinicName: clinic,
      baseUrl,
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
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        anamnesisStatus: 'PENDING',
        anamnesisSentAt: new Date(),
      },
    })
    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
