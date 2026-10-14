'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requireUserId } from '@/lib/auth'
import {
  sendAppointmentEmail,
  sendAppointmentReminderEmail,
  generateGoogleCalendarUrl,
} from '@/lib/email/appointment-email'
import { ensureAppointmentSlotAvailable } from '@/lib/appointment-slot'
import { createSecureLinkToken } from '@/lib/secure-link-token'
import { getPublicAppUrl } from '@/lib/password-reset-token'


export interface CreateAppointmentInput {
  patientId: string
  date: string // ISO string or datetime-local string
  durationMin?: number
  modality?: 'ONLINE' | 'PRESENCIAL'
  notes?: string
  location?: string
  sendEmailNotification?: boolean
}

export async function getAppointments() {
  const userId = await requireUserId()
  return await prisma.appointment.findMany({
    where: { patient: { userId } },
    orderBy: { date: 'asc' },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  })
}

export async function getPatientAppointments(patientId: string) {
  const userId = await requireUserId()
  return await prisma.appointment.findMany({
    where: { patientId, patient: { userId } },
    orderBy: { date: 'desc' },
  })
}

export async function createAppointment(input: CreateAppointmentInput) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({ where: { id: input.patientId, userId } })

  if (!patient) {
    throw new Error('Paciente no encontrado')
  }

  const appointmentDate = new Date(input.date)
  const durationMin = input.durationMin || 45
  const modality = input.modality || 'ONLINE'
  const location = input.location || (modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal')
  const reschedule = createSecureLinkToken(30 * 24 * 60 * 60 * 1000)

  const appointment = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointments:${userId}`}))`
    await ensureAppointmentSlotAvailable({ userId, start: appointmentDate, durationMin, client: tx })
    return tx.appointment.create({
      data: {
        patientId: input.patientId,
        date: appointmentDate,
        durationMin,
        modality,
        notes: input.notes || null,
        location,
        rescheduleTokenHash: reschedule.hash,
        rescheduleTokenExpiresAt: reschedule.expiresAt,
        status: 'CONFIRMED',
      },
    })
  })

  if (input.sendEmailNotification && patient.email) {
    const emailRes = await sendAppointmentEmail({
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientEmail: patient.email,
      appointmentDate,
      durationMin,
      modality,
      notes: input.notes,
      location,
      professionalName: 'Eva Vidal',
      clinicName: 'Consulta Nutricional Eva Vidal',
      rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(reschedule.token)}`,
    })
    if (emailRes.success) await prisma.appointment.update({ where: { id: appointment.id }, data: { emailSent: true, emailSentAt: new Date() } })
  }
  await prisma.auditLog.create({ data: { userId, patientId: patient.id, action: 'APPOINTMENT_CREATED', entityType: 'Appointment', entityId: appointment.id } })

  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${input.patientId}`)
  return prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id } })
}

export async function updateAppointmentStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
  const userId = await requireUserId()
  if (!await prisma.appointment.findFirst({ where: { id, patient: { userId } }, select: { id: true } })) throw new Error('Cita no encontrada.')
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  })
  revalidatePath('/dashboard/appointments')
  return updated
}

export async function deleteAppointment(id: string) {
  const userId = await requireUserId()
  if (!await prisma.appointment.findFirst({ where: { id, patient: { userId } }, select: { id: true } })) throw new Error('Cita no encontrada.')
  const deleted = await prisma.appointment.delete({
    where: { id },
  })
  revalidatePath('/dashboard/appointments')
  return deleted
}

export async function resendAppointmentEmail(id: string) {
  const userId = await requireUserId()
  const appointment = await prisma.appointment.findFirst({
    where: { id, patient: { userId } },
    include: { patient: true },
  })

  if (!appointment || !appointment.patient.email) {
    throw new Error('Cita o email de paciente no disponible')
  }

  const reschedule = createSecureLinkToken(30 * 24 * 60 * 60 * 1000)
  await prisma.appointment.update({ where: { id }, data: { rescheduleTokenHash: reschedule.hash, rescheduleTokenExpiresAt: reschedule.expiresAt } })
  const res = await sendAppointmentEmail({
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    patientEmail: appointment.patient.email,
    appointmentDate: appointment.date,
    durationMin: appointment.durationMin,
    modality: appointment.modality,
    notes: appointment.notes || '',
    location: appointment.location || '',
    rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(reschedule.token)}`,
  })

  if (res.success) {
    await prisma.appointment.update({
      where: { id },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    })
  }

  revalidatePath('/dashboard/appointments')
  return res
}

export async function sendAppointmentReminder(id: string) {
  const userId = await requireUserId()
  const appointment = await prisma.appointment.findFirst({
    where: { id, patient: { userId } },
    include: { patient: true },
  })

  if (!appointment || !appointment.patient.email) {
    throw new Error('Cita o email del paciente no encontrado')
  }

  const res = await sendAppointmentReminderEmail({
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    patientEmail: appointment.patient.email,
    appointmentDate: appointment.date,
    durationMin: appointment.durationMin,
    modality: appointment.modality,
    notes: appointment.notes || '',
    location: appointment.location || '',
    professionalName: 'Eva Vidal',
    clinicName: 'Consulta Nutricional Eva Vidal',
  })

  if (res.success) {
    await prisma.appointment.update({
      where: { id },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
    })
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${appointment.patientId}`)
  return res
}

