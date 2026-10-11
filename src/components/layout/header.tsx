'use client'

import { usePathname } from 'next/navigation'
import { CommandPalette } from './command-palette'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Panel Principal',
  '/dashboard/patients': 'Pacientes',
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

export function Header() {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0 select-none">
      <h1 className="text-lg font-bold text-gray-900 tracking-tight">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <CommandPalette />
      </div>
    </header>
  )
}
