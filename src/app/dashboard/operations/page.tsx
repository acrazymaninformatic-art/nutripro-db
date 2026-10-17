import { Activity, CheckCircle2, Database, Mail, ShieldCheck, ShieldAlert, Clock, FileWarning, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OperationsPage() {
  const userId = await requireUserId()
  const [patientCount, pendingRequestsList, recentAccess] = await Promise.all([
    prisma.patient.count({ where: { userId } }),
    prisma.dataSubjectRequest.findMany({
      where: { userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { patient: { select: { firstName: true, lastName: true } } },
    }),
  ])

  const now = Date.now()
  const requestsWithCountdown = pendingRequestsList.map((req) => {
    const deadline = new Date(new Date(req.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    const daysLeft = Math.ceil((deadline.getTime() - now) / (1000 * 60 * 60 * 24))
    return { ...req, deadline, daysLeft }
  })
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
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black text-slate-900 tracking-tight">
            <Activity className="h-6 w-6 text-blue-600" />
            <span>Control de Consulta & Operaciones</span>
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Estado privado de los servicios, auditoría de correos, derechos RGPD y actividad sensible.
          </p>
        </div>
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
        {/* Solicitudes RGPD con Cuenta Atrás de 30 Días (Art. 12.3 RGPD) */}
        <Card className="rounded-3xl border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Control de Solicitudes RGPD (Art. 12.3)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Plazo legal obligatorio de respuesta: máximo 1 mes natural desde la recepción.
                </CardDescription>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                requestsWithCountdown.length > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {requestsWithCountdown.length} pendientes
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {requestsWithCountdown.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-gray-700">Sin solicitudes pendientes</p>
                <p className="text-gray-400 mt-0.5">Todas las peticiones de acceso, rectificación o supresión han sido resueltas.</p>
              </div>
            ) : (
              requestsWithCountdown.map((req) => {
                const isOverdue = req.daysLeft < 0
                const isUrgent = req.daysLeft >= 0 && req.daysLeft <= 5
                const isWarning = req.daysLeft > 5 && req.daysLeft <= 15

                const badgeClass = isOverdue
                  ? 'bg-red-600 text-white font-black'
                  : isUrgent
                  ? 'bg-red-100 text-red-900 border-red-300 font-bold animate-pulse'
                  : isWarning
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold'

                return (
                  <div key={req.id} className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {req.patient ? `${req.patient.firstName} ${req.patient.lastName}` : 'Paciente'}
                        </span>
                        <span className="text-2xs uppercase tracking-wider font-mono text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                          {req.requestType}
                        </span>
                      </div>
                      <p className="text-2xs text-gray-400 mt-0.5">
                        Recibida: {new Date(req.createdAt).toLocaleDateString('es-ES')} • Límite: {req.deadline.toLocaleDateString('es-ES')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-2xs border ${badgeClass}`}>
                        {isOverdue
                          ? `⚠️ Vencido (-${Math.abs(req.daysLeft)}d)`
                          : `⏳ ${req.daysLeft} días restantes`}
                      </span>
                      {req.patient && (
                        <Link
                          href={`/dashboard/patients/${req.patient.id}`}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          Ficha →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Registro de actividad sensible */}
        <Card className="rounded-3xl border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-base">Registro de actividad sensible</CardTitle>
            <CardDescription className="text-xs">Trazabilidad de accesos y acciones auditadas.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {recentAccess.length ? recentAccess.map(item => (
              <div key={item.id} className="flex justify-between gap-3 rounded-xl bg-slate-50 p-2.5 text-xs">
                <span className="font-semibold text-slate-800">{item.action}{item.patient ? ` · ${item.patient.firstName} ${item.patient.lastName}` : ''}</span>
                <span className="shrink-0 text-slate-500">{item.createdAt.toLocaleString('es-ES')}</span>
              </div>
            )) : <p className="text-sm text-gray-500">Todavía no hay acciones sensibles registradas.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Protocolo de Notificación de Brechas de Seguridad 72 Horas (Art. 33 RGPD) */}
      <Card className="rounded-3xl border-rose-200 bg-gradient-to-r from-rose-50/50 via-white to-white overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-rose-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-rose-950 flex items-center gap-2">
                  <span>Protocolo de Brechas de Seguridad (72 Horas · Art. 33 RGPD)</span>
                  <span className="text-2xs bg-rose-200 text-rose-900 font-black px-2 py-0.5 rounded-full">
                    AEPD
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-rose-900/80">
                  En caso de incidente o acceso no autorizado a datos de salud, es obligatorio notificar a la AEPD en menos de 72 horas.
                </CardDescription>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <button
                type="button"
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
              >
                🚨 Activar Aislamiento de Emergencia
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-2xs space-y-1">
              <span className="font-bold text-rose-900 block">1. Aislamiento Inmediato</span>
              <p className="text-gray-600 text-2xs leading-relaxed">
                Activa el aislamiento desde Configuración para desconectar todos los accesos web de pacientes y formularios de anamnesis.
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-2xs space-y-1">
              <span className="font-bold text-rose-900 block">2. Notificación AEPD (72h)</span>
              <p className="text-gray-600 text-2xs leading-relaxed">
                Comunica la brecha a través de la sede electrónica de la Agencia Española de Protección de Datos detallando naturaleza y alcance.
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-2xs space-y-1">
              <span className="font-bold text-rose-900 block">3. Aviso a Pacientes Afectados</span>
              <p className="text-gray-600 text-2xs leading-relaxed">
                Si existe alto riesgo para los derechos de los pacientes, comunícalo individualmente con medidas de mitigación recomendadas.
              </p>
            </div>
          </div>

          <details className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <summary className="font-bold text-slate-900 cursor-pointer flex items-center justify-between">
              <span>📋 Borrador / Plantilla Oficial para Notificación de Incidente (Art. 33 RGPD)</span>
              <span className="text-blue-700 font-semibold text-2xs">Expandir plantilla</span>
            </summary>
            <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl font-mono text-2xs text-gray-800 whitespace-pre-wrap leading-relaxed select-all">
{`NOTIFICACIÓN DE BRECHA DE SEGURIDAD DE DATOS PERSONALES (ART. 33 RGPD)
Fecha y Hora de Detección: ${new Date().toISOString()}
Responsable del Tratamiento: Eva Vidal Nutrición (evavidalinfo@gmail.com)
Software Afectado: EVSoftware · Gestión Clínica

1. NATURALEZA DEL INCIDENTE:
   [ ] Acceso no autorizado o credencial comprometida
   [ ] Pérdida o robo de dispositivo
   [ ] Error en configuración de permisos / exfiltración

2. CATEGORÍAS DE DATOS AFECTADOS:
   [x] Datos identificativos (nombre, correo, teléfono)
   [x] Datos de salud de categoría especial (Art. 9 RGPD): antropometría, alergias, medicación, analíticas.

3. MEDIDAS CORRECTIVAS ADOPTADAS DE INMEDIATO:
   - Activación del aislamiento de emergencia de EVSoftware (corte total de portales de paciente).
   - Revocación de sesiones y tokens activos.
   - Auditoría forense de accesos en el registro centralizado.

4. CONSECUENCIAS ESTIMADAS:
   - Evaluación del impacto para los derechos y libertades de las personas afectadas.

5. CONTACTO DEL RESPONSABLE:
   Eva Vidal Nutrición • Correo: evavidalinfo@gmail.com`}
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}

