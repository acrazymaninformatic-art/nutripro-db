'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  HeartPulse,
  Calculator,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers,
  Thermometer,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { CLINICAL_PROTOCOLS, type ClinicalProtocolDefinition } from '@/lib/clinical/protocols/protocols-registry'
import {
  assignProtocolAction,
  updateProtocolPhaseAction,
  addSymptomLogAction,
  updateProtocolStatusAction,
} from '@/lib/clinical/protocols/protocol-actions'

interface PatientClinicalProtocolsCardProps {
  patientId: string
  patientName: string
  protocols: any[]
  calculatorResults: any[]
}

export function PatientClinicalProtocolsCard({
  patientId,
  patientName,
  protocols = [],
  calculatorResults = [],
}: PatientClinicalProtocolsCardProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('')
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [protocolNotes, setProtocolNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Symptom log modal/state
  const [symptomModalProtocolId, setSymptomModalProtocolId] = useState<string | null>(null)
  const [bristolScore, setBristolScore] = useState<number>(4)
  const [bloatingScore, setBloatingScore] = useState<number>(2)
  const [painScore, setPainScore] = useState<number>(1)
  const [gasScore, setGasScore] = useState<number>(2)
  const [symptomNotes, setSymptomNotes] = useState<string>('')

  const activeProtocols = protocols.filter((p) => p.status === 'ACTIVE')
  const completedProtocols = protocols.filter((p) => p.status !== 'ACTIVE')
  const latestCalc = calculatorResults[0]

  const selectedDef = CLINICAL_PROTOCOLS.find((p) => p.id === selectedProtocolId)

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProtocolId) return
    setIsSubmitting(true)
    try {
      await assignProtocolAction({
        patientId,
        protocolId: selectedProtocolId,
        initialPhase: selectedPhase || (selectedDef?.phases?.[0]?.name ?? undefined),
        notes: protocolNotes,
      })
      setIsAssigning(false)
      setSelectedProtocolId('')
      setSelectedPhase('')
      setProtocolNotes('')
    } catch (err: any) {
      alert(err.message || 'Error al asignar protocolo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhaseChange = async (recordId: string, newPhase: string) => {
    try {
      await updateProtocolPhaseAction({ recordId, newPhase })
    } catch (err: any) {
      alert(err.message || 'Error al actualizar fase')
    }
  }

  const handleCompleteProtocol = async (recordId: string) => {
    if (!confirm('¿Deseas marcar este protocolo clínico como completado?')) return
    try {
      await updateProtocolStatusAction(recordId, 'COMPLETED')
    } catch (err: any) {
      alert(err.message || 'Error al completar protocolo')
    }
  }

  const handleSaveSymptomLog = async () => {
    if (!symptomModalProtocolId) return
    setIsSubmitting(true)
    try {
      await addSymptomLogAction({
        recordId: symptomModalProtocolId,
        log: {
          date: new Date().toISOString(),
          bristolScale: bristolScore,
          bloatingScore,
          painScore,
          gasScore,
          notes: symptomNotes,
        },
      })
      setSymptomModalProtocolId(null)
      setSymptomNotes('')
    } catch (err: any) {
      alert(err.message || 'Error al registrar síntoma')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="rounded-3xl border-emerald-200/80 bg-gradient-to-br from-emerald-50/20 via-white to-teal-50/20 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <HeartPulse className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Protocolos Clínicos & Evaluación</CardTitle>
              <CardDescription className="text-emerald-100 text-xs">
                Protocolos metabólicos, digestivos, etapas vitales y cálculos NIH/SCORE2 (Secciones 5.9 y 5.10)
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/calculator?patientId=${patientId}`}>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs rounded-xl flex items-center gap-1.5"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Calculadora Fórmulas</span>
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => setIsAssigning(!isAssigning)}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5 text-emerald-700" />
              <span>{isAssigning ? 'Cancelar' : 'Asignar Protocolo'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* ASSIGN FORM MODAL / COLLAPSIBLE */}
        {isAssigning && (
          <form
            onSubmit={handleAssign}
            className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-700" />
                <span>Asignar Nuevo Protocolo Clínico a {patientName}</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Seleccionar Protocolo</label>
                <select
                  value={selectedProtocolId}
                  onChange={(e) => {
                    setSelectedProtocolId(e.target.value)
                    const proto = CLINICAL_PROTOCOLS.find((p) => p.id === e.target.value)
                    setSelectedPhase(proto?.phases?.[0]?.name || '')
                  }}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs bg-white text-gray-900"
                  required
                >
                  <option value="">-- Elige un protocolo clínico --</option>
                  <optgroup label="Metabólicos y Renales">
                    {CLINICAL_PROTOCOLS.filter((p) => p.category === 'METABOLIC_RENAL').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Digestivos">
                    {CLINICAL_PROTOCOLS.filter((p) => p.category === 'DIGESTIVE').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Etapas de la Vida">
                    {CLINICAL_PROTOCOLS.filter((p) => p.category === 'LIFE_STAGES').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Casos Específicos">
                    {CLINICAL_PROTOCOLS.filter((p) => p.category === 'SPECIFIC').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {selectedDef?.phases && selectedDef.phases.length > 0 && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fase Inicial</label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2 text-xs bg-white text-gray-900"
                  >
                    {selectedDef.phases.map((ph) => (
                      <option key={ph.id} value={ph.name}>
                        {ph.name} ({ph.durationWeeks ? `${ph.durationWeeks} semanas` : 'indefinida'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedDef && (
              <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs space-y-1.5 text-gray-700">
                <p className="font-semibold text-emerald-900">{selectedDef.summary}</p>
                {selectedDef.warnings && selectedDef.warnings.length > 0 && (
                  <p className="text-amber-800 font-medium">⚠️ Advertencia: {selectedDef.warnings[0]}</p>
                )}
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-xs">
                Notas Clínicas / Objetivos para este Paciente
              </label>
              <textarea
                value={protocolNotes}
                onChange={(e) => setProtocolNotes(e.target.value)}
                placeholder="Anotaciones de individualización, ajustes de medicación, objetivos específicos..."
                rows={2}
                className="w-full rounded-xl border border-gray-300 p-2 text-xs bg-white text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAssigning(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedProtocolId}
                size="sm"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar e Iniciar Protocolo'}
              </Button>
            </div>
          </form>
        )}

        {/* ACTIVE PROTOCOLS */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-600" />
            <span>Protocolos Clínicos Activos ({activeProtocols.length})</span>
          </h4>

          {activeProtocols.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 text-center text-xs text-gray-500">
              No hay protocolos clínicos especializados activos asignados a este paciente.
            </div>
          ) : (
            <div className="space-y-3">
              {activeProtocols.map((record) => {
                const def = CLINICAL_PROTOCOLS.find((p) => p.id === record.type)
                let symptomLogs: any[] = []
                try {
                  if (record.parametersJson) {
                    const parsed = JSON.parse(record.parametersJson)
                    if (Array.isArray(parsed.symptomLogs)) symptomLogs = parsed.symptomLogs
                  }
                } catch (e) {
                  // ignore
                }

                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                          {def?.badge || 'Protocolo Clínico'}
                        </Badge>
                        <h5 className="font-bold text-gray-900 text-sm">{record.title}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSymptomModalProtocolId(record.id)}
                          className="text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 h-7 px-2.5 rounded-lg"
                        >
                          <Thermometer className="h-3.5 w-3.5 mr-1" />
                          <span>+ Registrar Síntomas</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteProtocol(record.id)}
                          className="text-xs text-gray-600 hover:text-emerald-700 h-7 px-2.5 rounded-lg border-gray-200"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          <span>Finalizar</span>
                        </Button>
                      </div>
                    </div>

                    {record.currentPhase && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="font-semibold text-gray-700">Fase Actual:</span>
                        <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 font-medium">
                          {record.currentPhase}
                        </Badge>
                        {def?.phases && def.phases.length > 1 && (
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-gray-400 text-2xs">Cambiar a:</span>
                            {def.phases
                              .filter((ph) => ph.name !== record.currentPhase)
                              .map((ph) => (
                                <button
                                  key={ph.id}
                                  onClick={() => handlePhaseChange(record.id, ph.name)}
                                  className="text-2xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                                >
                                  {ph.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {record.notes && (
                      <p className="text-xs text-gray-600 italic bg-gray-50/70 p-2 rounded-xl border border-gray-100">
                        {record.notes}
                      </p>
                    )}

                    {/* Recent symptom logs if any */}
                    {symptomLogs.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 text-xs">
                        <span className="text-2xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                          Últimos registros del diario sintomático:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {symptomLogs.slice(-3).reverse().map((log: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-100 text-2xs flex items-center gap-1"
                            >
                              <span>Bristol: <strong>{log.bristolScore}</strong></span> ·
                              <span>Distensión: <strong>{log.bloatingScore}/5</strong></span> ·
                              <span>Dolor: <strong>{log.painScore}/5</strong></span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* LATEST CALCULATOR ASSESSMENT SUMMARY */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-violet-600" />
              <span>Última Evaluación Energética & Riesgo (5.10)</span>
            </h4>
            <Link
              href={`/dashboard/calculator?patientId=${patientId}`}
              className="text-xs text-violet-700 hover:text-violet-900 font-semibold flex items-center gap-1"
            >
              <span>Abrir Calculadora</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {latestCalc ? (
            <div className="p-3.5 rounded-2xl bg-violet-50/50 border border-violet-100 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-violet-950">
                  {latestCalc.formula} · Factor x{latestCalc.activityFactor}
                </span>
                <p className="text-gray-600 text-2xs">
                  Fecha: {new Date(latestCalc.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-2xs text-gray-500 block">Tasa Metabólica Basal</span>
                  <span className="font-extrabold text-sm text-gray-900">{Math.round(latestCalc.bmrKcal)} kcal</span>
                </div>
                <div>
                  <span className="text-2xs text-gray-500 block">Gasto Total (GET)</span>
                  <span className="font-extrabold text-sm text-violet-700">{Math.round(latestCalc.tdeeKcal)} kcal</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-2xs text-gray-500 flex items-center justify-between">
              <span>Sin evaluaciones guardadas aún para este paciente.</span>
              <Link href={`/dashboard/calculator?patientId=${patientId}`}>
                <Button size="sm" variant="ghost" className="h-6 text-2xs text-violet-700 px-2">
                  Calcular ahora
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>

      {/* SYMPTOM LOG MODAL */}
      {symptomModalProtocolId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-teal-600" />
              <span>Registro de Síntomas Digestivos (FODMAP / SIBO)</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Escala de Bristol (Tipo 1 a 7) - Actual: {bristolScore}
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={bristolScore}
                  onChange={(e) => setBristolScore(parseInt(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-2xs text-gray-400">
                  <span>1: Estreñimiento severo</span>
                  <span>4: Normal / Ideal</span>
                  <span>7: Diarrea acuosa</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Distensión abdominal / Hinchazón (0 a 5) - Actual: {bloatingScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={bloatingScore}
                  onChange={(e) => setBloatingScore(parseInt(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Dolor abdominal (0 a 5) - Actual: {painScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={painScore}
                  onChange={(e) => setPainScore(parseInt(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Gases / Flatulencia (0 a 5) - Actual: {gasScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={gasScore}
                  onChange={(e) => setGasScore(parseInt(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Observaciones</label>
                <input
                  type="text"
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  placeholder="Ej: Empeoramiento tras comer manzana..."
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSymptomModalProtocolId(null)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSymptomLog}
                disabled={isSubmitting}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
