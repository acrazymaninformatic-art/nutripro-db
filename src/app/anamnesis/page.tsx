import { prisma } from '@/lib/prisma'
import { AnamnesisForm } from './anamnesis-form'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ patientId?: string }>
}

export default async function AnamnesisPage({ searchParams }: Props) {
  const { patientId } = await searchParams

  let patient = null
  if (patientId) {
    patient = await prisma.patient.findUnique({
      where: { id: patientId },
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl shadow-md mb-3">
            NP
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Anamnesis Nutricional Pre-Consulta
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Por favor, rellena este cuestionario con la máxima sinceridad. Nos servirá para diseñar tu pauta nutricional 100% adaptada a tu salud y estilo de vida.
          </p>
        </div>

        <AnamnesisForm
          patient={
            patient
              ? {
                  id: patient.id,
                  name: `${patient.firstName} ${patient.lastName}`,
                  phone: patient.phone,
                  email: patient.email,
                  medicalHistory: patient.medicalHistory,
                  currentMedications: patient.currentMedications,
                  isGLP1Treatment: patient.isGLP1Treatment,
                  foodAversions: patient.foodAversions,
                  shortTermGoal: patient.shortTermGoal,
                }
              : null
          }
        />
      </div>
    </div>
  )
}
