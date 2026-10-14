'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, Plus, Eye, EyeOff, Calendar, Trash2, CheckCircle2 } from 'lucide-react'
import { createSoapConsultation, deleteConsultation } from './consultation-actions'

interface ConsultationItem {
  id: string
  date: Date | string
  notes?: string | null
  subjectiveNotes?: string | null
  objectiveNotes?: string | null
  assessmentNotes?: string | null
  planNotes?: string | null
  isSharedWithPatient: boolean
}

interface Props {
  patientId: string
  consultations: ConsultationItem[]
}

export function SoapConsultationPanel({ patientId, consultations }: Props) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isShared, setIsShared] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('patientId', patientId)
    formData.set('isSharedWithPatient', isShared ? 'true' : 'false')

    try {
      await createSoapConsultation(formData)
      setShowNewForm(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar la nota SOAP')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta nota de consulta?')) return
    await deleteConsultation(id, patientId)
  }

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Notas Clínicas SOAP de Consulta
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Estructura médica estandarizada: Subjetivo, Objetivo, Apreciación y Plan
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewForm(!showNewForm)}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            Nueva Nota SOAP
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {showNewForm && (
          <form onSubmit={handleSubmit} className="p-5 bg-blue-50/40 border border-blue-200 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h4 className="font-bold text-sm text-blue-950">Redactar Nota de Consulta (SOAP)</h4>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                  isShared
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {isShared ? <Eye className="w-3.5 h-3.5 text-emerald-700" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                <span>{isShared ? 'Visible para el paciente en su portal' : 'Nota privada (solo profesional)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                  S — Subjetivo (Lo que refiere el paciente)
                </label>
                <textarea
                  name="subjectiveNotes"
                  rows={3}
                  placeholder="Sensaciones, adherencia subjetiva, dificultades, eventos sociales, digestión referida..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                  O — Objetivo (Datos medidos en sesión)
                </label>
                <textarea
                  name="objectiveNotes"
                  rows={3}
                  placeholder="Peso actual, variación grasa/músculo, perímetro abdominal, tensión o analítica..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                  A — Apreciación / Juicio Clínico
                </label>
                <textarea
                  name="assessmentNotes"
                  rows={3}
                  placeholder="Diagnóstico dietético-nutricional, evolución respecto a la última sesión, barreras superadas..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                  P — Plan & Próximos Pasos Acordados
                </label>
                <textarea
                  name="planNotes"
                  rows={3}
                  placeholder="Ajustes de kcal/macros, nuevo menú semanal, recetas prescritas, fecha de próxima revisión..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewForm(false)}
                className="text-xs text-gray-500"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {loading ? 'Guardando...' : 'Guardar Consulta SOAP'}
              </Button>
            </div>
          </form>
        )}

        {consultations.length === 0 ? (
          <p className="text-center py-6 text-sm text-gray-400">
            Aún no hay notas de consulta registradas. Pulsa en "Nueva Nota SOAP" para añadir la primera sesión.
          </p>
        ) : (
          <div className="space-y-4">
            {consultations.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/40 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-gray-900">
                      Consulta del {new Date(c.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </span>
                    {c.isSharedWithPatient ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        <Eye className="w-3 h-3 text-emerald-600" />
                        Visible para el paciente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                        <EyeOff className="w-3 h-3 text-gray-500" />
                        Privado
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {c.subjectiveNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                      <span className="font-bold text-blue-800 block mb-1">S — Subjetivo:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.subjectiveNotes}</p>
                    </div>
                  )}
                  {c.objectiveNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                      <span className="font-bold text-blue-800 block mb-1">O — Objetivo:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.objectiveNotes}</p>
                    </div>
                  )}
                  {c.assessmentNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                      <span className="font-bold text-blue-800 block mb-1">A — Apreciación:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.assessmentNotes}</p>
                    </div>
                  )}
                  {c.planNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                      <span className="font-bold text-blue-800 block mb-1">P — Plan de Acción:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.planNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
