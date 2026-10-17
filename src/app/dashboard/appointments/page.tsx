import { prisma } from '@/lib/prisma'
import { AppointmentManager } from './appointment-manager'
import { autoProcessDueReminders } from './actions'
import { Calendar } from 'lucide-react'
import { requireUserId } from '@/lib/auth'
import { WaitlistPanel } from './waitlist-panel'

export const dynamic = 'force-dynamic'

export default async function AppointmentsPage() {
  const userId = await requireUserId()
  // Automatically process any due reminders for tomorrow in the background (100% automated)
  await autoProcessDueReminders().catch((e) => console.error('Auto reminder check:', e))

  const [appointments, patients, waitlist, requests, blocks] = await Promise.all([
    prisma.appointment.findMany({
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
    }),
    prisma.patient.findMany({
      where: { userId, isActive: true },
      orderBy: { lastName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    }),
    prisma.waitlistEntry.findMany({
      where: { userId, status: { in: ['WAITING', 'CONTACTED'] } },
      orderBy: { createdAt: 'asc' },
      include: { patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
    }),
    prisma.appointmentRequest.findMany({
      where: { patient: { userId } },
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
            appointmentType: true,
            status: true,
            notes: true,
          },
        },
      },
    }),
    prisma.agendaBlock.findMany({
      where: { userId },
      orderBy: { startDateTime: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span>Agenda & Citas Clínicas</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Gestión de citas presenciales y online con sincronización de Google Calendar, bloqueos de agenda y solicitudes del portal.
          </p>
        </div>
      </div>

      <AppointmentManager
        initialAppointments={appointments as any}
        patients={patients}
        initialRequests={requests as any}
        initialBlocks={blocks as any}
        waitlistEntries={waitlist as any}
      />
      <WaitlistPanel patients={patients} entries={waitlist as any} />
    </div>
  )
}
