'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, Baby, Check, CheckCircle2, HeartPulse, Loader2, Moon, Paperclip, Stethoscope, Target, Upload, User, X } from 'lucide-react'
import Link from 'next/link'
import { submitPortalAnamnesisAction, saveQuestionnaireDraftAction } from '../../actions'

interface Props {
  patient: {
    firstName: string
    lastName: string
    phone?: string | null
    email?: string | null
    birthDate?: string | null
    sex?: string | null
    medicalHistory?: string | null
    currentMedications?: string | null
    isGLP1Treatment?: boolean | null
    foodAversions?: string | null
    shortTermGoal?: string | null
  }
}

export function AltaFormClient({ patient }: Props) {
  const isFemale = patient.sex === 'FEMALE'
  // Si no es mujer, el paso 6 (salud femenina) se oculta según la especificación 5.4
  const stepsList = isFemale
    ? [
        { num: 1, title: 'Datos personales', icon: User },
        { num: 2, title: 'Historial clínico', icon: HeartPulse },
        { num: 3, title: 'Digestivo y metabolismo', icon: Stethoscope },
        { num: 4, title: 'Estilo de vida', icon: Moon },
        { num: 5, title: 'Actividad física', icon: Activity },
        { num: 6, title: 'Salud femenina', icon: Baby },
        { num: 7, title: 'Objetivos', icon: Target },
      ]
    : [
        { num: 1, title: 'Datos personales', icon: User },
        { num: 2, title: 'Historial clínico', icon: HeartPulse },
        { num: 3, title: 'Digestivo y metabolismo', icon: Stethoscope },
        { num: 4, title: 'Estilo de vida', icon: Moon },
        { num: 5, title: 'Actividad física', icon: Activity },
        { num: 7, title: 'Objetivos', icon: Target },
      ]

  const [stepIndex, setStepIndex] = useState(0)
  const currentStepDef = stepsList[stepIndex]
  const currentStepNum = currentStepDef.num

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGLP1, setIsGLP1] = useState(Boolean(patient.isGLP1Treatment))
  const [isPregnant, setIsPregnant] = useState(false)
  const [isBreastfeeding, setIsBreastfeeding] = useState(false)

  // Attachments state (5.4: analíticas PDF o fotos)
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string }>>([])
  const [uploadName, setUploadName] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadType, setUploadType] = useState('ANALYSIS_PDF')
  const [showAttachModal, setShowAttachModal] = useState(false)

  // Autosave state (5.4)
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Autoguardado en borrador cada 30 segundos si hay cambios
  useEffect(() => {
    const timer = setInterval(() => {
      if (formRef.current && !isSubmitted) {
        const fd = new FormData(formRef.current)
        const entries: Record<string, any> = {}
        fd.forEach((val, key) => {
          entries[key] = val
        })
        entries.isGLP1Treatment = isGLP1
        entries.pregnant = isPregnant
        entries.breastfeeding = isBreastfeeding
        entries.attachments = attachments

        // Guardar borrador en localStorage como fallback inmediato
        try {
          localStorage.setItem(`evsoftware_anamnesis_draft`, JSON.stringify(entries))
          setLastAutoSave(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
        } catch (e) {}
      }
    }, 25000)

    return () => clearInterval(timer)
  }, [isGLP1, isPregnant, isBreastfeeding, attachments, isSubmitted])

  const handleAddAttachment = () => {
    if (!uploadName.trim()) return
    setAttachments((prev) => [
      ...prev,
      {
        name: uploadName.trim(),
        url: uploadUrl.trim() || 'data:application/pdf;base64,sample',
        type: uploadType,
      },
    ])
    setUploadName('')
    setUploadUrl('')
    setShowAttachModal(false)
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await submitPortalAnamnesisAction({
        // 1. Datos personales
        firstName: formData.get('firstName') as string || patient.firstName,
        lastName: formData.get('lastName') as string || patient.lastName,
        name: `${formData.get('firstName') || patient.firstName} ${formData.get('lastName') || patient.lastName}`,
        birthDate: formData.get('birthDate') as string,
        sex: formData.get('sex') as string || patient.sex,
        gender: formData.get('sex') as string || patient.sex,
        phone: formData.get('phone') as string || patient.phone,
        email: formData.get('email') as string || patient.email,
        occupation: formData.get('occupation') as string,
        declaredWeightKg: formData.get('declaredWeightKg') ? Number(formData.get('declaredWeightKg')) : undefined,
        declaredHeightCm: formData.get('declaredHeightCm') ? Number(formData.get('declaredHeightCm')) : undefined,

        // 2. Historial clínico (Paso crítico)
        allergies: formData.get('allergies') as string,
        intolerances: formData.get('intolerances') as string,
        intolerancesOrAllergies: `${formData.get('allergies') || ''} ${formData.get('intolerances') || ''}`.trim(),
        medicalHistory: formData.get('medicalHistory') as string,
        currentMedications: formData.get('currentMedications') as string,
        isGLP1Treatment: isGLP1,
        supplements: formData.get('supplements') as string,
        surgeries: formData.get('surgeries') as string,
        familyHistory: formData.get('familyHistory') as string,

        // 3. Digestivo y metabolismo
        digestiveIssues: formData.get('digestiveIssues') as string,
        digestiveSymptoms: formData.get('digestiveSymptoms') as string,
        bowelFrequency: formData.get('bowelFrequency') as string,
        foodAversions: formData.get('foodAversions') as string,
        waterIntakeLiters: formData.get('waterIntakeLiters') ? Number(formData.get('waterIntakeLiters')) : undefined,
        caffeineDaily: formData.get('caffeineDaily') ? Number(formData.get('caffeineDaily')) : undefined,
        alcoholFrequency: formData.get('alcoholFrequency') as string,
        smoking: formData.get('smoking') === 'true',

        // 4. Estilo de vida
        workSchedule: formData.get('workSchedule') as string,
        sleepHours: formData.get('sleepHours') ? Number(formData.get('sleepHours')) : undefined,
        sleepQuality: formData.get('sleepQuality') as string,
        stressLevel: formData.get('stressLevel') as string,
        mealsPerDay: formData.get('mealsPerDay') ? Number(formData.get('mealsPerDay')) : undefined,
        mealSchedule: formData.get('mealSchedule') as string,
        eatsOut: formData.get('eatsOut') as string,
        cooksAtHome: formData.get('cooksAtHome') === 'true',

        // 5. Actividad física
        activityLevel: formData.get('activityLevel') as string,
        exerciseType: formData.get('exerciseType') as string,
        exerciseFrequency: formData.get('exerciseFrequency') ? Number(formData.get('exerciseFrequency')) : undefined,
        exerciseDuration: formData.get('exerciseDuration') ? Number(formData.get('exerciseDuration')) : undefined,
        exerciseTime: formData.get('exerciseTime') as string,
        sportGoals: formData.get('sportGoals') as string,
        trainingExperience: formData.get('trainingExperience') as string,

        // 6. Salud femenina (si procede)
        menstrualCycle: isFemale ? (formData.get('menstrualCycle') as string) : undefined,
        pregnant: isFemale ? isPregnant : false,
        breastfeeding: isFemale ? isBreastfeeding : false,
        contraceptive: isFemale ? (formData.get('contraceptive') as string) : undefined,
        hormoneTherapy: isFemale ? formData.get('hormoneTherapy') === 'true' : false,

        // 7. Objetivos
        objective: formData.get('objective') as string,
        shortTermGoal: formData.get('shortTermGoal') as string,
        longTermGoal: formData.get('longTermGoal') as string,
        motivation: formData.get('motivation') as string,
        previousDiets: formData.get('previousDiets') as string,
        dietDuration: formData.get('dietDuration') as string,
        additionalNotes: formData.get('additionalNotes') as string,

        // Adjuntos
        attachments,
      })

      try {
        localStorage.removeItem('evsoftware_anamnesis_draft')
      } catch (e) {}

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el cuestionario.')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="rounded-3xl p-8 text-center bg-white border border-blue-200 shadow-md max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Cuestionario Enviado con Éxito!</h2>
        <p className="mt-2 text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
          Tus respuestas han sido recibidas en el servidor seguro de EVSoftware.
          Eva Vidal las revisará campo a campo para preparar tu consulta nutricional y tus pautas personalizadas.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/paciente">
            <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6">
              Ir a Mi Inicio
            </Button>
          </Link>
          <Link href="/paciente/cuestionarios">
            <Button variant="outline" className="rounded-2xl text-xs font-bold">
              Ver Mis Documentos
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-3xs font-bold rounded-full mb-1">
              PORTAL DEL PACIENTE · CUESTIONARIO DE ALTA
            </Badge>
            <h1 className="text-xl font-bold text-gray-900">Tu Expediente Clínico Nutricional</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Rellena tu información para que Eva prepare tu estudio antes de la primera cita.
            </p>
          </div>

          {lastAutoSave && (
            <div className="flex items-center gap-1.5 text-2xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span>Autoguardado {lastAutoSave}</span>
            </div>
          )}
        </div>

        {/* Barra de progreso de los 7 pasos */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-2xs font-bold text-gray-400 mb-2">
            <span>Paso {stepIndex + 1} de {stepsList.length}: {currentStepDef.title}</span>
            <span>{Math.round(((stepIndex + 1) / stepsList.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((stepIndex + 1) / stepsList.length) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1">
            {stepsList.map((s, idx) => {
              const isCurrent = idx === stepIndex
              const isCompleted = idx < stepIndex
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStepIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/40'
                      : isCompleted
                      ? 'bg-blue-100/90 text-blue-800 hover:bg-blue-200/80 border border-blue-200/60'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-3xs font-extrabold ${
                      isCurrent
                        ? 'bg-white text-blue-700'
                        : isCompleted
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="h-[1em] w-[1em] shrink-0" /> : s.num}
                  </span>
                  <span>{s.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario */}
      <Card className="rounded-3xl border-gray-200 shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* PASO 1: DATOS PERSONALES */}
            {currentStepNum === 1 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>1. Datos Personales y Filiación</span>
                  </h3>
                  <p className="text-2xs text-gray-500 mt-0.5">
                    Confirma tus datos básicos de filiación.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Nombre</Label>
                    <Input name="firstName" defaultValue={patient.firstName} required className="rounded-xl mt-1 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Apellidos</Label>
                    <Input name="lastName" defaultValue={patient.lastName} required className="rounded-xl mt-1 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Correo Electrónico</Label>
                    <Input name="email" type="email" defaultValue={patient.email || ''} required className="rounded-xl mt-1 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Teléfono de contacto</Label>
                    <Input name="phone" defaultValue={patient.phone || ''} required className="rounded-xl mt-1 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Fecha de Nacimiento</Label>
                    <Input
                      name="birthDate"
                      type="date"
                      defaultValue={patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : ''}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Profesión u Ocupación</Label>
                    <Input name="occupation" placeholder="Ej: Docente, administrativo, ingeniero..." className="rounded-xl mt-1 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">
                      Peso aproximado habitual (kg)
                      <span className="text-3xs text-purple-700 font-normal ml-1.5">(Declarado de referencia)</span>
                    </Label>
                    <Input name="declaredWeightKg" type="number" step="0.1" placeholder="Ej: 68.5" className="rounded-xl mt-1 text-xs" />
                    <p className="text-3xs text-gray-400 mt-1">Eva medirá tu peso y composición en consulta para la gráfica clínica.</p>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">
                      Altura aproximada (cm)
                      <span className="text-3xs text-purple-700 font-normal ml-1.5">(Declarada)</span>
                    </Label>
                    <Input name="declaredHeightCm" type="number" step="0.5" placeholder="Ej: 168" className="rounded-xl mt-1 text-xs" />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: HISTORIAL CLÍNICO (PASO CRÍTICO) */}
            {currentStepNum === 2 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-rose-600" />
                      <span>2. Historial Clínico, Alergias y Medicación</span>
                    </h3>
                    <Badge className="bg-rose-600 text-white text-3xs font-black rounded-full">
                      PASO CRÍTICO
                    </Badge>
                  </div>
                  <p className="text-2xs text-gray-500 mt-0.5">
                    Esta información es indispensable para garantizar la seguridad clínica de tu pauta y evitar alérgenos.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-bold text-rose-950">Alergias Alimentarias Diagnosticadas</Label>
                    <Textarea
                      name="allergies"
                      placeholder="Frutos secos, marisco, huevo, pescado, melocotón... (o escribe 'Ninguna conocida')"
                      rows={2}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Intolerancias Alimentarias Confirmadas o Sospechadas</Label>
                    <Textarea
                      name="intolerances"
                      placeholder="Lactosa, fructosa, gluten no celíaco, sorbitol... (o 'Ninguna')"
                      rows={2}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Diagnósticos Médicos y Patologías Relevantes</Label>
                    <Textarea
                      name="medicalHistory"
                      defaultValue={patient.medicalHistory || ''}
                      placeholder="Diabetes, hipertensión, hipotiroidismo, SOP, hígado graso, colesterol elevado, etc."
                      rows={2}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-blue-950">Medicación Habitual Prescrita</Label>
                    <Textarea
                      name="currentMedications"
                      defaultValue={patient.currentMedications || ''}
                      placeholder="Nombre del fármaco y dosis si la conoces (ej: Eutirox 75 mcg, Metformina 850 mg, Omeprazol...)"
                      rows={2}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="glp1"
                      checked={isGLP1}
                      onChange={(e) => setIsGLP1(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <label htmlFor="glp1" className="text-xs font-bold text-amber-950 cursor-pointer">
                      ¿Tomas o te inyectas análogos GLP-1 (Ozempic, Wegovy, Saxenda, Mounjaro, Rybelsus)?
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Suplementos o Vitaminas Actuales</Label>
                      <Input name="supplements" placeholder="Vitamina D, magnesio, proteína en polvo..." className="rounded-xl mt-1 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Cirugías o Intervenciones Previas</Label>
                      <Input name="surgeries" placeholder="Vesícula, apendicitis, cesárea..." className="rounded-xl mt-1 text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: DIGESTIVO Y METABOLISMO */}
            {currentStepNum === 3 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>3. Sistema Digestivo y Tránsito Intestinal</span>
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Molestias Digestivas Habituales</Label>
                    <Textarea
                      name="digestiveIssues"
                      placeholder="Reflujo, acidez, hinchazón por las tardes, gases, digestiones pesadas, dolor abdominal..."
                      rows={2}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Ritmo o Hábito Intestinal</Label>
                      <select name="bowelFrequency" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                        <option value="diario_1_2">Diario (1-2 veces al día - normal)</option>
                        <option value="dias_alternos">Cada 2 o 3 días</option>
                        <option value="estrenimiento">Estreñimiento frecuente (&lt;3 veces/semana)</option>
                        <option value="frecuente">Más de 3 veces al día o heces blandas</option>
                        <option value="irregular">Alternancia irregular de diarrea y estreñimiento</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-bold">Litros de Agua al Día</Label>
                      <Input name="waterIntakeLiters" type="number" step="0.1" placeholder="Ej: 1.5" className="rounded-xl mt-1 text-xs" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Alimentos que te Desagradan o Sientan Mal</Label>
                    <Textarea
                      name="foodAversions"
                      defaultValue={patient.foodAversions || ''}
                      placeholder="Comidas que no deseas que Eva incluya en tu menú"
                      rows={2}
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Cafés o Tés al día</Label>
                      <Input name="caffeineDaily" type="number" placeholder="Ej: 2" className="rounded-xl mt-1 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Consumo de Alcohol</Label>
                      <select name="alcoholFrequency" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                        <option value="none">Nunca o casi nunca</option>
                        <option value="occasional">Ocasional (eventos puntuales)</option>
                        <option value="weekend">Fines de semana</option>
                        <option value="daily">Diario</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="smoking" name="smoking" value="true" className="w-4 h-4 rounded text-blue-600" />
                      <label htmlFor="smoking" className="text-xs font-bold text-gray-800 cursor-pointer">
                        ¿Fumas habitualmente?
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: ESTILO DE VIDA */}
            {currentStepNum === 4 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>4. Estilo de Vida, Sueño y Rutinas</span>
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Horario de Trabajo / Estudio</Label>
                      <select name="workSchedule" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                        <option value="morning">Jornada de mañanas</option>
                        <option value="split">Jornada partida (mañana y tarde)</option>
                        <option value="afternoon">Tardes</option>
                        <option value="night">Nocturno</option>
                        <option value="rotating">Turnos rotatorios</option>
                        <option value="flexible">Teletrabajo / flexible</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Horas de Sueño por Noche</Label>
                      <Input name="sleepHours" type="number" step="0.5" placeholder="Ej: 7.5" className="rounded-xl mt-1 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Calidad del Descanso</Label>
                      <select name="sleepQuality" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                        <option value="good">Buena (despierto descansado/a)</option>
                        <option value="regular">Regular (varios despertares)</option>
                        <option value="poor">Mala (poco reparador)</option>
                        <option value="insomnia">Insomnio frecuente</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Nivel de Estrés Habitual</Label>
                      <select name="stressLevel" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                        <option value="low">Bajo</option>
                        <option value="moderate">Moderado (asumible)</option>
                        <option value="high">Alto</option>
                        <option value="very_high">Muy alto / desbordante</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Número de Comidas al Día</Label>
                      <Input name="mealsPerDay" type="number" placeholder="Ej: 3 o 4" className="rounded-xl mt-1 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">¿Comes fuera de casa?</Label>
                      <select name="eatsOut" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                        <option value="never">Casi nunca</option>
                        <option value="rarely">1 vez cada 15 días</option>
                        <option value="weekly">1-3 veces por semana</option>
                        <option value="daily">A diario por trabajo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Horarios Habituales de Comidas</Label>
                    <Input name="mealSchedule" placeholder="Ej: Desayuno 8h, Comida 14h, Cena 21h" className="rounded-xl mt-1 text-xs" />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5: ACTIVIDAD FÍSICA */}
            {currentStepNum === 5 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>5. Actividad Física y Ejercicio</span>
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Nivel General de Actividad en el Día a Día</Label>
                    <select name="activityLevel" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                      <option value="SEDENTARY">Sedentario (trabajo de mesa, pocos pasos)</option>
                      <option value="LIGHT">Ligero (caminatas suaves, 5.000-7.000 pasos)</option>
                      <option value="MODERATE">Moderado (entreno 3-4 días/sem o trabajo activo)</option>
                      <option value="ACTIVE">Activo (entreno 5+ días/sem o trabajo físico)</option>
                      <option value="VERY_ACTIVE">Muy activo / Atleta de competición</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Tipo de Ejercicio o Deporte</Label>
                    <Input name="exerciseType" placeholder="Ej: Fuerza en gimnasio, running, crossfit, natación, pilates..." className="rounded-xl mt-1 text-xs" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Días por Semana</Label>
                      <Input name="exerciseFrequency" type="number" placeholder="Ej: 3" className="rounded-xl mt-1 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Duración Media por Sesión (minutos)</Label>
                      <Input name="exerciseDuration" type="number" placeholder="Ej: 60" className="rounded-xl mt-1 text-xs" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Objetivos Deportivos o Marcas (si los tienes)</Label>
                    <Input name="sportGoals" placeholder="Carreras, progresión de fuerza, salud articular..." className="rounded-xl mt-1 text-xs" />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 6: SALUD FEMENINA (SOLO SI ES MUJER) */}
            {currentStepNum === 6 && isFemale && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Baby className="w-4 h-4 text-purple-600" />
                      <span>6. Salud Femenina y Hormonal</span>
                    </h3>
                    <Badge variant="outline" className="text-3xs text-purple-700 border-purple-200 bg-purple-50">
                      Adaptación Femenina
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Ciclo Menstrual</Label>
                    <select name="menstrualCycle" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                      <option value="regular">Regular (26-32 días)</option>
                      <option value="irregular">Irregular</option>
                      <option value="amenorrhea">Amenorrea (ausencia de menstruación)</option>
                      <option value="menopause">Menopausia / Perimenopausia</option>
                      <option value="not_applicable">No aplica</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="pregnant"
                        checked={isPregnant}
                        onChange={(e) => setIsPregnant(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600"
                      />
                      <label htmlFor="pregnant" className="text-xs font-bold text-purple-950 cursor-pointer">
                        ¿Estás embarazada actualmente?
                      </label>
                    </div>

                    <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="breastfeeding"
                        checked={isBreastfeeding}
                        onChange={(e) => setIsBreastfeeding(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600"
                      />
                      <label htmlFor="breastfeeding" className="text-xs font-bold text-purple-950 cursor-pointer">
                        ¿Estás en periodo de lactancia materna?
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Método Anticonceptivo</Label>
                    <select name="contraceptive" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                      <option value="none">Ninguno</option>
                      <option value="hormonal_oral">Anticonceptivo oral (píldora)</option>
                      <option value="diu_hormonal">DIU hormonal</option>
                      <option value="diu_cobre">DIU de cobre</option>
                      <option value="barrier">Barrera / Preservativo</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 7: OBJETIVOS Y PRIORIDADES */}
            {currentStepNum === 7 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-600" />
                    <span>7. Objetivos, Compromiso y Expectativas</span>
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Objetivo Principal con Eva</Label>
                    <select name="objective" className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1">
                      <option value="WEIGHT_LOSS">Pérdida de masa grasa y recomposición</option>
                      <option value="MUSCLE_GAIN">Ganancia de masa muscular limpia</option>
                      <option value="HEALTH_IMPROVEMENT">Mejora de salud digestiva / patología metabólica</option>
                      <option value="SPORTS_PERFORMANCE">Rendimiento deportivo y energía</option>
                      <option value="MAINTENANCE">Educación nutricional y mantenimiento</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">¿Qué te gustaría conseguir en las primeras 4-6 semanas?</Label>
                    <Input
                      name="shortTermGoal"
                      defaultValue={patient.shortTermGoal || ''}
                      placeholder="Ej: Menos hinchazón digestiva, aprender a organizarme el menú semanal..."
                      required
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Objetivo a Medio-Largo Plazo (6 a 12 meses)</Label>
                    <Input name="longTermGoal" placeholder="Ej: Consolidar hábitos de por vida, ganar masa muscular..." className="rounded-xl mt-1 text-xs" />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">¿Has hecho dietas previas? ¿Qué funcionó y qué no?</Label>
                    <Textarea
                      name="previousDiets"
                      rows={2}
                      placeholder="Dietas anteriores, efecto rebote, experiencias previas..."
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Comentarios o Notas Adicionales para Eva</Label>
                    <Textarea
                      name="additionalNotes"
                      rows={2}
                      placeholder="Cualquier información que consideres relevante para tu plan"
                      className="rounded-xl mt-1 text-xs"
                    />
                  </div>

                  {/* SECCIÓN DE ADJUNTOS DENTRO DEL FORMULARIO (5.4) */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5 text-gray-900">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>Adjuntar Analíticas o Documentos Médicos (PDF / Fotos)</span>
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAttachModal(true)}
                        className="rounded-xl text-3xs font-bold h-7 gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Adjuntar fichero</span>
                      </Button>
                    </div>

                    {attachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {attachments.map((att, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                            <span className="font-medium text-gray-800 truncate">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(i)}
                              className="text-gray-400 hover:text-rose-600 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStepIndex(stepIndex - 1)}
                  className="rounded-2xl text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Paso Anterior</span>
                </Button>
              ) : (
                <div />
              )}

              {stepIndex < stepsList.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStepIndex(stepIndex + 1)}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5"
                >
                  <span>Siguiente: {stepsList[stepIndex + 1].title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 shadow-xs"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando respuestas...
                    </span>
                  ) : (
                    <span>Finalizar y Enviar a Eva</span>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MODAL PARA ADJUNTAR FICHERO */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-gray-900">Adjuntar Analítica o Informe (PDF / Foto)</h4>
            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-bold">Nombre descriptivo del documento</Label>
                <Input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Ej: Analítica sangre septiembre 2026.pdf"
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Tipo de documento</Label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs mt-1"
                >
                  <option value="ANALYSIS_PDF">Analítica de sangre (PDF)</option>
                  <option value="MEDICAL_REPORT">Informe médico (PDF)</option>
                  <option value="BODY_PHOTO">Foto de composición (JPG/PNG)</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAttachModal(false)} className="rounded-xl text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleAddAttachment} className="rounded-xl bg-blue-600 text-white text-xs font-bold">
                Añadir al formulario
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
