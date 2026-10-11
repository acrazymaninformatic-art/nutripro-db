'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  sendAppointmentEmail,
  sendAppointmentReminderEmail,
  generateGoogleCalendarUrl,
} from '@/lib/email/appointment-email'


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
  return await prisma.appointment.findMany({
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
  return await prisma.appointment.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
  })
}

export async function createAppointment(input: CreateAppointmentInput) {
  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado')
  }

  const appointmentDate = new Date(input.date)
  const durationMin = input.durationMin || 45
  const modality = input.modality || 'ONLINE'
  const location = input.location || (modality === 'ONLINE' ? 'Videollamada Google Meet' : 'Consulta Nutricional Eva Vidal')

  let emailSent = false
  let emailSentAt: Date | null = null

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
    })

    if (emailRes.success) {
      emailSent = true
      emailSentAt = new Date()
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: input.patientId,
      date: appointmentDate,
      durationMin,
      modality,
      notes: input.notes || null,
      location,
      emailSent,
      emailSentAt,
      status: 'CONFIRMED',
    },
  })

  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${input.patientId}`)
  return appointment
}

export async function updateAppointmentStatus(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  })
  revalidatePath('/dashboard/appointments')
  return updated
}

export async function deleteAppointment(id: string) {
  const deleted = await prisma.appointment.delete({
    where: { id },
  })
  revalidatePath('/dashboard/appointments')
  return deleted
}

export async function resendAppointmentEmail(id: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true },
  })

  if (!appointment || !appointment.patient.email) {
    throw new Error('Cita o email de paciente no disponible')
  }

  const res = await sendAppointmentEmail({
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    patientEmail: appointment.patient.email,
    appointmentDate: appointment.date,
    durationMin: appointment.durationMin,
    modality: appointment.modality,
    notes: appointment.notes || '',
    location: appointment.location || '',
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
  const appointment = await prisma.appointment.findUnique({
    where: { id },
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

