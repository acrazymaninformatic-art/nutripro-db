'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, type LoginState } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | undefined, FormData>(login, undefined)

  return (
    <form action={action} className="mt-7 space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo profesional</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3"><label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label><Link href="/forgot-password" className="text-xs font-semibold text-blue-700 hover:underline">¿Olvidaste tu contraseña?</Link></div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
