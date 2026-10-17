import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatient } from '../actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddMeasurementForm } from './add-measurement-form'
import { DeletePatientButton } from './delete-button'
import { ImportExportSection } from './import-export'
import { BloodAnalysisCard } from './blood-analysis-card'
import { PatientContactTools } from './patient-contact-tools'
import { EvolutionChart } from './evolution-chart'
import { ClinicalProgressCard } from './clinical-progress-card'
import { PrivacyPanel } from './privacy-panel'
import { SoapConsultationPanel } from './soap-consultation-panel'
import { ConsentsDocumentsPanel } from './consents-documents-panel'
import { HardDeleteModal } from './hard-delete-modal'
import { checkDrugInteractions } from '@/lib/nutrition/drug-interactions'
import {
  ArrowLeft,
  User,
  HeartPulse,
  Scale,
  Calendar,
  AlertTriangle,
  History,
  FileText,
  Activity,
  CalendarPlus,
  ShieldAlert,
  Pill,
  Sparkles,
  Eye,
  Mail,
  CheckCircle2,
} from 'lucide-react'
import {
  OBJECTIVE_LABELS,
  ACTIVITY_LEVEL_LABELS,
  parseCommaSeparated,
  type Objective,
  type ActivityLevel,
} from '@/types'
import { calculateBMI, calculateIdealWeight } from '@/lib/nutrition'

import { EditPatientModal } from './edit-patient-modal'
import { PortalAccessCard } from './portal-access-card'
import { AnthropometryTable } from './anthropometry-table'
import { startPatientPreview } from '../preview-actions'
import { PatientHeaderAlerts } from './patient-header-alerts'
import { ClinicalScreeningsCard } from './clinical-screenings-card'
import { ProgressPhotosCard } from './progress-photos-card'
import { ClinicalTimeline, type TimelineEvent } from './clinical-timeline'
import { PatientClinicalProtocolsCard } from './patient-clinical-protocols-card'
import { PatientTabsView, type TabKey } from './patient-tabs-view'
import { PatientQuestionnaireReviewCard } from './patient-questionnaire-review-card'

export const dynamic = 'force-dynamic'

interface PatientDetailPageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ tab?: string }>
}

