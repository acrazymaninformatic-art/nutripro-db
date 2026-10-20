'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { CommandPalette } from './command-palette'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { MotionToggleButton } from '@/components/ui/motion-toggle-button'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Panel Principal',
  '/dashboard/patients': 'Pacientes',
  '/dashboard/questionnaires': 'Cuestionarios',
  '/dashboard/foods': 'Alimentos',
  '/dashboard/recipes': 'Recetario Clínico',
  '/dashboard/plans': 'Planes Nutricionales',
  '/dashboard/appointments': 'Agenda & Citas',
  '/dashboard/emails': 'Envío de Correos',
  '/dashboard/control': 'Control',
  '/dashboard/operations': 'Control de Consulta',
  '/dashboard/audit': 'Auditoría',
  '/dashboard/operations/emails': 'Registro de Correos',
  '/dashboard/calculator': 'Calculadora',
  '/dashboard/settings': 'Configuración',
  '/dashboard/anamnesis': 'Anamnesis',
  '/dashboard/billing': 'Facturación',
}

function getTitle(pathname: string): string {
  if (routeTitles[pathname]) {
    return routeTitles[pathname]
  }

  // Support subroutes like /dashboard/patients/new. Longest match first so
  // /dashboard/operations/emails does not resolve to /dashboard/operations.
  const matchedRoute = Object.keys(routeTitles)
    .filter((route) => route !== '/dashboard')
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname.startsWith(route))

  if (matchedRoute) {
    return routeTitles[matchedRoute]
  }

  return 'Panel Principal'
}

export function Header({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <header
      className="glass-nav sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 px-4 shadow-[0_4px_18px_-16px_rgba(15,23,42,.5)] select-none sm:px-6"
      data-gsap-header
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú de navegación"
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/75 text-slate-600 shadow-2xs transition-[background-color,color,transform] hover:bg-blue-50 hover:text-blue-700 active:scale-95 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 sm:block">EVSoftware · Consulta clínica</p>
          <h1
            className="truncate text-base font-bold tracking-tight text-slate-950 sm:text-lg"
            data-gsap-route-title
            title={title}
          >
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <MotionToggleButton />
        <NotificationCenter role="ADMIN" />
        <CommandPalette />
      </div>
    </header>
  )
}
