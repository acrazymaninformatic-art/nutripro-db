'use client'

import { useState, useMemo } from 'react'
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
} from 'lucide-react'

export function ClinicalCalculator() {
  // Inputs
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>('FEMALE')
  const [age, setAge] = useState<number>(34)
  const [weightKg, setWeightKg] = useState<number>(68)
  const [heightCm, setHeightCm] = useState<number>(165)
  const [bodyFatPct, setBodyFatPct] = useState<number>(26)
  const [activityFactor, setActivityFactor] = useState<number>(1.55) // PAL
  const [goalAdjustment, setGoalAdjustment] = useState<number>(-15) // % deficit/surplus
  const [selectedBmrFormula, setSelectedBmrFormula] = useState<'mifflin' | 'harris' | 'katch' | 'cunningham'>('mifflin')

  // Macro mode: 'g_kg' or 'percentages'
  const [macroMode, setMacroMode] = useState<'g_kg' | 'percentages'>('g_kg')
  const [proteinGPerKg, setProteinGPerKg] = useState<number>(1.8)
  const [fatGPerKg, setFatGPerKg] = useState<number>(0.9)

  const [proteinPct, setProteinPct] = useState<number>(30)
  const [fatPct, setFatPct] = useState<number>(25)
  const [carbsPct, setCarbsPct] = useState<number>(45)

  // Calculations
  const calculations = useMemo(() => {
    const w = Math.max(30, weightKg)
    const h = Math.max(100, heightCm)
    const a = Math.max(10, age)
    const bf = Math.max(3, Math.min(60, bodyFatPct))

    // Lean Body Mass (LBM) in kg
    const fatMassKg = Math.round((w * (bf / 100)) * 10) / 10
    const leanMassKg = Math.round((w - fatMassKg) * 10) / 10

    // 1. BMR Formulas
    // Mifflin-St Jeor (1990)
    const bmrMifflin = sex === 'MALE'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161

    // Harris-Benedict revisada (1984)
    const bmrHarris = sex === 'MALE'
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a

    // Katch-McArdle (1996)
    const bmrKatch = 370 + 21.6 * leanMassKg

    // Cunningham (1980)
    const bmrCunningham = 500 + 22 * leanMassKg

    // Selected BMR
    let chosenBmr = bmrMifflin
    if (selectedBmrFormula === 'harris') chosenBmr = bmrHarris
    if (selectedBmrFormula === 'katch') chosenBmr = bmrKatch
    if (selectedBmrFormula === 'cunningham') chosenBmr = bmrCunningham

    // 2. TDEE (Gasto Energético Total)
    const tdee = Math.round(chosenBmr * activityFactor)

    // 3. Target Calories with clinical adjustment
    const targetKcal = Math.round(tdee * (1 + goalAdjustment / 100))

    // 4. Macronutrients
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

    // 5. BMI & Health Metrics
    const heightM = h / 100
    const bmi = Math.round((w / (heightM * heightM)) * 10) / 10

    let bmiCategory = 'Normopeso'
    let bmiColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (bmi < 18.5) {
      bmiCategory = 'Bajo peso'
      bmiColor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = 'Sobrepeso'
      bmiColor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (bmi >= 30 && bmi < 35) {
      bmiCategory = 'Obesidad Grado I'
      bmiColor = 'text-rose-700 bg-rose-50 border-rose-200'
    } else if (bmi >= 35) {
      bmiCategory = 'Obesidad Grado II/III'
      bmiColor = 'text-red-700 bg-red-50 border-red-200'
    }

    const minHealthyWeight = Math.round(18.5 * heightM * heightM * 10) / 10
    const maxHealthyWeight = Math.round(24.9 * heightM * heightM * 10) / 10

    // Ideal Weights
    // Lorentz
    const lorentz = sex === 'MALE'
      ? h - 100 - (h - 150) / 4
      : h - 100 - (h - 150) / 2

    // Devine
    const devine = sex === 'MALE'
      ? 50 + 2.3 * ((h / 2.54) - 60)
      : 45.5 + 2.3 * ((h / 2.54) - 60)

    // Robinson
    const robinson = sex === 'MALE'
      ? 52 + 1.9 * ((h / 2.54) - 60)
      : 49 + 1.7 * ((h / 2.54) - 60)

    // Hydration (ml/day)
    const dailyWaterMl = Math.round(w * 35)

    // Total Body Water (Watson)
    const tbwLiters = sex === 'MALE'
      ? 2.447 - 0.09156 * a + 0.1074 * h + 0.3362 * w
      : -2.097 + 0.1069 * h + 0.2466 * w

    return {
      bmrMifflin: Math.round(bmrMifflin),
      bmrHarris: Math.round(bmrHarris),
      bmrKatch: Math.round(bmrKatch),
      bmrCunningham: Math.round(bmrCunningham),
      chosenBmr: Math.round(chosenBmr),
      tdee,
      targetKcal,
      protG,
      fatG,
      carbsG,
      protKcal,
      fatKcal,
      carbsKcal,
      pRatio,
      cRatio,
      fRatio,
      fatMassKg,
      leanMassKg,
      bmi,
      bmiCategory,
      bmiColor,
      minHealthyWeight,
      maxHealthyWeight,
      lorentz: Math.round(lorentz * 10) / 10,
      devine: Math.round(devine * 10) / 10,
      robinson: Math.round(robinson * 10) / 10,
      dailyWaterMl,
      tbwLiters: Math.round(tbwLiters * 10) / 10,
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
    macroMode,
    proteinGPerKg,
    fatGPerKg,
    proteinPct,
    fatPct,
    carbsPct,
  ])

  return (
    <div className="space-y-6">
      {/* Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-blue-600" />
            <span>Calculadora Nutricional & Metabólica Avanzada</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Estimación de TMB con 4 fórmulas clínicas (Mifflin, Harris-Benedict, Katch, Cunningham), TDEE y reparto de macronutrientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-2xl border-gray-200 text-xs font-bold hover:bg-gray-100"
          >
            <Printer className="h-4 w-4 mr-1.5 text-gray-500" />
            Imprimir Informe
          </Button>

          <Link href={`/dashboard/plans/new?targetKcal=${calculations.targetKcal}&proteinG=${calculations.protG}&carbsG=${calculations.carbsG}&fatG=${calculations.fatG}`}>
            <Button
              size="sm"
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              Crear Plan con estos Macros
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Input Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="rounded-3xl border-gray-200 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>Parámetros Biométricos del Paciente</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              {/* Sex selector */}
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

              {/* Age & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ageInput">Edad (años)</Label>
                  <Input
                    id="ageInput"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value) || 20)}
                    className="rounded-2xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heightInput">Altura (cm)</Label>
                  <Input
                    id="heightInput"
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value) || 160)}
                    className="rounded-2xl font-bold"
                  />
                </div>
              </div>

              {/* Weight & Body Fat % */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="weightInput">Peso Actual (kg)</Label>
                  <Input
                    id="weightInput"
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 60)}
                    className="rounded-2xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bfInput">% Grasa Corporal</Label>
                  <Input
                    id="bfInput"
                    type="number"
                    step="0.5"
                    value={bodyFatPct}
                    onChange={(e) => setBodyFatPct(Number(e.target.value) || 20)}
                    className="rounded-2xl font-bold"
                  />
                </div>
              </div>

              {/* Physical Activity PAL */}
              <div className="space-y-1.5">
                <Label htmlFor="palSelect">Factor de Actividad Física (PAL)</Label>
                <Select
                  id="palSelect"
                  value={activityFactor.toString()}
                  onChange={(e) => setActivityFactor(Number(e.target.value))}
                  className="rounded-2xl font-medium"
                >
                  <option value="1.2">Sedentario (Trabajo de oficina, poco o nulo ejercicio) — 1.20</option>
                  <option value="1.375">Actividad Ligera (Ejercicio 1-3 días/semana) — 1.375</option>
                  <option value="1.55">Moderada (Ejercicio 3-5 días/semana) — 1.55</option>
                  <option value="1.725">Intensa (Entrenamiento exigente 6-7 días/semana) — 1.725</option>
                  <option value="1.9">Muy Intensa / Atleta de Élite (Doble sesión diaria) — 1.90</option>
                </Select>
              </div>

              {/* Goal Adjustment */}
              <div className="space-y-1.5">
                <Label htmlFor="goalSelect">Objetivo Clínico / Balance Energético</Label>
                <Select
                  id="goalSelect"
                  value={goalAdjustment.toString()}
                  onChange={(e) => setGoalAdjustment(Number(e.target.value))}
                  className="rounded-2xl font-semibold"
                >
                  <option value="-25">Déficit Agresivo (-25% kcal) — Pérdida rápida</option>
                  <option value="-20">Déficit Fuerte (-20% kcal) — Grasa persistente</option>
                  <option value="-15">Déficit Moderado (-15% kcal) — Sostenible / Clínico</option>
                  <option value="-10">Déficit Suave (-10% kcal) — Preservación muscular</option>
                  <option value="0">Mantenimiento Normocalórico (0%) — Estabilidad</option>
                  <option value="10">Superávit Limpio (+10% kcal) — Masa magra</option>
                  <option value="15">Superávit Estándar (+15% kcal) — Hipertrofia</option>
                  <option value="20">Superávit Intenso (+20% kcal) — Ganancia de peso</option>
                </Select>
              </div>

              {/* BMR Formula Selector */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="bmrFormulaSelect">Fórmula Científica de TMB Preferida</Label>
                <Select
                  id="bmrFormulaSelect"
                  value={selectedBmrFormula}
                  onChange={(e) => setSelectedBmrFormula(e.target.value as any)}
                  className="rounded-2xl font-semibold text-blue-900"
                >
                  <option value="mifflin">Mifflin-St Jeor (Gold standard clínico recomendado)</option>
                  <option value="harris">Harris-Benedict Revisada (1984)</option>
                  <option value="katch">Katch-McArdle (Basada en Masa Libre de Grasa)</option>
                  <option value="cunningham">Cunningham (Específica para atletas y deportistas)</option>
                </Select>
              </div>

              {/* Macro Configuration Switch */}
              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Estrategia de Macronutrientes</Label>
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl text-3xs font-bold">
                    <button
                      type="button"
                      onClick={() => setMacroMode('g_kg')}
                      className={`px-2 py-1 rounded-lg ${macroMode === 'g_kg' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-500'}`}
                    >
                      Por g / kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setMacroMode('percentages')}
                      className={`px-2 py-1 rounded-lg ${macroMode === 'percentages' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-500'}`}
                    >
                      Porcentajes %
                    </button>
                  </div>
                </div>

                {macroMode === 'g_kg' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-3xs font-bold text-blue-700 uppercase">Proteína (g/kg)</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={proteinGPerKg}
                        onChange={(e) => setProteinGPerKg(Number(e.target.value) || 1.6)}
                        className="rounded-2xl font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-3xs font-bold text-rose-700 uppercase">Grasas (g/kg)</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={fatGPerKg}
                        onChange={(e) => setFatGPerKg(Number(e.target.value) || 0.8)}
                        className="rounded-2xl font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <span className="text-3xs font-bold text-blue-700 uppercase">% Prot</span>
                      <Input
                        type="number"
                        value={proteinPct}
                        onChange={(e) => setProteinPct(Number(e.target.value) || 30)}
                        className="rounded-2xl font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-3xs font-bold text-amber-700 uppercase">% Carbs</span>
                      <Input
                        type="number"
                        value={carbsPct}
                        onChange={(e) => setCarbsPct(Number(e.target.value) || 45)}
                        className="rounded-2xl font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-3xs font-bold text-rose-700 uppercase">% Grasas</span>
                      <Input
                        type="number"
                        value={fatPct}
                        onChange={(e) => setFatPct(Number(e.target.value) || 25)}
                        className="rounded-2xl font-bold text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results Dashboard (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Hero Target Kcal Card */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-300" />
                  Prescripción Calórica Objetivo
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">{calculations.targetKcal}</span>
                  <span className="text-lg text-blue-200 font-bold">kcal / día</span>
                </div>
                <p className="text-xs text-blue-100/90 mt-1 font-medium">
                  {goalAdjustment < 0 ? (
                    <span className="flex items-center gap-1 text-amber-200">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Déficit calórico de {Math.abs(goalAdjustment)}% respecto a su mantenimiento ({calculations.tdee} kcal)
                    </span>
                  ) : goalAdjustment > 0 ? (
                    <span className="flex items-center gap-1 text-emerald-200">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Superávit calórico de +{goalAdjustment}% sobre su mantenimiento ({calculations.tdee} kcal)
                    </span>
                  ) : (
                    'Mantenimiento calórico exacto'
                  )}
                </p>
              </div>

              {/* TMB vs GET pills */}
              <div className="space-y-2 bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-xs min-w-[200px]">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-200 font-medium">TMB (Basal):</span>
                  <span className="font-extrabold text-white">{calculations.chosenBmr} kcal</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-200 font-medium">GET (TDEE):</span>
                  <span className="font-extrabold text-white">{calculations.tdee} kcal</span>
                </div>
                <div className="flex justify-between text-xs border-t border-white/15 pt-1.5">
                  <span className="text-blue-200 font-medium">Agua mínima:</span>
                  <span className="font-extrabold text-white">{calculations.dailyWaterMl} ml</span>
                </div>
              </div>
            </div>
          </div>

          {/* Macro Split Card */}
          <Card className="rounded-3xl border-gray-200 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center justify-between">
                <span>Distribución Prescrita de Macronutrientes</span>
                <span className="text-xs font-normal text-gray-500">
                  {macroMode === 'g_kg' ? `${proteinGPerKg}g P/kg • ${fatGPerKg}g G/kg` : 'Modo Porcentual'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Proteína</span>
                  <span className="text-2xl font-black text-blue-950 block">{calculations.protG}g</span>
                  <span className="text-3xs text-blue-600 font-semibold">{calculations.protKcal} kcal ({calculations.pRatio}%)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Carbohidratos</span>
                  <span className="text-2xl font-black text-amber-950 block">{calculations.carbsG}g</span>
                  <span className="text-3xs text-amber-600 font-semibold">{calculations.carbsKcal} kcal ({calculations.cRatio}%)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">Grasas</span>
                  <span className="text-2xl font-black text-rose-950 block">{calculations.fatG}g</span>
                  <span className="text-3xs text-rose-600 font-semibold">{calculations.fatKcal} kcal ({calculations.fRatio}%)</span>
                </div>
              </div>

              {/* Visual distribution bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-2xs">
                  <div style={{ width: `${calculations.pRatio}%` }} className="bg-blue-600 h-full" title={`Proteína: ${calculations.pRatio}%`} />
                  <div style={{ width: `${calculations.cRatio}%` }} className="bg-amber-500 h-full" title={`Carbohidratos: ${calculations.cRatio}%`} />
                  <div style={{ width: `${calculations.fRatio}%` }} className="bg-rose-500 h-full" title={`Grasas: ${calculations.fRatio}%`} />
                </div>
                <div className="flex justify-between text-2xs font-bold px-1 text-gray-500">
                  <span className="text-blue-700">{calculations.pRatio}% Proteínas</span>
                  <span className="text-amber-700">{calculations.cRatio}% Carbohidratos</span>
                  <span className="text-rose-700">{calculations.fRatio}% Grasas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scientific Comparison of BMR Formulas */}
          <Card className="rounded-3xl border-gray-200 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Comparativa de Fórmulas Metabólicas Científicas</span>
              </CardTitle>
              <CardDescription className="text-2xs">
                Valores de metabolismo basal calculados simultáneamente según la literatura clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-3xs border-b">
                  <tr>
                    <th className="px-5 py-3">Fórmula Clínica</th>
                    <th className="px-5 py-3">Metodología</th>
                    <th className="px-5 py-3 text-right">TMB</th>
                    <th className="px-5 py-3 text-right">TDEE (PAL {activityFactor})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr className={selectedBmrFormula === 'mifflin' ? 'bg-blue-50/60 font-bold text-blue-950' : ''}>
                    <td className="px-5 py-3 font-semibold">Mifflin-St Jeor (1990)</td>
                    <td className="px-5 py-3 text-gray-500 text-2xs">Peso, Altura, Edad, Sexo (Recomendada)</td>
                    <td className="px-5 py-3 text-right font-black">{calculations.bmrMifflin} kcal</td>
                    <td className="px-5 py-3 text-right">{Math.round(calculations.bmrMifflin * activityFactor)} kcal</td>
                  </tr>
                  <tr className={selectedBmrFormula === 'harris' ? 'bg-blue-50/60 font-bold text-blue-950' : ''}>
                    <td className="px-5 py-3 font-semibold">Harris-Benedict (1984)</td>
                    <td className="px-5 py-3 text-gray-500 text-2xs">Ecuación clásica revisada Roza & Shizgal</td>
                    <td className="px-5 py-3 text-right font-black">{calculations.bmrHarris} kcal</td>
                    <td className="px-5 py-3 text-right">{Math.round(calculations.bmrHarris * activityFactor)} kcal</td>
                  </tr>
                  <tr className={selectedBmrFormula === 'katch' ? 'bg-blue-50/60 font-bold text-blue-950' : ''}>
                    <td className="px-5 py-3 font-semibold">Katch-McArdle (1996)</td>
                    <td className="px-5 py-3 text-gray-500 text-2xs">Masa Magra ({calculations.leanMassKg} kg LBM)</td>
                    <td className="px-5 py-3 text-right font-black">{calculations.bmrKatch} kcal</td>
                    <td className="px-5 py-3 text-right">{Math.round(calculations.bmrKatch * activityFactor)} kcal</td>
                  </tr>
                  <tr className={selectedBmrFormula === 'cunningham' ? 'bg-blue-50/60 font-bold text-blue-950' : ''}>
                    <td className="px-5 py-3 font-semibold">Cunningham (1980)</td>
                    <td className="px-5 py-3 text-gray-500 text-2xs">Atletas con alta masa muscular</td>
                    <td className="px-5 py-3 text-right font-black">{calculations.bmrCunningham} kcal</td>
                    <td className="px-5 py-3 text-right">{Math.round(calculations.bmrCunningham * activityFactor)} kcal</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Clinical Anthropometry & Health Indices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* IMC Card */}
            <Card className="rounded-3xl border-gray-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-extrabold text-gray-500 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span>Índice de Masa Corporal (IMC)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-gray-900">{calculations.bmi}</span>
                  <Badge variant="outline" className={`font-bold text-xs rounded-full ${calculations.bmiColor}`}>
                    {calculations.bmiCategory}
                  </Badge>
                </div>
                <div className="text-2xs text-gray-500 border-t pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Rango saludable (18.5 - 24.9):</span>
                    <span className="font-bold text-gray-800">{calculations.minHealthyWeight} - {calculations.maxHealthyWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Masa grasa ({bodyFatPct}%):</span>
                    <span className="font-bold text-rose-700">{calculations.fatMassKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Masa libre de grasa (LBM):</span>
                    <span className="font-bold text-blue-700">{calculations.leanMassKg} kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ideal Weights & Water Card */}
            <Card className="rounded-3xl border-gray-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-extrabold text-gray-500 flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-sky-600" />
                  <span>Peso Teórico & Hidratación</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">Fórmula Lorentz:</span>
                  <span className="font-bold text-gray-900">{calculations.lorentz} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">Fórmula Devine:</span>
                  <span className="font-bold text-gray-900">{calculations.devine} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">Agua Corporal Total (Watson):</span>
                  <span className="font-bold text-sky-800">{calculations.tbwLiters} L</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Ingesta hídrica recomendada:</span>
                  <span className="font-bold text-sky-700">{calculations.dailyWaterMl} ml/día</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
