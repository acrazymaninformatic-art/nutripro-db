'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'
import {
  computeIngestaTotals,
  computeTotals,
  resolveDayTargets,
  WEEKDAY_LABELS,
  type MenuSettings,
} from '@/lib/menu-config'
import { checkPatientAllergenConflict } from '@/lib/nutrition'
import { MenuDataTab, type MenuDataState } from './menu-data-tab'
import { MenuConfigTab } from './menu-config-tab'
import { MenuPatientsTab, type PatientOption } from './menu-patients-tab'
import { RequirementsView, type WeekPoint } from './requirements-view'
import {
  assignPatientToMenu,
  getOrCreateMenuConfig,
  removePatientFromMenu,
  restoreMenuVersion,
  saveMenuData,
  saveMenuSettings,
  updateMenuPatientServings,
  type MenuConfigDTO,
} from '../menu-actions'

interface MenuInfoPanelProps {
  plan: any
  menu: MenuConfigDTO
  patients: PatientOption[]
}

type TabKey = 'data' | 'config' | 'patients'

interface Snapshot {
  settings: MenuSettings
  data: MenuDataState
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof ClipboardList }> = [
  { key: 'data', label: 'Datos menú', icon: ClipboardList },
  { key: 'config', label: 'Configuración', icon: Settings2 },
  { key: 'patients', label: 'Paciente(s)', icon: Users },
]

