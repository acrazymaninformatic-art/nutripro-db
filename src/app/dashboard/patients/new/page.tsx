'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPatient, importPatientFromCSV } from '../actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  User,
  HeartPulse,
  Activity,
  Sparkles,
  Dumbbell,
  Flower2,
  Target,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  Scale,
  Upload,
  FileSpreadsheet,
} from 'lucide-react'
import {
  SEX_VALUES,
  SEX_LABELS,
  OBJECTIVE_VALUES,
  OBJECTIVE_LABELS,
  ACTIVITY_LEVEL_VALUES,
  ACTIVITY_LEVEL_LABELS,
  Sex,
  Objective,
  ActivityLevel,
} from '@/types'
import { isMinorAtDate } from '@/lib/patient-age'
import { LEGAL_POLICY_VERSION } from '@/lib/legal'

// Step Definitions
const STEPS = [
  { id: 1, title: 'Datos Personales', subtitle: 'Información básica de contacto', icon: User },
  { id: 2, title: 'Historial Clínico', subtitle: 'Patologías y medicación previa', icon: HeartPulse },
  { id: 3, title: 'Digestivo y Metabolismo', subtitle: 'Síntomas, tránsito e hidratación', icon: Activity },
  { id: 4, title: 'Estilo de Vida', subtitle: 'Rutinas, sueño y estrés', icon: Sparkles },
  { id: 5, title: 'Actividad Física', subtitle: 'Entrenamiento y hábitos deportivos', icon: Dumbbell },
  { id: 6, title: 'Salud Femenina', subtitle: 'Ciclo, fertilidad y ginecología', icon: Flower2 },
  { id: 7, title: 'Objetivos y Valoración', subtitle: 'Metas y antropometría inicial', icon: Target },
]

const MEDICAL_CONDITIONS = [
  'Diabetes Tipo 1',
  'Diabetes Tipo 2',
  'Hipertensión',
  'Dislipemia',
  'Hipotiroidismo',
  'Hipertiroidismo',
  'Síndrome Ovario Poliquístico',
  'Resistencia a la Insulina',
  'Hígado graso',
  'Enfermedad celíaca',
  'Crohn',
  'Colitis ulcerosa',
  'Anemia',
  'Osteoporosis',
  'Artritis',
  'Fibromialgia',
]

const DIGESTIVE_ISSUES = [
  'Reflujo gastroesofágico',
  'Hinchazón abdominal',
  'Gases',
  'Estreñimiento',
  'Diarrea',
  'Náuseas',
  'Acidez',
  'Colon irritable',
]

const EXERCISE_TYPES = [
  'Correr',
  'Caminar',
  'Ciclismo',
  'Natación',
  'Musculación',
  'CrossFit',
  'Yoga/Pilates',
  'Artes marciales',
  'Deportes de equipo',
]

