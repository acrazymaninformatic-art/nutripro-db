import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle2, XCircle, Clock, ShieldCheck, User, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Registro de Envíos de Correo · EVSoftware',
  description: 'Auditoría y trazabilidad clínica de correos enviados a pacientes.',
}

export default async function EmailsLogPage() {
  await requireAdmin()

  const logs = await prisma.emailLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 100,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
    APPOINTMENT: { label: 'Confirmación Cita', icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    REMINDER_24H: { label: 'Recordatorio 24h', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    ANAMNESIS: { label: 'Cuestionario Pre-Consulta', icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    PLAN_PUBLISHED: { label: 'Plan Publicado', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    PORTAL_INVITE: { label: 'Acceso Portal', icon: User, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    SECURITY: { label: 'Seguridad / Acceso', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Registro de Correos Enviados
            </h1>
            <p className="text-sm text-gray-500">
              Trazabilidad completa de comunicaciones automáticas, recordatorios y cuestionarios.
            </p>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Historial de Envíos Transaccionales
              </CardTitle>
              <CardDescription>
                Mostrando los últimos {logs.length} envíos realizados mediante el servidor SMTP.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 shadow-2xs">
              Total registrados: {logs.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-40 text-gray-400" />
              <p className="font-semibold text-gray-600 text-sm">No hay registros de correos aún</p>
              <p className="text-xs text-gray-400 mt-1">
                Los envíos automáticos de citas y cuestionarios aparecerán aquí de forma inmediata.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Destinatario</th>
                    <th className="py-3 px-4">Asunto</th>
                    <th className="py-3 px-4">Paciente Relacionado</th>
                    <th className="py-3 px-4 text-right">Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const badge = typeLabels[log.type] || {
                      label: log.type,
                      icon: Mail,
                      color: 'text-gray-600 bg-gray-50 border-gray-200',
                    }
                    const Icon = badge.icon
                    const isSuccess = log.status === 'SENT'

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Enviado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-red-800 bg-red-50 border border-red-200" title={log.errorDetails || ''}>
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-2xs font-semibold border ${badge.color}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{log.recipientName || 'Paciente'}</p>
                          <p className="text-gray-500 font-mono text-2xs">{log.recipientEmail}</p>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-gray-700 font-medium">
                          {log.subject}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.patient ? (
                            <Link
                              href={`/dashboard/patients/${log.patient.id}`}
                              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                            >
                              <User className="w-3 h-3" />
                              {log.patient.firstName} {log.patient.lastName}
                            </Link>
                          ) : (
                            <span className="text-gray-400 italic">No asociado</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500 whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
