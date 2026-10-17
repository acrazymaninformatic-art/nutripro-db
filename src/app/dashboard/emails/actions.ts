'use server'

import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { sendManualEmail } from '@/lib/email/manual-email'

export async function sendManualEmailAction(formData: FormData) {
  await requireAdmin()

  const recipientEmail = (formData.get('recipientEmail') as string)?.trim()
  const recipientName = (formData.get('recipientName') as string)?.trim() || ''
  const subject = (formData.get('subject') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()
  const patientId = (formData.get('patientId') as string)?.trim() || undefined

  if (!recipientEmail) {
    return { success: false, error: 'Debes indicar un correo electrónico destinatario.' }
  }
  if (!subject) {
    return { success: false, error: 'Debes indicar el asunto del correo.' }
  }
  if (!message) {
    return { success: false, error: 'El contenido del mensaje no puede estar vacío.' }
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
