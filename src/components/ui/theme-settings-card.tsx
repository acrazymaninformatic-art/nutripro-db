'use client'

import { useThemePreference, type ThemePreference } from '@/lib/theme-preference'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const OPTIONS: Array<{
  value: ThemePreference
  label: string
  hint: string
  icon: typeof Sun
}> = [
  { value: 'light', label: 'Claro', hint: 'Fondo blanco, ideal para consulta con luz.', icon: Sun },
  { value: 'dark', label: 'Oscuro', hint: 'Reduce el brillo en consultas nocturno.', icon: Moon },
  { value: 'system', label: 'Sistema', hint: 'Sigue la preferencia de tu dispositivo.', icon: Monitor },
]

export function ThemeSettingsCard({ className }: { className?: string }) {
  const { preference, resolved, setPreference } = useThemePreference()

  return (
    <Card className={cn('rounded-3xl border-slate-200/80 shadow-xs', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Moon className="h-4 w-4 text-blue-600" />
          Apariencia
        </CardTitle>
        <CardDescription className="text-xs">
          Elige el tema de la interfaz. Estado actual:{' '}
          <strong className="text-slate-700">
            {resolved === 'dark' ? 'modo oscuro' : 'modo claro'}
          </strong>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon
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
      </CardContent>
    </Card>
  )
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolved, toggle } = useThemePreference()

  return (
    <button
      type="button"
      onClick={toggle}
      title={resolved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={resolved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={resolved === 'dark'}
      data-gsap-hover
      className={cn(
        'focus-ring flex h-10 w-10 items-center justify-center rounded-2xl border shadow-2xs transition-[background-color,color,transform] active:scale-95',
        resolved === 'dark'
          ? 'border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-700'
          : 'border-slate-200/80 bg-white/75 text-slate-600 hover:bg-slate-100',
        className
      )}
    >
      {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
