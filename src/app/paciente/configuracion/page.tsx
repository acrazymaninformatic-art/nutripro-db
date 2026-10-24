import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConfigClient } from './config-client'

export const dynamic = 'force-dynamic'

export default async function PacienteConfiguracionPage() {
  const { user, patientId: authPatientId, isAdminPreview } = await requirePatient({
    allowPasswordChangePending: true,
  })

  const patientId = authPatientId

  const requests = patientId
    ? await prisma.dataSubjectRequest.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          requestType: true,
          status: true,
          createdAt: true,
        },
      })
    : []

  return (
    <ConfigClient
      userEmail={user.email}
      passwordChangeRequired={user.passwordChangeRequired}
      pendingRequests={requests.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  )
}
