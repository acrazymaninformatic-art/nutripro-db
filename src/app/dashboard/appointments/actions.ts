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
import { APPOINTMENT_TYPE_CONFIG } from '@/types'

const APPOINTMENT_STATUS_VALUES = new Set(['CONFIRMED', 'COMPLETED', 'CANCELLED'])
const APPOINTMENT_TYPE_VALUES = new Set(Object.keys(APPOINTMENT_TYPE_CONFIG))
const AGENDA_BLOCK_REASONS = new Set(['VACACIONES', 'FORMACION', 'FESTIVO', 'PERSONAL', 'OTRO'])
const BOOKABLE_PATIENT_FILTER = {
  isActive: true,
  isHardDeleted: false,
  consentRevokedAt: null,
} as const

function optionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) throw new Error(`${label} es obligatorio.`)
  if (trimmed.length > maxLength) throw new Error(`${label} no puede superar ${maxLength} caracteres.`)
  return trimmed
}

async function claimReminder(appointmentId: string): Promise<boolean> {
  const claimed = await prisma.appointment.updateMany({
    where: { id: appointmentId, status: 'CONFIRMED', reminderSent: false },
    data: { reminderSent: true, reminderSentAt: new Date() },
  })
  return claimed.count === 1
}

async function releaseReminder(appointmentId: string): Promise<void> {
  try {
    await prisma.appointment.updateMany({
      where: { id: appointmentId, status: 'CONFIRMED' },
      data: { reminderSent: false, reminderSentAt: null },
    })
  } catch (error) {
    console.error('No se pudo liberar el recordatorio para reintentarlo:', error)
  }
}

export interface CreateAppointmentInput {
  patientId: string
  date: string // ISO string or datetime-local string
  durationMin?: number
  modality?: 'ONLINE' | 'PRESENCIAL'
  appointmentType?: 'PRIMERA' | 'REVISION' | 'ONLINE' | 'DOMICILIO' | 'GRUPAL'
  typeColor?: string
  notes?: string
  location?: string
  meetUrl?: string
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
  if (!input || typeof input !== 'object') {
    throw new Error('Los datos de la cita no son válidos.')
  }
  if (typeof input.patientId !== 'string' || !input.patientId) {
    throw new Error('Paciente no encontrado.')
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: input.patientId,
      userId,
      ...BOOKABLE_PATIENT_FILTER,
    },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado o sin consentimiento vigente para agendar una cita.')
  }

  if (input.appointmentType !== undefined && !APPOINTMENT_TYPE_VALUES.has(input.appointmentType)) {
    throw new Error('El tipo de cita no es válido.')
  }
  if (input.modality !== undefined && input.modality !== 'ONLINE' && input.modality !== 'PRESENCIAL') {
    throw new Error('La modalidad de la cita no es válida.')
  }
  if (typeof input.date !== 'string' || !input.date.trim()) {
    throw new Error('La fecha de la cita no es válida.')
  }
  if (input.sendEmailNotification !== undefined && typeof input.sendEmailNotification !== 'boolean') {
    throw new Error('El indicador de envío de correo no es válido.')
  }

  const appointmentDate = new Date(input.date)
  const appointmentType = input.appointmentType || (input.modality === 'ONLINE' ? 'ONLINE' : 'REVISION')
  const typeConfig = APPOINTMENT_TYPE_CONFIG[appointmentType] || APPOINTMENT_TYPE_CONFIG.REVISION
  const durationMin = input.durationMin ?? typeConfig.durationMin
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 240) {
    throw new Error('La duración debe estar entre 15 y 240 minutos.')
  }
  const modality = input.modality || (appointmentType === 'ONLINE' ? 'ONLINE' : 'PRESENCIAL')
  const typeColor = optionalText(input.typeColor, 40) || typeConfig.color
  const notes = optionalText(input.notes, 5_000)
  const location =
    optionalText(input.location, 200) ||
    (modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal')

  // 5.5 Videollamada en las citas online: solo se aceptan enlaces HTTPS de
  // Google Meet. Un enlace arbitrario podría convertir la cita en un vector
  // de phishing para el paciente.
  const requestedMeetUrl = optionalText(input.meetUrl, 500)
  if (requestedMeetUrl) {
    let parsed: URL
    try {
      parsed = new URL(requestedMeetUrl)
    } catch {
      throw new Error('El enlace de la videollamada no es válido.')
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'meet.google.com') {
      throw new Error('El enlace de la videollamada debe ser de Google Meet.')
    }
  }
  const meetUrl = modality === 'ONLINE'
    ? (requestedMeetUrl || process.env.GOOGLE_MEET_URL || process.env.NEXT_PUBLIC_GOOGLE_MEET_URL || 'https://meet.google.com/new')
    : null

  const reschedule = createSecureLinkToken(30 * 24 * 60 * 60 * 1000)

  const appointment = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointments:${userId}`}))`
    await ensureAppointmentSlotAvailable({ userId, start: appointmentDate, durationMin, client: tx })
    const created = await tx.appointment.create({
      data: {
        patientId: patient.id,
        date: appointmentDate,
        durationMin,
        modality,
        appointmentType,
        typeColor,
        meetUrl,
        notes,
        location,
        rescheduleTokenHash: reschedule.hash,
        rescheduleTokenExpiresAt: reschedule.expiresAt,
        status: 'CONFIRMED',
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId: patient.id,
        action: 'APPOINTMENT_CREATED',
        entityType: 'Appointment',
        entityId: created.id,
      },
    })
    return created
  })

  if (input.sendEmailNotification && patient.email) {
    const emailRes = await sendAppointmentEmail({
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientEmail: patient.email,
      appointmentDate,
      durationMin,
      modality,
      // Las notas de la cita son internas: nunca se incluyen en el correo
      // ni en el evento de calendario que recibe el paciente.
      location,
      professionalName: 'Eva Vidal',
      clinicName: 'Consulta Nutricional Eva Vidal',
      rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(reschedule.token)}`,
    })
    if (emailRes.success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { emailSent: true, emailSentAt: new Date() },
      })
    }
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${input.patientId}`)
  revalidatePath('/paciente/citas')
  return prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id } })
}

