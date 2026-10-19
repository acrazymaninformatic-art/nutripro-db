'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, type LoginState } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | undefined, FormData>(login, undefined)

  return (
    <form action={action} className="mt-2 space-y-5">
      <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold text-[#C7D6F2]">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="tu@correo.com"
          required
          className="w-full rounded-2xl border border-[#1C2B4A] bg-[#0A1120]/70 px-3.5 py-3 text-sm font-medium text-[#E6EEFF] shadow-[0_2px_8px_-6px_rgba(0,0,0,.55)] outline-none transition-[border-color,background-color,opacity] duration-200 placeholder:text-[#647A9F] hover:border-blue-400/45 focus:border-blue-400 focus:bg-[#13213B] focus:ring-4 focus:ring-blue-500/15"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-xs font-bold text-[#C7D6F2]">
            Contraseña
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-blue-300 transition-colors hover:text-blue-200 hover:underline"
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
          className="w-full rounded-2xl border border-[#1C2B4A] bg-[#0A1120]/70 px-3.5 py-3 text-sm font-medium text-[#E6EEFF] shadow-[0_2px_8px_-6px_rgba(0,0,0,.55)] outline-none transition-[border-color,background-color,opacity] duration-200 placeholder:text-[#647A9F] hover:border-blue-400/45 focus:border-blue-400 focus:bg-[#13213B] focus:ring-4 focus:ring-blue-500/15"
        />
      </div>

      {state?.error && (
        <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 animate-shake">
          {state.error}
        </div>
      )}

      <button
        disabled={pending}
        className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-sky-700 px-4 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,.9)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-px hover:shadow-[0_14px_28px_-14px_rgba(2,132,199,.95)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
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

      <nav aria-label="Información legal" className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-1 text-[11px] font-medium text-[#8FA3C7]">
        <Link href="/legal" className="transition-colors hover:text-blue-200 hover:underline">Aviso legal</Link>
        <Link href="/privacy-policy" className="transition-colors hover:text-blue-200 hover:underline">Privacidad</Link>
        <Link href="/terms" className="transition-colors hover:text-blue-200 hover:underline">Condiciones</Link>
        <Link href="/cookies" className="transition-colors hover:text-blue-200 hover:underline">Cookies</Link>
      </nav>
    </form>
  )
}
