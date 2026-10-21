'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, GripVertical, Minus, Plus, Siren, X } from 'lucide-react'
import { getFoodImage, FALLBACK_FOOD_SVG } from '@/lib/nutrition'
import { MACRO_CHIP_STYLES, type EditorFood, type EditorItem } from './types'

export type CardSize = 'compact' | 'normal' | 'large'

interface FoodCardProps {
  item: EditorItem
  food: EditorFood | undefined
  size: CardSize
  conflictLabel?: string | null
  conflictMessage?: string | null
  onChangeQuantity: (grams: number) => void
  onRemove: () => void
  onSwap: () => void
  onDragStart: () => void
  onDragEnd: () => void
  isDragging?: boolean
  isCompleted?: boolean
  onToggleComplete?: () => void
}

const SIZE_CONFIG: Record<
  CardSize,
  { photo: string; name: string; chips: string; padding: string; hideChips: boolean }
> = {
  compact: { photo: 'aspect-[16/9]', name: 'text-[11px] leading-tight', chips: 'text-[9px]', padding: 'p-1.5', hideChips: true },
  normal: { photo: 'aspect-[16/9]', name: 'text-xs leading-snug', chips: 'text-[10px]', padding: 'p-2', hideChips: false },
  large: { photo: 'aspect-[16/9]', name: 'text-[13px] leading-snug', chips: 'text-[11px]', padding: 'p-2.5', hideChips: false },
}

function Chip({
  kind,
  value,
  suffix,
}: {
  kind: keyof typeof MACRO_CHIP_STYLES
  value: number
  suffix: string
}) {
  return (
    <span
      className={`rounded-md border px-1.5 py-0.5 font-black tabular-nums ${MACRO_CHIP_STYLES[kind]} ${MACRO_CHIP_STYLES[kind].includes('text-[11px]') ? '' : ''}`}
      style={{ fontSize: 'inherit' }}
    >
      {value}
      {suffix}
    </span>
  )
}

/**
 * Tarjeta de alimento con foto grande 16:9, nombre completo en dos líneas,
 * ración editable con botones +/− y chips de macros en color.
 */
export function FoodCard({
  item,
  food,
  size,
  conflictLabel,
  conflictMessage,
  onChangeQuantity,
  onRemove,
  onSwap,
  onDragStart,
  onDragEnd,
  isDragging,
  isCompleted,
  onToggleComplete,
}: FoodCardProps) {
  const config = SIZE_CONFIG[size]
  const [draftGrams, setDraftGrams] = useState<string>(String(item.quantityG))
  const [imageLoaded, setImageLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraftGrams(String(item.quantityG))
  }, [item.quantityG])

  const factor = (item.quantityG || 0) / 100
  const kcal = food ? Math.round(food.calories * factor) : 0
  const carbs = food ? Math.round(food.carbsG * factor * 10) / 10 : 0
  const protein = food ? Math.round(food.proteinG * factor * 10) / 10 : 0
  const fat = food ? Math.round(food.fatG * factor * 10) / 10 : 0
  const fiber = food ? Math.round((food.fiberG || 0) * factor * 10) / 10 : 0

  const commitGrams = (raw: string) => {
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraftGrams(String(item.quantityG))
      return
    }
    onChangeQuantity(Math.round(parsed * 10) / 10)
  }

  const step = (delta: number) => {
    const next = Math.max(0, Math.round((item.quantityG + delta) * 10) / 10)
    setDraftGrams(String(next))
    onChangeQuantity(next)
  }

  const imageUrl = food ? getFoodImage(food) : ''
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
        conflictMessage
          ? 'border-red-400 ring-2 ring-red-200'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
      } ${isDragging ? 'opacity-40' : ''} ${isCompleted ? 'ring-2 ring-emerald-300' : ''}`}
      title={conflictMessage || 'Arrastra para mover a otro día u otra ingesta'}
    >
      {/* Foto 16:9 */}
      <div className={`relative w-full overflow-hidden bg-slate-100 ${config.photo}`}>
        {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-slate-100" />}
        <img
          src={imageUrl}
          alt={food?.name || 'Alimento'}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = FALLBACK_FOOD_SVG
            setImageLoaded(true)
          }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Asa de arrastre */}
        <span className="absolute left-1 top-1 rounded-md bg-white/85 p-0.5 text-slate-500 opacity-70 transition-opacity group-hover:opacity-100">
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        {/* Quitar */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded-md bg-white/90 p-0.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label={`Quitar ${food?.name || 'alimento'}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Check de completeness */}
        {onToggleComplete && (
          <button
            type="button"
            onClick={onToggleComplete}
            className={`absolute bottom-1 right-1 rounded-md p-0.5 transition-colors ${
              isCompleted
                ? 'bg-emerald-500 text-white'
                : 'bg-white/90 text-slate-400 hover:text-emerald-600'
            }`}
            aria-label="Marcar alimento como completado"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Cuerpo */}
      <div className={`flex flex-1 flex-col gap-1.5 ${config.padding}`}>
        <div className="flex items-start gap-1">
          <p className={`min-w-0 flex-1 font-bold text-slate-900 ${config.name} line-clamp-2`}>
            {food?.name || 'Alimento'}
          </p>
          {conflictLabel && (
            <span
              className="mt-0.5 shrink-0 rounded bg-red-600 px-1 py-0.5 text-[9px] font-black text-white"
              title={conflictMessage ?? undefined}
            >
              <Siren className="h-2.5 w-2.5" />
            </span>
          )}
        </div>

        {/* Gramos editables */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-5)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
            aria-label="Reducir ración"
          >
            <Minus className="h-3 w-3" />
          </button>

          <label className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15">
            <input
              ref={inputRef}
              type="number"
              min={0}
              step="any"
              value={draftGrams}
              onChange={(event) => setDraftGrams(event.target.value)}
              onBlur={(event) => commitGrams(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitGrams((event.target as HTMLInputElement).value)
                  event.currentTarget.blur()
                }
              }}
              className="w-full min-w-0 bg-transparent text-[11px] font-black text-slate-800 outline-none"
              aria-label="Gramos"
            />
            <span className="shrink-0 text-[10px] font-bold text-slate-400">g</span>
          </label>

          <button
            type="button"
            onClick={() => step(5)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
            aria-label="Aumentar ración"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Chips de macros */}
        {!config.hideChips && (
          <div className={`flex flex-wrap gap-1 font-bold ${config.chips}`}>
            <Chip kind="kcal" value={kcal} suffix="kcal" />
            <Chip kind="carbs" value={carbs} suffix="HC" />
            <Chip kind="protein" value={protein} suffix="Prot" />
            <Chip kind="fat" value={fat} suffix="Grasa" />
            <Chip kind="fiber" value={fiber} suffix="Fibra" />
          </div>
        )}

        <button
          type="button"
          onClick={onSwap}
          className="mt-auto text-[10px] font-bold text-slate-400 underline-offset-2 transition-colors hover:text-blue-700 hover:underline"
        >
          Intercambiar por equivalente
        </button>
      </div>
    </article>
  )
}
