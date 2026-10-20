'use client'

import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Stethoscope,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  Trash2,
  CheckCircle2,
  Mic,
  MicOff,
  FileSignature,
  FileText,
  Sparkles,
  Paperclip,
} from 'lucide-react'
import { createSoapConsultation, deleteConsultation, toggleConsultationSharing } from './consultation-actions'

interface ConsultationItem {
  id: string
  date: Date | string
  notes?: string | null
  subjectiveNotes?: string | null
  objectiveNotes?: string | null
  assessmentNotes?: string | null
  planNotes?: string | null
  clinicianSignature?: string | null
  patientSummary?: string | null
  attachments?: string | null
  isSharedWithPatient: boolean
}

interface Props {
  patientId: string
  consultations: ConsultationItem[]
}

const SOAP_TEMPLATES = [
  {
    name: '1ª Consulta / Anamnesis Inicial',
    s: 'Paciente acude por primera vez con objetivo de mejorar hábitos y recomposición corporal. Refiere dificultades en cenas y horarios laborales irregulares. Sin molestias digestivas destacables.',
    o: 'Pesaje basal realizado. Se registra perímetro abdominal y composición corporal. Tensión arterial normotensa.',
    a: 'Sobrepeso grado I / Hábitos alimentarios desestructurados con déficit proteico diurno y compensación calórica nocturna.',
    p: '1. Pauta cualitativa de plato equilibrado (50% vegetal, 25% proteína magra, 25% hidrato complejo).\n2. Asegurar 2 L de agua al día.\n3. Recetas rápidas para cenas enviadas al portal.\n4. Próxima revisión en 15 días.',
  },
  {
    name: 'Seguimiento y Control de Evolución',
    s: 'Refiere muy buena adherencia (8/10) al plan durante las últimas 2 semanas. Sensación de ligereza, menos hinchazón postprandial y energía estable por la tarde.',
    o: 'Descenso ponderal favorable. Reducción de perímetro de cintura. Masa muscular preservada.',
    a: 'Excelente respuesta clínica al protocolo dietético. Buena adaptación al déficit energético moderado sin sensación de hambre voraz.',
    p: '1. Mantener pauta actual con rotación de opciones de merienda.\n2. Introducir mayor variedad de pescados azules y legumbres.\n3. Próximo control en 3 semanas.',
  },
  {
    name: 'Nutrición Deportiva & Composición Corporal',
    s: 'Comenta entrenamientos de fuerza 4 días/semana. Refiere buena recuperación muscular pero fatiga en la última serie.',
    o: 'Aumento de masa muscular magra estimado. Pliegues cutáneos estables.',
    a: 'Fase de ganancia muscular limpia (hipertrofia). Ajuste óptimo de timing de carbohidratos peri-entrenamiento.',
    p: '1. Aumentar ingesta de carbohidratos complejos en la comida pre-entreno (1.5h antes).\n2. Suplementación con Creatina monohidrato Creapure 3-5g diarios con agua.\n3. Suelo proteico garantizado en 1.8 g/kg.',
  },
  {
    name: 'Salud Digestiva / Protocolo FODMAP',
    s: 'Refiere episodios de distensión abdominal severa, flatulencias y dolor cólico postprandial tras consumir cebolla, legumbres y ciertos lácteos.',
    o: 'Abdomen timpanizado a la palpación. Peso estable.',
    a: 'Sospecha de intolerancia a FODMAPs / Sobrecrecimiento bacteriano (SIBO) o Síndrome de Intestino Irritable.',
    p: '1. Inicio Fase 1 de Eliminación FODMAP estricta durante 4 semanas.\n2. Sustitución de lácteos por sin lactosa o bebidas vegetales enriquecidas en calcio.\n3. Diario de síntomas digestivos para la próxima visita.',
  },
  {
    name: 'SOP y Resistencia a la Insulina',
    s: 'Ciclos irregulares, cansancio vespertino y antojos intensos de dulce a media tarde.',
    o: 'Perímetro cintura/altura elevado (> 0.50). Analítica con índice TG/HDL o HOMA-IR aumentado.',
    a: 'Síndrome de Ovario Poliquístico fenotipo metabólico con hiperinsulinismo compensatorio.',
    p: '1. Dieta de baja carga glucémica y rica en grasas monoinsaturadas (AOVE, frutos secos, aguacate).\n2. Pauta de Myo-Inositol y D-Chiro-Inositol 40:1.\n3. Caminatas de 15 min post-comidas para sensibilidad insulínica.',
  },
]

