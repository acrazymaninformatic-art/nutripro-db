'use client'

import { useEffect, useState } from 'react'
import { Activity, Gauge, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMotionPreference, systemPrefersReducedMotion, type MotionPreference } from '@/lib/motion-preference'
import { cn } from '@/lib/utils'

const OPTIONS: Array<{
  value: MotionPreference
  label: string
  hint: string
  icon: typeof Sparkles
}> = [
  {
    value: 'on',
    label: 'Siempre activas',
    hint: 'Animaciones en todos los dispositivos, aunque el sistema las tenga apagadas.',
    icon: Sparkles,
  },
  {
    value: 'auto',
    label: 'Automático',
    hint: 'Sigue la configuración de animaciones de tu sistema.',
    icon: Gauge,
  },
  {
    value: 'off',
    label: 'Desactivadas',
    hint: 'Interfaz estática, sin movimientos ni transiciones.',
    icon: Activity,
  },
]

export function MotionSettingsCard({ className }: { className?: string }) {
  const { preference, enabled, setPreference } = useMotionPreference()
  // Se calcula tras el montaje para que el primer render coincida con el SSR.
  const [systemReduced, setSystemReduced] = useState(false)

  useEffect(() => {
    setSystemReduced(systemPrefersReducedMotion())
  }, [])

  return (
    <Card className={cn('rounded-3xl border-slate-200/80 shadow-xs', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Animaciones de la interfaz</span>
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Estado actual:{' '}
          <strong className={enabled ? 'text-emerald-700' : 'text-slate-600'}>
            {enabled ? 'animaciones activas' : 'animaciones desactivadas'}
          </strong>
          . Las animaciones están activadas por defecto en todos los equipos; si
          prefieres que la aplicación respete la configuración de Windows o macOS,
          elige &laquo;Automático&raquo;.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {OPTIONS.map((option) => {            const Icon = option.icon
            const active = preference === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreference(option.value)}
                aria-pressed={active}
                className={cn(
                  'text-left rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98]',
                  active
                    ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Icon className={cn('h-4 w-4', active ? 'text-blue-600' : 'text-slate-400')} />
                  {option.label}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                  {option.hint}
                </span>
              </button>
            )
          })}
        </div>

        {systemReduced && preference === 'auto' && (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-amber-900">
            Tu sistema tiene las animaciones de la interfaz desactivadas, por eso
            ahora mismo no se ven movimientos. Pulsa{' '}
            <strong>&laquo;Siempre activas&raquo;</strong> para verlas igualmente en
            este equipo.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
