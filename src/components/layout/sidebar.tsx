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
        'relative flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shrink-0 select-none z-20',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden focus:outline-none"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 shrink-0 shadow-xs overflow-hidden p-0.5">
            <img
              src="/logo.png"
              alt="Eva Vidal"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-gray-900 tracking-tight leading-none">
                EVSoftware
              </span>
              <span className="text-[10px] text-blue-600 font-bold leading-tight mt-0.5">
                Consulta · Eva Vidal
              </span>
            </div>
          )}
        </Link>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Colapsar menú"
            aria-label="Colapsar menú"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Collapse Toggle when collapsed */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Expandir menú"
            aria-label="Expandir menú"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-1">
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
                'group flex items-center text-sm font-medium transition-colors border-l-3 border-l-[3px]',
                isCollapsed
                  ? 'justify-center px-0 py-3'
                  : 'gap-3 px-4 py-3',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-blue-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
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
      <div className="p-3 border-t border-gray-200 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs shrink-0">
                EV
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate">{professionalName}</span>
                <span className="text-xs text-gray-500 truncate">
                  Nutricionista Clínica
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              prefetch={true}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors shrink-0"
              title="Configuración"
              aria-label="Configuración"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <form action={logout}>
              <button type="submit" className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-md" title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs shrink-0"
              title="Eva Vidal - Nutricionista Clínica"
            >
              EV
            </div>
            <Link
              href="/dashboard/settings"
              prefetch={true}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Configuración"
              aria-label="Configuración"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <form action={logout}>
              <button type="submit" className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-md" title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  )
}
