import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CitasClient } from './citas-client'

export const dynamic = 'force-dynamic'

export default async function PacienteCitasPage() {
  const { patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({ select: { id: true } })
    patientId = firstPatient?.id || null
  }

  const [appointments, requests] = await Promise.all([
    patientId
      ? prisma.appointment.findMany({
          where: { patientId },
          orderBy: { date: 'asc' },
          select: {
            id: true,
            date: true,
            durationMin: true,
            modality: true,
            appointmentType: true,
            typeColor: true,
            status: true,
            location: true,
            notes: true,
            meetUrl: true,
          },
        })
      : [],
    patientId
      ? prisma.appointmentRequest.findMany({
          where: { patientId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            status: true,
            appointmentType: true,
            modality: true,
            preferredTimeOfDay: true,
            preferredDays: true,
            patientNotes: true,
            createdAt: true,
          },
        })
      : [],
  ])

  return (
    <div className="space-y-6">
      <CitasClient
        appointments={appointments.map((a) => ({
          ...a,
          date: a.date.toISOString(),
        }))}
        pendingRequests={requests.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
