import { prisma } from '@/lib/prisma'
import { QuestionnairesClient } from './questionnaires-client'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function QuestionnairesPage() {
  const user = await requireAdmin()
  const professionalEmail = user.email
  const professionalName = user.name

  const rawPatients = await prisma.patient.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: [
      { pendingReviewFieldsCount: 'desc' },
      { updatedAt: 'desc' },
    ],
    include: {
      anamnesisSubmissions: {
        orderBy: { submittedAt: 'desc' },
      },
      patientQuestionnaires: {
        orderBy: { createdAt: 'desc' },
      },
      consents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  // Formatear pacientes con estados independientes 5.4
  const patients = rawPatients.map((p) => {
    // Determinar estado de cuestionario de 4 fases
    const latestQ = p.patientQuestionnaires[0]
    let qStatus: 'NOT_SENT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_SENT'
    if (latestQ) {
      qStatus = latestQ.status as any
    } else if (p.questionnaireDeliveryStatus) {
      qStatus = p.questionnaireDeliveryStatus as any
    } else if (p.anamnesisStatus === 'COMPLETED' || p.anamnesisSubmissions.length > 0) {
      qStatus = 'COMPLETED'
    } else if (p.anamnesisStatus === 'PENDING') {
      qStatus = 'IN_PROGRESS'
    }

    // Determinar estado de consentimiento de 4 fases
    const latestConsent = p.consents[0]
    let cStatus: 'NOT_SENT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_SENT'
    if (latestConsent) {
      if (latestConsent.accepted || latestConsent.status === 'COMPLETED') {
        cStatus = 'COMPLETED'
      } else if (latestConsent.status === 'IN_PROGRESS' || latestConsent.viewedAt) {
        cStatus = 'IN_PROGRESS'
      } else if (latestConsent.status === 'SENT' || latestConsent.sentAt) {
        cStatus = 'SENT'
      }
    } else if (p.consentDeliveryStatus) {
      cStatus = p.consentDeliveryStatus as any
    }

    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      sex: p.sex,
      birthDate: p.birthDate?.toISOString() || null,
      // Estados independientes (5.4)
      questionnaireStatus: qStatus,
      consentStatus: cStatus,
      pendingReviewFieldsCount: p.pendingReviewFieldsCount || latestQ?.pendingFieldsCount || 0,
      anamnesisStatus: p.anamnesisStatus || 'NOT_SENT',
      anamnesisSentAt: p.anamnesisSentAt ? p.anamnesisSentAt.toISOString() : null,
      anamnesisCompletedAt: p.anamnesisCompletedAt ? p.anamnesisCompletedAt.toISOString() : null,
      anamnesisSubmissions: p.anamnesisSubmissions || [],
      patientQuestionnaires: p.patientQuestionnaires.map((pq) => ({
        id: pq.id,
        type: pq.type,
        title: pq.title,
        status: pq.status,
        sentAt: pq.sentAt ? pq.sentAt.toISOString() : null,
        openedAt: pq.openedAt ? pq.openedAt.toISOString() : null,
        completedAt: pq.completedAt ? pq.completedAt.toISOString() : null,
        pendingFieldsCount: pq.pendingFieldsCount,
        reviewedFieldsCount: pq.reviewedFieldsCount,
        isReopened: pq.isReopened,
        redFlagsJson: pq.redFlagsJson,
        answersJson: pq.answersJson,
        attachmentsJson: pq.attachmentsJson,
      })),
      consents: p.consents.map((c) => ({
        id: c.id,
        type: c.type,
        title: c.title,
        version: c.version,
        status: c.status,
        accepted: c.accepted,
        acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
        sentAt: c.sentAt ? c.sentAt.toISOString() : null,
        viewedAt: c.viewedAt ? c.viewedAt.toISOString() : null,
      })),
    }
  })

  return (
    <QuestionnairesClient
      initialPatients={patients}
      professionalEmail={professionalEmail}
      professionalName={professionalName}
    />
  )
}
