'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Clock,
  User,
  HeartPulse,
  Utensils,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Droplets,
  Target,
  Pill,
} from 'lucide-react'

export interface AnamnesisSubmissionItem {
  id: string
  submittedAt: string | Date
  declaredName?: string | null
  declaredPhone?: string | null
  declaredEmail?: string | null
  declaredBirthDate?: string | Date | null
  declaredGender?: string | null
  foodPreferences?: string | null
  foodAversions?: string | null
  mealsPerDay?: number | null
  mealScheduleNotes?: string | null
  waterIntakeLiters?: number | null
  recall24h?: string | null
  digestiveIssues?: string | null
  medicalHistory?: string | null
  currentMedications?: string | null
  isGLP1Treatment?: boolean
  shortTermGoal?: string | null
}

interface Props {
  patientName: string
  submissions: AnamnesisSubmissionItem[]
}

export function AnamnesisViewerModal({ patientName, submissions }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  if (!submissions || submissions.length === 0) return null

  const activeSubmission = submissions[selectedIndex] || submissions[0]
  const dateFormatted = new Date(activeSubmission.submittedAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const copySummary = () => {
    const text = `
=== CUESTIONARIO PRE-CONSULTA DE ${patientName.toUpperCase()} ===
Fecha de envío: ${dateFormatted}

DATOS DECLARADOS:
- Nombre: ${activeSubmission.declaredName || 'No indicado'}
- Teléfono: ${activeSubmission.declaredPhone || 'No indicado'}
- Email: ${activeSubmission.declaredEmail || 'No indicado'}

GUSTOS Y ALIMENTACIÓN:
- Alimentos que rechaza: ${activeSubmission.foodAversions || 'Ninguno'}
- Preferencias: ${activeSubmission.foodPreferences || 'Variada'}

HÁBITOS:
- Comidas/día: ${activeSubmission.mealsPerDay || 'No indicado'}
- Horarios: ${activeSubmission.mealScheduleNotes || 'No indicado'}
- Agua: ${activeSubmission.waterIntakeLiters ? activeSubmission.waterIntakeLiters + ' L/día' : 'No indicado'}

RECORDATORIO 24H:
${activeSubmission.recall24h || 'No indicado'}

SALUD Y SÍNTOMAS:
- Molestias digestivas: ${activeSubmission.digestiveIssues || 'Ninguna'}
- Medicación: ${activeSubmission.currentMedications || 'Ninguna'}
- Tratamiento GLP-1: ${activeSubmission.isGLP1Treatment ? 'Sí' : 'No'}
- Patologías declaradas: ${activeSubmission.medicalHistory || 'Ninguna'}

OBJETIVO DECLARADO:
${activeSubmission.shortTermGoal || 'No indicado'}
    `.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-2 transition-all"
      >
        <FileText className="h-4 w-4" />
        <span>Ver Cuestionario Relleno</span>
        {submissions.length > 1 && (
          <Badge className="bg-emerald-800 text-white text-3xs px-1.5 py-0 rounded-full ml-1">
            {submissions.length}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-3xl border-gray-200">
          <DialogHeader className="p-5 pb-3 bg-gradient-to-r from-emerald-50 via-teal-50/30 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900">
                    Cuestionario Pre-Consulta Rellenado
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Respuestas originales completadas por {patientName}
                  </DialogDescription>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-2xs font-bold rounded-full">
                Rellenado por la Paciente
              </Badge>
            </div>

            {/* Selector si hay múltiples envíos */}
            {submissions.length > 1 && (
              <div className="flex items-center gap-2 pt-3">
                <span className="text-2xs font-semibold text-gray-600">Historial de envíos:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {submissions.map((sub, idx) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all ${
                        selectedIndex === idx
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white border text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Envío #{submissions.length - idx} (
                      {new Date(sub.submittedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                      )
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            {/* Aviso clínico */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2.5 text-2xs">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Fecha de recepción: {dateFormatted}
                </span>
                <span>
                  Estos datos fueron escritos por la paciente en su dispositivo. Tu ficha técnica clínica permanece intacta para tus valoraciones profesionales.
                </span>
              </div>
            </div>

            {/* 1. Datos Personales Declarados */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <User className="h-4 w-4 text-emerald-600" />
                <span>1. Datos de Contacto Aportados</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-2xs">
                <div>
                  <span className="text-gray-400 block">Nombre</span>
                  <strong className="text-gray-800">{activeSubmission.declaredName || 'No indicado'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Teléfono</span>
                  <strong className="text-gray-800">{activeSubmission.declaredPhone || 'No indicado'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Correo</span>
                  <strong className="text-gray-800">{activeSubmission.declaredEmail || 'No indicado'}</strong>
                </div>
              </div>
            </div>

            {/* 2. Gustos y Aversiones */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <Utensils className="h-4 w-4 text-emerald-600" />
                <span>2. Gustos y Aversiones Alimentarias</span>
              </h4>
              <div className="space-y-1.5">
                <div>
                  <span className="text-2xs font-semibold text-rose-700 block">
                    Alimentos que rechaza o no le gustan:
                  </span>
                  <p className="p-2 rounded-xl bg-white border border-rose-100 text-gray-800 text-2xs">
                    {activeSubmission.foodAversions || 'Ningún alimento rechazado declarado.'}
                  </p>
                </div>
                {activeSubmission.foodPreferences && (
                  <div>
                    <span className="text-2xs font-semibold text-emerald-700 block">
                      Alimentos preferidos:
                    </span>
                    <p className="p-2 rounded-xl bg-white border border-emerald-100 text-gray-800 text-2xs">
                      {activeSubmission.foodPreferences}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Horarios y Hábitos */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>3. Rutinas, Comidas y Agua</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-2xs">
                <div className="p-2 bg-white rounded-xl border">
                  <span className="text-gray-400 block">Comidas habituales/día</span>
                  <strong className="text-gray-800 text-sm">
                    {activeSubmission.mealsPerDay ? `${activeSubmission.mealsPerDay} comidas` : 'No indicado'}
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-xl border flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-gray-400 block">Consumo de agua</span>
                    <strong className="text-gray-800 text-sm">
                      {activeSubmission.waterIntakeLiters ? `${activeSubmission.waterIntakeLiters} L / día` : 'No indicado'}
                    </strong>
                  </div>
                </div>
              </div>
              {activeSubmission.mealScheduleNotes && (
                <div className="pt-1">
                  <span className="text-2xs text-gray-500 block font-semibold">Horarios y rutinas descritas:</span>
                  <p className="p-2 rounded-xl bg-white border text-gray-800 text-2xs">
                    {activeSubmission.mealScheduleNotes}
                  </p>
                </div>
              )}
            </div>

            {/* 4. Recordatorio 24 Horas */}
            {activeSubmission.recall24h && (
              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-2">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <span>4. Recordatorio Dietético de 24 Horas (Lo que comió ayer)</span>
                </h4>
                <div className="p-3 bg-white rounded-xl border border-emerald-100 text-gray-800 text-xs whitespace-pre-line leading-relaxed font-sans shadow-2xs">
                  {activeSubmission.recall24h}
                </div>
              </div>
            )}

            {/* 5. Historial de Salud y Fármacos */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <HeartPulse className="h-4 w-4 text-rose-600" />
                <span>5. Salud, Síntomas y Medicación</span>
              </h4>
              <div className="space-y-1.5 text-2xs">
                <div className="p-2 bg-white rounded-xl border">
                  <span className="font-bold text-gray-700 block flex items-center gap-1">
                    <Pill className="h-3 w-3 text-emerald-600" />
                    Medicación o suplementos declarados:
                  </span>
                  <p className="text-gray-800 mt-0.5">
                    {activeSubmission.currentMedications || 'Ninguna medicación declarada.'}
                  </p>
                </div>

                {activeSubmission.isGLP1Treatment && (
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                    <strong>⚠️ Tratamiento GLP-1 declarado:</strong> La paciente toma análogos de GLP-1 (Ozempic/Wegovy/Mounjaro). Requiere suelo proteico elevado.
                  </div>
                )}

                {activeSubmission.digestiveIssues && (
                  <div className="p-2 bg-white rounded-xl border">
                    <span className="font-bold text-gray-700 block">Molestias digestivas:</span>
                    <p className="text-gray-800 mt-0.5">{activeSubmission.digestiveIssues}</p>
                  </div>
                )}

                {activeSubmission.medicalHistory && (
                  <div className="p-2 bg-white rounded-xl border">
                    <span className="font-bold text-gray-700 block">Patologías declaradas:</span>
                    <p className="text-gray-800 mt-0.5">{activeSubmission.medicalHistory}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Objetivo */}
            {activeSubmission.shortTermGoal && (
              <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-1">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <span>6. Lo que la Paciente Busca Conseguir</span>
                </h4>
                <p className="p-2 bg-white rounded-xl border text-gray-800 text-2xs">
                  {activeSubmission.shortTermGoal}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copySummary}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
              {copied ? 'Copiado al Portapapeles' : 'Copiar Respuestas'}
            </Button>

            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold px-4"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
