'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  CalendarCheck,
  User,
  Loader2,
  Check,
  Send,
  Bell,
  Sparkles,
} from 'lucide-react'
import {
  createAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  resendAppointmentEmail,
  sendAppointmentReminder,
  sendUpcomingReminders24h,
  type CreateAppointmentInput,
} from './actions'
import { generateGoogleCalendarUrl } from '@/lib/calendar-utils'

interface PatientOption {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
}

interface AppointmentItem {
  id: string
  patientId: string
  date: Date | string
  durationMin: number
  modality: string
  status: string
  location: string | null
  notes: string | null
  emailSent: boolean
  emailSentAt: Date | string | null
  reminderSent?: boolean
  reminderSentAt?: Date | string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  }
}


export function AppointmentManager({
  initialAppointments,
  patients,
}: {
  initialAppointments: AppointmentItem[]
  patients: PatientOption[]
}) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments)
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('UPCOMING')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '')
  
  // Default date to tomorrow at 10:00 AM
  const defaultDate = new Date()
  defaultDate.setDate(defaultDate.getDate() + 1)
  defaultDate.setHours(10, 0, 0, 0)
  const defaultIsoString = defaultDate.toISOString().slice(0, 16)

  const [dateStr, setDateStr] = useState(defaultIsoString)
  const [durationMin, setDurationMin] = useState(45)
  const [modality, setModality] = useState<'ONLINE' | 'PRESENCIAL'>('ONLINE')
  const [notes, setNotes] = useState('Primera consulta de valoración nutricional y hábitos')
  const [location, setLocation] = useState('Consulta Nutricional Eva Vidal')
  const [sendEmail, setSendEmail] = useState(true)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  // Filtered list
  const now = new Date()
  const filteredAppointments = appointments.filter((app) => {
    const appDate = new Date(app.date)
    if (filter === 'UPCOMING') return appDate >= now && app.status !== 'CANCELLED'
    if (filter === 'COMPLETED') return app.status === 'COMPLETED' || appDate < now
    return true
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !dateStr) return

    startTransition(async () => {
      try {
        const created = await createAppointment({
          patientId: selectedPatientId,
          date: new Date(dateStr).toISOString(),
          durationMin,
          modality,
          notes,
          location: modality === 'ONLINE' ? 'Videollamada Google Meet' : location,
          sendEmailNotification: sendEmail,
        })

        // Add to local state
        const fullItem: AppointmentItem = {
          ...created,
          patient: selectedPatient || {
            id: selectedPatientId,
            firstName: 'Paciente',
            lastName: '',
            email: null,
            phone: null,
          },
        }

        setAppointments([fullItem, ...appointments])
        setIsModalOpen(false)
        setActionSuccessMessage(
          sendEmail
            ? `Cita agendada y correo enviado con éxito a ${selectedPatient?.email || 'el paciente'}.`
            : 'Cita guardada en la agenda con éxito.'
        )
        setTimeout(() => setActionSuccessMessage(null), 5000)
      } catch (err: any) {
        alert(err.message || 'Error al agendar la cita')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Estás segura de eliminar esta cita de la agenda?')) return

    startTransition(async () => {
      try {
        await deleteAppointment(id)
        setAppointments(appointments.filter((a) => a.id !== id))
      } catch (err: any) {
        alert('Error al eliminar la cita')
      }
    })
  }

  const handleStatusChange = (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(id, status)
        setAppointments(
          appointments.map((a) => (a.id === id ? { ...a, status } : a))
        )
      } catch (err: any) {
        alert('Error al actualizar estado')
      }
    })
  }

  const handleResendEmail = (id: string) => {
    startTransition(async () => {
      try {
        const res = await resendAppointmentEmail(id)
        if (res.success) {
          setAppointments(
            appointments.map((a) => (a.id === id ? { ...a, emailSent: true, emailSentAt: new Date() } : a))
          )
          setActionSuccessMessage('Email de cita reenviado correctamente al paciente con enlace de Google Calendar.')
          setTimeout(() => setActionSuccessMessage(null), 5000)
        } else {
          alert(res.message)
        }
      } catch (err: any) {
        alert(err.message || 'Error al reenviar email')
      }
    })
  }

  const handleSendReminder = (id: string) => {
    startTransition(async () => {
      try {
        const res = await sendAppointmentReminder(id)
        if (res.success) {
          setAppointments(
            appointments.map((a) => (a.id === id ? { ...a, reminderSent: true, reminderSentAt: new Date() } : a))
          )
          setActionSuccessMessage('🔔 Recordatorio de 24h enviado por correo con éxito al paciente.')
          setTimeout(() => setActionSuccessMessage(null), 5000)
        } else {
          alert(res.message)
        }
      } catch (err: any) {
        alert(err.message || 'Error al enviar recordatorio')
      }
    })
  }

  const handleSendBatchReminders = () => {
    if (!confirm('¿Deseas enviar recordatorio de 24h por email a todos los pacientes que tienen cita programada para mañana?')) return

    startTransition(async () => {
      try {
        const res = await sendUpcomingReminders24h()
        if (res.sentCount > 0) {
          setActionSuccessMessage(`🔔 ¡Listo! Se enviaron ${res.sentCount} recordatorios de cita para las consultas de mañana.`)
          setTimeout(() => setActionSuccessMessage(null), 6000)
        } else if (res.totalEligible === 0) {
          setActionSuccessMessage('No hay citas pendientes de recordatorio programadas para mañana.')
          setTimeout(() => setActionSuccessMessage(null), 4000)
        } else {
          alert('Hubo incidencias al procesar los recordatorios.')
        }
      } catch (err: any) {
        alert(err.message || 'Error al procesar recordatorios')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-sm font-semibold shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-blue-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-blue-500 hover:text-blue-800 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setFilter('UPCOMING')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'UPCOMING'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Próximas Citas ({appointments.filter((a) => new Date(a.date) >= now && a.status !== 'CANCELLED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Todas ({appointments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'COMPLETED'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Pasadas / Realizadas
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleSendBatchReminders}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-2xl border-blue-200 bg-blue-50/70 text-blue-800 hover:bg-blue-100 font-bold text-xs shadow-2xs"
            title="Enviar recordatorio automático por email a todos los pacientes con cita mañana"
          >
            <Bell className="h-3.5 w-3.5 text-blue-600" />
            <span>Recordatorios 24h (Mañana)</span>
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Agendar Nueva Cita</span>
          </Button>
        </div>
      </div>


      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="text-center py-16 rounded-3xl border-gray-200">
          <CardContent>
            <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No hay citas en este filtro</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Programa una consulta para tu paciente y se le enviará automáticamente la confirmación con su enlace de Google Calendar.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl">
              <Plus className="h-4 w-4 mr-1.5" />
              Agendar Primera Cita
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAppointments.map((app) => {
            const appDate = new Date(app.date)
            const dateFormatted = appDate.toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            const timeFormatted = appDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })

            const gCalUrl = generateGoogleCalendarUrl({
              title: `Cita de Nutrición: ${app.patient.firstName} ${app.patient.lastName} - Eva Vidal`,
              startDate: appDate,
              durationMin: app.durationMin,
              description: `Consulta Nutricional con Eva Vidal.\nModalidad: ${app.modality}\nNotas: ${app.notes || 'Consulta'}\nContacto: evavidalinfo@gmail.com`,
              location: app.modality === 'ONLINE' ? 'Videollamada Google Meet' : app.location || 'Consulta Nutricional Eva Vidal',
            })

            const isPast = appDate < now

            return (
              <Card
                key={app.id}
                className={`rounded-3xl border transition-all hover:shadow-md ${
                  app.status === 'COMPLETED'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isPast
                    ? 'border-gray-200 bg-gray-50/50 opacity-80'
                    : 'border-blue-200 bg-white hover:border-blue-300'
                }`}
              >
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/patients/${app.patient.id}`}
                      className="group flex items-center gap-2.5 min-w-0"
                    >
                      <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {app.patient.firstName[0]}
                        {app.patient.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate block text-sm">
                          {app.patient.firstName} {app.patient.lastName}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate block">
                          {app.patient.email || 'Sin correo registrado'}
                        </span>
                      </div>
                    </Link>

                    <Badge
                      variant="outline"
                      className={`text-2xs font-bold rounded-full ${
                        app.modality === 'ONLINE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {app.modality === 'ONLINE' ? (
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Presencial
                        </span>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Date & Time pill */}
                  <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-600 text-white">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-blue-950 text-xs block capitalize">
                          {dateFormatted}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeFormatted} h ({app.durationMin} min)
                        </span>
                      </div>
                    </div>

                    {app.status === 'COMPLETED' ? (
                      <Badge className="bg-emerald-600 text-white text-3xs font-bold rounded-full">
                        Realizada
                      </Badge>
                    ) : isPast ? (
                      <Badge variant="secondary" className="text-3xs font-bold rounded-full">
                        Pasada
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-600 text-white text-3xs font-bold rounded-full">
                        Confirmada
                      </Badge>
                    )}
                  </div>

                  {/* Notes / Reason */}
                  {app.notes && (
                    <p className="text-xs text-gray-600 line-clamp-2 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      "{app.notes}"
                    </p>
                  )}

                  {/* Email status tag */}
                  <div className="flex items-center justify-between text-2xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      {app.emailSent ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          ✓ Correo de cita enviado
                        </span>
                      ) : (
                        <span>Correo pendiente</span>
                      )}
                    </span>
                    {app.patient.email && (
                      <button
                        type="button"
                        onClick={() => handleResendEmail(app.id)}
                        disabled={isPending}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                        title="Reenviar correo de confirmación de cita al paciente"
                      >
                        Reenviar
                      </button>
                    )}
                  </div>

                  {/* Reminder 24h status tag */}
                  <div className="flex items-center justify-between text-2xs text-gray-500 pt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Bell className="h-3.5 w-3.5 text-blue-500" />
                      {app.reminderSent ? (
                        <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                          ✓ Recordatorio 24h enviado
                        </span>
                      ) : (
                        <span className="text-gray-400">Recordatorio 24h no enviado</span>
                      )}
                    </span>
                    {app.patient.email && !isPast && app.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleSendReminder(app.id)}
                        disabled={isPending}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        title="Enviar recordatorio de cita (plantilla 24h antes)"
                      >
                        <span>Recordatorio 24h</span>
                      </button>
                    )}
                  </div>

                  {/* Action buttons */}

                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    {/* Add to Google Calendar button (Opens in new tab) */}
                    <a
                      href={gCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 hover:bg-blue-50 text-blue-800 border border-gray-200 hover:border-blue-300 transition-colors"
                      title="Añadir esta cita a tu Google Calendar personal o compartir"
                    >
                      <CalendarCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span>Google Calendar</span>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </a>

                    {/* Toggle completed */}
                    {app.status !== 'COMPLETED' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                        disabled={isPending}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Marcar como realizada / completada"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                        disabled={isPending}
                        className="p-2 text-emerald-600 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        title="Reabrir cita"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(app.id)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar cita"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Agendar Nueva Cita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Agendar Nueva Cita Nutricional</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Asigna día y hora; el paciente recibirá la confirmación con botón de Google Calendar en su correo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Patient Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="patientSelect">Paciente *</Label>
                <Select
                  id="patientSelect"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="rounded-2xl"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} {p.email ? `(${p.email})` : '(Sin email)'}
                    </option>
                  ))}
                </Select>
                {selectedPatient?.email ? (
                  <span className="text-2xs text-blue-700 block font-medium">
                    📧 Correo del paciente: {selectedPatient.email}
                  </span>
                ) : (
                  <span className="text-2xs text-amber-700 block font-medium">
                    ⚠️ Este paciente no tiene correo electrónico guardado.
                  </span>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dateInput">Día y Hora *</Label>
                  <Input
                    id="dateInput"
                    type="datetime-local"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    required
                    className="rounded-2xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="durationSelect">Duración</Label>
                  <Select
                    id="durationSelect"
                    value={durationMin.toString()}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="rounded-2xl"
                  >
                    <option value="30">30 minutos (Revisión exprés)</option>
                    <option value="45">45 minutos (Consulta estándar)</option>
                    <option value="60">60 minutos (Primera consulta)</option>
                    <option value="90">90 minutos (Valoración completa)</option>
                  </Select>
                </div>
              </div>

              {/* Modality & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="modalitySelect">Modalidad</Label>
                  <Select
                    id="modalitySelect"
                    value={modality}
                    onChange={(e) => setModality(e.target.value as any)}
                    className="rounded-2xl"
                  >
                    <option value="ONLINE">💻 Online (Videollamada)</option>
                    <option value="PRESENCIAL">🏥 Presencial en Consulta</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="locInput">Ubicación / Sala</Label>
                  <Input
                    id="locInput"
                    value={modality === 'ONLINE' ? 'Videollamada Google Meet' : location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="rounded-2xl text-xs"
                    disabled={modality === 'ONLINE'}
                  />
                </div>
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notesInput">Motivo o Notas de la Sesión</Label>
                <Textarea
                  id="notesInput"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Revisión mensual de analítica y adaptación de calorías"
                  className="rounded-2xl text-xs"
                />
              </div>

              {/* Send email checkbox */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sendEmailCheck"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={!selectedPatient?.email}
                  className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sendEmailCheck" className="text-xs text-blue-950 font-medium cursor-pointer">
                  <strong>Enviar email de confirmación automático ahora</strong>
                  <span className="block text-2xs text-blue-700 mt-0.5">
                    El paciente recibirá un correo con el diseño oficial de Eva Vidal, los datos de la cita y el botón directo para añadir a su Google Calendar.
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Agendando Cita...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4 mr-1.5" />
                      Guardar y Agendar Cita
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
