import Link from 'next/link'
import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  HeartPulse,
  Scale,
  Sparkles,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { OBJECTIVE_LABELS, ACTIVITY_LEVEL_LABELS, parseCommaSeparated, type Objective, type ActivityLevel } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PacientePerfilPage() {
  const { user, patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({ select: { id: true } })
    patientId = firstPatient?.id || null
  }

  const patient = patientId
    ? await prisma.patient.findUnique({
        where: { id: patientId },
      })
    : null

  if (!patient) {
    return (
      <div className="space-y-6">
        <Link href="/paciente" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
        <Card className="p-8 text-center bg-white rounded-3xl border border-gray-200">
          <p className="text-sm text-gray-500">No se pudo cargar la información del perfil.</p>
        </Card>
      </div>
    )
  }

  // Calculate age
  const today = new Date()
  const birthDate = new Date(patient.birthDate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  const allergiesList = parseCommaSeparated(patient.allergies)
  const intolerancesList = parseCommaSeparated(patient.intolerances)
  const preferencesList = parseCommaSeparated(patient.dietaryPreferences)

  const objectiveLabel = OBJECTIVE_LABELS[patient.objective as Objective] || patient.objective
  const activityLabel = ACTIVITY_LEVEL_LABELS[patient.activityLevel as ActivityLevel] || patient.activityLevel

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/paciente"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Header Profile Hero */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-800 flex items-center justify-center text-xl font-bold border border-teal-200/80 shadow-2xs shrink-0">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              <Badge variant="teal" className="text-2xs font-bold">
                Modo Consulta (Solo Lectura)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ficha personal de salud en EVSoftware · Paciente
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs px-3.5 py-1.5 bg-slate-50 text-slate-700 border-slate-200 rounded-full font-semibold">
            🎯 {objectiveLabel}
          </Badge>
          <Badge variant="outline" className="text-xs px-3.5 py-1.5 bg-teal-50 text-teal-800 border-teal-200 rounded-full font-semibold">
            ⚡ {activityLabel}
          </Badge>
        </div>
      </div>

      {/* Grid de Información Personal y Clínica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Datos Personales */}
        <Card className="rounded-3xl border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>Datos Personales</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Nombre completo</span>
              <span className="font-semibold text-slate-900">{patient.firstName} {patient.lastName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Correo electrónico</span>
              <span className="font-semibold text-slate-900">{patient.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Teléfono</span>
              <span className="font-semibold text-slate-900">{patient.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Edad y fecha de nacimiento</span>
              <span className="font-semibold text-slate-900">
                {age} años ({birthDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Sexo</span>
              <span className="font-semibold text-slate-900">{patient.sex === 'MALE' ? 'Hombre' : 'Mujer'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Estatura</span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums">{patient.heightCm} cm</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Seguridad Alimentaria y Hábitos */}
        <Card className="rounded-3xl border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alergias y Preferencias Registradas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs">
            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                Alergias Alimentarias
              </span>
              {allergiesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {allergiesList.map((a, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-2xs font-bold border border-rose-200">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 mt-1">Ninguna conocida</p>
              )}
            </div>

            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                Intolerancias
              </span>
              {intolerancesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {intolerancesList.map((item, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-2xs font-bold border border-amber-200">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 mt-1">Ninguna conocida</p>
              )}
            </div>

            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                Preferencia de Alimentación
              </span>
              <p className="text-slate-800 font-semibold mt-1">
                {preferencesList.length > 0 ? preferencesList.join(', ') : 'Omnívora'}
              </p>
            </div>

            {patient.foodAversions && (
              <div>
                <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                  Alimentos no deseados (Aversiones)
                </span>
                <p className="text-slate-600 mt-1 italic">
                  {patient.foodAversions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nota de confidencialidad */}
      <Card className="rounded-3xl bg-teal-50/50 border-teal-100/80 p-5 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-950 leading-relaxed">
            <span className="font-bold block mb-0.5">Expediente Clínico Custodiado</span>
            Tus datos de salud están amparados por el deber de secreto profesional médico-dietético. Para modificar cualquier dato clínico o corregir información personal, coméntalo con Eva Vidal en tu próxima consulta o envía una solicitud desde la sección de configuración.
          </div>
        </div>
      </Card>
    </div>
  )
}
