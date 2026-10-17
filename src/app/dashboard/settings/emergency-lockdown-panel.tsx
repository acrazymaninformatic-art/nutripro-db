'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock } from 'lucide-react'
import { toggleEmergencyLockdown } from './actions'

interface Props {
  initialIsActive: boolean
  activatedAt?: string | null
  expiresAt?: string | null
  reason?: string | null
}

export function EmergencyLockdownPanel({
  initialIsActive,
  activatedAt,
  expiresAt,
  reason,
}: Props) {
  const [isActive, setIsActive] = useState(initialIsActive)
  const [loading, setLoading] = useState(false)
  const [customReason, setCustomReason] = useState('')
  const [durationOption, setDurationOption] = useState<'1' | '24' | '72' | 'manual'>('72')
  const [showConfirm, setShowConfirm] = useState(false)

  const [hoursLeft, setHoursLeft] = useState<number | null>(() => {
    if (!expiresAt) return null
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 0
    return Math.round(diff / (1000 * 60 * 60))
  })

  const handleToggle = async (targetActive: boolean) => {
    setLoading(true)
    try {
      const hours = durationOption === 'manual' ? null : parseInt(durationOption, 10)
      const res = await toggleEmergencyLockdown(targetActive, customReason || undefined, hours)
      if (res.success) {
        setIsActive(targetActive)
        setShowConfirm(false)
        setCustomReason('')
      }
    } catch (e: any) {
      alert(e.message || 'Error al modificar el estado de aislamiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`rounded-3xl border shadow-sm transition-colors ${
      isActive ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-white'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isActive ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isActive ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Aislamiento de Emergencia (72h)
              </CardTitle>
              <CardDescription>
                Protocolo de desconexión inmediata del portal de pacientes ante sospechas de brecha de seguridad.
              </CardDescription>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            isActive
              ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            {isActive ? 'AISLAMIENTO ACTIVO' : 'SISTEMA PROTEGIDO'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive ? (
          <div className="p-4 bg-red-100/70 border border-red-200 rounded-2xl text-red-950 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Clock className="w-4 h-4 text-red-700" />
              <span>
                {hoursLeft !== null
                  ? `Tiempo de aislamiento restante: ~${hoursLeft} horas`
                  : 'Aislamiento manual indefinido (activo hasta desactivación)'}
              </span>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              Todos los accesos al portal de pacientes (`/paciente`) y cuestionarios públicos están bloqueados de forma inmediata.
              Tu panel de administración permanece 100% operativo para revisar expedientes y gestionar auditorías.
            </p>
            {reason && (
              <p className="text-xs bg-white/70 p-2.5 rounded-xl border border-red-200 text-red-900">
                <strong>Motivo registrado:</strong> {reason}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleToggle(false)}
              className="bg-white hover:bg-red-50 text-red-700 border-red-300 font-semibold"
            >
              {loading ? 'Desactivando...' : 'Desactivar aislamiento y reanudar portales'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              En caso de pérdida de un dispositivo, sospecha de acceso no autorizado o incidencia técnica, pulsa el botón para cortar de inmediato todos los accesos públicos y de pacientes durante el periodo configurado.
            </p>
            {!showConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(true)}
                className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800 font-semibold gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                Activar aislamiento de emergencia
              </Button>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <p className="text-xs font-semibold text-amber-900">
                  ¿Confirmas que deseas aislar el sistema? Los pacientes no podrán iniciar sesión hasta que venza el plazo o lo desactives.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Duración del aislamiento:</label>
                    <select
                      value={durationOption}
                      onChange={(e) => setDurationOption(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 bg-white font-medium"
                    >
                      <option value="1">1 hora (Pruebas / Verificación)</option>
                      <option value="24">24 horas (Incidencia menor)</option>
                      <option value="72">72 horas (Plazo legal AEPD Art. 33)</option>
                      <option value="manual">Manual / Indefinido (Hasta desactivar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Motivo registrado (auditoría):</label>
                    <input
                      type="text"
                      placeholder="Ej. Revisión técnica / sospecha de brecha"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={loading}
                    onClick={() => handleToggle(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                  >
                    {loading ? 'Activando...' : 'Confirmar y aislar ahora'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConfirm(false)}
                    className="text-gray-600 text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
