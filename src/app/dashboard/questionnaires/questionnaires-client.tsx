'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ClipboardCheck,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  Eye,
  User,
  Phone,
  Plus,
  RefreshCw,
  Loader2,
  X,
  Sparkles,
  MessageSquare,
  FileText,
  Filter,
} from 'lucide-react'
import { sendAnamnesisEmailAction } from '@/app/dashboard/patients/email-actions'
import { AnamnesisViewerModal, type AnamnesisSubmissionItem } from '@/app/dashboard/patients/[id]/anamnesis-viewer-modal'

export interface QuestionnairePatient {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  anamnesisStatus: 'NOT_SENT' | 'PENDING' | 'COMPLETED' | string
  anamnesisSentAt: Date | string | null
  anamnesisCompletedAt: Date | string | null
  anamnesisSubmissions?: AnamnesisSubmissionItem[]
}

interface QuestionnairesClientProps {
  initialPatients: QuestionnairePatient[]
  professionalEmail: string
  professionalName: string
}

export function QuestionnairesClient({
  initialPatients,
  professionalEmail,
  professionalName,
}: QuestionnairesClientProps) {
  const [patients, setPatients] = useState<QuestionnairePatient[]>(initialPatients)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_SENT' | 'PENDING' | 'COMPLETED'>('ALL')
  
  // Send modal state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [modalEmail, setModalEmail] = useState<string>('')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Viewer modal state
  const [viewingPatient, setViewingPatient] = useState<QuestionnairePatient | null>(null)

  // Feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nutripro-lyart.vercel.app'

  // Counters
  const counts = useMemo(() => {
    let notSent = 0
    let pending = 0
    let completed = 0

    patients.forEach((p) => {
      const status = p.anamnesisStatus || 'NOT_SENT'
      if (status === 'COMPLETED' || (p.anamnesisSubmissions && p.anamnesisSubmissions.length > 0)) {
        completed++
      } else if (status === 'PENDING') {
        pending++
      } else {
        notSent++
      }
    })

    return {
      total: patients.length,
      notSent,
      pending,
      completed,
    }
  }, [patients])

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const isCompleted = p.anamnesisStatus === 'COMPLETED' || (p.anamnesisSubmissions && p.anamnesisSubmissions.length > 0)
      const isPending = p.anamnesisStatus === 'PENDING' && !isCompleted
      const isNotSent = !isCompleted && !isPending

      if (statusFilter === 'NOT_SENT' && !isNotSent) return false
      if (statusFilter === 'PENDING' && !isPending) return false
      if (statusFilter === 'COMPLETED' && !isCompleted) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
        const email = (p.email || '').toLowerCase()
        const phone = (p.phone || '').toLowerCase()
        if (!fullName.includes(q) && !email.includes(q) && !phone.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [patients, statusFilter, searchQuery])

  // Open send modal for a specific patient or general
  const handleOpenSendModal = (patient?: QuestionnairePatient) => {
    if (patient) {
      setSelectedPatientId(patient.id)
      setModalEmail(patient.email || '')
    } else {
      // Pick first patient who hasn't been sent the form, or first patient
      const firstNotSent = patients.find((p) => p.anamnesisStatus === 'NOT_SENT')
      const target = firstNotSent || patients[0]
      if (target) {
        setSelectedPatientId(target.id)
        setModalEmail(target.email || '')
      } else {
        setSelectedPatientId('')
        setModalEmail('')
      }
    }
    setIsSendModalOpen(true)
  }

  // Handle patient select in modal
  const handleSelectPatientInModal = (id: string) => {
    setSelectedPatientId(id)
    const p = patients.find((x) => x.id === id)
    if (p) {
      setModalEmail(p.email || '')
    }
  }

  // Send action execution
  const executeSendEmail = async (patientId: string, emailToSend: string) => {
    if (!emailToSend || !emailToSend.includes('@')) {
      setFeedback({
        type: 'error',
        message: 'Por favor, introduce un correo electrónico válido para enviar el cuestionario.',
      })
      return
    }

    setSendingId(patientId)
    setFeedback(null)

    try {
      const res = await sendAnamnesisEmailAction({
        patientId,
        patientEmail: emailToSend,
        professionalEmail,
        professionalName,
        baseUrl: origin,
      })

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `¡Cuestionario enviado correctamente a ${emailToSend}!`,
        })

        // Update local state
        setPatients((prev) =>
          prev.map((p) => {
            if (p.id === patientId) {
              return {
                ...p,
                email: emailToSend,
                anamnesisStatus: 'PENDING',
                anamnesisSentAt: new Date(),
              }
            }
            return p
          })
        )
        setIsSendModalOpen(false)
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'No se pudo enviar el correo.',
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Error al enviar: ${err?.message || 'Error del servidor'}`,
      })
    } finally {
      setSendingId(null)
    }
  }

  // Quick send directly from row
  const handleDirectSend = (patient: QuestionnairePatient) => {
    if (!patient.email) {
      handleOpenSendModal(patient)
      return
    }
    executeSendEmail(patient.id, patient.email)
  }

  // Copy WhatsApp invitation message
  const handleCopyWhatsAppLink = (patient: QuestionnairePatient) => {
    const url = `${origin}/anamnesis?patientId=${patient.id}`
    const msg = `Hola ${patient.firstName},\n\nPara preparar tu consulta nutricional con ${professionalName} y diseñar tu menú a medida, por favor completa tu cuestionario de salud previo en este enlace:\n\n${url}\n\nSolo te llevará 3 minutos y nos permitirá preparar tu pauta antes de la cita.`

    navigator.clipboard.writeText(msg)
    setCopiedId(patient.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-600 text-white rounded-full px-3 text-xs font-bold shadow-2xs">
              Módulo Pre-Consulta
            </Badge>
            <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Remisión directa desde {professionalEmail}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Control de Cuestionarios Pre-Consulta (Anamnesis)
          </h1>
          <p className="text-sm text-gray-500 max-w-3xl mt-1 leading-relaxed">
            Envía y supervisa el cuestionario clínico antes de la primera cita de cada paciente.
            <strong className="text-rose-600 font-bold ml-1">
              Los pacientes sin cuestionario enviado aparecen destacados en rojo
            </strong> para un control visual inmediato.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => handleOpenSendModal()}
            className="rounded-2xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2 px-4 py-2.5 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Enviar Cuestionario a un Paciente</span>
          </Button>

          <Link href="/dashboard/patients/new">
            <Button
              variant="outline"
              className="rounded-2xl font-bold text-xs border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Paciente</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in-50 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-gray-500 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pacientes */}
        <Card
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-3xl border-gray-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'bg-white'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pacientes</span>
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <User className="h-4 w-4" />
              </div>
            </div>
            <span className="text-3xl font-black text-gray-900">{counts.total}</span>
            <span className="text-xs text-gray-400 block mt-1 font-semibold">En expediente activo</span>
          </CardContent>
        </Card>

        {/* Sin Enviar (ROJO) */}
        <Card
          onClick={() => setStatusFilter('NOT_SENT')}
          className={`rounded-3xl border-rose-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'NOT_SENT' ? 'ring-2 ring-rose-500 bg-rose-50/40' : 'bg-rose-50/15'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                Sin Enviar (En Rojo)
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <span className="text-3xl font-black text-rose-950">{counts.notSent}</span>
            <span className="text-xs text-rose-700 font-bold block mt-1">
              {counts.notSent === 1 ? 'Requiere envío previo' : 'Requieren envío previo'}
            </span>
          </CardContent>
        </Card>

        {/* Enviados (En espera) */}
        <Card
          onClick={() => setStatusFilter('PENDING')}
          className={`rounded-3xl border-amber-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'PENDING' ? 'ring-2 ring-amber-500 bg-amber-50/30' : 'bg-amber-50/15'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">En Espera</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <span className="text-3xl font-black text-amber-950">{counts.pending}</span>
            <span className="text-xs text-amber-700 font-semibold block mt-1">Enviado al paciente</span>
          </CardContent>
        </Card>

        {/* Respondidos / Completados */}
        <Card
          onClick={() => setStatusFilter('COMPLETED')}
          className={`rounded-3xl border-emerald-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 bg-emerald-50/30' : 'bg-emerald-50/15'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Completados</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <span className="text-3xl font-black text-emerald-950">{counts.completed}</span>
            <span className="text-xs text-emerald-700 font-semibold block mt-1">Respuestas disponibles</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
            }`}
          >
            Todos ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('NOT_SENT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'NOT_SENT'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-100/70 text-rose-800 hover:bg-rose-200/80'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            No enviados ({counts.notSent})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200/80'
            }`}
          >
            Enviados / En espera ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200/80'
            }`}
          >
            Respondidos ({counts.completed})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por paciente, email..."
            className="pl-9.5 pr-8 rounded-2xl text-xs h-9 bg-gray-50 border-gray-200 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Central Table / Patient Card List */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardContent className="p-0">
          {filteredPatients.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No se encontraron pacientes</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                No hay pacientes con el filtro actual o la búsqueda indicada.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL')
                  setSearchQuery('')
                }}
                className="rounded-xl text-xs font-bold"
              >
                Limpiar Filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-black uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3.5">Paciente</th>
                    <th className="px-6 py-3.5">Contacto</th>
                    <th className="px-6 py-3.5">Estado del Cuestionario</th>
                    <th className="px-6 py-3.5 text-right">Acciones Directas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPatients.map((patient) => {
                    const isCompleted =
                      patient.anamnesisStatus === 'COMPLETED' ||
                      (patient.anamnesisSubmissions && patient.anamnesisSubmissions.length > 0)
                    const isPending = patient.anamnesisStatus === 'PENDING' && !isCompleted
                    const isNotSent = !isCompleted && !isPending
                    const isSending = sendingId === patient.id

                    return (
                      <tr
                        key={patient.id}
                        className={`transition-colors ${
                          isNotSent
                            ? 'bg-rose-50/30 hover:bg-rose-50/60 border-l-4 border-l-rose-500'
                            : isPending
                            ? 'bg-amber-50/15 hover:bg-amber-50/40 border-l-4 border-l-amber-400'
                            : 'hover:bg-gray-50/80 border-l-4 border-l-emerald-500'
                        }`}
                      >
                        {/* Paciente */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                                isNotSent
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {patient.firstName.charAt(0)}
                              {patient.lastName.charAt(0)}
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/patients/${patient.id}`}
                                className="font-bold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                              >
                                <span>
                                  {patient.firstName} {patient.lastName}
                                </span>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                              </Link>
                              <span className="text-[11px] text-gray-400 block font-medium">
                                ID: {patient.id.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            {patient.email ? (
                              <span className="text-xs text-gray-800 font-semibold flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                {patient.email}
                              </span>
                            ) : (
                              <span className="text-xs text-rose-600 italic font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Sin correo registrado
                              </span>
                            )}
                            {patient.phone && (
                              <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                {patient.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Estado con colores estrictos */}
                        <td className="px-6 py-4">
                          {isNotSent && (
                            <div className="space-y-1">
                              <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-black px-3 py-1 rounded-full text-xs shadow-2xs inline-flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                                <span>NO ENVIADO</span>
                              </Badge>
                              <p className="text-[11px] text-rose-700 font-bold block">
                                Requiere envío antes de la cita
                              </p>
                            </div>
                          )}

                          {isPending && (
                            <div className="space-y-1">
                              <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-3 py-1 rounded-full text-xs shadow-2xs inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                <span>ENVIADO (EN ESPERA)</span>
                              </Badge>
                              {patient.anamnesisSentAt && (
                                <p className="text-[11px] text-gray-500 font-medium block">
                                  Enviado el {formatDate(patient.anamnesisSentAt)}
                                </p>
                              )}
                            </div>
                          )}

                          {isCompleted && (
                            <div className="space-y-1">
                              <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-black px-3 py-1 rounded-full text-xs shadow-2xs inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>COMPLETADO / RESPONDIDO</span>
                              </Badge>
                              {patient.anamnesisCompletedAt && (
                                <p className="text-[11px] text-gray-500 font-medium block">
                                  Recibido el {formatDate(patient.anamnesisCompletedAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Actions for NOT_SENT (Red) */}
                            {isNotSent && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleDirectSend(patient)}
                                  disabled={isSending}
                                  className="rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
                                >
                                  {isSending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Send className="h-3.5 w-3.5" />
                                  )}
                                  <span>Enviar Cuestionario</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyWhatsAppLink(patient)}
                                  className="rounded-xl font-bold text-xs border-gray-200 hover:bg-gray-50 flex items-center gap-1"
                                  title="Copiar texto para WhatsApp"
                                >
                                  {copiedId === patient.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      <span className="text-emerald-700 text-[11px]">Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-[11px]">WhatsApp</span>
                                    </>
                                  )}
                                </Button>
                              </>
                            )}

                            {/* Actions for PENDING */}
                            {isPending && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDirectSend(patient)}
                                  disabled={isSending}
                                  className="rounded-xl font-bold text-xs border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5"
                                >
                                  {isSending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  )}
                                  <span>Reenviar</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyWhatsAppLink(patient)}
                                  className="rounded-xl font-bold text-xs border-gray-200 hover:bg-gray-50 flex items-center gap-1"
                                  title="Copiar texto para WhatsApp"
                                >
                                  {copiedId === patient.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      <span className="text-emerald-700 text-[11px]">Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                                      <span className="text-[11px]">WhatsApp</span>
                                    </>
                                  )}
                                </Button>
                              </>
                            )}

                            {/* Actions for COMPLETED */}
                            {isCompleted && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setViewingPatient(patient)}
                                  className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 px-3"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Ver Respuestas</span>
                                </Button>

                                <Link href={`/dashboard/patients/${patient.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl font-bold text-xs border-gray-200 hover:bg-gray-50"
                                  >
                                    Ficha
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
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

      {/* =========================================================================
          MODAL: ENVIAR CUESTIONARIO A UN PACIENTE ESPECÍFICO
          ========================================================================= */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>Enviar Cuestionario Pre-Consulta</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Selecciona el paciente y confirma el correo electrónico para enviarle el formulario médico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Paciente Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Seleccionar Paciente:</label>
              <select
                value={selectedPatientId}
                onChange={(e) => handleSelectPatientInModal(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {patients.map((p) => {
                  const isNotSent = p.anamnesisStatus === 'NOT_SENT' || !p.anamnesisStatus
                  return (
                    <option key={p.id} value={p.id}>
                      {isNotSent ? '🔴 ' : p.anamnesisStatus === 'COMPLETED' ? '🟢 ' : '🟡 '}
                      {p.firstName} {p.lastName} {isNotSent ? '(Sin enviar)' : `(${p.anamnesisStatus})`}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Correo Electrónico del Paciente:</label>
              <Input
                type="email"
                value={modalEmail}
                onChange={(e) => setModalEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="text-xs rounded-xl"
              />
              <p className="text-[11px] text-gray-400">
                Se enviará automáticamente desde <strong className="text-gray-700">{professionalEmail}</strong> con enlace personal seguro.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSendModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => executeSendEmail(selectedPatientId, modalEmail)}
              disabled={!selectedPatientId || !modalEmail || sendingId !== null}
              className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
            >
              {sendingId ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar Correo Ahora</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: VISOR DETALLADO DE RESPUESTAS DE ANAMNESIS (PARA PACIENTE COMPLETADO)
          ========================================================================= */}
      {viewingPatient && (
        <AnamnesisViewerModal
          open={Boolean(viewingPatient)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewingPatient(null)
          }}
          showTriggerButton={false}
          patientName={`${viewingPatient.firstName} ${viewingPatient.lastName}`}
          submissions={viewingPatient.anamnesisSubmissions || []}
        />
      )}
    </div>
  )
}
