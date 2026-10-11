'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  ChefHat,
  Apple,
  Calendar,
  Calculator,
  Plus,
  Settings,
  ArrowRight,
  Sparkles,
  X,
  ClipboardCheck,
} from 'lucide-react'

interface SearchItem {
  id: string
  title: string
  subtitle?: string
  category: 'Acciones' | 'Navegación' | 'Pacientes' | 'Recetas'
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const DEFAULT_COMMANDS: SearchItem[] = [
  {
    id: 'act-new-patient',
    title: 'Crear Nuevo Paciente',
    subtitle: 'Registrar ficha clínica, objetivos y alérgenos',
    category: 'Acciones',
    href: '/dashboard/patients/new',
    icon: Plus,
  },
  {
    id: 'act-new-appointment',
    title: 'Agendar Nueva Cita (Google Calendar)',
    subtitle: 'Asignar día y hora con aviso al paciente',
    category: 'Acciones',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    id: 'act-new-plan',
    title: 'Diseñar Nuevo Plan Nutricional',
    subtitle: 'Crear menú semanal por raciones',
    category: 'Acciones',
    href: '/dashboard/plans/new',
    icon: Calendar,
  },
  {
    id: 'act-new-recipe',
    title: 'Crear Nueva Receta Clínica',
    subtitle: 'Elaborar plato combinando ingredientes pesados',
    category: 'Acciones',
    href: '/dashboard/recipes/new',
    icon: ChefHat,
  },
  {
    id: 'nav-calc',
    title: 'Calculadora Metabólica & TMB',
    subtitle: 'Mifflin, Harris-Benedict, Katch, TDEE y reparto g/kg',
    category: 'Navegación',
    href: '/dashboard/calculator',
    icon: Calculator,
  },
  {
    id: 'nav-appointments',
    title: 'Agenda & Citas',
    subtitle: 'Calendario clínico de consultas presenciales y online',
    category: 'Navegación',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    id: 'nav-foods',
    title: 'Base de Alimentos',
    subtitle: 'Buscador de más de 1.400 alimentos españoles',
    category: 'Navegación',
    href: '/dashboard/foods',
    icon: Apple,
  },
  {
    id: 'nav-recipes',
    title: 'Recetario Clínico',
    subtitle: 'Catálogo de platos con macros por ración',
    category: 'Navegación',
    href: '/dashboard/recipes',
    icon: ChefHat,
  },
  {
    id: 'nav-patients',
    title: 'Directorio de Pacientes',
    subtitle: 'Gestión de fichas, mediciones y anamnesis',
    category: 'Navegación',
    href: '/dashboard/patients',
    icon: Users,
  },
  {
    id: 'nav-questionnaires',
    title: 'Cuestionarios Pre-Consulta (Anamnesis)',
    subtitle: 'Control y envío de cuestionarios médicos a pacientes',
    category: 'Navegación',
    href: '/dashboard/questionnaires',
    icon: ClipboardCheck,
  },
  {
    id: 'nav-settings',
    title: 'Ajustes de Consulta Eva Vidal',
    subtitle: 'Datos de colegiado, clínica y correo',
    category: 'Navegación',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus on input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Filter commands
  const filteredCommands = query.trim()
    ? DEFAULT_COMMANDS.filter((cmd) =>
        `${cmd.title} ${cmd.subtitle || ''} ${cmd.category}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : DEFAULT_COMMANDS

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false)
    router.push(item.href)
  }

  // Keyboard navigation
  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredCommands[selectedIndex])
    }
  }

  return (
    <>
      {/* Header quick button that opens Command Palette */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 hover:bg-gray-200/80 text-gray-500 hover:text-gray-900 text-xs font-semibold border border-gray-200 transition-colors shadow-2xs cursor-pointer"
        title="Buscar o ejecutar acción (Ctrl + K)"
      >
        <Search className="h-3.5 w-3.5 text-gray-400" />
        <span className="hidden sm:inline">Buscar o navegar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-gray-500 rounded border border-gray-200 shadow-2xs">
          Ctrl K
        </kbd>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[12vh] px-4">
          <div
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <Search className="h-5 w-5 text-blue-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyNav}
                placeholder="Escribe para buscar paciente, plan, receta o acción rápida..."
                className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No se encontraron comandos o secciones para "{query}"
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const Icon = item.icon
                  const isSelected = idx === selectedIndex

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs block truncate">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="text-[11px] text-gray-500 block truncate">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <ArrowRight
                          className={`h-3.5 w-3.5 transition-transform ${
                            isSelected
                              ? 'text-blue-600 translate-x-0.5'
                              : 'text-gray-300'
                          }`}
                        />
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer shortcuts */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-[11px] text-gray-400 px-4">
              <span className="flex items-center gap-1.5">
                <span>Navegar con</span>
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white rounded border">↑</kbd>
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white rounded border">↓</kbd>
                <span>y</span>
                <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white rounded border">Enter</kbd>
              </span>
              <span>Cerrar con <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white rounded border">Esc</kbd></span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
