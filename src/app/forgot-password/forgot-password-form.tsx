'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset, type ForgotPasswordState } from './actions'

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotPasswordState | undefined, FormData>(requestPasswordReset, undefined)
  return <form action={action} className="mt-7 space-y-5">
    <div className="space-y-2"><label htmlFor="email" className="block text-sm font-semibold text-slate-700">Correo profesional</label><input id="email" name="email" type="email" autoComplete="email" required className="w-full rounded-2xl border border-slate-200/90 bg-white/90 px-3.5 py-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
    {state?.error && <p role="alert" className="animate-shake text-sm text-red-700">{state.error}</p>}
    {state?.success && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p>}
    <button disabled={pending} className="btn-tactile w-full rounded-2xl bg-gradient-to-r from-blue-600 to-sky-700 px-4 py-3 font-semibold text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,.9)] hover:-translate-y-px hover:shadow-[0_14px_28px_-14px_rgba(2,132,199,.95)] disabled:cursor-wait disabled:opacity-60">{pending ? 'Enviando enlace…' : 'Enviar enlace seguro'}</button>
    <Link href="/login" className="block text-center text-sm font-medium text-blue-700 transition-colors hover:text-blue-800 hover:underline">Volver a iniciar sesión</Link>
  </form>
}
