'use client'

import { useState } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Settings,
  ClipboardCheck,
  LogOut,
  Mail,
  Activity,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/login/actions'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/dashboard/patients', icon: Users },
  { name: 'Cuestionarios Pre-Consulta', href: '/dashboard/questionnaires', icon: ClipboardCheck },
  { name: 'Agenda & Citas', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Alimentos', href: '/dashboard/foods', icon: Apple },
  { name: 'Recetas', href: '/dashboard/recipes', icon: ChefHat },
  { name: 'Planes', href: '/dashboard/plans', icon: CalendarDays },
  { name: 'Envío de Correos', href: '/dashboard/emails', icon: Mail },
  { name: 'Control', href: '/dashboard/operations', icon: Activity },
  { name: 'Calculadora', href: '/dashboard/calculator', icon: Calculator },
]

export function Sidebar({
  professionalName,
  mobileOpen = false,
  onMobileClose,
}: {
  professionalName: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const checkIsActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden animate-overlay-in"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col select-none border-r border-[#1C2B4A] bg-[#0A1120]/95 shadow-2xl backdrop-blur-xl transition-[width,transform] duration-300 ease-out lg:relative lg:z-20 lg:shadow-none',
          isCollapsed ? 'lg:w-16' : 'w-72 lg:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          mobileOpen ? 'flex' : 'hidden lg:flex'
        )}
      >
      {/* Logo & Toggle Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#1C2B4A] px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden focus:outline-none"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1C2B4A] bg-[#0F1A30] p-0.5 shadow-2xs">
            <img
              src="/logo.png"
              alt="Eva Vidal"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black tracking-tight leading-none text-[#E6EEFF]">
                EVSoftware
              </span>
              <span className="mt-1 text-[10px] font-bold leading-tight text-blue-300">
                Consulta · Eva Vidal
              </span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Cerrar menú"
          className="ml-auto rounded-xl p-2 text-[#647A9F] transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
             className="rounded-xl p-1.5 text-[#647A9F] transition-colors hover:bg-white/10 hover:text-white"
            title="Colapsar menú"
            aria-label="Colapsar menú"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse Toggle when collapsed */}
      {isCollapsed && (
        <div className="flex justify-center border-b border-[#1C2B4A] py-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
             className="rounded-xl p-1.5 text-[#647A9F] transition-colors hover:bg-white/10 hover:text-white"
            title="Expandir menú"
            aria-label="Expandir menú"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-2.5 medical-scrollbar">
        {navItems.map((item) => {
          const isActive = checkIsActive(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onMobileClose}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center text-xs font-bold rounded-2xl transition-all duration-200',
                isCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xs shadow-blue-600/25'
                   : 'text-[#8FA3C7] hover:bg-blue-500/10 hover:text-blue-300'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-[#647A9F] group-hover:bg-blue-500/15 group-hover:text-blue-300'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive && 'scale-105'
                  )}
                />
              </div>
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section: User avatar with name, settings gear icon */}
      <div className="border-t border-[#1C2B4A] bg-[#0F1A30]/70 p-3">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl p-2 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs shrink-0 border border-blue-200/80">
                EV
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-[#E6EEFF]">{professionalName}</span>
                <span className="truncate text-[11px] text-[#647A9F]">
                  Nutricionista Clínica
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Link
                href="/dashboard/settings"
                prefetch={true}
                onClick={onMobileClose}
                 className="rounded-xl p-1.5 text-[#647A9F] transition-colors hover:bg-white/10 hover:text-white"
                title="Configuración"
                aria-label="Configuración"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <form action={logout}>
               <button type="submit" className="rounded-xl p-1.5 text-[#647A9F] transition-colors hover:bg-rose-500/15 hover:text-rose-300" title="Cerrar sesión" aria-label="Cerrar sesión">
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs shrink-0 border border-blue-200/80"
              title="Eva Vidal - Nutricionista Clínica"
            >
              EV
            </div>
            <Link
              href="/dashboard/settings"
              prefetch={true}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Configuración"
              aria-label="Configuración"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <form action={logout}>
              <button type="submit" className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors" title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
      </aside>
    </>
  )
}
