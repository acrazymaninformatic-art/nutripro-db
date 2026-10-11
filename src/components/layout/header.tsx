'use client'

import { usePathname } from 'next/navigation'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Panel Principal',
  '/dashboard/patients': 'Pacientes',
  '/dashboard/foods': 'Alimentos',
  '/dashboard/recipes': 'Recetas',
  '/dashboard/plans': 'Planes Nutricionales',
  '/dashboard/settings': 'Configuración',
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
    <header className="flex items-center h-14 px-6 bg-white border-b border-gray-200 shrink-0">
      <h1 className="text-lg font-bold text-gray-900 tracking-tight">
        {title}
      </h1>
    </header>
  )
}
