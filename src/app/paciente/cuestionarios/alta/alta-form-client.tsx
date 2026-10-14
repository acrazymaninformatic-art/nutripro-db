'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  User,
  HeartPulse,
  Utensils,
  Target,
  ArrowRight,
  ArrowLeft,
  Activity,
  Droplets,
  Moon,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Smile,
} from 'lucide-react'
import Link from 'next/link'
import { submitPortalAnamnesisAction } from '../../actions'

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
  const [step, setStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGLP1, setIsGLP1] = useState(Boolean(patient.isGLP1Treatment))

  const totalSteps = 7

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await submitPortalAnamnesisAction({
        name: (formData.get('name') as string) || `${patient.firstName} ${patient.lastName}`,
        birthDate: formData.get('birthDate') as string,
        gender: formData.get('gender') as string || patient.sex,
        phone: formData.get('phone') as string || patient.phone,
        email: formData.get('email') as string || patient.email,

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

        // Emocional y objetivos
        emotionalEatingNotes: formData.get('emotionalEatingNotes') as string,
        previousDietsExp: formData.get('previousDietsExp') as string,
        supplementsNotes: formData.get('supplementsNotes') as string,
        shortTermGoal: formData.get('shortTermGoal') as string,
      })

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el cuestionario')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="rounded-3xl p-8 text-center bg-white border border-emerald-200 shadow-md max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Cuestionario Completado con Éxito!</h2>
        <p className="mt-2 text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
          Tus respuestas han sido recibidas por tu nutricionista Eva Vidal. Los datos serán revisados y tenidos en cuenta
          para preparar tu estudio nutricional y tu próxima sesión clínica.
        </p>
        <div className="mt-6">
          <Link href="/paciente">
            <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-5 px-6">
              Volver al inicio del portal
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/paciente/cuestionarios"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Cuestionarios</span>
        </Link>
        <Badge variant="outline" className="text-xs font-bold rounded-full bg-blue-50 text-blue-800 border-blue-200">
          Paso {step} de {totalSteps}
        </Badge>
      </div>

      <Card className="rounded-3xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-4 border-b border-gray-100">
          <CardTitle className="text-xl font-black text-gray-900">
            Cuestionario Clínico de Alta Pre-Consulta
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Completa la información con la mayor sinceridad posible. Todo queda guardado de forma privada bajo secreto profesional.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PASO 1: DATOS PERSONALES */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>1. Datos Personales de Contacto</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Nombre y Apellidos</Label>
                    <Input
                      name="name"
                      defaultValue={`${patient.firstName} ${patient.lastName}`}
                      required
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Teléfono de contacto</Label>
                    <Input
                      name="phone"
                      defaultValue={patient.phone || ''}
                      placeholder="+34 600 000 000"
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Correo Electrónico</Label>
                    <Input
                      name="email"
                      type="email"
                      defaultValue={patient.email || ''}
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Fecha de Nacimiento</Label>
                    <Input
                      name="birthDate"
                      type="date"
                      defaultValue={patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : ''}
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: HISTORIAL CLÍNICO Y MEDICACIÓN (PASO CRÍTICO) */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>2. Historial Clínico, Alergias y Medicación</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Alergias o Intolerancias Alimentarias Conocidas</Label>
                    <Input
                      name="intolerancesOrAllergies"
                      placeholder="Ej: Gluten, Lactosa, Frutos secos, Fructosa... o indica 'Ninguna conocida'"
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Antecedentes Médicos / Patologías diagnosticadas</Label>
                    <Input
                      name="medicalHistory"
                      defaultValue={patient.medicalHistory || ''}
                      placeholder="Ej: Hipotiroidismo, Diabetes tipo 2, Hipertensión, SOP..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Medicación habitual o suplementos actuales</Label>
                    <Textarea
                      name="currentMedications"
                      defaultValue={patient.currentMedications || ''}
                      placeholder="Indica el fármaco y dosis si la recuerdas (ej: Eutirox 50mcg, Metformina, Vitamina D...)"
                      rows={2}
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="glp1"
                      checked={isGLP1}
                      onChange={(e) => setIsGLP1(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <label htmlFor="glp1" className="text-xs font-bold text-amber-950 cursor-pointer">
                      ¿Estás en tratamiento con análogos GLP-1 (Ozempic, Wegovy, Saxenda, Mounjaro)?
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: DIGESTIVO Y METABOLISMO */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>3. Sistema Digestivo y Metabolismo</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Síntomas digestivos frecuentes</Label>
                    <Input
                      name="digestiveSymptoms"
                      placeholder="Ej: Hinchazón abdominal por las tardes, gases, reflujo, acidez, digestiones lentas..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Ritmo o tránsito intestinal habitual</Label>
                    <Input
                      name="digestiveIssues"
                      placeholder="Ej: Diario normal, tendencia a estreñimiento (cada 2-3 días), heces blandas..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Consumo aproximado de agua al día (litros)</Label>
                    <Input
                      name="waterIntake"
                      type="number"
                      step="0.1"
                      placeholder="Ej: 1.5"
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Otras bebidas habituales (café, té, refrescos, alcohol)</Label>
                    <Input
                      name="otherBeverages"
                      placeholder="Ej: 2 cafés solos al día, té verde, cerveza los fines de semana..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: HÁBITOS ALIMENTARIOS Y 24H */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <Utensils className="w-4 h-4 text-blue-600" />
                  <span>4. Hábitos Alimentarios y Preferencias</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Alimentos preferidos o que te encantan</Label>
                    <Input
                      name="foodPreferences"
                      placeholder="Ej: Frutas, pescado azul, ensaladas, legumbres, arroz..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Alimentos que NO te gustan o rechazas comer</Label>
                    <Input
                      name="foodAversions"
                      defaultValue={patient.foodAversions || ''}
                      placeholder="Ej: Hígado, coles de bruselas, marisco, queso fuerte..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold">Número de tomas al día</Label>
                      <Input
                        name="mealsPerDay"
                        type="number"
                        placeholder="Ej: 3, 4 o 5"
                        className="rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Horarios habituales</Label>
                      <Input
                        name="mealSchedule"
                        placeholder="Ej: Desayuno 8h, Comida 14h, Cena 21h"
                        className="rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">¿Qué sueles comer en un día normal? (Recordatorio breve)</Label>
                    <Textarea
                      name="recall24h"
                      rows={3}
                      placeholder="Ej: Desayuno tostada con café; Comida plato de pasta o lentejas con carne; Cena ensalada o tortilla francesa..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5: ESTILO DE VIDA Y DESCANSO */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>5. Estilo de Vida, Sueño y Estrés</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Sueño y Descanso (Horas y Calidad)</Label>
                    <Input
                      name="sleepAndStress"
                      placeholder="Ej: Duermo 7 horas, descanso regular, me despierto varias veces..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Hábitos durante los fines de semana</Label>
                    <Textarea
                      name="weekendHabits"
                      rows={2}
                      placeholder="Ej: Solemos comer fuera el sábado, horarios más tardíos..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Relación emocional con la comida (si procede)</Label>
                    <Input
                      name="emotionalEatingNotes"
                      placeholder="Ej: Como más rápido cuando tengo estrés laboral, antojos dulces por la noche..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 6: ACTIVIDAD FÍSICA Y DEPORTE */}
            {step === 6 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>6. Actividad Física y Ejercicio</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-bold">Tipo de actividad o deporte habitual</Label>
                    <Input
                      name="exerciseRoutine"
                      placeholder="Ej: Caminar 40 min al día, gimnasio 3 días/semana, pilates, running..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Suplementos deportivos o vitamínicos actuales</Label>
                    <Input
                      name="supplementsNotes"
                      placeholder="Ej: Proteína de suero, creatina, magnesio, omega 3... o 'Ninguno'"
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 7: OBJETIVOS Y MOTIVACIÓN */}
            {step === 7 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>7. Objetivos y Experiencias Previas</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-bold">¿Cuál es tu principal objetivo para estas consultas?</Label>
                    <Input
                      name="shortTermGoal"
                      defaultValue={patient.shortTermGoal || ''}
                      placeholder="Ej: Aprender a comer mejor, perder grasa de forma saludable, mejorar energía..."
                      required
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold">¿Has realizado dietas previas? ¿Cómo fue tu experiencia?</Label>
                    <Textarea
                      name="previousDietsExp"
                      rows={3}
                      placeholder="Ej: He probado dietas restrictivas en el pasado pero con efecto rebote..."
                      className="rounded-xl text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BOTONES DE NAVEGACIÓN DEL WIZARD */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="rounded-xl text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Anterior</span>
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  <span>Siguiente paso</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 shadow-xs"
                >
                  {loading ? 'Enviando respuestas...' : 'Finalizar y Enviar a Eva'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
