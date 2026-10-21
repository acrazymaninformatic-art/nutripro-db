'use client'

import { AlertTriangle, Check, ChevronDown, ChevronUp, Edit3, Lock, Unlock } from 'lucide-react'
import { evaluateNutrient, formatNumber } from '@/lib/menu-config'

interface IngestaHeaderProps {
  label: string
  color: string
  time: string
  collapsed: boolean
  locked: boolean
  notes: string
  percent: number
  kcal: number
  targetKcal: number
  tolerancePct: number
  onToggleCollapse: () => void
  onEdit: () => void
  onToggleLock: () => void
}

/**
 * Cabecera de ingesta: etiqueta vertical con color propio, botón
 * "Editar ingesta" y subtotal con barra de progreso, check circular y
 * triángulo de aviso cuando se desvía del objetivo.
 */
export function IngestaHeader({
  label,
  color,
  time,
  collapsed,
  locked,
  notes,
  percent,
  kcal,
  targetKcal,
  tolerancePct,
  onToggleCollapse,
  onEdit,
  onToggleLock,
}: IngestaHeaderProps) {
  const evaluation = evaluateNutrient(kcal, targetKcal, tolerancePct)
  const pct = targetKcal > 0 ? Math.min((kcal / targetKcal) * 100, 100) : 0
  const over = targetKcal > 0 && kcal > targetKcal

  const barColor =
    evaluation.status === 'green'
      ? 'bg-emerald-500'
      : evaluation.status === 'yellow'
        ? 'bg-amber-500'
        : 'bg-red-500'

  return (
    <div className="sticky left-0 z-10 flex items-stretch gap-1.5 bg-white">
      {/* Etiqueta vertical con color propio */}
      <div
        className="flex w-7 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: color }}
        title={`${label} · ${percent}% del día`}
      >
        <span
          className="text-[10px] font-black uppercase tracking-wider"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {label}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <Edit3 className="h-3 w-3" />
            Editar ingesta
          </button>

          <button
            type="button"
            onClick={onToggleLock}
            className={`rounded-lg border px-1.5 py-0.5 transition-colors ${
              locked
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-400 hover:text-amber-600'
            }`}
            title={locked ? 'Ingesta bloqueada' : 'Bloquear ingesta'}
            aria-label="Bloquear ingesta"
          >
            {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </button>

          {notes && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
              nota
            </span>
          )}

          <span className="ml-auto text-[10px] font-bold text-slate-400">{time}</span>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={collapsed ? 'Desplegar ingesta' : 'Plegar ingesta'}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Subtotal con barra, check y triángulo */}
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              evaluation.status === 'green'
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : evaluation.status === 'yellow'
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-red-500 bg-red-500 text-white'
            }`}
            title={`${Math.round((kcal / (targetKcal || 1)) * 100)}% del objetivo`}
          >
            <Check className="h-2.5 w-2.5" />
          </span>

          {evaluation.status !== 'green' && (
            <span title={evaluation.message} className="text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          )}

          <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums text-slate-700">
            {formatNumber(kcal, 0)} / {formatNumber(targetKcal, 0)} kcal
          </span>
        </div>
      </div>
    </div>
  )
}
