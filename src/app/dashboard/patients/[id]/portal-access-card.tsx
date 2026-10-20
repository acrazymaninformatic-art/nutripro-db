'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  UserCheck,
  UserX,
  RefreshCw,
  Clock,
  ExternalLink,
  Lock,
  Unlock,
  Eye,
} from 'lucide-react'
import {
  createPortalAccount,
  togglePortalAccess,
  generateNewPortalInviteLink,
} from '../portal-actions'
import { startPatientPreview } from '../preview-actions'

interface Props {
  patientId: string
  patientEmail?: string | null
  portalAccessEnabled: boolean
  portalLastLoginAt?: Date | string | null
  portalUser?: {
    id: string
    email: string
    passwordChangeRequired: boolean
    role: string
  } | null
}

export function PortalAccessCard({
  patientId,
  patientEmail,
  portalAccessEnabled,
  portalLastLoginAt,
  portalUser,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await createPortalAccount(patientId)
      setInviteUrl(res.inviteUrl)
      setMessage(res.message)
    } catch (e: any) {
      alert(e.message || 'Error al crear acceso')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (targetState: boolean) => {
    const confirmText = targetState
      ? '¿Reactivar el acceso al portal para este paciente?'
      : '¿Bloquear al instante el acceso al portal? Se cerrarán todas las sesiones del paciente y no podrá iniciar sesión.'
    if (!window.confirm(confirmText)) return

    setLoading(true)
    setMessage(null)
    try {
      const res = await togglePortalAccess(patientId, targetState)
      setMessage(res.message)
    } catch (e: any) {
      alert(e.message || 'Error al modificar acceso')
    } finally {
      setLoading(false)
    }
  }

  const handleNewLink = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await generateNewPortalInviteLink(patientId)
      setInviteUrl(res.inviteUrl)
      setMessage(res.message)
    } catch (e: any) {
      alert(e.message || 'Error al generar enlace')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePreview = async () => {
    setLoading(true)
    try {
      await startPatientPreview(patientId)
    } catch (e: any) {
      alert(e.message || 'Error al iniciar vista previa')
      setLoading(false)
    }
  }

  const hasAccount = Boolean(portalUser)

  return (
    <Card className="rounded-3xl border-2 border-blue-200/80 shadow-xs overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50/70 via-white to-white pb-3 border-b border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Acceso al Portal del Paciente (EVSoftware · Paciente)</span>
                {hasAccount && (
                  <Badge
                    variant="outline"
                    className={`text-2xs font-bold rounded-full ${
                      portalAccessEnabled
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-red-50 text-red-800 border-red-300'
                    }`}
                  >
                    {portalAccessEnabled ? 'Portal Activo' : 'Acceso Bloqueado'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Acceso exclusivo mediante correo y contraseña para que el paciente consulte únicamente su plan y su evolución.
              </CardDescription>
            </div>
          </div>

          {/* Quick status indicator */}
          <div className="shrink-0">
            {hasAccount ? (
              portalAccessEnabled ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Permitido</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <UserX className="w-3.5 h-3.5" />
                  <span>Suspendido</span>
                </span>
              )
            ) : (
              <span className="text-xs text-gray-400 font-medium">Sin cuenta vinculada</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {message && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium animate-in fade-in">
            {message}
          </div>
        )}

        {!hasAccount ? (
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Este paciente aún no tiene credenciales de acceso al portal
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Al pulsar en crear, se generará su cuenta y se enviará un correo electrónico automático a su dirección con el enlace seguro (válido 24 horas) para definir su contraseña.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={loading || !patientEmail}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Crear acceso al portal</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs">
                <span className="text-gray-400 block font-semibold uppercase tracking-wider text-2xs">
                  Correo de inicio de sesión
                </span>
                <span className="font-bold text-gray-900 truncate block mt-0.5">
                  {portalUser?.email}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs">
                <span className="text-gray-400 block font-semibold uppercase tracking-wider text-2xs">
                  Último acceso al portal
                </span>
                <span className="font-semibold text-gray-800 block mt-0.5">
                  {portalLastLoginAt
                    ? new Date(portalLastLoginAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Aún no ha entrado'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs">
                <span className="text-gray-400 block font-semibold uppercase tracking-wider text-2xs">
                  Estado de contraseña
                </span>
                <span className="font-semibold text-gray-800 block mt-0.5">
                  {portalUser?.passwordChangeRequired
                    ? '⚠️ Pendiente de fijar por el paciente'
                    : '✓ Contraseña segura configurada'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              {portalAccessEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleToggle(false)}
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 font-semibold text-xs gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bloquear acceso con 1 clic</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleToggle(true)}
                  className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold text-xs gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reactivar acceso al portal</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handleNewLink}
                className="rounded-xl border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-semibold text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generar nuevo enlace de activación (24h)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handlePreview}
                className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 font-semibold text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista previa como paciente</span>
              </Button>
            </div>
          </div>
        )}

        {/* Display generated one-time link */}
        {inviteUrl && (
          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>Enlace de un solo uso generado (válido por 24 horas):</span>
              </span>
              <span className="text-3xs font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                Caduca en 24h
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-white border border-blue-300 text-blue-900 font-mono select-all"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
              </Button>
            </div>
            <p className="text-3xs text-blue-800 leading-tight">
              Se ha enviado un correo automático a la dirección del paciente. Si lo deseas, también puedes copiar este enlace directo para facilitárselo por WhatsApp u otro canal.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
