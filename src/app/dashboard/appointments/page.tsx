import { prisma } from '@/lib/prisma'
import { AppointmentManager } from './appointment-manager'
import { CalendarCheck, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AppointmentsPage() {
  const [appointments, patients] = await Promise.all([
    prisma.appointment.findMany({
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
    }),
    prisma.patient.findMany({
      where: { isActive: true },
      orderBy: { lastName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    }),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span>Agenda & Citas Clínicas</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestión de citas presenciales y online con sincronización de Google Calendar y avisos automáticos por correo.
          </p>
        </div>
      </div>

      <AppointmentManager
        initialAppointments={appointments as any}
        patients={patients}
      />
    </div>
  )
}
