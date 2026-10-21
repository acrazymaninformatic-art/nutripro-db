'use client'

import { ChevronDown, ChevronUp, Edit3, Lock, StickyNote, Unlock } from 'lucide-react'

interface IngestaHeaderProps {
  label: string
  color: string
  time: string
  collapsed: boolean
  locked: boolean
  notes: string
  percent: number
  onToggleCollapse: () => void
  onEdit: () => void
  onToggleLock: () => void
}

/**
 * Cabecera de ingesta con la banda de color a toda la altura de la fila.
 * El subtotal y el aviso viven en cada plato (celda día/ingesta) para que el
 * semáforo sea siempre el de ese plato concreto.
 */
export function IngestaHeader({
  label,
  color,
  time,
  collapsed,
  locked,
  notes,
  percent,
  onToggleCollapse,
  onEdit,
  onToggleLock,
}: IngestaHeaderProps) {
  return (
    <div className="flex h-full min-h-full items-stretch gap-1">
      {/* Banda vertical con el nombre de la ingesta, a toda la altura */}
      <div
        className="flex w-full shrink-0 items-center justify-center rounded-lg text-white shadow-sm sm:w-6 lg:w-7"
        style={{ backgroundColor: color }}
        title={`${label} · ${percent}% del día`}
      >
        <span
          className="text-[8px] font-black uppercase tracking-wider sm:text-[9px]"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {label}
        </span>
      </div>

      <div className="hidden min-w-0 flex-1 flex-col justify-start gap-1.5 py-0.5 sm:flex">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-w-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 lg:px-1.5"
            title="Editar ingesta"
          >
            <Edit3 className="h-2.5 w-2.5 shrink-0" />
            <span className="hidden truncate xl:inline">Editar ingesta</span>
          </button>

          <button
            type="button"
            onClick={onToggleLock}
            className={`rounded-md border p-0.5 transition-colors ${
              locked
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-400 hover:text-amber-600'
            }`}
            title={locked ? 'Ingesta bloqueada' : 'Bloquear ingesta'}
            aria-label={locked ? 'Desbloquear ingesta' : 'Bloquear ingesta'}
          >
            {locked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
          </button>

          {notes && (
            <span
              className="inline-flex items-center rounded-full bg-amber-100 p-0.5 text-amber-800"
              title={notes}
              aria-label="La ingesta tiene notas"
            >
              <StickyNote className="h-2.5 w-2.5" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <span className="truncate text-[8px] font-bold text-slate-400 sm:text-[9px]">{time}</span>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="ml-auto rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title={collapsed ? 'Desplegar ingesta' : 'Plegar ingesta'}
            aria-label={collapsed ? 'Desplegar ingesta' : 'Plegar ingesta'}
          >
            {collapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
