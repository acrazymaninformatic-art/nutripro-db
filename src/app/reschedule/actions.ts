'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { ensureAppointmentSlotAvailable } from '@/lib/appointment-slot'
import { createSecureLinkToken, hashSecureLinkToken } from '@/lib/secure-link-token'
import { getPublicAppUrl } from '@/lib/password-reset-token'
import { sendAppointmentEmail } from '@/lib/email/appointment-email'
import { getForwardedClientAddress } from '@/lib/legal'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'

export interface RescheduleState { error?: string; success?: string }

export async function rescheduleAppointment(_previousState: RescheduleState | undefined, formData: FormData): Promise<RescheduleState> {
  const token = String(formData.get('token') || '')
  const nextDate = new Date(String(formData.get('date') || ''))
  if (!token || Number.isNaN(nextDate.getTime())) return { error: 'El enlace o la fecha no son válidos.' }
  if (nextDate.getTime() <= Date.now()) return { error: 'La nueva fecha debe ser futura.' }

  const tokenHash = hashSecureLinkToken(token)
  const headerList = await headers()
  const ip = getForwardedClientAddress(
    headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')
  )
  const [ipLimit, tokenLimit] = await Promise.all([
    consumeRateLimit({
      key: rateLimitKey('reschedule-ip', ip),
      limit: 10,
      windowMs: 60 * 60 * 1000,
      failClosed: true,
    }),
    consumeRateLimit({
      key: rateLimitKey('reschedule-token', tokenHash),
      limit: 5,
      windowMs: 60 * 60 * 1000,
      failClosed: true,
    }),
  ])
  if (!ipLimit.allowed || !tokenLimit.allowed) {
    return { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' }
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      rescheduleTokenHash: tokenHash,
      rescheduleTokenExpiresAt: { gt: new Date() },
      status: 'CONFIRMED',
      date: { gt: new Date() },
      patient: {
        isActive: true,
        isHardDeleted: false,
        portalAccessEnabled: true,
        consentRevokedAt: null,
      },
    },
    include: { patient: { select: { id: true, userId: true, firstName: true, lastName: true, email: true } } },
  })
  if (!appointment) return { error: 'El enlace no es válido, ya ha caducado o la cita no puede modificarse.' }
  const newLink = createSecureLinkToken(30 * 24 * 60 * 60 * 1000)
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointments:${appointment.patient.userId}`}))`
      await ensureAppointmentSlotAvailable({ userId: appointment.patient.userId, start: nextDate, durationMin: appointment.durationMin, excludeAppointmentId: appointment.id, client: tx })
      const updated = await tx.appointment.updateMany({
        where: {
          id: appointment.id,
          rescheduleTokenHash: tokenHash,
          rescheduleTokenExpiresAt: { gt: new Date() },
        },
        data: {
          date: nextDate,
          reminderSent: false,
          reminderSentAt: null,
          rescheduleTokenHash: newLink.hash,
          rescheduleTokenExpiresAt: newLink.expiresAt,
        },
      })
      if (updated.count !== 1) {
        throw new Error('Este enlace ya se ha utilizado. Solicita un enlace nuevo a tu nutricionista.')
      }
      await tx.auditLog.create({ data: { userId: appointment.patient.userId, patientId: appointment.patientId, action: 'APPOINTMENT_RESCHEDULED_BY_PATIENT', entityType: 'Appointment', entityId: appointment.id } })
    })
  } catch (error: any) { return { error: error?.message || 'No se ha podido reservar ese horario.' } }
  if (appointment.patient.email) {
    const sent = await sendAppointmentEmail({ patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`, patientEmail: appointment.patient.email, appointmentDate: nextDate, durationMin: appointment.durationMin, modality: appointment.modality, location: appointment.location || '', rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(newLink.token)}` })
    if (sent.success) await prisma.appointment.update({ where: { id: appointment.id }, data: { emailSent: true, emailSentAt: new Date() } })
  }
  return { success: 'Tu propuesta se ha confirmado. Te hemos enviado el nuevo resumen de cita por correo.' }
}
