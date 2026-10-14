import { Activity, CheckCircle2, Database, Mail, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function OperationsPage() {
  const userId = await requireUserId()
  const [patientCount, pendingRequests, recentAccess] = await Promise.all([
    prisma.patient.count({ where: { userId } }),
    prisma.dataSubjectRequest.count({ where: { userId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 12, include: { patient: { select: { firstName: true, lastName: true } } } }),
  ])
  const mailReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && (process.env.SMTP_FROM || process.env.SMTP_USER))
  const status = (ready: boolean, label: string, detail: string, Icon: typeof Database, href?: string) => (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex gap-3">
          <div className={`rounded-xl p-2 ${ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">{detail}</p>
          </div>
        </div>
        {href && (
          <a
            href={href}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            Ver registros →
          </a>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Activity className="h-6 w-6 text-blue-700" />
          Control de consulta
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Estado privado de los servicios, auditoría de correos, derechos RGPD y actividad sensible.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {status(true, 'Base de datos', `${patientCount} expediente(s) activos.`, Database)}
        {status(mailReady, 'Correo transaccional', mailReady ? 'Servicio activo y monitorizado.' : 'Falta configurar SMTP.', Mail, '/dashboard/operations/emails')}
        {status(true, 'Acceso profesional', 'Sesión protegida por roles.', ShieldCheck)}
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Auditoría y Trazabilidad de Comunicaciones</CardTitle>
              <CardDescription>Registro cronológico de todas las confirmaciones, recordatorios y cuestionarios enviados.</CardDescription>
            </div>
            <a
              href="/dashboard/operations/emails"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
            >
              Abrir Registro de Envíos
            </a>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base">Copias y revisión operativa</CardTitle>
          <CardDescription>Las copias gestionadas por Supabase/Vercel deben revisarse desde sus paneles privados; esta aplicación no revela credenciales ni infraestructura.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-gray-700 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <CheckCircle2 className="mb-2 h-5 w-5 text-blue-700" />
            <strong>Checklist semanal</strong>
            <p className="mt-1 text-xs leading-5 text-gray-500">Comprueba el último backup y restaura una copia de prueba en un proyecto aislado.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <CheckCircle2 className="mb-2 h-5 w-5 text-blue-700" />
            <strong>Alertas de correo</strong>
            <p className="mt-1 text-xs leading-5 text-gray-500">Supervisa las entregas y tasas de rebote en el registro de envíos.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <CheckCircle2 className="mb-2 h-5 w-5 text-blue-700" />
            <strong>Accesos y derechos</strong>
            <p className="mt-1 text-xs leading-5 text-gray-500">Revisa las acciones sensibles y las solicitudes RGPD abiertas antes de cerrar la semana.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader><CardTitle className="text-base">Solicitudes RGPD pendientes</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${pendingRequests ? 'text-amber-700' : 'text-emerald-700'}`}>{pendingRequests}</p>
            <p className="mt-1 text-sm text-gray-500">Gestiona la exportación o eliminación desde la ficha de cada paciente.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader><CardTitle className="text-base">Registro de actividad sensible</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentAccess.length ? recentAccess.map(item => (
              <div key={item.id} className="flex justify-between gap-3 rounded-xl bg-slate-50 p-2.5 text-xs">
                <span className="font-semibold text-slate-800">{item.action}{item.patient ? ` · ${item.patient.firstName} ${item.patient.lastName}` : ''}</span>
                <span className="shrink-0 text-slate-500">{item.createdAt.toLocaleString('es-ES')}</span>
              </div>
            )) : <p className="text-sm text-gray-500">Todavía no hay acciones sensibles registradas.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