export function SoapConsultationPanel({ patientId, consultations }: Props) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isShared, setIsShared] = useState(false)

  // Fields state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [patientSummary, setPatientSummary] = useState('')
  const [signature, setSignature] = useState('Firmado digitalmente: Eva Vidal · Dietista-Nutricionista Col. Nº 28004')

  // Voice dictation active field tracker
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const handleApplyTemplate = (templateName: string) => {
    const t = SOAP_TEMPLATES.find((tpl) => tpl.name === templateName)
    if (!t) return
    setSubjective(t.s)
    setObjective(t.o)
    setAssessment(t.a)
    setPlan(t.p)
    // Auto generate patient summary from template
    setPatientSummary(
      `Resumen de tu consulta de hoy:\n• Evolución: ${t.o}\n• Claves de tu plan: ${t.p}\n¡Seguimos avanzando con paso firme!`
    )
  }

  const handleGeneratePatientSummary = () => {
    const summary = `Hola! Aquí tienes el resumen de tu consulta de hoy (${date}):\n\n📌 LO QUE REVISAMOS HOY:\n${objective || 'Revisión y seguimiento de tu composición corporal.'}\n\n🎯 TUS OBJETIVOS Y PAUTAS PARA LAS PRÓXIMAS SEMANAS:\n${plan || 'Continuar con el menú pautado y las pautas acordadas.'}\n\n💬 NOTA DE EVA:\n¡Muy buen trabajo en consulta! Recuerda que puedes consultar tus recetas y tu plan interactivo en cualquier momento desde tu portal.\n\n${signature}`
    setPatientSummary(summary)
  }

  // Web Speech API live Spanish voice dictation
  const toggleVoiceDictation = (fieldKey: 'subjective' | 'objective' | 'assessment' | 'plan') => {
    if (activeVoiceField === fieldKey) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setActiveVoiceField(null)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta la API de dictado por voz. Recomendamos usar Chrome o Edge.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-ES'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setActiveVoiceField(fieldKey)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (fieldKey === 'subjective') setSubjective((prev) => (prev ? `${prev} ${transcript}` : transcript))
        if (fieldKey === 'objective') setObjective((prev) => (prev ? `${prev} ${transcript}` : transcript))
        if (fieldKey === 'assessment') setAssessment((prev) => (prev ? `${prev} ${transcript}` : transcript))
        if (fieldKey === 'plan') setPlan((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }

      recognition.onerror = () => {
        setActiveVoiceField(null)
      }

      recognition.onend = () => {
        setActiveVoiceField(null)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setActiveVoiceField(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('patientId', patientId)
    formData.set('date', date)
    formData.set('subjectiveNotes', subjective)
    formData.set('objectiveNotes', objective)
    formData.set('assessmentNotes', assessment)
    formData.set('planNotes', plan)
    formData.set('patientSummary', patientSummary)
    formData.set('clinicianSignature', signature)
    formData.set('isSharedWithPatient', isShared ? 'true' : 'false')

    try {
      await createSoapConsultation(formData)
      setShowNewForm(false)
      // reset fields
      setSubjective('')
      setObjective('')
      setAssessment('')
      setPlan('')
      setPatientSummary('')
    } catch (err: any) {
      alert(err.message || 'Error al guardar la nota SOAP')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta nota de consulta?')) return
    await deleteConsultation(id, patientId)
  }

  const handleToggleSharing = async (id: string, current: boolean) => {
    setLoading(true)
    try {
      await toggleConsultationSharing(id, patientId, !current)
    } catch (e: any) {
      alert(e.message || 'Error al cambiar visibilidad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Notas Estructuradas de Consulta (SOAP)
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Con plantillas clínicas de 1 clic, dictado por voz en español y resumen automático para el paciente
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewForm(!showNewForm)}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            {showNewForm ? 'Cerrar Formulario' : 'Nueva Nota SOAP'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {showNewForm && (
          <form onSubmit={handleSubmit} className="p-5 bg-blue-50/40 border border-blue-200 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-blue-950">Redactar Nota Clínica de Consulta</h4>
                <p className="text-2xs text-gray-500">Selecciona una plantilla o dicta por voz con el micrófono</p>
              </div>

              {/* Plantillas clínicas rápidas */}
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold text-blue-900">Plantilla:</span>
                <select
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  defaultValue=""
                  className="text-xs p-1.5 rounded-xl border border-blue-300 bg-white text-gray-800 font-medium focus:outline-none"
                >
                  <option value="" disabled>Cargar plantilla clínica...</option>
                  {SOAP_TEMPLATES.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs font-semibold">Fecha de Consulta</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl bg-white"
                />
              </div>

              <div className="sm:col-span-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsShared(!isShared)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    isShared
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {isShared ? <Eye className="w-3.5 h-3.5 text-blue-700" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{isShared ? 'Publicado: Visible en el portal del paciente' : 'Privado: Solo Eva Vidal (apagado por defecto)'}</span>
                </button>
              </div>
            </div>

            {/* Cuatro cuadrantes SOAP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* S */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900">
                    S — Subjetivo (Lo que refiere el paciente)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleVoiceDictation('subjective')}
                    className={`p-1 rounded-full text-2xs flex items-center gap-1 px-2 border ${
                      activeVoiceField === 'subjective'
                        ? 'bg-red-500 text-white border-red-600 animate-pulse'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50'
                    }`}
                    title="Dictado por voz"
                  >
                    {activeVoiceField === 'subjective' ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3 text-blue-600" />}
                    <span>{activeVoiceField === 'subjective' ? 'Escuchando...' : 'Dictar'}</span>
                  </button>
                </div>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  rows={3}
                  placeholder="Sensaciones, adherencia subjetiva, dificultades, eventos sociales, digestión referida..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* O */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900">
                    O — Objetivo (Datos medidos en sesión)
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleVoiceDictation('objective')}
                    className={`p-1 rounded-full text-2xs flex items-center gap-1 px-2 border ${
                      activeVoiceField === 'objective'
                        ? 'bg-red-500 text-white border-red-600 animate-pulse'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50'
                    }`}
                    title="Dictado por voz"
                  >
                    {activeVoiceField === 'objective' ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3 text-blue-600" />}
                    <span>{activeVoiceField === 'objective' ? 'Escuchando...' : 'Dictar'}</span>
                  </button>
                </div>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  placeholder="Peso actual, variación grasa/músculo, perímetro abdominal, tensión o analítica..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* A */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900">
                    A — Apreciación / Juicio Clínico
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleVoiceDictation('assessment')}
                    className={`p-1 rounded-full text-2xs flex items-center gap-1 px-2 border ${
                      activeVoiceField === 'assessment'
                        ? 'bg-red-500 text-white border-red-600 animate-pulse'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50'
                    }`}
                    title="Dictado por voz"
                  >
                    {activeVoiceField === 'assessment' ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3 text-blue-600" />}
                    <span>{activeVoiceField === 'assessment' ? 'Escuchando...' : 'Dictar'}</span>
                  </button>
                </div>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  rows={3}
                  placeholder="Diagnóstico dietético-nutricional, evolución respecto a la última sesión..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* P */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-blue-900">
                    P — Plan & Próximos Pasos Acordados
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleVoiceDictation('plan')}
                    className={`p-1 rounded-full text-2xs flex items-center gap-1 px-2 border ${
                      activeVoiceField === 'plan'
                        ? 'bg-red-500 text-white border-red-600 animate-pulse'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50'
                    }`}
                    title="Dictado por voz"
                  >
                    {activeVoiceField === 'plan' ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3 text-blue-600" />}
                    <span>{activeVoiceField === 'plan' ? 'Escuchando...' : 'Dictar'}</span>
                  </button>
                </div>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={3}
                  placeholder="Ajustes de kcal/macros, nuevo menú semanal, recetas prescritas, fecha de próxima revisión..."
                  className="w-full text-xs p-3 rounded-2xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Resumen Automático para el Paciente (5.2) */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <label className="text-xs font-bold text-amber-950">
                    Resumen Automático para el Paciente (Lenguaje comprensible)
                  </label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePatientSummary}
                  className="rounded-xl text-3xs font-bold border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                >
                  ⚡ Auto-Generar Resumen
                </Button>
              </div>
              <textarea
                value={patientSummary}
                onChange={(e) => setPatientSummary(e.target.value)}
                rows={3}
                placeholder="Genera o redacta aquí el mensaje resumen que el paciente verá en su portal si publicas la nota..."
                className="w-full text-xs p-3 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Firma Clínica Digital y Adjuntos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="signature" className="text-2xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <FileSignature className="h-3 w-3 text-blue-600" />
                  <span>Firma Profesional</span>
                </Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="rounded-xl text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="attachments" className="text-2xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Paperclip className="h-3 w-3 text-blue-600" />
                  <span>Adjuntos / Referencias</span>
                </Label>
                <Input
                  id="attachments"
                  name="attachments"
                  placeholder="ej. informe_analitica_marzo.pdf"
                  className="rounded-xl text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewForm(false)}
                className="text-xs text-gray-500"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {loading ? 'Guardando...' : 'Guardar Consulta SOAP'}
              </Button>
            </div>
          </form>
        )}

        {consultations.length === 0 ? (
          <p className="text-center py-6 text-sm text-gray-400">
            Aún no hay notas de consulta registradas. Pulsa en "Nueva Nota SOAP" para añadir la primera sesión.
          </p>
        ) : (
          <div className="space-y-4">
            {consultations.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/40 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-gray-900">
                      Consulta del {new Date(c.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleToggleSharing(c.id, c.isSharedWithPatient)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                        c.isSharedWithPatient
                          ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                      title="Haz clic para cambiar la visibilidad para el paciente"
                    >
                      {c.isSharedWithPatient ? (
                        <>
                          <Eye className="w-3 h-3 text-blue-600" />
                          <span>Visible para el paciente</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-gray-500" />
                          <span>Privado (solo Eva)</span>
                        </>
                      )}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {c.subjectiveNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100">
                      <span className="font-bold text-blue-900 block mb-1">Subjetivo:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.subjectiveNotes}</p>
                    </div>
                  )}
                  {c.objectiveNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100">
                      <span className="font-bold text-blue-900 block mb-1">Objetivo:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.objectiveNotes}</p>
                    </div>
                  )}
                  {c.assessmentNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100">
                      <span className="font-bold text-blue-900 block mb-1">Apreciación / Juicio:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.assessmentNotes}</p>
                    </div>
                  )}
                  {c.planNotes && (
                    <div className="p-3 bg-white rounded-xl border border-gray-100">
                      <span className="font-bold text-blue-900 block mb-1">Plan Acordado:</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.planNotes}</p>
                    </div>
                  )}
                </div>

                {c.patientSummary && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span>Resumen para el Paciente:</span>
                    </span>
                    <p className="text-amber-950 whitespace-pre-wrap">{c.patientSummary}</p>
                  </div>
                )}

                {c.clinicianSignature && (
                  <div className="text-2xs text-gray-400 pt-1 flex items-center gap-1.5 italic">
                    <FileSignature className="h-3 w-3 text-gray-400" />
                    <span>{c.clinicianSignature}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
