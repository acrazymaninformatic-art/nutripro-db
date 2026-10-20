'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Baby, Check, FileCheck, Mail, PartyPopper, Pill, RotateCcw, ShieldAlert, Sparkles, Tag, Target } from 'lucide-react'
import { updatePatientGoalsAndTags, dischargePatient, reopenPatient } from '../actions'
import { QuestionnaireReviewModal } from '@/app/dashboard/questionnaires/review-modal'

interface PatientHeaderAlertsProps {
  patient: {
    id: string
    firstName: string
    lastName: string
    birthDate: Date | string
    sex: string
    pregnant: boolean
    breastfeeding: boolean
    allergies: string | null
    allergiesStatus: string
    intolerances: string | null
    intolerancesStatus: string
    medicalHistory: string | null
    pathologiesStatus: string
    currentMedications: string | null
    medicationsStatus: string
    medicationSchedule?: string | null
    targetWeightKg?: number | null
    targetWeightDate?: Date | string | null
    weeklyChangeTargetKg?: number | null
    tags?: string | null
    milestonesMessage?: string | null
    isDischarged?: boolean
    dischargedAt?: Date | string | null
    dischargeSummary?: string | null
    createdAt: Date | string
    questionnaireStatus?: string | null
    consentStatus?: string | null
    pendingReviewFieldsCount?: number | null
    latestQuestionnaireId?: string | null
    anthropometries: Array<{
      weightKg: number
      date: Date | string
    }>
  }
  drugAlertsCount: number
}

const PRESET_TAGS = [
  { name: 'SOP', color: '#ec4899' },
  { name: 'Embarazo', color: '#8b5cf6' },
  { name: 'Deportista', color: '#3b82f6' },
  { name: 'FODMAP', color: '#f59e0b' },
  { name: 'Pérdida Grasa', color: '#10b981' },
  { name: 'Hipertrofia', color: '#06b6d4' },
  { name: 'Resistencia Insulina', color: '#ef4444' },
  { name: 'Vegetariana', color: '#84cc16' },
]

