import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPatient } from '../../../actions'
import { PrintButton } from './print-button'

export const dynamic = 'force-dynamic'

interface InformePrimariaPageProps {
  params: Promise<{ id: string }>
}

const OBJECTIVE_LABELS: Record<string, string> = {
  weight_loss: 'Pérdida de peso',
  maintenance: 'Mantenimiento',
  muscle_gain: 'Ganancia de masa',
  performance: 'Rendimiento deportivo',
  health: 'Salud general',
  other: 'Otro',
}

function objectiveLabel(objective: string | null) {
  if (!objective) return 'No definido'
  return OBJECTIVE_LABELS[objective.toLowerCase()] || objective
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="xprt-section">
      <h2 className="xprt-h2">{title}</h2>
      {children}
    </section>
  )
}

export default async function InformePrimariaPage({ params }: InformePrimariaPageProps) {
  const { id } = await params
  const patient = await getPatient(id)

  if (!patient) notFound()

  const activePlan = patient.mealPlans.find((plan) => plan.isActive) || patient.mealPlans[0]
  const lastAnthropometry = patient.anthropometries[0]
  const lastBlood = patient.bloodAnalyses[0]
  const lastCheckIn = patient.clinicalCheckIns[0]
  const completedConsents = patient.consents.filter((consent) => consent.accepted)
  const pendingConsents = patient.consents.filter((consent) => !consent.accepted)
  const lastConsultation = patient.consultations[0]

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/dashboard/patients/${patient.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la ficha
        </Link>
        <PrintButton />
      </div>

      <article className="xprt-page">
        <header className="xprt-header">
          <div>
            <p className="xprt-brand">Eva Vidal Nutrición</p>
            <p className="xprt-sub">
              Consulta de Nutrición y Dietética · Gran Vía 12, Madrid · Colegiado DIETISTA
              COL.1222
            </p>
            <p className="xprt-sub">
              info@evavidalnutricion.com · +34 644 123 767
            </p>
          </div>
          <div className="xprt-header-right">
            <p className="xprt-doc-title">Carta de revisión por Atención Primaria</p>
            <p className="xprt-sub">Fecha: {formatDate(new Date())}</p>
            <p className="xprt-sub">Ref.: EV-{patient.id.slice(-6).toUpperCase()}</p>
          </div>
        </header>

        <Section title="1. Datos del paciente">
          <dl className="xprt-grid">
            <div>
              <dt>Nombre y apellidos</dt>
              <dd>
                {patient.firstName} {patient.lastName}
              </dd>
            </div>
            <div>
              <dt>Fecha de nacimiento</dt>
              <dd>{formatDate(patient.birthDate)}</dd>
            </div>
            <div>
              <dt>Contacto</dt>
              <dd>{patient.email || patient.phone || '—'}</dd>
            </div>
            <div>
              <dt>Representante legal</dt>
              <dd>{patient.guardianName || 'No aplica'}</dd>
            </div>
          </dl>
        </Section>

        <Section title="2. Motivo de la derivación y objetivo nutricional">
          <p className="xprt-p">
            {lastConsultation?.subjectiveNotes ||
              lastConsultation?.notes ||
              patient.notes ||
              'Seguimiento nutricional y ajuste de la pauta alimentaria acordada en consulta.'}
          </p>
          <p className="xprt-p">
            <strong>Objetivo terapéutico:</strong> {objectiveLabel(patient.objective || null)}.
          </p>
        </Section>

        <Section title="3. Estado clínico y nutricional actual">
          <dl className="xprt-grid">
            <div>
              <dt>Peso y talla</dt>
              <dd>
                {lastAnthropometry ? `${lastAnthropometry.weightKg} kg` : '—'}
                {patient.heightCm ? ` · ${patient.heightCm} cm` : ''}
                {lastAnthropometry?.bodyFatPct ? ` · ${lastAnthropometry.bodyFatPct}% GC` : ''}
              </dd>
            </div>
            <div>
              <dt>Pauta vigente</dt>
              <dd>
                {activePlan
                  ? `${activePlan.name} · ${Math.round(activePlan.targetKcal)} kcal/día`
                  : 'Sin pauta activa'}
              </dd>
            </div>
            <div>
              <dt>Alérgenos e intolerancias</dt>
              <dd>{patient.allergies || 'No consta'}</dd>
            </div>
            <div>
              <dt>Medicación habitual</dt>
              <dd>{patient.currentMedications || 'No consta'}</dd>
            </div>
            <div>
              <dt>Patologías</dt>
              <dd>{patient.medicalHistory || 'No consta'}</dd>
            </div>
            <div>
              <dt>Última analítica</dt>
              <dd>
                {lastBlood
                  ? `${formatDate(lastBlood.date)}${
                      lastBlood.glucoseMgDl ? ` · Glucosa ${lastBlood.glucoseMgDl} mg/dL` : ''
                    }${lastBlood.hba1cPct ? ` · Hb1Ac ${lastBlood.hba1cPct}%` : ''}`
                  : 'No consta'}
              </dd>
            </div>
            <div>
              <dt>Adherencia declarada</dt>
              <dd>
                {lastCheckIn?.adherencePct !== null && lastCheckIn?.adherencePct !== undefined
                  ? `${lastCheckIn.adherencePct}%`
                  : 'Sin registro'}
              </dd>
            </div>
            <div>
              <dt>Consentimientos</dt>
              <dd>
                {completedConsents.length} firmados
                {pendingConsents.length ? ` · ${pendingConsents.length} pendientes` : ''}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="4. Recomendaciones y seguimiento">
          <ul className="xprt-list">
            <li>
              Mantener el patrón de alimentación mediterráneo con la pauta personalizada en vigor
              ({activePlan ? `${Math.round(activePlan.targetKcal)} kcal/día` : 'a concertar en consulta'}),
              ajustando los hidratos de carbono según glucemia y actividad física.
            </li>
            <li>
              Priorizar verduras (2 raciones), fruta entera (2 raciones) y legumbres (3 o más veces
              por semana) conforme al patrón mediterráneo.
            </li>
            <li>
              Revisión clínica y analítica de control en 3-6 meses según criterio médico.
            </li>
            <li>
              Queda a disposición de Atención Primaria para la coordinación de la evolución
              antropométrica y metabólica del paciente.
            </li>
          </ul>
        </Section>

        <Section title="5. Consentimientos específicos generados desde la ficha">
          <p className="xprt-p">
            <strong>Consentimiento de derivación y de tratamiento de datos de salud.</strong> Yo,
            {patient.firstName} {patient.lastName}, con documento de identidad acreditado, autorizo a
            Eva Vidal Nutrición (Colegiado DIETISTA COL.1222) a elaborar y tratar la información
            sobre mi estado nutricional y de salud necesaria para el seguimiento de mi consulta, y
            cedo a la Unidad de Atención Primaria los datos clínico-nutricionales que constan en esta
            carta para la continuidad asistencial, de conformidad con el RGPD (UE) 2016/679 y la Ley
            Orgánica 3/2018 de protección de datos de salud.
          </p>
          <p className="xprt-p">
            He sido informado/a del tratamiento al que se somete mis datos de salud (categoría
            especial, art. 9 RGPD), de su finalidad, de la base jurídica, de los destinatarios y del
            plazo de conservación, así como de mi derecho a retirar el consentimiento en cualquier
            momento sin efecto retroactivo.
          </p>
          <div className="xprt-signatures">
            <div>
              <p className="xprt-sign-line" />
              <p className="xprt-sub">Firma de la paciente o de su representante legal</p>
            </div>
            <div>
              <p className="xprt-sign-line" />
              <p className="xprt-sub">Eva Vidal Nutrición · DIETISTA COL.1222</p>
            </div>
          </div>
        </Section>

        <footer className="xprt-footer">
          <p>
            Documento generado desde la historia clínica de EVSoftware. Los datos incluidos son de
            categoria especial (salud) y su tratamiento se realiza conforme al RGPD y a la LOPDGDD.
          </p>
          <p>
            {patient.firstName} {patient.lastName} · Ref. EV-{patient.id.slice(-6).toUpperCase()} ·
            Emitido el {formatDate(new Date())}
          </p>
        </footer>
      </article>
    </div>
  )
}
