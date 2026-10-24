'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Ban, Bell, Building, Building2, Calendar, CalendarCheck, CalendarDays, CalendarOff, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, ExternalLink, Inbox, Laptop, List, Loader2, Mail, MessageCircle, Plus, Search, ShieldAlert, Sparkles, Trash2, User, Video, X } from 'lucide-react'
import {
  createAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  resendAppointmentEmail,
  getSuggestedAvailableSlotsAction,
  createAgendaBlockAction,
  deleteAgendaBlockAction,
  assignSlotToAppointmentRequestAction,
  resolveAppointmentRequestAction,
  offerSlotToWaitlistPatientAction,
  type CreateAppointmentInput,
} from './actions'
import { APPOINTMENT_TYPE_CONFIG } from '@/types'
import { generateGoogleCalendarUrl } from '@/lib/calendar-utils'
import { ModalPortal } from '@/components/ui/modal-portal'

interface PatientOption {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
}

export interface AppointmentItem {
  id: string
  patientId: string
  date: Date | string
  durationMin: number
  modality: string
  appointmentType?: string | null
  typeColor?: string | null
  meetUrl?: string | null
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

export interface AppointmentRequestItem {
  id: string
  patientId: string
  appointmentId: string | null
  type: string // "NEW" | "RESCHEDULE" | "CANCEL"
  status: string // "PENDING" | "ACCEPTED" | "REJECTED"
  appointmentType: string
  modality: string
  preferredTimeOfDay: string | null
  preferredDays: string | null
  reason: string | null
  patientNotes: string | null
  proposedDate: Date | string | null
  adminNotes: string | null
  createdAt: Date | string
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  }
  appointment?: {
    id: string
    date: Date | string
    modality: string
    appointmentType: string
    status: string
    notes?: string | null
  } | null
}

export interface AgendaBlockItem {
  id: string
  userId: string
  title: string
  reason: string // "VACACIONES" | "FORMACION" | "FESTIVO" | "PERSONAL" | "OTRO"
  startDateTime: Date | string
  endDateTime: Date | string
  allDay: boolean
  notes: string | null
}

export interface WaitlistEntryItem {
  id: string
  patientId: string
  status: string // "WAITING" | "CONTACTED" | "BOOKED"
  notes: string | null
  preferredFrom: Date | string | null
  preferredTo: Date | string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
  }
}

