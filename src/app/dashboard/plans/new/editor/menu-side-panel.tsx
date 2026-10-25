'use client'

import { useMemo, useState } from 'react'
import {
  Calculator,
  Check,
  ChevronDown,
  Info,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import {
  computeTotals,
  evaluateNutrient,
  formatKetoRatio,
  formatNumber,
  ketoRatio,
  type AllergenPolicy,
  type MenuMacroTargets,
  type MenuSettings,
  type MenuTotals,
} from '@/lib/menu-config'
import {
  buildCanonicalDays,
  percentSum,
  distributeEquitably,
  type EditorDayMeta,
  type EditorFood,
  type EditorGrid,
  type EditorIngestaMeta,
} from './types'

interface MenuSidePanelProps {
  grid: EditorGrid
  foods: EditorFood[]
  patient: {
    id: string
    name: string
    firstName: string
    allergies: string
    intolerances: string
    dietaryPreferences: string
    objective?: string | null
  } | null
  dayMeta: EditorDayMeta[]
  ingestaMeta: EditorIngestaMeta[]
  settings: MenuSettings
  planName: string
  planNotes: string
  saveLabel: string
  onIngestaMetaChange: (meta: EditorIngestaMeta[]) => void
  onSettingsChange: (settings: MenuSettings) => void
  onPlanNameChange: (name: string) => void
  onPlanNotesChange: (notes: string) => void
  onClose?: () => void
}

type TabKey = 'data' | 'config' | 'patients'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'data', label: 'Datos menú' },
  { key: 'config', label: 'Configuración' },
  { key: 'patients', label: 'Paciente(s)' },
]

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MEAL_TYPE_BY_LABEL: Record<string, string> = {
  Desayuno: 'BREAKFAST',
  'Media mañana': 'MID_MORNING',
  Comida: 'LUNCH',
  Merienda: 'SNACK',
  Cena: 'DINNER',
}

const NUTRIENTS: Array<{
  key: 'kcal' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'
  label: string
  unit: string
  decimals: number
}> = [
  { key: 'kcal', label: 'Calorías', unit: 'kcal', decimals: 0 },
  { key: 'proteinG', label: 'Proteína', unit: 'g', decimals: 1 },
  { key: 'carbsG', label: 'HC', unit: 'g', decimals: 1 },
  { key: 'fatG', label: 'Grasa', unit: 'g', decimals: 1 },
  { key: 'fiberG', label: 'Fibra', unit: 'g', decimals: 1 },
]

const STATUS_TEXT: Record<string, string> = {
  green: 'text-emerald-700',
  yellow: 'text-amber-700',
  red: 'text-red-700',
}

const STATUS_DOT: Record<string, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
}

function deltaText(key: string, value: number, target: number, unit: string) {
  if (target <= 0) return 'sin objetivo'
  const delta = value - target
  if (Math.abs(delta) < 0.5) return 'objetivo alcanzado'
  const amount = Math.abs(delta)
  const formatted = key === 'kcal' ? formatNumber(amount, 0) : formatNumber(amount, 1)
  return delta < 0 ? `Te faltan ${formatted} ${unit}` : `Te pasas ${formatted} ${unit}`
}

/* ------------------------------------------------------------------ */
/* Anillo compacto: arco topado al 100 %, porcentaje real visible      */
/* ------------------------------------------------------------------ */

