'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Info, ShieldCheck } from 'lucide-react'
import {
  computeIngestaTotals,
  defaultMenuSettings,
  evaluateNutrient,
  formatNumber,
  type MenuSettings,
} from '@/lib/menu-config'
import { MenuDataTab, type MenuDataState } from '@/app/dashboard/plans/[id]/menu-info/menu-data-tab'
import { MenuConfigTab } from '@/app/dashboard/plans/[id]/menu-info/menu-config-tab'
import { MenuPatientsTab } from '@/app/dashboard/plans/[id]/menu-info/menu-patients-tab'
import { RequirementsView } from '@/app/dashboard/plans/[id]/menu-info/requirements-view'
import {
  buildCanonicalDays,
  computePanelMetrics,
  ingestasToSettings,
  percentSum,
  type EditorDayMeta,
  type EditorFood,
  type EditorGrid,
  type EditorIngestaMeta,
} from './types'

interface MenuSidePanelProps {
  grid: EditorGrid
  foods: EditorFood[]
  patient: {
    id: string
    name: string
    firstName: string
    allergies: string
    intolerances: string
  } | null
  dayMeta: EditorDayMeta[]
  ingestaMeta: EditorIngestaMeta[]
  targetKcal: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  onIngestaMetaChange: (meta: EditorIngestaMeta[]) => void
  onDayMetaChange: (meta: EditorDayMeta[]) => void
}

const MEAL_TYPE_BY_LABEL: Record<string, string> = {
  Desayuno: 'BREAKFAST',
  'Media mañana': 'MID_MORNING',
  Comida: 'LUNCH',
  Merienda: 'SNACK',
  Cena: 'DINNER',
}

type TabKey = 'data' | 'config' | 'patients'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'data', label: 'Datos menú' },
  { key: 'config', label: 'Configuración' },
  { key: 'patients', label: 'Paciente(s)' },
]

/**
 * Panel lateral "Información del menú" del editor: muestra los requisitos
 * calculados en tiempo real y permite configurar el menú en modo borrador
 * (todavía sin guardar en servidor).
 */