export function MenuInfoPanel({ plan, menu, patients }: MenuInfoPanelProps) {
  const router = useRouter()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [tab, setTab] = useState<TabKey>('data')
  const [selectedDay, setSelectedDay] = useState<number | 'week'>('week')

  const [settings, setSettings] = useState<MenuSettings>(menu.settings)
  const [menuData, setMenuData] = useState<MenuDataState>({
    title: menu.title,
    status: menu.status,
    startDate: menu.startDate ? menu.startDate.slice(0, 10) : '',
    endDate: menu.endDate ? menu.endDate.slice(0, 10) : '',
    internalNotes: menu.internalNotes || '',
    isTemplate: menu.isTemplate,
  })
  const [assignments, setAssignments] = useState(menu.assignments)
  const [versions, setVersions] = useState(menu.versions)

  const [isSaving, setIsSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [pending, setPending] = useState<{ settings?: MenuSettings; data?: Partial<MenuDataState> } | null>(
    null
  )

  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])

  const days = useMemo(
    () => [...(plan?.days || [])].sort((a: any, b: any) => a.dayNumber - b.dayNumber),
    [plan]
  )

  /* ---------------------------------------------------------------- */
  /* Autoguardado                                                      */
  /* ---------------------------------------------------------------- */

  const flush = useCallback(async () => {
    if (!pending) return
    const planId = plan?.id
    if (!planId) return
    setIsSaving(true)
    try {
      if (pending.settings) {
        await saveMenuSettings(planId, pending.settings, 'Autoguardado de objetivos')
      }
      if (pending.data) {
        await saveMenuData(planId, pending.data)
      }
      const refreshed = await getOrCreateMenuConfig(planId)
      setVersions(refreshed.versions)
      setSavedAt(Date.now())
    } catch {
      // El error se muestra en el centro de notificaciones de la aplicación.
    } finally {
      setIsSaving(false)
      setPending(null)
    }
  }, [pending, plan?.id])

  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => {
      void flush()
    }, 900)
    return () => clearTimeout(timer)
  }, [pending, flush])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  /* ---------------------------------------------------------------- */
  /* Historial local (deshacer / rehacer)                               */
  /* ---------------------------------------------------------------- */

  // La referencia se actualiza en un efecto (nunca durante el render) para
  // poder leer el estado previo al aplicar un cambio.
  const snapshotRef = useRef<Snapshot>({ settings, data: menuData })
  useEffect(() => {
    snapshotRef.current = { settings, data: menuData }
  }, [settings, menuData])

  const pushHistory = useCallback(() => {
    setPast((current) => [...current.slice(-40), snapshotRef.current])
    setFuture([])
  }, [])

  const applySnapshot = useCallback((next: Snapshot) => {
    setSettings(next.settings)
    setMenuData(next.data)
    setPending({ settings: next.settings, data: next.data })
  }, [])

  const undo = useCallback(() => {
    setPast((current) => {
      if (current.length === 0) return current
      const previous = current[current.length - 1]
      setFuture((items) => [snapshotRef.current, ...items].slice(0, 40))
      applySnapshot(previous)
      return current.slice(0, -1)
    })
  }, [applySnapshot])

  const redo = useCallback(() => {
    setFuture((current) => {
      if (current.length === 0) return current
      const next = current[0]
      setPast((items) => [...items, snapshotRef.current])
      applySnapshot(next)
      return current.slice(1)
    })
  }, [applySnapshot])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        if (isTyping && !event.shiftKey) return
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  /* ---------------------------------------------------------------- */
  /* Cálculos                                                          */
  /* ---------------------------------------------------------------- */

  const weekPoints = useMemo<WeekPoint[]>(
    () =>
      days.map((day: any, index: number) => ({
        dayNumber: day.dayNumber,
        label: WEEKDAY_LABELS[index] || `Día ${day.dayNumber}`,
        totals: computeTotals(day.meals || []),
      })),
    [days]
  )

  const averageTotals = useMemo(() => {
    if (weekPoints.length === 0) return computeTotals([])
    const totals = weekPoints.reduce(
      (acc, point) => ({
        kcal: acc.kcal + point.totals.kcal / weekPoints.length,
        proteinG: acc.proteinG + point.totals.proteinG / weekPoints.length,
        carbsG: acc.carbsG + point.totals.carbsG / weekPoints.length,
        fatG: acc.fatG + point.totals.fatG / weekPoints.length,
        fiberG: acc.fiberG + point.totals.fiberG / weekPoints.length,
        sugarG: acc.sugarG + point.totals.sugarG / weekPoints.length,
        saturatedFatG: acc.saturatedFatG + point.totals.saturatedFatG / weekPoints.length,
        sodiumMg: acc.sodiumMg + point.totals.sodiumMg / weekPoints.length,
      }),
      {
        kcal: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        sugarG: 0,
        saturatedFatG: 0,
        sodiumMg: 0,
      }
    )
    return totals
  }, [weekPoints])

  const currentDay = useMemo(
    () => (selectedDay === 'week' ? null : days.find((day: any) => day.dayNumber === selectedDay)),
    [days, selectedDay]
  )

  const dayTotals = useMemo(
    () => (currentDay ? computeTotals(currentDay.meals || []) : averageTotals),
    [currentDay, averageTotals]
  )

  const targets = useMemo(
    () => resolveDayTargets(settings, currentDay ? currentDay.dayNumber : 1),
    [settings, currentDay]
  )

  const ingestas = useMemo(
    () => (currentDay ? computeIngestaTotals(currentDay.meals || [], settings) : []),
    [currentDay, settings]
  )

  /* ---------------------------------------------------------------- */
  /* Alérgenos y compatibilidades                                       */
  /* ---------------------------------------------------------------- */

  const patientProfiles = useMemo(
    () =>
      assignments.map((assignment) => {
        const profile = (assignment.profile || {}) as Record<string, any>
        return {
          id: assignment.patientId,
          name: `${assignment.patient.firstName} ${assignment.patient.lastName}`,
          allergies: (profile.allergies || '') as string,
          intolerances: (profile.intolerances || '') as string,
          dietaryPreferences: (profile.dietaryPreferences || '') as string,
          dislikedFoods: (profile.dislikedFoods || '') as string,
        }
      }),
    [assignments]
  )

  const allergenTerms = useMemo(() => {
    const terms = new Set<string>()
    for (const profile of patientProfiles) {
      for (const term of profile.allergies.split(',').map((item) => item.trim()).filter(Boolean)) {
        terms.add(term)
      }
    }
    return Array.from(terms)
  }, [patientProfiles])

  const conflictsByPatient = useMemo(() => {
    const result: Record<string, string[]> = {}
    const foods = new Map<string, { name: string; category?: string | null }>()

    for (const day of days) {
      for (const meal of day.meals || []) {
        for (const item of meal.items || []) {
          if (item.food) foods.set(`${item.food.name}|${item.food.category || ''}`, item.food)
        }
      }
    }

    for (const profile of patientProfiles) {
      const messages: string[] = []
      const syntheticPatient = {
        allergies: profile.allergies,
        intolerances: profile.intolerances,
        firstName: profile.name,
      }

      for (const food of foods.values()) {
        const conflict = checkPatientAllergenConflict(food, syntheticPatient)
        if (conflict && !messages.includes(conflict.alertMessage)) {
          messages.push(conflict.alertMessage)
        }
      }

      result[profile.id] = messages
    }

    return result
  }, [patientProfiles, days])

  const conflictMessages = useMemo(() => {
    const messages = new Set<string>()
    for (const profile of patientProfiles) {
      for (const message of conflictsByPatient[profile.id] || []) {
        messages.add(message)
      }
    }
    return Array.from(messages)
  }, [patientProfiles, conflictsByPatient])

  const preferenceWarnings = useMemo(() => {
    const warnings = new Set<string>()
    const foods = new Set<string>()

    for (const day of days) {
      for (const meal of day.meals || []) {
        for (const item of meal.items || []) {
          if (item.food) foods.add(item.food.name.toLowerCase())
        }
      }
    }

    for (const profile of patientProfiles) {
      const terms = [
        ...profile.dietaryPreferences.split(',').map((item) => item.trim()).filter(Boolean),
        ...profile.dislikedFoods.split(',').map((item) => item.trim()).filter(Boolean),
      ]

      for (const term of terms) {
        const normalized = term.toLowerCase()
        const match = Array.from(foods).find((food) => food.includes(normalized))
        if (match) {
          warnings.add(
            `${profile.name}: «${term}» es incompatible con ${match} (preferencia o aversión registrada).`
          )
        }
      }
    }

    return Array.from(warnings)
  }, [patientProfiles, days])

  /* ---------------------------------------------------------------- */
  /* Acciones                                                           */
  /* ---------------------------------------------------------------- */

  const handleSettingsChange = (next: MenuSettings) => {
    pushHistory()
    setSettings(next)
    setPending((current) => ({ ...(current || {}), settings: next }))
  }

  const handleDataChange = (patch: Partial<MenuDataState>) => {
    pushHistory()
    setMenuData((current) => {
      const next = { ...current, ...patch }
      setPending((state) => ({ ...(state || {}), data: next }))
      return next
    })
  }

  const handleAssign = async (patient: PatientOption) => {
    const profile = {
      patientId: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      weightKg: patient.weightKg,
      heightCm: patient.heightCm,
      age: patient.birthDate ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null,
      sex: patient.sex,
      objective: patient.objective,
      allergies: patient.allergies,
      intolerances: patient.intolerances,
      dietaryPreferences: patient.dietaryPreferences,
      dislikedFoods: patient.foodAversions,
      activityLevel: patient.activityLevel,
      servings: 1,
      importedAt: new Date().toISOString(),
    }

    await assignPatientToMenu(plan.id, patient.id, 1, profile)
    const refreshed = await getOrCreateMenuConfig(plan.id)
    setAssignments(refreshed.assignments)
  }

  const handleRemove = async (patientId: string) => {
    await removePatientFromMenu(plan.id, patientId)
    const refreshed = await getOrCreateMenuConfig(plan.id)
    setAssignments(refreshed.assignments)
  }

  const handleServings = async (patientId: string, servings: number) => {
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.patientId === patientId ? { ...assignment, servings } : assignment
      )
    )
    await updateMenuPatientServings(plan.id, patientId, servings)
  }

  const handleReimport = async (patient: PatientOption) => {
    await handleAssign(patient)
  }

  const handleRestoreVersion = async (versionId: string) => {
    const result = await restoreMenuVersion(plan.id, versionId)
    if (result.settings) {
      pushHistory()
      setSettings(result.settings)
      setPending({ settings: result.settings })
    }
    const refreshed = await getOrCreateMenuConfig(plan.id)
    setVersions(refreshed.versions)
  }

  const handleDuplicate = async () => {
    const { duplicateMenu } = await import('../menu-actions')
    const result = await duplicateMenu(plan.id)
    router.push(`/dashboard/plans/${result.planId}`)
  }

  const saveLabel = useMemo(() => {
    if (isSaving) return 'Guardando…'
    if (!savedAt) return 'Sin cambios pendientes'
    const seconds = Math.max(0, Math.round((now - savedAt) / 1000))
    if (seconds < 5) return 'Guardado ahora'
    if (seconds < 60) return `Guardado hace ${seconds} s`
    const minutes = Math.round(seconds / 60)
    return `Guardado hace ${minutes} min`
  }, [isSaving, savedAt, now])

  const patientProfile = useMemo(() => {
    const first = assignments[0]
    if (!first) {
      const planPatient = plan?.patient
      if (!planPatient) return null
      return {
        weightKg: planPatient.declaredWeightKg ?? null,
        heightCm: planPatient.heightCm ?? null,
        age: planPatient.birthDate
          ? Math.floor((now - new Date(planPatient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
          : null,
        sex: planPatient.sex ?? null,
      }
    }
    const profile = (first.profile || {}) as Record<string, any>
    return {
      weightKg: profile.weightKg ?? null,
      heightCm: profile.heightCm ?? null,
      age: profile.age ?? null,
      sex: profile.sex ?? null,
    }
  }, [assignments, plan])

  const dayLabel =
    selectedDay === 'week'
      ? 'Totales de la Semana'
      : `Totales del ${WEEKDAY_LABELS[selectedDay - 1] || `Día ${selectedDay}`}`

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm print:hidden">
      {/* Cabecera */}
      <header className="border-b border-gray-100 bg-gradient-to-r from-white to-blue-50/40">
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ClipboardList className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-gray-900">Información del menú</span>
            <span className="block text-[11px] font-semibold text-gray-500">{dayLabel}</span>
          </span>
          <span className="ml-auto flex items-center gap-2">
            {menu.isTemplate && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-900">
                Plantilla
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600">
              {menu.internalCode}
            </span>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>

        {!isCollapsed && (
          <>
            {/* Selector de periodo */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 px-4 py-2.5">
              {(['week', ...days.map((day: any) => day.dayNumber)] as Array<number | 'week'>).map(
                (option) => {
                  const active = selectedDay === option
                  const label =
                    option === 'week'
                      ? 'Sem'
                      : WEEKDAY_LABELS[(option as number) - 1]?.slice(0, 1) || String(option)

                  return (
                    <button
                      key={String(option)}
                      type="button"
                      onClick={() => setSelectedDay(option)}
                      className={`h-8 w-8 rounded-xl border text-[11px] font-black transition-all ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                      }`}
                      aria-label={option === 'week' ? 'Vista semanal' : `Día ${option}`}
                    >
                      {label}
                    </button>
                  )
                }
              )}

              <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                <CalendarDays className="h-3 w-3" />
                {selectedDay === 'week'
                  ? 'Media diaria y tendencia semanal'
                  : `Día ${selectedDay} de ${days.length}`}
              </div>
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1 border-t border-gray-100 px-4 pt-2">
              {TABS.map((item) => {
                const Icon = item.icon
                const active = tab === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    aria-label={item.label}
                    className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[11px] font-black transition-colors ${
                      active
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </header>

      {!isCollapsed && (
        <div className="space-y-6 p-4">
          {tab === 'data' && (
            <MenuDataTab
              data={menuData}
              internalCode={menu.internalCode}
              onChange={handleDataChange}
              versions={versions}
              onRestoreVersion={handleRestoreVersion}
              onDuplicate={handleDuplicate}
              canUndo={past.length > 0}
              canRedo={future.length > 0}
              onUndo={undo}
              onRedo={redo}
              saveLabel={saveLabel}
              isSaving={isSaving}
            />
          )}

          {tab === 'config' && (
            <MenuConfigTab
              settings={settings}
              onChange={handleSettingsChange}
              patientProfile={patientProfile}
              onAutoCalculate={(result) => {
                const next: MenuSettings = {
                  ...settings,
                  dailyTargets: {
                    ...settings.dailyTargets,
                    kcal: result.kcal,
                    proteinG: result.proteinG,
                  },
                }
                handleSettingsChange(next)
                setPending((state) => ({ ...(state || {}), settings: next }))
              }}
            />
          )}

          {tab === 'patients' && (
            <MenuPatientsTab
              patients={patients}
              assignments={assignments}
              allergenPolicy={settings.allergenPolicy}
              onPolicyChange={(policy) => {
                const next = { ...settings, allergenPolicy: policy }
                handleSettingsChange(next)
                setPending((state) => ({ ...(state || {}), settings: next }))
              }}
              onAssign={handleAssign}
              onRemove={handleRemove}
              onServingsChange={handleServings}
              onReimport={handleReimport}
              conflictsByPatient={conflictsByPatient}
            />
          )}

          <div className="border-t border-gray-100 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-gray-800">
                {dayLabel}
              </h2>
            </div>

            <RequirementsView
              mode={selectedDay === 'week' ? 'week' : 'day'}
              dayLabel={
                selectedDay === 'week'
                  ? 'la semana'
                  : WEEKDAY_LABELS[selectedDay - 1] || `el día ${selectedDay}`
              }
              totals={dayTotals}
              targets={targets}
              settings={settings}
              ingestas={ingestas}
              weekPoints={weekPoints}
              allergenTerms={allergenTerms}
              conflictMessages={conflictMessages}
              preferenceWarnings={preferenceWarnings}
            />
          </div>
        </div>
      )}
    </section>
  )
}
