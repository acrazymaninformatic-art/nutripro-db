'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Eraser,
  LayoutGrid,
  Scissors,
  ShieldAlert,
  SquareCheckBig,
} from 'lucide-react'
import { checkPatientAllergenConflict } from '@/lib/nutrition'
import { DayHeader } from './day-header'
import { IngestaHeader } from './ingesta-header'
import { FoodCard, type CardSize } from './food-card'
import { AddFoodButton, FoodPickerModal } from './food-picker-modal'
import { NotesModal, SwapFoodModal, TutorialModal } from './editor-modals'
import { MenuSidePanel } from './menu-side-panel'
import {
  DAY_NAMES,
  DEFAULT_INGESTA_META,
  cloneGrid,
  uid,
  type EditorDayMeta,
  type EditorFood,
  type EditorGrid,
  type EditorIngestaMeta,
  type EditorItem,
} from './types'

export interface EditorPatient {
  id: string
  name: string
  firstName: string
  allergies: string
  intolerances: string
  dietaryPreferences: string
}

interface MenuEditorProps {
  grid: EditorGrid
  foods: EditorFood[]
  patient: EditorPatient | null
  dayMeta: EditorDayMeta[]
  ingestaMeta: EditorIngestaMeta[]
  targetKcal: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  onGridChange: (grid: EditorGrid) => void
  onDayMetaChange: (meta: EditorDayMeta[]) => void
  onIngestaMetaChange: (meta: EditorIngestaMeta[]) => void
  onSave: () => void
  saving?: boolean
}

type ClipboardKind = 'item' | 'ingesta' | 'day'
type ClipboardMode = 'copy' | 'cut'

interface ClipboardState {
  mode: ClipboardMode
  kind: ClipboardKind
  label: string
  count: number
  payload: unknown
}

interface Snapshot {
  grid: EditorGrid
  dayMeta: EditorDayMeta[]
  ingestaMeta: EditorIngestaMeta[]
}

