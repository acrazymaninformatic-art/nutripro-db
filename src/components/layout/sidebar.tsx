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
  Leaf,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/dashboard/patients', icon: Users },
  { name: 'Alimentos', href: '/dashboard/foods', icon: Apple },
  { name: 'Recetas', href: '/dashboard/recipes', icon: ChefHat },
  { name: 'Planes', href: '/dashboard/plans', icon: CalendarDays },
]

export function Sidebar() {
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
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-600 text-white shrink-0 shadow-sm">
            <Leaf className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-bold text-gray-900 tracking-tight leading-none">
                Nutri<span className="text-green-600">Pro</span>
              </span>
              <span className="text-xs text-gray-500 font-medium leading-tight mt-0.5">
                Dietética & Nutrición
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
              title={isCollapsed ? item.name : undefined}
              className={cn(
                'group flex items-center text-sm font-medium transition-colors border-l-3 border-l-[3px]',
                isCollapsed
                  ? 'justify-center px-0 py-3'
                  : 'gap-3 px-4 py-3',
                isActive
                  ? 'bg-green-50 text-green-700 border-green-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'
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
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 text-green-800 font-semibold text-sm shrink-0">
                DR
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  Dr. Ruiz
                </span>
                <span className="text-xs text-gray-500 truncate">
                  Nutricionista
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors shrink-0"
              title="Configuración"
              aria-label="Configuración"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 text-green-800 font-semibold text-sm shrink-0"
              title="Dr. Ruiz - Nutricionista"
            >
              DR
            </div>
            <Link
              href="/dashboard/settings"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Configuración"
              aria-label="Configuración"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
