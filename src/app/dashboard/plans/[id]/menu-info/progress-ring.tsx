'use client'

interface ProgressRingProps {
  value: number
  target: number
  label: string
  color: string
  size?: number
}

/**
 * Anillo de progreso responsivo: el arco se topa al 100 % y el porcentaje
 * real se muestra siempre en el centro. Se adapta al ancho de su columna
 * para que varios anillos nunca se solapen.
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
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div className="relative w-full max-w-[68px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          {target > 0 && (
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
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums text-gray-900">
          {target > 0 ? `${Math.round(pct)}%` : '—'}
        </span>
      </div>
      <span className="w-full truncate text-center text-[9px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <span className="w-full truncate text-center font-mono text-[8px] font-bold tabular-nums text-gray-400">
        {target > 0 ? `${Math.round(value)}/${Math.round(target)}` : 'sin objetivo'}
      </span>
    </div>
  )
}
