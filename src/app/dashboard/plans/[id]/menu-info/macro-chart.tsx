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
 * Gráfico "Macronutrientes y fibra totales": anillo con el reparto calórico
 * de cada macronutriente y de la fibra, más el detalle en gramos.
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
  const radius = 54
  const stroke = 22
  const circumference = 2 * Math.PI * radius

  let offset = 0

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
        <svg width={132} height={132} className="-rotate-90">
          <circle cx={66} cy={66} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {totalKcal > 0 &&
            SEGMENTS.map((segment) => {
              const segmentKcal = kcal[segment.key]
              const fraction = segmentKcal / totalKcal
              const dash = fraction * circumference
              const element = (
                <circle
                  key={segment.key}
                  cx={66}
                  cy={66}
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</span>
          <span className="text-lg font-black text-gray-900 tabular-nums">
            {Math.round(totalKcal)}
          </span>
          <span className="text-[10px] font-semibold text-gray-500">kcal</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {SEGMENTS.map((segment) => {
          const grams = values[segment.key]
          const pct = totalKcal > 0 ? (kcal[segment.key] / totalKcal) * 100 : 0
          return (
            <li key={segment.key} className="flex items-center gap-2 text-[11px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="font-bold text-gray-700">{segment.label}</span>
              <span className="ml-auto font-mono font-bold tabular-nums text-gray-900">
                {formatNumber(grams)} g
              </span>
              <span className="w-10 text-right font-mono text-gray-400 tabular-nums">
                {Math.round(pct)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
