'use client'

import { useActionState, useState } from 'react'
import { rescheduleAppointment, type RescheduleState } from './actions'

export function RescheduleForm({ token, durationMin }: { token: string; durationMin: number }) {
  const [date, setDate] = useState(''); const [state, action, pending] = useActionState<RescheduleState | undefined, FormData>(rescheduleAppointment, undefined)
  return <form action={action} className="mt-7 space-y-5"><input type="hidden" name="token" value={token} /><input type="hidden" name="date" value={date ? new Date(date).toISOString() : ''} /><div className="space-y-2"><label htmlFor="nextDate" className="block text-sm font-medium text-slate-700">Nueva fecha y hora</label><input id="nextDate" type="datetime-local" required min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /><p className="text-xs text-slate-500">La duración de tu cita se mantiene en {durationMin} minutos. El horario solo se confirma si está libre.</p></div>{state?.error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}{state?.success ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p> : <button disabled={pending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{pending ? 'Comprobando disponibilidad…' : 'Confirmar nueva cita'}</button>}</form>
}
