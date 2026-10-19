'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { CommandPalette } from './command-palette'
import { NotificationCenter } from '@/components/notifications/notification-center'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Panel Principal',
  '/dashboard/patients': 'Pacientes',
  '/dashboard/questionnaires': 'Cuestionarios Pre-Consulta (Anamnesis)',
  '/dashboard/foods': 'Alimentos',
  '/dashboard/recipes': 'Recetario Clínico',
  '/dashboard/plans': 'Planes Nutricionales',
  '/dashboard/appointments': 'Agenda & Citas (Google Calendar)',
  '/dashboard/calculator': 'Calculadora Nutricional & TMB',
  '/dashboard/settings': 'Configuración de Consulta',
}

function getTitle(pathname: string): string {
  if (routeTitles[pathname]) {
    return routeTitles[pathname]
  }

  // Support subroutes like /dashboard/patients/new
  const matchedRoute = Object.keys(routeTitles)
    .filter((route) => route !== '/dashboard')
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
    <header className="glass-nav sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#1C2B4A] px-4 shadow-[0_4px_18px_-16px_rgba(0,0,0,.8)] select-none sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú de navegación"
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1C2B4A] bg-[#13213B] text-[#8FA3C7] shadow-2xs transition-[background-color,color,transform] hover:bg-blue-500/15 hover:text-blue-300 active:scale-95 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 sm:block">EVSoftware · Consulta clínica</p>
          <h1 className="truncate text-base font-bold tracking-tight text-[#E6EEFF] sm:text-lg">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationCenter role="ADMIN" />
        <CommandPalette />
      </div>
    </header>
  )
}
