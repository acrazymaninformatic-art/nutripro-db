import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logoutAction } from './actions'
import { exitPatientPreview } from '@/app/dashboard/patients/preview-actions'
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  TrendingUp,
  FileText,
  ClipboardCheck,
  LogOut,
  User,
  ShieldAlert,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HelpWidget } from './help-widget'
import { PacienteDesktopNav, PacienteMobileNav } from './paciente-nav'

export const dynamic = 'force-dynamic'

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({
      select: { id: true, firstName: true, lastName: true },
    })
    patientId = firstPatient?.id || null
  }

  let patientName = user.name || 'Paciente'
  let consentAccepted = true

  if (patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { firstName: true, lastName: true, consentAcceptedAt: true, consentPolicyVersion: true },
    })
    if (patient) {
      patientName = `${patient.firstName} ${patient.lastName}`.trim()
      consentAccepted = Boolean(patient.consentAcceptedAt && patient.consentPolicyVersion === '1.0')
    }
  }

  // Comprobar si el consentimiento RGPD está aceptado
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') || headerList.get('x-invoke-path') || ''
  const isPoliticasPage = pathname.includes('/politicas')

  if (!consentAccepted && !isAdminPreview) {
    if (pathname && !isPoliticasPage) {
      redirect('/paciente/politicas')
    }
    // Si estamos en /paciente/politicas o no se puede inferir con certeza la ruta en el layout,
    // renderizamos el contenido directamente sin el menú del portal para evitar bucles (ERR_TOO_MANY_REDIRECTS)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {isAdminPreview && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2.5 font-medium text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-amber-600 z-50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-950 shrink-0" />
              <span>
                <strong>Modo Vista Previa de Consulta (Solo Lectura):</strong> Viendo el portal del paciente <strong>{patientName}</strong>.
              </span>
            </div>
            <form action={exitPatientPreview}>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl bg-amber-950 hover:bg-black text-amber-50 text-xs font-bold shadow-xs py-1 px-3 h-auto"
              >
                Volver al expediente de consulta →
              </Button>
            </form>
          </div>
        )}
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ambient-patient flex flex-col">
      {isAdminPreview && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 font-medium text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-amber-600 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-950 shrink-0" />
            <span>
              <strong>Modo Vista Previa de Consulta (Solo Lectura):</strong> Viendo el portal del paciente <strong>{patientName}</strong>. Acciones de modificación deshabilitadas.
            </span>
          </div>
          <form action={exitPatientPreview}>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-amber-950 hover:bg-black text-amber-50 text-xs font-bold shadow-xs py-1 px-3 h-auto"
            >
              Volver al expediente de consulta →
            </Button>
          </form>
        </div>
      )}
      <div className="flex-1 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex w-72 bg-white/90 backdrop-blur-md border-r border-slate-200/80 shrink-0 flex-col min-h-screen sticky top-0 shadow-xs z-30">
          {/* Brand Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <Link href="/paciente" className="flex items-center gap-3.5 group">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 shrink-0 overflow-hidden p-1.5 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/logo.png"
                  alt="Eva Vidal Nutrición"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-slate-900 tracking-tight leading-tight">
                  Eva Vidal
                </span>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Nutrición Clínica
                </span>
              </div>
            </Link>
          </div>

          {/* Admin Preview Notice */}
          {isAdminPreview && (
            <div className="mx-4 mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">Modo Vista Previa</span>
                <span className="text-amber-700 text-[11px]">Explorando como paciente</span>
              </div>
            </div>
          )}

          {/* Dynamic Navigation Links (Desktop) */}
          <PacienteDesktopNav />

          {/* User Card & Logout Button in Sidebar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {patientName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{patientName}</p>
                <p className="text-[10px] text-slate-500 truncate font-medium">Portal de Paciente</p>
              </div>
            </div>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200 shadow-2xs rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </Button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar for Desktop & Mobile */}
          <header className="h-16 glass-panel sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs">
            {/* Mobile Brand */}
            <div className="flex items-center gap-3 md:hidden">
              <Link href="/paciente" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 p-1 flex items-center justify-center">
                  <img src="/logo.png" alt="Eva Vidal" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">Eva Vidal</span>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Nutrición</span>
                </div>
              </Link>
            </div>

            {/* Desktop Brand Context */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Eva Vidal Nutrición · Portal Clínico Confidencial</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-white/90 border border-slate-200/80 px-3 py-1.5 rounded-full font-semibold shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{patientName}</span>
              </div>
              <form action={logoutAction} className="md:hidden">
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-6xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Floating Glass Bottom Navigation for Mobile */}
      <PacienteMobileNav />

      {/* Botón flotante de ayuda y FAQ */}
      <HelpWidget />
    </div>
  )
}
