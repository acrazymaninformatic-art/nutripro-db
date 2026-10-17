'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  FileText,
  Activity,
  HeartPulse,
  Calendar,
  ShieldCheck,
  Sparkles,
  User,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export type TabKey = 'resumen' | 'cuestionario' | 'evolucion' | 'clinica' | 'citas-legal'

interface Props {
  initialTab?: TabKey
  pendingReviewCount?: number
  resumenContent: React.ReactNode
  cuestionarioContent: React.ReactNode
  evolucionContent: React.ReactNode
  clinicaContent: React.ReactNode
  citasLegalContent: React.ReactNode
}

export function PatientTabsView({
  initialTab = 'resumen',
  pendingReviewCount = 0,
  resumenContent,
  cuestionarioContent,
  evolucionContent,
  clinicaContent,
  citasLegalContent,
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tabParam = searchParams.get('tab') as TabKey | null
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || initialTab)

  useEffect(() => {
    if (tabParam && ['resumen', 'cuestionario', 'evolucion', 'clinica', 'citas-legal'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: number }> = [
    { key: 'resumen', label: 'Resumen & Seguridad', icon: User },
    { key: 'cuestionario', label: 'Cuestionario & Revisión', icon: ClipboardList, badge: pendingReviewCount },
    { key: 'evolucion', label: 'Evolución & Métricas', icon: Activity },
    { key: 'clinica', label: 'SOAP, Protocolos & Analíticas', icon: HeartPulse },
    { key: 'citas-legal', label: 'Citas & Documentos RGPD', icon: Calendar },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation Bar (Static, fluid and non-anchoring) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer active:scale-[0.98] ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-white scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  className={`text-3xs font-black px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-white text-blue-700' : 'bg-rose-500 text-white animate-pulse'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Panes with Smooth Slide Transitions */}
      <div key={activeTab} className="transition-all duration-200">
        {activeTab === 'resumen' && (
          <div className="space-y-6 animate-slide-up">{resumenContent}</div>
        )}

        {activeTab === 'cuestionario' && (
          <div className="space-y-6 animate-slide-up">{cuestionarioContent}</div>
        )}

        {activeTab === 'evolucion' && (
          <div className="space-y-6 animate-slide-up">{evolucionContent}</div>
        )}

        {activeTab === 'clinica' && (
          <div className="space-y-6 animate-slide-up">{clinicaContent}</div>
        )}

        {activeTab === 'citas-legal' && (
          <div className="space-y-6 animate-slide-up">{citasLegalContent}</div>
        )}
      </div>
    </div>
  )
}
