'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { sendContactRequest, type ContactResult } from './contact-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initialState: ContactResult = { ok: false, message: '' }

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    async (_previous: ContactResult, formData: FormData) => sendContactRequest(formData),
    initialState
  )

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="mb-1.5 block text-xs font-bold text-slate-700">
            Nombre y apellidos *
          </Label>
          <Input id="name" name="name" required className="rounded-xl text-xs" placeholder="María Gómez" />
        </div>
        <div>
          <Label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700">
            Email *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-xl text-xs"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone" className="mb-1.5 block text-xs font-bold text-slate-700">
          Teléfono (opcional)
        </Label>
        <Input id="phone" name="phone" className="rounded-xl text-xs" placeholder="600 000 000" />
      </div>

      <div>
        <Label htmlFor="reason" className="mb-1.5 block text-xs font-bold text-slate-700">
          ¿Qué te han derivado o qué objetivo tienes? *
        </Label>
        <Textarea
          id="reason"
          name="reason"
          rows={5}
          required
          className="rounded-xl text-xs"
          placeholder="Cuéntame brevemente tu situación, objetivo, alergias o medicación…"
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-[11px] leading-5 text-slate-600">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          He leído la{' '}
          <a href="/privacy-policy" className="font-bold text-blue-700 underline">
            información de privacidad
          </a>{' '}
          y acepto que se traten mis datos para poder responder a mi consulta. No se comparten con
          terceros.
        </span>
      </label>

      {state.message ? (
        <p
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            state.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Send className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700"
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        {pending ? 'Enviando…' : 'Enviar consulta'}
      </Button>

      <p className={`text-center text-[10px] leading-4 text-slate-400 ${fieldClass ? '' : ''}`}>
        Tus datos se usan únicamente para responderte. Puedes pedir su supresión en cualquier
        momento.
      </p>
    </form>
  )
}
