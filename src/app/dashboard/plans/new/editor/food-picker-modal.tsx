'use client'

import { useMemo, useState } from 'react'
import { Filter, Plus, Search } from 'lucide-react'
import { ModalPortal } from '@/components/ui/modal-portal'
import { Button } from '@/components/ui/button'
import { getFoodImage, FALLBACK_FOOD_SVG } from '@/lib/nutrition'
import type { EditorFood } from './types'

interface FoodPickerModalProps {
  open: boolean
  foods: EditorFood[]
  onClose: () => void
  onSelect: (food: EditorFood) => void
  title: string
}

const CATEGORY_FILTERS = [
  'Todos',
  'Cereales y granos',
  'Carnes',
  'Pescados y mariscos',
  'Huevos y lácteos',
  'Legumbres',
  'Verduras y hortalizas',
  'Frutas',
  'Lácteos',
  'Bebidas',
]

/** Buscador de alimentos con filtros por categoría. */
export function FoodPickerModal({ open, foods, onClose, onSelect, title }: FoodPickerModalProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')

  const categories = useMemo(() => {
    const found = new Set(
      foods
        .map((food) => food.category || '')
        .filter(Boolean)
        .map((value) => value.split(' y ')[0])
    )
    return ['Todos', ...Array.from(found).slice(0, 12)]
  }, [foods])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return foods
      .filter((food) => {
        if (category !== 'Todos') {
          const foodCategory = (food.category || '').toLowerCase()
          if (!foodCategory.includes(category.toLowerCase().split(' ')[0])) return false
        }
        if (!term) return true
        return `${food.name} ${food.category || ''}`.toLowerCase().includes(term)
      })
      .slice(0, 120)
  }, [foods, query, category])

  if (!open) return null

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Busca por nombre y filtra por categoría. Al elegir, el alimento se añade a la ingesta.
            </p>
          </header>

          <div className="space-y-2.5 border-b border-slate-100 px-5 py-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-400">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar alimento…"
                className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
              />
            </label>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {(categories.length ? categories : CATEGORY_FILTERS).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                    category === item
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => onSelect(food)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:border-blue-400 hover:shadow-md"
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
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-[11px] font-bold text-slate-900">{food.name}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                    {Math.round(food.calories)} kcal · {Math.round(food.proteinG * 10) / 10} P ·{' '}
                    {Math.round(food.carbsG * 10) / 10} HC · {Math.round(food.fatG * 10) / 10} G
                  </p>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-xs font-semibold text-slate-500">
                No hay alimentos que coincidan con la búsqueda.
              </p>
            )}
          </div>

          <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-[11px] font-semibold text-slate-500">
              {filtered.length} alimentos disponibles
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 rounded-xl border-slate-200 text-xs font-bold"
            >
              Cerrar
            </Button>
          </footer>
        </div>
      </div>
    </ModalPortal>
  )
}

/** Botón "+ Añadir" con el subtotal de kcal de la celda. */
export function AddFoodButton({
  kcal,
  onClick,
  disabled,
  ariaLabel,
}: {
  kcal: number
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex w-full min-w-0 items-center justify-between gap-1 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-1 py-1 text-[9px] font-bold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 sm:px-1.5 sm:text-[10px]"
    >
      <span className="inline-flex min-w-0 items-center gap-0.5">
        <Plus className="h-2.5 w-2.5 shrink-0" />
        <span className="truncate">Añadir</span>
      </span>
      <span className="hidden shrink-0 font-mono tabular-nums sm:inline">
        {Math.round(kcal)} kcal
      </span>
    </button>
  )
}
