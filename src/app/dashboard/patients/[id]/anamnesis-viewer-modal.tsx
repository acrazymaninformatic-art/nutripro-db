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
  Activity,
  Moon,
  Stethoscope,
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
  weekendHabits?: string | null
  waterIntakeLiters?: number | null
  otherBeverages?: string | null
  recall24h?: string | null
  digestiveIssues?: string | null
  digestiveSymptoms?: string | null
  medicalHistory?: string | null
  currentMedications?: string | null
  isGLP1Treatment?: boolean
  intolerancesOrAllergies?: string | null
  exerciseRoutine?: string | null
  sleepAndStress?: string | null
  emotionalEatingNotes?: string | null
  previousDietsExp?: string | null
  supplementsNotes?: string | null
  shortTermGoal?: string | null
}

interface Props {
  patientName: string
  submissions: AnamnesisSubmissionItem[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTriggerButton?: boolean
}

export function AnamnesisViewerModal({
  patientName,
  submissions,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  showTriggerButton = true,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (setControlledOpen || (() => {})) : setInternalOpen

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
Fecha de recepción: ${dateFormatted}

1. DATOS DECLARADOS:
- Nombre: ${activeSubmission.declaredName || 'No indicado'}
- Teléfono: ${activeSubmission.declaredPhone || 'No indicado'}
- Email: ${activeSubmission.declaredEmail || 'No indicado'}

2. SALUD Y MEDICACIÓN:
- Patologías/Cirugías: ${activeSubmission.medicalHistory || 'Ninguna'}
- Medicación: ${activeSubmission.currentMedications || 'Ninguna'}
- Alergias/Intolerancias: ${activeSubmission.intolerancesOrAllergies || 'Ninguna declarada'}
- Tratamiento GLP-1: ${activeSubmission.isGLP1Treatment ? 'Sí' : 'No'}

3. DIGESTIVO:
- Síntomas: ${activeSubmission.digestiveSymptoms || 'Ninguno declarado'}
- Ritmo evacuatorio: ${activeSubmission.digestiveIssues || 'Regular'}

4. PREFERENCIAS Y HÁBITOS:
- Alimentos que le encantan: ${activeSubmission.foodPreferences || 'Variada'}
- Alimentos que rechaza: ${activeSubmission.foodAversions || 'Ninguno'}
- Comidas/día: ${activeSubmission.mealsPerDay || 'No indicado'}
- Horarios: ${activeSubmission.mealScheduleNotes || 'No indicado'}
- Fines de semana: ${activeSubmission.weekendHabits || 'No indicado'}

5. HIDRATACIÓN Y ESTILO DE VIDA:
- Agua: ${activeSubmission.waterIntakeLiters ? activeSubmission.waterIntakeLiters + ' L/día' : 'No indicado'}
- Otras bebidas: ${activeSubmission.otherBeverages || 'No indicado'}
- Ejercicio: ${activeSubmission.exerciseRoutine || 'No indicado'}
- Sueño y Estrés: ${activeSubmission.sleepAndStress || 'No indicado'}

6. RELACIÓN CON LA COMIDA Y DIETAS PREVIAS:
- Ansiedad/Picar: ${activeSubmission.emotionalEatingNotes || 'No indicado'}
- Dietas previas: ${activeSubmission.previousDietsExp || 'No indicado'}
- Suplementos: ${activeSubmission.supplementsNotes || 'Ninguno'}

7. RECORDATORIO 24H:
${activeSubmission.recall24h || 'No indicado'}

8. OBJETIVO PRIORITARIO:
${activeSubmission.shortTermGoal || 'No indicado'}
    `.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      {showTriggerButton && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <FileText className="h-4 w-4" />
          <span>Ver Cuestionario Relleno</span>
          {submissions.length > 1 && (
            <Badge className="bg-blue-800 text-white text-3xs px-1.5 py-0 rounded-full ml-1">
              {submissions.length}
            </Badge>
          )}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-3xl border-gray-200">
          <DialogHeader className="p-5 pb-3 bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900">
                    Cuestionario Pre-Consulta Rellenado
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Respuestas completadas por {patientName}
                  </DialogDescription>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-2xs font-bold rounded-full">
                Rellenado por la Paciente
              </Badge>
            </div>

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
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Envío #{submissions.length - idx} ({new Date(sub.submittedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            {/* Aviso clínico */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2.5 text-2xs">
              <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Fecha de recepción: {dateFormatted}
                </span>
                <span>
                  Estos datos fueron escritos directamente por la paciente desde su móvil. Tu ficha técnica clínica permanece intacta para tus valoraciones profesionales.
                </span>
              </div>
            </div>

            {/* 1. Datos Personales Declarados */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <User className="h-4 w-4 text-blue-600" />
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

            {/* 2. Salud, Medicación y Alergias */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <HeartPulse className="h-4 w-4 text-rose-600" />
                <span>2. Historial de Salud, Medicación y Alergias</span>
              </h4>
              <div className="space-y-1.5 text-2xs">
                <div className="p-2 bg-white rounded-xl border">
                  <span className="font-bold text-gray-700 block flex items-center gap-1">
                    <Pill className="h-3 w-3 text-blue-600" />
                    Medicación habitual declarada:
                  </span>
                  <p className="text-gray-800 mt-0.5">{activeSubmission.currentMedications || 'Ninguna medicación declarada.'}</p>
                </div>

                {activeSubmission.isGLP1Treatment && (
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                    <strong>⚠️ Tratamiento GLP-1 declarado:</strong> Paciente bajo análogos GLP-1 (Ozempic/Wegovy/Mounjaro). Requiere suelo proteico elevado.
                  </div>
                )}

                {activeSubmission.intolerancesOrAllergies && (
                  <div className="p-2 bg-white rounded-xl border">
                    <span className="font-bold text-gray-700 block">Alergias o intolerancias declaradas:</span>
                    <p className="text-gray-800 mt-0.5">{activeSubmission.intolerancesOrAllergies}</p>
                  </div>
                )}

                {activeSubmission.medicalHistory && (
                  <div className="p-2 bg-white rounded-xl border">
                    <span className="font-bold text-gray-700 block">Patologías o diagnósticos previos:</span>
                    <p className="text-gray-800 mt-0.5">{activeSubmission.medicalHistory}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Salud Digestiva */}
            {(activeSubmission.digestiveSymptoms || activeSubmission.digestiveIssues) && (
              <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span>3. Salud Digestiva y Evacuaciones</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                  {activeSubmission.digestiveSymptoms && (
                    <div className="p-2 bg-white rounded-xl border">
                      <span className="text-gray-400 block">Síntomas habituales</span>
                      <strong className="text-gray-800">{activeSubmission.digestiveSymptoms}</strong>
                    </div>
                  )}
                  {activeSubmission.digestiveIssues && (
                    <div className="p-2 bg-white rounded-xl border">
                      <span className="text-gray-400 block">Ritmo evacuatorio</span>
                      <strong className="text-gray-800">{activeSubmission.digestiveIssues}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Gustos y Aversiones */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <Utensils className="h-4 w-4 text-blue-600" />
                <span>4. Preferencias y Aversiones Alimentarias</span>
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
                    <span className="text-2xs font-semibold text-blue-700 block">
                      Alimentos preferidos:
                    </span>
                    <p className="p-2 rounded-xl bg-white border border-blue-100 text-gray-800 text-2xs">
                      {activeSubmission.foodPreferences}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Hábitos, Fines de semana y Estilo de vida */}
            <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>5. Rutinas, Hidratación y Descanso</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
                <div className="p-2 bg-white rounded-xl border">
                  <span className="text-gray-400 block">Comidas/día</span>
                  <strong className="text-gray-800 text-xs">{activeSubmission.mealsPerDay || 'No'}</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border">
                  <span className="text-gray-400 block">Agua/día</span>
                  <strong className="text-gray-800 text-xs">{activeSubmission.waterIntakeLiters ? activeSubmission.waterIntakeLiters + 'L' : 'No'}</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border">
                  <span className="text-gray-400 block">Ejercicio</span>
                  <strong className="text-gray-800 text-xs truncate block">{activeSubmission.exerciseRoutine || 'No indicado'}</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border">
                  <span className="text-gray-400 block">Sueño/Estrés</span>
                  <strong className="text-gray-800 text-xs truncate block">{activeSubmission.sleepAndStress || 'No indicado'}</strong>
                </div>
              </div>

              {activeSubmission.mealScheduleNotes && (
                <div className="pt-1">
                  <span className="text-2xs text-gray-500 block font-semibold">Horarios descritos:</span>
                  <p className="p-2 rounded-xl bg-white border text-gray-800 text-2xs">{activeSubmission.mealScheduleNotes}</p>
                </div>
              )}
              {activeSubmission.weekendHabits && (
                <div className="pt-1">
                  <span className="text-2xs text-gray-500 block font-semibold">Fines de semana y comidas fuera:</span>
                  <p className="p-2 rounded-xl bg-white border text-gray-800 text-2xs">{activeSubmission.weekendHabits}</p>
                </div>
              )}
            </div>

            {/* 6. Relación con la Comida y Dietas Previas */}
            {(activeSubmission.emotionalEatingNotes || activeSubmission.previousDietsExp || activeSubmission.supplementsNotes) && (
              <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>6. Relación con la Comida, Dietas Previas y Suplementos</span>
                </h4>
                <div className="space-y-1.5 text-2xs">
                  {activeSubmission.emotionalEatingNotes && (
                    <div className="p-2 bg-white rounded-xl border">
                      <span className="text-gray-500 block font-semibold">Ansiedad o picoteo:</span>
                      <p className="text-gray-800">{activeSubmission.emotionalEatingNotes}</p>
                    </div>
                  )}
                  {activeSubmission.previousDietsExp && (
                    <div className="p-2 bg-white rounded-xl border">
                      <span className="text-gray-500 block font-semibold">Dietas anteriores:</span>
                      <p className="text-gray-800">{activeSubmission.previousDietsExp}</p>
                    </div>
                  )}
                  {activeSubmission.supplementsNotes && (
                    <div className="p-2 bg-white rounded-xl border">
                      <span className="text-gray-500 block font-semibold">Suplementos actuales:</span>
                      <p className="text-gray-800">{activeSubmission.supplementsNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. Recordatorio 24 Horas */}
            {activeSubmission.recall24h && (
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/70 space-y-2">
                <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                  <FileText className="h-4 w-4 text-blue-700" />
                  <span>7. Recordatorio Dietético de 24 Horas (Lo que comió ayer)</span>
                </h4>
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-gray-800 text-xs whitespace-pre-line leading-relaxed font-sans shadow-2xs">
                  {activeSubmission.recall24h}
                </div>
              </div>
            )}

            {/* 8. Objetivo */}
            {activeSubmission.shortTermGoal && (
              <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-1">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>8. Lo que la Paciente Busca Conseguir</span>
                </h4>
                <p className="p-2 bg-white rounded-xl border text-gray-800 text-2xs font-medium">
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
              {copied ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
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
