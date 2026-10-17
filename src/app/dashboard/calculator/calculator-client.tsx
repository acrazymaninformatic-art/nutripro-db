'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Calculator,
  Flame,
  Activity,
  Scale,
  Droplets,
  HeartPulse,
  Sparkles,
  Printer,
  CalendarPlus,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Footprints,
  Baby,
  ShieldAlert,
  Dna,
  BookOpen,
} from 'lucide-react'
import {
  calculateSchofield,
  calculateFaoOms,
  calculateOwen,
  calculateIretonJones,
  calculatePennState,
  calculateEnergyFromSteps,
  applySpecialNeedsToTDEE,
  SpecialNeedsAdjustment,
} from '@/lib/clinical/calculator/energy-formulas'
import {
  calculateDynamicWeightPrediction,
  WeightPredictionResult,
} from '@/lib/clinical/calculator/weight-prediction'
import {
  calculateScore2,
  calculateRegicor,
  calculateFindrisc,
  evaluateMetabolicSyndrome,
  getMicronutrientDRI,
} from '@/lib/clinical/calculator/cardiovascular-risk'
import {
  saveCalculatorResultAction,
  checkAnthropometryGoalRecalculationAction,
  applyRecalculatedTargetsToPlanAction,
} from '@/lib/clinical/calculator/calculator-actions'
import { CLINICAL_PROTOCOLS, calculateInsulinCarbBolus } from '@/lib/clinical/protocols/protocols-registry'

interface PatientOption {
  id: string
  name: string
  birthDate?: Date | string | null
  gender?: string | null
  heightCm?: number | null
  weightKg?: number | null
}

