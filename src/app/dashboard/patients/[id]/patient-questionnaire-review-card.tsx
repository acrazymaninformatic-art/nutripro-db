'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ClipboardList, FileText, HeartPulse, Sparkles, Stethoscope, Target } from 'lucide-react'
import { QuestionnaireReviewModal } from '@/app/dashboard/questionnaires/review-modal'

interface Props {
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    anamnesisStatus?: string
    anamnesisSentAt?: Date | string | null
    anamnesisCompletedAt?: Date | string | null
    anamnesisAnswers?: any
    patientQuestionnaires?: Array<{
      id: string
      type: string
      status: string
      pendingFieldsCount: number
      reviewedFieldsCount: number
      answersJson?: string
      updatedAt: Date | string
    }>
    medicalHistory?: string | null
    allergies?: string | null
    intolerances?: string | null
    currentMedications?: string | null
    objective?: string | null
  }
}

export function PatientQuestionnaireReviewCard({ patient }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const latestQuestionnaire = patient.patientQuestionnaires?.[0]
  const questionnaireId = latestQuestionnaire?.id
  const pendingCount = latestQuestionnaire?.pendingFieldsCount || 0
  const isCompleted =
    latestQuestionnaire?.status === 'COMPLETED' || patient.anamnesisStatus === 'COMPLETED'

  let answers: Record<string, any> = {}
  try {
    if (latestQuestionnaire?.answersJson) {
      answers = JSON.parse(latestQuestionnaire.answersJson)
    } else if (patient.anamnesisAnswers) {
      answers =
        typeof patient.anamnesisAnswers === 'string'
          ? JSON.parse(patient.anamnesisAnswers)
          : patient.anamnesisAnswers
    }
  } catch {}

  const hasAnswers = Object.keys(answers).length > 0

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <Card className="rounded-3xl border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xs shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900">
                  Cuestionario de Salud y Anamnesis
                </h3>
                <Badge
                  variant="outline"
                  className={`text-2xs font-extrabold rounded-full ${
                    isCompleted
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  {isCompleted ? ' Respuestas Completadas' : '⏳ Pendiente de Rellenar'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isCompleted
                  ? `El paciente completó el formulario pre-consulta. ${pendingCount > 0 ? `Hay ${pendingCount} campos listos para validar e incorporar a su expediente.` : 'Todos los campos han sido incorporados.'}`
                  : 'El paciente aún no ha completado el cuestionario de valoración inicial.'}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 shrink-0 md:w-auto">
            {questionnaireId ? (
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full justify-center rounded-2xl bg-blue-600 px-6 py-5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700 md:w-auto btn-tactile hover-lift cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Revisar y Validar Campos</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center rounded-2xl border-slate-200 text-xs font-bold md:w-auto"
                onClick={() => {
                  window.location.href = `/dashboard/questionnaires`
                }}
              >
                Gestionar en Cuestionarios <ArrowRight className="h-[1em] w-[1em] shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Structured Summary of Patient Answers */}
      {hasAnswers ? (
        <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Respuestas Aportadas por el Paciente</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Comparativa entre lo declarado en el cuestionario y los datos activos en la ficha.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 divide-y divide-slate-100">
            {/* 1. Antecedentes y Salud */}
            <div className="py-4 first:pt-0 space-y-2">
              <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                <span>Historial Clínico y Síntomas</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block mb-0.5">
                    Patologías diagnosticadas:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {answers.pathologies || answers.medicalHistory || 'Ninguna indicada'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block mb-0.5">
                    Medicación habitual declarada:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {answers.medications || answers.currentMedications || 'Ninguna'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Digestivo y Metabolismo */}
            <div className="py-4 space-y-2">
              <span className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                <span>Digestivo, Alergias e Intolerancias</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60">
                  <span className="text-3xs font-extrabold uppercase text-rose-700 block mb-0.5">
                    Alergias e Intolerancias señaladas:
                  </span>
                  <span className="font-bold text-rose-950">
                    {answers.allergies || answers.intolerances || 'Sin alergias indicadas'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block mb-0.5">
                    Síntomas digestivos (gases, reflujo, hinchazón):
                  </span>
                  <span className="font-semibold text-slate-800">
                    {answers.digestiveSymptoms || 'Sin sintomatología reseñada'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Estilo de vida y Objetivos */}
            <div className="py-4 last:pb-0 space-y-2">
              <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Estilo de Vida, Actividad y Metas</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block mb-0.5">
                    Objetivo principal:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {answers.objective || patient.objective || 'No especificado'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block mb-0.5">
                    Horas de sueño / Descanso:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {answers.sleepHours ? `${answers.sleepHours} h/noche` : 'No indicado'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-3xs font-extrabold uppercase text-slate-400 block mb-0.5">
                    Actividad física semanal:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {answers.exerciseFrequency ? `${answers.exerciseFrequency} días/sem` : 'No indicada'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-slate-200/80 p-8 text-center bg-white shadow-xs">
          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No hay cuestionario activo completado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Puedes enviar el cuestionario inicial al paciente para que lo complete de forma digital antes de su primera consulta.
          </p>
        </Card>
      )}

      {/* Review Modal Dialog */}
      {questionnaireId && isModalOpen && (
        <QuestionnaireReviewModal
          patientId={patient.id}
          questionnaireId={questionnaireId}
          patientName={`${patient.firstName} ${patient.lastName}`}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onComplete={() => {
            setIsModalOpen(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
