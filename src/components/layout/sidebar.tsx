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
  ReceiptText,
  Activity,
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
  { name: 'Cobros', href: '/dashboard/billing', icon: ReceiptText },
  { name: 'Control', href: '/dashboard/operations', icon: Activity },
  { name: 'Calculadora', href: '/dashboard/calculator', icon: Calculator },
]

export function Sidebar({ professionalName }: { professionalName: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const checkIsActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-white/95 backdrop-blur-md border-r border-slate-200/80 transition-all duration-300 ease-in-out shrink-0 select-none z-20',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/80">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden focus:outline-none"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs overflow-hidden p-0.5">
            <img
              src="/logo.png"
              alt="Eva Vidal"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-slate-900 tracking-tight leading-none">
                EVSoftware
              </span>
              <span className="text-[10px] text-blue-600 font-bold leading-tight mt-1">
                Consulta · Eva Vidal
              </span>
            </div>
          )}
        </Link>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Colapsar menú"
            aria-label="Colapsar menú"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse Toggle when collapsed */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
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
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center text-xs font-semibold rounded-2xl transition-all duration-150',
                isCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5',
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section: User avatar with name, settings gear icon */}
      <div className="p-3 border-t border-slate-200/80 bg-white/50">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl hover:bg-slate-100/70 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs shrink-0 border border-blue-200/80">
                EV
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate">{professionalName}</span>
                <span className="text-[11px] text-slate-500 truncate">
                  Nutricionista Clínica
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
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
  )
}
