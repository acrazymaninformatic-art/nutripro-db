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

export const dynamic = 'force-dynamic'

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

  // Redirigir a políticas si no están aceptadas (salvo si estamos ya en /paciente/politicas o en preview de admin)
  const headerList = await headers()
  const pathname = headerList.get('x-invoke-path') || ''
  if (!consentAccepted && !isAdminPreview && !pathname.includes('/politicas')) {
    redirect('/paciente/politicas')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar for Desktop */}
        <aside className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-200/80 shrink-0 flex flex-col md:min-h-screen">
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100">
          <Link href="/paciente" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100/80 shrink-0 overflow-hidden p-1 shadow-xs">
              <img
                src="/logo.png"
                alt="Eva Vidal Nutrición"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-900 tracking-tight leading-tight">
                EVSoftware
              </span>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Paciente
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Preview Notice */}
        {isAdminPreview && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold block">Vista previa de administrador</span>
              <span className="text-amber-700 text-[11px]">Viendo el portal como paciente</span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 p-4 md:p-5 space-y-1.5 overflow-x-auto md:overflow-visible flex md:flex-col">
          {navLinks.map((item) => {
            const Icon = item.icon
              const navId = item.href === '/paciente' ? 'tour-nav-inicio' : `tour-nav-${item.href.replace('/paciente/', '')}`
              return (
                <Link
                  key={item.href}
                  id={navId}
                  data-tour={navId}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50/70 transition-colors shrink-0"
                >
                <Icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Card & Logout Button in Sidebar */}
        <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-2xl bg-white border border-gray-200/60 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{patientName}</p>
              <p className="text-[10px] text-gray-500 truncate">Paciente</p>
            </div>
          </div>

          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200/80 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">EVSoftware · Paciente</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{patientName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      </div>

      {/* Botón flotante de ayuda y FAQ */}
      <HelpWidget />
    </div>
  )
}
