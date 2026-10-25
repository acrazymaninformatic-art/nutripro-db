'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Settings, LogOut } from 'lucide-react'
import { CommandPalette } from './command-palette'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { MotionToggleButton } from '@/components/ui/motion-toggle-button'
import { navItems, checkIsNavActive } from './sidebar'
import { cn } from '@/lib/utils'
import { logout } from '@/app/login/actions'

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

export function Header({
  professionalName = 'Eva Vidal',
  onMenu,
}: {
  professionalName?: string
  onMenu?: () => void
}) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <header
      className="glass-nav sticky top-0 z-30 shrink-0 select-none border-b border-slate-200/80 shadow-[0_4px_18px_-16px_rgba(15,23,42,.5)] bg-white/95 backdrop-blur-xl"
      data-gsap-header
    >
      {/* Fila superior: Marca, Título de sección, Herramientas y Perfil */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 border-b border-slate-100/90">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Abrir menú de navegación"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-2xs transition-[background-color,color,transform] hover:bg-blue-50 hover:text-blue-700 active:scale-95 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden focus:outline-none group shrink-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs group-hover:scale-105 transition-transform duration-200">
              <img
                src="/logo.png"
                alt="Eva Vidal"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black tracking-tight leading-none text-slate-900">
                EVSoftware
              </span>
              <span className="mt-1 text-[10px] font-bold leading-tight text-blue-600">
                Consulta · Eva Vidal
              </span>
            </div>
          </Link>

          <div className="hidden md:block h-5 w-px bg-slate-200/80 mx-1 shrink-0" />

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span
              className="truncate text-xs font-bold text-slate-700 bg-slate-100/90 border border-slate-200/70 px-2.5 py-1 rounded-lg"
              data-gsap-route-title
              title={title}
            >
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <CommandPalette />
          <MotionToggleButton />
          <NotificationCenter role="ADMIN" />

          <div className="hidden sm:block h-5 w-px bg-slate-200/80 mx-0.5" />

          {/* Pastilla de usuario profesional */}
          <div className="flex items-center gap-1.5 py-1 px-2 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px] shrink-0 border border-blue-200/80">
              EV
            </div>
            <div className="hidden xl:flex flex-col min-w-0 max-w-[130px]">
              <span className="truncate text-xs font-bold text-slate-900 leading-tight">
                {professionalName}
              </span>
              <span className="truncate text-[10px] text-slate-500 leading-tight">
                Nutricionista
              </span>
            </div>
            <Link
              href="/dashboard/settings"
              prefetch={true}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
              title="Configuración"
              aria-label="Configuración"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Fila inferior: Barra de navegación horizontal superior (Desktop) */}
      <nav
        className="hidden lg:flex items-center px-4 sm:px-6 overflow-x-auto medical-scrollbar gap-1 py-1.5 bg-slate-50/60"
        aria-label="Navegación principal"
        data-gsap-sidebar
      >
        {navItems.map((item) => {
          const isActive = checkIsNavActive(item.href, pathname)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-current={isActive ? 'page' : undefined}
              data-gsap-nav-item
              className={cn(
                'group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 select-none',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xs shadow-blue-600/25'
                  : 'text-slate-600 hover:bg-blue-50/80 hover:text-blue-700'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100/60'
                )}
              >
                <Icon
                  className={cn(
                    'w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110',
                    isActive && 'scale-105'
                  )}
                />
              </div>
              <span>{item.name}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0 ml-0.5" />
              )}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
