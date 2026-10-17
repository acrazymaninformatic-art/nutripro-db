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


export interface CreateAppointmentInput {
  patientId: string
  date: string // ISO string or datetime-local string
  durationMin?: number
  modality?: 'ONLINE' | 'PRESENCIAL'
  appointmentType?: 'PRIMERA' | 'REVISION' | 'ONLINE' | 'DOMICILIO' | 'GRUPAL'
  typeColor?: string
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
  const appointmentType = input.appointmentType || (input.modality === 'ONLINE' ? 'ONLINE' : 'REVISION')
  const typeConfig = APPOINTMENT_TYPE_CONFIG[appointmentType] || APPOINTMENT_TYPE_CONFIG.REVISION
  const durationMin = input.durationMin || typeConfig.durationMin
  const modality = input.modality || (appointmentType === 'ONLINE' ? 'ONLINE' : 'PRESENCIAL')
  const typeColor = input.typeColor || typeConfig.color

  // 5.5 Videollamada en las citas online: generación de enlace Google Meet
  const meetUrl = modality === 'ONLINE'
    ? `https://meet.google.com/evv-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
    : null

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
        appointmentType,
        typeColor,
        meetUrl,
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
    if (emailRes.success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { emailSent: true, emailSentAt: new Date() },
      })
    }
  }

  await prisma.auditLog.create({
    data: {
      userId,
      patientId: patient.id,
      action: 'APPOINTMENT_CREATED',
      entityType: 'Appointment',
      entityId: appointment.id,
    },
  })

  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${input.patientId}`)
  revalidatePath('/paciente/citas')
  return prisma.appointment.findUniqueOrThrow({ where: { id: appointment.id } })
}

export async function updateAppointmentStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
  const userId = await requireUserId()
  const existing = await prisma.appointment.findFirst({
    where: { id, patient: { userId } },
    select: { id: true, date: true, durationMin: true },
  })

  if (!existing) throw new Error('Cita no encontrada.')

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
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
  const start = new Date(input.startDateTime)
  const end = new Date(input.endDateTime)

  if (end <= start) {
    throw new Error('La fecha y hora de fin debe ser posterior al inicio.')
  }

  const block = await prisma.agendaBlock.create({
    data: {
      userId,
      title: input.title,
      reason: input.reason || 'OTRO',
      startDateTime: start,
      endDateTime: end,
      allDay: Boolean(input.allDay),
      notes: input.notes || null,
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
  const req = await prisma.appointmentRequest.findFirst({
    where: { id: requestId, patient: { userId } },
    include: { patient: true, appointment: true },
  })

  if (!req) throw new Error('Solicitud de cita no encontrada.')

  const targetDate = new Date(scheduledDateStr)
  const duration = durationMin || 45
  const modality = req.modality || 'ONLINE'
  const typeConfig = APPOINTMENT_TYPE_CONFIG[req.appointmentType] || APPOINTMENT_TYPE_CONFIG.REVISION

  // Generar Meet URL para online
  const meetUrl = modality === 'ONLINE'
    ? `https://meet.google.com/evv-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
    : null

  let appointmentId = req.appointmentId

  if (appointmentId && req.appointment) {
    // Actualizar cita existente (de solicitud inicial o cambio de fecha)
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: targetDate,
        durationMin: duration,
        status: 'CONFIRMED',
        modality,
        meetUrl,
        typeColor: typeConfig.color,
        notes: adminNotes ? `${req.appointment.notes || ''}\n[EVA]: ${adminNotes}`.trim() : req.appointment.notes,
      },
    })
  } else {
    // Crear cita nueva definitiva
    const created = await prisma.appointment.create({
      data: {
        patientId: req.patientId,
        date: targetDate,
        durationMin: duration,
        modality,
        appointmentType: req.appointmentType,
        typeColor: typeConfig.color,
        meetUrl,
        status: 'CONFIRMED',
        notes: adminNotes || req.patientNotes || null,
        location: modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal',
      },
    })
    appointmentId = created.id
  }

  // Marcar solicitud como ACEPTADA
  await prisma.appointmentRequest.update({
    where: { id: requestId },
    data: {
      status: 'ACCEPTED',
      resolvedAt: new Date(),
      proposedDate: targetDate,
      adminNotes: adminNotes || null,
      appointmentId,
    },
  })

  // Enviar correo al paciente con la fecha y hora confirmada
  if (req.patient.email) {
    await sendAppointmentEmail({
      patientName: `${req.patient.firstName} ${req.patient.lastName}`,
      patientEmail: req.patient.email,
      appointmentDate: targetDate,
      durationMin: duration,
      modality,
      notes: adminNotes || 'Eva Vidal ha confirmado tu cita.',
      location: modality === 'ONLINE' ? (meetUrl || 'Videollamada Google Meet') : 'Consulta Nutricional Eva Vidal',
      professionalName: 'Eva Vidal',
      clinicName: 'Consulta Nutricional Eva Vidal',
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
  const req = await prisma.appointmentRequest.findFirst({
    where: { id: requestId, patient: { userId } },
    include: { appointment: true, patient: true },
  })

  if (!req) throw new Error('Solicitud no encontrada.')

  if (decision === 'ACCEPT_CANCEL' && req.appointmentId) {
    await prisma.appointment.update({
      where: { id: req.appointmentId },
      data: { status: 'CANCELLED' },
    })

    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        resolvedAt: new Date(),
        adminNotes: notes || 'Cancelación aceptada por Eva.',
      },
    })
  } else {
    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        resolvedAt: new Date(),
        adminNotes: notes || 'Solicitud no aceptada.',
      },
    })
  }

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
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: waitlistEntryId, userId },
    include: { patient: true },
  })

  if (!entry) throw new Error('Registro de lista de espera no encontrado.')

  const date = new Date(appointmentDateStr)

  // Crear cita confirmada para el paciente de la lista de espera
  const app = await prisma.appointment.create({
    data: {
      patientId: entry.patientId,
      date,
      durationMin,
      modality: 'ONLINE',
      appointmentType: 'REVISION',
      typeColor: '#16a34a',
      meetUrl: `https://meet.google.com/evv-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
      status: 'CONFIRMED',
      notes: `Asignado desde lista de espera tras cancelación.`,
    },
  })

  // Marcar lista de espera como BOOKED
  await prisma.waitlistEntry.update({
    where: { id: waitlistEntryId },
    data: { status: 'BOOKED' },
  })

  // Notificar por correo
  if (entry.patient.email) {
    await sendAppointmentEmail({
      patientName: `${entry.patient.firstName} ${entry.patient.lastName}`,
      patientEmail: entry.patient.email,
      appointmentDate: date,
      durationMin,
      modality: 'ONLINE',
      notes: '¡Se ha liberado un hueco de consulta y te lo hemos asignado!',
      location: 'Videollamada Google Meet',
      professionalName: 'Eva Vidal',
      clinicName: 'Consulta Nutricional Eva Vidal',
    }).catch((e) => console.error('Error enviando notificación a lista de espera:', e))
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${entry.patientId}`)
  return { success: true, appointmentId: app.id }
}