export async function updateAppointmentStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
  const userId = await requireUserId()
  if (!APPOINTMENT_STATUS_VALUES.has(status)) {
    throw new Error('El estado de la cita no es válido.')
  }
  const existing = await prisma.appointment.findFirst({
    where: { id, patient: { userId } },
    select: { id: true, patientId: true, date: true, durationMin: true, status: true },
  })

  if (!existing) throw new Error('Cita no encontrada.')

  const updated = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.update({
      where: { id },
      data: { status },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId: existing.patientId,
        action: 'APPOINTMENT_STATUS_CHANGED',
        entityType: 'Appointment',
        entityId: id,
        details: `Estado cambiado de ${existing.status} a ${status}.`,
      },
    })
    return appointment
  })

  // 5.5 Lista de espera: al cancelarse una cita, le sale quién esperaba para ofrecérselo
  let waitlistCandidates: any[] = []
  if (status === 'CANCELLED') {
    waitlistCandidates = await prisma.waitlistEntry.findMany({
      where: { userId, status: 'WAITING' },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 3,
    })
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath('/paciente/citas')

  return {
    appointment: updated,
    waitlistSuggestions: waitlistCandidates,
  }
}

export async function deleteAppointment(id: string) {
  const userId = await requireUserId()
  const existing = await prisma.appointment.findFirst({
    where: { id, patient: { userId } },
    select: { id: true, patientId: true },
  })
  if (!existing) throw new Error('Cita no encontrada.')

  const deleted = await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.delete({ where: { id } })
    await tx.auditLog.create({
      data: {
        userId,
        patientId: existing.patientId,
        action: 'APPOINTMENT_DELETED',
        entityType: 'Appointment',
        entityId: id,
        details: 'Cita eliminada manualmente desde la agenda.',
      },
    })
    return appointment
  })
  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${existing.patientId}`)
  return deleted
}

export async function resendAppointmentEmail(id: string) {
  const userId = await requireUserId()
  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      status: 'CONFIRMED',
      date: { gt: new Date() },
      patient: {
        userId,
        email: { not: null },
        ...BOOKABLE_PATIENT_FILTER,
      },
    },
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
    location: appointment.location || '',
    rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(reschedule.token)}`,
  })

  if (res.success) {
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          patientId: appointment.patientId,
          action: 'APPOINTMENT_EMAIL_RESENT',
          entityType: 'Appointment',
          entityId: id,
        },
      }),
    ])
  }

  revalidatePath('/dashboard/appointments')
  return res
}