export function MenuSidePanel({
  grid,
  foods,
  patient,
  dayMeta,
  ingestaMeta,
  targetKcal,
  targetProteinG,
  targetCarbsG,
  targetFatG,
  onIngestaMetaChange,
  onDayMetaChange,
}: MenuSidePanelProps) {
  const foodMap = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods])

  const [settings, setSettings] = useState<MenuSettings>(() =>
    defaultMenuSettings({
      targetKcal,
      targetProteinG,
      targetCarbsG,
      targetFatG,
    })
  )
  const [menuData, setMenuData] = useState<MenuDataState>({
    title: 'Menú semanal en construcción',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    internalNotes: '',
    isTemplate: false,
  })
  const [tab, setTab] = useState<TabKey>('data')
  const [selectedDay, setSelectedDay] = useState<number | 'week'>('week')
  const [isOpen, setIsOpen] = useState(true)

  // Los objetivos se sincronizan con la calculadora clínica mientras no se
  // hayan edited a mano.
  useEffect(() => {
    setSettings((current) => ({
      ...current,
      dailyTargets: {
        ...current.dailyTargets,
        kcal: Math.round(targetKcal),
        proteinG: Math.round(targetProteinG),
        carbsG: Math.round(targetCarbsG),
        fatG: Math.round(targetFatG),
      },
    }))
  }, [targetKcal, targetProteinG, targetCarbsG, targetFatG])

  // El reparto por ingestas vive en el editor: se refleja en el panel.
  useEffect(() => {
    setSettings((current) => ingestasToSettings(ingestaMeta, current))
  }, [ingestaMeta])

  const days = useMemo(
    () =>
      buildCanonicalDays(
        grid,
        foodMap,
        dayMeta,
        ingestaMeta.map((ingesta, index) => ({
          type: MEAL_TYPE_BY_LABEL[ingesta.label] || 'SNACK',
          order: index + 1,
        }))
      ),
    [grid, foodMap, dayMeta, ingestaMeta]
  )

  const metrics = useMemo(() => computePanelMetrics(days, settings, dayMeta), [days, settings, dayMeta])

  const currentDay = selectedDay === 'week' ? null : days[selectedDay]
  const totals = selectedDay === 'week' ? metrics.weekAverage : metrics.dayTotals[selectedDay]
  const targets = selectedDay === 'week'
    ? settings.dailyTargets
    : settings.perDayOverrides[String(selectedDay)]
      ? {
          ...settings.dailyTargets,
          ...settings.perDayOverrides[String(selectedDay)],
        }
      : settings.dailyTargets

  const ingestas = useMemo(
    () => (currentDay ? computeIngestaTotals(currentDay.meals, settings) : []),
    [currentDay, settings]
  )

  const kcalEvaluation = evaluateNutrient(totals.kcal, targets.kcal, settings.tolerancePct)
  const dayLabel =
    selectedDay === 'week'
      ? 'Totales de la Semana'
      : `Totales del ${dayMeta[selectedDay]?.name || `Día ${selectedDay + 1}`}`

  const assignments = useMemo(
    () =>
      patient
        ? [
            {
              id: `draft-${patient.id}`,
              patientId: patient.id,
              servings: 1,
              profile: { firstName: patient.firstName },
              patient: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.name.split(' ').slice(-1)[0] || '',
                email: null,
              },
            },
          ]
        : [],
    [patient]
  )

  const conflictsByPatient = useMemo(() => {
    const result: Record<string, string[]> = {}
    if (!patient) return result

    const messages: string[] = []
    for (const day of days) {
      for (const meal of day.meals) {
        for (const item of meal.items) {
          if (!item.food) continue
          const conflict = checkConflict(item.food.name, item.food.category, patient)
          if (conflict && !messages.includes(conflict)) messages.push(conflict)
        }
      }
    }

    result[patient.id] = messages
    return result
  }, [patient, days])

  const percentTotal = percentSum(ingestaMeta)

  return (
    <aside className="w-full shrink-0 xl:w-[400px]">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Resumen fijo arriba */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-white">
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="flex w-full items-center gap-2 text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-black">Información del menú</span>
              <span className="block text-[10px] font-semibold text-white/70">{dayLabel}</span>
            </span>
            <span className="text-right">
              <span className="block font-mono text-lg font-black tabular-nums">
                {formatNumber(totals.kcal, 0)}
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/60">
                kcal del {selectedDay === 'week' ? 'día medio' : 'día'}
              </span>
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-white/60" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/60" />
            )}
          </button>

          {isOpen && (
            <>
              {/* Selector de periodo */}
              <div className="mt-2.5 flex items-center gap-1.5">
                {(['week', ...days.map((day) => day.dayNumber)] as Array<number | 'week'>).map(
                  (option) => {
                    const active = selectedDay === option
                    const label =
                      option === 'week'
                        ? 'Sem'
                        : (dayMeta[(option as number) - 1]?.name || `Día ${option}`).slice(0, 1)

                    return (
                      <button
                        key={String(option)}
                        type="button"
                        onClick={() => setSelectedDay(option)}
                        className={`h-7 w-7 rounded-lg border text-[11px] font-black transition-colors ${
                          active
                            ? 'border-white bg-white text-slate-900'
                            : 'border-white/25 bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                        aria-label={option === 'week' ? 'Vista semanal' : `Día ${option}`}
                      >
                        {label}
                      </button>
                    )
                  }
                )}

                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-black ${
                    Math.abs(percentTotal - 100) < 0.05
                      ? 'bg-emerald-400/20 text-emerald-200'
                      : 'bg-amber-400/20 text-amber-200'
                  }`}
                  title="El reparto por ingestas debe sumar 100 %"
                >
                  Reparto ingestas {formatNumber(percentTotal, 1)}%
                </span>
              </div>

              {/* Pestañas */}
              <div className="mt-2 flex items-center gap-1">
                {TABS.map((item) => {
                  const active = tab === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTab(item.key)}
                      className={`-mb-px border-b-2 px-2.5 py-1.5 text-[11px] font-black transition-colors ${
                        active
                          ? 'border-white text-white'
                          : 'border-transparent text-white/60 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {isOpen && (
          <div className="max-h-[calc(100vh-340px)] space-y-5 overflow-y-auto p-4">
            {tab === 'data' && (
              <MenuDataTab
                data={menuData}
                internalCode="BORRADOR"
                onChange={(patch) => setMenuData((current) => ({ ...current, ...patch }))}
                versions={[]}
                onRestoreVersion={() => undefined}
                onDuplicate={() => undefined}
                canUndo={false}
                canRedo={false}
                onUndo={() => undefined}
                onRedo={() => undefined}
                saveLabel="Borrador local (se guarda al publicar)"
                isSaving={false}
              />
            )}

            {tab === 'config' && (
              <MenuConfigTab
                settings={settings}
                onChange={setSettings}
                patientProfile={
                  patient
                    ? { weightKg: null, heightCm: null, age: null, sex: null }
                    : null
                }
                onAutoCalculate={(result) =>
                  setSettings((current) => ({
                    ...current,
                    dailyTargets: {
                      ...current.dailyTargets,
                      kcal: result.kcal,
                      proteinG: result.proteinG,
                    },
                  }))
                }
              />
            )}

            {tab === 'patients' && (
              <MenuPatientsTab
                patients={
                  patient
                    ? [
                        {
                          id: patient.id,
                          firstName: patient.firstName,
                          lastName: patient.name.split(' ').slice(-1)[0] || '',
                          email: null,
                          weightKg: null,
                          heightCm: null,
                          birthDate: null,
                          sex: null,
                          objective: null,
                          allergies: '',
                          intolerances: '',
                          dietaryPreferences: '',
                          foodAversions: '',
                          activityLevel: null,
                        },
                      ]
                    : []
                }
                assignments={assignments}
                allergenPolicy={settings.allergenPolicy}
                onPolicyChange={(policy) => setSettings((current) => ({ ...current, allergenPolicy: policy }))}
                onAssign={() => undefined}
                onRemove={() => undefined}
                onServingsChange={() => undefined}
                onReimport={() => undefined}
                conflictsByPatient={conflictsByPatient}
              />
            )}

            <div className="border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {dayLabel}
                </span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black ${
                    kcalEvaluation.status === 'green'
                      ? 'bg-emerald-50 text-emerald-700'
                      : kcalEvaluation.status === 'yellow'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {kcalEvaluation.message}
                </span>
              </div>

              <RequirementsView
                mode={selectedDay === 'week' ? 'week' : 'day'}
                dayLabel={selectedDay === 'week' ? 'la semana' : dayMeta[selectedDay]?.name || 'el día'}
                totals={totals}
                targets={targets}
                settings={settings}
                ingestas={ingestas}
                weekPoints={metrics.weekPoints}
                allergenTerms={[]}
                conflictMessages={Object.values(conflictsByPatient).flat()}
                preferenceWarnings={[]}
              />

              <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-[10px] font-semibold text-blue-900">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Los objetivos se guardan con la pauta al pulsar «Guardar menú». Si la fibra no tiene
                objetivo, aparece como «sin objetivo» y sin barra.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

/** Comprobación local de alérgenos para el paciente del editor. */
function checkConflict(
  foodName: string,
  category: string | null,
  patient: { allergies: string; intolerances: string }
) {
  const terms = `${patient.allergies} ${patient.intolerances}`
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)

  const haystack = `${foodName} ${category || ''}`.toLowerCase()
  const match = terms.find((term) => haystack.includes(term))
  if (!match) return null
  return `«${foodName}» contiene ${match}, registrado en la ficha del paciente.`
}