export async function sendUpcomingReminders24h() {
  const requestHeaders = await headers()
  const cronSecret = process.env.CRON_SECRET
  const cronAuthorized = Boolean(cronSecret && requestHeaders.get('authorization') === `Bearer ${cronSecret}`)
  const userId = cronAuthorized ? undefined : await requireUserId()
  const now = new Date()
  // Look for appointments scheduled between 12h and 36h from now (tomorrow's appointments)
  const minDate = new Date(now.getTime() + 12 * 60 * 60 * 1000)
  const maxDate = new Date(now.getTime() + 36 * 60 * 60 * 1000)

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      status: 'CONFIRMED',
      reminderSent: false,
      date: {
        gte: minDate,
        lte: maxDate,
      },
      patient: {
        ...(userId ? { userId } : {}),
        email: { not: null },
      },
    },
    include: {
      patient: true,
    },
  })

  let sentCount = 0
  const errors: string[] = []

  for (const app of upcomingAppointments) {
    if (!app.patient.email) continue

    const res = await sendAppointmentReminderEmail({
      patientName: `${app.patient.firstName} ${app.patient.lastName}`,
      patientEmail: app.patient.email,
      appointmentDate: app.date,
      durationMin: app.durationMin,
      modality: app.modality,
      notes: app.notes || '',
      location: app.location || '',
      professionalName: 'Eva Vidal',
      clinicName: 'Consulta Nutricional Eva Vidal',
    })

    if (res.success) {
      await prisma.appointment.update({
        where: { id: app.id },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      })
      sentCount++
    } else {
      errors.push(`Error en ${app.patient.firstName}: ${res.message}`)
    }
  }

  revalidatePath('/dashboard/appointments')
  return {
    totalEligible: upcomingAppointments.length,
    sentCount,
    errors,
  }
}

/**
 * Automatically processes and dispatches reminders for any appointments scheduled for tomorrow
 * (within the next 36 hours). Can be called by server page renders or cron jobs without user intervention.
 */
export async function autoProcessDueReminders() {
  const userId = await requireUserId()
  const now = new Date()
  const minDate = new Date(now.getTime() + 60 * 60 * 1000) // at least 1h in future
  const maxDate = new Date(now.getTime() + 36 * 60 * 60 * 1000) // up to 36 hours ahead (the day before)

  try {
    const dueAppointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSent: false,
        date: {
          gte: minDate,
          lte: maxDate,
        },
        patient: {
          userId,
          email: { not: null },
        },
      },
      include: {
        patient: true,
      },
    })

    if (dueAppointments.length === 0) return { sentCount: 0 }

    let sentCount = 0
    for (const app of dueAppointments) {
      if (!app.patient.email) continue

      try {
        const res = await sendAppointmentReminderEmail({
          patientName: `${app.patient.firstName} ${app.patient.lastName}`,
          patientEmail: app.patient.email,
          appointmentDate: app.date,
          durationMin: app.durationMin,
          modality: app.modality,
          notes: app.notes || '',
          location: app.location || '',
          professionalName: 'Eva Vidal',
          clinicName: 'Consulta Nutricional Eva Vidal',
        })

        if (res.success) {
          await prisma.appointment.update({
            where: { id: app.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date(),
            },
          })
          sentCount++
        }
      } catch (e) {
        console.error(`Error auto-sending reminder for appointment ${app.id}:`, e)
      }
    }

    return { sentCount }
  } catch (err) {
    console.error('Error in autoProcessDueReminders:', err)
    return { sentCount: 0 }
  }
}


