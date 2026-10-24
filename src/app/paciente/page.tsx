import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight, Calendar, ChevronRight, ClipboardCheck, CookingPot, FileText, Heart, Scale, Settings, Sparkles, TrendingUp, User, UtensilsCrossed } from 'lucide-react'
import { PatientProtocolCard } from './patient-protocol-card'
import { getFoodImage, FALLBACK_FOOD_SVG } from '@/lib/nutrition'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

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

  const patientId = authPatientId

  let firstName = user.name || 'Paciente'
  let lastAnthropometry: { date: Date; weightKg: number } | null = null
  let activeMealPlan: any = null
  let documentCount = 0
  let nextAppointment: { date: Date; modality: string; location: string | null } | null = null
  let hasPendingAnamnesis = false
  let pendingConsentsCount = 0
  let activeProtocol: {
    id: string
    type: string
    currentPhase: string | null
    title: string
    symptomLogJson: string
  } | null = null

  if (patientId) {
    const [patientData, anthropometry, mealPlan, docsCount, appointment, consents, protocol] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        select: { firstName: true, lastName: true, anamnesisStatus: true, consentAcceptedAt: true, consentPolicyVersion: true },
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
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              meals: {
                orderBy: { order: 'asc' },
                include: {
                  items: {
                    include: {
                      food: true,
                      recipe: true,
                    },
                  },
                },
              },
            },
          },
        },
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
      prisma.patientConsent.findMany({
        where: { patientId, type: { in: REQUIRED_PORTAL_CONSENTS.map((consent) => consent.type) }, version: LEGAL_POLICY_VERSION },
        select: { type: true, accepted: true, revokedAt: true, status: true },
      }),
      prisma.clinicalProtocolRecord.findFirst({
        where: { patientId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        // Las notas clínicas del protocolo son internas. El portal solo
        // necesita la fase, el título y el diario que registra el paciente.
        select: {
          id: true,
          type: true,
          phase: true,
          title: true,
          symptomLogJson: true,
        },
      }),
    ])

    const hasAcceptedCurrentPolicies = Boolean(
      patientData?.consentAcceptedAt &&
      patientData.consentPolicyVersion === LEGAL_POLICY_VERSION &&
      REQUIRED_PORTAL_CONSENTS.every((requiredConsent) => consents.some((consent) => consent.type === requiredConsent.type && consent.accepted && consent.status === 'COMPLETED' && !consent.revokedAt))
    )
    if (!isAdminPreview && !hasAcceptedCurrentPolicies) {
      redirect('/paciente/politicas')
    }

    if (patientData?.firstName) {
      firstName = patientData.firstName
    }
    hasPendingAnamnesis = patientData?.anamnesisStatus === 'PENDING' || patientData?.anamnesisStatus === 'SENT'
    pendingConsentsCount = REQUIRED_PORTAL_CONSENTS.filter((requiredConsent) => !consents.some((consent) => consent.type === requiredConsent.type && consent.accepted && consent.status === 'COMPLETED' && !consent.revokedAt)).length
    lastAnthropometry = anthropometry
    activeMealPlan = mealPlan
    documentCount = docsCount
    nextAppointment = appointment
    // DTO mínimo: el componente de cliente no necesita el JSON de parámetros
    // clínicos ni el resto del registro. La fase real se guarda en `phase`.
    activeProtocol = protocol
      ? {
          id: protocol.id,
          type: protocol.type,
          currentPhase: protocol.phase,
          title: protocol.title,
          symptomLogJson: protocol.symptomLogJson,
        }
      : null

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

  const MEAL_LABELS: Record<string, string> = {
    BREAKFAST: 'Desayuno',
    MID_MORNING: 'Media Mañana',
    LUNCH: 'Comida',
    SNACK: 'Merienda',
    DINNER: 'Cena',
    LATE_SNACK: 'Recena',
  }

  const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const currentJsDay = new Date().getDay()
  const todayDayNumber = currentJsDay === 0 ? 7 : currentJsDay
  const todayDayName = DAY_NAMES[todayDayNumber - 1]

  const todayDayPlan = activeMealPlan?.days?.find((d: any) => d.dayNumber === todayDayNumber) || activeMealPlan?.days?.[0]
  const todayMeals = (todayDayPlan?.meals || []) as Array<{
    id: string
    mealType: string
    order: number
    items: Array<{
      id: string
      quantityG: number
      servings: number
      notes?: string | null
      food?: { name: string; servingUnit?: string } | null
      recipe?: { name: string } | null
    }>
  }>

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-7 sm:p-9 shadow-lg relative overflow-hidden border border-blue-900/40 animate-slide-up">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 -bottom-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-4 border border-white/10 shadow-2xs animate-float">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Eva Vidal Nutrición · Portal del Paciente</span>
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-white">
            ¡Hola, {firstName}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
            Bienvenido/a a tu espacio de salud. Aquí puedes consultar tu plan nutricional activo,
            revisar la evolución de tus medidas corporales, gestionar tus citas y responder a tus cuestionarios.
          </p>
        </div>
      </div>

      {/* AVISOS PENDIENTES DESTACADOS (PDF pág 2 y 13) */}
      {totalPendingAlerts > 0 && (
        <Card className="rounded-3xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-amber-50/60 to-white p-5 shadow-xs animate-scale-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-glow-blue">
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
              <Button className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-xs btn-tactile">
                <span>Revisar pendientes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Última Medición */}
        <Card className="glass-card hover-lift hover-glow-teal rounded-3xl border-slate-200/80 animate-slide-up stagger-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Última Medición
            </CardTitle>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 text-blue-700 flex items-center justify-center shadow-2xs">
              <Scale className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {lastAnthropometry ? (
              <div>
                <div className="text-2.5xl font-mono tabular-nums font-extrabold text-slate-900">
                  {lastAnthropometry.weightKg} <span className="text-sm font-semibold text-slate-500 font-sans">kg</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registrado el {formatDate(lastAnthropometry.date)}
                </p>
              </div>
            ) : (
              <div>
                <div className="text-base font-bold text-slate-700">Sin registros</div>
                <p className="text-xs text-slate-400 mt-1">Aún no hay mediciones publicadas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Plan Activo */}
        <Card className="glass-card hover-lift hover-glow-teal rounded-3xl border-slate-200/80 animate-slide-up stagger-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Plan Activo
            </CardTitle>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 text-blue-700 flex items-center justify-center shadow-2xs">
              <UtensilsCrossed className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {activeMealPlan ? (
              <div>
                <div className="text-base font-extrabold text-slate-900 truncate" title={activeMealPlan.name}>
                  {activeMealPlan.name}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] font-bold">
                    Activo
                  </Badge>
                  <span className="text-xs text-slate-500 truncate font-medium">
                    Desde {activeMealPlan.startDate ? new Date(activeMealPlan.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : 'reciente'}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-base font-bold text-slate-700">Sin plan activo</div>
                <p className="text-xs text-slate-400 mt-1">Pendiente de asignación</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Documentos Compartidos */}
        <Card className="glass-card hover-lift hover-glow-teal rounded-3xl border-slate-200/80 animate-slide-up stagger-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Documentos
            </CardTitle>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-100/60 text-purple-700 flex items-center justify-center shadow-2xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2.5xl font-mono tabular-nums font-extrabold text-slate-900">
              {documentCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {documentCount === 1 ? 'Archivo clínico disponible' : 'Archivos clínicos disponibles'}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Próxima Cita / Consulta */}
        <Card className="glass-card hover-lift hover-glow-teal rounded-3xl border-slate-200/80 animate-slide-up stagger-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Próxima Cita
            </CardTitle>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-700 flex items-center justify-center shadow-2xs">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div>
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {formatDateTime(nextAppointment.date)}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="warning" className="text-[10px] font-bold">
                    {nextAppointment.modality === 'ONLINE' ? 'Videollamada' : 'Presencial'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-slate-700">Sin citas agendadas</div>
                <p className="text-xs text-slate-400 mt-1">Pulsa en Mis Citas para solicitar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PROTOCOLO CLÍNICO ACTIVO Y DIARIO DE SÍNTOMAS (5.9) */}
      {activeProtocol && (
        <div className="animate-slide-up stagger-5">
          <PatientProtocolCard protocol={activeProtocol} />
        </div>
      )}

      {/* COMIDAS DE HOY (Requerimiento 3.2 Panel Paciente) */}
      <Card className="glass-card hover-lift rounded-3xl border-slate-200/80 shadow-xs overflow-hidden animate-slide-up stagger-6">
        <CardHeader className="bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white pb-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200/60 shadow-2xs">
                {todayDayName}
              </span>
              <CardTitle className="text-base font-extrabold text-slate-900">
                Comidas de Hoy
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5 text-slate-500 font-medium">
              {activeMealPlan
                ? `Pauta alimentaria activa: ${activeMealPlan.name}`
                : 'Pauta nutricional personalizada diseñada por Eva Vidal'}
            </CardDescription>
          </div>
          <Link href="/paciente/plan">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs gap-1.5 shrink-0 shadow-2xs"
            >
              <span>Ver plan semanal completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-5">
          {todayMeals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
              {todayMeals.map((meal) => {
                const label = MEAL_LABELS[meal.mealType] || meal.mealType
                return (
                  <div
                    key={meal.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-blue-200/90 hover:bg-white transition-all duration-150 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <span className="text-xs font-extrabold text-blue-950 block border-b border-slate-200/80 pb-1.5 mb-2.5">
                        {label}
                      </span>
                      <ul className="space-y-2">
                        {meal.items.map((it) => {
                          const img = it.food ? getFoodImage(it.food) : (it.recipe as any)?.imageUrl || FALLBACK_FOOD_SVG
                          return (
                            <li key={it.id} className="text-xs text-slate-700 leading-snug flex items-center gap-2">
                              <img
                                src={img || FALLBACK_FOOD_SVG}
                                alt=""
                                className="w-6 h-6 rounded-lg object-cover border border-slate-200 shrink-0"
                                loading="lazy"
                              />
                              <div className="min-w-0 flex-1">
                                {it.recipe ? (
                                  <span className="font-bold text-slate-900 block leading-snug line-clamp-3">
                                    <CookingPot className="h-4 w-4" /> {it.recipe.name}
                                  </span>
                                ) : it.food ? (
                                  <span className="block leading-snug">
                                    <strong className="text-slate-800">{it.food.name}</strong>{' '}
                                    <span className="text-slate-400 font-mono text-[10px] whitespace-nowrap">
                                      ({it.quantityG} {it.food.servingUnit || 'g'})
                                    </span>
                                  </span>
                                ) : (
                                  <span>Porción pautada</span>
                                )}
                                {it.notes && (
                                  <p className="text-[10px] text-slate-500 italic leading-snug line-clamp-2">{it.notes}</p>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2.5 text-slate-400 shadow-2xs">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-800 text-sm">Sin comidas pautadas específicamente para hoy</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {activeMealPlan
                  ? 'Consulta tu plan completo para revisar todas las opciones semanales.'
                  : 'Eva Vidal está preparando tu menú personalizado.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Navigation Sections - Todos los accesos del portal */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-slate-900">Módulos del Portal Clínico</h2>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Todo tu expediente al alcance de un toque</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Link to Plan */}
          <Link href="/paciente/plan" className="group block active:scale-[0.98] transition-transform">
            <Card className="h-full glass-card glass-card-hover rounded-3xl border-slate-200/80">
              <CardHeader>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-700 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center justify-between">
                  <span>Mi Plan Nutricional</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-700 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
                  Menús del día, recetas interactivas y lista de la compra.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Citas */}
          <Link href="/paciente/citas" className="group block active:scale-[0.98] transition-transform">
            <Card className="h-full glass-card glass-card-hover rounded-3xl border-slate-200/80">
              <CardHeader>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-700 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors flex items-center justify-between">
                  <span>Mis Citas</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-700 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
                  Solicita nuevas sesiones, consulta horarios y videollamadas.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Cuestionarios */}
          <Link href="/paciente/cuestionarios" className="group block active:scale-[0.98] transition-transform">
            <Card className="h-full glass-card glass-card-hover rounded-3xl border-slate-200/80">
              <CardHeader>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-700 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center justify-between">
                  <span>Cuestionarios & Firmas</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-700 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
                  Anamnesis pre-consulta y consentimientos informados.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Evolution */}
          <Link href="/paciente/evolucion" className="group block active:scale-[0.98] transition-transform">
            <Card className="h-full glass-card glass-card-hover rounded-3xl border-slate-200/80">
              <CardHeader>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/70 text-indigo-700 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  <span>Mi Evolución</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-700 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
                  Historial antropométrico y composición corporal clínica.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Documentos */}
          <Link href="/paciente/documentos" className="group block active:scale-[0.98] transition-transform">
            <Card className="h-full glass-card glass-card-hover rounded-3xl border-slate-200/80">
              <CardHeader>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/70 text-purple-700 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center justify-between">
                  <span>Mis Documentos</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-700 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
                  Informes clínicos, notas de consulta y analíticas compartidas.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Perfil */}
          <Link href="/paciente/perfil" className="group block active:scale-[0.98] transition-transform">
            <Card className="h-full glass-card glass-card-hover rounded-3xl border-slate-200/80">
              <CardHeader>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/70 text-slate-700 flex items-center justify-center mb-2 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-2xs">
                  <User className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors flex items-center justify-between">
                  <span>Mi Perfil</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-800 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
                  Ficha personal, datos de salud y alergias (modo consulta).
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Link to Configuración */}
          <Link href="/paciente/configuracion" className="group block active:scale-[0.98] transition-transform">
            <Card className="h-full glass-card glass-card-hover rounded-3xl border-slate-200/80">
              <CardHeader>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200/70 text-zinc-700 flex items-center justify-center mb-2 group-hover:bg-zinc-800 group-hover:text-white transition-all shadow-2xs">
                  <Settings className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-zinc-800 transition-colors flex items-center justify-between">
                  <span>Mi Cuenta</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-zinc-800 transition-all" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
                  Cambio de contraseña, descarga de datos y privacidad RGPD.
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
