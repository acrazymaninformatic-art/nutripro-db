'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Eraser,
  Flame,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Redo2,
  Scissors,
  ShieldAlert,
  SquareCheckBig,
  Undo2,
  X,
} from 'lucide-react'
import { checkPatientAllergenConflict } from '@/lib/nutrition'
import { evaluateNutrient, type MenuSettings } from '@/lib/menu-config'
import { ModalPortal } from '@/components/ui/modal-portal'
import { DayHeader } from './day-header'
import { IngestaHeader } from './ingesta-header'
import { FoodCard } from './food-card'
import { AddFoodButton, FoodPickerModal } from './food-picker-modal'
import { IngestaEditModal, NotesModal, SwapFoodModal, TutorialModal } from './editor-modals'
import { MenuSidePanel } from './menu-side-panel'
import {
  DAY_NAMES,
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
  objective?: string | null
}

interface MenuEditorProps {
  grid: EditorGrid
  foods: EditorFood[]
  patient: EditorPatient | null
  dayMeta: EditorDayMeta[]
  ingestaMeta: EditorIngestaMeta[]
  menuSettings: MenuSettings
  planName: string
  planNotes: string
  onGridChange: (grid: EditorGrid) => void
  onDayMetaChange: (meta: EditorDayMeta[]) => void
  onIngestaMetaChange: (meta: EditorIngestaMeta[]) => void
  onMenuSettingsChange: (settings: MenuSettings) => void
  onPlanNameChange: (name: string) => void
  onPlanNotesChange: (notes: string) => void
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

const MEAL_TYPE_BY_LABEL: Record<string, string> = {
  Desayuno: 'BREAKFAST',
  'Media mañana': 'MID_MORNING',
  Comida: 'LUNCH',
  Merienda: 'SNACK',
  Cena: 'DINNER',
}

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MENU_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MID_MORNING: 'Media mañana',
  LUNCH: 'Comida',
  SNACK: 'Merienda',
  DINNER: 'Cena',
}

function menuTypeLabel(mealType: string) {
  return MENU_TYPE_LABELS[mealType] || mealType
}

