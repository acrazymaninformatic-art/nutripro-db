import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AltaFormClient } from './alta-form-client'

export const dynamic = 'force-dynamic'

export default async function PacienteAltaPage() {
  const { patientId: authPatientId, isAdminPreview } = await requirePatient()

  const patientId = authPatientId

  if (!patientId) {
    redirect('/paciente')
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      birthDate: true,
      sex: true,
      medicalHistory: true,
      currentMedications: true,
      isGLP1Treatment: true,
      foodAversions: true,
      shortTermGoal: true,
      anamnesisStatus: true,
    },
  })

  if (!patient) {
    redirect('/paciente')
  }

  // Si Eva no ha solicitado o enviado el cuestionario (NOT_SENT) o ya está completado, no permitir acceso
  if (!isAdminPreview && patient.anamnesisStatus !== 'PENDING' && patient.anamnesisStatus !== 'SENT') {
    redirect('/paciente/cuestionarios')
  }

  const questionnaire = await prisma.patientQuestionnaire.findFirst({
    where: { patientId, type: 'ALTA' },
    orderBy: { createdAt: 'desc' },
    select: { draftAnswersJson: true },
  })

  let initialDraft: Record<string, any> | null = null
  if (questionnaire?.draftAnswersJson) {
    try {
      const parsed = JSON.parse(questionnaire.draftAnswersJson)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) initialDraft = parsed
    } catch {
      initialDraft = null
    }
  }

  return (
    <div className="py-4">
      <AltaFormClient
        initialDraft={initialDraft}
        patient={{
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          email: patient.email,
          birthDate: patient.birthDate?.toISOString() || null,
          sex: patient.sex,
          medicalHistory: patient.medicalHistory,
          currentMedications: patient.currentMedications,
          isGLP1Treatment: patient.isGLP1Treatment,
          foodAversions: patient.foodAversions,
          shortTermGoal: patient.shortTermGoal,
        }}
      />
    </div>
  )
}