export default function NewPatientPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false)
  const [portalTermsAccepted, setPortalTermsAccepted] = useState(false)
  const [healthDataConsentAccepted, setHealthDataConsentAccepted] = useState(false)
  const [guardianConsentAccepted, setGuardianConsentAccepted] = useState(false)

  // Step 1: Personal
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('1995-01-01')
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianConsentMethod, setGuardianConsentMethod] = useState('PRESENCIAL')
  const [sex, setSex] = useState<Sex>('FEMALE')
  const [heightCm, setHeightCm] = useState('165')
  const [referralSource, setReferralSource] = useState('')

  // Step 2: Clinical
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [otherCondition, setOtherCondition] = useState('')
  const [currentMedications, setCurrentMedications] = useState('')
  const [supplements, setSupplements] = useState('')
  const [surgeries, setSurgeries] = useState('')
  const [familyHistory, setFamilyHistory] = useState('')

  // Step 3: Digestive
  const [selectedDigestive, setSelectedDigestive] = useState<string[]>([])
  const [bowelFrequency, setBowelFrequency] = useState('')
  const [foodAversions, setFoodAversions] = useState('')
  const [waterIntakeLiters, setWaterIntakeLiters] = useState('2.0')
  const [caffeineDaily, setCaffeineDaily] = useState('1')
  const [alcoholFrequency, setAlcoholFrequency] = useState('none')
  const [smoking, setSmoking] = useState(false)

  // Step 4: Lifestyle
  const [occupation, setOccupation] = useState('')
  const [workSchedule, setWorkSchedule] = useState('')
  const [sleepHours, setSleepHours] = useState('7.5')
  const [sleepQuality, setSleepQuality] = useState('good')
  const [stressLevel, setStressLevel] = useState('moderate')
  const [mealsPerDay, setMealsPerDay] = useState('4')
  const [eatsOut, setEatsOut] = useState('rarely')
  const [cooksAtHome, setCooksAtHome] = useState(true)

  // Step 5: Exercise
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('MODERATE')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [otherExercise, setOtherExercise] = useState('')
  const [exerciseFrequency, setExerciseFrequency] = useState('3')
  const [exerciseDuration, setExerciseDuration] = useState('45')
  const [exerciseTime, setExerciseTime] = useState('')
  const [trainingExperience, setTrainingExperience] = useState('intermediate')
  const [sportGoals, setSportGoals] = useState('')

  // Step 6: Women's Health
  const [menstrualCycle, setMenstrualCycle] = useState('')
  const [pregnant, setPregnant] = useState(false)
  const [breastfeeding, setBreastfeeding] = useState(false)
  const [contraceptive, setContraceptive] = useState('')
  const [hormoneTherapy, setHormoneTherapy] = useState(false)

  // Step 7: Goals & Anthropometry
  const [objective, setObjective] = useState<Objective>('WEIGHT_LOSS')
  const [shortTermGoal, setShortTermGoal] = useState('')
  const [longTermGoal, setLongTermGoal] = useState('')
  const [motivation, setMotivation] = useState('health')
  const [previousDiets, setPreviousDiets] = useState('')
  const [consultationFrequency, setConsultationFrequency] = useState('biweekly')
  const [budgetLevel, setBudgetLevel] = useState('medium')
  const [allergies, setAllergies] = useState('')
  const [intolerances, setIntolerances] = useState('')
  const [dietaryPreferences, setDietaryPreferences] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [weightKg, setWeightKg] = useState('68.0')
  const [bodyFatPct, setBodyFatPct] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [hipCm, setHipCm] = useState('')

  const isMinor = Boolean(birthDate && isMinorAtDate(birthDate))
  const consentAccepted = privacyNoticeAccepted && portalTermsAccepted && healthDataConsentAccepted
  const canSubmit = consentAccepted && (!isMinor || guardianConsentAccepted)

  // Bioimpedance Scale Import States
  const [scaleParsing, setScaleParsing] = useState(false)
  const [scaleSuccess, setScaleSuccess] = useState<string | null>(null)
  const [scaleError, setScaleError] = useState<string | null>(null)

  const handleScaleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScaleParsing(true)
    setScaleError(null)
    setScaleSuccess(null)

    try {
      const text = await file.text()
      const measurements = await importPatientFromCSV(text)
      if (!measurements || measurements.length === 0) {
        throw new Error('No se encontraron mediciones válidas con peso en el archivo.')
      }

      const latest = measurements[0]
      if (latest.weightKg) setWeightKg(latest.weightKg.toString())
      if (latest.bodyFatPct != null) setBodyFatPct(latest.bodyFatPct.toString())
      if (latest.waistCm != null) setWaistCm(latest.waistCm.toString())
      if (latest.hipCm != null) setHipCm(latest.hipCm.toString())

      const details: string[] = [`${latest.weightKg} kg de peso`]
      if (latest.bodyFatPct != null) details.push(`${latest.bodyFatPct}% grasa`)
      if (latest.muscleMassKg != null) details.push(`${latest.muscleMassKg} kg masa muscular`)
      if (latest.visceralFat != null) details.push(`grasa visceral nivel ${latest.visceralFat}`)
      if (latest.waistCm != null) details.push(`${latest.waistCm} cm cintura`)

      setScaleSuccess(
        `✓ Datos de ${file.name} volcados automáticamente: ${details.join(' • ')}`
      )
    } catch (err: any) {
      setScaleError(err?.message || 'Error al procesar el archivo de la báscula.')
    } finally {
      setScaleParsing(false)
      // Reset input value so same file can be reselected if needed
      e.target.value = ''
    }
  }

  const handleNext = () => {
    setError(null)
    const nextStep = Math.min(currentStep + 1, 7)
    setCurrentStep(nextStep)
    setVisitedSteps(prev => new Set(prev).add(nextStep))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSkip = () => {
    handleNext()
  }

  const handlePrev = () => {
    setError(null)
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleCondition = (item: string) => {
    setSelectedConditions(prev =>
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    )
  }

  const toggleDigestive = (item: string) => {
    if (item === 'Ninguno') {
      if (selectedDigestive.includes('Ninguno')) {
        setSelectedDigestive([])
      } else {
        setSelectedDigestive(['Ninguno'])
      }
      return
    }
    setSelectedDigestive(prev => {
      const filtered = prev.filter(i => i !== 'Ninguno')
      return filtered.includes(item) ? filtered.filter(i => i !== item) : [...filtered, item]
    })
  }

  const toggleExercise = (item: string) => {
    setSelectedExercises(prev =>
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    )
  }

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()

      // Step 1 - With safe fallbacks if the user skipped
      formData.append('firstName', firstName.trim() || 'Paciente')
      formData.append('lastName', lastName.trim() || `ID-${Date.now()}`)
      formData.append('email', email.trim())
      formData.append('phone', phone.trim())
      formData.append('birthDate', birthDate || '1995-01-01')
      formData.append('guardianName', guardianName.trim())
      formData.append('guardianRelationship', guardianRelationship.trim())
      formData.append('guardianEmail', guardianEmail.trim())
      formData.append('guardianPhone', guardianPhone.trim())
      formData.append('guardianConsentAccepted', guardianConsentAccepted ? 'true' : 'false')
      formData.append('guardianConsentMethod', guardianConsentMethod)
      formData.append('sex', sex || 'FEMALE')
      formData.append('heightCm', heightCm || '170')
      formData.append('referralSource', referralSource)

      // Step 2
      const combinedMedical = [...selectedConditions]
      if (otherCondition.trim()) combinedMedical.push(otherCondition.trim())
      formData.append('medicalHistory', combinedMedical.join(', '))
      formData.append('currentMedications', currentMedications.trim())
      formData.append('supplements', supplements.trim())
      formData.append('surgeries', surgeries.trim())
      formData.append('familyHistory', familyHistory.trim())

      // Step 3
      formData.append('digestiveIssues', selectedDigestive.join(', '))
      formData.append('bowelFrequency', bowelFrequency)
      formData.append('foodAversions', foodAversions.trim())
      formData.append('waterIntakeLiters', waterIntakeLiters)
      formData.append('caffeineDaily', caffeineDaily)
      formData.append('alcoholFrequency', alcoholFrequency)
      formData.append('smoking', smoking ? 'true' : 'false')

      // Step 4
      formData.append('occupation', occupation.trim())
      formData.append('workSchedule', workSchedule)
      formData.append('sleepHours', sleepHours)
      formData.append('sleepQuality', sleepQuality)
      formData.append('stressLevel', stressLevel)
      formData.append('mealsPerDay', mealsPerDay)
      formData.append('eatsOut', eatsOut)
      formData.append('cooksAtHome', cooksAtHome ? 'true' : 'false')

      // Step 5
      formData.append('activityLevel', activityLevel)
      const combinedExercise = [...selectedExercises]
      if (otherExercise.trim()) combinedExercise.push(otherExercise.trim())
      formData.append('exerciseType', combinedExercise.join(', '))
      formData.append('exerciseFrequency', exerciseFrequency)
      formData.append('exerciseDuration', exerciseDuration)
      formData.append('exerciseTime', exerciseTime)
      formData.append('trainingExperience', trainingExperience)
      formData.append('sportGoals', sportGoals.trim())

      // Step 6
      formData.append('menstrualCycle', menstrualCycle)
      formData.append('pregnant', pregnant ? 'true' : 'false')
      formData.append('breastfeeding', breastfeeding ? 'true' : 'false')
      formData.append('contraceptive', contraceptive)
      formData.append('hormoneTherapy', hormoneTherapy ? 'true' : 'false')

      // Step 7
      formData.append('objective', objective)
      formData.append('shortTermGoal', shortTermGoal.trim())
      formData.append('longTermGoal', longTermGoal.trim())
      formData.append('motivation', motivation)
      formData.append('previousDiets', previousDiets.trim())
      formData.append('consultationFrequency', consultationFrequency)
      formData.append('budgetLevel', budgetLevel)
      formData.append('allergies', allergies.trim())
      formData.append('intolerances', intolerances.trim())
      formData.append('dietaryPreferences', dietaryPreferences.trim())
      formData.append('additionalNotes', additionalNotes.trim())

      // Anthropometry
      formData.append('weightKg', weightKg || '70')
      formData.append('bodyFatPct', bodyFatPct)
      formData.append('waistCm', waistCm)
      formData.append('hipCm', hipCm)
      formData.append('privacyNoticeAccepted', String(privacyNoticeAccepted))
      formData.append('portalTermsAccepted', String(portalTermsAccepted))
      formData.append('healthDataConsentAccepted', String(healthDataConsentAccepted))

      await createPatient(formData)
      router.push('/dashboard/patients')
      router.refresh()
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error al guardar el paciente.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al directorio</span>
        </Link>
        <span className="text-xs font-medium text-gray-500">
          Paso {currentStep} de 7: {STEPS[currentStep - 1].title}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alta Integral de Paciente</h1>
        <p className="text-sm text-gray-500">
          Evaluación clínica inicial estilo Gajuz. Cada sección es opcional excepto los datos básicos.
        </p>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[680px]">
          {STEPS.map((step, idx) => {
            const isCurrent = currentStep === step.id
            const isPassed = visitedSteps.has(step.id) && currentStep > step.id
            const Icon = step.icon

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setCurrentStep(step.id)
                    setVisitedSteps(prev => new Set(prev).add(step.id))
                  }}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                      isCurrent
                        ? 'bg-green-600 text-white ring-4 ring-green-100 shadow-sm'
                        : isPassed
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {isPassed ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1.5 text-center transition-colors max-w-[85px] leading-tight ${
                      isCurrent ? 'text-green-700 font-semibold' : 'text-gray-500 group-hover:text-gray-900'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      visitedSteps.has(step.id + 1) || currentStep > step.id ? 'bg-green-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Alert Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP FORMS */}
      <form onSubmit={handleFinalSubmit} noValidate>
        {/* STEP 1: DATOS PERSONALES */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <User className="h-5 w-5 text-green-600" />
                    <span>Paso 1: Datos Personales</span>
                  </CardTitle>
                  <CardDescription>
                    Información biológica y de contacto requerida para abrir la ficha clínica
                  </CardDescription>
                </div>
                <Badge variant="default">Obligatorio</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    required
                    placeholder="Ej. María"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    required
                    placeholder="Ej. Gómez García"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="maria.gomez@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono de Contacto</Label>
                  <Input
                    id="phone"
                    placeholder="+34 612 345 678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    required
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                  />
                </div>

                {isMinor && (
                  <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 space-y-3">
                    <div>
                      <p className="font-bold">Paciente menor de edad</p>
                      <p className="mt-1 leading-5">Registra al padre, madre o representante legal y deja constancia de que ha recibido la información aplicable antes de guardar el expediente.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="guardianName">Nombre del representante legal *</Label>
                        <Input id="guardianName" value={guardianName} onChange={e => setGuardianName(e.target.value)} required={isMinor} className="rounded-xl bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="guardianRelationship">Relación *</Label>
                        <Input id="guardianRelationship" placeholder="Padre, madre, tutor..." value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} required={isMinor} className="rounded-xl bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="guardianEmail">Correo del representante</Label>
                        <Input id="guardianEmail" type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} className="rounded-xl bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="guardianPhone">Teléfono del representante</Label>
                        <Input id="guardianPhone" value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} className="rounded-xl bg-white" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="guardianConsentMethod">Método de constancia</Label>
                        <Select id="guardianConsentMethod" value={guardianConsentMethod} onChange={e => setGuardianConsentMethod(e.target.value)} className="bg-white">
                          <option value="PRESENCIAL">Información presencial</option>
                          <option value="TELEFONO">Información por teléfono</option>
                          <option value="DOCUMENTO">Documento firmado</option>
                        </Select>
                      </div>
                    </div>
                    <label className="flex items-start gap-2 font-medium leading-5">
                      <input type="checkbox" checked={guardianConsentAccepted} onChange={e => setGuardianConsentAccepted(e.target.checked)} className="mt-0.5" />
                      <span>Confirmo que he verificado la representación y que el representante ha recibido la información y autorizado el tratamiento necesario para la atención nutricional. *</span>
                    </label>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Sexo Biológico *</Label>
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="sexChoice"
                        value="FEMALE"
                        checked={sex === 'FEMALE'}
                        onChange={() => setSex('FEMALE')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span>Mujer</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="sexChoice"
                        value="MALE"
                        checked={sex === 'MALE'}
                        onChange={() => setSex('MALE')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span>Hombre</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="heightCm">Estatura (cm)</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    step="any"
                    placeholder="Ej. 165 (o se calculará automáticamente)"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="referralSource">Canal de captación / Referido</Label>
                  <Select
                    id="referralSource"
                    value={referralSource}
                    onChange={e => setReferralSource(e.target.value)}
                  >
                    <option value="">Seleccionar procedencia...</option>
                    <option value="Recomendación">Recomendación de paciente</option>
                    <option value="Redes Sociales">Redes Sociales (Instagram/TikTok)</option>
                    <option value="Google">Búsqueda en Google</option>
                    <option value="Médico">Derivación Médica</option>
                    <option value="Otro">Otro</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: HISTORIAL CLÍNICO */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <HeartPulse className="h-5 w-5 text-green-600" />
                    <span>Paso 2: Historial Clínico</span>
                  </CardTitle>
                  <CardDescription>
                    Antecedentes médicos patológicos, medicación regular y cirugías
                  </CardDescription>
                </div>
                <Badge variant="secondary">Opcional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Antecedentes patológicos diagnosticados
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  {MEDICAL_CONDITIONS.map(cond => (
                    <label
                      key={cond}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-1.5 rounded hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedConditions.includes(cond)}
                        onChange={() => toggleCondition(cond)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                      />
                      <span>{cond}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <Label htmlFor="otherCondition" className="text-xs text-gray-500">
                    Otras patologías o diagnósticos específicos
                  </Label>
                  <Input
                    id="otherCondition"
                    placeholder="Ej. Asma bronquial, migrañas frecuentes..."
                    value={otherCondition}
                    onChange={e => setOtherCondition(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentMedications">Medicación actual y posología</Label>
                  <Textarea
                    id="currentMedications"
                    rows={3}
                    placeholder="Ej. Levotiroxina 50mcg en ayunas, Metformina 850mg con cena..."
                    value={currentMedications}
                    onChange={e => setCurrentMedications(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supplements">Suplementación nutricional</Label>
                  <Textarea
                    id="supplements"
                    rows={3}
                    placeholder="Ej. Creatina creapure 5g/día, Vitamina D3 2000UI, Omega 3..."
                    value={supplements}
                    onChange={e => setSupplements(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="surgeries">Cirugías previas y hospitalizaciones</Label>
                  <Textarea
                    id="surgeries"
                    rows={3}
                    placeholder="Ej. Apendicectomía (2018), cesárea (2021)..."
                    value={surgeries}
                    onChange={e => setSurgeries(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="familyHistory">Antecedentes familiares relevantes</Label>
                  <Textarea
                    id="familyHistory"
                    rows={3}
                    placeholder="Ej. Madre con diabetes tipo 2 y obesidad, padre con hipertensión..."
                    value={familyHistory}
                    onChange={e => setFamilyHistory(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: DIGESTIVO Y METABOLISMO */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Paso 3: Sistema Digestivo y Metabolismo</span>
                  </CardTitle>
                  <CardDescription>
                    Salud gastrointestinal, ritmo de evacuación y patrones de hidratación
                  </CardDescription>
                </div>
                <Badge variant="secondary">Opcional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Problemas y molestias digestivas habituales
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  {DIGESTIVE_ISSUES.map(issue => (
                    <label
                      key={issue}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-1 rounded hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDigestive.includes(issue)}
                        onChange={() => toggleDigestive(issue)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                      />
                      <span>{issue}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedDigestive.includes('Ninguno')}
                      onChange={() => toggleDigestive('Ninguno')}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="font-medium text-green-800">Ninguno</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bowelFrequency">Frecuencia intestinal</Label>
                  <Select
                    id="bowelFrequency"
                    value={bowelFrequency}
                    onChange={e => setBowelFrequency(e.target.value)}
                  >
                    <option value="">Seleccionar frecuencia...</option>
                    <option value="daily">Diaria (1-2 veces al día)</option>
                    <option value="every_other_day">Cada 2 días</option>
                    <option value="irregular">Irregular</option>
                    <option value="less_than_3">&lt; 3 veces por semana (estreñimiento)</option>
                    <option value="frequent">&gt; 3 veces al día</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="waterIntakeLiters">Ingesta de agua (litros/día)</Label>
                  <Input
                    id="waterIntakeLiters"
                    type="number"
                    step="any"
                    placeholder="Ej. 2.0"
                    value={waterIntakeLiters}
                    onChange={e => setWaterIntakeLiters(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="caffeineDaily">Cafés o tés diarios</Label>
                  <Input
                    id="caffeineDaily"
                    type="number"
                    step="any"
                    placeholder="Ej. 2"
                    value={caffeineDaily}
                    onChange={e => setCaffeineDaily(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alcoholFrequency">Consumo de alcohol</Label>
                  <Select
                    id="alcoholFrequency"
                    value={alcoholFrequency}
                    onChange={e => setAlcoholFrequency(e.target.value)}
                  >
                    <option value="none">No bebe (Abstemio/a)</option>
                    <option value="occasional">Ocasional (social/eventos)</option>
                    <option value="weekly">Semanal (fines de semana)</option>
                    <option value="daily">Diario</option>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="foodAversions">Alimentos que no le gustan o evita</Label>
                  <Input
                    id="foodAversions"
                    placeholder="Ej. Brócoli, pescado azul, cebolla cruda, picante..."
                    value={foodAversions}
                    onChange={e => setFoodAversions(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smoking}
                    onChange={e => setSmoking(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                  />
                  <span>¿Fuma habitualmente o cigarrillos electrónicos?</span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: ESTILO DE VIDA Y HÁBITOS */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <span>Paso 4: Estilo de Vida y Hábitos</span>
                  </CardTitle>
                  <CardDescription>
                    Horarios de trabajo, descanso, estrés y rutinas culinarias
                  </CardDescription>
                </div>
                <Badge variant="secondary">Opcional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="occupation">Profesión u Ocupación</Label>
                  <Input
                    id="occupation"
                    placeholder="Ej. Administrativo / Docente"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="workSchedule">Horario laboral</Label>
                  <Select
                    id="workSchedule"
                    value={workSchedule}
                    onChange={e => setWorkSchedule(e.target.value)}
                  >
                    <option value="">Seleccionar turno...</option>
                    <option value="morning">Jornada de Mañana (8h - 15h)</option>
                    <option value="split">Jornada Partida</option>
                    <option value="afternoon">Jornada de Tarde</option>
                    <option value="night">Nocturno</option>
                    <option value="rotating">Turnos Rotativos</option>
                    <option value="remote">Teletrabajo 100%</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sleepHours">Horas de sueño promedio</Label>
                  <Input
                    id="sleepHours"
                    type="number"
                    step="any"
                    placeholder="Ej. 7.5"
                    value={sleepHours}
                    onChange={e => setSleepHours(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sleepQuality">Calidad del sueño</Label>
                  <Select
                    id="sleepQuality"
                    value={sleepQuality}
                    onChange={e => setSleepQuality(e.target.value)}
                  >
                    <option value="good">Buena / Reparadora</option>
                    <option value="regular">Regular / Se despierta cansado</option>
                    <option value="poor">Mala / Sueño ligero</option>
                    <option value="insomnia">Insomnio crónico</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stressLevel">Nivel de estrés percibido</Label>
                  <Select
                    id="stressLevel"
                    value={stressLevel}
                    onChange={e => setStressLevel(e.target.value)}
                  >
                    <option value="low">Bajo</option>
                    <option value="moderate">Moderado</option>
                    <option value="high">Alto</option>
                    <option value="very_high">Muy alto / Ansiedad frecuente</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mealsPerDay">Número de comidas al día</Label>
                  <Input
                    id="mealsPerDay"
                    type="number"
                    step="any"
                    placeholder="Ej. 4"
                    value={mealsPerDay}
                    onChange={e => setMealsPerDay(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eatsOut">¿Con qué frecuencia come fuera?</Label>
                  <Select
                    id="eatsOut"
                    value={eatsOut}
                    onChange={e => setEatsOut(e.target.value)}
                  >
                    <option value="never">Nunca / Casi nunca</option>
                    <option value="rarely">Rara vez (1 vez/mes)</option>
                    <option value="weekly">Semanalmente (1-2 veces/sem)</option>
                    <option value="daily">A diario (menú del día / tupper fuera)</option>
                  </Select>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cooksAtHome}
                    onChange={e => setCooksAtHome(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                  />
                  <span>¿Cocina habitualmente en casa y prepara sus menús?</span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: ACTIVIDAD FÍSICA Y DEPORTE */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Dumbbell className="h-5 w-5 text-green-600" />
                    <span>Paso 5: Actividad Física y Deporte</span>
                  </CardTitle>
                  <CardDescription>
                    Nivel basal de actividad, disciplinas practicadas e intensidad
                  </CardDescription>
                </div>
                <Badge variant="secondary">Opcional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="activityLevel">Nivel de Actividad Cotidiana *</Label>
                  <Select
                    id="activityLevel"
                    value={activityLevel}
                    onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
                  >
                    {ACTIVITY_LEVEL_VALUES.map(val => (
                      <option key={val} value={val}>
                        {ACTIVITY_LEVEL_LABELS[val]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="trainingExperience">Experiencia en entrenamiento</Label>
                  <Select
                    id="trainingExperience"
                    value={trainingExperience}
                    onChange={e => setTrainingExperience(e.target.value)}
                  >
                    <option value="beginner">Principiante (&lt; 6 meses)</option>
                    <option value="intermediate">Intermedio (6 meses - 2 años)</option>
                    <option value="advanced">Avanzado (&gt; 2 años consistente)</option>
                    <option value="elite">Atleta de competición / Élite</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Tipos de ejercicio que realiza
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  {EXERCISE_TYPES.map(ex => (
                    <label
                      key={ex}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-1 rounded hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExercises.includes(ex)}
                        onChange={() => toggleExercise(ex)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                      />
                      <span>{ex}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <Label htmlFor="otherExercise" className="text-xs text-gray-500">
                    Otro deporte o modalidad
                  </Label>
                  <Input
                    id="otherExercise"
                    placeholder="Ej. Pádel, escalada, boxeo..."
                    value={otherExercise}
                    onChange={e => setOtherExercise(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="exerciseFrequency">Frecuencia (sesiones/semana)</Label>
                  <Input
                    id="exerciseFrequency"
                    type="number"
                    step="any"
                    placeholder="Ej. 3"
                    value={exerciseFrequency}
                    onChange={e => setExerciseFrequency(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exerciseDuration">Duración por sesión (minutos)</Label>
                  <Input
                    id="exerciseDuration"
                    type="number"
                    step="any"
                    placeholder="Ej. 50"
                    value={exerciseDuration}
                    onChange={e => setExerciseDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exerciseTime">Momento preferente</Label>
                  <Select
                    id="exerciseTime"
                    value={exerciseTime}
                    onChange={e => setExerciseTime(e.target.value)}
                  >
                    <option value="">Seleccionar horario...</option>
                    <option value="morning">Mañanas (antes de trabajar)</option>
                    <option value="midday">Mediodía</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noche</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sportGoals">Objetivos específicos deportivos</Label>
                <Input
                  id="sportGoals"
                  placeholder="Ej. Correr media maratón en noviembre, mejorar marcas de fuerza, hipertrofia..."
                  value={sportGoals}
                  onChange={e => setSportGoals(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6: SALUD FEMENINA */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Flower2 className="h-5 w-5 text-green-600" />
                    <span>Paso 6: Salud Femenina y Hormonal</span>
                  </CardTitle>
                  <CardDescription>
                    Ciclo ovárico, estados de gestación o terapias hormonales
                  </CardDescription>
                </div>
                <Badge variant="secondary">Opcional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Esta sección es aplicable principalmente a pacientes femeninas. Si el paciente es hombre o no procede, puedes pulsar directamente &quot;Siguiente&quot;.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="menstrualCycle">Ciclo menstrual</Label>
                  <Select
                    id="menstrualCycle"
                    value={menstrualCycle}
                    onChange={e => setMenstrualCycle(e.target.value)}
                  >
                    <option value="">Seleccionar estado...</option>
                    <option value="regular">Regular (26 - 32 días)</option>
                    <option value="irregular">Irregular</option>
                    <option value="amenorrhea">Amenorrea (ausencia de menstruación)</option>
                    <option value="menopause">Menopausia / Perimenopausia</option>
                    <option value="not_applicable">No aplica</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contraceptive">Método anticonceptivo</Label>
                  <Select
                    id="contraceptive"
                    value={contraceptive}
                    onChange={e => setContraceptive(e.target.value)}
                  >
                    <option value="">Seleccionar método...</option>
                    <option value="none">Ninguno / Métodos de barrera</option>
                    <option value="hormonal">Hormonal oral (píldora)</option>
                    <option value="iud">DIU (cobre u hormonal)</option>
                    <option value="implant">Implante subcutáneo</option>
                    <option value="other">Otro</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pregnant}
                    onChange={e => setPregnant(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                  />
                  <span>¿Actualmente embarazada?</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={breastfeeding}
                    onChange={e => setBreastfeeding(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                  />
                  <span>¿En periodo de lactancia materna?</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hormoneTherapy}
                    onChange={e => setHormoneTherapy(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                  />
                  <span>¿Terapia de reemplazo hormonal u hormonoterapia?</span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 7: OBJETIVOS Y PRIMERA VALORACIÓN */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <Target className="h-5 w-5 text-green-600" />
                      <span>Paso 7: Objetivos y Primera Valoración</span>
                    </CardTitle>
                    <CardDescription>
                      Prioridades terapéuticas, metas a medio/largo plazo y antropometría inicial
                    </CardDescription>
                  </div>
                  <Badge variant="default">Paso Final</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Volcado desde Báscula (InBody / Tanita / SECA / CSV / TXT / JSON) */}
                <div className="p-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">
                          Volcar Datos de Báscula Automáticamente
                        </span>
                        <span className="text-[11px] text-emerald-700 block">
                          Compatible con InBody, Tanita, SECA (.csv, .txt, .json)
                        </span>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0">
                      {scaleParsing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Leyendo báscula...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>Seleccionar archivo báscula</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".csv,.txt,.json"
                        onChange={handleScaleFile}
                        disabled={scaleParsing}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {scaleSuccess && (
                    <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-medium">
                      {scaleSuccess}
                    </div>
                  )}

                  {scaleError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                      {scaleError}
                    </div>
                  )}
                </div>

                {/* Antropometría Inicial */}
                <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-green-900 block">
                      Antropometría Inicial (Punto de partida)
                    </Label>
                    <span className="text-xs text-green-700">* Peso requerido para cálculo de IMC</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="weightKg" className="text-xs">Peso actual (kg)</Label>
                      <Input
                        id="weightKg"
                        type="number"
                        step="any"
                        placeholder="70.5"
                        value={weightKg}
                        onChange={e => setWeightKg(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bodyFatPct" className="text-xs">% Grasa (opcional)</Label>
                      <Input
                        id="bodyFatPct"
                        type="number"
                        step="any"
                        placeholder="22.5"
                        value={bodyFatPct}
                        onChange={e => setBodyFatPct(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="waistCm" className="text-xs">Cintura (cm)</Label>
                      <Input
                        id="waistCm"
                        type="number"
                        step="any"
                        placeholder="80"
                        value={waistCm}
                        onChange={e => setWaistCm(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hipCm" className="text-xs">Cadera (cm)</Label>
                      <Input
                        id="hipCm"
                        type="number"
                        step="any"
                        placeholder="98"
                        value={hipCm}
                        onChange={e => setHipCm(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="objective">Objetivo Nutricional Primario *</Label>
                    <Select
                      id="objective"
                      value={objective}
                      onChange={e => setObjective(e.target.value as Objective)}
                    >
                      {OBJECTIVE_VALUES.map(val => (
                        <option key={val} value={val}>
                          {OBJECTIVE_LABELS[val]}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="motivation">Motivación principal</Label>
                    <Select
                      id="motivation"
                      value={motivation}
                      onChange={e => setMotivation(e.target.value)}
                    >
                      <option value="health">Salud y bienestar general</option>
                      <option value="aesthetics">Composición corporal y estética</option>
                      <option value="performance">Rendimiento deportivo / Competición</option>
                      <option value="medical">Prescripción médica obligatoria</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="shortTermGoal">Meta a corto plazo (1 - 3 meses)</Label>
                    <Input
                      id="shortTermGoal"
                      placeholder="Ej. Bajar 3kg y deshincharme el abdomen..."
                      value={shortTermGoal}
                      onChange={e => setShortTermGoal(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="longTermGoal">Meta a largo plazo (6 - 12 meses)</Label>
                    <Input
                      id="longTermGoal"
                      placeholder="Ej. Consolidar hábitos sin efecto rebote y analítica limpia..."
                      value={longTermGoal}
                      onChange={e => setLongTermGoal(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="consultationFrequency">Frecuencia de seguimiento sugerida</Label>
                    <Select
                      id="consultationFrequency"
                      value={consultationFrequency}
                      onChange={e => setConsultationFrequency(e.target.value)}
                    >
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal (recomendado)</option>
                      <option value="monthly">Mensual</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="budgetLevel">Nivel de presupuesto para la compra</Label>
                    <Select
                      id="budgetLevel"
                      value={budgetLevel}
                      onChange={e => setBudgetLevel(e.target.value)}
                    >
                      <option value="low">Ajustado / Económico</option>
                      <option value="medium">Medio / Estándar</option>
                      <option value="high">Sin restricción presupuestaria</option>
                    </Select>
                  </div>
                </div>

                {/* Filtros Alimentarios */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                  <div className="space-y-1.5">
                    <Label htmlFor="allergies">Alergias alimentarias</Label>
                    <Input
                      id="allergies"
                      placeholder="Ej. Frutos secos, marisco..."
                      value={allergies}
                      onChange={e => setAllergies(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="intolerances">Intolerancias conocidas</Label>
                    <Input
                      id="intolerances"
                      placeholder="Ej. Lactosa, gluten, fructosa..."
                      value={intolerances}
                      onChange={e => setIntolerances(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dietaryPreferences">Preferencias dietéticas</Label>
                    <Input
                      id="dietaryPreferences"
                      placeholder="Ej. Vegetariano, Halal, Kosher..."
                      value={dietaryPreferences}
                      onChange={e => setDietaryPreferences(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="previousDiets">Dietas o intentos anteriores</Label>
                  <Textarea
                    id="previousDiets"
                    rows={2}
                    placeholder="Ej. Hizo dieta keto hace 2 años perdiendo 5kg pero recuperó peso, ayuno intermitente 16/8..."
                    value={previousDiets}
                    onChange={e => setPreviousDiets(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="additionalNotes">Notas y observaciones adicionales</Label>
                  <Textarea
                    id="additionalNotes"
                    rows={3}
                    placeholder="Cualquier apunte relevante de la primera entrevista o acuerdos con el paciente..."
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="w-full text-xs leading-relaxed text-gray-500">Consulta el <Link href="/privacy-policy" target="_blank" className="font-semibold text-blue-700 underline">aviso de privacidad</Link>, las <Link href="/terms" target="_blank" className="font-semibold text-blue-700 underline">condiciones del portal</Link> y la <Link href="/cookies" target="_blank" className="font-semibold text-blue-700 underline">política de cookies</Link> antes de registrar la información legal (versión {LEGAL_POLICY_VERSION}).</p>
          <div className="mr-4 grid max-w-3xl gap-2 text-xs leading-relaxed text-gray-700">
            <label className="flex items-start gap-2"><input type="checkbox" checked={privacyNoticeAccepted} onChange={(e) => setPrivacyNoticeAccepted(e.target.checked)} className="mt-0.5" /><span>Confirmo que he informado a la persona interesada sobre privacidad y derechos. *</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={portalTermsAccepted} onChange={(e) => setPortalTermsAccepted(e.target.checked)} className="mt-0.5" /><span>Confirmo la aceptación de las condiciones de uso del portal clínico. *</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={healthDataConsentAccepted} onChange={(e) => setHealthDataConsentAccepted(e.target.checked)} className="mt-0.5" /><span>Confirmo que existe una base válida y documentada para tratar los datos de salud con finalidad asistencial. *</span></label>
          </div>
          <div>
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>
            ) : (
              <Link href="/dashboard/patients">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 7 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-900 text-xs px-2.5"
                >
                  <span>Saltar este paso</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFinalSubmit()}
                  disabled={loading || !canSubmit}
                  className="text-xs text-green-700 border-green-200 hover:bg-green-50"
                  title="Guardar paciente directamente con los datos ingresados hasta ahora"
                >
                  <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                  <span>Guardar ya</span>
                </Button>
              </>
            )}

            {currentStep < 7 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 min-w-[120px]"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || !canSubmit}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 min-w-[170px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando paciente...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Guardar Paciente</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
