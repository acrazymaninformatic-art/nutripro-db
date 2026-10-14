'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2,
  User,
  HeartPulse,
  Utensils,
  Target,
  AlertCircle,
  ArrowRight,
  Activity,
  Droplets,
  Moon,
  Sparkles,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { submitAnamnesis } from './actions'

interface Props {
  token: string
  patient: {
    name: string
    phone?: string | null
    email?: string | null
    medicalHistory?: string | null
    currentMedications?: string | null
    isGLP1Treatment?: boolean | null
    foodAversions?: string | null
    shortTermGoal?: string | null
  }
}

export function AnamnesisForm({ patient, token }: Props) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGLP1, setIsGLP1] = useState(Boolean(patient.isGLP1Treatment))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await submitAnamnesis({
        token,
        name: (formData.get('name') as string) || patient.name,
        birthDate: formData.get('birthDate') as string,
        gender: formData.get('gender') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,

        // Salud y Medicación
        medicalHistory: formData.get('medicalHistory') as string,
        currentMedications: formData.get('currentMedications') as string,
        isGLP1Treatment: isGLP1,
        intolerancesOrAllergies: formData.get('intolerancesOrAllergies') as string,

        // Síntomas Digestivos
        digestiveIssues: formData.get('digestiveIssues') as string,
        digestiveSymptoms: formData.get('digestiveSymptoms') as string,

        // Hábitos y Nutrición
        foodPreferences: formData.get('foodPreferences') as string,
        foodAversions: formData.get('foodAversions') as string,
        mealsPerDay: formData.get('mealsPerDay') ? Number(formData.get('mealsPerDay')) : undefined,
        mealScheduleNotes: formData.get('mealSchedule') as string,
        weekendHabits: formData.get('weekendHabits') as string,
        recall24h: formData.get('recall24h') as string,

        // Hidratación y Estilo de vida
        waterIntakeLiters: formData.get('waterIntake') ? Number(formData.get('waterIntake')) : undefined,
        otherBeverages: formData.get('otherBeverages') as string,
        exerciseRoutine: formData.get('exerciseRoutine') as string,
        sleepAndStress: formData.get('sleepAndStress') as string,

        // Relación con la comida y objetivos
        emotionalEatingNotes: formData.get('emotionalEatingNotes') as string,
        previousDietsExp: formData.get('previousDietsExp') as string,
        supplementsNotes: formData.get('supplementsNotes') as string,
        shortTermGoal: formData.get('shortTermGoal') as string,
      })

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la anamnesis')
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de confirmación una vez enviado (NO se puede editar ni rellenar otro)
  if (isSubmitted) {
    return (
      <Card className="rounded-3xl border-blue-200 bg-white p-8 sm:p-10 text-center shadow-xl">
        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          ¡Cuestionario Enviado con Éxito!
        </h2>
        <p className="text-base text-gray-700 max-w-lg mx-auto mt-3 leading-relaxed">
          Muchas gracias, <strong>{patient.name}</strong>. Todas tus respuestas han quedado registradas de forma segura y confidencial en tu expediente.
        </p>

        <div className="my-6 p-4 sm:p-5 bg-blue-50/70 border border-blue-200 rounded-2xl text-left text-xs text-blue-950 space-y-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
            <span>¿Qué ocurre ahora?</span>
          </div>
          <p className="text-blue-900/80 leading-relaxed">
            Tu nutricionista <strong>Eva Vidal</strong> revisará minuciosamente tus respuestas para tener preparada tu estrategia y tu plan de alimentación adaptado a tu estilo de vida antes de tu sesión.
          </p>
          <p className="text-blue-900/70 text-2xs italic pt-1">
            🔒 Este formulario queda cerrado por seguridad clínica. Si surge algún cambio de medicación o síntoma antes de la cita, lo comentaremos en la consulta.
          </p>
        </div>

        <div className="text-xs text-gray-400 font-medium">
          Consulta de Nutrición Eva Vidal • EVSoftware
        </div>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerta de error si ocurre */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">No se pudo enviar el cuestionario:</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 1. Datos Personales y Contacto */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-slate-50 border-b border-gray-100 pb-3.5">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-2xs">
              <User className="h-4 w-4" />
            </div>
            <span>1. Datos Personales y de Contacto</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Identificación para tu expediente clínico y seguimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Nombre y Apellidos *</Label>
              <Input
                name="name"
                defaultValue={patient.name}
                required
                placeholder="Ej. Laura Gómez Martín"
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Teléfono Móvil *</Label>
              <Input
                name="phone"
                defaultValue={patient.phone || ''}
                required
                placeholder="Ej. 611 222 333"
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Correo Electrónico</Label>
              <Input
                type="email"
                name="email"
                defaultValue={patient.email || ''}
                placeholder="Ej. laura@gmail.com"
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Fecha Nacimiento</Label>
                <Input type="date" name="birthDate" className="rounded-xl h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Sexo</Label>
                <select name="gender" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium">
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Historial de Salud, Medicación y Protocolo GLP-1 */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-sky-50/70 to-slate-50 border-b border-gray-100 pb-3.5">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-sky-600 text-white rounded-xl shadow-2xs">
              <HeartPulse className="h-4 w-4" />
            </div>
            <span>2. Historial de Salud, Medicación y Alergias</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Fundamental para prevenir interacciones entre alimentos y fármacos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Patologías, enfermedades diagnosticadas o cirugías previas
            </Label>
            <Textarea
              name="medicalHistory"
              defaultValue={patient.medicalHistory || ''}
              placeholder="Ej. Hipotiroidismo (Hashimoto), hipertensión, SOP, resistencia a la insulina, colesterol elevado..."
              rows={2}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Medicación actual y habitual (Nombre de fármacos y dosis si la recuerdas)
            </Label>
            <Textarea
              name="currentMedications"
              defaultValue={patient.currentMedications || ''}
              placeholder="Ej. Eutirox 50mcg en ayunas, Metformina 850mg con comida, Enalapril, anticonceptivos orales..."
              rows={2}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Alergias o intolerancias alimentarias diagnosticadas o sospechadas
            </Label>
            <Input
              name="intolerancesOrAllergies"
              placeholder="Ej. Intolerancia a la lactosa, celiaquía o sensibilidad al gluten, fructosa, frutos secos..."
              className="rounded-xl h-10 text-xs"
            />
          </div>

          {/* Selector Protocolo GLP-1 */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/90 flex items-start gap-3">
            <input
              type="checkbox"
              id="glp1-check"
              checked={isGLP1}
              onChange={(e) => setIsGLP1(e.target.checked)}
              className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="glp1-check" className="text-xs text-gray-800 cursor-pointer flex-1">
              <span className="font-bold text-blue-900 block">
                ¿Estás actualmente en tratamiento con análogos GLP-1 (Ozempic, Wegovy, Rybelsus, Saxenda, Mounjaro)?
              </span>
              <span className="text-gray-600 text-[11px] block mt-0.5">
                Al marcarlo, activaremos un protocolo médico especial para preservar tu masa muscular, evitar sarcopenia y optimizar la ingesta proteica.
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 3. Salud Digestiva y Síntomas */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-slate-50 border-b border-gray-100 pb-3.5">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-2xs">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span>3. Salud Digestiva y Síntomas Habituales</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            La salud intestinal es la base de la absorción de nutrientes y la energía diaria
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              ¿Presentas con frecuencia alguno de estos síntomas digestivos?
            </Label>
            <Input
              name="digestiveSymptoms"
              placeholder="Ej. Hinchazón abdominal por las tardes, gases, reflujo o acidez, digestiones lentas y pesadas..."
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Frecuencia y ritmo evacuatorio
              </Label>
              <select name="digestiveIssues" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium">
                <option value="regular">Regular (1 o 2 veces al día sin molestia)</option>
                <option value="estreñimiento">Tendencia a estreñimiento (menos de 3 veces por semana)</option>
                <option value="diarrea">Tendencia a heces blandas / diarreas frecuentes</option>
                <option value="mixto">Alternancia entre estreñimiento y diarrea</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Alimentos específicos que notas que te sientan mal
              </Label>
              <Input
                name="foodsDiscomfort"
                placeholder="Ej. Legumbres, cebolla cruda, lácteos, fritos..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Preferencias y Hábitos Dietéticos */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-sky-50/70 to-slate-50 border-b border-gray-100 pb-3.5">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-sky-600 text-white rounded-xl shadow-2xs">
              <Utensils className="h-4 w-4" />
            </div>
            <span>4. Preferencias Culinarias y Horarios</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Una pauta solo funciona a largo plazo si incluye comidas que de verdad disfrutas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <span>❤️ Alimentos que TE ENCANTAN (Prioritarios)</span>
              </Label>
              <Textarea
                name="foodPreferences"
                placeholder="Ej. Salmón, arroz, aguacate, pasta integral, chocolate negro, café, huevos..."
                rows={2}
                className="rounded-xl text-xs bg-blue-50/20 border-blue-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                <span>🚫 Alimentos que RECHAZAS (No poner nunca)</span>
              </Label>
              <Textarea
                name="foodAversions"
                defaultValue={patient.foodAversions || ''}
                placeholder="Ej. Hígado, coles de Bruselas, queso de cabra, picante, pescado crudo..."
                rows={2}
                className="rounded-xl text-xs bg-rose-50/20 border-rose-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Comidas al día habituales</Label>
              <select name="mealsPerDay" defaultValue="4" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium">
                <option value="2">2 (Desayuno y Comida)</option>
                <option value="3">3 (Desayuno, Comida, Cena)</option>
                <option value="4">4 (+ Merienda)</option>
                <option value="5">5 (+ Media mañana y merienda)</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-gray-700">Horarios aproximados de tus tomas</Label>
              <Input
                name="mealSchedule"
                placeholder="Ej. Desayuno 8:00, Comida 14:30 en el trabajo, Cena 21:30 en casa"
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              ¿Cómo cambia tu alimentación los fines de semana o si comes fuera?
            </Label>
            <Input
              name="weekendHabits"
              placeholder="Ej. Sábados como fuera con amigos, domingos comida familiar, me cuesta más cocinar..."
              className="rounded-xl h-10 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Hidratación, Sueño, Ejercicio y Estilo de Vida */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-slate-50 border-b border-gray-100 pb-3.5">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-2xs">
              <Droplets className="h-4 w-4" />
            </div>
            <span>5. Hidratación, Ejercicio y Descanso</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Factores que regulan el gasto calórico, el apetito y la recuperación
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Agua diaria aproximada (Litros)</Label>
              <select name="waterIntake" defaultValue="1.5" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium">
                <option value="0.5">Menos de 1 litro (1-3 vasos)</option>
                <option value="1.0">Aprox. 1 litro (4-5 vasos)</option>
                <option value="1.5">Entre 1.5 y 2 litros (estándar)</option>
                <option value="2.5">Más de 2.5 litros diarios</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Otras bebidas habituales</Label>
              <Input
                name="otherBeverages"
                placeholder="Ej. 2 cafés con leche al día, infusiones, refrescos zero, vino el fin de semana..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-600" />
                <span>Ejercicio o Actividad Física</span>
              </Label>
              <Input
                name="exerciseRoutine"
                placeholder="Ej. Caminar 8.000 pasos/día, gimnasio 3 días/semana (pesas), pádel..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-blue-600" />
                <span>Calidad de Sueño y Estrés</span>
              </Label>
              <Input
                name="sleepAndStress"
                placeholder="Ej. Duermo 6-7 horas, me despierto con energía regular, estrés alto en el trabajo..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Relación con la Comida, Dietas Previas y Objetivos */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-sky-50/70 to-slate-50 border-b border-gray-100 pb-3.5">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 bg-sky-600 text-white rounded-xl shadow-2xs">
              <Target className="h-4 w-4" />
            </div>
            <span>6. Recordatorio de 24h, Historial y Objetivos</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Cuéntanos tu día a día para adaptar el plan a tu realidad
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Recordatorio de 24 horas: ¿Qué comiste y bebiste ayer? (De la mañana a la noche)
            </Label>
            <Textarea
              name="recall24h"
              placeholder="Desayuno: Café con leche y tostada con aceite.
Comida: Lentejas y yogur.
Merienda: Plátano y un puñado de nueces.
Cena: Ensalada con atún y huevo duro..."
              rows={4}
              className="rounded-xl text-xs font-sans leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                ¿Sueles tener ansiedad por comer o picar entre horas / por la noche?
              </Label>
              <Input
                name="emotionalEatingNotes"
                placeholder="Ej. Sobre todo por las tardes al llegar del trabajo o dulce después de cenar..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Dietas que has probado en el pasado (qué funcionó y qué te costó)
              </Label>
              <Input
                name="previousDietsExp"
                placeholder="Ej. He probado keto (la dejé por pesadez), ayuno intermitente, contar calorías..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Suplementos, vitaminas o batidos que tomas actualmente
              </Label>
              <Input
                name="supplementsNotes"
                placeholder="Ej. Vitamina D, magnesio, creatina, omega 3, probióticos..."
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Tu objetivo prioritario con esta consulta nutricional *
              </Label>
              <Input
                name="shortTermGoal"
                defaultValue={patient.shortTermGoal || ''}
                required
                placeholder="Ej. Perder grasa sin pasar hambre, mejorar mis digestiones, ganar energía..."
                className="rounded-xl h-10 text-xs font-medium"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Envío Definitivo */}
      <div className="p-6 bg-white rounded-3xl border border-blue-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Envío Cifrado y Confidencial</span>
          </p>
          <p className="text-2xs text-gray-500 mt-0.5">
            Tus datos se transmitirán directamente a la consulta médica de <strong>Eva Vidal</strong>.
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          {loading ? (
            <span>Enviando Respuestas...</span>
          ) : (
            <>
              <span>Guardar y Enviar Mi Cuestionario</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
