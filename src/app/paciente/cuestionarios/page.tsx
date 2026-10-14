import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CuestionariosClient } from './cuestionarios-client'

export const dynamic = 'force-dynamic'

export default async function PacienteCuestionariosPage() {
  const { patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({ select: { id: true } })
    patientId = firstPatient?.id || null
  }

  const patient = patientId
    ? await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          anamnesisStatus: true,
          anamnesisCompletedAt: true,
          consents: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              title: true,
              version: true,
              accepted: true,
              acceptedAt: true,
            },
          },
        },
      })
    : null

  return (
    <div className="space-y-6">
      <CuestionariosClient
        anamnesisStatus={patient?.anamnesisStatus || 'NOT_SENT'}
        anamnesisCompletedAt={patient?.anamnesisCompletedAt?.toISOString() || null}
        consents={(patient?.consents || []).map((c) => ({
          ...c,
          acceptedAt: c.acceptedAt?.toISOString() || null,
        }))}
      />
    </div>
  )
}
