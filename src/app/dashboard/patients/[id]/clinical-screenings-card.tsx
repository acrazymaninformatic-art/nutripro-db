'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  Baby,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { ALL_SCREENINGS, type ScreeningDefinition } from '@/lib/clinical/screenings'
import { calculateGestationalWeightGain } from '@/lib/nutrition/anthropometry'
import { saveClinicalScreening, deleteClinicalScreening } from '../actions'

interface ClinicalScreeningsCardProps {
  patientId: string
  isPregnant: boolean
  pregestationalBmi?: number
  latestWeight?: number | null
  screenings: Array<{
    id: string
    date: Date | string
    type: string
    score: number
    maxScore?: number | null
    resultCategory: string
    answersJson: string
    notes?: string | null
  }>
}

export function ClinicalScreeningsCard({
  patientId,
  isPregnant,
  pregestationalBmi = 22.5,
  latestWeight = 65,
  screenings,
}: ClinicalScreeningsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('SCOFF')
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Gestational weight gain state
  const [weekOfPregnancy, setWeekOfPregnancy] = useState<number>(20)
  const [pregestationalWeight, setPregestationalWeight] = useState<number>(latestWeight ? latestWeight - 3 : 60)

  const activeScreeningDef: ScreeningDefinition = ALL_SCREENINGS[selectedType] || ALL_SCREENINGS.SCOFF

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSaveScreening = async () => {
    setLoading(true)
    try {
      await saveClinicalScreening(patientId, selectedType, answers)
      setIsModalOpen(false)
      setAnswers({})
    } catch (err: any) {
      alert(err.message || 'Error al guardar el cribado clínico')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de cribado clínico?')) return
    try {
      await deleteClinicalScreening(id, patientId)
    } catch (err: any) {
      alert('Error al eliminar cribado')
    }
  }

  // Calculate pregnancy target if applicable
  const pregnancyTracking = isPregnant
    ? calculateGestationalWeightGain(
        pregestationalBmi || 22.0,
        pregestationalWeight,
        latestWeight || pregestationalWeight,
        weekOfPregnancy
      )
    : null

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Cuestionarios y Cribados Clínicos Estandarizados (5.3)
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                SCOFF (TCA), MEDAS (PREDIMED Dieta Mediterránea), FINDRISC (Diabetes DM2), MUST y MNA (Desnutrición)
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cuestionario / Test
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Gestational Weight Gain Tracking (IOM 2009) si paciente gestante */}
        {isPregnant && pregnancyTracking && (
          <div className="p-4 rounded-3xl bg-purple-50/60 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-200 text-purple-900 rounded-xl">
                  <Baby className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-purple-950 uppercase tracking-wider">
                    Control de Ganancia Ponderal Gestacional (IOM 2009)
                  </h4>
                  <p className="text-2xs text-purple-800">
                    Calculado según IMC pregestacional ({pregestationalBmi.toFixed(1)} kg/m²)
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`font-black rounded-full px-2.5 py-0.5 text-2xs ${
                  pregnancyTracking.status === 'Dentro del rango óptimo'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {pregnancyTracking.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                <span className="text-2xs text-gray-500 block">Semana de Gestación:</span>
                <input
                  type="number"
                  min="1"
                  max="42"
                  value={weekOfPregnancy}
                  onChange={(e) => setWeekOfPregnancy(parseInt(e.target.value) || 20)}
                  className="w-16 font-black text-purple-950 border-b border-purple-300 focus:outline-none"
                />
                <span className="text-3xs text-gray-400"> sem</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                <span className="text-2xs text-gray-500 block">Ganancia Actual:</span>
                <span className="font-black text-purple-950">+{pregnancyTracking.actualGainKg} kg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                <span className="text-2xs text-gray-500 block">Esperada sem. {weekOfPregnancy}:</span>
                <span className="font-black text-purple-950">
                  {pregnancyTracking.expectedGainAtWeekMinKg} - {pregnancyTracking.expectedGainAtWeekMaxKg} kg
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                <span className="text-2xs text-gray-500 block">Rango Total IOM:</span>
                <span className="font-black text-purple-950">
                  {pregnancyTracking.recommendedTotalMinKg} - {pregnancyTracking.recommendedTotalMaxKg} kg
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Cribados Realizados */}
        {screenings.length === 0 ? (
          <p className="text-center py-6 text-xs text-gray-400 italic">
            No se han registrado cuestionarios clínicos para este paciente aún. Pulsa en "Nuevo Cuestionario / Test" para evaluar SCOFF, MEDAS, FINDRISC, etc.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {screenings.map((sc) => {
              const d = new Date(sc.date)
              const isHigh = sc.resultCategory.includes('ALTO') || sc.resultCategory.includes('DESNUTRIDO') || sc.resultCategory.includes('BAJA')
              const isMedium = sc.resultCategory.includes('MEDIO') || sc.resultCategory.includes('MODERADO') || sc.resultCategory.includes('RIESGO')

              return (
                <div
                  key={sc.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isHigh
                      ? 'bg-rose-50/50 border-rose-200'
                      : isMedium
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-blue-50/40 border-blue-100'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white font-bold rounded-full text-2xs">
                        {sc.type}
                      </Badge>
                      <span className="text-2xs text-gray-500">
                        {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-3xs font-black rounded-full ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isMedium
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {sc.resultCategory.replace(/_/g, ' ')}
                      </Badge>
                      <button
                        onClick={() => handleDelete(sc.id)}
                        className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-gray-700">Puntuación Obtenida:</span>
                    <span className="text-lg font-black text-gray-900">
                      {sc.score} {sc.maxScore ? `/ ${sc.maxScore}` : ''}
                    </span>
                  </div>

                  {sc.notes && (
                    <p className="mt-2 text-2xs text-gray-600 leading-relaxed bg-white/70 p-2 rounded-xl border border-gray-100">
                      {sc.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Modal de Realización de Cuestionario Clínico */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  <span>Realizar Cribado Clínico Estandarizado</span>
                </h3>
                <p className="text-xs text-gray-500">{activeScreeningDef.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>

            {/* Selector de test */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-700">Seleccionar herramienta:</span>
              {Object.keys(ALL_SCREENINGS).map((key) => {
                const def = ALL_SCREENINGS[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedType(key)
                      setAnswers({})
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      selectedType === key
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {def.name.split('(')[0].trim()}
                  </button>
                )
              })}
            </div>

            {/* Preguntas */}
            <div className="space-y-4 pt-2">
              {activeScreeningDef.questions.map((q, idx) => (
                <div key={q.id} className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200 space-y-2">
                  <p className="text-xs font-bold text-gray-900">{q.label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt.value
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, opt.value)}
                          className={`text-left p-2.5 rounded-xl text-2xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 border-blue-300 ring-2 ring-blue-500/20 font-bold'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveScreening}
                disabled={loading || Object.keys(answers).length < activeScreeningDef.questions.length}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {loading ? 'Calculando y Guardando...' : 'Evaluar y Guardar Cribado'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
