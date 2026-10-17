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
  Eye,
  User,
  Phone,
  Plus,
  RefreshCw,
  Loader2,
  X,
  Sparkles,
  FileText,
  Filter,
  FileSignature,
  Dumbbell,
  Baby,
  HeartHandshake,
  ShieldAlert,
  CalendarCheck,
  Star,
  Check,
} from 'lucide-react'
import {
  sendQuestionnaireToPortalAction,
  sendConsentToPortalAction,
} from './actions'
import { QuestionnaireReviewModal } from './review-modal'
import { BUILT_IN_TEMPLATES } from '@/lib/clinical/questionnaire-templates'

export interface QuestionnairePatient {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  sex?: string | null
  birthDate?: string | null
  // 5.4 Estados independientes de 4 fases
  questionnaireStatus: 'NOT_SENT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED'
  consentStatus: 'NOT_SENT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED'
  pendingReviewFieldsCount: number
  anamnesisStatus?: string
  anamnesisSentAt?: string | null
  anamnesisCompletedAt?: string | null
  patientQuestionnaires?: Array<{
    id: string
    type: string
    title: string
    status: string
    sentAt: string | null
    openedAt: string | null
    completedAt: string | null
    pendingFieldsCount: number
    reviewedFieldsCount: number
    isReopened: boolean
    redFlagsJson?: string | null
    answersJson?: string | null
  }>
  consents?: Array<{
    id: string
    type: string
    title: string
    version: string
    status: string
    accepted: boolean
    acceptedAt: string | null
    sentAt: string | null
    viewedAt: string | null
  }>
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_SENT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_REVIEW'>('ALL')

  // Send questionnaire template modal
  const [selectedPatient, setSelectedPatient] = useState<QuestionnairePatient | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('ALTA')
  const [sendingLoading, setSendingLoading] = useState(false)

  // Review modal state
  const [reviewingItem, setReviewingItem] = useState<{
    patientId: string
    questionnaireId: string
    patientName: string
  } | null>(null)

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // Counters
  const counts = useMemo(() => {
    let notSent = 0
    let sent = 0
    let inProgress = 0
    let completed = 0
    let pendingReview = 0

    patients.forEach((p) => {
      const qStatus = p.questionnaireStatus || 'NOT_SENT'
      if (qStatus === 'NOT_SENT') notSent++
      else if (qStatus === 'SENT') sent++
      else if (qStatus === 'IN_PROGRESS') inProgress++
      else if (qStatus === 'COMPLETED') completed++

      if (p.pendingReviewFieldsCount > 0) pendingReview++
    })

    return {
      total: patients.length,
      notSent,
      sent,
      inProgress,
      completed,
      pendingReview,
    }
  }, [patients])

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const qStatus = p.questionnaireStatus || 'NOT_SENT'

      if (statusFilter === 'NOT_SENT' && qStatus !== 'NOT_SENT') return false
      if (statusFilter === 'SENT' && qStatus !== 'SENT') return false
      if (statusFilter === 'IN_PROGRESS' && qStatus !== 'IN_PROGRESS') return false
      if (statusFilter === 'COMPLETED' && qStatus !== 'COMPLETED') return false
      if (statusFilter === 'PENDING_REVIEW' && (p.pendingReviewFieldsCount || 0) <= 0) return false

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

