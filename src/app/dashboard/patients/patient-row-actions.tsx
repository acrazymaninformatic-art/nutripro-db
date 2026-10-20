'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Copy,
  Loader2,
  Trash2,
  Undo2,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPatientPreviewSummary, duplicatePatient, type PatientPreviewSummary } from './preview-actions'
import { restorePatient } from './actions'

function formatObjective(objective: string | null) {
  if (!objective) return 'Sin objetivo'
  const map: Record<string, string> = {
    weight_loss: 'Pérdida de peso',
    maintenance: 'Mantenimiento',
    muscle_gain: 'Ganancia de masa',
    performance: 'Rendimiento deportivo',
    health: 'Salud general',
    other: 'Otro',
  }
  return map[objective.toLowerCase()] || objective
}

/* ------------------------------------------------------------------ */
/* Vista previa de la ficha (drawer)                                   */
/* ------------------------------------------------------------------ */

export function PatientPreviewTrigger({
  patientId,
  name,
  className,
}: {
  patientId: string
  name: string
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [summary, setSummary] = useState<PatientPreviewSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    getPatientPreviewSummary(patientId)
      .then((result) => {
        if (!cancelled) setSummary(result)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, patientId])

  const rows: Array<{ label: string; value: React.ReactNode }> = summary
    ? [
        { label: 'Objetivo', value: formatObjective(summary.objetivo) },
        {
          label: 'Peso actual',
          value: summary.pesoActual ? `${summary.pesoActual} kg${summary.imc ? ` · IMC ${summary.imc}` : ''}` : '—',
        },
        { label: 'Última visita', value: summary.ultimaVisita || 'Sin registro' },
        { label: 'Próxima cita', value: summary.proximaCita || 'Sin programar' },
        {
          label: 'Plan activo',
          value: summary.planActivo
            ? `${summary.planActivo}${summary.kcalPlan ? ` · ${Math.round(summary.kcalPlan)} kcal` : ''}`
            : 'Sin plan',
        },
        {
          label: 'Consentimientos',
          value: `${summary.consentimientos.completados}/${summary.consentimientos.total} completados`,
        },
        { label: 'Último seguimiento', value: summary.ultimoSeguimiento || 'Sin registros' },
      ]
    : []

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSummary(null)
          setIsLoading(true)
          setIsOpen(true)
        }}
        className={className}
        title="Ver resumen de la ficha"
      >
        {name}
      </button>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex justify-end">
              <button
                type="button"
                aria-label="Cerrar vista previa"
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              />
              <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                      Vista previa de la ficha
                    </p>
                    <h2 className="text-lg font-black text-slate-900">
                      {summary?.nombre || 'Cargando…'}
                    </h2>
                    <p className="text-xs text-slate-500">{summary?.email || summary?.phone || ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Cerrar"
                    className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {isLoading ? (
                  <p className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando la ficha…
                  </p>
                ) : (
                  <>
                    <dl className="mt-6 space-y-2.5">
                      {rows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5"
                        >
                          <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {row.label}
                          </dt>
                          <dd className="text-right text-xs font-bold text-slate-800">{row.value}</dd>
                        </div>
                      ))}
                    </dl>

                    {summary && summary.alertas.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {summary.alertas.map((alert) => (
                          <p
                            key={alert}
                            className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] font-semibold text-amber-900"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {alert}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    <Button
                      asChild
                      className="mt-6 w-full rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      <a href={`/dashboard/patients/${patientId}`}>
                        <User className="mr-1.5 h-4 w-4" />
                        Abrir la ficha completa
                      </a>
                    </Button>
                  </>
                )}
              </aside>
            </div>,
            document.body
          )
        : null}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Duplicar ficha                                                      */
/* ------------------------------------------------------------------ */

export function DuplicatePatientButton({ patientId }: { patientId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      title="Duplicar ficha (sin copiar el portal)"
      aria-label="Duplicar ficha"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await duplicatePatient(patientId)
            router.push(`/dashboard/patients/${result.id}`)
          } catch {
            // El error se refleja en el mensaje global de la aplicación.
          }
        })
      }
      className="w-8 h-8 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-[0.95] shadow-2xs disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Mover a la papelera con opción de deshacer                           */
/* ------------------------------------------------------------------ */

export function TrashPatientButton({
  patientId,
  patientName,
}: {
  patientId: string
  patientName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [undoState, setUndoState] = useState<{ visible: boolean; patientId: string } | null>(null)

  useEffect(() => {
    if (!undoState?.visible) return
    const timer = setTimeout(() => setUndoState(null), 8000)
    return () => clearTimeout(timer)
  }, [undoState])

  return (
    <>
      <button
        type="button"
        title="Mover a la papelera"
        aria-label="Mover a la papelera"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const { deletePatient } = await import('./actions')
            await deletePatient(patientId)
            setUndoState({ visible: true, patientId })
            router.refresh()
          })
        }
        className="w-8 h-8 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-all active:scale-[0.95] shadow-2xs disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      {undoState?.visible
        ? createPortal(
            <div className="fixed bottom-6 left-1/2 z-[90] w-[min(92vw,26rem)] -translate-x-1/2">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur">
                <Trash2 className="h-4 w-4 shrink-0 text-amber-300" />
                <p className="min-w-0 flex-1 text-xs font-semibold">
                  {patientName} se ha movido a la papelera.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      await restorePatient(undoState.patientId)
                      setUndoState(null)
                      router.refresh()
                    })
                  }
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/25"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Deshacer
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