function MiniRing({
  value,
  target,
  label,
  color,
}: {
  value: number
  target: number
  label: string
  color: string
}) {
  const size = 72
  const stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = target > 0 ? (value / target) * 100 : 0
  const capped = Math.min(Math.max(pct, 0), 100)

  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <div className="relative w-full max-w-[60px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          {target > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={pct > 100 ? '#dc2626' : color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (capped / 100) * circumference}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums text-slate-900">
          {target > 0 ? `${Math.round(pct)}%` : '—'}
        </span>
      </div>
      <span className="w-full truncate text-center text-[8px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="font-mono text-[8px] font-bold tabular-nums text-slate-400">
        {target > 0 ? `${formatNumber(value, 0)}/${formatNumber(target, 0)}` : 'sin objetivo'}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Donut de macronutrientes y fibra                                    */
/* ------------------------------------------------------------------ */

function MacroDonut({ totals }: { totals: MenuTotals }) {
  const segments = [
    { key: 'proteinG', label: 'Proteína', grams: totals.proteinG, kcal: totals.proteinG * 4, color: '#dc2626' },
    { key: 'carbsG', label: 'HC', grams: totals.carbsG, kcal: totals.carbsG * 4, color: '#16a34a' },
    { key: 'fatG', label: 'Grasa', grams: totals.fatG, kcal: totals.fatG * 9, color: '#ea580c' },
    { key: 'fiberG', label: 'Fibra', grams: totals.fiberG, kcal: totals.fiberG * 2, color: '#2563eb' },
  ]

  const totalKcal = segments.reduce((sum, segment) => sum + segment.kcal, 0)
  const size = 80
  const stroke = 13
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-full max-w-[88px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {totalKcal > 0 &&
            segments.map((segment) => {
              const dash = (segment.kcal / totalKcal) * circumference
              const element = (
                <circle
                  key={segment.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += dash
              return element
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-[13px] font-black tabular-nums text-slate-900">{Math.round(totalKcal)}</span>
          <span className="text-[8px] font-semibold text-slate-500">kcal</span>
        </div>
      </div>

      <ul className="w-full space-y-0.5">
        {segments.map((segment) => {
          const pct = totalKcal > 0 ? (segment.kcal / totalKcal) * 100 : 0
          return (
            <li key={segment.key} className="flex items-center gap-1 text-[9px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="truncate font-bold text-slate-600">{segment.label}</span>
              <span className="ml-auto font-mono font-bold tabular-nums text-slate-800">
                {formatNumber(segment.grams)} g
              </span>
              <span className="w-7 text-right font-mono tabular-nums text-slate-400">{Math.round(pct)}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function MenuSidePanel({
  grid,
  foods,
  patient,
  dayMeta,
  ingestaMeta,
  settings,
  planName,
  planNotes,
  saveLabel,
  onIngestaMetaChange,
  onSettingsChange,
  onPlanNameChange,
  onPlanNotesChange,
  onClose,
}: MenuSidePanelProps) {
  const foodMap = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods])
  const [tab, setTab] = useState<TabKey>('data')
  const [selectedDay, setSelectedDay] = useState<number | 'week'>('week')
  const [showMicros, setShowMicros] = useState(false)

  const days = useMemo(
    () =>
      buildCanonicalDays(
        grid,
        foodMap,
        dayMeta,
        ingestaMeta.map((ingesta, index) => ({
          type: MEAL_TYPE_BY_LABEL[ingesta.label] || 'SNACK',
          order: index + 1,
        }))
      ),
    [grid, foodMap, dayMeta, ingestaMeta]
  )

  const dayTotals = useMemo(() => days.map((day) => computeTotals(day.meals)), [days])

  const weekAverage = useMemo<MenuTotals>(() => {
    if (days.length === 0) return computeTotals([])
    const sum = dayTotals.reduce(
      (acc, totals) => ({
        kcal: acc.kcal + totals.kcal / days.length,
        proteinG: acc.proteinG + totals.proteinG / days.length,
        carbsG: acc.carbsG + totals.carbsG / days.length,
        fatG: acc.fatG + totals.fatG / days.length,
        fiberG: acc.fiberG + totals.fiberG / days.length,
        sugarG: acc.sugarG + totals.sugarG / days.length,
        saturatedFatG: acc.saturatedFatG + totals.saturatedFatG / days.length,
        sodiumMg: acc.sodiumMg + totals.sodiumMg / days.length,
      }),
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, saturatedFatG: 0, sodiumMg: 0 }
    )
    return sum
  }, [days.length, dayTotals])

  const targets: MenuMacroTargets = settings.dailyTargets
  const totals = selectedDay === 'week' ? weekAverage : dayTotals[selectedDay] || computeTotals([])
  const kcalEvaluation = evaluateNutrient(totals.kcal, targets.kcal, settings.tolerancePct)

  const selectedDayNumber = selectedDay === 'week' ? 1 : selectedDay + 1
  const dayLabel =
    selectedDay === 'week'
      ? 'Media semanal'
      : `Totales de ${dayMeta[selectedDay]?.name || `Día ${selectedDayNumber}`}`

  /* Ingestas del día seleccionado (o media semanal) */
  const perIngesta = useMemo(() => {
    return ingestaMeta.map((ingesta) => {
      const mealType = MEAL_TYPE_BY_LABEL[ingesta.label]
      const perDayKcal = days.map((day) => {
        const meal = day.meals.find((entry) => entry.mealType === mealType)
        return meal ? computeTotals([meal]).kcal : 0
      })
      const consumed =
        selectedDay === 'week'
          ? perDayKcal.reduce((sum, value) => sum + value, 0) / Math.max(1, perDayKcal.length)
          : perDayKcal[selectedDay] || 0
      return {
        ingesta,
        consumed,
        target: targets.kcal * (ingesta.percent / 100),
        perDayKcal,
      }
    })
  }, [ingestaMeta, days, selectedDay, targets.kcal])

  const percentTotal = percentSum(ingestaMeta)

  const totalFoods = useMemo(
    () =>
      days.reduce(
        (sum, day) => sum + day.meals.reduce((mealSum, meal) => mealSum + meal.items.length, 0),
        0
      ),
    [days]
  )

  const completedDays = dayMeta.filter((day) => day.completed).length

  const conflicts = useMemo(() => {
    if (!patient) return []
    const terms = `${patient.allergies} ${patient.intolerances}`
      .split(/[,;]/)
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean)

    const messages: string[] = []
    for (const day of days) {
      for (const meal of day.meals) {
        for (const item of meal.items) {
          if (!item.food) continue
          const haystack = `${item.food.name} ${item.food.category || ''}`.toLowerCase()
          const match = terms.find((term) => term.length > 2 && haystack.includes(term))
          if (match) {
            const message = `${item.food.name}: contiene «${match}»`
            if (!messages.includes(message)) messages.push(message)
          }
        }
      }
    }
    return messages
  }, [patient, days])

  const updateTarget = (key: keyof MenuMacroTargets, raw: number) => {
    if (!Number.isFinite(raw)) return
    onSettingsChange({
      ...settings,
      dailyTargets: {
        ...settings.dailyTargets,
        [key]: Math.max(0, Math.round(raw * 10) / 10),
      },
    })
  }

  const updatePercent = (label: string, raw: number) => {
    if (!Number.isFinite(raw)) return
    const percent = Math.min(100, Math.max(0, Math.round(raw * 10) / 10))
    onIngestaMetaChange(
      ingestaMeta.map((ingesta) => (ingesta.label === label ? { ...ingesta, percent } : ingesta))
    )
    onSettingsChange({
      ...settings,
      ingestas: settings.ingestas.map((ingesta) =>
        ingesta.label === label ? { ...ingesta, percent } : ingesta
      ),
    })
  }

  const distribute = () => {
    const next = distributeEquitably(ingestaMeta)
    onIngestaMetaChange(next)
    onSettingsChange({
      ...settings,
      ingestas: settings.ingestas.map((ingesta) => {
        const match = next.find((entry) => entry.label === ingesta.label)
        return match ? { ...ingesta, percent: match.percent } : ingesta
      }),
    })
  }

  const inputClass =
    'h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15'

  return (
    <aside className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Resumen fijo */}
        <div className="bg-slate-900 px-3 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-black leading-tight">Información del menú</p>
              <p className="truncate text-[9px] font-semibold text-white/60">{dayLabel}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[17px] font-black leading-none tabular-nums">
                {formatNumber(totals.kcal, 0)}
              </p>
              <p className="text-[8px] font-bold uppercase tracking-wider text-white/50">
                / {formatNumber(targets.kcal, 0)} kcal
              </p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-0.5 rounded-md bg-white/10 p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Cerrar información del menú"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <p
            className={`mt-1 text-[9px] font-bold ${
              kcalEvaluation.status === 'green'
                ? 'text-emerald-300'
                : kcalEvaluation.status === 'yellow'
                  ? 'text-amber-300'
                  : 'text-red-300'
            }`}
          >
            {deltaText('kcal', totals.kcal, targets.kcal, 'kcal')}
          </p>

          {/* Selector Sem · L M X J V S D */}
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedDay('week')}
              className={`h-6 rounded-md border px-1.5 text-[9px] font-black transition-colors ${
                selectedDay === 'week'
                  ? 'border-white bg-white text-slate-900'
                  : 'border-white/25 bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Sem
            </button>

            {dayMeta.map((day, index) => (
              <button
                key={`${day.name}-${index}`}
                type="button"
                onClick={() => setSelectedDay(index)}
                className={`h-6 w-6 rounded-md border text-[9px] font-black transition-colors ${
                  selectedDay === index
                    ? 'border-white bg-white text-slate-900'
                    : 'border-white/25 bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                title={`${day.name} · ${Math.round(dayTotals[index]?.kcal || 0)} kcal`}
                aria-label={day.name}
              >
                {DAY_LETTERS[index]}
              </button>
            ))}
          </div>

          {/* Pestañas */}
          <div className="mt-1.5 flex items-center gap-0.5">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`-mb-2.5 border-b-2 px-2 py-1.5 text-[9px] font-black transition-colors ${
                  tab === item.key
                    ? 'border-white text-white'
                    : 'border-transparent text-white/55 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
          {/* ------------------------------ DATOS ------------------------------ */}
          {tab === 'data' && (
            <section className="space-y-2">
              <label className="block">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Título del menú
                </span>
                <input
                  value={planName}
                  onChange={(event) => onPlanNameChange(event.target.value)}
                  placeholder="Pauta semanal"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Notas del plan
                </span>
                <textarea
                  value={planNotes}
                  onChange={(event) => onPlanNotesChange(event.target.value)}
                  rows={2}
                  placeholder="Recomendaciones generales para el paciente…"
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
                />
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <Stat label="Días" value={`${completedDays}/7 ok`} />
                <Stat label="Ingestas" value={String(ingestaMeta.filter((i) => i.enabled).length)} />
                <Stat label="Alimentos" value={String(totalFoods)} />
                <Stat label="Media" value={`${formatNumber(weekAverage.kcal, 0)} kcal`} />
              </div>

              <p className="flex items-start gap-1 rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] font-semibold text-slate-500">
                <Info className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                {saveLabel}. El panel se guarda con la pauta al pulsar «Guardar menú».
              </p>
            </section>
          )}

          {/* --------------------------- CONFIGURACIÓN --------------------------- */}
          {tab === 'config' && (
            <section className="space-y-3">
              <div>
                <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  <Calculator className="h-3 w-3" /> Objetivos diarios
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {NUTRIENTS.map((nutrient) => (
                    <label key={nutrient.key} className="block">
                      <span className="mb-0.5 block text-[9px] font-bold text-slate-500">
                        {nutrient.label} ({nutrient.unit})
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={Math.round(targets[nutrient.key] * 10) / 10}
                        onChange={(event) => updateTarget(nutrient.key, Number(event.target.value))}
                        className={inputClass}
                      />
                    </label>
                  ))}
                  <label className="block">
                    <span className="mb-0.5 block text-[9px] font-bold text-slate-500">Tolerancia (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step="any"
                      value={settings.tolerancePct}
                      onChange={(event) =>
                        onSettingsChange({
                          ...settings,
                          tolerancePct: Math.min(50, Math.max(0, Number(event.target.value) || 0)),
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Reparto por ingesta
                  </h4>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                      Math.abs(percentTotal - 100) < 0.05
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {formatNumber(percentTotal, 1)}%
                  </span>
                </div>

                <div className="space-y-1">
                  {ingestaMeta.map((ingesta) => (
                    <div key={ingesta.label} className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: ingesta.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-700">
                        {ingesta.label}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={ingesta.percent}
                        onChange={(event) => updatePercent(ingesta.label, Number(event.target.value))}
                        className="h-6 w-12 rounded-md border border-slate-200 px-1 text-right text-[10px] font-bold text-slate-800 outline-none focus:border-blue-400"
                      />
                      <span className="w-7 text-[9px] font-bold text-slate-400">%</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={distribute}
                  className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <Sparkles className="h-2.5 w-2.5" /> Repartir equitativamente
                </button>
                {Math.abs(percentTotal - 100) >= 0.05 && (
                  <p className="mt-1 text-[8px] font-bold text-amber-700">
                    El reparto debe sumar 100 % para que los objetivos por ingesta sean válidos.
                  </p>
                )}
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-2">
                <label className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-600">Modo cetogénico</span>
                  <input
                    type="checkbox"
                    checked={settings.ketoMode}
                    onChange={(event) =>
                      onSettingsChange({ ...settings, ketoMode: event.target.checked })
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-600">Mostrar micronutrientes</span>
                  <input
                    type="checkbox"
                    checked={settings.showMicros}
                    onChange={(event) =>
                      onSettingsChange({ ...settings, showMicros: event.target.checked })
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                </label>
              </div>
            </section>
          )}

          {/* ---------------------------- PACIENTES ---------------------------- */}
          {tab === 'patients' && (
            <section className="space-y-2">
              {!patient ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-2 py-3 text-center text-[10px] font-semibold text-slate-500">
                  Selecciona un paciente en la calculadora clínica para ver alergias,
                  intolerancias y conflictos.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-black text-blue-700">
                      {patient.firstName.slice(0, 1)}
                      {patient.name.split(' ')[0]?.slice(0, 1) || ''}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black text-slate-900">{patient.name}</p>
                      <p className="truncate text-[9px] font-semibold text-slate-500">
                        {patient.objective || 'Sin objetivo registrado'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 rounded-xl border border-slate-200 p-2 text-[9px]">
                    <p className="font-bold text-slate-500">
                      Alergias: <span className="font-semibold text-slate-800">{patient.allergies || 'ninguna'}</span>
                    </p>
                    <p className="font-bold text-slate-500">
                      Intolerancias:{' '}
                      <span className="font-semibold text-slate-800">{patient.intolerances || 'ninguna'}</span>
                    </p>
                    <p className="font-bold text-slate-500">
                      Preferencias:{' '}
                      <span className="font-semibold text-slate-800">
                        {patient.dietaryPreferences || 'sin registrar'}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <ShieldAlert className="h-3 w-3" /> Conflictos detectados
                    </h4>
                    {conflicts.length === 0 ? (
                      <p className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-[9px] font-bold text-emerald-800">
                        <Check className="h-3 w-3" /> Sin alérgenos del paciente en el menú.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {conflicts.map((message) => (
                          <li
                            key={message}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-bold text-red-800"
                          >
                            {message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Política de alérgenos
                    </span>
                    <select
                      value={settings.allergenPolicy}
                      onChange={(event) =>
                        onSettingsChange({
                          ...settings,
                          allergenPolicy: event.target.value as AllergenPolicy,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="BLOCK">Bloquear el alimento</option>
                      <option value="CONFIRM">Pedir confirmación</option>
                      <option value="WARN">Solo avisar</option>
                    </select>
                  </label>
                </>
              )}
            </section>
          )}

          {/* --------------------------- REQUERIMIENTOS --------------------------- */}
          <section className="space-y-2 border-t border-slate-100 pt-3">
            <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
              Consumido / objetivo
            </h4>

            <div className="space-y-1.5">
              {NUTRIENTS.map((nutrient) => {
                const target = targets[nutrient.key]
                const value = totals[nutrient.key]
                const evaluation = evaluateNutrient(value, target, settings.tolerancePct)

                return (
                  <div key={nutrient.key} className="flex items-start gap-1.5">
                    <span
                      className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
                        target > 0 ? STATUS_DOT[evaluation.status] : 'bg-slate-200'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-700">{nutrient.label}</span>
                        <span
                          className={`font-mono text-[9px] font-black tabular-nums ${
                            target > 0 ? STATUS_TEXT[evaluation.status] : 'text-slate-400'
                          }`}
                        >
                          {formatNumber(value, nutrient.decimals)}
                          {target > 0 ? ` / ${formatNumber(target, nutrient.decimals)}` : ''} {nutrient.unit}
                        </span>
                      </div>
                      <p
                        className={`text-[8px] font-bold ${
                          target <= 0
                            ? 'text-slate-400'
                            : evaluation.status === 'green'
                              ? 'text-emerald-600'
                              : evaluation.status === 'yellow'
                                ? 'text-amber-600'
                                : 'text-red-600'
                        }`}
                      >
                        {deltaText(nutrient.key, value, target, nutrient.unit)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 4 anillos */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              <MiniRing value={totals.kcal} target={targets.kcal} label="Kcal" color="#2563eb" />
              <MiniRing value={totals.proteinG} target={targets.proteinG} label="Prot" color="#dc2626" />
              <MiniRing value={totals.carbsG} target={targets.carbsG} label="HC" color="#16a34a" />
              <MiniRing value={totals.fatG} target={targets.fatG} label="Grasa" color="#ea580c" />
            </div>

            {settings.ketoMode && (
              <p className="flex items-center justify-between rounded-lg bg-purple-50 px-2 py-1 text-[9px] font-bold text-purple-800">
                <span>Keto-Ratio</span>
                <span className="font-mono font-black">{formatKetoRatio(ketoRatio(totals))}</span>
              </p>
            )}
          </section>

          {/* ----------------------------- GRÁFICO ----------------------------- */}
          <section className="space-y-1.5 border-t border-slate-100 pt-3">
            <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
              Macronutrientes y fibra
            </h4>
            <MacroDonut totals={totals} />

            <button
              type="button"
              onClick={() => setShowMicros((value) => !value)}
              className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500"
            >
              Micronutrientes
              <ChevronDown className={`h-3 w-3 transition-transform ${showMicros ? 'rotate-180' : ''}`} />
            </button>

            {showMicros && (
              <div className="space-y-1 text-[9px]">
                <MicroRow label="Sodio" value={totals.sodiumMg} target={settings.microTargets.sodiumMg} unit="mg" />
                <MicroRow label="Azúcares" value={totals.sugarG} target={settings.microTargets.sugarG} unit="g" />
                <MicroRow
                  label="Grasa saturada"
                  value={totals.saturatedFatG}
                  target={settings.microTargets.saturatedFatG}
                  unit="g"
                />
              </div>
            )}
          </section>

          {/* ------------------------ OBJETIVOS POR INGESTA ------------------------ */}
          <section className="space-y-1.5 border-t border-slate-100 pt-3">
            <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
              Objetivos por ingesta
            </h4>

            {perIngesta.map(({ ingesta, consumed, target }) => {
              const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
              const evaluation = evaluateNutrient(consumed, target, settings.tolerancePct)

              return (
                <div key={ingesta.label} className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: ingesta.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[9px] font-bold text-slate-600">
                      {ingesta.label}
                    </span>
                    <span className="font-mono text-[8px] font-bold tabular-nums text-slate-500">
                      {formatNumber(consumed, 0)}
                      {target > 0 ? ` / ${formatNumber(target, 0)}` : ''} kcal
                    </span>
                  </div>

                  {target > 0 ? (
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          evaluation.status === 'green'
                            ? 'bg-emerald-500'
                            : evaluation.status === 'yellow'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : (
                    <p className="text-[8px] font-bold text-slate-400">sin objetivo</p>
                  )}
                </div>
              )
            })}
          </section>
        </div>
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-1">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="truncate text-[10px] font-black text-slate-800">{value}</p>
    </div>
  )
}

function MicroRow({
  label,
  value,
  target,
  unit,
}: {
  label: string
  value: number
  target: number | null
  unit: string
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-mono font-bold tabular-nums text-slate-700">
        {formatNumber(value, 0)}
        {target ? ` / ${formatNumber(target, 0)}` : ''} {unit}
      </span>
    </div>
  )
}
