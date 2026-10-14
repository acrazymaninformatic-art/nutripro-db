'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Loader2, Plus, X } from 'lucide-react'
import { createClinicalCheckIn } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type CheckIn = {
  id: string
  date: Date | string
  adherencePct: number
  digestionScore: number | null
  habitsScore: number | null
  notes: string | null
}

type Metric = 'adherencePct' | 'digestionScore' | 'habitsScore'

const metrics: Record<Metric, { label: string; shortLabel: string; max: number; suffix: string; color: string }> = {
  adherencePct: { label: 'Adherencia al plan', shortLabel: 'Adherencia', max: 100, suffix: '%', color: '#2563eb' },
  digestionScore: { label: 'Confort digestivo', shortLabel: 'Digestión', max: 10, suffix: '/10', color: '#059669' },
  habitsScore: { label: 'Hábitos y rutina', shortLabel: 'Hábitos', max: 10, suffix: '/10', color: '#7c3aed' },
}

function Score({ label, value, max, suffix, tone }: { label: string; value: number | null | undefined; max: number; suffix: string; tone: string }) {
  const percent = value === null || value === undefined ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-baseline justify-between gap-3"><span className="text-xs font-semibold text-slate-600">{label}</span><span className="text-lg font-bold text-slate-950">{value ?? '—'}<span className="ml-0.5 text-xs font-medium text-slate-500">{value === null || value === undefined ? '' : suffix}</span></span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full transition-[transform] duration-300" style={{ width: `${percent}%`, backgroundColor: tone }} /></div></div>
}

export function ClinicalProgressCard({ patientId, checkIns }: { patientId: string; checkIns: CheckIn[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [metric, setMetric] = useState<Metric>('adherencePct')
  const [error, setError] = useState('')
  const ordered = useMemo(() => checkIns.slice().reverse(), [checkIns])
  const info = metrics[metric]
  const points = ordered.map((entry) => ({ date: new Date(entry.date), value: entry[metric] })).filter((entry): entry is { date: Date; value: number } => typeof entry.value === 'number')
  const polyline = points.map((point, index) => `${points.length === 1 ? 50 : (index / (points.length - 1)) * 100},${88 - (point.value / info.max) * 76}`).join(' ')
  const latest = checkIns[0]

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await createClinicalCheckIn(patientId, new FormData(event.currentTarget))
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se ha podido guardar el seguimiento.')
    } finally {
      setPending(false)
    }
  }

  return <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white pb-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-5 w-5 text-emerald-600" />Seguimiento de hábitos y adherencia</CardTitle><CardDescription className="mt-1">Registro breve por revisión para detectar tendencias, no para diagnosticar.</CardDescription></div><Button size="sm" onClick={() => setOpen((current) => !current)} className="rounded-xl bg-emerald-700 font-bold hover:bg-emerald-800"><Plus className="mr-1.5 h-4 w-4" />Añadir revisión</Button></div></CardHeader><CardContent className="space-y-4 p-5">{open && <form onSubmit={submit} className="rounded-2xl border border-emerald-200 bg-emerald-50/45 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-bold text-emerald-950">Nueva revisión clínica</p><Button type="button" variant="ghost" size="icon" onClick={() => { setOpen(false); setError('') }} aria-label="Cerrar"><X className="h-4 w-4" /></Button></div><div className="grid gap-3 sm:grid-cols-4"><div className="space-y-1"><Label htmlFor="checkin-date" className="text-xs">Fecha</Label><Input id="checkin-date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div><div className="space-y-1"><Label htmlFor="adherencePct" className="text-xs">Adherencia (0–100) *</Label><Input id="adherencePct" name="adherencePct" type="number" min="0" max="100" step="1" required placeholder="85" /></div><div className="space-y-1"><Label htmlFor="digestionScore" className="text-xs">Digestión (0–10)</Label><Input id="digestionScore" name="digestionScore" type="number" min="0" max="10" step="1" placeholder="8" /></div><div className="space-y-1"><Label htmlFor="habitsScore" className="text-xs">Hábitos (0–10)</Label><Input id="habitsScore" name="habitsScore" type="number" min="0" max="10" step="1" placeholder="7" /></div></div><div className="mt-3 space-y-1"><Label htmlFor="checkin-notes" className="text-xs">Observación breve</Label><Textarea id="checkin-notes" name="notes" rows={2} maxLength={2000} placeholder="Ej. Mejor tolerancia al desayuno; ajustar la pauta del fin de semana." /></div>{error && <p className="mt-3 text-sm font-medium text-rose-700">{error}</p>}<div className="mt-3 flex justify-end"><Button type="submit" disabled={pending} className="bg-emerald-700 hover:bg-emerald-800">{pending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Guardando…</> : 'Guardar revisión'}</Button></div></form>}{checkIns.length > 0 ? <><div className="grid gap-3 sm:grid-cols-3"><Score label="Última adherencia" value={latest?.adherencePct} max={100} suffix="%" tone="#2563eb" /><Score label="Último confort digestivo" value={latest?.digestionScore} max={10} suffix="/10" tone="#059669" /><Score label="Últimos hábitos" value={latest?.habitsScore} max={10} suffix="/10" tone="#7c3aed" /></div><div className="flex flex-wrap gap-1">{(Object.keys(metrics) as Metric[]).map((key) => <button key={key} onClick={() => setMetric(key)} className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${metric === key ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50'}`}>{metrics[key].shortLabel}</button>)}</div>{points.length ? <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-36 w-full" role="img" aria-label={`Tendencia de ${info.label}`}><line x1="0" y1="88" x2="100" y2="88" stroke="#cbd5e1" strokeWidth="0.8" /><line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.6" /><polyline fill="none" stroke={info.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" points={polyline} />{points.map((point, index) => <circle key={`${point.date.toISOString()}-${index}`} cx={points.length === 1 ? 50 : (index / (points.length - 1)) * 100} cy={88 - (point.value / info.max) * 76} r="1.8" fill={info.color}><title>{`${point.date.toLocaleDateString('es-ES')}: ${point.value}${info.suffix}`}</title></circle>)}</svg><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{points[0]?.date.toLocaleDateString('es-ES')}</span><span>{points.at(-1)?.date.toLocaleDateString('es-ES')}</span></div></div> : <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Aún no hay datos de {info.label.toLowerCase()} para dibujar la tendencia.</p>}</> : <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Registra la primera revisión para visualizar adherencia, digestión y hábitos a lo largo del tiempo.</div>}</CardContent></Card>
}
