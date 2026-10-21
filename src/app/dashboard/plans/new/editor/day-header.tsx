'use client'

import { useRef } from 'react'
import { Check, Copy, FileText, Pencil } from 'lucide-react'

interface DayHeaderProps {
  name: string
  dayNumber: number
  letter: string
  notes: string
  completed: boolean
  onRename: (name: string) => void
  onOpenNotes: () => void
  onCopyDay: () => void
  onToggleComplete: () => void
  kcal: number
}

/**
 * Cabecera de día compacta (azul oscuro): nombre editable, notas, copiar y
 * check verde de día completado. Los siete días caben en pantalla sin scroll
 * horizontal; en pantallas estrechas se oculta el número de día para dejar
 * todo el ancho al nombre.
 */
export function DayHeader({
  name,
  dayNumber,
  letter,
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
    <header className="sticky top-0 z-20 rounded-xl bg-slate-900 px-1 py-1 text-white shadow-md sm:px-1.5 sm:py-1.5">
      {/* Móvil: letra del día + estado (los 7 días caben siempre) */}
      <div className="flex flex-col items-center gap-0.5 sm:hidden">
        <span className="text-[11px] font-black uppercase">{letter}</span>
        <span
          className={`h-1 w-1 rounded-full ${completed ? 'bg-emerald-400' : 'bg-white/30'}`}
          aria-hidden
        />
      </div>

      <div className="hidden sm:block">
        <div className="flex items-center justify-between gap-1">
          <span className="hidden whitespace-nowrap text-[8px] font-black uppercase tracking-wider text-white/50 lg:inline">
            Día {dayNumber}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                nameInputRef.current?.focus()
                nameInputRef.current?.select()
              }}
              className="rounded bg-white/10 p-0.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              title="Editar nombre del día"
              aria-label="Editar nombre del día"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={onOpenNotes}
              className={`rounded p-0.5 transition-colors ${
                notes ? 'bg-amber-400/25 text-amber-200' : 'bg-white/10 text-white/70 hover:text-white'
              }`}
              title={notes || 'Notas del día'}
              aria-label="Notas del día"
            >
              <FileText className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={onCopyDay}
              className="rounded bg-white/10 p-0.5 text-white/70 transition-colors hover:text-white"
              title="Copiar día a otro día o a la semana"
              aria-label="Copiar día"
            >
              <Copy className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={onToggleComplete}
              className={`rounded p-0.5 transition-colors ${
                completed ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:text-emerald-300'
              }`}
              title={completed ? 'Día completado' : 'Marcar día como completado'}
              aria-label="Marcar día como completado"
            >
              <Check className="h-3 w-3" />
            </button>
          </div>
        </div>

        <input
          ref={nameInputRef}
          value={name}
          onChange={(event) => onRename(event.target.value)}
          className="mt-0.5 w-full min-w-0 rounded bg-transparent px-0.5 text-center text-[10px] font-black uppercase tracking-wide text-white outline-none focus:bg-white/10 sm:text-[11px]"
          aria-label={`Nombre del día ${dayNumber}`}
          title={name}
        />

        <p className="text-center text-[8px] font-semibold text-white/50">{Math.round(kcal)} kcal</p>
      </div>
    </header>
  )
}
