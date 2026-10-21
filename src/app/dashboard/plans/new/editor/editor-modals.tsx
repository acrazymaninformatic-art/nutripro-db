'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, BookOpen, Check, Search } from 'lucide-react'
import { ModalPortal } from '@/components/ui/modal-portal'
import { Button } from '@/components/ui/button'
import { getFoodImage, FALLBACK_FOOD_SVG } from '@/lib/nutrition'
import type { EditorFood } from './types'

/* ------------------------------------------------------------------ */
/* Intercambiar un alimento por otro equivalente                      */
/* ------------------------------------------------------------------ */

interface SwapFoodModalProps {
  open: boolean
  current: EditorFood | undefined
  foods: EditorFood[]
  onClose: () => void
  onSwap: (food: EditorFood) => void
}

/** Puntúa la equivalencia por proximity de macros (kcal, proteína, HC y grasa). */
function similarity(a: EditorFood, b: EditorFood) {
  const distance =
    Math.abs(a.calories - b.calories) / 100 +
    Math.abs(a.proteinG - b.proteinG) * 0.6 +
    Math.abs(a.carbsG - b.carbsG) * 0.4 +
    Math.abs(a.fatG - b.fatG) * 0.5
  return Math.max(0, 100 - distance)
}

export function SwapFoodModal({ open, current, foods, onClose, onSwap }: SwapFoodModalProps) {
  const [query, setQuery] = useState('')

  const candidates = useMemo(() => {
    if (!current) return []
    const term = query.trim().toLowerCase()
    return foods
      .filter((food) => food.id !== current.id)
      .filter((food) => (term ? food.name.toLowerCase().includes(term) : true))
      .map((food) => ({ food, score: similarity(current, food) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
  }, [current, foods, query])

  if (!open || !current) return null

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ArrowLeftRight className="h-4 w-4 text-blue-600" />
              Intercambiar por un equivalente
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Sustituye «{current.name}» por el alimento con macros más similares.
            </p>
          </header>

          <div className="border-b border-slate-100 px-5 py-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-400">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar equivalente…"
                className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
              />
            </label>
          </div>

          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3">
            {candidates.map(({ food, score }) => (
              <button
                key={food.id}
                type="button"
                onClick={() => onSwap(food)}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:border-blue-400 hover:shadow-md"
              >
                <div className="h-24 w-full overflow-hidden bg-slate-100">
                  <img
                    src={getFoodImage(food)}
                    alt={food.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = FALLBACK_FOOD_SVG
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-[11px] font-bold text-slate-900">{food.name}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                    {Math.round(food.calories)} kcal · {Math.round(food.proteinG * 10) / 10} P ·{' '}
                    {Math.round(food.carbsG * 10) / 10} HC
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                    <Check className="h-2.5 w-2.5" />
                    {Math.round(score)}% similar
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

/* ------------------------------------------------------------------ */
/* Notas de día / ingesta                                              */
/* ------------------------------------------------------------------ */

interface NotesModalProps {
  open: boolean
  title: string
  notes: string
  onClose: () => void
  onSave: (notes: string) => void
}

export function NotesModal({ open, title, notes, onClose, onSave }: NotesModalProps) {
  const [draft, setDraft] = useState(notes)

  if (!open) return null

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[97] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
          </header>
          <div className="p-5">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={5}
              placeholder="Escribe aquí las notas internas…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
          <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 rounded-xl border-slate-200 text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave(draft)
                onClose()
              }}
              className="h-8 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              Guardar notas
            </Button>
          </footer>
        </div>
      </div>
    </ModalPortal>
  )
}

/* ------------------------------------------------------------------ */
/* Tutorial                                                            */
/* ------------------------------------------------------------------ */

export function TutorialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  const steps = [
    'Arrastra cualquier tarjeta de alimento a otra ingesta o a otro día.',
    'Edita los gramos directamente en la tarjeta: las kcal y los macros se recalculan al instante.',
    'Usa «+ Añadir» para buscar alimentos con filtros por categoría.',
    'Copia, corta y pega alimentos, ingestas o días enteros con el modo portapapeles.',
    'Marca días como completados y añade notas por día o por ingesta.',
    'Consulta el panel lateral «Información del menú» para ver los requisitos y el semáforo.',
  ]

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[98] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900">Tutorial del editor de menús</h3>
          </header>
          <ol className="space-y-2.5 p-5">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-xs font-semibold text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <footer className="flex justify-end border-t border-slate-100 px-5 py-3">
            <Button
              type="button"
              onClick={onClose}
              className="h-8 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
            >
              Entendido
            </Button>
          </footer>
        </div>
      </div>
    </ModalPortal>
  )
}