export default async function PatientDetailPage({ params, searchParams }: PatientDetailPageProps) {
  const { id } = await params
  const { tab } = (await searchParams) || {}
  const patient = await getPatient(id)

  if (!patient) {
    notFound()
  }

  // Calculate age from birthDate
  const today = new Date()
  const birthDate = new Date(patient.birthDate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  const latestMeasurement = patient.anthropometries[0]
  const allergiesList = parseCommaSeparated(patient.allergies)
  const intolerancesList = parseCommaSeparated(patient.intolerances)
  const preferencesList = parseCommaSeparated(patient.dietaryPreferences)

  // Clinical calculation for latest measurements
  const bmiData = latestMeasurement
    ? calculateBMI(latestMeasurement.weightKg, patient.heightCm)
    : null

  const idealWeightData = calculateIdealWeight(
    patient.heightCm,
    patient.sex.toLowerCase() as 'male' | 'female'
  )

  const objectiveLabel = OBJECTIVE_LABELS[patient.objective as Objective] || patient.objective
  const activityLabel = ACTIVITY_LEVEL_LABELS[patient.activityLevel as ActivityLevel] || patient.activityLevel

  // Check clinical drug-nutrient interactions
  const drugAlerts = checkDrugInteractions(patient.currentMedications, patient.medicalHistory)

  // Unified Clinical Timeline events (5.2)
  const timelineEvents: TimelineEvent[] = []

  // 1. Creation event
  timelineEvents.push({
    id: `creation-${patient.id}`,
    date: patient.createdAt,
    type: 'CONSULTATION',
    title: 'Apertura de Expediente Clínico',
    description: `Alta de expediente en consulta por Eva Vidal. Objetivo fijado: ${objectiveLabel}.`,
  })

  // 2. Anthropometry measurements
  patient.anthropometries.forEach((m) => {
    timelineEvents.push({
      id: `anthro-${m.id}`,
      date: m.date,
      type: 'ANTHROPOMETRY',
      title: `Control Antropométrico: ${m.weightKg} kg`,
      description: `IMC: ${(m.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1)} kg/m²` +
        (m.bodyFatPct ? ` • Grasa: ${m.bodyFatPct}%` : '') +
        (m.muscleMassKg ? ` • M. Muscular: ${m.muscleMassKg} kg` : '') +
        (m.waistCm ? ` • Cintura: ${m.waistCm} cm` : ''),
    })
  })

  // 3. Appointments
  ;(patient as any).appointments?.forEach((app: any) => {
    timelineEvents.push({
      id: `app-${app.id}`,
      date: app.date,
      type: 'CONSULTATION',
      title: `Consulta ${app.appointmentType || 'REVISION'}: ${app.modality === 'ONLINE' ? 'Videollamada' : 'Presencial'}`,
      description: `${app.notes || 'Consulta programada'} (${app.durationMin} min). Estado: ${app.status}`,
    })
  })

  // 4. Clinical consultations (SOAP notes)
  ;(patient as any).consultations?.forEach((c: any) => {
    timelineEvents.push({
      id: `consult-${c.id}`,
      date: c.date,
      type: 'CONSULTATION',
      title: `Consulta Clínica ${c.type || 'SEGUIMIENTO'}`,
      description: c.plan || c.assessment || c.subjective || 'Notas evolutivas registradas en protocolo SOAP.',
    })
  })

  // 5. Blood analysis
  ;(patient as any).bloodAnalyses?.forEach((b: any) => {
    timelineEvents.push({
      id: `blood-${b.id}`,
      date: b.date,
      type: 'BLOOD_ANALYSIS',
      title: `Analítica de Sangre: ${b.laboratory || 'Laboratorio Clínico'}`,
      description: b.notes || 'Registro de biomarcadores sanguíneos y perfil bioquímico.',
    })
  })

  // 6. Clinical protocols
  ;(patient as any).clinicalProtocols?.forEach((p: any) => {
    timelineEvents.push({
      id: `protocol-${p.id}`,
      date: p.startDate,
      type: 'PROTOCOL',
      title: `Protocolo Clínico Asignado: ${p.type}`,
      description: `Pauta clínica activa: ${p.type}. Estado: ${p.status}`,
    })
  })

  // Sort chronological descending
  timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      {/* Top navigation row */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al listado de pacientes</span>
        </Link>
      </div>

      {!patient.isActive && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-200 text-amber-900 rounded-2xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Expediente en la Papelera</p>
              <p className="text-xs text-amber-800">
                Esta ficha está archivada. No aparece en el directorio activo de pacientes, pero toda su información se conserva íntegra.
              </p>
            </div>
          </div>
          <DeletePatientButton
            patientId={patient.id}
            patientName={`${patient.firstName} ${patient.lastName}`}
            isActive={false}
          />
        </div>
      )}

      {/* Header Profile Hero con Botones de Acción (Icono + Color entre Contacto y Objetivo) */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl font-bold border-2 border-blue-200 shadow-xs shrink-0">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {patient.firstName} {patient.lastName}
              </h1>
              {patient.isActive ? (
                <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 rounded-full font-bold">
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full">Inactivo</Badge>
              )}

              {/* Protocol Badges */}
              {patient.isGLP1Treatment && (
                <Badge variant="outline" className="bg-amber-100/80 text-amber-900 border-amber-300 rounded-full font-bold flex items-center gap-1">
                  <Pill className="h-3 w-3 text-amber-700" />
                  <span>Tratamiento GLP-1</span>
                </Badge>
              )}

              {patient.isTCAProtocol && (
                <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-700" />
                  <span>Protocolo TCA</span>
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>{patient.sex === 'MALE' ? 'Hombre' : 'Mujer'} • {age} años • {patient.heightCm} cm</span>
              {patient.phone && <span>• Tel: {patient.phone}</span>}
              {patient.email && <span>• {patient.email}</span>}
            </p>
          </div>
        </div>

        {/* Botones de acción: Solo Icono + Color (entre Contacto y Objetivo) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-2xs shrink-0">
          <EditPatientModal patient={patient} iconOnly />
          <Link href={`/dashboard/appointments?patientId=${patient.id}`} title="Agendar Cita" aria-label="Agendar Cita">
            <Button
              variant="outline"
              size="sm"
              className="w-9 h-9 p-0 rounded-xl border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold shadow-2xs flex items-center justify-center transition-all active:scale-[0.96] shrink-0"
            >
              <Calendar className="h-4 w-4 text-sky-600" />
            </Button>
          </Link>
          <Link href={`/dashboard/plans/new?patientId=${patient.id}`} title="Crear Plan Nutricional" aria-label="Crear Plan Nutricional">
            <Button
              variant="outline"
              size="sm"
              className="w-9 h-9 p-0 rounded-xl border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold shadow-2xs flex items-center justify-center transition-all active:scale-[0.96] shrink-0"
            >
              <CalendarPlus className="h-4 w-4 text-blue-600" />
            </Button>
          </Link>
          <form action={startPatientPreview.bind(null, patient.id)} title="Vista previa como paciente">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              aria-label="Vista previa como paciente"
              className="w-9 h-9 p-0 rounded-xl border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 font-bold shadow-2xs flex items-center justify-center transition-all active:scale-[0.96] shrink-0 cursor-pointer"
            >
              <Eye className="h-4 w-4 text-purple-600" />
            </Button>
          </form>
          <DeletePatientButton
            patientId={patient.id}
            patientName={`${patient.firstName} ${patient.lastName}`}
            isActive={patient.isActive}
            iconOnly
          />
          <HardDeleteModal
            patientId={patient.id}
            patientName={`${patient.firstName} ${patient.lastName}`}
            iconOnly
          />
        </div>

        {/* Bloque Objetivo Clínico */}
        <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
          <Badge variant="outline" className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200 rounded-xl font-semibold">
            🎯 {objectiveLabel}
          </Badge>
          <Badge variant="outline" className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border-amber-200 rounded-xl font-semibold">
            ⚡ {activityLabel}
          </Badge>
        </div>
      </div>

      {/* Cabecera Clínica: Avisos, Objetivos con Ritmo Semanal, Hitos, Etiquetas Privadas y Estados Cuestionario/Firma */}
      <PatientHeaderAlerts
        patient={{
          ...patient,
          latestQuestionnaireId: patient.patientQuestionnaires?.[0]?.id || null,
          questionnaireStatus: patient.patientQuestionnaires?.[0]?.status || patient.questionnaireDeliveryStatus || 'NOT_SENT',
          consentStatus: patient.consents?.[0]?.accepted ? 'COMPLETED' : (patient.consents?.[0]?.status || patient.consentDeliveryStatus || 'NOT_SENT'),
          pendingReviewFieldsCount: patient.pendingReviewFieldsCount || patient.patientQuestionnaires?.[0]?.pendingFieldsCount || 0,
        } as any}
        drugAlertsCount={drugAlerts.length}
      />

      {/* Sistema de Pestañas Clínicas Organizadas */}
      <PatientTabsView
        initialTab={(tab as TabKey) || 'resumen'}
        pendingReviewCount={patient.pendingReviewFieldsCount || patient.patientQuestionnaires?.[0]?.pendingFieldsCount || 0}
        resumenContent={
          <>
            {/* Alertas Clínicas Fármaco-Nutriente */}
            {drugAlerts.length > 0 && (
              <Card className="rounded-3xl border-rose-200 bg-gradient-to-r from-rose-50/70 via-white to-white overflow-hidden shadow-sm">
                <CardHeader className="pb-3 border-b border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-rose-950 flex items-center gap-2">
                        <span>Alertas Clínicas Fármaco-Alimento Detectadas</span>
                        <Badge className="bg-rose-600 text-white border-0 text-2xs font-black rounded-full">
                          {drugAlerts.length} {drugAlerts.length === 1 ? 'ALERTA' : 'ALERTAS'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs text-rose-800/80">
                        Compatibilidad analizada según la medicación habitual registrada: <strong>{patient.currentMedications}</strong>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {drugAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-2xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-full">
                            {alert.drugName}
                          </span>
                          <span className="text-2xs text-gray-500 font-medium">({alert.drugCategory})</span>
                        </div>
                        <Badge variant="outline" className="text-3xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 border-rose-300 rounded-full">
                          Prioridad {alert.severity}
                        </Badge>
                      </div>

                      <h4 className="text-xs font-bold text-gray-900">{alert.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{alert.mechanism}</p>

                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                        <span className="font-bold block text-2xs uppercase tracking-wide text-amber-900 mb-0.5">
                          Recomendación Dietética Clínica:
                        </span>
                        <span>{alert.clinicalRecommendation}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-2xs text-gray-500 pt-1">
                        <span className="font-semibold text-gray-700">Alimentos / Factores implicados:</span>
                        {alert.affectedFoods.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Grid: 3 summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Último Estado Antropométrico */}
              <Card className="rounded-3xl border-t-4 border-t-blue-600 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-600" />
                    <span>Último Estado Antropométrico</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestMeasurement ? (
                    <>
                      <div className="flex items-baseline justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">Peso actual</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-gray-900">{latestMeasurement.weightKg}</span>
                          <span className="text-sm text-gray-500 ml-1">kg</span>
                        </div>
                      </div>

                      {bmiData && (
                        <div className="border-b pb-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm text-gray-500">IMC (Índice Masa Corporal)</span>
                            <span className="text-lg font-bold text-gray-900">{bmiData.bmi}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400">Rango OMS: 18.5 - 24.9</span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                bmiData.category === 'Normal'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : bmiData.category === 'Bajo peso'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {bmiData.category}
                            </span>
                          </div>
                        </div>
                      )}

                      {latestMeasurement.bodyFatPct && (
                        <div className="flex items-baseline justify-between border-b pb-2">
                          <span className="text-sm text-gray-500">% Grasa corporal</span>
                          <span className="text-lg font-semibold text-gray-900">{latestMeasurement.bodyFatPct}%</span>
                        </div>
                      )}

                      {latestMeasurement.muscleMassKg && (
                        <div className="flex items-baseline justify-between border-b pb-2">
                          <span className="text-sm text-gray-500">Masa muscular</span>
                          <span className="text-lg font-semibold text-gray-900">{latestMeasurement.muscleMassKg} kg</span>
                        </div>
                      )}

                      {latestMeasurement.waistCm && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-gray-500">Perímetro cintura</span>
                          <span className="text-lg font-semibold text-gray-900">{latestMeasurement.waistCm} cm</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-6 text-center text-gray-400 text-sm">
                      <p>Sin mediciones registradas aún.</p>
                      <p className="text-xs mt-1">Añade la primera medición en la pestaña Evolución.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Peso Ideal y Fórmulas Clínicas */}
              <Card className="rounded-3xl border-t-4 border-t-emerald-600 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-emerald-600" />
                    <span>Peso Ideal Teórico</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                    <span className="text-xs text-emerald-700 font-medium block">Rango de Peso Saludable (IMC 18.5 - 24.9)</span>
                    <span className="text-lg font-bold text-emerald-900">
                      {(18.5 * Math.pow(patient.heightCm / 100, 2)).toFixed(1)} - {(24.9 * Math.pow(patient.heightCm / 100, 2)).toFixed(1)} kg
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b pb-2 pt-1">
                    <span className="text-sm text-gray-500">Fórmula Lorentz</span>
                    <span className="font-semibold text-gray-900">{idealWeightData.lorentz} kg</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-gray-500">Fórmula Devine</span>
                    <span className="font-semibold text-gray-900">{idealWeightData.devine} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Fórmula Robinson</span>
                    <span className="font-semibold text-gray-900">{idealWeightData.robinson} kg</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Contacto y Alertas Clínicas */}
              <Card className="rounded-3xl border-t-4 border-t-amber-500 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Seguridad Alimentaria y Alérgenos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {/* 1. Alergias */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Alergias</span>
                      {allergiesList.length > 0 && (
                        <span className="text-3xs font-extrabold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full">
                          🛡️ Exclusión activa (UE 1169/2011)
                        </span>
                      )}
                    </div>
                    {allergiesList.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {allergiesList.map((a, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200 shadow-2xs">
                            🚨 {a}
                          </span>
                        ))}
                      </div>
                    ) : patient.allergiesStatus === 'NINGUNA_CONOCIDA' ? (
                      <p className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>✓ Ninguna conocida (confirmado)</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-800 font-semibold mt-1 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        <span>⚠️ No consta (pendiente de preguntar)</span>
                      </p>
                    )}
                  </div>

                  {/* 2. Intolerancias */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Intolerancias</span>
                      {intolerancesList.length > 0 && (
                        <span className="text-3xs font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          ⚠️ Control de tolerancia activo
                        </span>
                      )}
                    </div>
                    {intolerancesList.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {intolerancesList.map((item, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 shadow-2xs">
                            ⚠️ {item}
                          </span>
                        ))}
                      </div>
                    ) : patient.intolerancesStatus === 'NINGUNA_CONOCIDA' ? (
                      <p className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>✓ Ninguna conocida (confirmado)</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-800 font-semibold mt-1 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        <span>⚠️ No consta (pendiente de preguntar)</span>
                      </p>
                    )}
                  </div>

                  {/* 3. Medicación Habitual */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase">Medicación Habitual</span>
                    {patient.currentMedications && patient.currentMedications.trim().length > 0 ? (
                      <p className="text-xs text-gray-900 font-bold mt-1 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                        {patient.currentMedications}
                      </p>
                    ) : patient.medicationsStatus === 'NINGUNA_CONOCIDA' ? (
                      <p className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>✓ Ninguna conocida (confirmado)</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-800 font-semibold mt-1 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        <span>⚠️ No consta (pendiente de preguntar)</span>
                      </p>
                    )}
                  </div>

                  {/* 4. Patologías y Antecedentes */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase">Antecedentes Médicos</span>
                    {patient.medicalHistory && patient.medicalHistory.trim().length > 0 ? (
                      <p className="text-xs text-gray-900 font-medium mt-1 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                        {patient.medicalHistory}
                      </p>
                    ) : patient.pathologiesStatus === 'NINGUNA_CONOCIDA' ? (
                      <p className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>✓ Ninguno conocido (confirmado)</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-800 font-semibold mt-1 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        <span>⚠️ No consta (pendiente de preguntar)</span>
                      </p>
                    )}
                  </div>

                  {/* 5. Preferencia Dietética */}
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase">Preferencia Dietética</span>
                    <p className="text-xs text-gray-700 mt-0.5 font-medium">
                      {preferencesList.length > 0 ? preferencesList.join(', ') : 'Omnívora'}
                    </p>
                  </div>

                  {/* 6. Salud Femenina */}
                  {patient.sex === 'FEMALE' && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <span>Embarazo: <strong>{patient.pregnant ? 'Sí' : 'No'}</strong></span>
                      <span>Lactancia: <strong>{patient.breastfeeding ? 'Sí' : 'No'}</strong></span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Control de Acceso al Portal del Paciente (EVSoftware · Paciente) */}
            <PortalAccessCard
              patientId={patient.id}
              patientEmail={patient.email}
              portalAccessEnabled={patient.portalAccessEnabled}
              portalLastLoginAt={patient.portalLastLoginAt}
              portalUser={(patient as any).portalUser}
            />

            {/* Envío de Cuestionario Anamnesis por Correo Electrónico y Revisión de Respuestas */}
            <PatientContactTools
              patient={{
                id: patient.id,
                name: `${patient.firstName} ${patient.lastName}`,
                email: patient.email,
                professionalEmail: (patient as any).user?.email,
                professionalName: (patient as any).user?.name,
                anamnesisStatus: (patient as any).anamnesisStatus,
                anamnesisSentAt: (patient as any).anamnesisSentAt,
                anamnesisCompletedAt: (patient as any).anamnesisCompletedAt,
                anamnesisSubmissions: (patient as any).anamnesisSubmissions || [],
              }}
            />

            {/* Notas Clínicas del Paciente */}
            {patient.notes && (
              <Card className="rounded-3xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Notas de Consulta y Antecedentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{patient.notes}</p>
                </CardContent>
              </Card>
            )}
          </>
        }
        cuestionarioContent={
          <PatientQuestionnaireReviewCard patient={patient as any} />
        }
        evolucionContent={
          <>
            {/* Gráfica de Evolución y Composición en Kilos (5.2) */}
            <EvolutionChart
              measurements={patient.anthropometries}
              targetWeightKg={patient.targetWeightKg}
              weeklyChangeTargetKg={patient.weeklyChangeTargetKg}
            />

            {/* Historial Antropométrico y Botón Nueva Medición con Formulario de Seguimiento */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    <span>Evolución Antropométrica</span>
                  </h2>
                  <p className="text-sm text-gray-500">
                    Registro histórico de pesos, pliegues cutáneos y perímetros corporales
                  </p>
                </div>
                <AddMeasurementForm
                  patientId={patient.id}
                  previousMeasurement={patient.anthropometries[0]}
                  firstMeasurement={patient.anthropometries[patient.anthropometries.length - 1]}
                  patientObjective={patient.objective}
                  patientHeightCm={patient.heightCm}
                />
              </div>

              <AnthropometryTable patientId={patient.id} measurements={patient.anthropometries} />
            </div>

            {/* Fotografías de Evolución Antes y Después (5.2) */}
            <ProgressPhotosCard
              patientId={patient.id}
              photos={(patient as any).photos || []}
            />

            <ClinicalProgressCard patientId={patient.id} checkIns={patient.clinicalCheckIns} />
          </>
        }
        clinicaContent={
          <>
            {/* Protocolos Clínicos Especializados y Evaluación Energética (5.9 / 5.10) */}
            <PatientClinicalProtocolsCard
              patientId={patient.id}
              patientName={`${patient.firstName} ${patient.lastName}`}
              protocols={(patient as any).clinicalProtocols || []}
              calculatorResults={(patient as any).calculatorResults || []}
            />

            {/* Notas de Consulta SOAP (Subjetivo, Objetivo, Análisis, Plan) */}
            <SoapConsultationPanel patientId={patient.id} consultations={(patient as any).consultations || []} />

            {/* Cuestionarios y Cribados Clínicos Estandarizados (5.3) */}
            <ClinicalScreeningsCard
              patientId={patient.id}
              isPregnant={patient.pregnant}
              pregestationalBmi={bmiData?.bmi}
              latestWeight={latestMeasurement?.weightKg}
              screenings={(patient as any).screenings || []}
            />

            {/* Ficha de Analíticas Sanguíneas y Biomarcadores (Semáforo Clínico e Índices 5.3) */}
            <BloodAnalysisCard
              patientId={patient.id}
              records={(patient as any).bloodAnalyses || []}
              patientAge={age}
            />
          </>
        }
        citasLegalContent={
          <>
            {/* Citas y Sesiones del Paciente con Google Calendar */}
            {(patient as any).appointments && (patient as any).appointments.length > 0 ? (
              <Card className="rounded-3xl border-blue-200 overflow-hidden shadow-xs">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-white border-b border-gray-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>Citas Programadas y Revisiones ({((patient as any).appointments).length})</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Sesiones con integración de Google Calendar y confirmación por correo electrónico
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/appointments">
                    <Button size="sm" variant="outline" className="rounded-2xl text-xs font-bold hover:bg-blue-50 hover:text-blue-800">
                      Gestionar en Agenda →
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {((patient as any).appointments).map((app: any) => {
                    const d = new Date(app.date)
                    return (
                      <div key={app.id} className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-blue-950 bg-blue-100/70 px-2.5 py-1 rounded-xl">
                            {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} — {d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h
                          </span>
                          <span className="font-semibold text-gray-700">
                            {app.modality === 'ONLINE' ? '💻 Online (Videollamada)' : '🏥 Presencial en Consulta'} ({app.durationMin} min)
                          </span>
                          {app.notes && <span className="text-gray-500 italic truncate max-w-sm">"{app.notes}"</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {app.emailSent && <span className="text-[11px] text-blue-700 font-bold">✓ Correo enviado</span>}
                          {app.reminderSent && <span className="text-[11px] text-indigo-700 font-bold">🔔 Recordatorio 24h</span>}
                          <Badge variant="outline" className="text-2xs font-bold rounded-full bg-white">{app.status}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-3xl border border-slate-200 p-8 text-center bg-white shadow-xs">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No hay citas programadas actualmente</p>
                <Link href="/dashboard/appointments" className="mt-3 inline-block">
                  <Button size="sm" className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                    Programar Cita en Agenda →
                  </Button>
                </Link>
              </Card>
            )}

            {/* Línea de Tiempo Clínica Unificada (5.2) */}
            <ClinicalTimeline events={timelineEvents} />

            {/* Consentimientos Informados y Documentos del Paciente */}
            <ConsentsDocumentsPanel
              patientId={patient.id}
              consents={((patient as any).consents || []).map((c: any) => ({
                id: c.id,
                type: c.type,
                title: c.title,
                version: c.version || '1.0',
                accepted: c.accepted,
                acceptedAt: c.acceptedAt,
                signatureData: c.signatureData,
                revokedAt: c.revokedAt,
              }))}
              documents={((patient as any).documents || []).map((d: any) => ({
                id: d.id,
                title: d.title,
                category: d.category,
                fileUrl: d.fileUrl,
                fileName: d.fileName,
                isSharedWithPatient: d.isSharedWithPatient,
                notes: d.notes,
                uploadedAt: d.uploadedAt,
              }))}
            />

            <PrivacyPanel
              patientId={patient.id}
              consentAcceptedAt={patient.consentAcceptedAt}
              consentPolicyVersion={patient.consentPolicyVersion}
              consentRevokedAt={patient.consentRevokedAt}
              requests={(patient as any).dataRequests || []}
            />

            {/* Importación y Exportación de Datos de Báscula (SECA, Tanita, InBody) */}
            <ImportExportSection
              patientId={patient.id}
              patientName={`${patient.firstName} ${patient.lastName}`}
            />

            {/* Registro de Comunicaciones y Correos Transaccionales al Paciente */}
            <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/40 to-white border-b border-gray-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900">
                      Comunicaciones y Correos Enviados ({((patient as any).emailLogs || []).length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Historial de avisos transaccionales, citas y cuestionarios entregados a {patient.email || 'este paciente'}
                    </CardDescription>
                  </div>
                </div>
                <Link href="/dashboard/emails">
                  <Button size="sm" variant="outline" className="rounded-2xl text-xs font-bold hover:bg-blue-50 hover:text-blue-800">
                    Enviar Nuevo Correo →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                {((patient as any).emailLogs || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-3 text-center">
                    No se han registrado correos transaccionales directos para este paciente aún.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {((patient as any).emailLogs || []).map((log: any) => (
                      <div key={log.id} className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold ${
                            log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status === 'SENT' ? '✓ Enviado' : '✗ Fallido'}
                          </span>
                          <span className="font-bold text-gray-900">{log.subject}</span>
                          <span className="text-2xs text-gray-500 font-mono">({log.type})</span>
                        </div>
                        <span className="text-2xs text-gray-500 whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        }
      />
    </div>
  )
}
