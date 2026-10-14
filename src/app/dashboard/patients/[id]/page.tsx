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

export const dynamic = 'force-dynamic'

interface PatientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al directorio</span>
        </Link>
        <div className="flex items-center gap-3">
          <EditPatientModal patient={patient} />
          <Link href="/dashboard/appointments">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 rounded-2xl border-gray-300 bg-white text-gray-800 hover:bg-blue-50 hover:text-blue-900 font-bold">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Agendar Cita</span>
            </Button>
          </Link>
          <Link href={`/dashboard/plans/new?patientId=${patient.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 rounded-2xl border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold">
              <CalendarPlus className="h-4 w-4 text-blue-600" />
              <span>Crear Plan Nutricional</span>
            </Button>
          </Link>
          <DeletePatientButton patientId={patient.id} patientName={`${patient.firstName} ${patient.lastName}`} />
          <HardDeleteModal patientId={patient.id} patientName={`${patient.firstName} ${patient.lastName}`} />
        </div>
      </div>

      {/* Header Profile Hero */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl font-bold border-2 border-blue-200 shadow-xs">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
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
                  <span>Tratamiento GLP-1 (Ozempic/Wegovy)</span>
                </Badge>
              )}

              {patient.isTCAProtocol && (
                <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-700" />
                  <span>Protocolo TCA (Sin Números)</span>
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {patient.sex === 'MALE' ? 'Hombre' : 'Mujer'} • {age} años • {patient.heightCm} cm de estatura
              {patient.phone ? ` • Tel: ${patient.phone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <Badge variant="outline" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 rounded-full font-semibold">
            🎯 {objectiveLabel}
          </Badge>
          <Badge variant="outline" className="text-xs px-3 py-1 bg-amber-50 text-amber-700 border-amber-200 rounded-full font-semibold">
            ⚡ {activityLabel}
          </Badge>
        </div>
      </div>

      {/* Alertas Clínicas Fármaco-Nutriente (Estilo Gajuz / DietoPRO) */}
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

      {/* Citas y Sesiones del Paciente con Google Calendar */}
      {(patient as any).appointments && (patient as any).appointments.length > 0 && (
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
      )}

      {/* Grid: 3 summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Último Estado Antropométrico */}
        <Card className="rounded-3xl border-t-4 border-t-blue-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-600" />
              <span>Composición Actual</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestMeasurement ? (
              <>
                <div className="flex items-baseline justify-between border-b pb-2">
                  <span className="text-sm text-gray-500">Peso actual</span>
                  <span className="text-2xl font-bold text-gray-900">{latestMeasurement.weightKg} kg</span>
                </div>
                {bmiData && (
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-gray-500">IMC (WHO)</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{bmiData.bmi}</span>
                      <span className="text-xs block text-gray-500">({bmiData.category})</span>
                    </div>
                  </div>
                )}
                {latestMeasurement.bodyFatPct && (
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-gray-500">Grasa corporal</span>
                    <span className="font-semibold text-gray-900">{latestMeasurement.bodyFatPct}%</span>
                  </div>
                )}
                {latestMeasurement.waistCm && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Cintura</span>
                    <span className="font-semibold text-gray-900">{latestMeasurement.waistCm} cm</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">Sin mediciones registradas</p>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Rangos Ideales y Estimaciones */}
        <Card className="rounded-3xl border-t-4 border-t-blue-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>Referencias Clínicas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
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

        {/* Card 3: Contacto y Alertas Alimentarias */}
        <Card className="rounded-3xl border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Seguridad Alimentaria</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Alergias</span>
              {allergiesList.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {allergiesList.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">Ninguna declarada</p>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Intolerancias</span>
              {intolerancesList.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {intolerancesList.map((item, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">Ninguna declarada</p>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Preferencia</span>
              <p className="text-xs text-gray-700 mt-0.5 font-medium">
                {preferencesList.length > 0 ? preferencesList.join(', ') : 'Omnívora'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ficha de Analíticas Sanguíneas y Biomarcadores (Semáforo Clínico) */}
      <BloodAnalysisCard
        patientId={patient.id}
        records={(patient as any).bloodAnalyses || []}
      />

      <EvolutionChart measurements={patient.anthropometries} />

      <ClinicalProgressCard patientId={patient.id} checkIns={patient.clinicalCheckIns} />

      {/* Notas de Consulta SOAP (Subjetivo, Objetivo, Análisis, Plan) */}
      <SoapConsultationPanel patientId={patient.id} consultations={(patient as any).consultations || []} />

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

      {/* Historial Antropométrico y Botón Nueva Medición */}
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
          <AddMeasurementForm patientId={patient.id} />
        </div>

        <Card className="rounded-3xl overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {patient.anthropometries.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">
                Aún no hay mediciones registradas para este paciente.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3 text-right">Peso</th>
                      <th className="px-5 py-3 text-right">% Grasa</th>
                      <th className="px-5 py-3 text-right">Masa Muscular</th>
                      <th className="px-5 py-3 text-right">Cintura</th>
                      <th className="px-5 py-3 text-right">Cadera</th>
                      <th className="px-5 py-3">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patient.anthropometries.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/70">
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {new Date(m.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{m.weightKg} kg</td>
                        <td className="px-5 py-3.5 text-right">{m.bodyFatPct ? `${m.bodyFatPct}%` : '-'}</td>
                        <td className="px-5 py-3.5 text-right">{m.muscleMassKg ? `${m.muscleMassKg} kg` : '-'}</td>
                        <td className="px-5 py-3.5 text-right">{m.waistCm ? `${m.waistCm} cm` : '-'}</td>
                        <td className="px-5 py-3.5 text-right">{m.hipCm ? `${m.hipCm} cm` : '-'}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">{m.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Importación y Exportación de Datos de Báscula (SECA, Tanita, InBody) */}
      <ImportExportSection
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
      />

      <PrivacyPanel
        patientId={patient.id}
        consentAcceptedAt={patient.consentAcceptedAt}
        consentPolicyVersion={patient.consentPolicyVersion}
        consentRevokedAt={patient.consentRevokedAt}
        requests={(patient as any).dataRequests || []}
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
    </div>
  )
}
