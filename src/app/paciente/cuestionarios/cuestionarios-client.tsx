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
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          <span>Cuestionarios Clínicos y Firmas Digitales</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Rellena tu anamnesis clínica antes de consulta y firma los consentimientos informados de forma 100% digital y segura.
        </p>
      </div>

      {/* AVISOS DE PENDIENTES DESTACADOS (PDF pág 13) */}
      {(isAnamnesisPending || pendingConsents.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Acciones pendientes requeridas ({Number(isAnamnesisPending) + pendingConsents.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aviso Cuestionario de Alta Pendiente */}
            {isAnamnesisPending && (
              <Card className="rounded-3xl border-amber-300 bg-gradient-to-r from-amber-50/70 to-white shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-600 text-white border-0 text-3xs font-black rounded-full">
                    PENDIENTE
                  </Badge>
                  <span className="text-2xs text-amber-800 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Previo a tu primera consulta
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Cuestionario Clínico de Alta</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Eva necesita conocer tus hábitos, medicación, digestión y objetivos para preparar tu estudio nutricional.
                  </p>
                </div>
                <Link href="/paciente/cuestionarios/alta">
                  <Button className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 mt-2">
                    <span>Completar cuestionario ahora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </Card>
            )}

            {/* Aviso Consentimientos Pendientes de Firma */}
            {pendingConsents.map((consent) => (
              <Card key={consent.id} className="rounded-3xl border-blue-200 bg-gradient-to-r from-blue-50/70 to-white shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-600 text-white border-0 text-3xs font-black rounded-full">
                    FIRMA REQUERIDA
                  </Badge>
                  <span className="text-2xs text-blue-800 font-semibold">Versión {consent.version}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{consent.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Consentimiento informado obligatorio para la aplicación de dietoterapia y tratamiento de datos de salud.
                  </p>
                </div>
                <Button
                  onClick={() => setSigningConsentId(consent.id)}
                  className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 mt-2"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Firmar en pantalla</span>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* HISTORIAL / DOCUMENTOS YA COMPLETADOS */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Historial de Cuestionarios y Firmas Realizadas
        </h3>

        <div className="bg-white rounded-3xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-2xs">
          {/* Cuestionario de alta completado */}
          {isAnamnesisCompleted && (
            <div className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Cuestionario Clínico de Alta</p>
                  <p className="text-[11px] text-gray-500">
                    Completado{' '}
                    {anamnesisCompletedAt
                      ? `el ${new Date(anamnesisCompletedAt).toLocaleDateString('es-ES')}`
                      : 'correctamente'}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-2xs font-bold rounded-full">
                ✓ Respondido
              </Badge>
            </div>
          )}

          {/* Consentimientos firmados */}
          {signedConsents.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{c.title}</p>
                  <p className="text-[11px] text-gray-500">
                    Firmado digitalmente{' '}
                    {c.acceptedAt
                      ? `el ${new Date(c.acceptedAt).toLocaleDateString('es-ES')}`
                      : 'en el portal'}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-2xs font-bold rounded-full">
                ✓ Firmado
              </Badge>
            </div>
          ))}

          {!isAnamnesisCompleted && signedConsents.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-400">
              Aún no tienes cuestionarios ni documentos firmados en tu historial.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Firmar en Pantalla */}
      {signingConsentId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-blue-600" />
              <span>Firma de Consentimiento</span>
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Al escribir tu nombre y apellidos a continuación, confirmas tu conformidad y firma digital vinculante
              para este documento clínico. Se registrará la fecha, hora e IP de conexión.
            </p>

            <form onSubmit={handleSignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre y Apellidos completos (Firma)
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ej: María Gómez Rodríguez"
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSigningConsentId(null)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !signatureName.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
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