export async function sendAppointmentReminder(id: string) {
  const userId = await requireUserId()
  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      status: 'CONFIRMED',
      date: { gt: new Date() },
      patient: {
        userId,
        email: { not: null },
        ...BOOKABLE_PATIENT_FILTER,
      },
    },
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
    location: appointment.location || '',
    professionalName: 'Eva Vidal',
    clinicName: 'Consulta Nutricional Eva Vidal',
  })

  if (res.success) {
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          patientId: appointment.patientId,
          action: 'APPOINTMENT_REMINDER_SENT',
          entityType: 'Appointment',
          entityId: id,
        },
      }),
    ])
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
        ...BOOKABLE_PATIENT_FILTER,
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
    // Reclamar el envío de forma atómica evita duplicados si el cron y una
    // carga del panel coinciden en el tiempo.
    if (!(await claimReminder(app.id))) continue

    try {
      const res = await sendAppointmentReminderEmail({
        patientName: `${app.patient.firstName} ${app.patient.lastName}`,
        patientEmail: app.patient.email,
        appointmentDate: app.date,
        durationMin: app.durationMin,
        modality: app.modality,
        location: app.location || '',
        professionalName: 'Eva Vidal',
        clinicName: 'Consulta Nutricional Eva Vidal',
      })

      if (res.success) {
        sentCount++
      } else {
        await releaseReminder(app.id)
        errors.push(`Error en ${app.patient.firstName}: ${res.message}`)
      }
    } catch (error) {
      await releaseReminder(app.id)
      errors.push(`Error en ${app.patient.firstName}: no se pudo enviar el recordatorio.`)
      console.error(`Error sending reminder for appointment ${app.id}:`, error)
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
          ...BOOKABLE_PATIENT_FILTER,
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
      if (!(await claimReminder(app.id))) continue

      try {
        const res = await sendAppointmentReminderEmail({
          patientName: `${app.patient.firstName} ${app.patient.lastName}`,
          patientEmail: app.patient.email,
          appointmentDate: app.date,
          durationMin: app.durationMin,
          modality: app.modality,
          location: app.location || '',
          professionalName: 'Eva Vidal',
          clinicName: 'Consulta Nutricional Eva Vidal',
        })

        if (res.success) {
          sentCount++
        } else {
          await releaseReminder(app.id)
        }
      } catch (e) {
        await releaseReminder(app.id)
        console.error(`Error auto-sending reminder for appointment ${app.id}:`, e)
      }
    }

    return { sentCount }
  } catch (err) {
    console.error('Error in autoProcessDueReminders:', err)
    return { sentCount: 0 }
  }
}

// ==========================================
// SECCIÓN 5.5: GESTIÓN DE BLOQUEOS DE AGENDA
// ==========================================

export async function getAgendaBlocksAction() {
  const userId = await requireUserId()
  return await prisma.agendaBlock.findMany({
    where: { userId },
    orderBy: { startDateTime: 'asc' },
  })
}

