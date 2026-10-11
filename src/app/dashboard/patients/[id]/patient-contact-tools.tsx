'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Send,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  FileCheck,
} from 'lucide-react'
import { sendAnamnesisEmailAction, markAnamnesisSentAction } from '../email-actions'
import { AnamnesisViewerModal, type AnamnesisSubmissionItem } from './anamnesis-viewer-modal'

interface Props {
  patient: {
    id: string
    name: string
    email?: string | null
    professionalEmail?: string | null
    professionalName?: string | null
    anamnesisStatus?: string | null
    anamnesisSentAt?: Date | string | null
    anamnesisCompletedAt?: Date | string | null
    anamnesisSubmissions?: AnamnesisSubmissionItem[]
  }
}

export function PatientContactTools({ patient }: Props) {
  const [patientEmail, setPatientEmail] = useState(patient.email || '')
  const [professionalEmail, setProfessionalEmail] = useState(
    patient.professionalEmail || 'consulta@nutripro.local'
  )
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'NOT_SENT' | 'PENDING' | 'COMPLETED'>(
    (patient.anamnesisStatus as any) ||
      (patient.anamnesisSubmissions && patient.anamnesisSubmissions.length > 0
        ? 'COMPLETED'
        : 'NOT_SENT')
  )
  const [sentAt, setSentAt] = useState<Date | string | null>(patient.anamnesisSentAt || null)
  const [completedAt, setCompletedAt] = useState<Date | string | null>(
    patient.anamnesisCompletedAt || null
  )
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const submissions = patient.anamnesisSubmissions || []
  const hasCompletedSubmission = status === 'COMPLETED' || submissions.length > 0

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const anamnesisUrl = `${origin}/anamnesis?patientId=${patient.id}`
  const firstName = patient.name.split(' ')[0]

  const emailSubject = `Cuestionario Clínico Pre-Consulta - ${patient.professionalName || 'Consulta de Nutrición'}`
  const emailBody = `Hola ${firstName},\n\nPara preparar tu consulta nutricional y diseñar un menú personalizado adaptado a tus gustos, horarios y necesidades, por favor completa tu cuestionario de salud en el siguiente enlace:\n\n${anamnesisUrl}\n\nSolo te llevará 3-5 minutos y nos permitirá comenzar directamente con tu planificación.\n\nAtentamente,\n${patient.professionalName || 'Tu Nutricionista'}`
  const mailtoUrl = `mailto:${encodeURIComponent(patientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  const handleSendEmail = async () => {
    if (!patientEmail || !patientEmail.includes('@')) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, introduce una dirección de correo electrónico válida para la paciente.',
      })
      return
    }

    setLoading(true)
    setStatusMessage(null)

    try {
      const res = await sendAnamnesisEmailAction({
        patientId: patient.id,
        patientEmail,
        professionalEmail,
        professionalName: patient.professionalName || undefined,
        baseUrl: origin,
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message,
        })
        if (status !== 'COMPLETED') {
          setStatus('PENDING')
          setSentAt(new Date())
        }
      } else {
        setStatusMessage({
          type: 'info',
          text: res.message,
        })
        if (status !== 'COMPLETED') {
          setStatus('PENDING')
          setSentAt(new Date())
        }
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al procesar el envío: ${err?.message || 'Error desconocido'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenMailClient = async () => {
    if (!patientEmail) {
      alert('Introduce primero el correo de la paciente.')
      return
    }
    await markAnamnesisSentAction(patient.id)
    if (status !== 'COMPLETED') {
      setStatus('PENDING')
      setSentAt(new Date())
    }
  }

  const copyAnamnesisLink = () => {
    navigator.clipboard.writeText(anamnesisUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border-b border-gray-100 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>Cuestionario de Anamnesis Pre-Consulta</span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Envía el formulario por correo a la paciente y revisa sus respuestas sin alterar tu ficha técnica
                </CardDescription>
              </div>
            </div>

            {/* Insignias de Estado del Cuestionario */}
            <div className="flex items-center gap-2 flex-wrap">
              {hasCompletedSubmission ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Rellenado por la Paciente {completedAt ? `(${formatDate(completedAt)})` : ''}</span>
                  </Badge>
                  {/* Botón Destacado para Ver Cuestionario Relleno */}
                  <AnamnesisViewerModal
                    patientName={patient.name}
                    submissions={submissions}
                  />
                </div>
              ) : status === 'PENDING' ? (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pendiente de Respuesta {sentAt ? `(Enviado ${formatDate(sentAt)})` : ''}</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 font-medium rounded-full px-3 py-1 text-2xs">
                  No Enviado Aún
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Formulario de envío de correo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Correo de la Paciente (Destinatario)</span>
                {patient.email ? (
                  <span className="text-2xs text-emerald-600 font-normal">Registrado</span>
                ) : (
                  <span className="text-2xs text-amber-600 font-normal">Pendiente de añadir</span>
                )}
              </Label>
              <Input
                type="email"
                placeholder="ejemplo@paciente.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Tu Correo Profesional (Remitente)
              </Label>
              <Input
                type="email"
                value={professionalEmail}
                onChange={(e) => setProfessionalEmail(e.target.value)}
                placeholder="tuconsulta@gmail.com"
                className="h-9 text-xs rounded-xl bg-gray-50/70"
              />
            </div>
          </div>

          {/* Mensaje de estado / Alerta */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="font-medium">{statusMessage.text}</p>
                {statusMessage.type === 'info' && (
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={mailtoUrl}
                      onClick={handleOpenMailClient}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-2xs transition-all shadow-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Abrir mi Gestor de Correo con Plantilla Lista</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones principales */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <Button
              type="button"
              onClick={handleSendEmail}
              disabled={loading || !patientEmail}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>Enviar Cuestionario por Correo</span>
            </Button>

            <a
              href={patientEmail ? mailtoUrl : '#'}
              onClick={handleOpenMailClient}
              className={`h-9 px-3.5 rounded-xl border border-gray-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                patientEmail
                  ? 'bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
              <span>Abrir en Gmail / Outlook</span>
            </a>

            <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1" />

            <a
              href={`/anamnesis?patientId=${patient.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Smartphone className="h-3.5 w-3.5 text-gray-600" />
              <span>Modo Tablet (En Consulta)</span>
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyAnamnesisLink}
              className="h-9 px-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copiedLink ? 'Enlace Copiado' : 'Copiar Enlace'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
