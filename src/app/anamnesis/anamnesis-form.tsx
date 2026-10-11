'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, User, HeartPulse, Utensils, Clock, Target, AlertCircle, ArrowRight } from 'lucide-react'
import { submitAnamnesis } from './actions'

interface Props {
  patient: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    medicalHistory?: string | null
    currentMedications?: string | null
    isGLP1Treatment?: boolean | null
    foodAversions?: string | null
    shortTermGoal?: string | null
  } | null
}

export function AnamnesisForm({ patient }: Props) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGLP1, setIsGLP1] = useState(Boolean(patient?.isGLP1Treatment))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await submitAnamnesis({
        patientId: patient?.id,
        name: (formData.get('name') as string) || patient?.name || '',
        birthDate: formData.get('birthDate') as string,
        gender: formData.get('gender') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        medicalHistory: formData.get('medicalHistory') as string,
        currentMedications: formData.get('currentMedications') as string,
        isGLP1Treatment: isGLP1,
        digestiveIssues: formData.get('digestiveIssues') as string,
        foodPreferences: (formData.get('foodPreferences') as string) || undefined,
        foodAversions: formData.get('foodAversions') as string,
        waterIntakeLiters: formData.get('waterIntake') ? Number(formData.get('waterIntake')) : undefined,
        mealsPerDay: formData.get('mealsPerDay') ? Number(formData.get('mealsPerDay')) : undefined,
        mealScheduleNotes: formData.get('mealSchedule') as string,
        recall24h: formData.get('recall24h') as string,
        shortTermGoal: formData.get('shortTermGoal') as string,
      })

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la anamnesis')
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="rounded-3xl border-emerald-200 bg-white p-8 text-center shadow-lg">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">¡Anamnesis Registrada con Éxito!</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto mt-2 mb-6">
          Tus datos médicos, preferencias y hábitos han quedado guardados directamente en la consulta. Tu nutricionista los revisará ahora para elaborar tu plan personalizado.
        </p>
        <Button
          onClick={() => {
            setIsSubmitted(false)
          }}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
        >
          Rellenar otra o editar
        </Button>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Datos Personales */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-emerald-50/40 border-b border-gray-100 pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            <span>1. Datos de Contacto y Personales</span>
          </CardTitle>
          <CardDescription className="text-xs">Identificación para tu expediente nutricional</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Nombre y Apellidos *</Label>
              <Input
                name="name"
                defaultValue={patient?.name || ''}
                required
                placeholder="Ej. Laura Gómez Martín"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono Móvil *</Label>
              <Input
                name="phone"
                defaultValue={patient?.phone || ''}
                required
                placeholder="Ej. 611222333"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Correo Electrónico</Label>
              <Input
                type="email"
                name="email"
                defaultValue={patient?.email || ''}
                placeholder="Ej. laura@gmail.com"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Fecha Nacimiento</Label>
                <Input type="date" name="birthDate" className="rounded-xl text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sexo</Label>
                <select name="gender" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs">
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Salud, Medicación y Protocolo GLP-1 */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-rose-50/40 border-b border-gray-100 pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-rose-600" />
            <span>2. Historial de Salud y Medicación</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Vital para prevenir interacciones entre alimentos y fármacos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Medicación actual o suplementos que tomas habitualmente</Label>
            <Input
              name="currentMedications"
              defaultValue={patient?.currentMedications || ''}
              placeholder="Ej. Eutirox 75mcg en ayunas, Metformina con la cena, Omeprazol, Vitamina D..."
              className="rounded-xl"
            />
            <p className="text-3xs text-gray-500">
              El sistema clínico comprobará automáticamente interacciones con los alimentos de tu plan.
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Patologías o diagnósticos médicos previos</Label>
            <Input
              name="medicalHistory"
              defaultValue={patient?.medicalHistory || ''}
              placeholder="Ej. Hipotiroidismo, Hipertensión, Resistencia a la insulina, Colesterol alto..."
              className="rounded-xl"
            />
          </div>

          {/* Casilla interactiva GLP-1 */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="glp1-toggle"
              checked={isGLP1}
              onChange={(e) => setIsGLP1(e.target.checked)}
              className="mt-1 h-4 w-4 rounded text-amber-600 border-amber-300 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="glp1-toggle" className="text-xs text-amber-950 cursor-pointer">
              <span className="font-bold block">
                ¿Estás actualmente en tratamiento con inyectables GLP-1 (Ozempic, Wegovy, Rybelsus, Mounjaro)?
              </span>
              <span className="text-3xs text-amber-800/90 block mt-0.5">
                Activará el protocolo médico para proteger tu masa muscular (suelo proteico alto) y pautas digestivas contra náuseas y estreñimiento.
              </span>
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Síntomas digestivos frecuentes (si tienes)</Label>
            <Input
              name="digestiveIssues"
              placeholder="Ej. Hinchazón tras comer, reflujo gástrico, digestiones lentas, estreñimiento..."
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Hábitos y Gustos Alimentarios */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-emerald-50/40 border-b border-gray-100 pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-emerald-600" />
            <span>3. Gustos, Aversiones y Hábitos Diarios</span>
          </CardTitle>
          <CardDescription className="text-xs">Para no incluir alimentos que no toleras o no te gustan</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-900">
              Alimentos o platos que te ENCANTAN y te gustaría incluir
            </Label>
            <Input
              name="foodPreferences"
              placeholder="Ej. Me encanta la pasta, fruta fresca, legumbres, chocolate negro, yogur..."
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-gray-900">
              Alimentos que NO te gustan, te sientan mal o rechazas comer
            </Label>
            <Input
              name="foodAversions"
              defaultValue={patient?.foodAversions || ''}
              placeholder="Ej. No me gusta el pescado blanco, odio el pepino, intolerancia a la lactosa..."
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">¿Cuántas comidas sueles hacer al día?</Label>
              <select name="mealsPerDay" defaultValue="4" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs">
                <option value="3">3 comidas (Desayuno, Comida, Cena)</option>
                <option value="4">4 comidas (Incluye Merienda)</option>
                <option value="5">5 comidas (Media mañana y Merienda)</option>
                <option value="2">2 comidas (Ayuno intermitente)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Consumo de agua diario aproximado</Label>
              <select name="waterIntake" defaultValue="1.5" className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs">
                <option value="1">Menos de 1 litro al día</option>
                <option value="1.5">Entre 1 y 1.5 litros</option>
                <option value="2">Entre 1.5 y 2 litros</option>
                <option value="2.5">Más de 2 litros al día</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Horarios habituales de comidas o trabajo</Label>
            <Input
              name="mealSchedule"
              placeholder="Ej. Desayuno a las 7:30, comida a las 14:30 en el trabajo (tupper), cena a las 21:30"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-800">
              Recordatorio 24h: ¿Qué comiste ayer en un día normal?
            </Label>
            <Textarea
              name="recall24h"
              rows={3}
              placeholder="Desayuno: Café con leche y tostada. Comida: Plato de pasta con tomate. Merienda: Nada. Cena: Ensalada rápida con tortilla..."
              className="rounded-xl text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Objetivo Principal */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-amber-50/40 border-b border-gray-100 pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <span>4. Tu Objetivo en Consulta</span>
          </CardTitle>
          <CardDescription className="text-xs">¿Qué meta quieres alcanzar?</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <Input
            name="shortTermGoal"
            defaultValue={patient?.shortTermGoal || ''}
            placeholder="Ej. Perder 6 kg de grasa sin perder músculo, mejorar mi digestión y tener energía..."
            className="rounded-xl"
          />
        </CardContent>
        <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-2xs text-gray-500">
            Los datos se guardan directamente de forma privada y local en la consulta.
          </span>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md"
          >
            <span>{loading ? 'Guardando en consulta...' : 'Guardar y Finalizar Anamnesis'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </form>
  )
}
