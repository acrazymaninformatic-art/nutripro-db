'use client'

import { useActionState } from 'react'
import { CheckCircle2, ClipboardCheck, Loader2, Scale, Send } from 'lucide-react'
import { createCheckInAction, type CheckInResult } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initialState: CheckInResult = { ok: false, message: '' }

function ScoreRow({
  name,
  label,
  hint,
  min,
  max,
  step,
  defaultValue,
}: {
  name: string
  label: string
  hint: string
  min: number
  max: number
  step: number
  defaultValue: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-bold text-slate-700">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <input
          id={name}
          name={name}
          type="range"
          min={min}
          max={max}
          step={step}
          defaultValue={defaultValue}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
        />
        <output
          htmlFor={name}
          className="w-14 shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-center font-mono text-xs font-bold text-slate-700"
        >
          {defaultValue}
        </output>
      </div>
      <p className="text-[10px] leading-snug text-slate-400">{hint}</p>
    </div>
  )
}

export function CheckInForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_previous: CheckInResult, formData: FormData) => createCheckInAction(formData),
    initialState
  )

  return (
    <form action={formAction} className="space-y-5">
      {disabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          Modo vista previa de solo lectura (Eva Vidal): no puedes registrar seguimiento.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="declaredWeightKg" className="text-xs font-bold text-slate-700">
            Peso actual (kg)
          </Label>
          <div className="relative">
            <Scale className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              id="declaredWeightKg"
              name="declaredWeightKg"
              type="number"
              step="0.1"
              min="20"
              max="400"
              placeholder="Ej: 72,4"
              className="h-10 rounded-xl pl-9 text-sm"
            />
          </div>
          <p className="text-[10px] leading-snug text-slate-400">
            Opcional. Se guarda como peso autodeclarado, separado de las medidas
            profesionales.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-bold text-slate-700">
            Notas para Eva
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={600}
            placeholder="Cómo te ha ido la semana: comidas,apasitos, Boxing, ordenada…"
            className="rounded-xl text-sm"
          />
        </div>
      </div>

      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3">
        <ScoreRow
          name="adherencePct"
          label="Adherencia al plan"
          hint="0 = nada seguido · 100 = plan completo"
          min={0}
          max={100}
          step={5}
          defaultValue={70}
        />
        <ScoreRow
          name="digestionScore"
          label="Bienestar digestivo"
          hint="0 = muy mal · 10 = excelente"
          min={0}
          max={10}
          step={1}
          defaultValue={7}
        />
        <ScoreRow
          name="habitsScore"
          label="Hábitos y rutina"
          hint="0 = nada · 10 = rutina perfecta"
          min={0}
          max={10}
          step={1}
          defaultValue={7}
        />
      </div>

      {state.message ? (
        <p
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            state.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || disabled}
        className="w-full rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
      >
        {pending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-1.5 h-4 w-4" />
        )}
        {pending ? 'Enviando…' : 'Enviar seguimiento'}
      </Button>
    </form>
  )
}
