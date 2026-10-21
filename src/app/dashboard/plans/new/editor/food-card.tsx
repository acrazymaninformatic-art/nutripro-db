'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeftRight, Copy, GripVertical, Lock, Minus, Plus, Scissors, Siren, X } from 'lucide-react'
import { getFoodImage, FALLBACK_FOOD_SVG } from '@/lib/nutrition'
import type { EditorFood, EditorItem } from './types'

interface FoodCardProps {
  item: EditorItem
  food: EditorFood | undefined
  conflictLabel?: string | null
  conflictMessage?: string | null
  onChangeQuantity: (grams: number) => void
  onRemove: () => void
  onSwap: () => void
  onCopy: () => void
  onCut: () => void
  onDragStart: () => void
  onDragEnd: () => void
  isDragging?: boolean
  /** Fuerza el detalle completo (chips y +/−) también en móvil, p. ej. en la hoja del plato. */
  full?: boolean
  /** Ingesta bloqueada: no se puede mover, borrar, cambiar ración ni intercambiar. */
  locked?: boolean
}

/**
 * Tarjeta de alimento (tamaño normal): foto 16:9, nombre completo en dos
 * líneas, ración editable con +/−, chips de macros y acciones integradas.
 * La alerta de alérgenos se muestra en la propia tarjeta y se despliega al
 * pulsarla.
 */
export function FoodCard({
  item,
  food,
  conflictLabel,
  conflictMessage,
  onChangeQuantity,
  onRemove,
  onSwap,
  onCopy,
  onCut,
  onDragStart,
  onDragEnd,
  isDragging,
  full = false,
  locked = false,
}: FoodCardProps) {
  const [draftGrams, setDraftGrams] = useState<string>(String(item.quantityG))
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showConflict, setShowConflict] = useState(false)
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
      draggable={!locked}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
        conflictMessage
          ? 'border-red-400 ring-1 ring-red-200'
          : locked
            ? 'border-amber-200'
            : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
      } ${isDragging ? 'opacity-40' : ''}`}
      title={
        locked
          ? 'Ingesta bloqueada · desbloquéala en la cabecera para editarla'
          : conflictMessage || `${food?.name || 'Alimento'} · arrastra para moverlo`
      }
    >
      {/* Foto 16:9 */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-100">
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

        {/* Asa de arrastre / candado */}
        <span className="absolute left-0.5 top-0.5 rounded bg-white/80 p-0.5 text-slate-500 opacity-70 transition-opacity group-hover:opacity-100">
          {locked ? <Lock className="h-3 w-3 text-amber-600" /> : <GripVertical className="h-3 w-3" />}
        </span>

        {/* Quitar */}
        <button
          type="button"
          onClick={onRemove}
          disabled={locked}
          className="absolute right-0.5 top-0.5 rounded bg-white/90 p-0.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Quitar ${food?.name || 'alimento'}`}
        >
          <X className="h-3 w-3" />
        </button>

        {/* Alerta de alérgenos del plato */}
        {conflictLabel && (
          <button
            type="button"
            onClick={() => setShowConflict((value) => !value)}
            className="absolute bottom-0.5 left-0.5 inline-flex items-center gap-0.5 rounded bg-red-600 px-1 py-0.5 text-[8px] font-black text-white shadow-sm"
            title={conflictMessage || 'Alérgeno detectado'}
            aria-label={`Alérgeno detectado: ${conflictLabel}`}
          >
            <Siren className="h-2.5 w-2.5" />
            {conflictLabel}
          </button>
        )}

        {/* Acciones */}
        <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5">
          <button
            type="button"
            onClick={onCopy}
            className="rounded bg-white/90 p-0.5 text-slate-500 transition-colors hover:text-blue-600"
            title="Copiar alimento"
            aria-label="Copiar alimento"
          >
            <Copy className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={onCut}
            disabled={locked}
            className="rounded bg-white/90 p-0.5 text-slate-500 transition-colors hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            title="Cortar alimento"
            aria-label="Cortar alimento"
          >
            <Scissors className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={onSwap}
            disabled={locked}
            className="rounded bg-white/90 p-0.5 text-slate-500 transition-colors hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            title="Intercambiar por un equivalente"
            aria-label="Intercambiar por un equivalente"
          >
            <ArrowLeftRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* Cuerpo */}
      <div className={`flex min-w-0 flex-1 flex-col ${full ? 'gap-1.5 p-2.5' : 'gap-1 p-1.5'}`}>
        <p
          className={`overflow-hidden font-bold leading-[1.25] text-slate-900 ${
            full ? 'text-[12px]' : 'text-[10px] sm:text-[11px]'
          }`}
          style={{ maxHeight: '2.5em' }}
          title={food?.name || 'Alimento'}
        >
          {food?.name || 'Alimento'}
        </p>

        {showConflict && conflictMessage && (
          <p className="rounded-md bg-red-50 px-1.5 py-1 text-[8px] font-semibold leading-tight text-red-700">
            {conflictMessage}
          </p>
        )}

        {/* Gramos editables */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => step(-5)}
            disabled={locked}
            className={`${full ? 'flex h-7 w-7' : 'hidden h-5 w-5 sm:flex'} shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label="Reducir ración"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>

          <label
            className={`flex min-w-0 flex-1 items-center gap-0.5 rounded-md border border-slate-200 bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500/15 ${
              full ? 'px-2 py-1' : 'px-1 py-0.5'
            }`}
          >
            <input
              ref={inputRef}
              type="number"
              min={0}
              step="any"
              value={draftGrams}
              onChange={(event) => setDraftGrams(event.target.value)}
              onBlur={(event) => commitGrams(event.target.value)}
              disabled={locked}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitGrams((event.target as HTMLInputElement).value)
                  event.currentTarget.blur()
                }
              }}
              className={`w-full min-w-0 bg-transparent text-center font-black text-slate-800 outline-none disabled:cursor-not-allowed ${
                full ? 'text-[12px]' : 'text-[10px]'
              }`}
              aria-label={`Gramos de ${food?.name || 'alimento'}`}
            />
            <span className="shrink-0 text-[8px] font-bold text-slate-400">g</span>
          </label>

          <button
            type="button"
            onClick={() => step(5)}
            disabled={locked}
            className={`${full ? 'flex h-7 w-7' : 'hidden h-5 w-5 sm:flex'} shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40`}
            aria-label="Aumentar ración"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Chips de macros */}
        <div
          className={`${full ? 'flex' : 'hidden sm:flex'} flex-wrap gap-0.5 text-[8px] font-black leading-none sm:text-[9px]`}
        >
          <span className="rounded border border-blue-200 bg-blue-100 px-1 py-0.5 tabular-nums text-blue-800">
            {kcal} kcal
          </span>
          <span className="rounded border border-emerald-200 bg-emerald-100 px-1 py-0.5 tabular-nums text-emerald-800">
            {carbs} HC
          </span>
          <span className="rounded border border-red-200 bg-red-100 px-1 py-0.5 tabular-nums text-red-800">
            {protein} Prot
          </span>
          <span className="rounded border border-amber-200 bg-amber-100 px-1 py-0.5 tabular-nums text-amber-900">
            {fat} Grasa
          </span>
          <span className="rounded border border-purple-200 bg-purple-100 px-1 py-0.5 tabular-nums text-purple-800">
            {fiber} Fibra
          </span>
        </div>
      </div>
    </article>
  )
}