export async function createAgendaBlockAction(input: {
  title: string
  reason?: string // "VACACIONES" | "FORMACION" | "FESTIVO" | "PERSONAL" | "OTRO"
  startDateTime: string
  endDateTime: string
  allDay?: boolean
  notes?: string
}) {
  const userId = await requireUserId()
  if (!input || typeof input !== 'object') throw new Error('Los datos del bloqueo no son válidos.')
  const title = requiredText(input.title, 'El título del bloqueo', 150)
  const start = new Date(input.startDateTime)
  const end = new Date(input.endDateTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Las fechas del bloqueo no son válidas.')
  }
  if (end <= start) {
    throw new Error('La fecha y hora de fin debe ser posterior al inicio.')
  }
  if (input.allDay !== undefined && typeof input.allDay !== 'boolean') {
    throw new Error('El indicador de día completo no es válido.')
  }
  const reason = input.reason === undefined ? 'OTRO' : input.reason
  if (!AGENDA_BLOCK_REASONS.has(reason)) {
    throw new Error('El motivo del bloqueo no es válido.')
  }

  const block = await prisma.agendaBlock.create({
    data: {
      userId,
      title,
      reason,
      startDateTime: start,
      endDateTime: end,
      allDay: input.allDay === true,
      notes: optionalText(input.notes, 2_000),
    },
  })

  revalidatePath('/dashboard/appointments')
  return block
}

export async function deleteAgendaBlockAction(id: string) {
  const userId = await requireUserId()
  const block = await prisma.agendaBlock.findFirst({
    where: { id, userId },
  })
  if (!block) throw new Error('Bloqueo de agenda no encontrado.')

  await prisma.agendaBlock.delete({ where: { id } })
  revalidatePath('/dashboard/appointments')
  return { success: true }
}

// ==========================================
// SECCIÓN 5.5: HUECOS SUGERIDOS
// ==========================================

export async function getSuggestedAvailableSlotsAction(
  durationMin: number = 45,
  daysAhead: number = 14
) {
  const userId = await requireUserId()
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 240) {
    throw new Error('La duración debe estar entre 15 y 240 minutos.')
  }
  if (!Number.isInteger(daysAhead) || daysAhead < 1 || daysAhead > 60) {
    throw new Error('El horizonte de búsqueda debe estar entre 1 y 60 días.')
  }
  const now = new Date()

  // Franjas de consulta estándar de Eva:
  // Mañanas: 09:30, 10:30, 11:30, 12:30
  // Tardes: 16:30, 17:30, 18:30, 19:30
  const slotHours = [
    { h: 9, m: 30 },
    { h: 10, m: 30 },
    { h: 11, m: 30 },
    { h: 12, m: 30 },
    { h: 16, m: 30 },
    { h: 17, m: 30 },
    { h: 18, m: 30 },
    { h: 19, m: 30 },
  ]

  // Cargar citas y bloqueos existentes
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const [existingAppointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        patient: { userId },
        date: { gte: now, lte: futureDate },
      },
      select: { date: true, durationMin: true },
    }),
    prisma.agendaBlock.findMany({
      where: {
        userId,
        startDateTime: { lte: futureDate },
        endDateTime: { gte: now },
      },
      select: { startDateTime: true, endDateTime: true, title: true },
    }),
  ])

  const suggestedSlots: Array<{
    date: string
    formatted: string
    dayLabel: string
    timeLabel: string
  }> = []

  // Recorrer los próximos días buscando huecos libres (máximo 8 sugerencias)
  for (let d = 1; d <= daysAhead && suggestedSlots.length < 8; d++) {
    const candidateDay = new Date(now)
    candidateDay.setDate(now.getDate() + d)

    const dayOfWeek = candidateDay.getDay()
    // Omitir fines de semana (0 = domingo, 6 = sábado)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    for (const slot of slotHours) {
      if (suggestedSlots.length >= 8) break

      const slotStart = new Date(candidateDay)
      slotStart.setHours(slot.h, slot.m, 0, 0)

      if (slotStart.getTime() <= now.getTime() + 2 * 60 * 60 * 1000) continue

      const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000)

      // Verificar solapamiento con citas confirmadas
      const hasAppConflict = existingAppointments.some((app) => {
        const appStart = new Date(app.date).getTime()
        const appEnd = appStart + app.durationMin * 60 * 1000
        return slotStart.getTime() < appEnd && slotEnd.getTime() > appStart
      })

      if (hasAppConflict) continue

      // Verificar solapamiento con bloqueos de agenda
      const hasBlockConflict = blocks.some((b) => {
        const bStart = new Date(b.startDateTime).getTime()
        const bEnd = new Date(b.endDateTime).getTime()
        return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart
      })

      if (hasBlockConflict) continue

      // Hueco libre válido encontrado
      const dayLabel = slotStart.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      const timeLabel = slotStart.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })

      suggestedSlots.push({
        date: slotStart.toISOString(),
        formatted: `${dayLabel} a las ${timeLabel}`,
        dayLabel,
        timeLabel,
      })
    }
  }

  return suggestedSlots
}

