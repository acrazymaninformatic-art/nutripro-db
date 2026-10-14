'use server'

import { prisma } from '@/lib/prisma'
import { ensureAppointmentSlotAvailable } from '@/lib/appointment-slot'
import { createSecureLinkToken, hashSecureLinkToken } from '@/lib/secure-link-token'
import { getPublicAppUrl } from '@/lib/password-reset-token'
import { sendAppointmentEmail } from '@/lib/email/appointment-email'

export interface RescheduleState { error?: string; success?: string }

export async function rescheduleAppointment(_previousState: RescheduleState | undefined, formData: FormData): Promise<RescheduleState> {
  const token = String(formData.get('token') || '')
  const nextDate = new Date(String(formData.get('date') || ''))
  if (!token || Number.isNaN(nextDate.getTime())) return { error: 'El enlace o la fecha no son válidos.' }
  const appointment = await prisma.appointment.findFirst({
    where: { rescheduleTokenHash: hashSecureLinkToken(token), rescheduleTokenExpiresAt: { gt: new Date() }, status: 'CONFIRMED', date: { gt: new Date() } },
    include: { patient: { select: { id: true, userId: true, firstName: true, lastName: true, email: true } } },
  })
  if (!appointment) return { error: 'El enlace no es válido, ya ha caducado o la cita no puede modificarse.' }
  const newLink = createSecureLinkToken(30 * 24 * 60 * 60 * 1000)
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointments:${appointment.patient.userId}`}))`
      await ensureAppointmentSlotAvailable({ userId: appointment.patient.userId, start: nextDate, durationMin: appointment.durationMin, excludeAppointmentId: appointment.id, client: tx })
      await tx.appointment.update({ where: { id: appointment.id }, data: { date: nextDate, reminderSent: false, reminderSentAt: null, rescheduleTokenHash: newLink.hash, rescheduleTokenExpiresAt: newLink.expiresAt } })
      await tx.auditLog.create({ data: { userId: appointment.patient.userId, patientId: appointment.patientId, action: 'APPOINTMENT_RESCHEDULED_BY_PATIENT', entityType: 'Appointment', entityId: appointment.id } })
    })
  } catch (error: any) { return { error: error?.message || 'No se ha podido reservar ese horario.' } }
  if (appointment.patient.email) {
    const sent = await sendAppointmentEmail({ patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`, patientEmail: appointment.patient.email, appointmentDate: nextDate, durationMin: appointment.durationMin, modality: appointment.modality, notes: appointment.notes || '', location: appointment.location || '', rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(newLink.token)}` })
    if (sent.success) await prisma.appointment.update({ where: { id: appointment.id }, data: { emailSent: true, emailSentAt: new Date() } })
  }
  return { success: 'Tu propuesta se ha confirmado. Te hemos enviado el nuevo resumen de cita por correo.' }
}
