'use client'

import { useRef } from 'react'
import { Check, Copy, Edit3, FileText } from 'lucide-react'

interface DayHeaderProps {
  name: string
  dayNumber: number
  notes: string
  completed: boolean
  onRename: (name: string) => void
  onOpenNotes: () => void
  onCopyDay: () => void
  onToggleComplete: () => void
  kcal: number
}

/**
 * Cabecera de día (estilo editor de menús): fondo azul oscuro, botón
 * "Editar día", nombre editable, icono de notas, icono de copiar y check
 * verde de día completado.
 */
export function DayHeader({
  name,
  dayNumber,
  notes,
  completed,
  onRename,
  onOpenNotes,
  onCopyDay,
  onToggleComplete,
  kcal,
}: DayHeaderProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="sticky top-0 z-20 rounded-t-2xl bg-slate-900 px-2 py-2 text-white shadow-md">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            nameInputRef.current?.focus()
            nameInputRef.current?.select()
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white/90 transition-colors hover:bg-white/20"
          title="Editar día"
        >
          <Edit3 className="h-3 w-3" />
          Editar día
        </button>

        <div className="min-w-0 flex-1 text-center">
          <input
            ref={nameInputRef}
            value={name}
            onChange={(event) => onRename(event.target.value)}
            className="w-full bg-transparent text-center text-[13px] font-black uppercase tracking-wide text-white outline-none focus:bg-white/10 focus:rounded"
            aria-label={`Nombre del día ${dayNumber}`}
          />
          <p className="text-[9px] font-semibold text-white/60">
            Día {dayNumber} · {Math.round(kcal)} kcal
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNotes}
          className={`rounded-lg p-1 transition-colors ${
            notes ? 'bg-amber-400/25 text-amber-200' : 'bg-white/10 text-white/70 hover:text-white'
          }`}
          title={notes || 'Notas del día'}
          aria-label="Notas del día"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onCopyDay}
          className="rounded-lg bg-white/10 p-1 text-white/70 transition-colors hover:text-white"
          title="Copiar día a otro día o a la semana"
          aria-label="Copiar día"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleComplete}
          className={`rounded-lg p-1 transition-colors ${
            completed ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:text-emerald-300'
          }`}
          title={completed ? 'Día completado' : 'Marcar día como completado'}
          aria-label="Marcar día como completado"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
