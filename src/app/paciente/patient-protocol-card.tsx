'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeartPulse, Thermometer, CheckCircle2 } from 'lucide-react'
import { CLINICAL_PROTOCOLS } from '@/lib/clinical/protocols/protocols-registry'
import { addSymptomLogAction } from '@/lib/clinical/protocols/protocol-actions'
import { ModalPortal } from '@/components/ui/modal-portal'

interface PatientProtocol {
  id: string
  type: string
  currentPhase?: string | null
  title: string
  symptomLogJson?: string | null
}

interface PatientProtocolCardProps {
  protocol: PatientProtocol
}

export function PatientProtocolCard({ protocol }: PatientProtocolCardProps) {
  const [showLogModal, setShowLogModal] = useState(false)
  const [bristolScore, setBristolScore] = useState(4)
  const [bloatingScore, setBloatingScore] = useState(2)
  const [painScore, setPainScore] = useState(1)
  const [gasScore, setGasScore] = useState(2)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)

  if (!protocol) return null

  const def = CLINICAL_PROTOCOLS.find((p) => p.id === protocol.type)
  const currentPhaseDef = def?.phases?.find((ph) => ph.name === protocol.currentPhase)

  let symptomLogs: any[] = []
  try {
    if (protocol.symptomLogJson) {
      symptomLogs = JSON.parse(protocol.symptomLogJson)
    }
  } catch {
    symptomLogs = []
  }

  const handleSaveSymptom = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await addSymptomLogAction({
        recordId: protocol.id,
        log: {
          date: new Date().toISOString(),
          bristolScale: bristolScore,
          bloatingScore,
          painScore,
          gasScore,
          notes,
        },
      })
      setShowLogModal(false)
      setNotes('')
      setSuccessMsg(true)
      setTimeout(() => setSuccessMsg(false), 4000)
    } catch (err: any) {
      alert(err.message || 'Error al guardar síntoma')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="rounded-3xl border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50/70 via-blue-50/40 to-white pb-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-3xs font-black uppercase tracking-wider">
                {def?.badge || 'Protocolo Clínico Activo'}
              </Badge>
              {protocol.currentPhase && (
                <span className="text-xs font-semibold text-blue-900 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  {protocol.currentPhase}
                </span>
              )}
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-1">
              {protocol.title}
            </CardTitle>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setShowLogModal(true)}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-xs transition-all active:scale-[0.98]"
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span>Anotar síntomas de hoy</span>
        </Button>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {successMsg && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Registro de síntomas guardado correctamente en tu historial clínico.</span>
          </div>
        )}

        {/* Phase guidelines or protocol summary */}
        {currentPhaseDef ? (
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 text-sm">
                Pautas de la fase: {currentPhaseDef.name}
              </span>
              {currentPhaseDef.durationWeeks && (
                <span className="text-2xs text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-lg">
                  Duración aprox: {currentPhaseDef.durationWeeks} semanas
                </span>
              )}
            </div>
            <p className="text-gray-700">{currentPhaseDef.description}</p>
            {currentPhaseDef.keyGuidelines && currentPhaseDef.keyGuidelines.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-gray-600 pt-1 text-2xs">
                {currentPhaseDef.keyGuidelines.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            )}
          </div>
        ) : def?.summary ? (
          <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            {def.summary}
          </p>
        ) : null}

        {/* Recent logs */}
        {symptomLogs.length > 0 && (
          <div className="pt-2 border-t border-gray-100 text-xs">
            <span className="text-2xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Tus últimos registros de síntomas:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {symptomLogs.slice(0, 3).map((log: any, i: number) => (
                <div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/60 text-2xs space-y-1">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>{new Date(log.date || log.recordedAt).toLocaleDateString('es-ES')}</span>
                    <Badge variant="outline" className="text-3xs py-0">
                      Bristol Tipo {log.bristolScale}
                    </Badge>
                  </div>
                  <div className="flex gap-2 text-gray-700">
                    <span>Hinchazón: <strong>{log.bloatingScore}/5</strong></span>
                    <span>Dolor: <strong>{log.painScore}/5</strong></span>
                  </div>
                  {log.notes && <p className="text-gray-500 italic truncate">{log.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* SYMPTOM LOGGING MODAL */}
      {showLogModal && (
        <ModalPortal><div className="fixed inset-0 z-50 modal-backdrop bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSymptom}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95"
          >
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-blue-600" />
              <span>Diario de Síntomas Digestivos</span>
            </h4>
            <p className="text-xs text-gray-500">
              Registra cómo te has sentido hoy para que Eva Vidal pueda ajustar tu protocolo y evaluar tu evolución.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Escala de heces de Bristol (Tipo 1 a 7) - Actual: {bristolScore}
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={bristolScore}
                  onChange={(e) => setBristolScore(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-2xs text-gray-400">
                  <span>1: Estreñimiento</span>
                  <span>4: Normal / Ideal</span>
                  <span>7: Diarrea</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Distensión o hinchazón abdominal (0 a 5) - Actual: {bloatingScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={bloatingScore}
                  onChange={(e) => setBloatingScore(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Dolor o molestia abdominal (0 a 5) - Actual: {painScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={painScore}
                  onChange={(e) => setPainScore(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Gases o flatulencia (0 a 5) - Actual: {gasScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={gasScore}
                  onChange={(e) => setGasScore(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Comentarios / Alimentos sospechosos</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Molestias 1h después de comer legumbres..."
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowLogModal(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar en mi diario'}
              </Button>
            </div>
          </form>
        </div></ModalPortal>
      )}
    </Card>
  )
}
