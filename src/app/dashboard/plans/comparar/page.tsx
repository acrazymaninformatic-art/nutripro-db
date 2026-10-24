import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarRange,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { getMealPlan, getMealPlans } from '../actions'
import { analyzeWeeklyPlan, type PlanMealAnalysisInput } from '@/lib/clinical/plan-analysis'
import { expandMealItem } from '@/lib/nutrition/plan-nutrition'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

interface ComparePageProps {
  searchParams?: Promise<{ a?: string; b?: string }>
}

function buildAnalysis(plan: Awaited<ReturnType<typeof getMealPlan>>): PlanMealAnalysisInput[] {
  if (!plan) return []

  return plan.days.map((day) => ({
    dayNumber: day.dayNumber,
    mealType: 'DIARIO',
    items: day.meals.flatMap((meal) =>
      meal.items
        .filter((item) => !item.isAlternative)
        .flatMap((item) =>
          expandMealItem(item).map((expanded) => ({
            name: expanded.food.name,
            category: expanded.food.category ?? null,
            quantityG: expanded.quantityG,
            // `analyzeWeeklyPlan` espera valores por 100 g y aplica la escala.
            calories: expanded.food.calories,
            proteinG: expanded.food.proteinG,
            carbsG: expanded.food.carbsG,
            fatG: expanded.food.fatG,
            fiberG: expanded.food.fiberG || 0,
            sodiumMg: expanded.food.sodiumMg || 0,
            potassiumMg: expanded.food.potassiumMg || 0,
            calciumMg: expanded.food.calciumMg || 0,
            ironMg: expanded.food.ironMg || 0,
            magnesiumMg: expanded.food.magnesiumMg || 0,
            zincMg: expanded.food.zincMg || 0,
            vitaminCMg: expanded.food.vitaminCMg || 0,
            folateUg: expanded.food.folateUg || 0,
            novaGroup: expanded.food.novaGroup,
            pricePerKg: expanded.food.pricePerKg,
          }))
        )
    ),
  }))
}

