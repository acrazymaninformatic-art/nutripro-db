'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CalendarPlus,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { requestAppointmentAction, requestAppointmentChangeAction } from '../actions'

interface AppointmentItem {
  id: string
  date: string | Date
  durationMin: number
  modality: string
  status: string
  location?: string | null
  notes?: string | null
  meetUrl?: string | null
}

interface Props {
  appointments: AppointmentItem[]
}

const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  CONFIRMED: { label: 'Confirmada', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REQUESTED: { label: 'En revisión por Eva', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
  RESCHEDULE_REQUESTED: { label: 'Cambio solicitado', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300' },
  CANCEL_REQUESTED: { label: 'Cancelación solicitada', badgeClass: 'bg-rose-100 text-rose-900 border-rose-300' },
  COMPLETED: { label: 'Realizada', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' },
  CANCELLED: { label: 'Cancelada', badgeClass: 'bg-gray-100 text-gray-400 border-gray-200' },
}

export function CitasClient({ appointments }: Props) {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [actionModal, setActionModal] = useState<{ id: string; type: 'CHANGE' | 'CANCEL' } | null>(null)
  const [loading, setLoading] = useState(false)

  const activeAppointments = appointments.filter(
    (a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
  )
  const pastAppointments = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED'
  )

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await requestAppointmentAction(formData)
      setShowRequestModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!actionModal) return
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('appointmentId', actionModal.id)
    formData.append('actionType', actionModal.type)
    try {
      await requestAppointmentChangeAction(formData)
      setActionModal(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & New Request Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Mis Citas y Revisiones</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Consulta tus citas programadas o solicita una nueva sesión. Eva gestiona la agenda y te confirmará el día y hora exactos.
          </p>
        </div>

        <Button
          onClick={() => setShowRequestModal(true)}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 py-5 shadow-xs shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Solicitar Cita</span>
        </Button>
      </div>

      {/* Próximas Citas */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-xs text-gray-500">
          Citas Activas y Próximas ({activeAppointments.length})
        </h3>

        {activeAppointments.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-2 border-gray-200 p-8 text-center bg-white">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-800">No tienes citas programadas actualmente</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Pulsa en "Solicitar Cita" para pedir tu próxima sesión de revisión o primera consulta.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAppointments.map((app) => {
              const d = new Date(app.date)
              const statusInfo = STATUS_LABELS[app.status] || {
                label: app.status,
                badgeClass: 'bg-gray-100 text-gray-800',
              }
              const isOnline = app.modality === 'ONLINE'

              return (
                <Card key={app.id} className="rounded-3xl border-blue-100 overflow-hidden shadow-xs hover:border-blue-200 transition-all">
                  <CardHeader className="bg-gradient-to-r from-blue-50/60 to-white pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                    <Badge variant="outline" className={`text-2xs font-bold rounded-full ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </Badge>
                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {app.durationMin} min
                    </span>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <div className="text-lg font-black text-gray-900">
                        {d.toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-sm font-bold text-blue-700 mt-0.5">
                        {d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {isOnline ? (
                        <>
                          <Video className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Online por Videollamada</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{app.location || 'Consulta Presencial'}</span>
                        </>
                      )}
                    </div>

                    {/* Enlace Google Meet si es Online y confirmada */}
                    {isOnline && app.status === 'CONFIRMED' && app.meetUrl && (
                      <a
                        href={app.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        <span>Entrar a la Videollamada (Google Meet)</span>
                      </a>
                    )}

                    {app.notes && (
                      <p className="text-2xs text-gray-500 italic bg-gray-50/70 p-2 rounded-lg">
                        {app.notes}
                      </p>
                    )}

                    {/* Acciones de solicitud de cambio o cancelación */}
                    {app.status === 'CONFIRMED' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActionModal({ id: app.id, type: 'CHANGE' })}
                          className="flex-1 rounded-xl text-2xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-gray-200"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          <span>Pedir cambio de fecha</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActionModal({ id: app.id, type: 'CANCEL' })}
                          className="flex-1 rounded-xl text-2xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          <span>Solicitar cancelación</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Historial de Citas Pasadas */}
      {pastAppointments.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-xs text-gray-500">
            Historial de Sesiones Anteriores ({pastAppointments.length})
          </h3>

          <div className="bg-white rounded-3xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {pastAppointments.map((app) => {
              const d = new Date(app.date)
              return (
                <div key={app.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-gray-500">
                      {app.modality === 'ONLINE' ? 'Videollamada' : 'Presencial'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-2xs rounded-full">
                    {app.status === 'COMPLETED' ? 'Realizada' : 'Cancelada'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Solicitar Cita */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-blue-600" />
              <span>Solicitar Nueva Cita</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Indica tu preferencia de modalidad y disponibilidad aproximada. Eva revisará la agenda y te asignará fecha y hora oficiales.
            </p>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Modalidad</label>
                <select
                  name="modality"
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ONLINE">💻 Online por Videollamada (Google Meet)</option>
                  <option value="PRESENCIAL">🏥 Presencial en Consulta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Preferencia horaria aproximada</label>
                <select
                  name="preferredTime"
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Mañanas (09:00 - 14:00)">Mañanas (09:00 - 14:00)</option>
                  <option value="Tardes (16:00 - 20:00)">Tardes (16:00 - 20:00)</option>
                  <option value="Indiferente / Lo antes posible">Indiferente / Lo antes posible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo o notas para Eva</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Ej: Revisión mensual, ajustes en el plan de entrenamiento, molestias digestivas..."
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambio / Cancelación */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {actionModal.type === 'CHANGE' ? 'Solicitar Cambio de Fecha' : 'Solicitar Cancelación de Cita'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {actionModal.type === 'CHANGE'
                ? 'Indica tu nueva disponibilidad aproximada para que Eva pueda reubicar tu sesión.'
                : 'Indica el motivo de la cancelación. Eva recibirá la notificación al momento.'}
            </p>

            <form onSubmit={handleChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo / Nueva disponibilidad</label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  placeholder={
                    actionModal.type === 'CHANGE'
                      ? 'Ej: No podré asistir por motivos laborales, prefiero el próximo jueves por la tarde...'
                      : 'Ej: Motivo imprevisto de salud/viaje...'
                  }
                  className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActionModal(null)}
                  className="rounded-xl text-xs"
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={`rounded-xl text-white font-bold text-xs ${
                    actionModal.type === 'CHANGE' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {loading ? 'Enviando...' : 'Confirmar Solicitud'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
