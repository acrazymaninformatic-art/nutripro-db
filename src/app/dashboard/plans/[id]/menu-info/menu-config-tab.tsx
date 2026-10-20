'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calculator,
  Equal,
  EyeOff,
  Flame,
  Percent,
  Scale,
  Utensils,
} from 'lucide-react'
import {
  FORMULA_LABELS,
  TARGET_UNIT_LABELS,
  WEEKDAY_LABELS,
  autoCalculateTargets,
  distributeIngestasEvenly,
  formatNumber,
  ingestasPercentSum,
  moveIngesta,
  type MenuAutoCalc,
  type MenuSettings,
  type TargetUnit,
} from '@/lib/menu-config'

interface MenuConfigTabProps {
  settings: MenuSettings
  onChange: (settings: MenuSettings) => void
  patientProfile: {
    weightKg: number | null
    heightCm: number | null
    age: number | null
    sex: string | null
  } | null
  onAutoCalculate: (result: {
    kcal: number
    proteinG: number
    note: string
    bmr: number
    tdee: number
  }) => void
}

const fieldClass =
  'h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentario' },
  { value: 'light', label: 'Ligero' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'active', label: 'Activo' },
  { value: 'very_active', label: 'Muy activo' },
]

export function MenuConfigTab({
  settings,
  onChange,
  patientProfile,
  onAutoCalculate,
}: MenuConfigTabProps) {
  const percentSum = useMemo(() => ingestasPercentSum(settings), [settings])
  const percentIsValid = Math.abs(percentSum - 100) < 0.05
  const weightKg = patientProfile?.weightKg || 65

  const update = (patch: Partial<MenuSettings>) => onChange({ ...settings, ...patch })

  const updateTargets = (patch: Partial<MenuSettings['dailyTargets']>) =>
    update({ dailyTargets: { ...settings.dailyTargets, ...patch } })

  const updateAutoCalc = (patch: Partial<MenuAutoCalc>) =>
    update({ autoCalc: { ...settings.autoCalc, ...patch } })

  const updateIngesta = (mealType: string, patch: Partial<MenuSettings['ingestas'][number]>) =>
    update({
      ingestas: settings.ingestas.map((ingesta) =>
        ingesta.mealType === mealType ? { ...ingesta, ...patch } : ingesta
      ),
    })

  /* ---------------------------------------------------------------- */
  /* Objetivos en la unidad seleccionada                                */
  /* ---------------------------------------------------------------- */

  const macroFields: Array<{
    key: 'proteinG' | 'carbsG' | 'fatG'
    label: string
    kcalPerGram: number
  }> = [
    { key: 'proteinG', label: 'Proteína', kcalPerGram: 4 },
    { key: 'carbsG', label: 'HC', kcalPerGram: 4 },
    { key: 'fatG', label: 'Grasa', kcalPerGram: 9 },
  ]

  const displayedValue = (key: 'proteinG' | 'carbsG' | 'fatG') => {
    const grams = settings.dailyTargets[key]
    if (settings.targetUnit === 'PERCENT_KCAL') {
      const macro = macroFields.find((item) => item.key === key)!
      const kcalFromMacro = grams * macro.kcalPerGram
      return settings.dailyTargets.kcal > 0 ? (kcalFromMacro / settings.dailyTargets.kcal) * 100 : 0
    }
    if (settings.targetUnit === 'PER_KG') return grams / weightKg
    return grams
  }

  const applyDisplayedValue = (key: 'proteinG' | 'carbsG' | 'fatG', rawValue: number) => {
    if (!Number.isFinite(rawValue)) return
    if (settings.targetUnit === 'PERCENT_KCAL') {
      const macro = macroFields.find((item) => item.key === key)!
      const kcal = (rawValue / 100) * settings.dailyTargets.kcal
      updateTargets({ [key]: Math.round(kcal / macro.kcalPerGram) } as Partial<MenuSettings['dailyTargets']>)
      return
    }
    if (settings.targetUnit === 'PER_KG') {
      updateTargets({ [key]: Math.round(rawValue * weightKg) } as Partial<MenuSettings['dailyTargets']>)
      return
    }
    updateTargets({ [key]: Math.round(rawValue) } as Partial<MenuSettings['dailyTargets']>)
  }

  const unitSuffix =
    settings.targetUnit === 'PERCENT_KCAL' ? '%' : settings.targetUnit === 'PER_KG' ? 'g/kg' : 'g'

  /* ---------------------------------------------------------------- */
  /* Objetivos por día                                                 */
  /* ---------------------------------------------------------------- */

  const dayOverride = settings.perDayOverrides[String(1)] || {}

  return (
    <div className="space-y-6">
      {/* Objetivos diarios */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
          Objetivos diarios
        </h3>

        <label className="block max-w-xs">
          <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Unidad de expresión</span>
          <select
            value={settings.targetUnit}
            onChange={(event) => update({ targetUnit: event.target.value as TargetUnit })}
            className={fieldClass}
          >
            {Object.entries(TARGET_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">
              <Flame className="mr-1 inline h-3 w-3 text-blue-600" />
              Calorías (kcal)
            </span>
            <input
              type="number"
              min={0}
              step="10"
              value={Math.round(settings.dailyTargets.kcal)}
              onChange={(event) => updateTargets({ kcal: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>

          {macroFields.map((macro) => (
            <label key={macro.key} className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-gray-600">
                {macro.label} ({unitSuffix})
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={Number(displayedValue(macro.key).toFixed(1))}
                onChange={(event) => applyDisplayedValue(macro.key, Number(event.target.value))}
                className={fieldClass}
              />
            </label>
          ))}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">
              Fibra (g)
              <span className="ml-1 text-[9px] font-semibold text-gray-400">siempre en gramos</span>
            </span>
            <input
              type="number"
              min={0}
              step="1"
              value={Math.round(settings.dailyTargets.fiberG)}
              onChange={(event) => updateTargets({ fiberG: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      {/* Cálculo automático desde la ficha */}
      <section className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
        <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
          <Calculator className="h-3.5 w-3.5" />
          Cálculo automático de kcal desde la ficha del paciente
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Fórmula</span>
            <select
              value={settings.autoCalc.formula}
              onChange={(event) =>
                updateAutoCalc({ formula: event.target.value as MenuAutoCalc['formula'] })
              }
              className={fieldClass}
            >
              {Object.entries(FORMULA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Actividad</span>
            <select
              value={settings.autoCalc.activityLevel}
              onChange={(event) =>
                updateAutoCalc({ activityLevel: event.target.value as MenuAutoCalc['activityLevel'] })
              }
              className={fieldClass}
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Criterio</span>
            <select
              value={settings.autoCalc.mode}
              onChange={(event) =>
                updateAutoCalc({ mode: event.target.value as MenuAutoCalc['mode'] })
              }
              className={fieldClass}
            >
              <option value="TDEE">Mantenimiento (TDEE)</option>
              <option value="DEFICIT">Déficit calórico</option>
              <option value="SURPLUS">Superávit calórico</option>
            </select>
          </label>

          {settings.autoCalc.mode === 'DEFICIT' && (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Déficit (%)</span>
              <input
                type="number"
                min={0}
                max={50}
                step="1"
                value={settings.autoCalc.deficitPct}
                onChange={(event) => updateAutoCalc({ deficitPct: Number(event.target.value) })}
                className={fieldClass}
              />
            </label>
          )}

          {settings.autoCalc.mode === 'SURPLUS' && (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Superávit (%)</span>
              <input
                type="number"
                min={0}
                max={30}
                step="1"
                value={settings.autoCalc.surplusPct}
                onChange={(event) => updateAutoCalc({ surplusPct: Number(event.target.value) })}
                className={fieldClass}
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold text-gray-600">Proteína (g/kg)</span>
            <input
              type="number"
              min={0}
              step="0.1"
              value={settings.autoCalc.proteinPerKg}
              onChange={(event) => updateAutoCalc({ proteinPerKg: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AutoCalculateButton settings={settings} patientProfile={patientProfile} onAutoCalculate={onAutoCalculate} />
        </div>

        {!patientProfile && (
          <p className="text-[11px] font-semibold text-amber-800">
            Sin ficha de paciente asignada: el cálculo automático necesita peso, talla, edad y sexo.
          </p>
        )}
      </section>

      {/* Objetivos por día */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
          Objetivos distintos por día
        </h3>
        <p className="text-[11px] font-semibold text-gray-500">
          Define un reparto diferente para el día de entrenamiento y el de descanso. Los valores no
          rellenados heredan el objetivo diario.
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {WEEKDAY_LABELS.map((label, index) => {
            const dayNumber = index + 1
            const override = settings.perDayOverrides[String(dayNumber)] || {}
            const hasOverride = Object.keys(override).length > 0

            return (
              <div
                key={label}
                className={`rounded-2xl border p-3 ${
                  hasOverride ? 'border-amber-300 bg-amber-50/70' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-gray-800">{label}</span>
                  {hasOverride && (
                    <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-900">
                      {override.kcal ? `${override.kcal} kcal` : 'Personalizado'}
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  min={0}
                  step="10"
                  placeholder="kcal"
                  value={override.kcal ?? ''}
                  onChange={(event) => {
                    const value = event.target.value ? Number(event.target.value) : undefined
                    const next = { ...settings.perDayOverrides }
                    if (value === undefined) delete next[String(dayNumber)]
                    else next[String(dayNumber)] = { ...override, kcal: value }
                    update({ perDayOverrides: next })
                  }}
                  className="mt-2 h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-800"
                />
              </div>
            )
          })}
        </div>

        {dayOverride.kcal ? (
          <p className="text-[10px] font-semibold text-gray-400">
            Ejemplo aplicado al lunes: {dayOverride.kcal} kcal.
          </p>
        ) : null}
      </section>

      {/* Tolerancia y micros */}
      <section className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold text-gray-600">
            Tolerancia de colores (± %)
          </span>
          <input
            type="number"
            min={1}
            max={25}
            step="1"
            value={settings.tolerancePct}
            onChange={(event) => update({ tolerancePct: Number(event.target.value) })}
            className={fieldClass}
          />
        </label>

        <label className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={settings.ketoMode}
            onChange={(event) => update({ ketoMode: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-[11px] font-bold text-gray-700">Modo cetogénico</span>
        </label>

        <label className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={settings.showMicros}
            onChange={(event) => update({ showMicros: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-[11px] font-bold text-gray-700">Mostrar micronutrientes</span>
        </label>
      </section>

      {/* Ingestas */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            <Utensils className="h-3.5 w-3.5" />
            Ingestas
          </h3>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
              percentIsValid
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            Reparto: {formatNumber(percentSum, 1)}%
          </span>

          {!percentIsValid && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              El reparto debe sumar 100 %
            </span>
          )}

          <button
            type="button"
            onClick={() => update(distributeIngestasEvenly(settings))}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <Equal className="h-3.5 w-3.5" />
            Repartir equitativamente
          </button>
        </div>

        <ul className="space-y-2">
          {settings.ingestas
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((ingesta, index) => (
              <li
                key={ingesta.mealType}
                className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5 ${
                  ingesta.enabled ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50/70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={ingesta.enabled}
                  onChange={(event) =>
                    updateIngesta(ingesta.mealType, { enabled: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Activar ${ingesta.label}`}
                />

                <input
                  type="text"
                  value={ingesta.label}
                  onChange={(event) => updateIngesta(ingesta.mealType, { label: event.target.value })}
                  className="h-8 w-36 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-800"
                  aria-label="Nombre de la ingesta"
                />

                <input
                  type="time"
                  value={ingesta.time || ''}
                  onChange={(event) => updateIngesta(ingesta.mealType, { time: event.target.value || null })}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-700"
                  aria-label="Horario de la ingesta"
                />

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={ingesta.percent}
                    onChange={(event) =>
                      updateIngesta(ingesta.mealType, { percent: Number(event.target.value) })
                    }
                    className="h-8 w-20 rounded-lg border border-gray-200 bg-white px-2 text-right text-[11px] font-bold text-gray-800"
                    aria-label="Porcentaje del día"
                  />
                  <span className="text-[11px] font-bold text-gray-400">%</span>
                </div>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => update(moveIngesta(settings, ingesta.mealType, -1))}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Subir"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => update(moveIngesta(settings, ingesta.mealType, 1))}
                    disabled={index === settings.ingestas.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Bajar"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
        </ul>

        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
          <Percent className="h-3 w-3" />
          El % de cada ingesta se aplica a los objetivos diarios para calcular sus kcal y gramos.
        </p>
      </section>

      {/* Estado del modo cetogénico */}
      <section
        className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
          settings.ketoMode
            ? 'border-purple-200 bg-purple-50/70'
            : 'border-gray-200 bg-gray-50/70'
        }`}
      >
        {settings.ketoMode ? (
          <Flame className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
        ) : (
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        )}
        <div>
          <p className="text-[11px] font-black text-gray-800">
            {settings.ketoMode ? 'Modo cetogénico activado' : 'Modo cetogénico desactivado'}
          </p>
          <p className="text-[11px] font-semibold text-gray-500">
            {settings.ketoMode
              ? 'El Keto-Ratio (grasa / (proteína + HC)) aparece en los requisitos y en el resumen de la semana.'
              : 'El Keto-Ratio permanece oculto. Actívalo para mostrarlo en los requisitos.'}
          </p>
        </div>
        <Activity className="ml-auto h-4 w-4 shrink-0 text-gray-300" />
      </section>
    </div>
  )
}

function AutoCalculateButton({
  settings,
  patientProfile,
  onAutoCalculate,
}: {
  settings: MenuSettings
  patientProfile: MenuConfigTabProps['patientProfile']
  onAutoCalculate: MenuConfigTabProps['onAutoCalculate']
}) {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={!patientProfile}
        onClick={() => {
          setError(null)
          if (!patientProfile) return
          const weightKg = patientProfile.weightKg
          const heightCm = patientProfile.heightCm
          const age = patientProfile.age
          if (!weightKg || !heightCm || !age) {
            setError('La ficha no tiene peso, talla o edad suficientes.')
            return
          }
          const sex = patientProfile.sex === 'MALE' ? 'male' : 'female'
          const result = autoCalculateTargets({
            weightKg,
            heightCm,
            age,
            sex,
            activityLevel: settings.autoCalc.activityLevel,
            formula: settings.autoCalc.formula,
            mode: settings.autoCalc.mode,
            deficitPct: settings.autoCalc.deficitPct,
            surplusPct: settings.autoCalc.surplusPct,
            proteinPerKg: settings.autoCalc.proteinPerKg,
          })
          onAutoCalculate(result)
        }}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
      >
        <Scale className="h-3.5 w-3.5" />
        Calcular desde la ficha
      </button>
      {error && <span className="text-[10px] font-bold text-red-700">{error}</span>}
    </div>
  )
}
