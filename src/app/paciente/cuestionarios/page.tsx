import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CuestionariosClient } from './cuestionarios-client'

export const dynamic = 'force-dynamic'

export default async function PacienteCuestionariosPage() {
  const { patientId: authPatientId, isAdminPreview } = await requirePatient()

  const patientId = authPatientId

  const patient = patientId
    ? await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          anamnesisStatus: true,
          anamnesisCompletedAt: true,
          consents: {
            where: {
              revokedAt: null,
              status: { in: ['SENT', 'IN_PROGRESS', 'COMPLETED'] },
            },
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
