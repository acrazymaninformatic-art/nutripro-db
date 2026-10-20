'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Info,
  Pencil,
  Siren,
  Utensils,
} from 'lucide-react'
import {
  evaluateNutrient,
  formatKetoRatio,
  formatNumber,
  ketoRatio,
  resolveIngestaTargets,
  type MenuIngestaTotals,
  type MenuMacroTargets,
  type MenuSettings,
  type MenuTotals,
} from '@/lib/menu-config'
import { ProgressRing } from './progress-ring'
import { MacroChart } from './macro-chart'

export interface WeekPoint {
  dayNumber: number
  label: string
  totals: MenuTotals
}

interface RequirementsViewProps {
  mode: 'day' | 'week'
  dayLabel: string
  totals: MenuTotals
  targets: MenuMacroTargets
  settings: MenuSettings
  ingestas: MenuIngestaTotals[]
  weekPoints: WeekPoint[]
  allergenTerms: string[]
  conflictMessages: string[]
  preferenceWarnings: string[]
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

const SEMAPHORE_STYLES: Record<string, string> = {
  green: 'text-emerald-700',
  yellow: 'text-amber-700',
  red: 'text-red-700',
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
}

export function RequirementsView({
  mode,
  dayLabel,
  totals,
  targets,
  settings,
  ingestas,
  weekPoints,
  allergenTerms,
  conflictMessages,
  preferenceWarnings,
}: RequirementsViewProps) {
  const [ingestaMode, setIngestaMode] = useState<'view' | 'edit'>('view')
  const [showMicros, setShowMicros] = useState(settings.showMicros)

  const evaluations = NUTRIENTS.map((nutrient) => ({
    ...nutrient,
    evaluation: evaluateNutrient(totals[nutrient.key], targets[nutrient.key], settings.tolerancePct),
  }))

  const macroRings = [
    { key: 'kcal', label: 'Calorías', color: '#2563eb', value: totals.kcal, target: targets.kcal },
    { key: 'proteinG', label: 'Proteína', color: '#dc2626', value: totals.proteinG, target: targets.proteinG },
    { key: 'carbsG', label: 'HC', color: '#16a34a', value: totals.carbsG, target: targets.carbsG },
    { key: 'fatG', label: 'Grasa', color: '#ea580c', value: totals.fatG, target: targets.fatG },
  ]

  const keto = ketoRatio(totals)

  return (
    <div className="space-y-6">
      {/* Requerimientos */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
          Requerimientos
        </h3>
        <p className="text-xs font-semibold text-gray-500">
          Valores de configuración guardada del menú
        </p>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {evaluations.map((row, index) => (
            <div
              key={row.key}
              className={`flex items-center gap-3 px-4 py-3 ${
                index > 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <StatusDot status={row.evaluation.status} />
              <span className="text-xs font-bold text-gray-700">{row.label}</span>
              <span
                className={`ml-auto font-mono text-xs font-black tabular-nums ${SEMAPHORE_STYLES[row.evaluation.status]}`}
              >
                {formatNumber(totals[row.key], row.decimals)} / {formatNumber(targets[row.key], row.decimals)}{' '}
                {row.unit}
              </span>
            </div>
          ))}

          {settings.ketoMode && (
            <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-3">
              <StatusDot status="green" />
              <span className="text-xs font-bold text-gray-700">Keto-Ratio</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-400" title="Grasa dividida entre (proteína + hidrato de carbono).">
                <Info className="h-3 w-3" />
              </span>
              <span className="ml-auto font-mono text-xs font-black tabular-nums text-gray-900">
                {formatKetoRatio(keto)}
              </span>
            </div>
          )}
        </div>

        <p className="text-[11px] font-semibold text-gray-500">
          {(() => {
            const kcalEvaluation = evaluations[0].evaluation
            if (Math.abs(kcalEvaluation.delta) < 0.5) return 'Objetivo calórico alcanzado'
            if (kcalEvaluation.delta < 0) {
              return `Te faltan ${formatNumber(Math.abs(kcalEvaluation.delta), 0)} kcal`
            }
            return `Te pasas ${formatNumber(Math.abs(kcalEvaluation.delta), 0)} kcal`
          })()}
        </p>
      </section>

      {/* Anillos + gráfico */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-4 gap-2">
            {macroRings.map((ring) => (
              <ProgressRing
                key={ring.key}
                value={ring.value}
                target={ring.target}
                label={ring.label}
                color={ring.color}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Micronutrientes
            </span>
            <button
              type="button"
              onClick={() => setShowMicros((value) => !value)}
              className="rounded-lg px-2 py-1 text-[10px] font-bold text-blue-700 transition-colors hover:bg-blue-50"
            >
              {showMicros ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showMicros && (
            <div className="mt-2 space-y-1.5">
              {[
                { label: 'Sodio', value: totals.sodiumMg, target: settings.microTargets.sodiumMg, unit: 'mg' },
                { label: 'Azúcares', value: totals.sugarG, target: settings.microTargets.sugarG, unit: 'g' },
                {
                  label: 'Grasa saturada',
                  value: totals.saturatedFatG,
                  target: settings.microTargets.saturatedFatG,
                  unit: 'g',
                },
              ].map((micro) => (
                <div key={micro.label} className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-gray-600">{micro.label}</span>
                  <span className="font-mono font-bold tabular-nums text-gray-900">
                    {formatNumber(micro.value, 1)} {micro.unit}
                    {micro.target ? ` / ${formatNumber(micro.target, 0)} ${micro.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Macronutrientes y fibra totales
          </p>
          <MacroChart
            proteinG={totals.proteinG}
            carbsG={totals.carbsG}
            fatG={totals.fatG}
            fiberG={totals.fiberG}
          />
        </div>
      </section>

      {/* Vista semanal */}
      {mode === 'week' && weekPoints.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
              Tendencia por día
            </h3>
            <span className="text-[11px] font-semibold text-gray-500">
              Media diaria: {formatNumber(totals.kcal, 0)} kcal
            </span>
          </div>

          <TrendChart points={weekPoints} target={targets.kcal} />
        </section>
      )}

      {/* Alertas */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Alertas</h3>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            Alérgenos configurados
          </p>
          {allergenTerms.length === 0 ? (
            <p className="mt-1 text-xs font-semibold text-gray-500">Sin alérgenos configurados</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allergenTerms.map((term) => (
                <span
                  key={term}
                  className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-800"
                >
                  {term}
                </span>
              ))}
            </div>
          )}

          {conflictMessages.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {conflictMessages.map((message) => (
                <li
                  key={message}
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-900"
                >
                  <Siren className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {message}
                </li>
              ))}
            </ul>
          )}

          {preferenceWarnings.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {preferenceWarnings.map((message) => (
                <li
                  key={message}
                  className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {message}
                </li>
              ))}
            </ul>
          )}

          {conflictMessages.length === 0 && preferenceWarnings.length === 0 && (
            <p className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
              <Utensils className="h-3.5 w-3.5" />
              Sin incompatibilidades detectadas en {dayLabel.toLowerCase()}
            </p>
          )}
        </div>
      </section>

      {/* Objetivos por ingesta */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Objetivos por ingesta
          </h3>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIngestaMode('view')}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                ingestaMode === 'view'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Objetivos por ingesta (ver)
            </button>
            <button
              type="button"
              onClick={() => setIngestaMode('edit')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                ingestaMode === 'edit'
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Pencil className="h-3 w-3" />
              Editar objetivos por ingesta
            </button>
          </div>
        </div>

        {ingestas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-6 text-center text-xs font-semibold text-gray-500">
            Este día no tiene ingestas definidas.
          </p>
        ) : (
          <div className="space-y-3">
            {ingestas.map((ingesta) => {
              const ingestaSetting = settings.ingestas.find(
                (item) => item.mealType === ingesta.mealType
              )
              if (!ingestaSetting || !ingestaSetting.enabled) return null

              const ingestaTargets = resolveIngestaTargets(settings, ingestaSetting, targets)
              const rows = NUTRIENTS.map((nutrient) => ({
                ...nutrient,
                consumed: ingesta[nutrient.key],
                target: ingestaTargets[nutrient.key],
                evaluation: evaluateNutrient(
                  ingesta[nutrient.key],
                  ingestaTargets[nutrient.key],
                  settings.tolerancePct
                ),
              }))

              return (
                <div key={ingesta.mealType} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-black text-gray-900">{ingesta.label}</span>
                      {ingesta.time && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                          {ingesta.time}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-800">
                      {formatNumber(ingesta.percent, 1)}% del día
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {rows.map((row) => {
                      const pct = row.target > 0 ? Math.min((row.consumed / row.target) * 100, 100) : 0
                      const barColor =
                        row.evaluation.status === 'green'
                          ? 'bg-emerald-500'
                          : row.evaluation.status === 'yellow'
                            ? 'bg-amber-500'
                            : 'bg-red-500'

                      return (
                        <div key={row.key} className="flex items-center gap-2">
                          <span className="w-14 shrink-0 text-[10px] font-black uppercase tracking-wider text-gray-500">
                            {row.key === 'kcal' ? 'KCAL' : row.key === 'proteinG' ? 'PROT' : row.key === 'carbsG' ? 'HC' : row.key === 'fatG' ? 'GRASA' : 'FIBRA'}
                          </span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-24 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums text-gray-800">
                            {formatNumber(row.consumed, row.decimals)} / {formatNumber(row.target, row.decimals)}{' '}
                            {row.unit}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {ingestaMode === 'edit' && (
                    <div className="mt-3 grid gap-2 border-t border-gray-100 pt-3 sm:grid-cols-5">
                      {NUTRIENTS.map((nutrient) => (
                        <label key={nutrient.key} className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {nutrient.key === 'kcal' ? 'KCAL' : nutrient.key === 'proteinG' ? 'PROT' : nutrient.key === 'carbsG' ? 'HC' : nutrient.key === 'fatG' ? 'GRASA' : 'FIBRA'}
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={Math.round(ingestaTargets[nutrient.key])}
                            onChange={() => undefined}
                            readOnly
                            className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-[11px] font-bold text-gray-700"
                          />
                        </label>
                      ))}
                      <p className="text-[10px] font-semibold text-gray-400 sm:col-span-5">
                        Los objetivos por ingesta se derivan del % de reparto de cada ingesta. Edita el
                        reparto en la pestaña Configuración.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function TrendChart({ points, target }: { points: WeekPoint[]; target: number }) {
  const width = 560
  const height = 130
  const padding = 24

  const values = points.map((point) => point.totals.kcal)
  const lowest = Math.min(...values, target)
  const highest = Math.max(...values, target)
  const margin = Math.max((highest - lowest) * 0.25, highest * 0.04)
  const maxValue = highest + margin
  const minValue = Math.max(0, lowest - margin)

  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0
  const toY = (value: number) =>
    height - padding - ((value - minValue) / Math.max(maxValue - minValue, 1)) * (height - padding * 2)

  const path = points
    .map((point, index) => {
      const x = padding + index * xStep
      const y = toY(point.totals.kcal)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label="Tendencia de calorías por día">
      <line
        x1={padding}
        x2={width - padding}
        y1={toY(target)}
        y2={toY(target)}
        stroke="#cbd5e1"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <text
        x={width - padding}
        y={toY(target) - 7}
        textAnchor="end"
        className="fill-gray-400 text-[10px] font-bold"
      >
        objetivo {formatNumber(target, 0)} kcal
      </text>
      <path d={path} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => {
        const x = padding + index * xStep
        const y = toY(point.totals.kcal)
        return (
          <g key={point.dayNumber}>
            <circle cx={x} cy={y} r={4} fill="#2563eb" stroke="#ffffff" strokeWidth={2}>
              <title>{`${point.label}: ${formatNumber(point.totals.kcal, 0)} kcal`}</title>
            </circle>
            <text x={x} y={height - 6} textAnchor="middle" className="fill-gray-500 text-[10px] font-bold">
              {point.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
