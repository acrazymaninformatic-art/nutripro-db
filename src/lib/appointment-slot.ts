import 'server-only'

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function ensureAppointmentSlotAvailable({ userId, start, durationMin, excludeAppointmentId, client }: { userId: string; start: Date; durationMin: number; excludeAppointmentId?: string; client?: Prisma.TransactionClient }) {
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 240) throw new Error('La duración debe estar entre 15 y 240 minutos.')
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now() + 60 * 1000) throw new Error('Selecciona una fecha futura válida.')
  const end = new Date(start.getTime() + durationMin * 60 * 1000)
  const candidates = await (client || prisma).appointment.findMany({
    where: { status: 'CONFIRMED', ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}), patient: { userId }, date: { gte: new Date(start.getTime() - 4 * 60 * 60 * 1000), lt: end } },
    select: { date: true, durationMin: true },
  })
  if (candidates.some((appointment) => appointment.date.getTime() + appointment.durationMin * 60 * 1000 > start.getTime())) {
    throw new Error('Ese horario ya está ocupado. Elige otra franja para evitar una doble reserva.')
  }
}
