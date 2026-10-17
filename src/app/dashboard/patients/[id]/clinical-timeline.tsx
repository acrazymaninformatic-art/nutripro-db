'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Stethoscope,
  Scale,
  CalendarPlus,
  Activity,
  FileText,
  ShieldCheck,
  ClipboardList,
  Filter,
  Calculator,
  HeartPulse,
} from 'lucide-react'

export interface TimelineEvent {
  id: string
  date: Date | string
  type: 'CONSULTATION' | 'ANTHROPOMETRY' | 'MEAL_PLAN' | 'BLOOD_ANALYSIS' | 'DOCUMENT' | 'CONSENT' | 'SCREENING' | 'PROTOCOL' | 'CALCULATOR'
  title: string
  description?: string | null
  badge?: string | null
  isShared?: boolean
}

interface ClinicalTimelineProps {
  events: TimelineEvent[]
}

const TYPE_CONFIG = {
  CONSULTATION: {
    label: 'Consulta SOAP',
    icon: Stethoscope,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-600',
  },
  ANTHROPOMETRY: {
    label: 'Pesaje / Control',
    icon: Scale,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-600',
  },
  MEAL_PLAN: {
    label: 'Plan Nutricional',
    icon: CalendarPlus,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dotColor: 'bg-indigo-600',
  },
  BLOOD_ANALYSIS: {
    label: 'Analítica Sanguínea',
    icon: Activity,
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-600',
  },
  DOCUMENT: {
    label: 'Documento / Informe',
    icon: FileText,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-600',
  },
  CONSENT: {
    label: 'Consentimiento RGPD',
    icon: ShieldCheck,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-600',
  },
  SCREENING: {
    label: 'Cribado Clínico',
    icon: ClipboardList,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    dotColor: 'bg-cyan-600',
  },
  PROTOCOL: {
    label: 'Protocolo Clínico',
    icon: HeartPulse,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-600',
  },
  CALCULATOR: {
    label: 'Cálculo Energético & Riesgo',
    icon: Calculator,
    color: 'bg-violet-100 text-violet-800 border-violet-300',
    dotColor: 'bg-violet-600',
  },
}

export function ClinicalTimeline({ events }: ClinicalTimelineProps) {
  const [filterType, setFilterType] = useState<string>('ALL')

  const sortedEvents = useMemo(() => {
    return events
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((ev) => filterType === 'ALL' || ev.type === filterType)
  }, [events, filterType])

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Línea de Tiempo Clínica Unificada (5.2)
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Registro cronológico integral de consultas, pesajes, pautas nutricionales, analíticas y documentos
              </CardDescription>
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-full text-2xs font-bold transition-colors ${
                filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({events.length})
            </button>
            <button
              onClick={() => setFilterType('CONSULTATION')}
              className={`px-2.5 py-1 rounded-full text-2xs font-bold transition-colors ${
                filterType === 'CONSULTATION' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Consultas
            </button>
            <button
              onClick={() => setFilterType('ANTHROPOMETRY')}
              className={`px-2.5 py-1 rounded-full text-2xs font-bold transition-colors ${
                filterType === 'ANTHROPOMETRY' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mediciones
            </button>
            <button
              onClick={() => setFilterType('MEAL_PLAN')}
              className={`px-2.5 py-1 rounded-full text-2xs font-bold transition-colors ${
                filterType === 'MEAL_PLAN' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Planes
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {sortedEvents.length === 0 ? (
          <p className="text-center py-8 text-xs text-gray-400 italic">
            No hay eventos registrados en la línea de tiempo para este filtro.
          </p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {sortedEvents.map((ev) => {
              const conf = TYPE_CONFIG[ev.type] || TYPE_CONFIG.DOCUMENT
              const Icon = conf.icon
              const d = new Date(ev.date)

              return (
                <div key={ev.id} className="relative group">
                  {/* Punto en la línea vertical */}
                  <span
                    className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-100 ${conf.dotColor}`}
                  />

                  <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-blue-200 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-black border uppercase tracking-wider ${conf.color}`}>
                          <Icon className="h-3 w-3" />
                          <span>{conf.label}</span>
                        </span>
                        <h4 className="text-xs font-bold text-gray-900">{ev.title}</h4>
                        {ev.badge && (
                          <Badge variant="outline" className="text-3xs font-bold rounded-full bg-gray-50">
                            {ev.badge}
                          </Badge>
                        )}
                        {ev.isShared !== undefined && (
                          <span className={`text-3xs px-2 py-0.5 rounded-full font-bold ${
                            ev.isShared ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {ev.isShared ? 'Visible en portal' : 'Privado'}
                          </span>
                        )}
                      </div>

                      <span className="text-2xs text-gray-400 font-medium whitespace-nowrap">
                        {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {ev.description && (
                      <p className="mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