  // Enviar Cuestionario al portal del paciente (5.4)
  const handleSendQuestionnaire = async () => {
    if (!selectedPatient) return
    setSendingLoading(true)
    try {
      const res = await sendQuestionnaireToPortalAction(selectedPatient.id, selectedTemplateType)
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `¡Cuestionario enviado directamente al portal de ${selectedPatient.firstName}! El paciente verá el aviso al iniciar sesión.`,
        })
        setPatients((prev) =>
          prev.map((p) =>
            p.id === selectedPatient.id
              ? {
                  ...p,
                  questionnaireStatus: 'SENT',
                  patientQuestionnaires: [
                    {
                      id: res.id,
                      type: selectedTemplateType,
                      title: BUILT_IN_TEMPLATES.find((t) => t.type === selectedTemplateType)?.title || 'Cuestionario',
                      status: 'SENT',
                      sentAt: new Date().toISOString(),
                      openedAt: null,
                      completedAt: null,
                      pendingFieldsCount: 0,
                      reviewedFieldsCount: 0,
                      isReopened: false,
                    },
                    ...(p.patientQuestionnaires || []),
                  ],
                }
              : p
          )
        )
        setIsTemplateModalOpen(false)
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error al enviar cuestionario al portal' })
    } finally {
      setSendingLoading(false)
    }
  }

  // Enviar Consentimiento para Firma digital en el portal (5.4)
  const handleSendConsent = async (patient: QuestionnairePatient) => {
    try {
      const res = await sendConsentToPortalAction(patient.id)
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Consentimiento informado enviado al portal de ${patient.firstName}. Verá el aviso de «Documento pendiente de firma».`,
        })
        setPatients((prev) =>
          prev.map((p) => (p.id === patient.id ? { ...p, consentStatus: 'SENT' } : p))
        )
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error al enviar consentimiento' })
    }
  }

  // Abrir modal de revisión para el cuestionario activo de un paciente
  const handleOpenReview = (patient: QuestionnairePatient) => {
    const activeQ = patient.patientQuestionnaires?.[0]
    if (!activeQ) return
    setReviewingItem({
      patientId: patient.id,
      questionnaireId: activeQ.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
    })
  }

  // Render badge de estado de 4 fases para Cuestionario (5.4)
  const renderQuestionnaireStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>HECHO (COMPLETADO)</span>
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>PENDIENTE DE HACER</span>
          </Badge>
        )
      case 'SENT':
        return (
          <Badge className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-600" />
            <span>ENVIADO AL PORTAL</span>
          </Badge>
        )
      case 'NOT_SENT':
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border border-gray-300 font-medium px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>NO ENVIADO</span>
          </Badge>
        )
    }
  }

  // Render badge de estado de 4 fases para Firma (5.4)
  const renderConsentStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>FIRMADO</span>
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>PENDIENTE DE FIRMA</span>
          </Badge>
        )
      case 'SENT':
        return (
          <Badge className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-600" />
            <span>ENVIADO AL PORTAL</span>
          </Badge>
        )
      case 'NOT_SENT':
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border border-gray-300 font-medium px-2.5 py-0.5 rounded-full text-2xs inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>NO ENVIADO</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Control de Cuestionarios y Firmas</h1>
            <Badge variant="medical" className="text-3xs font-black uppercase">
              Módulo 5.4
            </Badge>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Gestión independiente del cuestionario clínico y la firma de consentimientos dentro del portal del paciente.
            Revisión lado a lado antes de escribir en la ficha oficial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (patients.length > 0) {
                setSelectedPatient(patients[0])
                setIsTemplateModalOpen(true)
              }
            }}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 h-10 px-5 shadow-xs shrink-0 active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Cuestionario</span>
          </Button>
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

      {/* Metric Cards Grid: 4 Fases + N Campos por Revisar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Pacientes */}
        <Card
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-3xl border-gray-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'bg-white'
          }`}
        >
          <CardContent className="p-4">
            <span className="text-3xs font-bold text-gray-400 uppercase tracking-wider block">Total Pacientes</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{counts.total}</span>
            <span className="text-3xs text-gray-400 font-semibold block mt-1">En seguimiento</span>
          </CardContent>
        </Card>

        {/* No Enviado */}
        <Card
          onClick={() => setStatusFilter('NOT_SENT')}
          className={`rounded-3xl border-gray-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'NOT_SENT' ? 'ring-2 ring-gray-500 bg-gray-50' : 'bg-white'
          }`}
        >
          <CardContent className="p-4">
            <span className="text-3xs font-bold text-gray-500 uppercase tracking-wider block">1. No Enviado</span>
            <span className="text-2xl font-black text-gray-800 mt-1 block">{counts.notSent}</span>
            <span className="text-3xs text-gray-400 font-semibold block mt-1">Pendiente de mandar</span>
          </CardContent>
        </Card>

        {/* Enviado al Portal */}
        <Card
          onClick={() => setStatusFilter('SENT')}
          className={`rounded-3xl border-blue-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'SENT' ? 'ring-2 ring-blue-500 bg-blue-50/40' : 'bg-white'
          }`}
        >
          <CardContent className="p-4">
            <span className="text-3xs font-bold text-blue-700 uppercase tracking-wider block">2. Enviado (Portal)</span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">{counts.sent}</span>
            <span className="text-3xs text-blue-600 font-semibold block mt-1">Aún no abierto</span>
          </CardContent>
        </Card>

        {/* Pendiente de Hacer (Visto) */}
        <Card
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`rounded-3xl border-amber-200 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 bg-amber-50/40' : 'bg-white'
          }`}
        >
          <CardContent className="p-4">
            <span className="text-3xs font-bold text-amber-800 uppercase tracking-wider block">3. Pendiente</span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">{counts.inProgress}</span>
            <span className="text-3xs text-amber-700 font-semibold block mt-1">Visto en el portal</span>
          </CardContent>
        </Card>

        {/* Hecho / Campos por Revisar */}
        <Card
          onClick={() => setStatusFilter('PENDING_REVIEW')}
          className={`rounded-3xl border-rose-300 transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'PENDING_REVIEW' ? 'ring-2 ring-rose-500 bg-rose-50/50' : 'bg-rose-50/20'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-bold text-rose-800 uppercase tracking-wider block">Por Revisar</span>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            </div>
            <span className="text-2xl font-black text-rose-950 mt-1 block">{counts.pendingReview}</span>
            <span className="text-3xs text-rose-700 font-bold block mt-1">Pacientes con campos nuevos</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING_REVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              statusFilter === 'PENDING_REVIEW'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Campos por revisar ({counts.pendingReview})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            Pendiente de hacer ({counts.inProgress})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            Completados ({counts.completed})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar paciente..."
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
                No hay registros que coincidan con el filtro seleccionado.
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
                    <th className="px-6 py-3.5">Estado Cuestionario</th>
                    <th className="px-6 py-3.5">Estado Firma (Consentimiento)</th>
                    <th className="px-6 py-3.5">Revisión Ficha</th>
                    <th className="px-6 py-3.5 text-right">Acciones Eva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPatients.map((patient) => {
                    const hasPendingFields = (patient.pendingReviewFieldsCount || 0) > 0
                    const latestQ = patient.patientQuestionnaires?.[0]
                    const canReview = latestQ && (latestQ.status === 'COMPLETED' || hasPendingFields)

                    return (
                      <tr
                        key={patient.id}
                        className={`transition-colors ${
                          hasPendingFields
                            ? 'bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-amber-500'
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Paciente */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-sm text-gray-700 shrink-0 shadow-2xs">
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
                                {patient.email || patient.phone || 'Sin datos de contacto'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Estado Cuestionario (4 fases independientes) */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {renderQuestionnaireStatusBadge(patient.questionnaireStatus)}
                            {latestQ && (
                              <p className="text-3xs text-gray-400 block">
                                {latestQ.title}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Estado Firma (4 fases independientes) */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {renderConsentStatusBadge(patient.consentStatus)}
                            <p className="text-3xs text-gray-400 block">
                              Consentimiento Informado RGPD
                            </p>
                          </div>
                        </td>

                        {/* N Campos por Revisar (5.4) */}
                        <td className="px-6 py-4">
                          {hasPendingFields ? (
                            <div className="space-y-1">
                              <Badge className="bg-amber-500 text-white font-black text-3xs px-2.5 py-0.5 rounded-full shadow-2xs animate-pulse">
                                {patient.pendingReviewFieldsCount} campos por revisar
                              </Badge>
                              <span className="text-3xs text-gray-400 block">Esperando confirmación</span>
                            </div>
                          ) : (
                            <span className="text-2xs text-gray-400 font-medium">Al día</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botón de revisión lado a lado */}
                            {canReview && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReview(patient)}
                                className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 px-3"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Revisar ({patient.pendingReviewFieldsCount || 'Ver'})</span>
                              </Button>
                            )}

                            {/* Enviar Cuestionario (abre selector de plantillas) */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(patient)
                                setIsTemplateModalOpen(true)
                              }}
                              className="rounded-xl font-bold text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Enviar Cuestionario</span>
                            </Button>

                            {/* Enviar Consentimiento */}
                            {patient.consentStatus !== 'COMPLETED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendConsent(patient)}
                                className="rounded-xl font-bold text-xs border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                                title="Enviar consentimiento al portal para firma"
                              >
                                <FileSignature className="h-3.5 w-3.5" />
                                <span>Firma</span>
                              </Button>
                            )}

                            {/* Enlace Ficha */}
                            <Link href={`/dashboard/patients/${patient.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl font-bold text-xs text-gray-500 hover:text-gray-900"
                              >
                                Ficha
                              </Button>
                            </Link>
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

      {/* MODAL: SELECTOR DE PLANTILLAS DE CUESTIONARIO (5.4) */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-lg font-bold text-gray-900">
              Enviar Cuestionario al Portal: {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Selecciona la plantilla clínica adecuada. El paciente recibirá el aviso en su portal para completarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
            {/* 1. Alta Clínica (Espejo de la Ficha) */}
            <div
              onClick={() => setSelectedTemplateType('ALTA')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplateType === 'ALTA'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Cuestionario de Alta (7 Pasos)</h4>
                  <span className="text-3xs text-gray-400">Espejo completo de la ficha</span>
                </div>
              </div>
              <p className="text-2xs text-gray-600 mt-2 leading-relaxed">
                Datos personales, historial clínico, digestivo, estilo de vida, ejercicio, salud femenina y objetivos.
              </p>
            </div>

            {/* 2. Deportiva */}
            <div
              onClick={() => setSelectedTemplateType('DEPORTIVA')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplateType === 'DEPORTIVA'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Nutrición Deportiva</h4>
                  <span className="text-3xs text-gray-400">Rendimiento y competición</span>
                </div>
              </div>
              <p className="text-2xs text-gray-600 mt-2 leading-relaxed">
                Cargas de entreno, peri-entreno, suplementos, timing y próximos eventos deportivos.
              </p>
            </div>

            {/* 3. Pediátrica */}
            <div
              onClick={() => setSelectedTemplateType('PEDIATRICA')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplateType === 'PEDIATRICA'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                  <Baby className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Nutrición Pediátrica</h4>
                  <span className="text-3xs text-gray-400">Familias y menores</span>
                </div>
              </div>
              <p className="text-2xs text-gray-600 mt-2 leading-relaxed">
                Comedores escolares, texturas, percentiles de crecimiento y entorno de las comidas.
              </p>
            </div>

            {/* 4. Embarazo */}
            <div
              onClick={() => setSelectedTemplateType('EMBARAZO')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplateType === 'EMBARAZO'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Embarazo y Lactancia</h4>
                  <span className="text-3xs text-gray-400">Control gestacional</span>
                </div>
              </div>
              <p className="text-2xs text-gray-600 mt-2 leading-relaxed">
                Semana de gestación, ácido fólico/yodo, curvas de glucosa y náuseas.
              </p>
            </div>

            {/* 5. TCA */}
            <div
              onClick={() => setSelectedTemplateType('TCA')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplateType === 'TCA'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Protocolo TCA</h4>
                  <span className="text-3xs text-gray-400">Conducta y relación emocional</span>
                </div>
              </div>
              <p className="text-2xs text-gray-600 mt-2 leading-relaxed">
                Sin números de calorías: miedos, culpa, conductas compensatorias y hábitos amables.
              </p>
            </div>

            {/* 6. Seguimiento Semanal */}
            <div
              onClick={() => setSelectedTemplateType('SEGUIMIENTO')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplateType === 'SEGUIMIENTO'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Seguimiento Semanal</h4>
                  <span className="text-3xs text-gray-400">Revisión previa a consulta</span>
                </div>
              </div>
              <p className="text-2xs text-gray-600 mt-2 leading-relaxed">
                Adherencia 1-10, digestión, saciedad, dudas para la cita y cambios en medicación.
              </p>
            </div>

            {/* 7. Satisfacción */}
            <div
              onClick={() => setSelectedTemplateType('SATISFACCION')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplateType === 'SATISFACCION'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Satisfacción y Calidad</h4>
                  <span className="text-3xs text-gray-400">Valoración del paciente</span>
                </div>
              </div>
              <p className="text-2xs text-gray-600 mt-2 leading-relaxed">
                Estrellas, facilidad del portal, recetas, claridad y sugerencias de mejora.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-3">
            <Button variant="ghost" onClick={() => setIsTemplateModalOpen(false)} className="rounded-2xl text-xs">
              Cancelar
            </Button>
            <Button
              onClick={handleSendQuestionnaire}
              disabled={sendingLoading}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5"
            >
              {sendingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Confirmar Envío al Portal</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: PANTALLA DE REVISIÓN LADO A LADO (5.4) */}
      {reviewingItem && (
        <QuestionnaireReviewModal
          patientId={reviewingItem.patientId}
          questionnaireId={reviewingItem.questionnaireId}
          patientName={reviewingItem.patientName}
          open={Boolean(reviewingItem)}
          onOpenChange={(open) => {
            if (!open) setReviewingItem(null)
          }}
          onComplete={() => {
            // Refrescar pacientes
            setPatients((prev) =>
              prev.map((p) =>
                p.id === reviewingItem.patientId
                  ? {
                      ...p,
                      pendingReviewFieldsCount: Math.max(0, p.pendingReviewFieldsCount - 1),
                    }
                  : p
              )
            )
          }}
        />
      )}
    </div>
  )
}