export function ClinicalCalculator({
  initialPatients = [],
}: {
  initialPatients?: PatientOption[]
}) {
  const [activeTab, setActiveTab] = useState<'metabolic' | 'prediction' | 'risk' | 'protocols'>('metabolic')

  // Patient selector
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [recalculationNotice, setRecalculationNotice] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // Biometrics
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>('FEMALE')
  const [age, setAge] = useState<number>(34)
  const [weightKg, setWeightKg] = useState<number>(68)
  const [heightCm, setHeightCm] = useState<number>(165)
  const [bodyFatPct, setBodyFatPct] = useState<number>(26)
  const [activityFactor, setActivityFactor] = useState<number>(1.55) // PAL
  const [goalAdjustment, setGoalAdjustment] = useState<number>(-15) // % deficit/surplus
  const [selectedBmrFormula, setSelectedBmrFormula] = useState<
    'mifflin' | 'harris' | 'katch' | 'cunningham' | 'schofield' | 'fao_oms' | 'owen' | 'ireton_jones' | 'penn_state'
  >('mifflin')

  // Steps and METs (5.10)
  const [dailySteps, setDailySteps] = useState<number>(8000)

  // Special Needs (5.10)
  const [pregnancyTrimester, setPregnancyTrimester] = useState<0 | 1 | 2 | 3>(0)
  const [isLactating, setIsLactating] = useState<boolean>(false)
  const [kidneyDiseaseStage, setKidneyDiseaseStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [isElderlySarcopenia, setIsElderlySarcopenia] = useState<boolean>(false)

  // Macro mode
  const [macroMode, setMacroMode] = useState<'g_kg' | 'percentages'>('g_kg')
  const [proteinGPerKg, setProteinGPerKg] = useState<number>(1.8)
  const [fatGPerKg, setFatGPerKg] = useState<number>(0.9)
  const [proteinPct, setProteinPct] = useState<number>(30)
  const [fatPct, setFatPct] = useState<number>(25)
  const [carbsPct, setCarbsPct] = useState<number>(45)

  // Weight prediction state (5.10)
  const [targetWeightKg, setTargetWeightKg] = useState<number>(60)

  // Cardiovascular & Metabolic risk state (5.10)
  const [isSmoker, setIsSmoker] = useState<boolean>(false)
  const [systolicBp, setSystolicBp] = useState<number>(125)
  const [diastolicBp, setDiastolicBp] = useState<number>(80)
  const [totalCholesterol, setTotalCholesterol] = useState<number>(195)
  const [hdlCholesterol, setHdlCholesterol] = useState<number>(55)
  const [triglycerides, setTriglycerides] = useState<number>(120)
  const [fastingGlucose, setFastingGlucose] = useState<number>(92)
  const [waistCircumference, setWaistCircumference] = useState<number>(78)

  // Diabetes Bolus state (5.9)
  const [carbGramsInput, setCarbGramsInput] = useState<number>(50)
  const [icrRatioInput, setIcrRatioInput] = useState<number>(10)
  const [preMealGlucoseInput, setPreMealGlucoseInput] = useState<number>(130)

  // Auto-fill when patient is selected
  useEffect(() => {
    if (!selectedPatientId) {
      setRecalculationNotice(null)
      return
    }

    const p = initialPatients.find((item) => item.id === selectedPatientId)
    if (p) {
      if (p.gender) setSex(p.gender.toUpperCase() === 'MALE' ? 'MALE' : 'FEMALE')
      if (p.heightCm) setHeightCm(p.heightCm)
      if (p.weightKg) {
        setWeightKg(p.weightKg)
        setTargetWeightKg(Math.round((p.weightKg * 0.9) * 10) / 10)
      }
      if (p.birthDate) {
        const birth = new Date(p.birthDate)
        const diff = Date.now() - birth.getTime()
        const computedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
        if (computedAge > 0 && computedAge < 110) setAge(computedAge)
      }

      // Check if goal recalculation is proposed
      checkAnthropometryGoalRecalculationAction(p.id)
        .then((res) => setRecalculationNotice(res))
        .catch(console.error)
    }
  }, [selectedPatientId, initialPatients])

  // Calculations
  const calculations = useMemo(() => {
    const w = Math.max(30, weightKg)
    const h = Math.max(100, heightCm)
    const a = Math.max(1, age)
    const bf = Math.max(3, Math.min(60, bodyFatPct))

    const fatMassKg = Math.round((w * (bf / 100)) * 10) / 10
    const leanMassKg = Math.round((w - fatMassKg) * 10) / 10

    // Standard BMR Formulas
    const bmrMifflin = sex === 'MALE' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
    const bmrHarris = sex === 'MALE' ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a
    const bmrKatch = 370 + 21.6 * leanMassKg
    const bmrCunningham = 500 + 22 * leanMassKg

    // 5.10 Extra Formulas
    const sexArg = sex === 'MALE' ? 'male' : 'female'
    const bmrSchofield = calculateSchofield({ weightKg: w, heightCm: h, ageYears: a, sex: sexArg })
    const bmrFaoOms = calculateFaoOms({ weightKg: w, heightCm: h, ageYears: a, sex: sexArg })
    const bmrOwen = calculateOwen({ weightKg: w, heightCm: h, ageYears: a, sex: sexArg })
    const bmrIretonJones = calculateIretonJones({ weightKg: w, ageYears: a, sex: sexArg })
    const bmrPennState = calculatePennState({ mifflinBmr: bmrMifflin })

    // Step Energy
    const stepsData = calculateEnergyFromSteps({ steps: dailySteps, weightKg: w, heightCm: h })

    // Chosen BMR
    let chosenBmr = bmrMifflin
    if (selectedBmrFormula === 'harris') chosenBmr = bmrHarris
    if (selectedBmrFormula === 'katch') chosenBmr = bmrKatch
    if (selectedBmrFormula === 'cunningham') chosenBmr = bmrCunningham
    if (selectedBmrFormula === 'schofield') chosenBmr = bmrSchofield
    if (selectedBmrFormula === 'fao_oms') chosenBmr = bmrFaoOms
    if (selectedBmrFormula === 'owen') chosenBmr = bmrOwen
    if (selectedBmrFormula === 'ireton_jones') chosenBmr = bmrIretonJones
    if (selectedBmrFormula === 'penn_state') chosenBmr = bmrPennState

    // Baseline TDEE + Steps
    const rawTdee = Math.round(chosenBmr * activityFactor) + stepsData.caloriesBurnedKcal

    // Special Needs Adjustments
    const specialNeedsInput: SpecialNeedsAdjustment = {
      pregnancyTrimester: pregnancyTrimester > 0 ? (pregnancyTrimester as 1 | 2 | 3) : undefined,
      isLactating,
      kidneyDiseaseStage: kidneyDiseaseStage > 0 ? (kidneyDiseaseStage as 1 | 2 | 3 | 4 | 5) : undefined,
      isElderlySarcopenia,
    }
    const specialNeedsResult = applySpecialNeedsToTDEE(rawTdee, w, specialNeedsInput)
    const tdee = specialNeedsResult.adjustedTdee

    // Target Calories
    const targetKcal = Math.round(tdee * (1 + goalAdjustment / 100))

    // Macros
    let protG = 0
    let fatG = 0
    let carbsG = 0

    if (macroMode === 'g_kg') {
      protG = Math.round(proteinGPerKg * w)
      fatG = Math.round(fatGPerKg * w)
      const remainingCal = Math.max(0, targetKcal - (protG * 4 + fatG * 9))
      carbsG = Math.round(remainingCal / 4)
    } else {
      protG = Math.round((targetKcal * (proteinPct / 100)) / 4)
      fatG = Math.round((targetKcal * (fatPct / 100)) / 9)
      carbsG = Math.round((targetKcal * (carbsPct / 100)) / 4)
    }

    const protKcal = protG * 4
    const fatKcal = fatG * 9
    const carbsKcal = carbsG * 4
    const actualTotalCal = protKcal + fatKcal + carbsKcal

    const pRatio = Math.round((protKcal / (actualTotalCal || 1)) * 100)
    const cRatio = Math.round((carbsKcal / (actualTotalCal || 1)) * 100)
    const fRatio = Math.max(0, 100 - pRatio - cRatio)

    // BMI
    const heightM = h / 100
    const bmi = Math.round((w / (heightM * heightM)) * 10) / 10

    // Dynamic Weight Prediction (5.10)
    const deficitKcal = Math.max(0, tdee - targetKcal)
    const predictionResult = calculateDynamicWeightPrediction({
      currentWeightKg: w,
      targetWeightKg,
      heightCm: h,
      ageYears: a,
      sex: sexArg,
      baselineTdee: tdee,
      dailyDeficitKcal: deficitKcal,
      activityIncreaseKcal: stepsData.caloriesBurnedKcal > 200 ? 100 : 0,
    })

    // Cardiovascular & Metabolic Risk Assessments (5.10)
    const score2Result = calculateScore2({
      ageYears: a,
      sex: sexArg,
      isSmoker,
      systolicBpMmHg: systolicBp,
      totalCholesterolMgDl: totalCholesterol,
      hdlCholesterolMgDl: hdlCholesterol,
    })

    const regicorResult = calculateRegicor({
      ageYears: a,
      sex: sexArg,
      isSmoker,
      systolicBpMmHg: systolicBp,
      diastolicBpMmHg: diastolicBp,
      totalCholesterolMgDl: totalCholesterol,
      hdlCholesterolMgDl: hdlCholesterol,
    })

    const findriscResult = calculateFindrisc({
      ageYears: a,
      bmi,
      waistCm: waistCircumference,
      sex: sexArg,
    })

    const metabolicSyndromeResult = evaluateMetabolicSyndrome({
      sex: sexArg,
      waistCm: waistCircumference,
      triglyceridesMgDl: triglycerides,
      hdlCholesterolMgDl: hdlCholesterol,
      systolicBpMmHg: systolicBp,
      diastolicBpMmHg: diastolicBp,
      fastingGlucoseMgDl: fastingGlucose,
    })

    const micronutrientDri = getMicronutrientDRI(a, sexArg, pregnancyTrimester > 0, isLactating)

    // Insulin bolus (5.9)
    const insulinBolus = calculateInsulinCarbBolus({
      carbGrams: carbGramsInput,
      insulinCarbRatio: icrRatioInput,
      currentGlucose: preMealGlucoseInput,
    })

    return {
      chosenBmr: Math.round(chosenBmr),
      bmrMifflin: Math.round(bmrMifflin),
      bmrHarris: Math.round(bmrHarris),
      bmrKatch: Math.round(bmrKatch),
      bmrCunningham: Math.round(bmrCunningham),
      bmrSchofield: Math.round(bmrSchofield),
      bmrFaoOms: Math.round(bmrFaoOms),
      bmrOwen: Math.round(bmrOwen),
      bmrIretonJones: Math.round(bmrIretonJones),
      bmrPennState: Math.round(bmrPennState),
      stepsData,
      tdee,
      targetKcal,
      protG,
      fatG,
      carbsG,
      pRatio,
      cRatio,
      fRatio,
      bmi,
      fatMassKg,
      leanMassKg,
      specialNeedsResult,
      predictionResult,
      score2Result,
      regicorResult,
      findriscResult,
      metabolicSyndromeResult,
      micronutrientDri,
      insulinBolus,
    }
  }, [
    sex,
    age,
    weightKg,
    heightCm,
    bodyFatPct,
    activityFactor,
    goalAdjustment,
    selectedBmrFormula,
    dailySteps,
    pregnancyTrimester,
    isLactating,
    kidneyDiseaseStage,
    isElderlySarcopenia,
    macroMode,
    proteinGPerKg,
    fatGPerKg,
    proteinPct,
    fatPct,
    carbsPct,
    targetWeightKg,
    isSmoker,
    systolicBp,
    diastolicBp,
    totalCholesterol,
    hdlCholesterol,
    triglycerides,
    fastingGlucose,
    waistCircumference,
    carbGramsInput,
    icrRatioInput,
    preMealGlucoseInput,
  ])

  const handleSaveToPatient = async () => {
    if (!selectedPatientId) return
    setIsSaving(true)
    setSaveSuccessMessage(null)

    try {
      await saveCalculatorResultAction({
        patientId: selectedPatientId,
        formula: selectedBmrFormula.toUpperCase(),
        bmrKcal: calculations.chosenBmr,
        tdeeKcal: calculations.tdee,
        activityFactor,
        specialNeeds: calculations.specialNeedsResult.adjustmentsApplied,
        stepsOrMets: calculations.stepsData,
        weightPrediction: {
          targetWeightKg,
          estimatedGoalDate: calculations.predictionResult.estimatedGoalDate,
          plateauWeightKg: calculations.predictionResult.plateauWeightKg,
        },
        cardiovascularRisk: {
          score2: calculations.score2Result.scorePct,
          regicor: calculations.regicorResult.scorePct,
          findrisc: calculations.findriscResult.score,
          metabolicSyndrome: calculations.metabolicSyndromeResult.hasMetabolicSyndrome,
        },
        micronutrientDri: calculations.micronutrientDri,
        notes: `Cálculo automático con fórmula ${selectedBmrFormula.toUpperCase()}. Objetivo: ${calculations.targetKcal} kcal.`,
      })
      setSaveSuccessMessage('¡Evaluación metabólica y clínica guardada correctamente en la ficha del paciente!')
    } catch (err: any) {
      alert(err.message || 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyRecalculation = async () => {
    if (!recalculationNotice || !recalculationNotice.planId) return
    try {
      await applyRecalculatedTargetsToPlanAction({
        planId: recalculationNotice.planId,
        newTargetKcal: recalculationNotice.suggestedTargetKcal,
      })
      setRecalculationNotice(null)
      alert('¡Objetivos del plan recalculados y actualizados con éxito!')
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el plan')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-blue-600" />
            <span>Calculadora Metabólica Clínica & Protocolos 5.10</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Fórmulas científicas (Schofield, FAO, Owen, Ireton-Jones, Penn State), predicción dinámica NIH y protocolos clínicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedPatientId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToPatient}
              disabled={isSaving}
              className="rounded-2xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar en Ficha'}</span>
            </Button>
          )}

          <Link
            href={`/dashboard/plans/new?targetKcal=${calculations.targetKcal}&proteinG=${calculations.protG}&carbsG=${calculations.carbsG}&fatG=${calculations.fatG}`}
          >
            <Button
              size="sm"
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs gap-1.5"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>Crear Plan con estos Macros</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recalculation Notice Banner (5.10) */}
      {recalculationNotice && recalculationNotice.needsRecalculation && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block text-sm text-amber-900">
                Aviso de Recálculo de Objetivos (Sección 5.10)
              </span>
              <span>{recalculationNotice.message}</span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleApplyRecalculation}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
          >
            Aplicar ~{recalculationNotice.suggestedTargetKcal} kcal al Plan
          </Button>
        </div>
      )}

      {saveSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Navigation Tabs (5.9 / 5.10) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('metabolic')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'metabolic'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>1. Gasto Metabólico & Fórmulas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prediction')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'prediction'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>2. Predicción Dinámica NIH</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('risk')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'risk'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>3. Riesgo SCORE2 / REGICOR & DRI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('protocols')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'protocols'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>4. Protocolos Clínicos (5.9)</span>
        </button>
      </div>

      {/* Patient Selector Bar */}
      {initialPatients.length > 0 && (
        <Card className="rounded-2xl border-gray-200 p-3 bg-gray-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-700">
              <span className="text-gray-400">Vincular paciente:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar paciente de la consulta...</option>
                {initialPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.weightKg ? `(${p.weightKg} kg)` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedPatientId && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Datos biométricos sincronizados con el expediente
              </span>
            )}
          </div>
        </Card>
      )}

      {/* TAB 1: GASTO METABÓLICO & FÓRMULAS CLÍNICAS */}
      {activeTab === 'metabolic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs Column */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="rounded-3xl border-gray-200 shadow-xs overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  <span>Parámetros Biométricos y Ecuaciones</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-4 text-xs">
                {/* Sex */}
                <div className="space-y-1.5">
                  <Label>Sexo Biológico</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSex('FEMALE')}
                      className={`py-2 px-3 rounded-2xl font-bold text-xs border transition-all ${
                        sex === 'FEMALE'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      👩 Mujer
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex('MALE')}
                      className={`py-2 px-3 rounded-2xl font-bold text-xs border transition-all ${
                        sex === 'MALE'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      👨 Hombre
                    </button>
                  </div>
                </div>

                {/* Age, Height, Weight, BF */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Edad (años)</Label>
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value) || 20)}
                      className="rounded-2xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value) || 160)}
                      className="rounded-2xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Peso Actual (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value) || 60)}
                      className="rounded-2xl font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>% Grasa Corporal</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={bodyFatPct}
                      onChange={(e) => setBodyFatPct(Number(e.target.value) || 20)}
                      className="rounded-2xl font-bold"
                    />
                  </div>
                </div>

                {/* 5.10 Fórmulas Clínicas Extensas */}
                <div className="space-y-1 pt-2 border-t">
                  <Label>Fórmula de Metabolismo Basal (TMB)</Label>
                  <Select
                    value={selectedBmrFormula}
                    onChange={(e) => setSelectedBmrFormula(e.target.value as any)}
                    className="rounded-2xl font-semibold text-blue-900"
                  >
                    <option value="mifflin">Mifflin-St Jeor (1990) — Recomendada AND/ESPEN</option>
                    <option value="harris">Harris-Benedict Revisada (1984)</option>
                    <option value="katch">Katch-McArdle (1996) — Masa Magra</option>
                    <option value="cunningham">Cunningham (1980) — Deportistas</option>
                    <option value="schofield">Schofield (1985) — Pediatría y Adultos</option>
                    <option value="fao_oms">FAO / OMS / UNU (2004)</option>
                    <option value="owen">Owen (1987) — Población Clínica</option>
                    <option value="ireton_jones">Ireton-Jones (1992) — Paciente Clínico/Crítico</option>
                    <option value="penn_state">Penn State (2003b/2010) — UCI</option>
                  </Select>
                </div>

                {/* 5.10 Gasto por Pasos Diarios */}
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pasos Diarios Estimados</span>
                    </Label>
                    <span className="font-bold text-blue-700">
                      +{calculations.stepsData.caloriesBurnedKcal} kcal ({calculations.stepsData.distanceKm} km)
                    </span>
                  </div>
                  <Input
                    type="number"
                    step="500"
                    value={dailySteps}
                    onChange={(e) => setDailySteps(Number(e.target.value) || 0)}
                    className="rounded-2xl font-bold"
                  />
                </div>

                {/* 5.10 Necesidades Especiales (Embarazo, Lactancia, Renal, Mayores) */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5 text-purple-600" />
                    <span>Ajustes Especiales (5.10)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2 text-2xs">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Embarazo:</span>
                      <select
                        value={pregnancyTrimester}
                        onChange={(e) => setPregnancyTrimester(Number(e.target.value) as any)}
                        className="w-full p-1.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      >
                        <option value="0">No embarazada</option>
                        <option value="1">1º Trimestre (+85 kcal)</option>
                        <option value="2">2º Trimestre (+285 kcal)</option>
                        <option value="3">3º Trimestre (+475 kcal)</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Enfermedad Renal:</span>
                      <select
                        value={kidneyDiseaseStage}
                        onChange={(e) => setKidneyDiseaseStage(Number(e.target.value) as any)}
                        className="w-full p-1.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      >
                        <option value="0">Sin ERC</option>
                        <option value="3">Estadio 3 (0.8g/kg)</option>
                        <option value="4">Estadio 4 (0.6g/kg)</option>
                        <option value="5">Estadio 5 Diálisis (1.2g/kg)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isLactating}
                        onChange={(e) => setIsLactating(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="font-semibold text-gray-700">Lactancia (+500 kcal)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isElderlySarcopenia}
                        onChange={(e) => setIsElderlySarcopenia(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="font-semibold text-gray-700">Adulto Mayor / Sarcopenia</span>
                    </label>
                  </div>
                </div>

                {/* Goal Adjustment */}
                <div className="space-y-1.5 pt-2 border-t">
                  <Label>Objetivo Calórico (Déficit / Superávit)</Label>
                  <Select
                    value={goalAdjustment.toString()}
                    onChange={(e) => setGoalAdjustment(Number(e.target.value))}
                    className="rounded-2xl font-semibold"
                  >
                    <option value="-25">Déficit Intenso (-25% kcal)</option>
                    <option value="-20">Déficit Fuerte (-20% kcal)</option>
                    <option value="-15">Déficit Moderado (-15% kcal) — Clínico estándar</option>
                    <option value="-10">Déficit Suave (-10% kcal)</option>
                    <option value="0">Mantenimiento Normocalórico (0%)</option>
                    <option value="10">Superávit Limpio (+10% kcal)</option>
                    <option value="15">Superávit Hipertrofia (+15% kcal)</option>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Hero Card */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-300" />
                Prescripción Calórica Objetivo
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight">{calculations.targetKcal}</span>
                <span className="text-lg text-blue-200 font-bold">kcal / día</span>
              </div>
              <p className="text-xs text-blue-100/90 mt-1 font-medium">
                Gasto Energético Total (TDEE): <strong>{calculations.tdee} kcal</strong> • TMB Seleccionada: <strong>{calculations.chosenBmr} kcal</strong>
              </p>
            </div>

            {/* Macros Distribution */}
            <Card className="rounded-3xl border-gray-200 shadow-xs p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                Distribución de Macronutrientes
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100">
                  <span className="text-2xs uppercase font-bold text-blue-700 block">Proteína</span>
                  <span className="text-2xl font-black text-blue-900">{calculations.protG} g</span>
                  <span className="text-3xs text-blue-500 block">{(calculations.protG / weightKg).toFixed(1)} g/kg</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100">
                  <span className="text-2xs uppercase font-bold text-amber-700 block">Carbohidratos</span>
                  <span className="text-2xl font-black text-amber-900">{calculations.carbsG} g</span>
                  <span className="text-3xs text-amber-500 block">{(calculations.carbsG / weightKg).toFixed(1)} g/kg</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-100">
                  <span className="text-2xs uppercase font-bold text-rose-700 block">Grasas</span>
                  <span className="text-2xl font-black text-rose-900">{calculations.fatG} g</span>
                  <span className="text-3xs text-rose-500 block">{(calculations.fatG / weightKg).toFixed(1)} g/kg</span>
                </div>
              </div>
            </Card>

            {/* Comparative Table of All Formulas */}
            <Card className="rounded-3xl border-gray-200 shadow-xs overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-xs uppercase font-bold text-gray-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Comparativa Multiecuación Científica (5.10)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b">
                    <tr>
                      <th className="px-4 py-2.5">Ecuación</th>
                      <th className="px-4 py-2.5 text-right">TMB</th>
                      <th className="px-4 py-2.5 text-right">Gasto TDEE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr className={selectedBmrFormula === 'mifflin' ? 'bg-blue-50 font-bold text-blue-900' : ''}>
                      <td className="px-4 py-2">Mifflin-St Jeor (1990)</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrMifflin} kcal</td>
                      <td className="px-4 py-2 text-right">{Math.round(calculations.bmrMifflin * activityFactor)} kcal</td>
                    </tr>
                    <tr className={selectedBmrFormula === 'schofield' ? 'bg-blue-50 font-bold text-blue-900' : ''}>
                      <td className="px-4 py-2">Schofield (1985)</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrSchofield} kcal</td>
                      <td className="px-4 py-2 text-right">{Math.round(calculations.bmrSchofield * activityFactor)} kcal</td>
                    </tr>
                    <tr className={selectedBmrFormula === 'fao_oms' ? 'bg-blue-50 font-bold text-blue-900' : ''}>
                      <td className="px-4 py-2">FAO / OMS / UNU (2004)</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrFaoOms} kcal</td>
                      <td className="px-4 py-2 text-right">{Math.round(calculations.bmrFaoOms * activityFactor)} kcal</td>
                    </tr>
                    <tr className={selectedBmrFormula === 'owen' ? 'bg-blue-50 font-bold text-blue-900' : ''}>
                      <td className="px-4 py-2">Owen (1987)</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrOwen} kcal</td>
                      <td className="px-4 py-2 text-right">{Math.round(calculations.bmrOwen * activityFactor)} kcal</td>
                    </tr>
                    <tr className={selectedBmrFormula === 'ireton_jones' ? 'bg-blue-50 font-bold text-blue-900' : ''}>
                      <td className="px-4 py-2">Ireton-Jones (1992 - Clínico)</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrIretonJones} kcal</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrIretonJones} kcal</td>
                    </tr>
                    <tr className={selectedBmrFormula === 'penn_state' ? 'bg-blue-50 font-bold text-blue-900' : ''}>
                      <td className="px-4 py-2">Penn State (UCI / Críticos)</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrPennState} kcal</td>
                      <td className="px-4 py-2 text-right">{calculations.bmrPennState} kcal</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PREDICCIÓN DINÁMICA NIH BODY WEIGHT PLANNER */}
      {activeTab === 'prediction' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-gray-200 shadow-xs p-6 bg-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                  <span>Modelo Dinámico de Predicción de Peso (NIH Body Weight Planner)</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Simulación no lineal con adaptación metabólica continua (Hall et al.). Supera la errónea regla lineal de Wishnofsky.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xs text-gray-400 block font-bold uppercase">Peso Meta:</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.5"
                      value={targetWeightKg}
                      onChange={(e) => setTargetWeightKg(Number(e.target.value) || 50)}
                      className="w-24 h-8 text-xs font-bold text-center rounded-xl"
                    />
                    <span className="text-xs font-bold text-gray-700">kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                <span className="text-2xs font-bold text-blue-700 uppercase block">Pérdida Total Prevista</span>
                <span className="text-2xl font-black text-blue-900">{calculations.predictionResult.totalTargetLossKg} kg</span>
                <span className="text-2xs text-blue-500 block font-semibold">De {weightKg}kg a {targetWeightKg}kg</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-2xs font-bold text-emerald-700 uppercase block">Fecha Estimada de Meta</span>
                <span className="text-lg font-black text-emerald-900 block mt-1">
                  {calculations.predictionResult.estimatedGoalDate || 'Meseta previa'}
                </span>
                <span className="text-2xs text-emerald-600 block font-semibold">
                  {calculations.predictionResult.estimatedWeeksToGoal
                    ? `~${calculations.predictionResult.estimatedWeeksToGoal} semanas de adherencia`
                    : 'Ajustar déficit'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                <span className="text-2xs font-bold text-amber-700 uppercase block">Peso de Meseta (Plateau)</span>
                <span className="text-2xl font-black text-amber-900">{calculations.predictionResult.plateauWeightKg} kg</span>
                <span className="text-2xs text-amber-600 block font-semibold">Punto de equilibrio metabólico</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                <span className="text-2xs font-bold text-purple-700 uppercase block">Déficit Prescrito</span>
                <span className="text-2xl font-black text-purple-900">
                  {Math.max(0, calculations.tdee - calculations.targetKcal)} kcal
                </span>
                <span className="text-2xs text-purple-600 block font-semibold">
                  Dieta: {calculations.targetKcal} kcal/día
                </span>
              </div>
            </div>

            {/* Side-by-side Scenarios Comparison (5.10) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Comparativa de Escenarios Lado a Lado (5.10)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-gray-800 block">
                    {calculations.predictionResult.scenariosComparison.moderateScenario.label}
                  </span>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Meseta proyectada: <strong>{calculations.predictionResult.scenariosComparison.moderateScenario.plateauKg} kg</strong></p>
                    <p>Semanas a meta: <strong>{calculations.predictionResult.scenariosComparison.moderateScenario.weeksToGoal ? `${calculations.predictionResult.scenariosComparison.moderateScenario.weeksToGoal} sem` : 'No alcanzable sin mayor déficit'}</strong></p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <span className="text-xs font-bold text-blue-900 block">
                    {calculations.predictionResult.scenariosComparison.recommendedScenario.label}
                  </span>
                  <div className="text-xs text-blue-950 space-y-1">
                    <p>Meseta proyectada: <strong>{calculations.predictionResult.scenariosComparison.recommendedScenario.plateauKg} kg</strong></p>
                    <p>Semanas a meta: <strong>{calculations.predictionResult.scenariosComparison.recommendedScenario.weeksToGoal ? `${calculations.predictionResult.scenariosComparison.recommendedScenario.weeksToGoal} sem` : 'Meseta antes de meta'}</strong></p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 block">
                    {calculations.predictionResult.scenariosComparison.activeScenario.label}
                  </span>
                  <div className="text-xs text-emerald-950 space-y-1">
                    <p>Meseta proyectada: <strong>{calculations.predictionResult.scenariosComparison.activeScenario.plateauKg} kg</strong></p>
                    <p>Semanas a meta: <strong>{calculations.predictionResult.scenariosComparison.activeScenario.weeksToGoal ? `${calculations.predictionResult.scenariosComparison.activeScenario.weeksToGoal} sem` : 'Meseta antes de meta'}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: RIESGO CARDIOVASCULAR (SCORE2 / REGICOR), FINDRISC Y DRI */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SCORE2 */}
            <Card className="rounded-3xl border-gray-200 p-5 bg-white space-y-2 shadow-xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                SCORE2 (ESC 2021)
              </span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-3xl font-black text-gray-900">{calculations.score2Result.scorePct}%</span>
                <Badge className={calculations.score2Result.riskCategory === 'MUY_ALTO' ? 'bg-red-600' : calculations.score2Result.riskCategory === 'ALTO' ? 'bg-amber-600' : 'bg-emerald-600'}>
                  {calculations.score2Result.riskCategory}
                </Badge>
              </div>
              <p className="text-2xs text-gray-500 leading-tight">{calculations.score2Result.description}</p>
            </Card>

            {/* REGICOR */}
            <Card className="rounded-3xl border-gray-200 p-5 bg-white space-y-2 shadow-xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                REGICOR (España)
              </span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-3xl font-black text-gray-900">{calculations.regicorResult.scorePct}%</span>
                <Badge variant="outline">{calculations.regicorResult.riskCategory}</Badge>
              </div>
              <p className="text-2xs text-gray-500 leading-tight">{calculations.regicorResult.description}</p>
            </Card>

            {/* FINDRISC */}
            <Card className="rounded-3xl border-gray-200 p-5 bg-white space-y-2 shadow-xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                FINDRISC (DM2 10 años)
              </span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-3xl font-black text-gray-900">{calculations.findriscResult.score} pts</span>
                <Badge variant="secondary">{calculations.findriscResult.riskLevel}</Badge>
              </div>
              <p className="text-2xs text-gray-500 leading-tight">Probabilidad a 10 años: {calculations.findriscResult.probability10YearsPct}</p>
            </Card>

            {/* Síndrome Metabólico */}
            <Card className="rounded-3xl border-gray-200 p-5 bg-white space-y-2 shadow-xs">
              <span className="text-2xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Síndrome Metabólico (IDF)
              </span>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-3xl font-black text-gray-900">
                  {calculations.metabolicSyndromeResult.criteriaMetCount}/5
                </span>
                <Badge className={calculations.metabolicSyndromeResult.hasMetabolicSyndrome ? 'bg-red-600' : 'bg-emerald-600'}>
                  {calculations.metabolicSyndromeResult.hasMetabolicSyndrome ? 'POSITIVO' : 'NEGATIVO'}
                </Badge>
              </div>
              <p className="text-2xs text-gray-500 leading-tight">
                {calculations.metabolicSyndromeResult.hasMetabolicSyndrome
                  ? 'Cumple ≥ 3 criterios armonizados. Riesgo cardiovascular y aterogénico aumentado.'
                  : 'No cumple criterios de síndrome metabólico.'}
              </p>
            </Card>
          </div>

          {/* DRI Ingestas de Referencia de Micronutrientes */}
          <Card className="rounded-3xl border-gray-200 p-6 bg-white shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Dna className="w-4 h-4 text-blue-600" />
              <span>Ingestas Dietéticas de Referencia de Micronutrientes (FESNAD / EFSA para {age} años, {sex === 'MALE' ? 'Hombre' : 'Mujer'})</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-2xs text-gray-500 font-bold uppercase block">Calcio (Ca)</span>
                <span className="font-extrabold text-gray-900 text-sm">{calculations.micronutrientDri.calciumMg} mg</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-2xs text-gray-500 font-bold uppercase block">Hierro (Fe)</span>
                <span className="font-extrabold text-gray-900 text-sm">{calculations.micronutrientDri.ironMg} mg</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-2xs text-gray-500 font-bold uppercase block">Yodo (I)</span>
                <span className="font-extrabold text-gray-900 text-sm">{calculations.micronutrientDri.iodineUg} µg</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-2xs text-gray-500 font-bold uppercase block">Magnesio (Mg)</span>
                <span className="font-extrabold text-gray-900 text-sm">{calculations.micronutrientDri.magnesiumMg} mg</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-2xs text-gray-500 font-bold uppercase block">Zinc (Zn)</span>
                <span className="font-extrabold text-gray-900 text-sm">{calculations.micronutrientDri.zincMg} mg</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <span className="text-2xs text-gray-500 font-bold uppercase block">Vitamina D</span>
                <span className="font-extrabold text-gray-900 text-sm">{calculations.micronutrientDri.vitaminDUg} µg</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: PROTOCOLOS CLÍNICOS ESPECIALIZADOS (5.9) */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          {/* Diabetes Bolus & Insulin Ratio Quick Calculator */}
          <Card className="rounded-3xl border border-blue-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Conteo de Raciones e Insulina (EVSoftware 5.9 Diabetes)
                </h3>
                <p className="text-xs text-gray-500">
                  Cálculo de raciones (1 ración = 10g HC en España) y cálculo del bolo prandial y corrector.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <Label>Carbohidratos de la comida (g)</Label>
                <Input
                  type="number"
                  value={carbGramsInput}
                  onChange={(e) => setCarbGramsInput(Number(e.target.value) || 0)}
                  className="rounded-xl font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label>Ratio Insulina/HC (g por 1 UI)</Label>
                <Input
                  type="number"
                  value={icrRatioInput}
                  onChange={(e) => setIcrRatioInput(Number(e.target.value) || 10)}
                  className="rounded-xl font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label>Glucemia Pre-comida (mg/dL)</Label>
                <Input
                  type="number"
                  value={preMealGlucoseInput}
                  onChange={(e) => setPreMealGlucoseInput(Number(e.target.value) || 100)}
                  className="rounded-xl font-bold"
                />
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col justify-center text-center">
                <span className="text-2xs uppercase font-bold text-blue-700">Bolo Recomendado</span>
                <span className="text-xl font-black text-blue-900">
                  {calculations.insulinBolus.totalRecommendedBolusUnits} UI
                </span>
                <span className="text-3xs text-blue-600 font-semibold">
                  {calculations.insulinBolus.carbPortionsSpain} raciones HC
                </span>
              </div>
            </div>
          </Card>

          {/* Full Protocols Directory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CLINICAL_PROTOCOLS.map((proto) => (
              <Card key={proto.id} className="rounded-3xl border-gray-200 bg-white p-5 flex flex-col justify-between hover:border-blue-300 transition-all shadow-xs">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-2xs font-bold rounded-full bg-blue-50 text-blue-800 border-blue-200">
                      {proto.badge}
                    </Badge>
                    <span className="text-2xs font-bold text-gray-400 uppercase">
                      {proto.category === 'METABOLIC_RENAL' ? 'Metabólico/Renal' : proto.category === 'DIGESTIVE' ? 'Digestivo' : proto.category === 'LIFE_STAGES' ? 'Etapa de Vida' : 'Específico'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{proto.name}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{proto.summary}</p>

                  {proto.phases && proto.phases.length > 0 && (
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1 text-2xs">
                      <span className="font-bold text-gray-700 block">Fases Clínicas Regladas:</span>
                      <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                        {proto.phases.map((ph) => (
                          <li key={ph.id}>
                            <strong>{ph.name}</strong> {ph.durationWeeks ? `(${ph.durationWeeks})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-2xs">
                  <span className="text-gray-400 font-medium">Protocolo EVSoftware 5.9</span>
                  <Link href={`/dashboard/plans/new?protocolId=${proto.id}`}>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50">
                      Aplicar en Plan
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