// Helper to format Date for input[type="datetime-local"] in local time
function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function AppointmentManager({
  initialAppointments,
  patients,
  initialRequests = [],
  initialBlocks = [],
  waitlistEntries = [],
}: {
  initialAppointments: AppointmentItem[]
  patients: PatientOption[]
  initialRequests?: AppointmentRequestItem[]
  initialBlocks?: AgendaBlockItem[]
  waitlistEntries?: WaitlistEntryItem[]
}) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments)
  const [requests, setRequests] = useState<AppointmentRequestItem[]>(initialRequests)
  const [blocks, setBlocks] = useState<AgendaBlockItem[]>(initialBlocks)
  const [waitlist, setWaitlist] = useState<WaitlistEntryItem[]>(waitlistEntries)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'LIST' | 'REQUESTS' | 'BLOCKS'>('MONTH')
  const [listFilter, setListFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('UPCOMING')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  // Selected appointment for detail inspection modal
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null)

  // New appointment modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '')

  // Initial date for new appointment
  const initialDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(10, 0, 0, 0)
    return toDateTimeLocalValue(d)
  }, [])

  const [dateStr, setDateStr] = useState(initialDate)
  const [appointmentType, setAppointmentType] = useState<'PRIMERA' | 'REVISION' | 'ONLINE' | 'DOMICILIO' | 'GRUPAL'>('REVISION')
  const [typeColor, setTypeColor] = useState('#16a34a')
  const [durationMin, setDurationMin] = useState(45)
  const [modality, setModality] = useState<'ONLINE' | 'PRESENCIAL'>('ONLINE')
  const [notes, setNotes] = useState('Consulta de seguimiento y ajuste nutricional')
  const [location, setLocation] = useState('Consulta Nutricional Eva Vidal')
  const [sendEmail, setSendEmail] = useState(true)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  // Solicitudes del portal
  const [suggestedSlotsByReqId, setSuggestedSlotsByReqId] = useState<Record<string, Array<{ date: string; formatted: string }>>>({})
  const [loadingSlotsReqId, setLoadingSlotsReqId] = useState<string | null>(null)
  const [selectedReqSlot, setSelectedReqSlot] = useState<Record<string, string>>({})
  const [reqAdminNotes, setReqAdminNotes] = useState<Record<string, string>>({})

  // Aviso de cancelación con sugerencia de lista de espera
  const [cancelledSlotNotice, setCancelledSlotNotice] = useState<{
    date: string
    patientName: string
    durationMin: number
  } | null>(null)

  // Bloqueos de agenda
  const [blockTitle, setBlockTitle] = useState('')
  const [blockReason, setBlockReason] = useState('VACACIONES')
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockNotes, setBlockNotes] = useState('')

  // Copia de enlace Meet
  const [copiedMeetId, setCopiedMeetId] = useState<string | null>(null)

  const handleCopyMeet = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedMeetId(id)
    setTimeout(() => setCopiedMeetId(null), 2500)
  }

  const handleTypeSelect = (typeKey: 'PRIMERA' | 'REVISION' | 'ONLINE' | 'DOMICILIO' | 'GRUPAL') => {
    setAppointmentType(typeKey)
    const cfg = APPOINTMENT_TYPE_CONFIG[typeKey]
    if (cfg) {
      setDurationMin(cfg.durationMin)
      setTypeColor(cfg.color)
    }
    if (typeKey === 'ONLINE') {
      setModality('ONLINE')
      setLocation('Videollamada Google Meet')
    } else {
      setModality('PRESENCIAL')
      setLocation('Consulta Nutricional Eva Vidal')
    }
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate)
    if (viewMode === 'MONTH') {
      next.setMonth(next.getMonth() - 1)
    } else if (viewMode === 'WEEK') {
      next.setDate(next.getDate() - 7)
    } else {
      next.setMonth(next.getMonth() - 1)
    }
    setCurrentDate(next)
  }

  const handleNext = () => {
    const next = new Date(currentDate)
    if (viewMode === 'MONTH') {
      next.setMonth(next.getMonth() + 1)
    } else if (viewMode === 'WEEK') {
      next.setDate(next.getDate() + 7)
    } else {
      next.setMonth(next.getMonth() + 1)
    }
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Open new appointment modal for a specific day
  const handleOpenNewForDay = (targetDate: Date, hour = 10) => {
    const d = new Date(targetDate)
    d.setHours(hour, 0, 0, 0)
    setDateStr(toDateTimeLocalValue(d))
    setIsNewModalOpen(true)
  }

  // Create appointment handler
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
          appointmentType,
          typeColor,
          notes,
          location: modality === 'ONLINE' ? 'Videollamada Google Meet' : location,
          sendEmailNotification: sendEmail,
        })

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
        setIsNewModalOpen(false)
        setActionSuccessMessage(
          sendEmail
            ? ` Cita agendada (${APPOINTMENT_TYPE_CONFIG[appointmentType]?.label || appointmentType}). Se ha enviado la confirmación y enlace de Google Calendar a ${selectedPatient?.email || 'el paciente'}. El recordatorio se enviará automáticamente 24h antes.`
            : ' Cita guardada en la agenda con éxito.'
        )
        setTimeout(() => setActionSuccessMessage(null), 6000)
      } catch (err: any) {
        alert(err.message || 'Error al agendar la cita')
      }
    })
  }

  // Status toggle
  const handleStatusChange = (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(id, status)
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        )
        if (selectedAppointment && selectedAppointment.id === id) {
          setSelectedAppointment({ ...selectedAppointment, status })
        }

        const targetApp = appointments.find((a) => a.id === id)
        if (status === 'CANCELLED' && targetApp) {
          setCancelledSlotNotice({
            date: new Date(targetApp.date).toISOString(),
            patientName: `${targetApp.patient.firstName} ${targetApp.patient.lastName}`,
            durationMin: targetApp.durationMin,
          })
          setActionSuccessMessage(` Cita cancelada. Hueco liberado para el ${new Date(targetApp.date).toLocaleDateString('es-ES')} a las ${new Date(targetApp.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h. Puedes reasignarlo abajo a un paciente de la lista de espera.`)
        } else {
          setActionSuccessMessage(` Estado de la cita actualizado a ${status}.`)
        }
        setTimeout(() => setActionSuccessMessage(null), 6000)
      } catch (err: any) {
        alert('Error al actualizar estado')
      }
    })
  }

  // Solicitudes del portal: buscar huecos sugeridos
  const handleLoadSuggestedSlots = (req: AppointmentRequestItem) => {
    setLoadingSlotsReqId(req.id)
    startTransition(async () => {
      try {
        const duration = req.appointmentType === 'PRIMERA' ? 60 : req.appointmentType === 'GRUPAL' ? 90 : 45
        const slots = await getSuggestedAvailableSlotsAction(duration, 14)
        setSuggestedSlotsByReqId((prev) => ({ ...prev, [req.id]: slots }))
        if (slots.length > 0 && !selectedReqSlot[req.id]) {
          setSelectedReqSlot((prev) => ({ ...prev, [req.id]: toDateTimeLocalValue(new Date(slots[0].date)) }))
        }
      } catch (err: any) {
        alert(err.message || 'Error al obtener huecos sugeridos')
      } finally {
        setLoadingSlotsReqId(null)
      }
    })
  }

  // Solicitudes del portal: asignar hueco a la solicitud
  const handleAssignSlot = (req: AppointmentRequestItem) => {
    const chosenDate = selectedReqSlot[req.id]
    if (!chosenDate) {
      alert('Por favor selecciona o introduce fecha y hora para la cita.')
      return
    }

    startTransition(async () => {
      try {
        const duration = req.appointmentType === 'PRIMERA' ? 60 : req.appointmentType === 'GRUPAL' ? 90 : 45
        const notes = reqAdminNotes[req.id] || ''
        const res = await assignSlotToAppointmentRequestAction(req.id, new Date(chosenDate).toISOString(), duration, notes)
        if (res.success) {
          setRequests((prev) => prev.filter((r) => r.id !== req.id))
          setActionSuccessMessage(` Cita asignada y confirmada para ${req.patient.firstName} ${req.patient.lastName}. Se le ha enviado un correo con los detalles y Google Calendar.`)
          setTimeout(() => setActionSuccessMessage(null), 6000)
        }
      } catch (err: any) {
        alert(err.message || 'Error al asignar hueco a la solicitud')
      }
    })
  }

  // Solicitudes del portal: resolver cambio o cancelación
  const handleResolveRequest = (req: AppointmentRequestItem, decision: 'ACCEPT_CANCEL' | 'REJECT') => {
    startTransition(async () => {
      try {
        const notes = reqAdminNotes[req.id] || (decision === 'ACCEPT_CANCEL' ? 'Cancelación aceptada por Eva.' : 'Solicitud no aceptada.')
        await resolveAppointmentRequestAction(req.id, decision, notes)
        setRequests((prev) => prev.filter((r) => r.id !== req.id))

        if (decision === 'ACCEPT_CANCEL' && req.appointment) {
          setCancelledSlotNotice({
            date: new Date(req.appointment.date).toISOString(),
            patientName: `${req.patient.firstName} ${req.patient.lastName}`,
            durationMin: 45,
          })
          setActionSuccessMessage(` Cancelación aceptada. Hueco liberado disponible para reasignar a la lista de espera.`)
        } else {
          setActionSuccessMessage(` Solicitud ${decision === 'ACCEPT_CANCEL' ? 'aceptada' : 'rechazada'}.`)
        }
        setTimeout(() => setActionSuccessMessage(null), 6000)
      } catch (err: any) {
        alert(err.message || 'Error al resolver la solicitud')
      }
    })
  }

  // Reasignar hueco libre a paciente de lista de espera
  const handleOfferSlotToWaitlist = (entry: WaitlistEntryItem) => {
    if (!cancelledSlotNotice) return
    startTransition(async () => {
      try {
        const res = await offerSlotToWaitlistPatientAction(entry.id, cancelledSlotNotice.date, cancelledSlotNotice.durationMin)
        if (res.success) {
          setWaitlist((prev) => prev.filter((w) => w.id !== entry.id))
          setCancelledSlotNotice(null)
          setActionSuccessMessage(` ¡Hueco reasignado con éxito a ${entry.patient.firstName} ${entry.patient.lastName}! Se le ha enviado confirmación por correo y Google Meet.`)
          setTimeout(() => setActionSuccessMessage(null), 6000)
        }
      } catch (err: any) {
        alert(err.message || 'Error al reasignar hueco a lista de espera')
      }
    })
  }

  // Crear bloqueo de agenda
  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!blockTitle || !blockStart || !blockEnd) return

    startTransition(async () => {
      try {
        const created = await createAgendaBlockAction({
          title: blockTitle,
          reason: blockReason as any,
          startDateTime: new Date(blockStart).toISOString(),
          endDateTime: new Date(blockEnd).toISOString(),
          notes: blockNotes,
        })
        setBlocks((prev) => [...prev, created as any])
        setBlockTitle('')
        setBlockNotes('')
        setActionSuccessMessage(` Período bloqueado en agenda: "${created.title}". No se permitirán citas en ese horario.`)
        setTimeout(() => setActionSuccessMessage(null), 5000)
      } catch (err: any) {
        alert(err.message || 'Error al crear bloqueo')
      }
    })
  }

  // Eliminar bloqueo de agenda
  const handleDeleteBlock = (blockId: string) => {
    if (!confirm('¿Seguro que deseas desbloquear esta franja de agenda?')) return
    startTransition(async () => {
      try {
        await deleteAgendaBlockAction(blockId)
        setBlocks((prev) => prev.filter((b) => b.id !== blockId))
        setActionSuccessMessage(' Bloqueo eliminado. La franja vuelve a estar disponible.')
        setTimeout(() => setActionSuccessMessage(null), 4000)
      } catch (err: any) {
        alert(err.message || 'Error al eliminar bloqueo')
      }
    })
  }

  // Delete appointment
  const handleDelete = (id: string) => {
    if (!confirm('¿Estás segura de eliminar esta cita de la agenda?')) return

    startTransition(async () => {
      try {
        await deleteAppointment(id)
        setAppointments((prev) => prev.filter((a) => a.id !== id))
        if (selectedAppointment && selectedAppointment.id === id) {
          setSelectedAppointment(null)
        }
        setActionSuccessMessage(' Cita eliminada de la agenda.')
        setTimeout(() => setActionSuccessMessage(null), 4000)
      } catch (err: any) {
        alert('Error al eliminar la cita')
      }
    })
  }

  // Resend confirmation email
  const handleResendEmail = (id: string) => {
    startTransition(async () => {
      try {
        const res = await resendAppointmentEmail(id)
        if (res.success) {
          setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, emailSent: true, emailSentAt: new Date() } : a))
          )
          if (selectedAppointment && selectedAppointment.id === id) {
            setSelectedAppointment({ ...selectedAppointment, emailSent: true, emailSentAt: new Date() })
          }
          setActionSuccessMessage(' Correo de cita reenviado correctamente al paciente con enlace de Google Calendar.')
          setTimeout(() => setActionSuccessMessage(null), 5000)
        } else {
          alert(res.message)
        }
      } catch (err: any) {
        alert(err.message || 'Error al reenviar email')
      }
    })
  }

  const handleWhatsAppReminder = (appointment: AppointmentItem) => {
    const phone = appointment.patient.phone?.replace(/\D/g, '')
    if (!phone) return
    const appointmentDate = new Date(appointment.date)
    const date = appointmentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    const time = appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const message = `Hola ${appointment.patient.firstName}, te recuerdo tu cita de nutrición el ${date} a las ${time} h. Si necesitas reprogramarla, usa el enlace seguro que recibiste por correo. — Eva Vidal`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  // Month grid computation
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Monday is index 0 in Spain (getDay() returns 0 for Sunday)
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7
    const totalDaysInMonth = lastDayOfMonth.getDate()

    const days: Array<{
      date: Date
      dayNumber: number
      isCurrentMonth: boolean
      isToday: boolean
      appointments: AppointmentItem[]
    }> = []

    const now = new Date()
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

    // 1. Preceding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i)
      const dStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const dayApps = appointments.filter((app) => {
        const ad = new Date(app.date)
        return `${ad.getFullYear()}-${ad.getMonth()}-${ad.getDate()}` === dStr
      })
      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        appointments: dayApps,
      })
    }

    // 2. Days of current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i)
      const dStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const dayApps = appointments.filter((app) => {
        const ad = new Date(app.date)
        return `${ad.getFullYear()}-${ad.getMonth()}-${ad.getDate()}` === dStr
      })
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        appointments: dayApps,
      })
    }

    // 3. Trailing days from next month to complete grid (up to 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      const dStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const dayApps = appointments.filter((app) => {
        const ad = new Date(app.date)
        return `${ad.getFullYear()}-${ad.getMonth()}-${ad.getDate()}` === dStr
      })
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        appointments: dayApps,
      })
    }

    return days
  }, [currentDate, appointments])

  // Week computation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate)
    const dayOfWeek = (d.getDay() + 6) % 7 // Mon = 0
    const monday = new Date(d)
    monday.setDate(d.getDate() - dayOfWeek)

    const now = new Date()
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      const dStr = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
      const dayApps = appointments.filter((app) => {
        const ad = new Date(app.date)
        return `${ad.getFullYear()}-${ad.getMonth()}-${ad.getDate()}` === dStr
      })
      days.push({
        date: day,
        dayNumber: day.getDate(),
        dayLabel: DAY_LABELS[i],
        isToday: dStr === todayStr,
        appointments: dayApps,
      })
    }
    return days
  }, [currentDate, appointments])

  // Filtered appointments for List/Agenda View
  const now = new Date()
  const listAppointments = useMemo(() => {
    return appointments
      .filter((app) => {
        const appDate = new Date(app.date)
        if (listFilter === 'UPCOMING') return appDate >= now && app.status !== 'CANCELLED'
        if (listFilter === 'COMPLETED') return app.status === 'COMPLETED' || appDate < now
        return true
      })
      .filter((app) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const patientName = `${app.patient.firstName} ${app.patient.lastName}`.toLowerCase()
        const notes = (app.notes || '').toLowerCase()
        return patientName.includes(q) || notes.includes(q)
      })
  }, [appointments, listFilter, searchQuery, now])

  return (
    <div className="space-y-5">
      {/* Success banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-600 shrink-0" />
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

      {/* Reasignación a Lista de Espera por Cancelación (Sección 5.5) */}
      {cancelledSlotNotice && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 shadow-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-black flex items-center gap-2 text-amber-900">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>Hueco liberado por cancelación: {new Date(cancelledSlotNotice.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {new Date(cancelledSlotNotice.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h ({cancelledSlotNotice.durationMin} min)</span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                La cita que ocupaba {cancelledSlotNotice.patientName} ha sido cancelada. Puedes reasignar este hueco con 1 solo clic a los pacientes que esperan turno:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCancelledSlotNotice(null)}
              className="text-amber-700 hover:text-amber-900 text-xs font-bold p-1"
            >
              Cerrar aviso
            </button>
          </div>

          {waitlist.filter((w) => w.status === 'WAITING').length === 0 ? (
            <p className="text-xs italic text-amber-800 bg-white/60 p-2.5 rounded-xl border border-amber-200">
              No hay pacientes con estado "En espera" en este momento en la lista de espera.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {waitlist.filter((w) => w.status === 'WAITING').map((entry) => (
                <Button
                  key={entry.id}
                  size="sm"
                  onClick={() => handleOfferSlotToWaitlist(entry)}
                  disabled={isPending}
                  className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs gap-1.5"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>1-Clic: Asignar a {entry.patient.firstName} {entry.patient.lastName}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automated 24h reminder notification badge */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50/50 to-white border border-blue-200 text-xs text-blue-950 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-xl shadow-2xs">
            <Bell className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-blue-900">Recordatorios de Cita 100% Automáticos:</span>{' '}
            <span className="text-gray-600">
              El sistema envía por correo electrónico a cada paciente el recordatorio oficial el día anterior a su cita (desde info@evavidalnutricion.com). No necesitas pulsar ningún botón.
            </span>
          </div>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex bg-white text-blue-800 border-blue-200 font-bold text-3xs">
          <Check className="h-[1em] w-[1em] shrink-0" /> Activo 24h
        </Badge>
      </div>

      {/* GOOGLE CALENDAR HEADER CONTROLS */}
      <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Navigation and Date */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="rounded-2xl text-xs font-bold px-3.5 h-9 border-gray-300 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300"
          >
            Hoy
          </Button>

          <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 hover:bg-gray-100 text-gray-700 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 text-gray-700 transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-lg font-black text-gray-900 capitalize tracking-tight ml-1">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* Right: View Switcher & New Appointment Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 bg-gray-100 rounded-2xl flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'MONTH'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Mes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEEK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'WEEK'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Semana</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'LIST'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('REQUESTS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'REQUESTS'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Solicitudes</span>
              {requests.filter((r) => r.status === 'PENDING').length > 0 && (
                <span className="bg-amber-500 text-white text-3xs font-black px-1.5 py-0.2 rounded-full">
                  {requests.filter((r) => r.status === 'PENDING').length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('BLOCKS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'BLOCKS'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <CalendarOff className="h-3.5 w-3.5" />
              <span>Bloqueos ({blocks.length})</span>
            </button>
          </div>

          <Button
            type="button"
            onClick={() => {
              setDateStr(initialDate)
              setIsNewModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Cita</span>
          </Button>
        </div>
      </div>

      {/* 1. MONTH VIEW (Estilo Google Calendar) */}
      {viewMode === 'MONTH' && (
        <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center text-xs font-bold text-gray-600">
              {DAY_LABELS.map((label, idx) => (
                <div key={idx} className="py-2.5 uppercase tracking-wider text-[11px]">
                  {label}
                </div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
              {monthGridDays.map((dayItem, idx) => {
                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenNewForDay(dayItem.date)}
                    className={`min-h-[110px] md:min-h-[125px] p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                      dayItem.isCurrentMonth
                        ? 'bg-white hover:bg-blue-50/30'
                        : 'bg-gray-50/60 text-gray-400'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-extrabold inline-flex items-center justify-center ${
                          dayItem.isToday
                            ? 'h-6 w-6 rounded-full bg-blue-600 text-white shadow-2xs'
                            : dayItem.isCurrentMonth
                            ? 'text-gray-800'
                            : 'text-gray-400'
                        }`}
                      >
                        {dayItem.dayNumber}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenNewForDay(dayItem.date)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 rounded-md transition-opacity"
                        title="Agendar cita en este día"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Appointments & Blocks in this day */}
                    <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                      {/* Bloqueos de Agenda */}
                      {(() => {
                        const dayStart = new Date(dayItem.date)
                        dayStart.setHours(0, 0, 0, 0)
                        const dayEnd = new Date(dayItem.date)
                        dayEnd.setHours(23, 59, 59, 999)
                        const dayBlocks = blocks.filter((b) => {
                          const s = new Date(b.startDateTime)
                          const e = new Date(b.endDateTime)
                          return s <= dayEnd && e >= dayStart
                        })
                        return dayBlocks.map((b) => (
                          <div
                            key={b.id}
                            className="px-1.5 py-0.5 rounded text-3xs font-extrabold bg-rose-50 text-rose-900 border border-rose-200 truncate flex items-center gap-1 shadow-2xs"
                            title={`Bloqueo: ${b.title} (${b.reason})`}
                          >
                            <span><Ban className="h-4 w-4" /></span>
                            <span className="truncate">{b.title}</span>
                          </div>
                        ))
                      })()}

                      {dayItem.appointments.map((app) => {
                        const appTime = new Date(app.date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        const isOnline = app.modality === 'ONLINE'
                        const isDone = app.status === 'COMPLETED'
                        const typeCfg = app.appointmentType ? APPOINTMENT_TYPE_CONFIG[app.appointmentType] : null

                        return (
                          <div
                            key={app.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAppointment(app)
                            }}
                            className={`px-2 py-1 rounded-xl text-3xs font-bold truncate transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                                : isOnline
                                ? 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                            }`}
                            style={!isDone && app.typeColor ? { borderLeft: `3px solid ${app.typeColor}` } : {}}
                            title={`${appTime} - ${app.patient.firstName} ${app.patient.lastName} (${typeCfg?.label || app.modality})`}
                          >
                            <span className="font-extrabold shrink-0">{appTime}</span>
                            <span className="truncate">
                              {app.patient.firstName} {app.patient.lastName[0]}.
                            </span>
                            <span className="ml-auto shrink-0 text-[10px]">
                              {isOnline ? <Laptop className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="h-1" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. WEEK VIEW (Estilo Google Calendar Semanal) */}
      {viewMode === 'WEEK' && (
        <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {/* Week Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center">
              {weekDays.map((w, idx) => (
                <div
                  key={idx}
                  className={`py-3 px-1 border-r border-gray-200 last:border-r-0 ${
                    w.isToday ? 'bg-blue-50/70' : ''
                  }`}
                >
                  <span className="text-[11px] uppercase font-bold text-gray-500 block">
                    {w.dayLabel}
                  </span>
                  <span
                    className={`text-sm font-black inline-flex items-center justify-center mt-0.5 ${
                      w.isToday
                        ? 'h-7 w-7 rounded-full bg-blue-600 text-white shadow-2xs'
                        : 'text-gray-900'
                    }`}
                  >
                    {w.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            {/* Week Schedule Columns */}
            <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[420px] bg-white">
              {weekDays.map((w, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenNewForDay(w.date)}
                  className={`p-2 space-y-2 cursor-pointer hover:bg-blue-50/20 transition-colors ${
                    w.isToday ? 'bg-blue-50/10' : ''
                  }`}
                >
                  {w.appointments.length === 0 ? (
                    <div className="h-full min-h-[140px] flex items-center justify-center text-gray-300 text-2xs italic">
                      Libre
                    </div>
                  ) : (
                    w.appointments.map((app) => {
                      const appTime = new Date(app.date).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      const isOnline = app.modality === 'ONLINE'
                      const isDone = app.status === 'COMPLETED'

                      return (
                        <div
                          key={app.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(app)
                          }}
                          className={`p-2.5 rounded-2xl border text-xs shadow-2xs transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                              : isOnline
                              ? 'bg-blue-50 border-blue-200 text-blue-950 hover:bg-blue-100'
                              : 'bg-sky-50 border-sky-200 text-sky-950 hover:bg-sky-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-blue-900 text-2xs bg-white/80 px-1.5 py-0.5 rounded">
                              {appTime}
                            </span>
                            <span className="text-2xs">{isOnline ? <Laptop className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}</span>
                          </div>
                          <h4 className="font-bold text-gray-900 truncate">
                            {app.patient.firstName} {app.patient.lastName}
                          </h4>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                            {app.durationMin} min • {isOnline ? 'Google Meet' : 'Presencial'}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. AGENDA / LIST VIEW */}
      {viewMode === 'LIST' && (
        <div className="space-y-4">
          {/* List Search and Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-gray-200">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por paciente o motivo de consulta..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setListFilter('UPCOMING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  listFilter === 'UPCOMING'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Próximas
              </button>
              <button
                type="button"
                onClick={() => setListFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  listFilter === 'ALL'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Todas ({appointments.length})
              </button>
              <button
                type="button"
                onClick={() => setListFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  listFilter === 'COMPLETED'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Realizadas
              </button>
            </div>
          </div>

          {listAppointments.length === 0 ? (
            <Card className="text-center py-16 rounded-3xl border-gray-200">
              <CardContent>
                <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No hay citas en este filtro</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                  Programa una cita para tu paciente y el sistema le enviará la confirmación con enlace de Google Calendar y el recordatorio automático 24h antes.
                </p>
                <Button onClick={() => setIsNewModalOpen(true)} className="rounded-2xl text-xs font-bold">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Agendar Cita
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listAppointments.map((app) => {
                const appDate = new Date(app.date)
                const dateFormatted = appDate.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'Europe/Madrid',
                })
                const timeFormatted = appDate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Madrid',
                })
                const isOnline = app.modality === 'ONLINE'
                const isPast = appDate < now

                const gCalUrl = generateGoogleCalendarUrl({
                  title: `Cita Nutrición: ${app.patient.firstName} ${app.patient.lastName} - Eva Vidal`,
                  startDate: appDate,
                  durationMin: app.durationMin,
                  description: `Consulta Nutricional con Eva Vidal.\nModalidad: ${app.modality}\nContacto: info@evavidalnutricion.com`,
                  location: isOnline ? 'Online / Google Meet' : app.location || 'Consulta Nutricional Eva Vidal',
                })

                return (
                  <Card
                    key={app.id}
                    onClick={() => setSelectedAppointment(app)}
                    className="rounded-3xl border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-2 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 flex flex-row items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-black text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-100 shadow-2xs">
                            {dateFormatted} • {timeFormatted} h
                          </span>
                        </div>
                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{app.patient.firstName} {app.patient.lastName}</span>
                        </CardTitle>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-2xs font-bold rounded-full ${
                          app.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {app.status === 'COMPLETED' ? 'Realizada' : 'Confirmada'}
                      </Badge>
                    </CardHeader>

                    <CardContent className="p-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        {isOnline ? (
                          <Video className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Building className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        <span>{isOnline ? 'Videollamada Online' : app.location || 'Presencial'} ({app.durationMin} min)</span>
                      </div>

                      {app.notes && (
                        <p className="text-gray-500 line-clamp-2 italic bg-gray-50 p-2 rounded-xl text-2xs">
                          "{app.notes}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-2xs">
                        <span className="text-blue-700 font-bold flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          {app.reminderSent ? ' Recordatorio 24h enviado' : 'Recordatorio 24h programado'}
                        </span>
                        <a
                          href={gCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <span>Google Calendar</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. SOLICITUDES DEL PORTAL (Sección 5.5) */}
      {viewMode === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-blue-600" />
              <span>Solicitudes de Cita del Portal de Pacientes</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              El paciente solicita cita indicando turno, días preferidos y motivo sin elegir día ni hora. Eva fija la fecha y hora oficiales en la agenda y el paciente recibe la confirmación por correo electrónico.
            </p>
          </div>

          {requests.filter((r) => r.status === 'PENDING').length === 0 ? (
            <Card className="text-center py-16 rounded-3xl border-gray-200 bg-white">
              <CardContent>
                <Check className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No hay solicitudes pendientes</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Todas las solicitudes de cita y cancelaciones de los pacientes han sido gestionadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests
                .filter((r) => r.status === 'PENDING')
                .map((req) => {
                  const typeCfg = APPOINTMENT_TYPE_CONFIG[req.appointmentType] || APPOINTMENT_TYPE_CONFIG.REVISION
                  const isCancel = req.type === 'CANCEL'
                  const isReschedule = req.type === 'RESCHEDULE'
                  const suggested = suggestedSlotsByReqId[req.id] || []
                  const isLoadingSlots = loadingSlotsReqId === req.id

                  return (
                    <Card key={req.id} className="rounded-3xl border-gray-200 overflow-hidden shadow-xs bg-white">
                      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-white pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                            {req.patient.firstName[0]}{req.patient.lastName[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-sm font-black text-gray-900">
                                {req.patient.firstName} {req.patient.lastName}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={`text-3xs font-black rounded-full ${
                                  isCancel
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : isReschedule
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}
                              >
                                {isCancel ? 'Solicitud Cancelación' : isReschedule ? 'Cambio de Fecha' : 'Nueva Cita Solicitada'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {req.patient.email || 'Sin correo'} {req.patient.phone ? ` • ${req.patient.phone}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-1 rounded-full text-3xs font-extrabold text-white"
                            style={{ backgroundColor: typeCfg.color }}
                          >
                            {typeCfg.label} ({typeCfg.durationMin} min)
                          </span>
                          <span className="text-xs text-gray-500 font-semibold">
                            {req.modality === 'ONLINE' ? ' Online (Meet)' : ' Presencial'}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                            <span className="font-bold text-gray-700 block text-2xs uppercase">Preferencia del Paciente:</span>
                            <p className="text-gray-900 font-semibold">
                              Turno: {req.preferredTimeOfDay === 'MORNING' ? 'Mañanas (09:00 - 14:00)' : req.preferredTimeOfDay === 'AFTERNOON' ? 'Tardes (16:00 - 20:00)' : 'Indiferente / Lo antes posible'}
                            </p>
                            {req.preferredDays && (
                              <p className="text-gray-600">
                                Días preferentes: <span className="font-medium text-gray-900">{req.preferredDays}</span>
                              </p>
                            )}
                            {req.patientNotes && (
                              <p className="text-gray-500 italic pt-1 border-t border-gray-200/60">
                                «{req.patientNotes}»
                              </p>
                            )}
                          </div>

                          {/* Acciones según tipo de solicitud */}
                          {isCancel ? (
                            <div className="flex flex-col justify-center space-y-2.5 p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                              <span className="text-xs font-bold text-rose-950">
                                El paciente solicita cancelar la cita.
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleResolveRequest(req, 'ACCEPT_CANCEL')}
                                  disabled={isPending}
                                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex-1"
                                >
                                  Aceptar Cancelación
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolveRequest(req, 'REJECT')}
                                  disabled={isPending}
                                  className="rounded-xl text-xs font-bold flex-1"
                                >
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 p-3 rounded-2xl bg-blue-50/40 border border-blue-100">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-900 text-xs">Asignar Fecha y Hora Oficial:</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleLoadSuggestedSlots(req)}
                                  disabled={isLoadingSlots || isPending}
                                  className="rounded-xl text-2xs font-bold h-7 bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                                >
                                  {isLoadingSlots ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      Buscando...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3 w-3 mr-1 text-blue-600" />
                                      Sugerir Huecos Libres
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Huecos sugeridos */}
                              {suggested.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-3xs text-gray-500 font-bold uppercase">Huecos disponibles detectados:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {suggested.slice(0, 4).map((s, sIdx) => {
                                      const slotVal = toDateTimeLocalValue(new Date(s.date))
                                      const isChosen = selectedReqSlot[req.id] === slotVal
                                      return (
                                        <button
                                          key={sIdx}
                                          type="button"
                                          onClick={() => setSelectedReqSlot((prev) => ({ ...prev, [req.id]: slotVal }))}
                                          className={`px-2 py-1 rounded-xl text-3xs font-extrabold transition-all border ${
                                            isChosen
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                              : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
                                          }`}
                                        >
                                          {s.formatted}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-2xs font-bold text-gray-700">Día y Hora Elegidos *</Label>
                                  <Input
                                    type="datetime-local"
                                    value={selectedReqSlot[req.id] || ''}
                                    onChange={(e) => setSelectedReqSlot((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                    className="rounded-xl text-xs font-semibold h-8 bg-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-2xs font-bold text-gray-700">Nota para el correo (opcional)</Label>
                                  <Input
                                    type="text"
                                    placeholder="Ej: Te he asignado el primer hueco disponible..."
                                    value={reqAdminNotes[req.id] || ''}
                                    onChange={(e) => setReqAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                    className="rounded-xl text-xs h-8 bg-white"
                                  />
                                </div>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => handleAssignSlot(req)}
                                disabled={isPending || !selectedReqSlot[req.id]}
                                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 shadow-xs"
                              >
                                Confirmar Hueco y Notificar por Correo
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* 5. BLOQUEOS DE AGENDA (Sección 5.5) */}
      {viewMode === 'BLOCKS' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-rose-600" />
              <span>Bloqueos de Agenda (Vacaciones, Formación y Festivos)</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Las franjas bloqueadas impiden agendar nuevas citas y son omitidas automáticamente por el motor de huecos sugeridos para proteger tus períodos de descanso o formación clínica.
            </p>
          </div>

          {/* Formulario nuevo bloqueo */}
          <Card className="rounded-3xl border-gray-200 shadow-xs bg-white p-5">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Añadir Nuevo Bloqueo de Franja</span>
            </h4>
            <form onSubmit={handleCreateBlock} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <Label className="text-2xs font-bold text-gray-700">Motivo / Título *</Label>
                <Input
                  type="text"
                  required
                  placeholder="Ej: Vacaciones de Verano"
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-2xs font-bold text-gray-700">Categoría *</Label>
                <Select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="rounded-xl text-xs font-semibold"
                >
                  <option value="VACACIONES">Vacaciones</option>
                  <option value="FORMACION">Formación / Congreso</option>
                  <option value="FESTIVO">Festivo / Puente</option>
                  <option value="PERSONAL">Asunto Personal</option>
                  <option value="OTRO">Otro</option>
                </Select>
              </div>

              <div>
                <Label className="text-2xs font-bold text-gray-700">Desde (Fecha y Hora) *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <Label className="text-2xs font-bold text-gray-700">Hasta (Fecha y Hora) *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <Label className="text-2xs font-bold text-gray-700">Notas adicionales (opcional)</Label>
                <Input
                  type="text"
                  placeholder="Ej: Consulta cerrada por asistencia a congreso SEDCA..."
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isPending || !blockTitle || !blockStart || !blockEnd}
                  className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                >
                  {isPending ? 'Guardando...' : 'Crear Bloqueo'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Listado de bloqueos actuales */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Bloqueos Registrados ({blocks.length})
            </h4>

            {blocks.length === 0 ? (
              <p className="text-xs text-gray-400 italic bg-white p-6 rounded-3xl border border-gray-200 text-center">
                No hay bloqueos configurados. La consulta está 100% disponible en sus horarios habituales.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {blocks.map((b) => {
                  const s = new Date(b.startDateTime)
                  const e = new Date(b.endDateTime)
                  return (
                    <Card key={b.id} className="rounded-3xl border-rose-200 bg-rose-50/30 p-4 space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="outline" className="bg-rose-100 text-rose-900 border-rose-300 text-3xs font-black rounded-full mb-1">
                            {b.reason}
                          </Badge>
                          <h5 className="font-bold text-gray-900 text-sm">{b.title}</h5>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBlock(b.id)}
                          disabled={isPending}
                          className="h-7 w-7 p-0 rounded-full text-rose-600 hover:bg-rose-100"
                          title="Eliminar bloqueo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="text-xs text-gray-600 space-y-0.5 pt-1 border-t border-rose-100">
                        <p>
                          <strong>Desde:</strong> {s.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} {s.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h
                        </p>
                        <p>
                          <strong>Hasta:</strong> {e.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} {e.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h
                        </p>
                        {b.notes && <p className="text-gray-500 italic text-2xs mt-1">«{b.notes}»</p>}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <ModalPortal><div
          className="fixed inset-0 z-50 modal-backdrop bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg font-bold">
                  {selectedAppointment.patient.firstName[0]}
                  {selectedAppointment.patient.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedAppointment.patient.email || 'Sin correo registrado'}
                    {selectedAppointment.patient.phone ? ` • ${selectedAppointment.patient.phone}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Appointment Details Grid */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-sm">
                    <CalendarDays className="h-4 w-4" />{' '}
                    {new Date(selectedAppointment.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'Europe/Madrid',
                    })}
                  </span>
                  <span className="font-black text-blue-950 text-sm">
                    {new Date(selectedAppointment.date).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Madrid',
                    })}{' '}
                    h
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-700 pt-1 border-t border-blue-200/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold">
                      {selectedAppointment.modality === 'ONLINE' ? ' Videollamada Online' : ' Presencial'}
                    </span>
                    {selectedAppointment.appointmentType && (
                      <span
                        className="px-2 py-0.5 rounded-full text-3xs font-extrabold text-white"
                        style={{ backgroundColor: selectedAppointment.typeColor || '#2563eb' }}
                      >
                        {APPOINTMENT_TYPE_CONFIG[selectedAppointment.appointmentType]?.label || selectedAppointment.appointmentType}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">{selectedAppointment.durationMin} minutos</span>
                </div>
              </div>

              {/* Enlace Google Meet para citas online */}
              {(selectedAppointment.modality === 'ONLINE' || selectedAppointment.meetUrl) && (() => {
                const meetLink = (selectedAppointment.meetUrl && !selectedAppointment.meetUrl.includes('meet.google.com/evv-'))
                  ? selectedAppointment.meetUrl
                  : 'https://meet.google.com/new'
                return (
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-purple-700" />
                        <span>Videollamada Google Meet (Portal Paciente)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMeet(selectedAppointment.id, meetLink)}
                        className="text-3xs font-bold text-purple-700 hover:text-purple-950 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-purple-200 shadow-2xs"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedMeetId === selectedAppointment.id ? '¡Copiado!' : 'Copiar Enlace'}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-purple-800 font-mono truncate flex-1 bg-white/80 p-2 rounded-xl border border-purple-100">
                        {meetLink}
                      </span>
                      <a
                        href={meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl shrink-0 flex items-center gap-1 shadow-2xs transition-all active:scale-[0.98]"
                      >
                        <span>Abrir Meet</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )
              })()}

              {selectedAppointment.notes && (
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                  <span className="font-bold text-gray-700 block mb-0.5 text-2xs uppercase">
                    Notas de Consulta:
                  </span>
                  <p className="text-gray-600 italic">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Automated reminder status */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-gray-900 block">
                      Recordatorio 24h (Automático)
                    </span>
                    <span className="text-gray-500 text-2xs">
                      {selectedAppointment.reminderSent
                        ? ' Enviado automáticamente por email al paciente'
                        : 'Se enviará de forma 100% automática el día previo'}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-2xs font-bold rounded-full ${
                    selectedAppointment.reminderSent
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {selectedAppointment.reminderSent ? 'Enviado' : 'Programado'}
                </Badge>
              </div>

              {/* Google Calendar Link Button */}
              {(() => {
                const appDate = new Date(selectedAppointment.date)
                const isOnline = selectedAppointment.modality === 'ONLINE'
                const gCalUrl = generateGoogleCalendarUrl({
                  title: `Cita Nutrición: ${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName} - Eva Vidal`,
                  startDate: appDate,
                  durationMin: selectedAppointment.durationMin,
                  description: `Consulta Nutricional con Eva Vidal.\nModalidad: ${selectedAppointment.modality}\nContacto: info@evavidalnutricion.com`,
                  location: isOnline ? 'Online / Google Meet' : selectedAppointment.location || 'Consulta Nutricional Eva Vidal',
                })
                return (
                  <a
                    href={gCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                  >
                    <CalendarCheck className="h-4 w-4 text-blue-600" />
                    <span>Añadir / Abrir en Google Calendar</span>
                    <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                  </a>
                )
              })()}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedAppointment.status !== 'COMPLETED' ? (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(selectedAppointment.id, 'COMPLETED')}
                    disabled={isPending}
                    className="rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Marcar Realizada
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedAppointment.id, 'CONFIRMED')}
                    disabled={isPending}
                    className="rounded-2xl text-xs font-bold"
                  >
                    Marcar Pendiente
                  </Button>
                )}

                {selectedAppointment.patient.email && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendEmail(selectedAppointment.id)}
                    disabled={isPending}
                    className="rounded-2xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                    title="Reenviar correo de confirmación de cita"
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Reenviar Email
                  </Button>
                )}
                {selectedAppointment.patient.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWhatsAppReminder(selectedAppointment)}
                    disabled={isPending}
                    className="rounded-2xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                    title="Abrir recordatorio de WhatsApp con el mensaje preparado"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    WhatsApp
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(selectedAppointment.id)}
                disabled={isPending}
                className="rounded-2xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Eliminar Cita
              </Button>
            </div>
          </div>
        </div></ModalPortal>
      )}

      {/* NEW APPOINTMENT MODAL */}
      {isNewModalOpen && (
        <ModalPortal><div
          className="fixed inset-0 z-50 modal-backdrop bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Agendar Nueva Cita Nutricional</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Se enviará la confirmación con enlace a Google Calendar y el recordatorio 24h de forma automática.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Paciente */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Paciente *</Label>
                <Select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="rounded-xl text-xs font-medium"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} {p.email ? `(${p.email})` : '(Sin email)'}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Tipo de Consulta (Sección 5.5) */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Tipo de Consulta (Sección 5.5) *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {(['REVISION', 'PRIMERA', 'ONLINE', 'DOMICILIO', 'GRUPAL'] as const).map((tKey) => {
                    const cfg = APPOINTMENT_TYPE_CONFIG[tKey]
                    const isSelected = appointmentType === tKey
                    return (
                      <button
                        key={tKey}
                        type="button"
                        onClick={() => handleTypeSelect(tKey)}
                        className={`p-2.5 rounded-2xl border text-xs font-bold text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 shadow-2xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                          <span className="font-extrabold text-gray-900 truncate">{cfg.label}</span>
                        </div>
                        <span className="text-3xs text-gray-500 mt-1">{cfg.durationMin} min</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Fecha y Hora + Duración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-gray-700">Fecha y Hora *</Label>
                  <Input
                    type="datetime-local"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    required
                    className="rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-700">Duración Estimada</Label>
                  <Select
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="rounded-xl text-xs font-semibold"
                  >
                    <option value={30}>30 minutos (Revisión exprés)</option>
                    <option value={45}>45 minutos (Consulta estándar)</option>
                    <option value={60}>60 minutos (Primera valoración)</option>
                    <option value={90}>90 minutos (Extensa / Pareja)</option>
                  </Select>
                </div>
              </div>

              {/* Modalidad */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Modalidad</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setModality('ONLINE')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      modality === 'ONLINE'
                        ? 'bg-blue-50 text-blue-800 border-blue-400 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="h-4 w-4 text-blue-600" />
                    <span>Online (Google Meet)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModality('PRESENCIAL')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      modality === 'PRESENCIAL'
                        ? 'bg-blue-50 text-blue-800 border-blue-400 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="h-4 w-4 text-blue-600" />
                    <span>Presencial en Consulta</span>
                  </button>
                </div>
              </div>

              {/* Ubicación / Enlace */}
              <div>
                <Label className="text-xs font-bold text-gray-700">
                  {modality === 'ONLINE' ? 'Plataforma / Enlace de Videollamada' : 'Dirección de la Consulta'}
                </Label>
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={
                    modality === 'ONLINE'
                      ? 'Videollamada Google Meet'
                      : 'Consulta Nutricional Eva Vidal, Calle...'
                  }
                  className="rounded-xl text-xs font-medium"
                />
              </div>

              {/* Notas */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Motivo / Notas de la sesión</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej. Revisión mensual de analíticas, ajuste calórico..."
                  className="rounded-xl text-xs font-medium"
                />
              </div>

              {/* Casilla de correo de confirmación */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                <label className="flex items-center gap-2.5 text-xs text-blue-950 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Enviar correo de confirmación con botón de Google Calendar</span>
                </label>
                <p className="text-[11px] text-blue-900/80 pl-6 leading-relaxed">
                  El recordatorio de 24 horas se enviará de forma <strong>100% automática</strong> el día antes de la cita a las 08:00h sin que tengas que intervenir.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-2xl text-xs font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Guardando...
                    </>
                  ) : (
                    'Confirmar y Guardar Cita'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div></ModalPortal>
      )}
    </div>
  )
}
