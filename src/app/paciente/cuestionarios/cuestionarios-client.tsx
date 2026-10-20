'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardCheck,
  FileSignature,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  PenTool,
} from 'lucide-react'
import Link from 'next/link'
import { signConsentAction } from '../actions'

interface ConsentItem {
  id: string
  type: string
  title: string
  version: string
  accepted: boolean
  acceptedAt?: string | null
}

interface Props {
  anamnesisStatus: string
  anamnesisCompletedAt?: string | null
  consents: ConsentItem[]
}

export function CuestionariosClient({
  anamnesisStatus,
  anamnesisCompletedAt,
  consents,
}: Props) {
  const [signingConsentId, setSigningConsentId] = useState<string | null>(null)
  const [signatureName, setSignatureName] = useState('')
  const [loading, setLoading] = useState(false)

  const isAnamnesisPending = anamnesisStatus === 'PENDING' || anamnesisStatus === 'SENT'
  const isAnamnesisCompleted = anamnesisStatus === 'COMPLETED'

  const pendingConsents = consents.filter((c) => !c.accepted)
  const signedConsents = consents.filter((c) => c.accepted)

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signingConsentId || !signatureName.trim()) return
    setLoading(true)
    try {
      await signConsentAction(
        signingConsentId,
        `Firma digital de conformidad: ${signatureName.trim()}`
      )
      setSigningConsentId(null)
      setSignatureName('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100/80 shadow-2xs">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cuestionarios Clínicos y Firmas Digitales
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Rellena tu anamnesis clínica antes de consulta y firma los consentimientos informados de forma 100% digital y segura.
            </p>
          </div>
        </div>
      </div>

      {/* AVISOS DE PENDIENTES DESTACADOS (PDF pág 13) */}
      {(isAnamnesisPending || pendingConsents.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Acciones pendientes requeridas ({Number(isAnamnesisPending) + pendingConsents.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aviso Cuestionario de Alta Pendiente */}
            {isAnamnesisPending && (
              <Card className="rounded-3xl border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 shadow-xs p-6 space-y-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <Badge variant="warning" className="text-3xs font-black uppercase tracking-wider">
                    PENDIENTE
                  </Badge>
                  <span className="text-2xs text-amber-800 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Previo a tu primera consulta
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Cuestionario Clínico de Alta</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Eva necesita conocer tus hábitos, medicación, digestión y objetivos para preparar tu estudio nutricional.
                  </p>
                </div>
                <Link href="/paciente/cuestionarios/alta" className="block pt-1">
                  <Button className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-2 shadow-xs transition-all active:scale-[0.98]">
                    <span>Completar cuestionario ahora</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Card>
            )}

            {/* Aviso Consentimientos Pendientes de Firma */}
            {pendingConsents.map((consent) => (
              <Card key={consent.id} className="rounded-3xl border-blue-200/90 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 shadow-xs p-6 space-y-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-3xs font-black uppercase tracking-wider">
                    FIRMA REQUERIDA
                  </Badge>
                  <span className="text-2xs text-blue-800 font-semibold">Versión {consent.version}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{consent.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Consentimiento informado obligatorio para la aplicación de dietoterapia y tratamiento de datos de salud.
                  </p>
                </div>
                <div className="pt-1">
                  <Button
                    onClick={() => setSigningConsentId(consent.id)}
                    className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-xs transition-all active:scale-[0.98]"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Firmar en pantalla</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Estado al día cuando no hay tareas requeridas */}
      {!isAnamnesisPending && pendingConsents.length === 0 && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/50 via-white to-white shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-950">Todo al día</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              No tienes ningún cuestionario ni firma pendiente de completar en este momento. Eva te notificará directamente si necesita que rellenes información antes de tu próxima consulta.
            </p>
          </div>
        </div>
      )}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Historial de Cuestionarios y Firmas Realizadas
        </h3>

        <div className="glass-card rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {/* Cuestionario de alta completado */}
          {isAnamnesisCompleted && (
            <div className="p-4 sm:p-5 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Cuestionario Clínico de Alta</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Completado{' '}
                    {anamnesisCompletedAt
                      ? `el ${new Date(anamnesisCompletedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : 'correctamente'}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-2xs font-bold">
                ✓ Respondido
              </Badge>
            </div>
          )}

          {/* Consentimientos firmados */}
          {signedConsents.map((c) => (
            <div key={c.id} className="p-4 sm:p-5 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Firmado digitalmente{' '}
                    {c.acceptedAt
                      ? `el ${new Date(c.acceptedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : 'en el portal'}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="text-2xs font-bold">
                ✓ Firmado
              </Badge>
            </div>
          ))}

          {!isAnamnesisCompleted && signedConsents.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Aún no tienes cuestionarios ni documentos firmados en tu historial.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Firmar en Pantalla */}
      {signingConsentId && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 border border-blue-100 shadow-2xs">
              <FileSignature className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Firma de Consentimiento
            </h3>
            <p className="text-xs text-slate-600 mt-1 mb-5 leading-relaxed">
              Al escribir tu nombre y apellidos a continuación, confirmas tu conformidad y firma digital vinculante
              para este documento clínico. Se registrará la fecha, hora e IP de conexión.
            </p>

            <form onSubmit={handleSignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre y Apellidos completos (Firma)
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ej: María Gómez Rodríguez"
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSigningConsentId(null)}
                  className="rounded-xl text-xs h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !signatureName.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 shadow-xs transition-all active:scale-[0.98]"
                >
                  {loading ? 'Registrando...' : 'Confirmar y Firmar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
