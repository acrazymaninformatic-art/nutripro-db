'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Apple,
  ChefHat,
  CalendarDays,
  Calendar,
  Calculator,
  Settings,
  ClipboardCheck,
  GitCompareArrows,
  History,
  LogOut,
  Mail,
  Activity,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/login/actions'

export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/dashboard/patients', icon: Users },
  { name: 'Cuestionarios', href: '/dashboard/questionnaires', icon: ClipboardCheck },
  { name: 'Agenda & Citas', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Alimentos', href: '/dashboard/foods', icon: Apple },
  { name: 'Recetas', href: '/dashboard/recipes', icon: ChefHat },
  { name: 'Planes', href: '/dashboard/plans', icon: CalendarDays },
  { name: 'Comparar Planes', href: '/dashboard/plans/comparar', icon: GitCompareArrows },
  { name: 'Envío de Correos', href: '/dashboard/emails', icon: Mail },
  { name: 'Control', href: '/dashboard/operations', icon: Activity },
  { name: 'Auditoría', href: '/dashboard/audit', icon: History },
  { name: 'Calculadora', href: '/dashboard/calculator', icon: Calculator },
]

export function checkIsNavActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname.startsWith(href)
}

export function Sidebar({
  professionalName,
  mobileOpen = false,
  onMobileClose,
}: {
  professionalName: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const pathname = usePathname()

  if (!mobileOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar menú de navegación"
        onClick={onMobileClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs animate-overlay-in"
        data-gsap-overlay
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-white/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-left duration-200"
        data-gsap-sidebar
      >
        {/* Logo & Close */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
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
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Cerrar menú"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-3 medical-scrollbar">
          {navItems.map((item) => {
            const isActive = checkIsNavActive(item.href, pathname)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={onMobileClose}
                aria-current={isActive ? 'page' : undefined}
                data-gsap-nav-item
                className={cn(
                  'group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xs shadow-blue-600/25'
                    : 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100/60'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive && 'scale-105'
                    )}
                  />
                </div>
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Profile */}
        <div className="p-3 border-t border-slate-200/80 bg-white/50">
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs shrink-0 border border-blue-200/80">
                EV
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-slate-900">{professionalName}</span>
                <span className="truncate text-[11px] text-slate-500">
                  Nutricionista Clínica
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Link
                href="/dashboard/settings"
                prefetch={true}
                onClick={onMobileClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Configuración"
                aria-label="Configuración"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
