'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, type LoginState } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | undefined, FormData>(login, undefined)

  return (
    <form action={action} className="mt-2 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-bold text-slate-700">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="tu@correo.com"
          required
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-xs font-bold text-slate-700">
            Contraseña
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 font-medium"
        />
      </div>

      {state?.error && (
        <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 animate-shake">
          {state.error}
        </div>
      )}

      <button
        disabled={pending}
        className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Verificando credenciales…</span>
          </>
        ) : (
          'Iniciar sesión'
        )}
      </button>
    </form>
  )
}
