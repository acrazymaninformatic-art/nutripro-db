'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset, type ForgotPasswordState } from './actions'

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotPasswordState | undefined, FormData>(requestPasswordReset, undefined)
  return <form action={action} className="mt-7 space-y-5">
    <div className="space-y-2"><label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo profesional</label><input id="email" name="email" type="email" autoComplete="email" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></div>
    {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    {state?.success && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p>}
    <button disabled={pending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{pending ? 'Enviando enlace…' : 'Enviar enlace seguro'}</button>
    <Link href="/login" className="block text-center text-sm font-medium text-blue-700 hover:underline">Volver a iniciar sesión</Link>
  </form>
}
