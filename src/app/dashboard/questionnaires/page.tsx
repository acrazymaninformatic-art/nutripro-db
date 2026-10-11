import { prisma } from '@/lib/prisma'
import { QuestionnairesClient } from './questionnaires-client'

export const dynamic = 'force-dynamic'

export default async function QuestionnairesPage() {
  const user = await prisma.user.findFirst()
  const professionalEmail = 'evavidalinfo@gmail.com'
  const professionalName = user?.name || 'Eva Vidal'

  const rawPatients = await prisma.patient.findMany({
    where: { isActive: true },
    orderBy: [
      { anamnesisStatus: 'asc' }, // NOT_SENT alphabetically comes before PENDING, so red ones are at top
      { createdAt: 'desc' },
    ],
    include: {
      anamnesisSubmissions: {
        orderBy: { submittedAt: 'desc' },
      },
    },
  })

  // Format patients
  const patients = rawPatients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    anamnesisStatus: p.anamnesisStatus || 'NOT_SENT',
    anamnesisSentAt: p.anamnesisSentAt,
    anamnesisCompletedAt: p.anamnesisCompletedAt,
    anamnesisSubmissions: p.anamnesisSubmissions || [],
  }))

  return (
    <QuestionnairesClient
      initialPatients={patients}
      professionalEmail={professionalEmail}
      professionalName={professionalName}
    />
  )
}
