'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { changeAdminPasswordAction, type ChangeAdminPasswordState } from './actions'
import {
  confirmMfaEnrollmentAction,
  startMfaEnrollmentAction,
  type MfaEnrollmentStartResult,
} from './mfa-actions'

interface Props {
  email: string
  mfaEnabled: boolean
  mfaEnrolledAt?: string | null
}

export function SecuritySettingsCard({ email, mfaEnabled, mfaEnrolledAt }: Props) {
  const router = useRouter()
  const [passwordState, passwordAction, passwordPending] = useActionState<ChangeAdminPasswordState, FormData>(
    changeAdminPasswordAction,
    {}
  )
  const [startResult, setStartResult] = useState<MfaEnrollmentStartResult | null>(null)
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [starting, setStarting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmCode, setConfirmCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleStart = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMfaError(null)
    setMfaSuccess(null)
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('mfaCurrentPassword') || '')
    const currentCode = String(formData.get('mfaCurrentCode') || '')
    if (!password) {
      setMfaError('Introduce tu contraseña actual para comenzar.')
      return
    }
    setStarting(true)
    try {
      const result = await startMfaEnrollmentAction(password, currentCode)
      if (result.error) {
        setMfaError(result.error)
        return
      }
      setStartResult(result)
      setConfirmCode('')
    } catch (error: any) {
      setMfaError(error?.message || 'No se pudo iniciar el alta de MFA.')
    } finally {
      setStarting(false)
    }
  }

  const handleConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!startResult) return
    setMfaError(null)
    setConfirming(true)
    try {
      const result = await confirmMfaEnrollmentAction(confirmCode)
      if (result.error) {
        setMfaError(result.error)
        return
      }
      setRecoveryCodes(result.recoveryCodes || [])
      setStartResult(null)
      setMfaSuccess(result.success || 'MFA activado.')
      router.refresh()
    } catch (error: any) {
      setMfaError(error?.message || 'No se pudo confirmar el alta de MFA.')
    } finally {
      setConfirming(false)
    }
  }

  const copyCodes = async () => {
    if (!recoveryCodes) return
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMfaError('No se pudieron copiar los códigos. Descárgalos o anótalos manualmente.')
    }
  }

  const downloadCodes = () => {
    if (!recoveryCodes) return
    const blob = new Blob(
      [
        `EVSoftware — Códigos de recuperación MFA\nCuenta: ${email}\nGenerados: ${new Date().toLocaleString('es-ES')}\n\n${recoveryCodes.join(
          '\n'
        )}\n\nCada código es de un solo uso. Consérvalos en un lugar seguro y separado del dispositivo.\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'evsoftware-codigos-recuperacion.txt'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="rounded-3xl border-slate-200/80 shadow-xs overflow-hidden">
      <CardHeader className="bg-slate-50/60 pb-3.5 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Seguridad de la cuenta profesional</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Cuenta: <strong className="text-slate-800">{email}</strong>. La verificación en dos pasos (TOTP) es
              obligatoria para acceder al historial clínico.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={
              mfaEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-2xs font-bold'
                : 'bg-amber-50 text-amber-800 border-amber-200 text-2xs font-bold'
            }
          >
            {mfaEnabled ? 'MFA activo' : 'MFA pendiente'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {!mfaEnabled && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Acceso restringido.</strong> Hasta activar TOTP solo está disponible esta pantalla de
              Configuración. El resto del panel clínico permanece bloqueado.
            </div>
          </div>
        )}

        {mfaSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{mfaSuccess}</span>
          </div>
        )}

        {mfaError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span>{mfaError}</span>
          </div>
        )}

        {recoveryCodes ? (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
              <KeyRound className="w-4 h-4" />
              <span>Guarda estos códigos de recuperación ahora</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Se muestran una única vez. Cada código sirve para iniciar sesión una sola vez si pierdes el
              autenticador. No los compartas ni los guardes en el mismo dispositivo.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-white rounded-xl border border-amber-200 p-3">
              {recoveryCodes.map((code) => (
                <span key={code} className="tracking-wider text-slate-800">
                  {code}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={copyCodes} className="rounded-xl text-xs gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copiados' : 'Copiar'}
              </Button>
              <Button type="button" variant="outline" onClick={downloadCodes} className="rounded-xl text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Descargar .txt
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setRecoveryCodes(null)
                  setMfaSuccess('Códigos guardados. La verificación en dos pasos está activa.')
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                He guardado los códigos
              </Button>
            </div>
          </div>
        ) : startResult?.secret ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-950">
              <Smartphone className="w-4 h-4" />
              <span>Escanea el código con tu aplicación autenticadora</span>
            </div>
            {startResult.qrDataUrl && (
              <img
                src={startResult.qrDataUrl}
                alt="Código QR para configurar TOTP"
                className="w-60 h-60 rounded-2xl border border-blue-200 bg-white p-2"
              />
            )}
            <div className="text-xs text-slate-700 space-y-1.5">
              <p>
                Si no puedes escanear el QR, introduce este secreto manualmente:{' '}
                <code className="font-mono font-bold text-blue-900 break-all">{startResult.secret}</code>
              </p>
              <p className="break-all text-2xs text-slate-500">URI: {startResult.otpauthUri}</p>
            </div>
            <form
              method="post"
              onSubmit={handleConfirm}
              className="flex flex-wrap items-end gap-3"
            >
              <div>
                <Label htmlFor="mfaConfirmCode" className="text-xs font-semibold text-slate-700">
                  Código de 6 dígitos
                </Label>
                <Input
                  id="mfaConfirmCode"
                  value={confirmCode}
                  onChange={(event) => setConfirmCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="mt-1.5 w-40 rounded-xl text-sm tracking-widest"
                />
              </div>
              <Button
                type="submit"
                disabled={confirming || !/^\d{6}$/.test(confirmCode.replace(/\s+/g, ''))}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2"
              >
                {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LockKeyhole className="w-3.5 h-3.5" />}
                Confirmar y activar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStartResult(null)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>{mfaEnabled ? 'Reconfigurar el autenticador' : 'Activar verificación en dos pasos'}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {mfaEnabled
                ? `MFA activo${mfaEnrolledAt ? ` desde el ${new Date(mfaEnrolledAt).toLocaleDateString('es-ES')}` : ''}. Para cambiar de dispositivo, confirma tu contraseña y un código actual. Se generarán nuevos códigos de recuperación.`
                : 'Usa Google Authenticator, Ente Auth, 1Password o cualquier aplicación TOTP. Al terminar recibirás diez códigos de recuperación de un solo uso.'}
            </p>
            {/*
              `method="post"` no es decorativo: si React no llega a hidratar,
              el formulario se envía de forma nativa y sin él la contraseña
              viajaría en la query string (historial, logs y Referer).
            */}
            <form
              method="post"
              onSubmit={handleStart}
              className="grid gap-3 sm:grid-cols-2 max-w-2xl"
            >
              <div>
                <Label htmlFor="mfaCurrentPassword" className="text-xs font-semibold text-slate-700">
                  Contraseña actual
                </Label>
                <Input
                  id="mfaCurrentPassword"
                  name="mfaCurrentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1.5 rounded-xl text-xs"
                />
              </div>
              {mfaEnabled && (
                <div>
                  <Label htmlFor="mfaCurrentCode" className="text-xs font-semibold text-slate-700">
                    Código actual o de recuperación
                  </Label>
                  <Input
                    id="mfaCurrentCode"
                    name="mfaCurrentCode"
                    autoComplete="one-time-code"
                    required
                    placeholder="123456 o ABCD-EFGH"
                    className="mt-1.5 rounded-xl text-xs"
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={starting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2"
                >
                  {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  {mfaEnabled ? 'Comenzar reconfiguración' : 'Comenzar alta de MFA'}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="border-t border-slate-100 pt-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Cambiar contraseña de administración</span>
          </div>
          <form action={passwordAction} className="grid gap-3 sm:grid-cols-2 max-w-2xl">
            {passwordState.error && (
              <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {passwordState.error}
              </div>
            )}
            {passwordState.success && (
              <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{passwordState.success}</span>
              </div>
            )}
            <div>
              <Label htmlFor="adminCurrentPassword" className="text-xs font-semibold text-slate-700">
                Contraseña actual
              </Label>
              <Input
                id="adminCurrentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1.5 rounded-xl text-xs"
              />
            </div>
            {mfaEnabled && (
              <div>
                <Label htmlFor="adminMfaCode" className="text-xs font-semibold text-slate-700">
                  Código TOTP o de recuperación
                </Label>
                <Input
                  id="adminMfaCode"
                  name="mfaCode"
                  autoComplete="one-time-code"
                  required
                  className="mt-1.5 rounded-xl text-xs"
                />
              </div>
            )}
            <div>
              <Label htmlFor="adminNewPassword" className="text-xs font-semibold text-slate-700">
                Nueva contraseña (mínimo 14 caracteres)
              </Label>
              <Input
                id="adminNewPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1.5 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label htmlFor="adminNewPasswordConfirmation" className="text-xs font-semibold text-slate-700">
                Confirmar nueva contraseña
              </Label>
              <Input
                id="adminNewPasswordConfirmation"
                name="newPasswordConfirmation"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1.5 rounded-xl text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={passwordPending}
                variant="outline"
                className="rounded-xl text-xs font-bold gap-2"
              >
                {passwordPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                Actualizar contraseña
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
