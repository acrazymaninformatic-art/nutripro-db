'use client'

import { Activity, Sparkles } from 'lucide-react'
import { useMotionPreference } from '@/lib/motion-preference'
import { cn } from '@/lib/utils'

/**
 * Interruptor rápido de animaciones en la cabecera. Permite activar o
 * desactivar el movimiento de la interfaz sin entrar en Configuración.
 */
export function MotionToggleButton({ className }: { className?: string }) {
  const { enabled, setPreference } = useMotionPreference()

  return (
    <button
      type="button"
      onClick={() => setPreference(enabled ? 'off' : 'on')}
      title={
        enabled
          ? 'Animaciones activadas · pulsa para desactivarlas'
          : 'Animaciones desactivadas · pulsa para activarlas'
      }
      aria-label={enabled ? 'Desactivar animaciones' : 'Activar animaciones'}
      aria-pressed={enabled}
      data-gsap-hover
      className={cn(
        'focus-ring flex h-10 w-10 items-center justify-center rounded-2xl border shadow-2xs transition-[background-color,color,transform] active:scale-95',
        enabled
          ? 'border-blue-200/80 bg-blue-50/80 text-blue-600 hover:bg-blue-100'
          : 'border-slate-200/80 bg-white/75 text-slate-400 hover:bg-slate-100',
        className
      )}
    >
      {enabled ? <Sparkles className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
    </button>
  )
}
