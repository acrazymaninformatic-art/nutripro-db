'use client'

import { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp, Scale, Target, Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Measurement = {
  date: Date | string
  weightKg: number
  bodyFatPct?: number | null
  muscleMassKg?: number | null
  waistCm?: number | null
  hipCm?: number | null
  visceralFat?: number | null
}

type Metric = 'weightKg' | 'compositionKg' | 'bodyFatPct' | 'muscleMassKg' | 'waistCm' | 'hipCm' | 'visceralFat'

const metrics: Record<Metric, { label: string; unit: string; color: string }> = {
  weightKg: { label: 'Peso', unit: 'kg', color: '#2563eb' },
  compositionKg: { label: 'Composición en Kg (Grasa vs Magra)', unit: 'kg', color: '#8b5cf6' },
  bodyFatPct: { label: '% Grasa', unit: '%', color: '#e11d48' },
  muscleMassKg: { label: 'Masa muscular', unit: 'kg', color: '#059669' },
  waistCm: { label: 'Cintura', unit: 'cm', color: '#d97706' },
  hipCm: { label: 'Cadera', unit: 'cm', color: '#7c3aed' },
  visceralFat: { label: 'Grasa visceral', unit: '', color: '#db2777' },
}

interface EvolutionChartProps {
  measurements: Measurement[]
  targetWeightKg?: number | null
  weeklyChangeTargetKg?: number | null
}

export function EvolutionChart({
  measurements,
  targetWeightKg,
  weeklyChangeTargetKg,
}: EvolutionChartProps) {
  const [metric, setMetric] = useState<Metric>('weightKg')

  // Chronological ordered measurements
  const sortedMeasurements = useMemo(() => {
    return measurements
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [measurements])

  // Single metric values
  const values = useMemo(() => {
    if (metric === 'compositionKg') return []
    return sortedMeasurements
      .map((item) => ({ date: new Date(item.date), value: item[metric as keyof Measurement] as number }))
      .filter((item): item is { date: Date; value: number } => typeof item.value === 'number' && Number.isFinite(item.value))
  }, [sortedMeasurements, metric])

  // Dual composition values: fatKg & leanKg
  const compositionValues = useMemo(() => {
    return sortedMeasurements
      .filter((item) => typeof item.bodyFatPct === 'number' && item.bodyFatPct > 0)
      .map((item) => {
        const fatKg = Math.round(((item.weightKg * item.bodyFatPct!) / 100) * 10) / 10
        const leanKg = Math.round((item.weightKg - fatKg) * 10) / 10
        return {
          date: new Date(item.date),
          fatKg,
          leanKg,
          totalWeight: item.weightKg,
        }
      })
  }, [sortedMeasurements])

  if (measurements.length === 0) return null

  const info = metrics[metric]

  // Min / Max calculation
  let min = 0
  let max = 100
  if (metric === 'compositionKg') {
    if (compositionValues.length > 0) {
      const allVals = compositionValues.flatMap((c) => [c.fatKg, c.leanKg])
      min = Math.min(...allVals)
      max = Math.max(...allVals)
    }
  } else if (values.length > 0) {
    min = Math.min(...values.map((x) => x.value))
    max = Math.max(...values.map((x) => x.value))
    if (metric === 'weightKg' && targetWeightKg) {
      min = Math.min(min, targetWeightKg)
      max = Math.max(max, targetWeightKg)
    }
  }

  const padding = Math.max((max - min) * 0.15, 1)
  const range = Math.max(max - min + padding * 2, 1)

  // Points calculation
  const getY = (val: number) => 88 - ((val - min + padding) / range) * 76

  const points = values.map((point, index) => `${values.length === 1 ? 50 : (index / (values.length - 1)) * 100},${getY(point.value)}`).join(' ')
  const fatPoints = compositionValues.map((c, i) => `${compositionValues.length === 1 ? 50 : (i / (compositionValues.length - 1)) * 100},${getY(c.fatKg)}`).join(' ')
  const leanPoints = compositionValues.map((c, i) => `${compositionValues.length === 1 ? 50 : (i / (compositionValues.length - 1)) * 100},${getY(c.leanKg)}`).join(' ')

  const targetLineY = targetWeightKg ? getY(targetWeightKg) : null

  const latestVal = values.at(-1)?.value
  const firstVal = values[0]?.value
  const delta = firstVal !== undefined && latestVal !== undefined ? Math.round((latestVal - firstVal) * 10) / 10 : 0

  const latestComp = compositionValues.at(-1)

  return (
    <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm bg-white">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50/70 to-white pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Scale className="h-5 w-5 text-blue-600" />
              <span>Evolución Clínica y Composición Corporal (5.2)</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-gray-500">
              Tendencias objetivas con línea de objetivo pactado y gráfica de masa en kilos
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-1">
            {(Object.keys(metrics) as Metric[]).map((key) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  metric === key
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-blue-50'
                }`}
              >
                {metrics[key].label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {metric === 'compositionKg' ? (
          compositionValues.length > 0 ? (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wide text-blue-700">Masa Magra (Músculo + Óseo)</p>
                    <p className="text-2xl font-black text-blue-900">
                      {latestComp?.leanKg} <span className="text-sm font-medium text-gray-500">kg</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wide text-rose-700">Masa Grasa</p>
                    <p className="text-2xl font-black text-rose-900">
                      {latestComp?.fatKg} <span className="text-sm font-medium text-gray-500">kg</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-3 h-1 rounded-full bg-blue-600 inline-block"></span>
                    <span>Masa Magra (kg)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-3 h-1 rounded-full bg-rose-500 inline-block"></span>
                    <span>Masa Grasa (kg)</span>
                  </span>
                </div>
              </div>

              <div className="h-52 rounded-2xl border border-gray-100 bg-slate-50/60 p-3">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img">
                  <line x1="0" y1="88" x2="100" y2="88" stroke="#cbd5e1" strokeWidth="0.8" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.6" />

                  {/* Línea Masa Magra (Azul) */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={leanPoints}
                  />

                  {/* Línea Masa Grasa (Roja/Rosa) */}
                  <polyline
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={fatPoints}
                  />

                  {compositionValues.map((c, idx) => {
                    const x = compositionValues.length === 1 ? 50 : (idx / (compositionValues.length - 1)) * 100
                    return (
                      <g key={c.date.toISOString()}>
                        <circle cx={x} cy={getY(c.leanKg)} r="1.8" fill="#2563eb">
                          <title>{`${c.date.toLocaleDateString('es-ES')}: Magra ${c.leanKg} kg`}</title>
                        </circle>
                        <circle cx={x} cy={getY(c.fatKg)} r="1.8" fill="#e11d48">
                          <title>{`${c.date.toLocaleDateString('es-ES')}: Grasa ${c.fatKg} kg`}</title>
                        </circle>
                      </g>
                    )
                  })}
                </svg>
              </div>

              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>{compositionValues[0]?.date.toLocaleDateString('es-ES')}</span>
                <span>{compositionValues.at(-1)?.date.toLocaleDateString('es-ES')}</span>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900">
              Para calcular la composición en kilos se requiere que al menos una sesión cuente con registro de <strong>% de Grasa Corporal</strong>.
            </div>
          )
        ) : values.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wide text-gray-500">Último valor registrado</p>
                <p className="text-2xl font-black text-gray-900">
                  {latestVal?.toLocaleString('es-ES', { maximumFractionDigits: 1 })}{' '}
                  <span className="text-sm font-medium text-gray-500">{info.unit}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {metric === 'weightKg' && targetWeightKg && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-900 border-purple-200 font-bold flex items-center gap-1.5 text-xs py-1 px-3">
                    <Target className="h-3.5 w-3.5 text-purple-600" />
                    <span>Meta: {targetWeightKg} kg</span>
                  </Badge>
                )}

                <div className={`flex items-center gap-1 text-xs font-bold ${delta <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {delta <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span>
                    {delta > 0 ? `+${delta}` : delta} {info.unit} desde el inicio
                  </span>
                </div>
              </div>
            </div>

            <div className="h-52 rounded-2xl border border-gray-100 bg-slate-50/60 p-3 relative">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img">
                <line x1="0" y1="88" x2="100" y2="88" stroke="#cbd5e1" strokeWidth="0.8" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.6" />

                {/* Línea horizontal de objetivo pactado si existe */}
                {metric === 'weightKg' && targetLineY !== null && (
                  <line
                    x1="0"
                    y1={targetLineY}
                    x2="100"
                    y2={targetLineY}
                    stroke="#9333ea"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                  >
                    <title>{`Objetivo: ${targetWeightKg} kg`}</title>
                  </line>
                )}

                {/* Polilínea de evolución */}
                <polyline
                  fill="none"
                  stroke={info.color}
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />

                {values.map((point, index) => (
                  <circle
                    key={point.date.toISOString()}
                    cx={values.length === 1 ? 50 : (index / (values.length - 1)) * 100}
                    cy={getY(point.value)}
                    r="1.8"
                    fill={info.color}
                  >
                    <title>{`${point.date.toLocaleDateString('es-ES')}: ${point.value} ${info.unit}`}</title>
                  </circle>
                ))}
              </svg>
            </div>

            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{values[0]?.date.toLocaleDateString('es-ES')}</span>
              {targetWeightKg && metric === 'weightKg' && (
                <span className="text-purple-700 font-bold text-2xs">--- Línea Violeta: Objetivo ({targetWeightKg} kg)</span>
              )}
              <span>{values.at(-1)?.date.toLocaleDateString('es-ES')}</span>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900">
            Aún no hay valores de {info.label.toLowerCase()} para dibujar la tendencia.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
