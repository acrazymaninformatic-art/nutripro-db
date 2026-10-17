import { prisma } from '@/lib/prisma'
import { AnamnesisForm } from './anamnesis-form'
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'
import { hashAnamnesisToken } from '@/lib/anamnesis-token'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Cuestionario de salud · Eva Vidal Nutrición', robots: { index: false, follow: false, noarchive: true } }

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function AnamnesisPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token || token.length > 200) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 rounded-3xl border-gray-200 bg-white text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-9 h-9" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Enlace No Válido o Sin Identificador</h1>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            Este cuestionario clínico es estrictamente personal. Solo se puede acceder a través del enlace privado que te envió tu nutricionista a tu correo electrónico.
          </p>
          <div className="mt-6 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium">
            Si eres paciente de <strong>Eva Vidal</strong>, revisa tu bandeja de entrada o contacta con la consulta.
          </div>
        </Card>
      </div>
    )
  }

  const patient = await prisma.patient.findFirst({
    where: { anamnesisAccessTokenHash: hashAnamnesisToken(token), anamnesisAccessTokenExpiresAt: { gt: new Date() } },
    include: {
      anamnesisSubmissions: {
        select: { id: true, submittedAt: true },
      },
    },
  })

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 rounded-3xl border-gray-200 bg-white text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-9 h-9" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Paciente No Encontrado</h1>
          <p className="text-sm text-gray-600 mt-3">
            El identificador proporcionado no corresponde a ningún expediente activo en la consulta.
          </p>
        </Card>
      </div>
    )
  }

  // Si ya ha sido completado previamente: bloqueo total
  const isAlreadyCompleted =
    patient.anamnesisStatus === 'COMPLETED' ||
    (patient.anamnesisSubmissions && patient.anamnesisSubmissions.length > 0)

  if (isAlreadyCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
        <Card className="max-w-lg w-full p-8 rounded-3xl border-blue-200 bg-white text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-white border border-blue-200 p-1 flex items-center justify-center mx-auto mb-4 shadow-sm overflow-hidden">
            <img
              src="/logo.png"
              alt="Eva Vidal Nutrición"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Cuestionario Ya Completado
          </h1>
          <p className="text-base font-semibold text-blue-900 mt-2">
            ¡Hola, {patient.firstName}!
          </p>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Tu cuestionario de anamnesis ya fue recibido y registrado con éxito en tu expediente clínico.
          </p>

          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs text-gray-700 space-y-2">
            <div className="flex items-center gap-2 text-blue-800 font-bold">
              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
              <span>Garantía de Confidencialidad y Seguridad Clínica</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Por protocolo médico y de protección de datos, este formulario ya no admite nuevas modificaciones ni reenvíos para preservar la integridad de tu historial.
            </p>
            <p className="text-gray-500 italic">
              Si necesitas corregir algún dato de salud o medicación, coméntalo directamente con <strong>Eva Vidal</strong> durante tu consulta.
            </p>
          </div>

          <div className="text-2xs text-gray-400 font-medium">
            EVSoftware • Eva Vidal Nutrición
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50/20 to-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-blue-200 p-1.5 shadow-md mb-3 overflow-hidden">
            <img
              src="/logo.png"
              alt="Eva Vidal Nutrición"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">
            Eva Vidal Nutrición
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Anamnesis Nutricional Pre-Consulta
          </h1>
          <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto">
            Por favor, responde a estas preguntas con sinceridad. Nos permitirán diseñar tu planificación nutricional 100% personalizada antes de tu cita.
          </p>
        </div>

        <AnamnesisForm
          token={token}
          patient={{
            name: `${patient.firstName} ${patient.lastName}`,
            phone: patient.phone,
            email: patient.email,
            medicalHistory: patient.medicalHistory,
            currentMedications: patient.currentMedications,
            isGLP1Treatment: patient.isGLP1Treatment,
            foodAversions: patient.foodAversions,
            shortTermGoal: patient.shortTermGoal,
          }}
        />
      </div>
    </div>
  )
}
