import Link from 'next/link'
import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Scale,
  UtensilsCrossed,
  FileText,
  Calendar,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  Sparkles,
  Heart,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  const dateStr = d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} a las ${timeStr}`
}

export default async function PacienteDashboardPage() {
  const { user, patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({ select: { id: true } })
    patientId = firstPatient?.id || null
  }

  let firstName = user.name || 'Paciente'
  let lastAnthropometry: { date: Date; weightKg: number } | null = null
  let activeMealPlan: { id: string; name: string; startDate: Date; endDate: Date | null } | null = null
  let documentCount = 0
  let nextAppointment: { date: Date; modality: string; location: string | null } | null = null
  let hasPendingAnamnesis = false
  let pendingConsentsCount = 0

  if (patientId) {
    const [patientData, anthropometry, mealPlan, docsCount, appointment, consents] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        select: { firstName: true, lastName: true, anamnesisStatus: true },
      }),
      prisma.anthropometry.findFirst({
        where: { patientId, isPublishedToPatient: true },
        orderBy: { date: 'desc' },
        select: { date: true, weightKg: true },
      }),
      prisma.mealPlan.findFirst({
        where: {
          patientId,
          isSharedWithPatient: true,
          status: 'PUBLISHED',
        },
        orderBy: { publishedAt: 'desc' },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
      prisma.patientDocument.count({
        where: { patientId, isSharedWithPatient: true },
      }),
      prisma.appointment.findFirst({
        where: {
          patientId,
          date: { gte: new Date() },
          status: { not: 'CANCELLED' },
        },
        orderBy: { date: 'asc' },
        select: { date: true, modality: true, location: true },
      }),
      prisma.patientConsent.count({
        where: { patientId, accepted: false },
      }),
    ])

    if (patientData?.firstName) {
      firstName = patientData.firstName
    }
    hasPendingAnamnesis = patientData?.anamnesisStatus === 'PENDING' || patientData?.anamnesisStatus === 'SENT'
    pendingConsentsCount = consents
    lastAnthropometry = anthropometry
    activeMealPlan = mealPlan
    documentCount = docsCount
    nextAppointment = appointment

    // Fallback: If no appointment, check future consultation
    if (!nextAppointment) {
      const futureConsultation = await prisma.consultation.findFirst({
        where: {
          patientId,
          date: { gte: new Date() },
          isSharedWithPatient: true,
        },
        orderBy: { date: 'asc' },
        select: { date: true },
      })
      if (futureConsultation) {
        nextAppointment = {
          date: futureConsultation.date,
          modality: 'CONSULTA',
          location: 'Consulta Eva Vidal',
        }
      }
    }
  }

  const totalPendingAlerts = Number(hasPendingAnamnesis) + pendingConsentsCount

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-blue-200 text-xs font-semibold mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Eva Vidal Nutrición · Portal Personal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            ¡Hola, {firstName}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            Bienvenido/a a tu espacio de salud. Aquí puedes consultar tu plan nutricional activo,
            revisar la evolución de tus medidas corporales, gestionar tus citas y responder a tus cuestionarios.
          </p>
        </div>
      </div>

      {/* AVISOS PENDIENTES DESTACADOS (PDF pág 2 y 13) */}
      {totalPendingAlerts > 0 && (
        <Card className="rounded-3xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Tienes {totalPendingAlerts} {totalPendingAlerts === 1 ? 'acción pendiente' : 'acciones pendientes'} en tu portal
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  {hasPendingAnamnesis && pendingConsentsCount > 0
                    ? 'Cuestionario de alta y consentimientos pendientes de completar y firmar.'
                    : hasPendingAnamnesis
                    ? 'Cuestionario de alta pre-consulta pendiente de rellenar.'
                    : 'Consentimiento informado pendiente de firma digital.'}
                </p>
              </div>
            </div>

            <Link href="/paciente/cuestionarios">
              <Button className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-xs">
                <span>Revisar pendientes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Última Medición */}
        <Card className="rounded-3xl hover:border-blue-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Última Medición
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {lastAnthropometry ? (
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {lastAnthropometry.weightKg} <span className="text-sm font-medium text-gray-500">kg</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Registrado el {formatDate(lastAnthropometry.date)}
                </p>
              </div>
            ) : (
              <div>
                <div className="text-lg font-semibold text-gray-700">Sin registros</div>
                <p className="text-xs text-gray-400 mt-1">Aún no hay mediciones publicadas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Plan Activo */}
        <Card className="rounded-3xl hover:border-blue-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Plan Activo
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {activeMealPlan ? (
              <div>
                <div className="text-base font-bold text-gray-900 truncate" title={activeMealPlan.name}>
                  {activeMealPlan.name}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="default" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Activo
                  </Badge>
                  <span className="text-xs text-gray-500 truncate">
                    Desde {new Date(activeMealPlan.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-semibold text-gray-700">Sin plan activo</div>
                <p className="text-xs text-gray-400 mt-1">Pendiente de asignación</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Documentos Compartidos */}
        <Card className="rounded-3xl hover:border-blue-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Documentos
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {documentCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {documentCount === 1 ? 'Archivo disponible' : 'Archivos disponibles'}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Próxima Cita / Consulta */}
        <Card className="rounded-3xl hover:border-blue-200 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Próxima Cita
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div>
                <div className="text-sm font-bold text-gray-900 leading-snug">
                  {formatDateTime(nextAppointment.date)}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50 font-bold">
                    {nextAppointment.modality === 'ONLINE' ? 'Videollamada' : 'Presencial'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-gray-700">Sin citas agendadas</div>
                <p className="text-xs text-gray-400 mt-1">Pulsa en Mis Citas para solicitar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Sections - Todos los accesos del portal */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4">Módulos del Portal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Link to Plan */}
          <Link href="/paciente/plan" className="group block">
            <Card className="h-full rounded-3xl group-hover:border-blue-400 group-hover:shadow-md transition-all">
              <CardHeader>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                  <span>Mi Plan Nutricional</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed">
                  Menús del día, recetas interactivas y lista de la compra.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Citas */}
          <Link href="/paciente/citas" className="group block">
            <Card className="h-full rounded-3xl group-hover:border-blue-400 group-hover:shadow-md transition-all">
              <CardHeader>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                  <span>Mis Citas</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed">
                  Solicita nuevas sesiones, consulta horarios y videollamadas.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Cuestionarios */}
          <Link href="/paciente/cuestionarios" className="group block">
            <Card className="h-full rounded-3xl group-hover:border-blue-400 group-hover:shadow-md transition-all">
              <CardHeader>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                  <span>Cuestionarios & Firmas</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed">
                  Anamnesis pre-consulta y consentimientos informados.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Evolution */}
          <Link href="/paciente/evolucion" className="group block">
            <Card className="h-full rounded-3xl group-hover:border-blue-400 group-hover:shadow-md transition-all">
              <CardHeader>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                  <span>Mi Evolución</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed">
                  Historial antropométrico y composición corporal clínica.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Support / Contact Note */}
      <Card className="rounded-3xl bg-blue-50/60 border-blue-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-2xs border border-blue-100">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">¿Tienes dudas con tu alimentación o tu plan?</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Eva Vidal está a tu disposición en tu próxima consulta programada. Puedes revisar la sección de Ayuda & FAQ abajo a la derecha.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