// ==========================================
// SECCIÓN 5.5: SOLICITUDES DE CITA DESDE EL PORTAL
// ==========================================

export async function getAppointmentRequestsAction() {
  const userId = await requireUserId()
  return await prisma.appointmentRequest.findMany({
    where: {
      patient: { userId },
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
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
      appointment: {
        select: {
          id: true,
          date: true,
          modality: true,
          status: true,
        },
      },
    },
  })
}

/**
 * Eva asigna día y hora exactos a una solicitud de cita del portal (Sección 5.5)
 * "el paciente solo la solicita; Eva elige el día y la hora y la coloca en la agenda...
 * el paciente recibe un correo con el día y la hora asignados."
 */
export async function assignSlotToAppointmentRequestAction(
  requestId: string,
  scheduledDateStr: string,
  durationMin?: number,
  adminNotes?: string
) {
  const userId = await requireUserId()
  if (typeof requestId !== 'string' || !requestId) throw new Error('Solicitud de cita no encontrada.')

  const req = await prisma.appointmentRequest.findFirst({
    where: {
      id: requestId,
      status: 'PENDING',
      patient: { userId, ...BOOKABLE_PATIENT_FILTER },
    },
    include: { patient: true, appointment: true },
  })

  if (!req) throw new Error('Solicitud de cita no encontrada o ya resuelta.')

  const targetDate = new Date(scheduledDateStr)
  const duration = durationMin ?? 45
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) {
    throw new Error('La duración debe estar entre 15 y 240 minutos.')
  }
  const adminNote = optionalText(adminNotes, 2_000)
  const modality: 'ONLINE' | 'PRESENCIAL' = req.modality === 'PRESENCIAL' ? 'PRESENCIAL' : 'ONLINE'
  const requestedType = (
    APPOINTMENT_TYPE_VALUES.has(req.appointmentType) ? req.appointmentType : 'REVISION'
  ) as keyof typeof APPOINTMENT_TYPE_CONFIG
  const typeConfig = APPOINTMENT_TYPE_CONFIG[requestedType]
  const meetUrl = modality === 'ONLINE'
    ? (process.env.GOOGLE_MEET_URL || process.env.NEXT_PUBLIC_GOOGLE_MEET_URL || 'https://meet.google.com/new')
    : null
  const location = modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal'
  const reschedule = createSecureLinkToken(30 * 24 * 60 * 60 * 1000)

  const appointmentId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointments:${userId}`}))`
    await ensureAppointmentSlotAvailable({
      userId,
      start: targetDate,
      durationMin: duration,
      excludeAppointmentId: req.appointmentId || undefined,
      client: tx,
    })

    let nextAppointmentId = req.appointmentId
    if (nextAppointmentId && req.appointment) {
      const updated = await tx.appointment.updateMany({
        where: { id: nextAppointmentId, patientId: req.patientId },
        data: {
          date: targetDate,
          durationMin: duration,
          status: 'CONFIRMED',
          modality,
          appointmentType: requestedType,
          meetUrl,
          typeColor: typeConfig.color,
          location,
          reminderSent: false,
          reminderSentAt: null,
          rescheduleTokenHash: reschedule.hash,
          rescheduleTokenExpiresAt: reschedule.expiresAt,
          notes: adminNote
            ? `${req.appointment.notes || ''}\n[EVA]: ${adminNote}`.trim()
            : req.appointment.notes,
        },
      })
      if (updated.count !== 1) {
        throw new Error('La cita vinculada a la solicitud ya no está disponible.')
      }
    } else {
      const created = await tx.appointment.create({
        data: {
          patientId: req.patientId,
          date: targetDate,
          durationMin: duration,
          modality,
          appointmentType: requestedType,
          typeColor: typeConfig.color,
          meetUrl,
          status: 'CONFIRMED',
          notes: adminNote,
          location,
          rescheduleTokenHash: reschedule.hash,
          rescheduleTokenExpiresAt: reschedule.expiresAt,
        },
      })
      nextAppointmentId = created.id
    }

    const resolved = await tx.appointmentRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: {
        status: 'ACCEPTED',
        resolvedAt: new Date(),
        proposedDate: targetDate,
        adminNotes: adminNote,
        appointmentId: nextAppointmentId,
      },
    })
    if (resolved.count !== 1) {
      throw new Error('La solicitud ya había sido resuelta por otra persona.')
    }

    await tx.auditLog.create({
      data: {
        userId,
        patientId: req.patientId,
        action: 'APPOINTMENT_REQUEST_SLOT_ASSIGNED',
        entityType: 'AppointmentRequest',
        entityId: requestId,
        details: `Solicitud aceptada y cita ${nextAppointmentId} confirmada para ${targetDate.toISOString()}.`,
      },
    })
    return nextAppointmentId
  })

  // Enviar correo al paciente con la fecha y hora confirmada.
  if (req.patient.email) {
    await sendAppointmentEmail({
      patientName: `${req.patient.firstName} ${req.patient.lastName}`,
      patientEmail: req.patient.email,
      appointmentDate: targetDate,
      durationMin: duration,
      modality,
      location: modality === 'ONLINE' ? (meetUrl || 'Videollamada Google Meet') : 'Consulta Nutricional Eva Vidal',
      professionalName: 'Eva Vidal',
      clinicName: 'Consulta Nutricional Eva Vidal',
      rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(reschedule.token)}`,
    }).catch((e) => console.error('Error enviando confirmación de cita:', e))
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath('/paciente/citas')
  revalidatePath(`/dashboard/patients/${req.patientId}`)

  return { success: true, appointmentId }
}

/**
 * Resolver solicitud de cancelación o reprogramación
 */
export async function resolveAppointmentRequestAction(
  requestId: string,
  decision: 'ACCEPT_CANCEL' | 'REJECT',
  notes?: string
) {
  const userId = await requireUserId()
  if (decision !== 'ACCEPT_CANCEL' && decision !== 'REJECT') {
    throw new Error('La decisión sobre la solicitud no es válida.')
  }
  const req = await prisma.appointmentRequest.findFirst({
    where: { id: requestId, status: 'PENDING', patient: { userId } },
    include: { appointment: true, patient: true },
  })

  if (!req) throw new Error('Solicitud no encontrada o ya resuelta.')

  const safeNotes = optionalText(notes, 2_000)
  await prisma.$transaction(async (tx) => {
    if (decision === 'ACCEPT_CANCEL' && req.appointmentId) {
      await tx.appointment.updateMany({
        where: { id: req.appointmentId, patientId: req.patientId },
        data: { status: 'CANCELLED' },
      })
    }

    const resolved = await tx.appointmentRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: {
        status: decision === 'ACCEPT_CANCEL' ? 'ACCEPTED' : 'REJECTED',
        resolvedAt: new Date(),
        adminNotes:
          safeNotes ||
          (decision === 'ACCEPT_CANCEL' ? 'Cancelación aceptada por Eva.' : 'Solicitud no aceptada.'),
      },
    })
    if (resolved.count !== 1) {
      throw new Error('La solicitud ya había sido resuelta por otra persona.')
    }

    await tx.auditLog.create({
      data: {
        userId,
        patientId: req.patientId,
        action: 'APPOINTMENT_REQUEST_RESOLVED',
        entityType: 'AppointmentRequest',
        entityId: requestId,
        details:
          decision === 'ACCEPT_CANCEL'
            ? 'Solicitud de cancelación aceptada.'
            : 'Solicitud de cancelación o cambio rechazada.',
      },
    })
  })

  revalidatePath('/dashboard/appointments')
  revalidatePath('/paciente/citas')
  return { success: true }
}

/**
 * Reasignar hueco cancelado a paciente de la lista de espera (Sección 5.5)
 */
export async function offerSlotToWaitlistPatientAction(
  waitlistEntryId: string,
  appointmentDateStr: string,
  durationMin: number = 45
) {
  const userId = await requireUserId()
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 240) {
    throw new Error('La duración debe estar entre 15 y 240 minutos.')
  }
  const date = new Date(appointmentDateStr)
  const entry = await prisma.waitlistEntry.findFirst({
    where: {
      id: waitlistEntryId,
      userId,
      status: 'WAITING',
      patient: BOOKABLE_PATIENT_FILTER,
    },
    include: { patient: true },
  })

  if (!entry) throw new Error('Registro de lista de espera no encontrado o ya asignado.')

  const meetUrl = process.env.GOOGLE_MEET_URL || process.env.NEXT_PUBLIC_GOOGLE_MEET_URL || 'https://meet.google.com/new'
  const reschedule = createSecureLinkToken(30 * 24 * 60 * 60 * 1000)

  const appointmentId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`appointments:${userId}`}))`
    await ensureAppointmentSlotAvailable({ userId, start: date, durationMin, client: tx })
    const app = await tx.appointment.create({
      data: {
        patientId: entry.patientId,
        date,
        durationMin,
        modality: 'ONLINE',
        appointmentType: 'REVISION',
        typeColor: '#16a34a',
        meetUrl,
        status: 'CONFIRMED',
        notes: 'Asignado desde lista de espera tras cancelación.',
        rescheduleTokenHash: reschedule.hash,
        rescheduleTokenExpiresAt: reschedule.expiresAt,
      },
    })
    const booked = await tx.waitlistEntry.updateMany({
      where: { id: waitlistEntryId, userId, status: 'WAITING' },
      data: { status: 'BOOKED' },
    })
    if (booked.count !== 1) {
      throw new Error('El registro de lista de espera ya había sido asignado.')
    }
    await tx.auditLog.create({
      data: {
        userId,
        patientId: entry.patientId,
        action: 'WAITLIST_SLOT_ASSIGNED',
        entityType: 'Appointment',
        entityId: app.id,
        details: 'Hueco asignado a paciente en lista de espera.',
      },
    })
    return app.id
  })

  if (entry.patient.email) {
    await sendAppointmentEmail({
      patientName: `${entry.patient.firstName} ${entry.patient.lastName}`,
      patientEmail: entry.patient.email,
      appointmentDate: date,
      durationMin,
      modality: 'ONLINE',
      patientMessage: '¡Se ha liberado un hueco de consulta y te lo hemos asignado!',
      location: 'Videollamada Google Meet',
      professionalName: 'Eva Vidal',
      clinicName: 'Consulta Nutricional Eva Vidal',
      rescheduleUrl: `${getPublicAppUrl()}/reschedule?token=${encodeURIComponent(reschedule.token)}`,
    }).catch((e) => console.error('Error enviando notificación a lista de espera:', e))
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${entry.patientId}`)
  return { success: true, appointmentId }
}



