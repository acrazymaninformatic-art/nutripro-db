'use client'

import { useState, useActionState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { MotionSettingsCard } from '@/components/ui/motion-settings-card'
import { ThemeSettingsCard } from '@/components/ui/theme-settings-card'
import { PwaCard } from '@/components/ui/pwa-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Download, Trash2, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, FileDown } from 'lucide-react'
import {
  changePasswordAction,
  requestDataErasureAction,
  requestDataAccessAction,
  requestDataRectificationAction,
  exportPatientDataAction,
  type ChangePasswordState,
} from '../config-actions'

interface Props {
  userEmail: string
  pendingRequests: Array<{
    id: string
    requestType: string
    status: string
    createdAt: string
  }>
}

export function ConfigClient({ userEmail, pendingRequests }: Props) {
  const [passwordState, formAction, isPendingPassword] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {}
  )
  const [downloading, setDownloading] = useState(false)
  const [erasureLoading, setErasureLoading] = useState(false)
  const [erasureSuccess, setErasureSuccess] = useState<string | null>(null)
  const [showErasureConfirm, setShowErasureConfirm] = useState(false)
  const [erasureNotes, setErasureNotes] = useState('')
  const [rightsLoading, setRightsLoading] = useState(false)

  const handleDownloadData = async () => {
    setDownloading(true)
    try {
      const res = await exportPatientDataAction()
      const blob = new Blob([res.dataJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message || 'Error al descargar datos')
    } finally {
      setDownloading(false)
    }
  }

  const handleErasureSubmit = async () => {
    setErasureLoading(true)
    setErasureSuccess(null)
    try {
      const res = await requestDataErasureAction(erasureNotes)
      setErasureSuccess(res.message)
      setShowErasureConfirm(false)
      setErasureNotes('')
    } catch (e: any) {
      alert(e.message || 'Error al registrar solicitud')
    } finally {
      setErasureLoading(false)
    }
  }

  const handleRightsRequest = async (type: 'ACCESS' | 'RECTIFICATION') => {
    setRightsLoading(true)
    setErasureSuccess(null)
    try {
      const res = type === 'ACCESS' ? await requestDataAccessAction() : await requestDataRectificationAction()
      setErasureSuccess(res.message)
    } catch (e: any) {
      alert(e.message || 'Error al registrar solicitud')
    } finally {
      setRightsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <KeyRound className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Configuración de Mi Cuenta
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gestiona tu contraseña de acceso, tus preferencias y tus derechos de privacidad y protección de datos.
            </p>
          </div>
        </div>
      </div>

      {/* Preferencias de animación de la interfaz (GSAP) */}
      <MotionSettingsCard />

      {/* Tema claro / oscuro de la interfaz */}
      <ThemeSettingsCard />

      {/* Instalación de la app y avisos en el móvil */}
      <PwaCard />

      {/* 1. Seguridad y Cambio de Contraseña */}
      <Card className="rounded-3xl border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/60 pb-3.5 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Seguridad y Contraseña</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Cuenta vinculada: <strong className="text-slate-800">{userEmail}</strong>. Las contraseñas deben tener mínimo 12 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form action={formAction} className="space-y-4 max-w-md">
            {passwordState.error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {passwordState.error}
              </div>
            )}
            {passwordState.success && (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                <span>{passwordState.success}</span>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold text-slate-700">Contraseña actual</Label>
              <Input
                name="currentPassword"
                type="password"
                required
                className="mt-1.5 text-xs rounded-xl shadow-2xs"
                placeholder="Introduce tu contraseña actual"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Nueva contraseña (mínimo 12 caracteres)</Label>
              <Input
                name="newPassword"
                type="password"
                required
                className="mt-1.5 text-xs rounded-xl shadow-2xs"
                placeholder="Mayúscula, minúscula y número"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Confirmar nueva contraseña</Label>
              <Input
                name="confirmPassword"
                type="password"
                required
                className="mt-1.5 text-xs rounded-xl shadow-2xs"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <Button
              type="submit"
              disabled={isPendingPassword}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-xs transition-all active:scale-[0.98] h-10 px-5"
            >
              {isPendingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Actualizar contraseña</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Descarga de Datos (Portabilidad RGPD Art. 20) */}
      <Card className="rounded-3xl border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/60 pb-3.5 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            <span>Descarga y Portabilidad de Datos (RGPD Art. 20)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Obtén una copia completa en formato estructurado (JSON) de toda tu información clínica y personal.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-700 font-medium">
              Incluye tu ficha personal, objetivos, historial de medidas corporales compartidas, citas y cuestionarios.
            </p>
            <p className="text-2xs text-slate-500 mt-1">
              Fichero legible por ordenador para que lo conserves o lo compartas con otros profesionales de salud.
            </p>
          </div>
          <Button
            onClick={handleDownloadData}
            disabled={downloading}
            variant="outline"
            className="rounded-2xl border-blue-200 text-blue-800 hover:bg-blue-50 font-bold text-xs gap-2 shrink-0 h-10 px-4 shadow-2xs transition-all active:scale-[0.98]"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            <span>Descargar mis datos (.json)</span>
          </Button>
        </CardContent>
      </Card>

      {/* 3. Otros derechos RGPD */}
      <Card className="rounded-3xl border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/60 pb-3.5 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /><span>Acceso y rectificación</span></CardTitle>
          <CardDescription className="text-xs text-slate-500">Además de descargar tus datos, puedes pedir una revisión formal de la información.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-wrap gap-2.5">
          <Button onClick={() => handleRightsRequest('ACCESS')} disabled={rightsLoading} variant="outline" className="rounded-2xl text-xs font-bold gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" />Solicitar acceso formal</Button>
          <Button onClick={() => handleRightsRequest('RECTIFICATION')} disabled={rightsLoading} variant="outline" className="rounded-2xl text-xs font-bold gap-2"><FileDown className="w-4 h-4 text-blue-600" />Solicitar rectificación</Button>
        </CardContent>
      </Card>

      {/* 4. Solicitud de Supresión de Datos (RGPD Art. 17) */}
      <Card className="rounded-3xl border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/60 pb-3.5 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Supresión de Datos y Derecho al Olvido (RGPD Art. 17)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Puedes solicitar la eliminación de tu cuenta y datos personales.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {erasureSuccess && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
              <span>{erasureSuccess}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Conforme a la legislación sanitaria vigente (Ley 41/2002 de Autonomía del Paciente), ciertos datos clínicos
            deben conservarse durante los plazos legalmente estipulados. Tu solicitud será tramitada y revisada por Eva Vidal.
          </p>

          {pendingRequests.length > 0 && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900">
              <span className="font-bold block">Solicitud en curso:</span>
              <span className="mt-0.5 block">
                Existe una petición de {pendingRequests[0].requestType === 'ERASURE' ? 'supresión' : 'exportación'} registrada el{' '}
                {new Date(pendingRequests[0].createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} en estado {pendingRequests[0].status}.
              </span>
            </div>
          )}

          {!showErasureConfirm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowErasureConfirm(true)}
              className="rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-semibold text-xs gap-2 h-9 px-4 transition-all active:scale-[0.98]"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Solicitar supresión de mis datos</span>
            </Button>
          ) : (
            <div className="p-5 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-rose-950">
                ¿Confirmas que deseas registrar la solicitud de eliminación de tu expediente y cuenta del portal?
              </p>
              <Input
                placeholder="Motivo o aclaración adicional (opcional)"
                value={erasureNotes}
                onChange={(e) => setErasureNotes(e.target.value)}
                className="text-xs bg-white rounded-xl shadow-2xs"
              />
              <div className="flex items-center gap-2.5 pt-1">
                <Button
                  size="sm"
                  disabled={erasureLoading}
                  onClick={handleErasureSubmit}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-4 shadow-xs transition-all active:scale-[0.98]"
                >
                  {erasureLoading ? 'Registrando...' : 'Confirmar solicitud formal'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowErasureConfirm(false)}
                  className="rounded-xl text-slate-600 text-xs h-9 px-3"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
