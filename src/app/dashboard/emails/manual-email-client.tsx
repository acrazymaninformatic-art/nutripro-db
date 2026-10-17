'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Send,
  User,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Eye,
  Edit3,
  FileText,
  Calendar,
  ShieldCheck,
} from 'lucide-react'
import { sendManualEmailAction } from './actions'

interface PatientOption {
  id: string
  firstName: string
  lastName: string
  email: string | null
}

interface EmailLogItem {
  id: string
  recipientEmail: string
  recipientName: string | null
  subject: string
  type: string
  status: string
  errorDetails: string | null
  sentAt: string | Date
  patient?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface Props {
  patients: PatientOption[]
  recentLogs: EmailLogItem[]
}

const TEMPLATES = [
  {
    id: 'custom',
    name: 'Mensaje libre',
    icon: Edit3,
    subject: '',
    message: '',
  },
  {
    id: 'appointment',
    name: 'Recordatorio de cita',
    icon: Calendar,
    subject: 'Recordatorio de tu próxima consulta nutricional · Eva Vidal Nutrición',
    message:
      'Te escribo para recordarte los detalles de tu próxima sesión en la consulta de nutrición.\n\nPor favor, confirma si podrás asistir o si necesitas modificar el horario. Recuerda tener a mano tus analíticas recientes o notas de dudas para revisarlas juntos en la consulta.',
  },
  {
    id: 'plan_ready',
    name: 'Pauta semanal lista',
    icon: Sparkles,
    subject: 'Tu nuevo plan de alimentación ya está disponible · Eva Vidal Nutrición',
    message:
      'He preparado y actualizado tu plan nutricional personalizado con las recetas adaptadas a tus requerimientos y objetivos.\n\nYa puedes consultarlo cómodamente desde tu Portal del Paciente o descargar tu dossier semanal en PDF.',
  },
  {
    id: 'analysis_request',
    name: 'Petición de analítica',
    icon: FileText,
    subject: 'Información previa para tu estudio nutricional · Eva Vidal Nutrición',
    message:
      'Para poder avanzar con tu valoración y diseñar tu estudio clínico con la máxima precisión, te agradecería que me facilites tu analítica de sangre reciente o completes tu cuestionario de salud previo a la consulta.\n\nPuedes enviarla respondiendo a este mismo correo.',
  },
  {
    id: 'welcome',
    name: 'Bienvenida al portal',
    icon: ShieldCheck,
    subject: 'Bienvenida a tu Portal del Paciente · Eva Vidal Nutrición',
    message:
      'Te damos la bienvenida a la plataforma digital de la consulta.\n\nA través de tu espacio privado podrás revisar tus pautas nutricionales, consultar tus citas y seguir tu evolución de manera totalmente confidencial y segura.',
  },
]

export function ManualEmailClient({ patients, recentLogs }: Props) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [recipientEmail, setRecipientEmail] = useState<string>('')
  const [recipientName, setRecipientName] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId)
    if (!patientId) {
      return
    }
    const p = patients.find((pat) => pat.id === patientId)
    if (p) {
      setRecipientName(`${p.firstName} ${p.lastName}`.trim())
      if (p.email) {
        setRecipientEmail(p.email)
      }
    }
  }

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    if (tmpl.id === 'custom') {
      return
    }
    setSubject(tmpl.subject)
    setMessage(tmpl.message)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)

    const formData = new FormData()
    formData.append('recipientEmail', recipientEmail)
    formData.append('recipientName', recipientName)
    formData.append('subject', subject)
    formData.append('message', message)
    if (selectedPatientId) {
      formData.append('patientId', selectedPatientId)
    }

    startTransition(async () => {
      const res = await sendManualEmailAction(formData)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Correo enviado exitosamente.' })
        setSubject('')
        setMessage('')
      } else {
        setFeedback({ type: 'error', message: res.error || 'No se pudo enviar el correo.' })
      }
    })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xs hover-lift">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl shadow-2xs border border-blue-200/60">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Envío de Correos Electrónicos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Envía comunicaciones oficiales, avisos personalizados y recordatorios a cualquier dirección o paciente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-2xs font-bold py-1 px-3 rounded-full">
            ● Servidor SMTP Activo
          </Badge>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Composer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Composer (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Redactar Mensaje</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Puedes seleccionar un paciente de tu lista o introducir directamente cualquier correo.
                </CardDescription>
              </div>

              {/* Toggle Write / Preview */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('write')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'write'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'preview'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Previsualizar</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Plantillas Rápidas */}
              <div className="mb-6 space-y-2">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Plantillas Clínicas Rápidas:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{tmpl.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {viewMode === 'write' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selector de paciente o entrada directa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Seleccionar de mis pacientes
                      </label>
                      <select
                        value={selectedPatientId}
                        onChange={(e) => handlePatientSelect(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Introducir email libremente --</option>
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.lastName}, {p.firstName} {p.email ? `(${p.email})` : '(Sin email)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Nombre del destinatario
                      </label>
                      <Input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Ej. María García"
                        className="rounded-2xl bg-slate-50 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Correo electrónico destinatario *</span>
                      <span className="text-3xs text-slate-400 font-normal">Cualquier email es admitido</span>
                    </label>
                    <Input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="rounded-2xl bg-slate-50 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Asunto del correo *
                    </label>
                    <Input
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej. Tu seguimiento nutricional de esta semana"
                      className="rounded-2xl bg-slate-50 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Mensaje *
                    </label>
                    <Textarea
                      required
                      rows={8}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe aquí el contenido del mensaje. Se formateará automáticamente con la identidad corporativa de Eva Vidal Nutrición y la firma clínica oficial."
                      className="rounded-2xl bg-slate-50 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isPending || !recipientEmail || !subject || !message}
                      className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 py-5 px-6 shadow-xs btn-tactile hover-lift"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isPending ? 'Enviando correo...' : 'Enviar Correo Ahora'}</span>
                    </Button>
                  </div>
                </form>
              ) : (
                /* Live Preview Mode */
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-4 space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Vista previa de recepción por el paciente:
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden max-w-lg mx-auto text-slate-900">
                    <div className="bg-gradient-to-r from-blue-600 to-sky-700 text-white p-5">
                      <div className="text-3xs font-extrabold uppercase tracking-wider text-blue-200">
                        EVSoftware · Eva Vidal Nutrición
                      </div>
                      <div className="text-base font-extrabold mt-1">
                        {subject || '(Sin asunto definido)'}
                      </div>
                    </div>
                    <div className="p-5 space-y-3 text-xs leading-relaxed text-slate-700">
                      <p className="font-bold text-slate-900">
                        Hola, {recipientName || 'Paciente'}:
                      </p>
                      {message ? (
                        message.split('\n').map((line, i) => (
                          <p key={i} className="text-slate-600">
                            {line}
                          </p>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">El mensaje redactado aparecerá aquí...</p>
                      )}

                      <div className="pt-4 border-t border-slate-100 text-3xs text-slate-500">
                        <strong className="text-slate-900 block text-xs">Eva Vidal</strong>
                        <span>Nutrición Clínica y Dietética Personalizada</span>
                        <span className="block text-slate-400 mt-0.5">info@evavidalnutricion.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Information & Recent Deliveries */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-gradient-to-br from-blue-50/50 to-white p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Garantía de Entrega y RGPD</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Todos los correos enviados se entregan de forma autenticada mediante el servidor oficial de la consulta (Gmail SMTP). Cada envío queda registrado con fecha y hora para trazabilidad y auditoría clínica.
            </p>
          </Card>

          {/* Recent Deliveries */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Últimos Envíos Realizados</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay envíos registrados.</p>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto">
                  {recentLogs.slice(0, 10).map((log) => {
                    const isSuccess = log.status === 'SENT'
                    const dateStr = new Date(log.sentAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    return (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate max-w-[150px]">
                            {log.recipientName || log.recipientEmail}
                          </span>
                          <span
                            className={`text-3xs font-bold px-1.5 py-0.5 rounded-md ${
                              isSuccess
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isSuccess ? 'Enviado' : 'Fallo'}
                          </span>
                        </div>
                        <div className="text-3xs text-slate-500 truncate">{log.subject}</div>
                        <div className="text-3xs text-slate-400 font-mono flex items-center justify-between">
                          <span>{log.recipientEmail}</span>
                          <span>{dateStr}</span>
                        </div>
                        {log.errorDetails && (
                          <div className="text-3xs text-rose-600 bg-rose-50 p-1 rounded font-mono">
                            {log.errorDetails}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
