import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ManualEmailClient } from './manual-email-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Envío de Correos · EVSoftware',
  description: 'Compositor manual de correos electrónicos y avisos para pacientes de Eva Vidal Nutrición.',
}

export default async function EmailsPage() {
  await requireAdmin()

  const [patients, recentLogs] = await Promise.all([
    prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.emailLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 20,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <ManualEmailClient
        patients={patients}
        recentLogs={recentLogs.map((log) => ({
          ...log,
          sentAt: log.sentAt.toISOString(),
        }))}
      />
    </div>
  )
}