const CARD_SIZE_OPTIONS: Array<{ value: CardSize; label: string }> = [
  { value: 'compact', label: 'Compacta' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Grande' },
]

const MEAL_TYPE_BY_LABEL: Record<string, string> = {
  Desayuno: 'BREAKFAST',
  'Media mañana': 'MID_MORNING',
  Comida: 'LUNCH',
  Merienda: 'SNACK',
  Cena: 'DINNER',
}

export function MenuEditor({
  grid,
  foods,
  patient,
  dayMeta,
  ingestaMeta,
  targetKcal,
  targetProteinG,
  targetCarbsG,
  targetFatG,
  onGridChange,
  onDayMetaChange,
  onIngestaMetaChange,
  onSave,
  saving,
}: MenuEditorProps) {
  const foodMap = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods])

  /* ---------------------------------------------------------------- */
  /* Estado local del editor                                           */
  /* ---------------------------------------------------------------- */

  const [cardSize, setCardSize] = useState<CardSize>('large')
  const [dayStart, setDayStart] = useState(0)
  const [visibleDays, setVisibleDays] = useState(7)
  const [collapsedIngestas, setCollapsedIngestas] = useState<Record<string, boolean>>({})
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null)
  const [dragging, setDragging] = useState<{ mealType: string; dayIndex: number; uid: string } | null>(
    null
  )
  const [pickerTarget, setPickerTarget] = useState<{ mealType: string; dayIndex: number } | null>(null)
  const [swapTarget, setSwapTarget] = useState<{
    mealType: string
    dayIndex: number
    itemIndex: number
  } | null>(null)
  const [notesTarget, setNotesTarget] = useState<
    { type: 'day'; dayIndex: number } | { type: 'ingesta'; dayIndex: number; mealType: string } | null
  >(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [copyDayTarget, setCopyDayTarget] = useState<number | null>(null)

  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  const [saveLabel, setSaveLabel] = useState('Guardado localmente')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const gridRef = useRef<HTMLDivElement>(null)

  /* ---------------------------------------------------------------- */
  /* Responsive: número de días visibles                              */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const element = gridRef.current
    if (!element) return

    const compute = () => {
      const width = element.clientWidth
      const next = width < 760 ? 2 : width < 1080 ? 3 : width < 1500 ? 4 : 7
      setVisibleDays(next)
      setDayStart((current) => Math.min(current, Math.max(0, 7 - next)))
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  /* ---------------------------------------------------------------- */
  /* Autoguardado local (borrador)                                    */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          `ev_menu_draft_${patient?.id || 'sin-paciente'}`,
          JSON.stringify({ grid, dayMeta, ingestaMeta, at: Date.now() })
        )
        setLastSavedAt(Date.now())
      } catch {
        // Almacenamiento no disponible: se sigue trabajando en memoria.
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [grid, dayMeta, ingestaMeta, patient?.id])

  /* ---------------------------------------------------------------- */
  /* Historial: deshacer / rehacer                                     */
  /* ---------------------------------------------------------------- */

  const pushHistory = useCallback(() => {
    setPast((current) => [...current.slice(-40), { grid: cloneGrid(grid), dayMeta, ingestaMeta }])
    setFuture([])
  }, [grid, dayMeta, ingestaMeta])

  const undo = useCallback(() => {
    setPast((current) => {
      if (current.length === 0) return current
      const previous = current[current.length - 1]
      setFuture((items) => [{ grid: cloneGrid(grid), dayMeta, ingestaMeta }, ...items].slice(0, 40))
      onGridChange(previous.grid)
      onDayMetaChange(previous.dayMeta)
      onIngestaMetaChange(previous.ingestaMeta)
      return current.slice(0, -1)
    })
  }, [grid, dayMeta, ingestaMeta, onGridChange, onDayMetaChange, onIngestaMetaChange])

  const redo = useCallback(() => {
    setFuture((current) => {
      if (current.length === 0) return current
      const next = current[0]
      setPast((items) => [...items, { grid: cloneGrid(grid), dayMeta, ingestaMeta }])
      onGridChange(next.grid)
      onDayMetaChange(next.dayMeta)
      onIngestaMetaChange(next.ingestaMeta)
      return current.slice(1)
    })
  }, [grid, dayMeta, ingestaMeta, onGridChange, onDayMetaChange, onIngestaMetaChange])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (typing) return

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  /* ---------------------------------------------------------------- */
  /* Cálculos                                                          */
  /* ---------------------------------------------------------------- */

  const dayTotals = useMemo(() => {
    return dayMeta.map((_, dayIndex) => {
      let kcal = 0
      ingestaMeta.forEach((ingesta) => {
        const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
        ;(grid[mealType]?.[dayIndex] || []).forEach((item) => {
          const food = foodMap.get(item.foodId)
          if (food) kcal += food.calories * (item.quantityG / 100)
        })
      })
      return Math.round(kcal)
    })
  }, [grid, foodMap, dayMeta, ingestaMeta])

  const ingestaTotals = useMemo(() => {
    return ingestaMeta.map((ingesta) => {
      const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
      const perDay = dayMeta.map((_, dayIndex) => {
        let kcal = 0
        ;(grid[mealType]?.[dayIndex] || []).forEach((item) => {
          const food = foodMap.get(item.foodId)
          if (food) kcal += food.calories * (item.quantityG / 100)
        })
        return Math.round(kcal)
      })
      return { mealType, ingesta, perDay }
    })
  }, [grid, foodMap, dayMeta, ingestaMeta])

  const visibleDayIndexes = useMemo(() => {
    const indexes: number[] = []
    for (let i = dayStart; i < Math.min(7, dayStart + visibleDays); i += 1) indexes.push(i)
    return indexes
  }, [dayStart, visibleDays])

  /* ---------------------------------------------------------------- */
  /* Acciones sobre el grid                                            */
  /* ---------------------------------------------------------------- */

  const updateCell = (mealType: string, dayIndex: number, updater: (items: EditorItem[]) => EditorItem[]) => {
    pushHistory()
    const next = cloneGrid(grid)
    next[mealType] = { ...next[mealType] }
    next[mealType][dayIndex] = updater([...(next[mealType]?.[dayIndex] || [])])
    onGridChange(next)
  }

  const handleChangeQuantity = (mealType: string, dayIndex: number, itemUid: string, grams: number) => {
    const next = cloneGrid(grid)
    next[mealType] = { ...next[mealType] }
    next[mealType][dayIndex] = (next[mealType]?.[dayIndex] || []).map((item) =>
      item.uid === itemUid ? { ...item, quantityG: grams } : item
    )
    onGridChange(next)
  }

  const handleRemove = (mealType: string, dayIndex: number, itemUid: string) => {
    updateCell(mealType, dayIndex, (items) => items.filter((item) => item.uid !== itemUid))
  }

  const handleAddFood = (food: EditorFood) => {
    if (!pickerTarget) return
    const { mealType, dayIndex } = pickerTarget
    updateCell(mealType, dayIndex, (items) => [
      ...items,
      { uid: uid('new'), foodId: food.id, quantityG: 100, notes: 'Preparación al gusto' },
    ])
    setPickerTarget(null)
  }

  const handleSwap = (food: EditorFood) => {
    if (!swapTarget) return
    const { mealType, dayIndex, itemIndex } = swapTarget
    updateCell(mealType, dayIndex, (items) =>
      items.map((item, index) => (index === itemIndex ? { ...item, foodId: food.id } : item))
    )
    setSwapTarget(null)
  }

  const handleDrop = (targetMealType: string, targetDayIndex: number) => {
    if (!dragging) return
    const { mealType: fromMeal, dayIndex: fromDay, uid: itemUid } = dragging
    setDragging(null)

    if (fromMeal === targetMealType && fromDay === targetDayIndex) return

    const next = cloneGrid(grid)
    const sourceItems = [...(next[fromMeal]?.[fromDay] || [])]
    const index = sourceItems.findIndex((item) => item.uid === itemUid)
    if (index < 0) return
    const [moved] = sourceItems.splice(index, 1)

    next[fromMeal] = { ...next[fromMeal], [fromDay]: sourceItems }
    next[targetMealType] = { ...next[targetMealType] }
    next[targetMealType][targetDayIndex] = [
      ...(next[targetMealType]?.[targetDayIndex] || []),
      { ...moved, uid: uid('moved') },
    ]

    pushHistory()
    onGridChange(next)
  }

  /* ---------------------------------------------------------------- */
  /* Portapapeles                                                      */
  /* ---------------------------------------------------------------- */

  const copyItem = (mealType: string, dayIndex: number, itemUid: string, mode: ClipboardMode) => {
    const item = (grid[mealType]?.[dayIndex] || []).find((entry) => entry.uid === itemUid)
    if (!item) return
    const food = foodMap.get(item.foodId)
    setClipboard({
      mode,
      kind: 'item',
      label: food?.name || 'Alimento',
      count: 1,
      payload: item,
    })
    if (mode === 'cut') {
      updateCell(mealType, dayIndex, (items) => items.filter((entry) => entry.uid !== itemUid))
    }
  }

  const copyIngesta = (mealType: string, dayIndex: number, mode: ClipboardMode) => {
    const items = grid[mealType]?.[dayIndex] || []
    setClipboard({
      mode,
      kind: 'ingesta',
      label: `${ingestaMeta.find((i) => MEAL_TYPE_BY_LABEL[i.label] === mealType)?.label || mealType} · ${dayMeta[dayIndex]?.name}`,
      count: items.length,
      payload: items,
    })
    if (mode === 'cut') {
      updateCell(mealType, dayIndex, () => [])
    }
  }

  const copyDay = (dayIndex: number) => {
    const payload: Record<string, EditorItem[]> = {}
    ingestaMeta.forEach((ingesta) => {
      const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
      payload[mealType] = (grid[mealType]?.[dayIndex] || []).map((item) => ({ ...item, uid: uid('copy') }))
    })
    setClipboard({
      mode: 'copy',
      kind: 'day',
      label: dayMeta[dayIndex]?.name || `Día ${dayIndex + 1}`,
      count: ingestaMeta.length,
      payload,
    })
  }

  const paste = (mealType: string, dayIndex: number) => {
    if (!clipboard) return

    if (clipboard.kind === 'item') {
      const item = clipboard.payload as EditorItem
      updateCell(mealType, dayIndex, (items) => [...items, { ...item, uid: uid('paste') }])
      return
    }

    if (clipboard.kind === 'ingesta') {
      const items = clipboard.payload as EditorItem[]
      updateCell(mealType, dayIndex, (current) => [
        ...current,
        ...items.map((item) => ({ ...item, uid: uid('paste') })),
      ])
      return
    }

    const payload = clipboard.payload as Record<string, EditorItem[]>
    const next = cloneGrid(grid)
    next[mealType] = { ...next[mealType] }
    next[mealType][dayIndex] = [...(next[mealType]?.[dayIndex] || []), ...(payload[mealType] || [])]
    pushHistory()
    onGridChange(next)
  }

  const pasteDayToWeek = () => {
    if (!clipboard || clipboard.kind !== 'day') return
    const payload = clipboard.payload as Record<string, EditorItem[]>
    const next = cloneGrid(grid)
    ingestaMeta.forEach((ingesta) => {
      const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
      next[mealType] = { ...next[mealType] }
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        next[mealType][dayIndex] = [
          ...(next[mealType]?.[dayIndex] || []),
          ...(payload[mealType] || []).map((item) => ({ ...item, uid: uid('week') })),
        ]
      }
    })
    pushHistory()
    onGridChange(next)
  }

  /* ---------------------------------------------------------------- */
  /* Acciones de días e ingestas                                       */
  /* ---------------------------------------------------------------- */

  const toggleDayCompleted = (dayIndex: number) => {
    const next = dayMeta.map((day, index) =>
      index === dayIndex ? { ...day, completed: !day.completed } : day
    )
    onDayMetaChange(next)
  }

  const markAllCompleted = () => {
    onDayMetaChange(dayMeta.map((day) => ({ ...day, completed: true })))
  }

  const clearCompletedChecks = () => {
    setCompletedItems(new Set())
    onDayMetaChange(dayMeta.map((day) => ({ ...day, completed: false })))
  }

  const toggleIngestaLock = (mealType: string, dayIndex: number) => {
    const label = ingestaMeta.find((ingesta) => MEAL_TYPE_BY_LABEL[ingesta.label] === mealType)?.label
    if (!label) return
    onIngestaMetaChange(
      ingestaMeta.map((ingesta) =>
        ingesta.label === label ? { ...ingesta, locked: !ingesta.locked } : ingesta
      )
    )
    void dayIndex
  }

  const saveNotes = (notes: string) => {
    if (!notesTarget) return
    if (notesTarget.type === 'day') {
      onDayMetaChange(
        dayMeta.map((day, index) => (index === notesTarget.dayIndex ? { ...day, notes } : day))
      )
      return
    }
    const label = ingestaMeta.find(
      (ingesta) => MEAL_TYPE_BY_LABEL[ingesta.label] === notesTarget.mealType
    )?.label
    if (!label) return
    onIngestaMetaChange(
      ingestaMeta.map((ingesta) => (ingesta.label === label ? { ...ingesta, notes } : ingesta))
    )
  }

  const saveLabelText = useMemo(() => {
    if (!lastSavedAt) return 'Borrador sin guardar'
    const seconds = Math.max(0, Math.round((now - lastSavedAt) / 1000))
    if (seconds < 5) return 'Guardado ahora'
    if (seconds < 60) return `Guardado hace ${seconds} s`
    return `Guardado hace ${Math.round(seconds / 60)} min`
  }, [lastSavedAt, now])

  const gridTemplateColumns = `150px repeat(${visibleDayIndexes.length}, minmax(0, 1fr))`

  return (
    <div className="space-y-3">
      {/* ---------------------------------------------------------------- */}
      {/* Barra superior                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={markAllCompleted}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          <SquareCheckBig className="h-3.5 w-3.5" />
          Marcar menú como completado
        </button>

        <button
          type="button"
          onClick={clearCompletedChecks}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <Eraser className="h-3.5 w-3.5" />
          Limpiar checks completados
        </button>

        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Ver tutorial
        </button>

        <button
          type="button"
          onClick={undo}
          disabled={past.length === 0}
          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={future.length === 0}
          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          Rehacer
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold ${
              clipboard
                ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {clipboard?.mode === 'cut' ? (
              <Scissors className="h-3.5 w-3.5" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
            Modo portapapeles activo: {clipboard ? clipboard.mode : 'inactivo'}
            {clipboard ? ` · ${clipboard.count} ${clipboard.count === 1 ? 'elemento' : 'elementos'}` : ''}
          </span>

          <span className="hidden text-[10px] font-bold text-slate-400 lg:inline">{saveLabelText}</span>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? 'Guardando…' : 'Guardar menú'}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Layout: cuadrícula + panel lateral                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="min-w-0 flex-1">
          {/* Toolbar de la cuadrícula */}
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <LayoutGrid className="h-3.5 w-3.5" />
              Tarjeta
            </span>
            {CARD_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCardSize(option.value)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  cardSize === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                }`}
              >
                {option.label}
              </button>
            ))}

            {visibleDays < 7 && (
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDayStart((current) => Math.max(0, current - 1))}
                  disabled={dayStart === 0}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:border-blue-300 disabled:opacity-40"
                  aria-label="Día anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-[11px] font-bold text-slate-600">
                  {dayStart + 1}–{Math.min(7, dayStart + visibleDays)} de 7
                </span>
                <button
                  type="button"
                  onClick={() => setDayStart((current) => Math.min(7 - visibleDays, current + 1))}
                  disabled={dayStart + visibleDays >= 7}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:border-blue-300 disabled:opacity-40"
                  aria-label="Día siguiente"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Cuadrícula */}
          <div
            ref={gridRef}
            className="overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white"
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            <div className="grid min-w-0" style={{ gridTemplateColumns }}>
              {/* Cabecera de la columna de ingestas */}
              <div className="sticky left-0 top-0 z-30 flex items-center justify-center border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Ingesta
              </div>

              {/* Cabeceras de día */}
              {visibleDayIndexes.map((dayIndex) => (
                <DayHeader
                  key={dayIndex}
                  name={dayMeta[dayIndex]?.name || DAY_NAMES[dayIndex]}
                  dayNumber={dayIndex + 1}
                  notes={dayMeta[dayIndex]?.notes || ''}
                  completed={Boolean(dayMeta[dayIndex]?.completed)}
                  kcal={dayTotals[dayIndex]}
                  onRename={(name) =>
                    onDayMetaChange(
                      dayMeta.map((day, index) => (index === dayIndex ? { ...day, name } : day))
                    )
                  }
                  onOpenNotes={() => setNotesTarget({ type: 'day', dayIndex })}
                  onCopyDay={() => {
                    copyDay(dayIndex)
                    setCopyDayTarget(dayIndex)
                  }}
                  onToggleComplete={() => toggleDayCompleted(dayIndex)}
                />
              ))}

              {/* Filas por ingesta */}
              {ingestaMeta.map((ingesta) => {
                const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
                const collapsed = collapsedIngestas[ingesta.label] ?? ingesta.collapsed

                return (
                  <div key={ingesta.label} className="contents">
                    {/* Etiqueta de ingesta (columna izquierda fija) */}
                    <div className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white p-2">
                      <IngestaHeader
                        label={ingesta.label}
                        color={ingesta.color}
                        time={ingesta.time}
                        collapsed={collapsed}
                        locked={ingesta.locked}
                        notes={ingesta.notes}
                        percent={ingesta.percent}
                        kcal={ingestaTotals.find((entry) => entry.ingesta.label === ingesta.label)?.perDay[visibleDayIndexes[0]] || 0}
                        targetKcal={
                          targetKcal * (ingesta.percent / 100)
                        }
                        tolerancePct={5}
                        onToggleCollapse={() =>
                          setCollapsedIngestas((current) => ({
                            ...current,
                            [ingesta.label]: !collapsed,
                          }))
                        }
                        onEdit={() =>
                          setNotesTarget({ type: 'ingesta', dayIndex: visibleDayIndexes[0], mealType })
                        }
                        onToggleLock={() => toggleIngestaLock(mealType, visibleDayIndexes[0])}
                      />
                    </div>

                    {/* Celdas de la ingesta */}
                    {visibleDayIndexes.map((dayIndex) => {
                      const items = grid[mealType]?.[dayIndex] || []
                      const cellKcal = items.reduce((total, item) => {
                        const food = foodMap.get(item.foodId)
                        return total + (food ? food.calories * (item.quantityG / 100) : 0)
                      }, 0)

                      return (
                        <div
                          key={`${ingesta.label}-${dayIndex}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(mealType, dayIndex)}
                          className="border-b border-slate-100 bg-white p-1.5"
                        >
                          {collapsed ? (
                            <p className="px-1 py-2 text-center text-[10px] font-bold text-slate-400">
                              Ingesta plegada · {Math.round(cellKcal)} kcal
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {items.map((item, itemIndex) => {
                                const food = foodMap.get(item.foodId)
                                const conflict =
                                  food && patient
                                    ? checkPatientAllergenConflict(food, {
                                        allergies: patient.allergies,
                                        intolerances: patient.intolerances,
                                        firstName: patient.firstName,
                                      })
                                    : null

                                return (
                                  <div key={item.uid} className="space-y-1">
                                    <FoodCard
                                      item={item}
                                      food={food}
                                      size={cardSize}
                                      conflictLabel={conflict?.allergenLabel}
                                      conflictMessage={conflict?.alertMessage}
                                      isDragging={dragging?.uid === item.uid}
                                      isCompleted={completedItems.has(item.uid)}
                                      onToggleComplete={() =>
                                        setCompletedItems((current) => {
                                          const next = new Set(current)
                                          if (next.has(item.uid)) next.delete(item.uid)
                                          else next.add(item.uid)
                                          return next
                                        })
                                      }
                                      onChangeQuantity={(grams) =>
                                        handleChangeQuantity(mealType, dayIndex, item.uid, grams)
                                      }
                                      onRemove={() => handleRemove(mealType, dayIndex, item.uid)}
                                      onSwap={() => setSwapTarget({ mealType, dayIndex, itemIndex })}
                                      onDragStart={() =>
                                        setDragging({ mealType, dayIndex, uid: item.uid })
                                      }
                                      onDragEnd={() => setDragging(null)}
                                    />

                                    {/* Acciones rápidas de la tarjeta */}
                                    <div className="flex items-center gap-1 px-0.5">
                                      <button
                                        type="button"
                                        onClick={() => copyItem(mealType, dayIndex, item.uid, 'copy')}
                                        className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                                        title="Copiar alimento"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyItem(mealType, dayIndex, item.uid, 'cut')}
                                        className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                        title="Cortar alimento"
                                      >
                                        <Scissors className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => paste(mealType, dayIndex)}
                                        disabled={!clipboard}
                                        className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-30"
                                        title="Pegar portapapeles"
                                      >
                                        <ClipboardPaste className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => copyIngesta(mealType, dayIndex, 'copy')}
                                        className="ml-auto rounded-md px-1 text-[9px] font-black text-slate-400 transition-colors hover:text-blue-600"
                                        title="Copiar la ingesta completa"
                                      >
                                        copiar ingesta
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}

                              <AddFoodButton
                                kcal={cellKcal}
                                disabled={ingesta.locked}
                                ariaLabel={`Añadir alimento a ${ingesta.label} del ${dayMeta[dayIndex]?.name || `día ${dayIndex + 1}`}`}
                                onClick={() => setPickerTarget({ mealType, dayIndex })}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Panel lateral: Información del menú                               */}
        {/* ---------------------------------------------------------------- */}
        <MenuSidePanel
          grid={grid}
          foods={foods}
          patient={patient}
          dayMeta={dayMeta}
          ingestaMeta={ingestaMeta}
          targetKcal={targetKcal}
          targetProteinG={targetProteinG}
          targetCarbsG={targetCarbsG}
          targetFatG={targetFatG}
          onIngestaMetaChange={onIngestaMetaChange}
          onDayMetaChange={onDayMetaChange}
        />
      </div>

      {/* Modales */}
      <FoodPickerModal
        open={Boolean(pickerTarget)}
        foods={foods}
        title={
          pickerTarget
            ? `Añadir alimento · ${ingestaMeta.find((i) => MEAL_TYPE_BY_LABEL[i.label] === pickerTarget.mealType)?.label} · ${dayMeta[pickerTarget.dayIndex]?.name}`
            : 'Añadir alimento'
        }
        onClose={() => setPickerTarget(null)}
        onSelect={handleAddFood}
      />

      <SwapFoodModal
        open={Boolean(swapTarget)}
        current={
          swapTarget
            ? foodMap.get(grid[swapTarget.mealType]?.[swapTarget.dayIndex]?.[swapTarget.itemIndex]?.foodId || 0)
            : undefined
        }
        foods={foods}
        onClose={() => setSwapTarget(null)}
        onSwap={handleSwap}
      />

      <NotesModal
        open={Boolean(notesTarget)}
        title={
          notesTarget?.type === 'day'
            ? `Notas · ${dayMeta[notesTarget.dayIndex]?.name || ''}`
            : 'Notas de la ingesta'
        }
        notes={
          notesTarget?.type === 'day'
            ? dayMeta[notesTarget.dayIndex]?.notes || ''
            : ingestaMeta.find((i) => MEAL_TYPE_BY_LABEL[i.label] === notesTarget?.mealType)?.notes || ''
        }
        onClose={() => setNotesTarget(null)}
        onSave={saveNotes}
      />

      <TutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Copiar día: elegir destino */}
      <FoodPickerModal
        open={false}
        foods={[]}
        title=""
        onClose={() => undefined}
        onSelect={() => undefined}
      />

      {copyDayTarget !== null && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900">
              Copiar {dayMeta[copyDayTarget]?.name} a…
            </h3>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Elige un día oplica el menú completo a toda la semana.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {dayMeta.map((day, index) => (
                <button
                  key={day.name + index}
                  type="button"
                  disabled={index === copyDayTarget}
                  onClick={() => {
                    const payload = clipboard?.payload as Record<string, EditorItem[]> | undefined
                    if (!payload) return
                    const next = cloneGrid(grid)
                    ingestaMeta.forEach((ingesta) => {
                      const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
                      next[mealType] = { ...next[mealType] }
                      next[mealType][index] = (payload[mealType] || []).map((item) => ({
                        ...item,
                        uid: uid('day-copy'),
                      }))
                    })
                    pushHistory()
                    onGridChange(next)
                    setCopyDayTarget(null)
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[11px] font-bold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700 disabled:opacity-40"
                >
                  {day.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={pasteDayToWeek}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-blue-700"
              >
                <Copy className="h-3.5 w-3.5" />
                Toda la semana
              </button>
              <button
                type="button"
                onClick={() => setCopyDayTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {patient && patient.allergies && (
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
          <ShieldAlert className="h-3.5 w-3.5" />
          Alergias del paciente activas: {patient.allergies}
        </p>
      )}
    </div>
  )
}
