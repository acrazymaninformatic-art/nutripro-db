'use client'

interface ProgressRingProps {
  value: number
  target: number
  label: string
  color: string
  size?: number
}

/**
 * Anillo de progreso con el porcentaje alcanzado sobre el objetivo (topado en
 * 100 %). Si se supera el objetivo, el anillo se muestra completo en rojo.
 */
export function ProgressRing({ value, target, label, color, size = 84 }: ProgressRingProps) {
  const stroke = 9
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const pct = target > 0 ? (value / target) * 100 : 0
  const capped = Math.min(Math.max(pct, 0), 100)
  const over = pct > 100
  const offset = circumference - (capped / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={over ? '#dc2626' : color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 400ms ease, stroke 200ms ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-gray-900 tabular-nums">
          {Math.round(pct)}%
        </span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
    </div>
  )
}
