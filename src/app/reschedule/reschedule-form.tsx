'use client'

import { useActionState, useState } from 'react'
import { rescheduleAppointment, type RescheduleState } from './actions'

export function RescheduleForm({ token, durationMin }: { token: string; durationMin: number }) {
  const [date, setDate] = useState('')
  const [minDate] = useState(() => new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16))
  const [state, action, pending] = useActionState<RescheduleState | undefined, FormData>(rescheduleAppointment, undefined)
  return (
    <form action={action} className="mt-7 space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="date" value={date ? new Date(date).toISOString() : ''} />
      <div className="space-y-2">
        <label htmlFor="nextDate" className="block text-sm font-medium text-slate-700">Nueva fecha y hora</label>
        <input
          id="nextDate"
          type="datetime-local"
          required
          min={minDate}
          onChange={(event) => setDate(event.target.value)}
          className="w-full rounded-2xl border border-slate-200/90 bg-white/90 px-3.5 py-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        <p className="text-xs text-slate-500">
          La duración de tu cita se mantiene en {durationMin} minutos. El horario solo se confirma si está libre.
        </p>
      </div>
      {state?.error && <p role="alert" className="animate-shake rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}
      {state?.success ? (
        <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p>
      ) : (
        <button disabled={pending} className="btn-tactile w-full rounded-2xl bg-gradient-to-r from-blue-600 to-sky-700 px-4 py-3 font-semibold text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,.9)] hover:-translate-y-px hover:shadow-[0_14px_28px_-14px_rgba(2,132,199,.95)] disabled:cursor-wait disabled:opacity-60">
          {pending ? 'Comprobando disponibilidad…' : 'Confirmar nueva cita'}
        </button>
      )}
    </form>
  )
}