export function MenuEditor({
  grid,
  foods,
  patient,
  dayMeta,
  ingestaMeta,
  menuSettings,
  planName,
  planNotes,
  onGridChange,
  onDayMetaChange,
  onIngestaMetaChange,
  onMenuSettingsChange,
  onPlanNameChange,
  onPlanNotesChange,
  onSave,
  saving,
}: MenuEditorProps) {
  const foodMap = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods])
  const tolerancePct = menuSettings.tolerancePct

  /* ---------------------------------------------------------------- */
  /* Estado local del editor                                           */
  /* ---------------------------------------------------------------- */

  const [panelOpen, setPanelOpen] = useState(false)
  const [collapsedIngestas, setCollapsedIngestas] = useState<Record<string, boolean>>({})
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
  const [notesTarget, setNotesTarget] = useState<{ type: 'day'; dayIndex: number } | null>(null)
  const [ingestaEditTarget, setIngestaEditTarget] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [copyDayTarget, setCopyDayTarget] = useState<number | null>(null)
  const [mobileMealTarget, setMobileMealTarget] = useState<{
    mealType: string
    dayIndex: number
  } | null>(null)

  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])

  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panelOpen) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [panelOpen])

  /* ---------------------------------------------------------------- */
  /* El borrador clínico vive solo en memoria y se guarda en servidor    */
  /* con el botón explícito. No se usa localStorage.                    */
  /* ---------------------------------------------------------------- */

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

  const dayIndexes = useMemo(() => dayMeta.map((_, index) => index), [dayMeta])

  /* ---------------------------------------------------------------- */
  /* Acciones sobre el grid                                            */
  /* ---------------------------------------------------------------- */

  const updateCell = (
    mealType: string,
    dayIndex: number,
    updater: (items: EditorItem[]) => EditorItem[]
  ) => {
    if (isMealLocked(mealType)) return
    pushHistory()
    const next = cloneGrid(grid)
    next[mealType] = { ...next[mealType] }
    next[mealType][dayIndex] = updater([...(next[mealType]?.[dayIndex] || [])])
    onGridChange(next)
  }

  const handleChangeQuantity = (mealType: string, dayIndex: number, itemUid: string, grams: number) => {
    if (isMealLocked(mealType)) return
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
      { uid: uid('new'), foodId: food.id, quantityG: 100, notes: '' },
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
    if (isMealLocked(fromMeal) || isMealLocked(targetMealType)) return

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
    if (mode === 'cut' && isMealLocked(mealType)) return
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
    if (mode === 'cut' && isMealLocked(mealType)) return
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
    if (isMealLocked(mealType)) return

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
      if (ingesta.locked) return
      const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
      next[mealType] = { ...next[mealType] }
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        next[mealType][dayIndex] = (payload[mealType] || []).map((item) => ({
          ...item,
          uid: uid('week'),
        }))
      }
    })
    pushHistory()
    onGridChange(next)
  }

  /* ---------------------------------------------------------------- */
  /* Acciones de días e ingestas                                       */
  /* ---------------------------------------------------------------- */

  const toggleDayCompleted = (dayIndex: number) => {
    onDayMetaChange(
      dayMeta.map((day, index) => (index === dayIndex ? { ...day, completed: !day.completed } : day))
    )
  }

  const markAllCompleted = () => {
    onDayMetaChange(dayMeta.map((day) => ({ ...day, completed: true })))
  }

  const clearCompletedChecks = () => {
    onDayMetaChange(dayMeta.map((day) => ({ ...day, completed: false })))
  }

  const toggleIngestaLock = (label: string) => {
    onIngestaMetaChange(
      ingestaMeta.map((ingesta) =>
        ingesta.label === label ? { ...ingesta, locked: !ingesta.locked } : ingesta
      )
    )
  }

  const saveNotes = (notes: string) => {
    if (!notesTarget) return
    onDayMetaChange(
      dayMeta.map((day, index) => (index === notesTarget.dayIndex ? { ...day, notes } : day))
    )
  }

  const saveIngesta = (patch: Partial<EditorIngestaMeta>) => {
    if (!ingestaEditTarget) return
    const nextMeta = ingestaMeta.map((ingesta) =>
      ingesta.label === ingestaEditTarget ? { ...ingesta, ...patch } : ingesta
    )
    onIngestaMetaChange(nextMeta)

    // Mantener el reparto del panel sincronizado con el editor.
    const edited = nextMeta.find((ingesta) => ingesta.label === ingestaEditTarget)
    if (edited) {
      onMenuSettingsChange({
        ...menuSettings,
        ingestas: menuSettings.ingestas.map((ingesta) =>
          ingesta.mealType === MEAL_TYPE_BY_LABEL[edited.label]
            ? { ...ingesta, label: edited.label, time: edited.time, percent: edited.percent }
            : ingesta
        ),
      })
    }
  }

  const saveLabelText = saving ? 'Guardando en servidor…' : 'Cambios sin guardar en servidor'

  const editingIngesta = ingestaMeta.find((ingesta) => ingesta.label === ingestaEditTarget)

  /** Ingesta a la que pertenece un tipo de comida del grid. */
  const ingestaForMeal = (mealType: string) =>
    ingestaMeta.find((ingesta) => MEAL_TYPE_BY_LABEL[ingesta.label] === mealType)

  const isMealLocked = (mealType: string) => Boolean(ingestaForMeal(mealType)?.locked)

  /** Tarjeta de alimento reutilizada en la cuadrícula y en la hoja móvil. */
  const renderFoodCard = (
    mealType: string,
    dayIndex: number,
    item: EditorItem,
    itemIndex: number,
    full = false
  ) => {
    const food = foodMap.get(item.foodId)
    const locked = isMealLocked(mealType)
    const conflict =
      food && patient
        ? checkPatientAllergenConflict(food, {
            allergies: patient.allergies,
            intolerances: patient.intolerances,
            firstName: patient.firstName,
          })
        : null

    return (
      <FoodCard
        key={item.uid}
        item={item}
        food={food}
        full={full}
        locked={locked}
        conflictLabel={conflict?.allergenLabel}
        conflictMessage={conflict?.alertMessage}
        isDragging={dragging?.uid === item.uid}
        onCopy={() => copyItem(mealType, dayIndex, item.uid, 'copy')}
        onCut={() => copyItem(mealType, dayIndex, item.uid, 'cut')}
        onSwap={() => setSwapTarget({ mealType, dayIndex, itemIndex })}
        onChangeQuantity={(grams) => handleChangeQuantity(mealType, dayIndex, item.uid, grams)}
        onRemove={() => handleRemove(mealType, dayIndex, item.uid)}
        onDragStart={() => setDragging({ mealType, dayIndex, uid: item.uid })}
        onDragEnd={() => setDragging(null)}
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {/* ---------------------------------------------------------------- */}
      {/* Barra superior                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={markAllCompleted}
          className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          <SquareCheckBig className="h-3 w-3" />
          <span className="hidden sm:inline">Marcar menú como completado</span>
          <span className="sm:hidden">Completar</span>
        </button>

        <button
          type="button"
          onClick={clearCompletedChecks}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <Eraser className="h-3 w-3" />
          <span className="hidden sm:inline">Limpiar checks completados</span>
          <span className="sm:hidden">Limpiar</span>
        </button>

        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <BookOpen className="h-3 w-3" />
          Ver tutorial
        </button>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            title="Deshacer (Ctrl+Z)"
            aria-label="Deshacer"
          >
            <Undo2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            title="Rehacer (Ctrl+Shift+Z)"
            aria-label="Rehacer"
          >
            <Redo2 className="h-3 w-3" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold ${
              clipboard ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-200' : 'bg-slate-100 text-slate-400'
            }`}
            title={clipboard ? `${clipboard.label} · ${clipboard.count} elemento(s)` : 'Sin elementos copiados'}
          >
            {clipboard?.mode === 'cut' ? (
              <Scissors className="h-3 w-3" />
            ) : (
              <ClipboardCopy className="h-3 w-3" />
            )}
            <span className="hidden md:inline">
              Modo portapapeles activo: {clipboard ? clipboard.mode : 'inactivo'}
            </span>
            <span className="md:hidden">{clipboard ? clipboard.count : '—'}</span>
            {clipboard ? ` · ${clipboard.count}` : ''}
          </span>

          <span className="hidden text-[9px] font-bold text-slate-400 xl:inline">{saveLabelText}</span>

          <span
            className="hidden items-center gap-1 rounded-xl bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-800 ring-1 ring-blue-200 md:inline-flex"
            title="Media semanal de kcal frente al objetivo diario"
          >
            <Flame className="h-3 w-3" />
            {Math.round(dayTotals.reduce((sum, value) => sum + value, 0) / Math.max(1, dayTotals.length))}
            {' / '}
            {Math.round(menuSettings.dailyTargets.kcal)} kcal
          </span>

          <button
            type="button"
            onClick={() => setPanelOpen((value) => !value)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
            title={panelOpen ? 'Ocultar información del menú' : 'Mostrar información del menú'}
            aria-label={panelOpen ? 'Ocultar información del menú' : 'Mostrar información del menú'}
          >
            {panelOpen ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">Información</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-[10px] font-black text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            <Check className="h-3 w-3" />
            {saving ? 'Guardando…' : 'Guardar menú'}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Layout: cuadrícula + panel lateral                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="min-w-0">
        <div className="min-w-0 flex-1">
          {/* Leyenda de días / acciones rápidas */}
          <div className="mb-1.5 hidden flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1 sm:flex">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Semana completa
            </span>
            {dayMeta.map((day, index) => (
              <span
                key={`${day.name}-${index}`}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-[9px] font-black ${
                  day.completed
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
                title={`${day.name} · ${dayTotals[index]} kcal`}
              >
                {DAY_LETTERS[index]}
              </span>
            ))}
            <span className="ml-auto text-[9px] font-semibold text-slate-400">
              Arrastra las tarjetas entre días o ingestas
            </span>
          </div>

          {/* Cuadrícula: 7 días siempre visibles, solo scroll vertical */}
          <div
            ref={gridRef}
            className="overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5"
            style={{ maxHeight: 'calc(100vh - 250px)' }}
          >
            <div
              className="grid min-w-0 gap-1.5"
              style={{ gridTemplateColumns: 'clamp(46px, 7vw, 118px) repeat(7, minmax(0, 1fr))' }}
            >
              {/* Esquina */}
              <div className="sticky left-0 top-0 z-30 flex items-center justify-center rounded-xl bg-slate-100 px-1 py-1 text-[8px] font-black uppercase tracking-wider text-slate-500">
                Ingesta
              </div>

              {/* Cabeceras de día */}
              {dayIndexes.map((dayIndex) => (
                <DayHeader
                  key={dayIndex}
                  name={dayMeta[dayIndex]?.name || DAY_NAMES[dayIndex]}
                  dayNumber={dayIndex + 1}
                  letter={DAY_LETTERS[dayIndex]}
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
                const cellTarget = menuSettings.dailyTargets.kcal * (ingesta.percent / 100)

                return (
                  <Fragment key={ingesta.label}>
                    {/* Banda de color + controles, a toda la altura de la fila */}
                    <div className="sticky left-0 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                      <IngestaHeader
                        label={ingesta.label}
                        color={ingesta.color}
                        time={ingesta.time}
                        collapsed={collapsed}
                        locked={ingesta.locked}
                        notes={ingesta.notes}
                        percent={ingesta.percent}
                        onToggleCollapse={() =>
                          setCollapsedIngestas((current) => ({
                            ...current,
                            [ingesta.label]: !collapsed,
                          }))
                        }
                        onEdit={() => setIngestaEditTarget(ingesta.label)}
                        onToggleLock={() => toggleIngestaLock(ingesta.label)}
                      />
                    </div>

                    {/* Platos del día */}
                    {dayIndexes.map((dayIndex) => {
                      const items = grid[mealType]?.[dayIndex] || []
                      const cellKcal = items.reduce((total, item) => {
                        const food = foodMap.get(item.foodId)
                        return total + (food ? food.calories * (item.quantityG / 100) : 0)
                      }, 0)
                      const evaluation = evaluateNutrient(cellKcal, cellTarget, tolerancePct)
                      const pct = cellTarget > 0 ? Math.min((cellKcal / cellTarget) * 100, 100) : 0
                      const barColor =
                        evaluation.status === 'green'
                          ? 'bg-emerald-500'
                          : evaluation.status === 'yellow'
                            ? 'bg-amber-500'
                            : 'bg-red-500'

                      return (
                        <div
                          key={`${ingesta.label}-${dayIndex}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(mealType, dayIndex)}
                          className={`flex flex-col overflow-hidden rounded-xl border bg-white p-1.5 ${
                            ingesta.locked ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
                          }`}
                        >
                          {/* Móvil: resumen táctil del plato (los 7 días caben) */}
                          <button
                            type="button"
                            onClick={() => setMobileMealTarget({ mealType, dayIndex })}
                            className="flex min-h-[62px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg sm:hidden"
                            aria-label={`Ver ${ingesta.label} del ${dayMeta[dayIndex]?.name || `día ${dayIndex + 1}`}: ${Math.round(cellKcal)} kcal`}
                          >
                            <span className={`h-2 w-2 rounded-full ${cellTarget > 0 ? barColor : 'bg-slate-300'}`} />
                            <span className="text-[9px] font-black tabular-nums text-slate-700">
                              {Math.round(cellKcal)}
                            </span>
                            <span className="text-[7px] font-semibold text-slate-400">
                              {items.length} alim.
                            </span>
                          </button>

                          {/* Escritorio / tablet: contenido completo del plato */}
                          <div className="hidden min-h-0 flex-1 flex-col sm:flex">
                          {/* Subtotal del plato: barra, check y aviso, siempre visible */}
                          <div className="mb-1.5 flex items-center gap-1">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-[width] duration-300 ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {cellTarget > 0 ? (
                              evaluation.status === 'green' ? (
                                <CheckCircle2
                                  className="h-3 w-3 shrink-0 text-emerald-500"
                                  aria-label="Plato dentro del objetivo"
                                />
                              ) : (
                                <span title={evaluation.message} className="shrink-0">
                                  <AlertTriangle
                                    className={`h-3 w-3 ${
                                      evaluation.status === 'yellow' ? 'text-amber-500' : 'text-red-500'
                                    }`}
                                    aria-label={evaluation.message}
                                  />
                                </span>
                              )
                            ) : (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-slate-200"
                                title="Sin objetivo definido"
                              />
                            )}

                            <span
                              className={`hidden shrink-0 font-mono text-[8px] font-bold tabular-nums sm:inline ${
                                cellTarget <= 0
                                  ? 'text-slate-400'
                                  : evaluation.status === 'green'
                                    ? 'text-emerald-600'
                                    : evaluation.status === 'yellow'
                                      ? 'text-amber-600'
                                      : 'text-red-600'
                              }`}
                            >
                              {Math.round(cellKcal)}
                              {cellTarget > 0 ? `/${Math.round(cellTarget)}` : ''}
                            </span>

                            <button
                              type="button"
                              onClick={() => setPickerTarget({ mealType, dayIndex })}
                              disabled={Boolean(ingesta.locked)}
                              className="hidden h-4 w-4 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-40 sm:flex"
                              title="Añadir alimento a este plato"
                              aria-label={`Añadir alimento a ${ingesta.label}`}
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          {collapsed ? (
                            <p className="px-1 py-2 text-center text-[9px] font-bold text-slate-400">
                              Plegada · {Math.round(cellKcal)} kcal
                            </p>
                          ) : (
                            <div className="flex-1 space-y-1.5">
                              {items.map((item, itemIndex) =>
                                renderFoodCard(mealType, dayIndex, item, itemIndex)
                              )}

                              {items.length === 0 && (
                                <p className="rounded-lg border border-dashed border-slate-200 px-1 py-2 text-center text-[9px] font-semibold text-slate-400">
                                  Sin alimentos
                                </p>
                              )}
                            </div>
                          )}

                          {/* Acciones del plato */}
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-1">
                              {clipboard && (
                                <button
                                  type="button"
                                  onClick={() => paste(mealType, dayIndex)}
                                  disabled={Boolean(ingesta.locked)}
                                  className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-blue-200 bg-blue-50 px-1 py-1 text-[8px] font-black text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  title={`Pegar ${clipboard.label}`}
                                >
                                  <ClipboardPaste className="h-2.5 w-2.5" />
                                  <span className="hidden sm:inline">Pegar</span>
                                </button>
                              )}
                              <AddFoodButton
                                kcal={cellKcal}
                                disabled={ingesta.locked}
                                ariaLabel={`Añadir alimento a ${ingesta.label} del ${dayMeta[dayIndex]?.name || `día ${dayIndex + 1}`}`}
                                onClick={() => setPickerTarget({ mealType, dayIndex })}
                              />
                            </div>

                            <div className="hidden items-center justify-between gap-1 sm:flex">
                              <button
                                type="button"
                                onClick={() => copyIngesta(mealType, dayIndex, 'copy')}
                                className="inline-flex items-center gap-0.5 text-[8px] font-bold text-slate-400 transition-colors hover:text-blue-600"
                                title="Copiar esta ingesta del día"
                              >
                                <Copy className="h-2.5 w-2.5" />
                                copiar ingesta
                              </button>
                              <button
                                type="button"
                                onClick={() => copyIngesta(mealType, dayIndex, 'cut')}
                                disabled={Boolean(ingesta.locked)}
                                className="inline-flex items-center gap-0.5 text-[8px] font-bold text-slate-400 transition-colors hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Cortar esta ingesta del día"
                              >
                                <Scissors className="h-2.5 w-2.5" />
                                cortar
                              </button>
                            </div>
                          </div>
                          </div>
                        </div>
                      )
                    })}
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cajón lateral: Información del menú (no resta ancho a la cuadrícula) */}
      {panelOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex justify-end bg-slate-950/40 p-2 backdrop-blur-[1px] sm:p-4"
            onClick={() => setPanelOpen(false)}
            role="presentation"
          >
            <div
              className="flex h-full w-full max-w-[340px] flex-col"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Información del menú"
            >
              <MenuSidePanel
                grid={grid}
                foods={foods}
                patient={patient}
                dayMeta={dayMeta}
                ingestaMeta={ingestaMeta}
                settings={menuSettings}
                planName={planName}
                planNotes={planNotes}
                saveLabel={saveLabelText}
                onIngestaMetaChange={onIngestaMetaChange}
                onSettingsChange={onMenuSettingsChange}
                onPlanNameChange={onPlanNameChange}
                onPlanNotesChange={onPlanNotesChange}
                onClose={() => setPanelOpen(false)}
              />
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Hoja móvil: plato completo con tarjetas grandes */}
      {mobileMealTarget &&
        (() => {
          const { mealType, dayIndex } = mobileMealTarget
          const ingesta = ingestaMeta.find((entry) => MEAL_TYPE_BY_LABEL[entry.label] === mealType)
          const items = grid[mealType]?.[dayIndex] || []
          const cellKcal = items.reduce((total, item) => {
            const food = foodMap.get(item.foodId)
            return total + (food ? food.calories * (item.quantityG / 100) : 0)
          }, 0)

          return (
            <ModalPortal>
              <div
                className="fixed inset-0 z-[80] flex items-end bg-slate-950/60 backdrop-blur-sm sm:hidden"
                onClick={() => setMobileMealTarget(null)}
                role="presentation"
              >
                <div
                  className="flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${ingesta?.label || menuTypeLabel(mealType)} del día`}
                >
                  <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                    <span
                      className="h-9 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ingesta?.color || '#2563eb' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900">
                        {ingesta?.label || menuTypeLabel(mealType)}
                      </p>
                      <p className="truncate text-[10px] font-semibold text-slate-500">
                        {dayMeta[dayIndex]?.name || `Día ${dayIndex + 1}`} ·{' '}
                        {Math.round(cellKcal)} kcal · {items.length} alimento(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileMealTarget(null)}
                      className="rounded-lg bg-slate-100 p-1.5 text-slate-500"
                      aria-label="Cerrar plato"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </header>

                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
                    {items.map((item, itemIndex) =>
                      renderFoodCard(mealType, dayIndex, item, itemIndex, true)
                    )}

                    {items.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-[11px] font-semibold text-slate-400">
                        Sin alimentos en este plato.
                      </p>
                    )}
                  </div>

                  <footer className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
                    {clipboard && (
                      <button
                        type="button"
                        onClick={() => paste(mealType, dayIndex)}
                        disabled={Boolean(ingesta?.locked)}
                        className="inline-flex h-10 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[11px] font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        Pegar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPickerTarget({ mealType, dayIndex })}
                      disabled={Boolean(ingesta?.locked)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 text-[11px] font-black text-white disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Añadir alimento
                    </button>
                  </footer>
                </div>
              </div>
            </ModalPortal>
          )
        })()}

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
            ? foodMap.get(
                grid[swapTarget.mealType]?.[swapTarget.dayIndex]?.[swapTarget.itemIndex]?.foodId || 0
              )
            : undefined
        }
        foods={foods}
        onClose={() => setSwapTarget(null)}
        onSwap={handleSwap}
      />

      <NotesModal
        open={Boolean(notesTarget)}
        title={`Notas · ${notesTarget ? dayMeta[notesTarget.dayIndex]?.name || '' : ''}`}
        notes={notesTarget ? dayMeta[notesTarget.dayIndex]?.notes || '' : ''}
        onClose={() => setNotesTarget(null)}
        onSave={saveNotes}
      />

      <IngestaEditModal
        open={Boolean(editingIngesta)}
        ingesta={editingIngesta}
        onClose={() => setIngestaEditTarget(null)}
        onSave={saveIngesta}
      />

      <TutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Copiar día: elegir destino */}
      {copyDayTarget !== null && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900">
              Copiar {dayMeta[copyDayTarget]?.name} a…
            </h3>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Elige un día o aplícalo a toda la semana.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {dayMeta.map((day, index) => (
                <button
                  key={`${day.name}-${index}`}
                  type="button"
                  disabled={index === copyDayTarget}
                  onClick={() => {
                    const payload = clipboard?.payload as Record<string, EditorItem[]> | undefined
                    if (!payload) return
                    const next = cloneGrid(grid)
                    ingestaMeta.forEach((ingesta) => {
                      if (ingesta.locked) return
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
                onClick={() => {
                  pasteDayToWeek()
                  setCopyDayTarget(null)
                }}
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

      {patient && (patient.allergies || patient.intolerances) && (
        <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-amber-700">
          <ShieldAlert className="h-3.5 w-3.5" />
          Alergias/intolerancias activas del paciente:
          <span className="font-black">{[patient.allergies, patient.intolerances].filter(Boolean).join(' · ')}</span>
        </p>
      )}
    </div>
  )
}
