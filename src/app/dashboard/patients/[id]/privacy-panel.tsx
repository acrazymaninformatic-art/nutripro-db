'use client'

import { useState, useTransition } from 'react'
import { Download, FileWarning, ShieldCheck, ShieldOff, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { registerDataSubjectRequest, revokePatientConsent } from '../privacy-actions'

interface Props {
  patientId: string
  consentAcceptedAt?: Date | string | null
  consentPolicyVersion?: string | null
  consentRevokedAt?: Date | string | null
  requests: Array<{
    id: string
    requestType: string
    status: string
    createdAt: Date | string
  }>
}

export function PrivacyPanel({
  patientId,
  consentAcceptedAt,
  consentPolicyVersion,
  consentRevokedAt,
  requests,
}: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const request = (type: 'EXPORT' | 'ERASURE') =>
    startTransition(async () => {
      try {
        const result = await registerDataSubjectRequest(patientId, type)
        setMessage(result.message)
      } catch (error: any) {
        setMessage(error?.message || 'No se pudo registrar la solicitud.')
      }
    })

  const revoke = () => {
    const reason = window.prompt('Motivo de la revocación (opcional):')
    if (reason === null) return
    startTransition(async () => {
      try {
        await revokePatientConsent(patientId, reason)
        setMessage('Consentimiento revocado y registrado con éxito.')
      } catch (error: any) {
        setMessage(error?.message || 'No se pudo revocar el consentimiento.')
      }
    })
  }

  return (
    <Card className="rounded-3xl border-slate-200/90 shadow-xs overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50/60 via-slate-50/40 to-white border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Privacidad y Derechos RGPD del Paciente
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Consentimiento versionado y trazabilidad legal de solicitudes (Art. 15-22 RGPD)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* Estado del consentimiento */}
          <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200/60 text-xs space-y-1.5">
            <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider block">
              Estado del Consentimiento Principal
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              {consentRevokedAt ? (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-3xs font-black">
                  Revocado el {new Date(consentRevokedAt).toLocaleDateString('es-ES')}
                </Badge>
              ) : consentAcceptedAt ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-3xs font-black">
                  ✓ Aceptado el {new Date(consentAcceptedAt).toLocaleDateString('es-ES')}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-3xs font-black">
                  ⚠️ Pendiente de registrar
                </Badge>
              )}
            </div>
            <p className="text-2xs text-slate-500 pt-1">
              Versión normativa: <strong className="text-slate-700 font-semibold">{consentPolicyVersion || 'Sin versión histórica'}</strong>
            </p>
          </div>

          {/* Solicitudes registradas */}
          <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200/60 text-xs space-y-1.5">
            <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider block">
              Solicitudes de Derechos ARCO
            </span>
            <p className="font-bold text-slate-800 text-xs">
              {requests.length
                ? `${requests.length} solicitud(es) registrada(s)`
                : 'No constan solicitudes abiertas'}
            </p>
            {requests.length > 0 && (
              <p className="text-2xs text-slate-500">
                Última: <strong className="text-slate-700">{requests[0].requestType}</strong> · Estado: {requests[0].status}
              </p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => request('EXPORT')}
            className="rounded-xl text-xs font-bold h-9 px-3.5 border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
            <span>Registrar Solicitud Exportación</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => request('ERASURE')}
            className="rounded-xl text-xs font-bold h-9 px-3.5 border-amber-300 text-amber-800 hover:bg-amber-50 transition-all active:scale-[0.98]"
          >
            <FileWarning className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
            <span>Solicitar Supresión (Derecho al Olvido)</span>
          </Button>

          {!consentRevokedAt && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={revoke}
              className="rounded-xl text-xs font-bold h-9 px-3.5 border-rose-300 text-rose-800 hover:bg-rose-50 transition-all active:scale-[0.98]"
            >
              <ShieldOff className="mr-1.5 h-3.5 w-3.5 text-rose-600" />
              <span>Revocar Consentimiento</span>
            </Button>
          )}
        </div>

        <p className="text-2xs leading-relaxed text-slate-400">
          La exportación en formato seguro JSON/CSV está disponible en el menú de acciones del paciente. Las solicitudes de supresión quedan auditadas antes de cualquier borrado para garantizar el cumplimiento normativo sanitario.
        </p>

        {message && (
          <div role="status" className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs text-emerald-800 font-semibold animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
