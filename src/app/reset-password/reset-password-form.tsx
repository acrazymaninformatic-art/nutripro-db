'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { resetPassword, type ResetPasswordState } from './actions'

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetPasswordState | undefined, FormData>(resetPassword, undefined)
  if (!token) return <p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">El enlace no es válido. <Link className="font-bold underline" href="/forgot-password">Solicita uno nuevo</Link>.</p>
  return <form action={action} className="mt-7 space-y-4"><input type="hidden" name="token" value={token} /><div className="space-y-2"><label htmlFor="password" className="block text-sm font-medium text-slate-700">Nueva contraseña</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={14} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /><p className="text-xs text-slate-500">14 caracteres como mínimo, con mayúscula, minúscula y número.</p></div><div className="space-y-2"><label htmlFor="confirmation" className="block text-sm font-medium text-slate-700">Repite la contraseña</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={14} required className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></div>{state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state?.success ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{state.success} <Link className="font-bold underline" href="/login">Iniciar sesión</Link></p> : <button disabled={pending} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{pending ? 'Actualizando…' : 'Guardar nueva contraseña'}</button>}</form>
}
