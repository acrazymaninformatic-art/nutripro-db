'use client'

import { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp, Scale } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Measurement = { date: Date | string; weightKg: number; bodyFatPct?: number | null; muscleMassKg?: number | null; waistCm?: number | null; hipCm?: number | null; visceralFat?: number | null }
type Metric = 'weightKg' | 'bodyFatPct' | 'muscleMassKg' | 'waistCm' | 'hipCm' | 'visceralFat'
const metrics: Record<Metric, { label: string; unit: string; color: string }> = {
  weightKg: { label: 'Peso', unit: 'kg', color: '#2563eb' }, bodyFatPct: { label: 'Grasa corporal', unit: '%', color: '#e11d48' }, muscleMassKg: { label: 'Masa muscular', unit: 'kg', color: '#059669' }, waistCm: { label: 'Cintura', unit: 'cm', color: '#d97706' }, hipCm: { label: 'Cadera', unit: 'cm', color: '#7c3aed' }, visceralFat: { label: 'Grasa visceral', unit: '', color: '#db2777' },
}

export function EvolutionChart({ measurements }: { measurements: Measurement[] }) {
  const [metric, setMetric] = useState<Metric>('weightKg')
  const values = useMemo(() => measurements.slice().reverse().map((item) => ({ date: new Date(item.date), value: item[metric] })).filter((item): item is { date: Date; value: number } => typeof item.value === 'number' && Number.isFinite(item.value)), [measurements, metric])
  if (measurements.length === 0) return null
  const info = metrics[metric]
  const min = values.length ? Math.min(...values.map((x) => x.value)) : 0
  const max = values.length ? Math.max(...values.map((x) => x.value)) : 1
  const padding = Math.max((max - min) * 0.12, 1)
  const range = Math.max(max - min + padding * 2, 1)
  const points = values.map((point, index) => `${values.length === 1 ? 50 : (index / (values.length - 1)) * 100},${88 - ((point.value - min + padding) / range) * 76}`).join(' ')
  const first = values[0]?.value
  const latest = values.at(-1)?.value
  const delta = first !== undefined && latest !== undefined ? latest - first : 0

  return <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm"><CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50/70 to-white pb-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-5 w-5 text-blue-600" />Evolución clínica visual</CardTitle><CardDescription className="mt-1">Tendencias objetivas a partir de las mediciones registradas.</CardDescription></div><div className="flex flex-wrap gap-1">{(Object.keys(metrics) as Metric[]).map((key) => <button key={key} onClick={() => setMetric(key)} className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${metric === key ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-blue-50'}`}>{metrics[key].label}</button>)}</div></div></CardHeader><CardContent className="p-5">{values.length ? <><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Último valor</p><p className="text-2xl font-bold text-gray-900">{latest?.toLocaleString('es-ES', { maximumFractionDigits: 1 })} <span className="text-base font-medium text-gray-500">{info.unit}</span></p></div><div className={`flex items-center gap-1 text-sm font-bold ${delta <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{delta <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}{delta > 0 ? '+' : ''}{delta.toLocaleString('es-ES', { maximumFractionDigits: 1 })} {info.unit} desde el inicio</div></div><div className="h-48 rounded-2xl border border-gray-100 bg-slate-50/60 p-3"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`Gráfica de evolución de ${info.label}`}><line x1="0" y1="88" x2="100" y2="88" stroke="#cbd5e1" strokeWidth="0.8" /><line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.6" /><polyline fill="none" stroke={info.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" points={points} />{values.map((point, index) => <circle key={point.date.toISOString()} cx={values.length === 1 ? 50 : (index / (values.length - 1)) * 100} cy={88 - ((point.value - min + padding) / range) * 76} r="1.8" fill={info.color}><title>{`${point.date.toLocaleDateString('es-ES')}: ${point.value} ${info.unit}`}</title></circle>)}</svg></div><div className="mt-2 flex justify-between text-xs text-gray-500"><span>{values[0]?.date.toLocaleDateString('es-ES')}</span><span>{values.at(-1)?.date.toLocaleDateString('es-ES')}</span></div></> : <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Aún no hay valores de {info.label.toLowerCase()} para dibujar la tendencia.</div>}</CardContent></Card>
}
