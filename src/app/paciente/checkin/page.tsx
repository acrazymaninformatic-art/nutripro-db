import Link from 'next/link'
import { ArrowRight, CalendarClock, ClipboardCheck, Sparkles, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requirePatient } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckInForm } from './checkin-form'

export const dynamic = 'force-dynamic'

function scoreColor(value: number | null | undefined, max: number) {
  if (value === null || value === undefined) return 'text-slate-400'
  const ratio = value / max
  if (ratio >= 0.75) return 'text-emerald-700'
  if (ratio >= 0.45) return 'text-amber-700'
  return 'text-rose-700'
}

export default async function CheckInPage() {
  const { patientId, isAdminPreview } = await requirePatient()

  const [patient, checkIns, lastAnthropometry, activePlan] = await Promise.all([
    patientId
      ? prisma.patient.findUnique({
          where: { id: patientId },
          select: { firstName: true, lastName: true },
        })
      : Promise.resolve(null),
    patientId
      ? prisma.clinicalCheckIn.findMany({
          where: { patientId },
          orderBy: { date: 'desc' },
          take: 12,
        })
      : Promise.resolve([]),
    patientId
      ? prisma.anthropometry.findFirst({
          where: { patientId },
          orderBy: { date: 'desc' },
          select: { weightKg: true, date: true },
        })
      : Promise.resolve(null),
    patientId
      ? prisma.mealPlan.findFirst({
          where: { patientId, isActive: true },
          orderBy: { createdAt: 'desc' },
          select: { name: true },
        })
      : Promise.resolve(null),
  ])

  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : ''

  const averageAdherence = checkIns.length
    ? Math.round(
        checkIns.reduce((sum, item) => sum + (item.adherencePct || 0), 0) / checkIns.length
      )
    : null

  const averageDigestion = checkIns.length
    ? Math.round(
        (checkIns.reduce((sum, item) => sum + (item.digestionScore || 0), 0) / checkIns.length) * 10
      ) / 10
    : null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass-panel relative overflow-hidden rounded-3xl border border-slate-200/80 p-6 shadow-xs sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-2xs">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Mi seguimiento</h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Registra cómo vas entre cita y cita. Eva lo revisa en tu ficha y lo tiene en
              cuenta para la próxima consulta.
            </p>
            {patientName ? (
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {patientName}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-3xl border-slate-200/80 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Adherencia media
            </span>
            <p
              className={`mt-1 font-mono text-2xl font-black tabular-nums ${scoreColor(averageAdherence, 100)}`}
            >
              {averageAdherence !== null ? `${averageAdherence}%` : '—'}
            </p>
            <p className="text-[10px] text-slate-400">
              {checkIns.length} {checkIns.length === 1 ? 'registro' : 'registros'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Digestivo medio
            </span>
            <p
              className={`mt-1 font-mono text-2xl font-black tabular-nums ${scoreColor(averageDigestion, 10)}`}
            >
              {averageDigestion !== null ? `${averageDigestion}/10` : '—'}
            </p>
            <p className="text-[10px] text-slate-400">Autopercibido</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/80 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Último peso medido
            </span>
            <p className="mt-1 font-mono text-2xl font-black tabular-nums text-slate-900">
              {lastAnthropometry ? `${lastAnthropometry.weightKg} kg` : '—'}
            </p>
            <p className="text-[10px] text-slate-400">Medido por Eva</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Registrar seguimiento</CardTitle>
          <CardDescription className="text-xs">
            Tarda menos de un minuto. Un registro al día es suficiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <CheckInForm disabled={isAdminPreview} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Mis últimos registros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {checkIns.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarClock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Todavía no hay seguimientos</p>
              <p className="mt-1 text-xs text-slate-500">
                En cuanto registres el primero, aquí verás tu evolución.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {checkIns.map((item) => (
                <li key={item.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {new Date(item.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(item.date).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {item.adherencePct !== null && item.adherencePct !== undefined ? (
                      <span
                        className={`rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold ${scoreColor(item.adherencePct, 100)}`}
                      >
                        Adherencia {item.adherencePct}%
                      </span>
                    ) : null}
                    {item.digestionScore !== null && item.digestionScore !== undefined ? (
                      <span
                        className={`rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold ${scoreColor(item.digestionScore, 10)}`}
                      >
                        Digestivo {item.digestionScore}/10
                      </span>
                    ) : null}
                    {item.habitsScore !== null && item.habitsScore !== undefined ? (
                      <span
                        className={`rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold ${scoreColor(item.habitsScore, 10)}`}
                      >
                        Hábitos {item.habitsScore}/10
                      </span>
                    ) : null}
                  </div>

                  {item.notes ? (
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {activePlan ? (
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-blue-900">
                Estás siguiendo el plan «{activePlan.name}»
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-blue-800/80">
                Tu seguimiento ayuda a Eva a ajustar la pauta en la próxima revisión.
              </p>
              <Button
                asChild
                variant="ghost"
                className="mt-2 h-8 rounded-xl px-2 text-xs font-bold text-blue-700"
              >
                <Link href="/paciente/plan">
                  Ver mi plan
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
