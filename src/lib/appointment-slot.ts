import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function ensureAppointmentSlotAvailable({
  userId,
  start,
  durationMin,
  excludeAppointmentId,
  client,
}: {
  userId: string
  start: Date
  durationMin: number
  excludeAppointmentId?: string
  client?: Prisma.TransactionClient
}) {
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 240) {
    throw new Error('La duración debe estar entre 15 y 240 minutos.')
  }
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now() + 60 * 1000) {
    throw new Error('Selecciona una fecha futura válida.')
  }

  const end = new Date(start.getTime() + durationMin * 60 * 1000)

  // 1. Verificar citas confirmadas existentes
  const candidates = await (client || prisma).appointment.findMany({
    where: {
      status: 'CONFIRMED',
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      patient: { userId },
      date: { gte: new Date(start.getTime() - 4 * 60 * 60 * 1000), lt: end },
    },
    select: { date: true, durationMin: true },
  })

  if (candidates.some((appointment) => appointment.date.getTime() + appointment.durationMin * 60 * 1000 > start.getTime())) {
    throw new Error('Ese horario ya está ocupado. Elige otra franja para evitar una doble reserva.')
  }

  // 2. Verificar bloqueos de agenda (vacaciones, formación, festivos) - Sección 5.5
  const blocks = await (client || prisma).agendaBlock.findMany({
    where: {
      userId,
      startDateTime: { lt: end },
      endDateTime: { gt: start },
    },
    select: { title: true, reason: true },
  })

  if (blocks.length > 0) {
    throw new Error(`Ese horario coincide con un bloqueo de agenda: "${blocks[0].title}" (${blocks[0].reason}). No se pueden asignar citas en esta franja.`)
  }
}