export function PatientHeaderAlerts({ patient, drugAlertsCount }: PatientHeaderAlertsProps) {
  const [isEditingGoals, setIsEditingGoals] = useState(false)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [dischargeNotes, setDischargeNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Current measurements
  const measurements = patient.anthropometries || []
  const latestWeight = measurements[0]?.weightKg || null
  const initialWeight = measurements.length > 0 ? measurements[measurements.length - 1].weightKg : null

  // Progress towards target weight
  let progressPct: number | null = null
  let isTargetReached = false
  if (latestWeight && initialWeight && patient.targetWeightKg) {
    const totalGoalDiff = Math.abs(initialWeight - patient.targetWeightKg)
    const currentDiff = Math.abs(latestWeight - patient.targetWeightKg)
    if (totalGoalDiff > 0) {
      const progress = Math.min(100, Math.max(0, ((totalGoalDiff - currentDiff) / totalGoalDiff) * 100))
      progressPct = Math.round(progress)
      if (Math.abs(latestWeight - patient.targetWeightKg) <= 0.5) {
        isTargetReached = true
      }
    }
  }

  // Tracking duration in months
  const [diffDays] = useState(() => {
    const createdDate = new Date(patient.createdAt)
    return Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
  })
  const monthsTracking = Math.floor(diffDays / 30)

  let milestoneTimeBadge: string | null = null
  if (monthsTracking >= 12) {
    milestoneTimeBadge = ' 1 Año de Seguimiento'
  } else if (monthsTracking >= 6) {
    milestoneTimeBadge = ' 6 Meses de Acompañamiento'
  } else if (monthsTracking >= 3) {
    milestoneTimeBadge = ' 3 Meses de Compromiso'
  }

  // Parse tags
  let patientTags: Array<{ name: string; color: string }> = []
  try {
    if (patient.tags) {
      patientTags = JSON.parse(patient.tags)
    }
  } catch {
    patientTags = []
  }

  const handleSaveGoals = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await updatePatientGoalsAndTags(patient.id, {
        targetWeightKg: formData.get('targetWeightKg') ? parseFloat(formData.get('targetWeightKg') as string) : null,
        targetWeightDate: (formData.get('targetWeightDate') as string) || null,
        weeklyChangeTargetKg: formData.get('weeklyChangeTargetKg') ? parseFloat(formData.get('weeklyChangeTargetKg') as string) : null,
        medicationSchedule: (formData.get('medicationSchedule') as string) || '',
        milestonesMessage: (formData.get('milestonesMessage') as string) || null,
      })
      setIsEditingGoals(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar objetivos')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async (tag: { name: string; color: string }) => {
    if (patientTags.some((t) => t.name === tag.name)) return
    const newTags = [...patientTags, tag]
    try {
      await updatePatientGoalsAndTags(patient.id, { tags: JSON.stringify(newTags) })
    } catch (err: any) {
      alert('Error al añadir etiqueta')
    }
  }

  const handleRemoveTag = async (tagName: string) => {
    const newTags = patientTags.filter((t) => t.name !== tagName)
    try {
      await updatePatientGoalsAndTags(patient.id, { tags: JSON.stringify(newTags) })
    } catch (err: any) {
      alert('Error al quitar etiqueta')
    }
  }

  const handleDischarge = async () => {
    if (!confirm('¿Confirmar el Alta Clínica de este paciente? Se desactivará automáticamente su acceso al portal.')) return
    setLoading(true)
    try {
      await dischargePatient(patient.id, dischargeNotes)
      setIsDischargeModalOpen(false)
    } catch (err: any) {
      alert(err.message || 'Error al tramitar alta')
    } finally {
      setLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!confirm('¿Reactivar el seguimiento clínico y el acceso al portal para este paciente?')) return
    setLoading(true)
    try {
      await reopenPatient(patient.id)
    } catch (err: any) {
      alert(err.message || 'Error al reabrir paciente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* 1. Alerta de Alta Clínica / Cierre de Seguimiento */}
      {patient.isDischarged && (
        <div className="p-4 rounded-3xl bg-blue-50 border-2 border-blue-300 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-200 text-blue-900 rounded-2xl">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm flex items-center gap-2">
                <span>Alta Clínica Tramitada (Cierre de Seguimiento)</span>
                <Badge className="bg-blue-600 text-white font-bold rounded-full text-2xs">ALTA</Badge>
              </p>
              <p className="text-xs text-blue-800">
                {patient.dischargedAt && `Fecha de alta: ${new Date(patient.dischargedAt).toLocaleDateString('es-ES')}. `}
                {patient.dischargeSummary || 'Objetivos nutricionales y de composición corporal alcanzados con éxito.'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReopen}
            disabled={loading}
            className="rounded-2xl border-blue-400 bg-white text-blue-900 font-bold hover:bg-blue-100 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reabrir Seguimiento
          </Button>
        </div>
      )}

      {/* 5.4 Estados Independientes: Cuestionario, Firma y N campos por revisar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuestionario:</span>
            {patient.questionnaireStatus === 'COMPLETED' ? (
              <Badge className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-2xs">
                <Check className="h-[1em] w-[1em] shrink-0" /> Hecho (Completado)
              </Badge>
            ) : patient.questionnaireStatus === 'IN_PROGRESS' ? (
              <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-2xs">
                ⏳ Pendiente de hacer
              </Badge>
            ) : patient.questionnaireStatus === 'SENT' ? (
              <Badge className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-2xs">
                <Mail className="h-[1em] w-[1em] shrink-0" /> Enviado al portal
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 border border-gray-300 font-medium px-2.5 py-0.5 rounded-full text-2xs">
                No enviado
              </Badge>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consentimiento RGPD:</span>
            {patient.consentStatus === 'COMPLETED' ? (
              <Badge className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-2xs">
                <Check className="h-[1em] w-[1em] shrink-0" /> Firmado digitalmente
              </Badge>
            ) : patient.consentStatus === 'IN_PROGRESS' ? (
              <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-2xs">
                ⏳ Pendiente de firma
              </Badge>
            ) : patient.consentStatus === 'SENT' ? (
              <Badge className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-2xs">
                <Mail className="h-[1em] w-[1em] shrink-0" /> Enviado al portal
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 border border-gray-300 font-medium px-2.5 py-0.5 rounded-full text-2xs">
                No enviado
              </Badge>
            )}
          </div>
        </div>

        {(patient.pendingReviewFieldsCount || 0) > 0 && patient.latestQuestionnaireId && (
          <Button
            size="sm"
            onClick={() => setIsReviewModalOpen(true)}
            className="rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-2xs gap-1.5 h-8 px-3 animate-pulse cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{patient.pendingReviewFieldsCount} campos por revisar</span>
          </Button>
        )}
      </div>

      {/* 2. Banner de Avisos Clínicos Prioritarios (Cabecera 5.2) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        {/* Alergias & Intolerancias */}
        <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2.5">
          <div className={`p-2 rounded-xl shrink-0 ${patient.allergies ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Alergias / Intolerancias</span>
            <p className="text-xs font-bold text-gray-900 truncate">
              {patient.allergies || patient.intolerances || (patient.allergiesStatus === 'NINGUNA_CONOCIDA' ? 'Ninguna confirmada' : 'Pendiente de registrar')}
            </p>
          </div>
        </div>

        {/* Medicación con Dosis y Horarios */}
        <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
            <Pill className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Medicación y Pauta</span>
            <p className="text-xs font-bold text-gray-900 truncate">
              {patient.medicationSchedule || patient.currentMedications || 'Sin medicación crónica'}
            </p>
          </div>
        </div>

        {/* Salud Femenina / Embarazo / Lactancia */}
        <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2.5">
          <div className={`p-2 rounded-xl shrink-0 ${patient.pregnant || patient.breastfeeding ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
            <Baby className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Embarazo / Lactancia</span>
            <p className="text-xs font-bold text-gray-900 truncate">
              {patient.pregnant ? ' Embarazo en curso' : patient.breastfeeding ? ' En lactancia activa' : 'No gestante'}
            </p>
          </div>
        </div>

        {/* Interacciones Fármaco-Nutriente */}
        <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2.5">
          <div className={`p-2 rounded-xl shrink-0 ${drugAlertsCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Interacciones F-N</span>
            <p className="text-xs font-bold text-gray-900 truncate">
              {drugAlertsCount > 0 ? `${drugAlertsCount} ${drugAlertsCount === 1 ? 'alerta activa' : 'alertas activas'}` : 'Sin conflictos detectados'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Barra de Objetivos con Fecha, Ritmo Semanal y Progreso (5.2) */}
      <Card className="rounded-3xl border-gray-200 bg-gradient-to-r from-blue-50/50 via-white to-white overflow-hidden shadow-2xs">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Target className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Objetivo Clínico de Peso y Ritmo Semanal</h3>
                {isTargetReached && (
                  <Badge className="bg-blue-600 text-white font-bold rounded-full text-2xs animate-pulse">
                    <PartyPopper className="h-4 w-4" /> ¡OBJETIVO ALCANZADO!
                  </Badge>
                )}
                {milestoneTimeBadge && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 rounded-full font-bold text-2xs">
                    {milestoneTimeBadge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {patient.targetWeightKg ? (
                  <>
                    Meta pactada: <strong className="text-gray-900">{patient.targetWeightKg} kg</strong>
                    {patient.targetWeightDate && ` para el ${new Date(patient.targetWeightDate).toLocaleDateString('es-ES')}`}
                    {patient.weeklyChangeTargetKg && ` • Ritmo esperado: ${patient.weeklyChangeTargetKg > 0 ? '+' : ''}${patient.weeklyChangeTargetKg} kg/semana`}
                  </>
                ) : (
                  'No se ha fijado un peso objetivo formal aún con el paciente.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingGoals(!isEditingGoals)}
                className="rounded-2xl text-xs font-bold border-gray-300 hover:bg-blue-50"
              >
                {isEditingGoals ? 'Cerrar' : 'Ajustar Objetivos'}
              </Button>
              {!patient.isDischarged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDischargeModalOpen(true)}
                  className="rounded-2xl text-xs font-bold border-blue-300 bg-blue-50/50 text-blue-800 hover:bg-blue-100"
                >
                  <FileCheck className="h-3.5 w-3.5 mr-1" />
                  Alta / Cierre
                </Button>
              )}
            </div>
          </div>

          {/* Barra de progreso */}
          {progressPct !== null && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-2xs font-bold text-gray-500">
                <span>Inicio: {initialWeight} kg</span>
                <span className="text-blue-700">{progressPct}% completado</span>
                <span>Objetivo: {patient.targetWeightKg} kg</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    progressPct >= 100 ? 'bg-blue-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Formulario de Ajuste de Objetivos */}
          {isEditingGoals && (
            <form onSubmit={handleSaveGoals} className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="targetWeightKg" className="text-xs">Peso Objetivo (kg)</Label>
                <Input
                  id="targetWeightKg"
                  name="targetWeightKg"
                  type="number"
                  step="any"
                  defaultValue={patient.targetWeightKg || ''}
                  placeholder="ej. 68.0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetWeightDate" className="text-xs">Fecha Meta</Label>
                <Input
                  id="targetWeightDate"
                  name="targetWeightDate"
                  type="date"
                  defaultValue={patient.targetWeightDate ? new Date(patient.targetWeightDate).toISOString().split('T')[0] : ''}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weeklyChangeTargetKg" className="text-xs">Ritmo Semanal (kg/sem)</Label>
                <Input
                  id="weeklyChangeTargetKg"
                  name="weeklyChangeTargetKg"
                  type="number"
                  step="0.1"
                  defaultValue={patient.weeklyChangeTargetKg || ''}
                  placeholder="ej. -0.5 o +0.3"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="medicationSchedule" className="text-xs">Medicación con Dosis y Horario Estructurado</Label>
                <Input
                  id="medicationSchedule"
                  name="medicationSchedule"
                  defaultValue={patient.medicationSchedule || ''}
                  placeholder="ej. Eutirox 75mcg ayunas, Metformina 850mg en cena"
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label htmlFor="milestonesMessage" className="text-xs">Mensaje Personalizado de Hito</Label>
                <Input
                  id="milestonesMessage"
                  name="milestonesMessage"
                  defaultValue={patient.milestonesMessage || ''}
                  placeholder="¡Enhorabuena por tu constancia!"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingGoals(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 text-white">
                  {loading ? 'Guardando...' : 'Guardar Objetivos'}
                </Button>
              </div>
            </form>
          )}

          {/* 4. Etiquetas Privadas (5.2) */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-2xs font-bold text-gray-400 uppercase flex items-center gap-1 mr-1">
                <Tag className="h-3 w-3" /> Etiquetas:
              </span>
              {patientTags.map((t) => (
                <span
                  key={t.name}
                  style={{ backgroundColor: `${t.color}15`, color: t.color, borderColor: `${t.color}40` }}
                  className="px-2.5 py-0.5 rounded-full text-2xs font-bold border flex items-center gap-1"
                >
                  <span>{t.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t.name)}
                    className="hover:opacity-75 font-black text-2xs ml-0.5"
                    title="Quitar etiqueta"
                  >
                    ×
                  </button>
                </span>
              ))}

              {patientTags.length === 0 && (
                <span className="text-2xs text-gray-400 italic">Sin etiquetas privadas asignadas</span>
              )}
            </div>

            {/* Selector rápido de etiquetas preconfiguradas */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-3xs text-gray-400 font-semibold">+ Añadir:</span>
              {PRESET_TAGS.filter((pt) => !patientTags.some((t) => t.name === pt.name))
                .slice(0, 4)
                .map((pt) => (
                  <button
                    key={pt.name}
                    type="button"
                    onClick={() => handleAddTag(pt)}
                    className="text-3xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
                  >
                    +{pt.name}
                  </button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Alta Clínica / Cierre de Seguimiento */}
      {isDischargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Cierre de Seguimiento y Alta Clínica</h3>
                <p className="text-xs text-gray-500">
                  Emisión del informe final y desactivación automática del portal del paciente
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1">
              <p><strong>Primera medición:</strong> {initialWeight ? `${initialWeight} kg` : 'N/D'}</p>
              <p><strong>Última medición:</strong> {latestWeight ? `${latestWeight} kg` : 'N/D'}</p>
              <p><strong>Diferencia total:</strong> {initialWeight && latestWeight ? `${(latestWeight - initialWeight).toFixed(1)} kg` : 'N/D'}</p>
              <p><strong>Objetivo acordado:</strong> {patient.targetWeightKg ? `${patient.targetWeightKg} kg` : 'N/D'}</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dischargeNotes" className="text-xs">Resumen del Alta y Pautas de Mantenimiento</Label>
              <textarea
                id="dischargeNotes"
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                rows={3}
                placeholder="Indica las recomendaciones finales, pautas de mantenimiento y valoración del éxito del tratamiento..."
                className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-2xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <AlertTriangle className="h-[1em] w-[1em] shrink-0" /> Al tramitar el alta, el acceso al portal de este paciente quedará desactivado de forma automática como exige la normativa y la política de retención de EVSoftware.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDischargeModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleDischarge}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {loading ? 'Tramitando...' : 'Confirmar Alta Clínica'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {patient.latestQuestionnaireId && isReviewModalOpen && (
        <QuestionnaireReviewModal
          patientId={patient.id}
          questionnaireId={patient.latestQuestionnaireId}
          patientName={`${patient.firstName} ${patient.lastName}`}
          open={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
        />
      )}
    </div>
  )
}
