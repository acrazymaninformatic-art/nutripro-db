'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const OBJETIVOS = [
  { value: 'weight_loss', label: 'Pérdida de peso' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'muscle_gain', label: 'Ganancia de masa' },
  { value: 'performance', label: 'Rendimiento' },
  { value: 'health', label: 'Salud' },
  { value: 'other', label: 'Otro' },
]

const VISITAS = [
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '365', label: 'Último año' },
  { value: 'never', label: 'Sin visitas' },
]

const RIESGOS = [
  { value: 'pendientes', label: 'Campos por revisar' },
  { value: 'sin_plan', label: 'Sin plan activo' },
  { value: 'sin_cuestionario', label: 'Sin cuestionario' },
  { value: 'sin_cita', label: 'Sin cita programada' },
]

export function PatientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      startTransition(() => {
        router.push(`/dashboard/patients?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const objetivo = searchParams.get('objetivo') || ''
  const visita = searchParams.get('visita') || ''
  const riesgo = searchParams.get('riesgo') || ''
  const hasFilters = Boolean(objetivo || visita || riesgo)

  const selectClass =
    'h-9 rounded-xl border border-slate-200/90 bg-white/90 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <Filter className="h-3.5 w-3.5" />
        Cohorte
      </span>

      <select
        aria-label="Filtrar por objetivo"
        value={objetivo}
        onChange={(event) => update('objetivo', event.target.value)}
        className={selectClass}
      >
        <option value="">Objetivo: todos</option>
        {OBJETIVOS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por última visita"
        value={visita}
        onChange={(event) => update('visita', event.target.value)}
        className={selectClass}
      >
        <option value="">Última visita: cualquiera</option>
        {VISITAS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por riesgo"
        value={riesgo}
        onChange={(event) => update('riesgo', event.target.value)}
        className={selectClass}
      >
        <option value="">Riesgo: cualquiera</option>
        {RIESGOS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('objetivo')
            params.delete('visita')
            params.delete('riesgo')
            startTransition(() => {
              router.push(`/dashboard/patients?${params.toString()}`, { scroll: false })
            })
          }}
          className="h-9 rounded-xl px-2.5 text-xs font-bold text-slate-500"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}

      {isPending ? <span className="text-[10px] font-semibold text-slate-400">Actualizando…</span> : null}
    </div>
  )
}