function Diff({
  label,
  valueA,
  valueB,
  unit,
  decimals = 0,
  lowerIsBetter = false,
}: {
  label: string
  valueA: number
  valueB: number
  unit: string
  decimals?: number
  lowerIsBetter?: boolean
}) {
  const delta = valueB - valueA
  const better = lowerIsBetter ? delta < 0 : delta > 0
  const neutral = Math.abs(delta) < 0.05

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 text-xs font-semibold text-slate-600">{label}</td>
      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-800 tabular-nums">
        {valueA.toFixed(decimals)} {unit}
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-800 tabular-nums">
        {valueB.toFixed(decimals)} {unit}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            neutral
              ? 'bg-slate-100 text-slate-600'
              : better
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
          }`}
        >
          {neutral ? (
            'Sin cambios'
          ) : (
            <>
              {delta > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {delta > 0 ? '+' : ''}
              {delta.toFixed(decimals)} {unit}
            </>
          )}
        </span>
      </td>
    </tr>
  )
}

export default async function ComparePlansPage({ searchParams }: ComparePageProps) {
  const params = (await searchParams) || {}
  const plans = await getMealPlans()

  const planAId = params.a || ''
  const planBId = params.b || ''

  const [planA, planB] = await Promise.all([
    planAId ? getMealPlan(planAId) : Promise.resolve(null),
    planBId ? getMealPlan(planBId) : Promise.resolve(null),
  ])

  if (planAId && !planA) notFound()
  if (planBId && !planB) notFound()

  const analysisA = planA ? analyzeWeeklyPlan(buildAnalysis(planA)) : null
  const analysisB = planB ? analyzeWeeklyPlan(buildAnalysis(planB)) : null

  const options = plans.map((plan) => ({
    id: plan.id,
    label: `${plan.name} · ${plan.patient.firstName} ${plan.patient.lastName}`,
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a Planes
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Comparador de Planes Nutricionales
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Compara dos pautas (antes / después) en calorías, macros, micronutrientes y calidad
            de la dieta.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Selecciona las dos pautas</CardTitle>
          <CardDescription className="text-xs">
            Elige el plan anterior y el actual para ver la diferencia real.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Plan A (anterior)
              </label>
              <select
                name="a"
                defaultValue={planAId}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                <option value="">— Selecciona —</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden pb-2 text-slate-300 sm:block">
              <ArrowRight className="h-5 w-5" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Plan B (actual)
              </label>
              <select
                name="b"
                defaultValue={planBId}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                <option value="">— Selecciona —</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
            >
              Comparar
            </Button>
          </form>
        </CardContent>
      </Card>

      {analysisA && analysisB && planA && planB ? (
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Plan A</p>
                <p className="text-sm font-black text-slate-900">{planA.name}</p>
                <p className="text-[11px] text-slate-500">
                  {planA.patient.firstName} {planA.patient.lastName} ·{' '}
                  {new Date(planA.startDate).toLocaleDateString('es-ES')}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Plan B</p>
                <p className="text-sm font-black text-slate-900">{planB.name}</p>
                <p className="text-[11px] text-slate-500">
                  {planB.patient.firstName} {planB.patient.lastName} ·{' '}
                  {new Date(planB.startDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Indicador</th>
                    <th className="px-4 py-3 text-right">Plan A</th>
                    <th className="px-4 py-3 text-right">Plan B</th>
                    <th className="px-4 py-3 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  <Diff
                    label="Días de pauta"
                    valueA={analysisA.daysCount}
                    valueB={analysisB.daysCount}
                    unit="días"
                  />
                  <Diff
                    label="Energía media"
                    valueA={analysisA.averageDailyKcal}
                    valueB={analysisB.averageDailyKcal}
                    unit="kcal"
                  />
                  <Diff
                    label="Proteína media"
                    valueA={analysisA.averageDailyProteinG}
                    valueB={analysisB.averageDailyProteinG}
                    unit="g"
                    decimals={1}
                  />
                  <Diff
                    label="Carbohidratos medios"
                    valueA={analysisA.averageDailyCarbsG}
                    valueB={analysisB.averageDailyCarbsG}
                    unit="g"
                    decimals={1}
                  />
                  <Diff
                    label="Grasa media"
                    valueA={analysisA.averageDailyFatG}
                    valueB={analysisB.averageDailyFatG}
                    unit="g"
                    decimals={1}
                    lowerIsBetter
                  />
                  <Diff
                    label="Fibra media"
                    valueA={analysisA.averageDailyFiberG}
                    valueB={analysisB.averageDailyFiberG}
                    unit="g"
                    decimals={1}
                  />
                  <Diff
                    label="Raciones de verdura"
                    valueA={analysisA.dailyVegServingsAvg}
                    valueB={analysisB.dailyVegServingsAvg}
                    unit="raciones"
                    decimals={1}
                  />
                  <Diff
                    label="Raciones de fruta"
                    valueA={analysisA.dailyFruitServingsAvg}
                    valueB={analysisB.dailyFruitServingsAvg}
                    unit="raciones"
                    decimals={1}
                  />
                  <Diff
                    label="Calcio (cobertura VRA)"
                    valueA={analysisA.driCoverage.calcium.pct}
                    valueB={analysisB.driCoverage.calcium.pct}
                    unit="%"
                  />
                  <Diff
                    label="Hierro (cobertura VRA)"
                    valueA={analysisA.driCoverage.iron.pct}
                    valueB={analysisB.driCoverage.iron.pct}
                    unit="%"
                  />
                  <Diff
                    label="Magnesio (cobertura VRA)"
                    valueA={analysisA.driCoverage.magnesium.pct}
                    valueB={analysisB.driCoverage.magnesium.pct}
                    unit="%"
                  />
                  <Diff
                    label="Zinc (cobertura VRA)"
                    valueA={analysisA.driCoverage.zinc.pct}
                    valueB={analysisB.driCoverage.zinc.pct}
                    unit="%"
                  />
                  <Diff
                    label="Potasio (cobertura VRA)"
                    valueA={analysisA.driCoverage.potassium.pct}
                    valueB={analysisB.driCoverage.potassium.pct}
                    unit="%"
                  />
                  <Diff
                    label="Vitamina C (cobertura VRA)"
                    valueA={analysisA.driCoverage.vitaminC.pct}
                    valueB={analysisB.driCoverage.vitaminC.pct}
                    unit="%"
                  />
                  <Diff
                    label="Folatos (cobertura VRA)"
                    valueA={analysisA.driCoverage.folate.pct}
                    valueB={analysisB.driCoverage.folate.pct}
                    unit="%"
                  />
                  <Diff
                    label="Ultraprocesados (NOVA 4)"
                    valueA={analysisA.nova4KcalPercentage}
                    valueB={analysisB.nova4KcalPercentage}
                    unit="% kcal"
                    lowerIsBetter
                  />
                  <Diff
                    label="Puntuación MEDAS (0-14)"
                    valueA={analysisA.medasScore}
                    valueB={analysisB.medasScore}
                    unit="pts"
                  />
                  <Diff
                    label="Coste semanal estimado"
                    valueA={analysisA.estimatedWeeklyCostEur}
                    valueB={analysisB.estimatedWeeklyCostEur}
                    unit="€"
                    decimals={2}
                    lowerIsBetter
                  />
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Calidad del plan A
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  MEDAS {analysisA.medasLevel} · Ultraprocesados{' '}
                  {analysisA.nova4KcalPercentage.toFixed(0)} % kcal
                </p>
                <ul className="mt-2 space-y-1">
                  {analysisA.medasFeedback.slice(0, 3).map((item) => (
                    <li key={item} className="text-[11px] text-slate-500">
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                  Calidad del plan B
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  MEDAS {analysisB.medasLevel} · Ultraprocesados{' '}
                  {analysisB.nova4KcalPercentage.toFixed(0)} % kcal
                </p>
                <ul className="mt-2 space-y-1">
                  {analysisB.medasFeedback.slice(0, 3).map((item) => (
                    <li key={item} className="text-[11px] text-slate-500">
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
          <Scale className="mx-auto mb-3 h-9 w-9 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">Selecciona dos planes para comparar</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Verás la diferencia de calorías, macros, micronutrientes, ultraprocesados, adherencia
            mediterránea y coste semanal. Sirve para justificar el cambio de pauta en la consulta.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
              <CalendarRange className="h-3.5 w-3.5" /> Antes / después
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
              <Users className="h-3.5 w-3.5" /> Evidencia objetiva
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5" /> Informe para el paciente
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
