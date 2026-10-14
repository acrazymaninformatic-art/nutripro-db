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

  const appointments = patientId
    ? await prisma.appointment.findMany({
        where: { patientId },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          durationMin: true,
          modality: true,
          status: true,
          location: true,
          notes: true,
          meetUrl: true,
        },
      })
    : []

  return (
    <div className="space-y-6">
      <CitasClient
        appointments={appointments.map((a) => ({
          ...a,
          date: a.date.toISOString(),
        }))}
      />
    </div>
  )
}
