'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Check, CheckCircle2, Download, Edit2, FileText, HeartPulse, RotateCcw, ShieldAlert, X } from 'lucide-react'
import {
  getQuestionnaireReviewDataAction,
  acceptFieldToPatientRecordAction,
  acceptStepToPatientRecordAction,
  discardFieldReviewAction,
  reopenQuestionnaireAction,
} from './actions'
import { INTAKE_STEPS, type IntakeFieldDefinition } from '@/lib/clinical/intake-catalog'
import { isPrivateStorageKey, privateFileHref } from '@/lib/storage/private-file-url'

function attachmentHref(url: string): string | null {
  // Los adjuntos clínicos solo se sirven desde el almacenamiento privado.
  // Una URL externa antigua no se enlaza para no eludir el control de acceso.
  return isPrivateStorageKey(url) ? privateFileHref(url) : null
}

interface Props {
  patientId: string
  questionnaireId: string
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function QuestionnaireReviewModal({
  patientId,
  questionnaireId,
  patientName,
  open,
  onOpenChange,
  onComplete,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activeStep, setActiveStep] = useState<number>(1)
  const [isPending, startTransition] = useTransition()
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, any>>({})
  const [acceptedFields, setAcceptedFields] = useState<Set<string>>(new Set())
  const [discardedFields, setDiscardedFields] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (open && questionnaireId) {
      setLoading(true)
      getQuestionnaireReviewDataAction(questionnaireId)
        .then((res) => {
          setData(res)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [open, questionnaireId])

  if (!open) return null

  const questionnaire = data?.questionnaire
  const answers = data?.answers || {}
  const currentRecord = data?.currentRecord || {}
  const provenance = data?.provenance || {}
  const redFlags = data?.redFlags || []
  const conflicts = data?.conflicts || []
  const catalog: IntakeFieldDefinition[] = data?.catalog || []

  // Campos críticos (aparecen arriba destacados)
  const criticalFields = catalog.filter((f) => f.isCritical && answers[f.id] !== undefined)

  // Campos del paso activo
  const stepFields = catalog.filter((f) => f.step === activeStep)

  // Parsear adjuntos si existen
  let attachments: { name: string; url: string; type: string }[] = []
  try {
    if (questionnaire?.attachmentsJson) {
      attachments = JSON.parse(questionnaire.attachmentsJson)
    }
  } catch (e) {
    attachments = []
  }

  const handleAcceptField = (field: IntakeFieldDefinition) => {
    const value = editedValues[field.id] !== undefined ? editedValues[field.id] : answers[field.id]
    startTransition(async () => {
      try {
        await acceptFieldToPatientRecordAction(patientId, questionnaireId, field.id, value)
        setAcceptedFields((prev) => new Set(prev).add(field.id))
        setEditingFieldId(null)
        setFeedback({ type: 'success', message: `Campo "${field.label}" aceptado y copiado a la ficha.` })
        setTimeout(() => setFeedback(null), 3000)
        if (onComplete) onComplete()
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Error al aceptar campo' })
      }
    })
  }

  const handleDiscardField = (field: IntakeFieldDefinition) => {
    startTransition(async () => {
      try {
        await discardFieldReviewAction(patientId, questionnaireId, field.id)
        setDiscardedFields((prev) => new Set(prev).add(field.id))
        setEditingFieldId(null)
        setFeedback({ type: 'success', message: `Campo "${field.label}" descartado sin modificar la ficha.` })
        setTimeout(() => setFeedback(null), 3000)
        if (onComplete) onComplete()
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Error al descartar campo' })
      }
    })
  }

  const handleAcceptEntireStep = (stepNumber: number) => {
    const fieldsToCommit: Record<string, any> = {}
    stepFields.forEach((f) => {
      if (answers[f.id] !== undefined && !acceptedFields.has(f.id) && !discardedFields.has(f.id)) {
        fieldsToCommit[f.id] = editedValues[f.id] !== undefined ? editedValues[f.id] : answers[f.id]
      }
    })

    if (Object.keys(fieldsToCommit).length === 0) return

    startTransition(async () => {
      try {
        const res = await acceptStepToPatientRecordAction(patientId, questionnaireId, stepNumber, fieldsToCommit)
        const newAccepted = new Set(acceptedFields)
        Object.keys(fieldsToCommit).forEach((k) => newAccepted.add(k))
        setAcceptedFields(newAccepted)
        setFeedback({ type: 'success', message: `¡${res.countAccepted} campos del paso aceptados correctamente!` })
        setTimeout(() => setFeedback(null), 3000)
        if (onComplete) onComplete()
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Error al aceptar paso' })
      }
    })
  }

  const handleReopen = async () => {
    if (!confirm('¿Deseas reabrir el cuestionario para que el paciente pueda rectificar sus respuestas desde el portal?')) return
    startTransition(async () => {
      try {
        await reopenQuestionnaireAction(questionnaireId)
        setFeedback({ type: 'success', message: 'Cuestionario reabierto en el portal del paciente.' })
        setTimeout(() => {
          onOpenChange(false)
          if (onComplete) onComplete()
        }, 1500)
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Error al reabrir' })
      }
    })
  }

  const pendingCount = questionnaire?.pendingFieldsCount || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-3xs font-bold rounded-full">
                  REVISIÓN CLÍNICA
                </Badge>
                {pendingCount > 0 ? (
                  <Badge className="bg-amber-600 text-white border-0 text-3xs font-black rounded-full">
                    {pendingCount} campos por revisar
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white border-0 text-3xs font-black rounded-full">
                    <Check className="h-[1em] w-[1em] shrink-0" /> Todos los campos revisados
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900 mt-2">
                Revisión de Respuestas: {patientName}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {questionnaire?.title || 'Cuestionario Clínico'} · Compara lado a lado y acepta campo a campo antes de escribir en la ficha.
              </DialogDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReopen}
              disabled={isPending}
              className="rounded-2xl text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reabrir para el paciente</span>
            </Button>
          </div>
        </DialogHeader>

        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">Cargando datos clínicos de la respuesta...</div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* 1. BANDERAS ROJAS RESUMEN (Sección 5.4) */}
            {redFlags.length > 0 && (
              <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Banderas Rojas Clínicas Detectadas ({redFlags.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {redFlags.map((rf: any, i: number) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-rose-100 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-950">{rf.title}</span>
                        <Badge className="bg-rose-600 text-white text-3xs font-black rounded-full">
                          {rf.severity}
                        </Badge>
                      </div>
                      <p className="text-2xs text-gray-600 leading-relaxed">{rf.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CAMPOS CRÍTICOS DESTACADOS (Alergias, medicación, embarazo, lactancia) */}
            {criticalFields.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                    <HeartPulse className="w-4 h-4 text-amber-700" />
                    <span>Campos Críticos Prioritarios (Alergias, Medicación, Embarazo)</span>
                  </div>
                  <span className="text-2xs text-amber-800">Al aceptarlos alimentan la banda de alertas e interacciones</span>
                </div>

                <div className="space-y-2">
                  {criticalFields.map((field) => {
                    const currentVal = currentRecord[field.id]
                    const patientVal = answers[field.id]
                    const hasConflict = conflicts.some((c: any) => c.fieldId === field.id)
                    const isAccepted = acceptedFields.has(field.id)
                    const isDiscarded = discardedFields.has(field.id)

                    return (
                      <div
                        key={field.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          hasConflict
                            ? 'bg-rose-50/80 border-rose-300'
                            : isAccepted
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-white border-amber-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">{field.label}</span>
                              {hasConflict && (
                                <Badge className="bg-rose-600 text-white text-3xs font-black rounded-full">
                                  CONFLICTO CONTRADICTORIO
                                </Badge>
                              )}
                              {isAccepted && (
                                <Badge className="bg-emerald-600 text-white text-3xs font-bold rounded-full">
                                  <Check className="h-[1em] w-[1em] shrink-0" /> Copiado a la Ficha
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs mt-1">
                              <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                <span className="font-bold text-gray-500 block">En ficha actual:</span>
                                <span className="text-gray-800 font-medium">
                                  {currentVal !== null && currentVal !== undefined && currentVal !== ''
                                    ? String(currentVal)
                                    : 'Sin constancia previa'}
                                </span>
                              </div>
                              <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                                <span className="font-bold text-blue-700 block">Declarado por paciente:</span>
                                <span className="text-blue-950 font-bold">{String(patientVal)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isAccepted && !isDiscarded ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptField(field)}
                                  disabled={isPending}
                                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aceptar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDiscardField(field)}
                                  disabled={isPending}
                                  className="rounded-xl text-xs text-gray-500 hover:text-gray-800"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Descartar</span>
                                </Button>
                              </>
                            ) : (
                              <span className="text-2xs font-semibold text-gray-400">Revisado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 3. NAVEGADOR DE PASOS 1 AL 7 (Espejo de la ficha) */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-100 scrollbar-none">
                {INTAKE_STEPS.map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                      activeStep === s.step
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Paso {s.step}: {s.title}
                  </button>
                ))}
              </div>

              {/* Contenido del paso activo */}
              <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Paso {activeStep}: {INTAKE_STEPS.find((s) => s.step === activeStep)?.title}
                    </h4>
                    <p className="text-2xs text-gray-500">
                      {INTAKE_STEPS.find((s) => s.step === activeStep)?.description}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAcceptEntireStep(activeStep)}
                    disabled={isPending}
                    className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aceptar todo el paso</span>
                  </Button>
                </div>

                <div className="divide-y divide-gray-100">
                  {stepFields.map((field) => {
                    const currentVal = currentRecord[field.id]
                    const patientVal = answers[field.id]
                    const isAccepted = acceptedFields.has(field.id)
                    const isDiscarded = discardedFields.has(field.id)
                    const isEditing = editingFieldId === field.id
                    const displayPatientVal =
                      editedValues[field.id] !== undefined ? editedValues[field.id] : patientVal

                    if (patientVal === undefined && currentVal === undefined) return null

                    return (
                      <div key={field.id} className="py-3.5 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">{field.label}</span>
                              {field.isDeclaredMeasurement && (
                                <Badge variant="outline" className="text-3xs text-purple-700 border-purple-200 bg-purple-50">
                                  Dato declarado (no entra en gráficas)
                                </Badge>
                              )}
                              {isAccepted && (
                                <Badge className="bg-emerald-600 text-white text-3xs font-bold rounded-full">
                                  <Check className="h-[1em] w-[1em] shrink-0" /> Aceptado en ficha
                                </Badge>
                              )}
                              {isDiscarded && (
                                <Badge variant="outline" className="text-3xs text-gray-400 border-gray-200">
                                  Descartado
                                </Badge>
                              )}
                            </div>

                            {/* Comparación Lado a Lado */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                                <span className="text-3xs font-bold text-gray-400 uppercase tracking-wider block">
                                  Valor actual en Ficha
                                </span>
                                <span className="font-medium text-gray-800">
                                  {currentVal !== null && currentVal !== undefined && currentVal !== ''
                                    ? String(currentVal)
                                    : <em className="text-gray-400">Sin rellenar</em>}
                                </span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                                <span className="text-3xs font-bold text-blue-600 uppercase tracking-wider block">
                                  Respuesta del Paciente
                                </span>
                                {isEditing ? (
                                  <div className="mt-1 space-y-2">
                                    {field.type === 'textarea' ? (
                                      <Textarea
                                        value={displayPatientVal || ''}
                                        onChange={(e) =>
                                          setEditedValues({ ...editedValues, [field.id]: e.target.value })
                                        }
                                        className="text-xs min-h-[60px]"
                                      />
                                    ) : (
                                      <Input
                                        value={displayPatientVal || ''}
                                        onChange={(e) =>
                                          setEditedValues({ ...editedValues, [field.id]: e.target.value })
                                        }
                                        className="text-xs h-8"
                                      />
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <Button
                                        size="sm"
                                        onClick={() => setEditingFieldId(null)}
                                        className="h-7 text-2xs rounded-lg bg-blue-600 text-white"
                                      >
                                        Guardar edición
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingFieldId(null)}
                                        className="h-7 text-2xs rounded-lg text-gray-500"
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2 mt-0.5">
                                    <span className="font-bold text-blue-950">
                                      {displayPatientVal !== null && displayPatientVal !== undefined && displayPatientVal !== ''
                                        ? String(displayPatientVal)
                                        : <em className="text-gray-400">Sin respuesta</em>}
                                    </span>
                                    <button
                                      onClick={() => setEditingFieldId(field.id)}
                                      className="text-gray-400 hover:text-blue-600 p-1 rounded-md"
                                      title="Editar antes de aceptar"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Trazabilidad y Origen */}
                            {provenance[field.id] && (
                              <p className="text-3xs text-gray-400 pt-1">
                                Última actualización: {provenance[field.id].acceptedBy} (
                                {new Date(provenance[field.id].acceptedAt).toLocaleDateString('es-ES')})
                              </p>
                            )}
                          </div>

                          {/* Acciones por campo */}
                          <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0">
                            {!isAccepted && !isDiscarded && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptField(field)}
                                  disabled={isPending}
                                  className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-2xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Aceptar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDiscardField(field)}
                                  disabled={isPending}
                                  className="h-8 px-2.5 rounded-xl text-xs text-gray-400 hover:text-gray-700"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 4. ADJUNTOS DEL FORMULARIO (Analíticas PDF o fotos) */}
            {attachments.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Documentos y Analíticas Adjuntadas por el Paciente ({attachments.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => {
                    const href = attachmentHref(att.url)
                    return (
                      <div key={idx} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <p className="font-bold text-gray-900 truncate">{att.name}</p>
                          <p className="text-2xs text-gray-500 uppercase">{att.type}</p>
                        </div>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 shrink-0"
                            aria-label={`Abrir ${att.name}`}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <span
                            className="p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 shrink-0"
                            title="Archivo no disponible"
                          >
                            <Download className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-gray-100 pt-4 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-2xs text-gray-400">
            Regla de oro: los datos del paciente se escriben en su ficha únicamente cuando Eva los confirma.
          </p>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl text-xs"
          >
            Cerrar revisión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
