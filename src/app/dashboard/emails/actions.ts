'use server'

import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { sendManualEmail } from '@/lib/email/manual-email'

export async function sendManualEmailAction(formData: FormData) {
  const admin = await requireAdmin()

  const recipientEmail = String(formData.get('recipientEmail') || '').trim()
  const recipientName = String(formData.get('recipientName') || '').trim()
  const subject = String(formData.get('subject') || '').trim()
  const message = String(formData.get('message') || '').trim()
  const patientIdRaw = String(formData.get('patientId') || '').trim()
  const patientId = patientIdRaw || undefined

  if (!recipientEmail) {
    return { success: false, error: 'Debes indicar un correo electrónico destinatario.' }
  }
  if (!subject) {
    return { success: false, error: 'Debes indicar el asunto del correo.' }
  }
  if (!message) {
    return { success: false, error: 'El contenido del mensaje no puede estar vacío.' }
  }
  if (patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId: admin.id },
      select: { id: true },
    })
    if (!patient) {
      return { success: false, error: 'El paciente asociado al correo no existe o no pertenece a tu cuenta.' }
    }
  }

  try {
    const res = await sendManualEmail({
      recipientEmail,
      recipientName,
      subject,
      message,
      patientId,
    })

    revalidatePath('/dashboard/emails')
    revalidatePath('/dashboard/operations/emails')
    return { success: true, message: res.message }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al enviar el correo.' }
  }
}
