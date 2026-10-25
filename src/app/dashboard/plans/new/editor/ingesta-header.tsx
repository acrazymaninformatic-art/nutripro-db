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
    <div
      className="flex h-full min-h-full flex-col justify-between rounded-xl p-1.5 text-white shadow-sm transition-all"
      style={{ backgroundColor: color }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[10px] font-black uppercase tracking-wider text-white drop-shadow-sm">
            {label}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onToggleLock}
              className="rounded bg-black/25 p-0.5 text-white/90 transition-colors hover:bg-black/40 hover:text-white"
              title={locked ? 'Ingesta bloqueada' : 'Bloquear ingesta'}
              aria-label={locked ? 'Desbloquear ingesta' : 'Bloquear ingesta'}
            >
              {locked ? <Lock className="h-2.5 w-2.5 text-amber-300" /> : <Unlock className="h-2.5 w-2.5" />}
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded bg-black/25 p-0.5 text-white/90 transition-colors hover:bg-black/40 hover:text-white"
              title={collapsed ? 'Desplegar' : 'Plegar'}
            >
              {collapsed ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronUp className="h-2.5 w-2.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 text-[8px] font-bold text-white/95">
          <span className="rounded bg-black/25 px-1 py-0.5 font-mono">{time || '08:00'}</span>
          <span className="rounded bg-black/25 px-1 py-0.5">{percent}%</span>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-1 border-t border-white/25 pt-1">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex w-full items-center justify-center gap-1 rounded bg-white/25 px-1 py-0.5 text-[8px] font-black text-white backdrop-blur-sm transition-colors hover:bg-white/40"
          title="Editar ingesta en el panel lateral"
        >
          <Edit3 className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">Configurar</span>
        </button>
      </div>
    </div>
  )
}
