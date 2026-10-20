'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  FileText,
  User,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavLinkItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navLinks: NavLinkItem[] = [
  { name: 'Inicio', href: '/paciente', icon: LayoutDashboard },
  { name: 'Mi Plan', href: '/paciente/plan', icon: CalendarDays },
  { name: 'Mis Citas', href: '/paciente/citas', icon: Calendar },
  { name: 'Mi Evolución', href: '/paciente/evolucion', icon: TrendingUp },
  { name: 'Cuestionarios y Firmas', href: '/paciente/cuestionarios', icon: ClipboardCheck },
  { name: 'Mis Documentos', href: '/paciente/documentos', icon: FileText },
  { name: 'Mi Perfil', href: '/paciente/perfil', icon: User },
  { name: 'Mi Cuenta', href: '/paciente/configuracion', icon: Settings },
]

export function PacienteDesktopNav() {
  const pathname = usePathname()

  const isLinkActive = (href: string) => {
    if (href === '/paciente') return pathname === '/paciente'
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navLinks.map((item) => {
        const Icon = item.icon
        const isActive = isLinkActive(item.href)
        const navId = item.href === '/paciente' ? 'tour-nav-inicio' : `tour-nav-${item.href.replace('/paciente/', '')}`

        return (
          <Link
            key={item.href}
            id={navId}
            data-tour={navId}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            data-gsap-nav-item
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group',
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xs shadow-blue-700/25'
                : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 group-hover:bg-blue-100/70 group-hover:text-blue-700 text-slate-500'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-110', isActive && 'scale-105')} />
            </div>
            <span className="truncate">{item.name}</span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

const mobileNavLinks = [
  { name: 'Inicio', href: '/paciente', icon: LayoutDashboard },
  { name: 'Mi Plan', href: '/paciente/plan', icon: CalendarDays },
  { name: 'Citas', href: '/paciente/citas', icon: Calendar },
  { name: 'Progreso', href: '/paciente/evolucion', icon: TrendingUp },
  { name: 'Firmas', href: '/paciente/cuestionarios', icon: ClipboardCheck },
]

export function PacienteMobileNav() {
  const pathname = usePathname()

  const isLinkActive = (href: string) => {
    if (href === '/paciente') return pathname === '/paciente'
    return pathname.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav px-3 py-2 border-t border-slate-200/90 shadow-lg flex items-center justify-around">
      {mobileNavLinks.map((item) => {
        const Icon = item.icon
        const isActive = isLinkActive(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            data-gsap-nav-item
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-200 relative',
              isActive
                ? 'text-blue-700 font-bold scale-105'
                : 'text-slate-500 hover:text-blue-600 font-medium'
            )}
          >
            <div
              className={cn(
                'p-1 rounded-xl transition-colors',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">{item.name}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
