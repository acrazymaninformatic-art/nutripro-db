'use client'

import { formatNumber } from '@/lib/menu-config'

interface MacroChartProps {
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

const SEGMENTS = [
  { key: 'proteinG', label: 'Proteína', color: '#dc2626' },
  { key: 'carbsG', label: 'HC', color: '#16a34a' },
  { key: 'fatG', label: 'Grasa', color: '#ea580c' },
  { key: 'fiberG', label: 'Fibra', color: '#0284c7' },
] as const

/**
 * Gráfico "Macronutrientes y fibra totales" responsivo: donut con el reparto
 * calórico y detalle en gramos. Se adapta al ancho disponible sin invadir el
 * resto de tarjetas del panel.
 */
export function MacroChart({ proteinG, carbsG, fatG, fiberG }: MacroChartProps) {
  const values: Record<string, number> = { proteinG, carbsG, fatG, fiberG }
  const kcal: Record<string, number> = {
    proteinG: proteinG * 4,
    carbsG: carbsG * 4,
    fatG: fatG * 9,
    fiberG: fiberG * 2,
  }

  const totalKcal = Object.values(kcal).reduce((sum, value) => sum + value, 0)
  const size = 132
  const radius = 54
  const stroke = 22
  const circumference = 2 * Math.PI * radius

  let offset = 0

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div className="relative w-full max-w-[116px] shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {totalKcal > 0 &&
            SEGMENTS.map((segment) => {
              const segmentKcal = kcal[segment.key]
              const fraction = segmentKcal / totalKcal
              const dash = fraction * circumference
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
                  style={{ transition: 'stroke-dasharray 400ms ease, stroke-dashoffset 400ms ease' }}
                />
              )
              offset += dash
              return element
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total</span>
          <span className="text-base font-black tabular-nums text-gray-900">{Math.round(totalKcal)}</span>
          <span className="text-[9px] font-semibold text-gray-500">kcal</span>
        </div>
      </div>

      <ul className="min-w-[130px] flex-1 space-y-1">
        {SEGMENTS.map((segment) => {
          const grams = values[segment.key]
          const pct = totalKcal > 0 ? (kcal[segment.key] / totalKcal) * 100 : 0
          return (
            <li key={segment.key} className="flex items-center gap-1.5 text-[10px]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="truncate font-bold text-gray-700">{segment.label}</span>
              <span className="ml-auto font-mono font-bold tabular-nums text-gray-900">
                {formatNumber(grams)} g
              </span>
              <span className="w-8 text-right font-mono text-gray-400 tabular-nums">
                {Math.round(pct)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
