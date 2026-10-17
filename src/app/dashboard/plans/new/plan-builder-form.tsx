'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createMealPlan } from '../actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarDays,
  Plus,
  Trash2,
  Copy,
  ClipboardPaste,
  Edit2,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  Calculator,
  Sliders,
  Check,
  FileText,
  GripVertical,
  Search,
  X,
  Wand2,
  RefreshCw,
  Scale,
  ShieldAlert,
  Eye,
  EyeOff,
  Layers,
  Pill,
  BookOpen,
} from 'lucide-react'
import {
  getFoodImage,
  generateAutomatedWeeklyPlan,
  FALLBACK_FOOD_SVG,
  CLINICAL_TEMPLATES,
  buildPlanFromClinicalTemplate,
  checkPatientAllergenConflict,
  detectAllergensInFood,
  scanPlanForAllergens,
  type PatientAllergenConflict,
} from '@/lib/nutrition'
import { checkDrugInteractions } from '@/lib/nutrition/drug-interactions'
import { FOOD_EXCHANGE_GROUPS } from '@/lib/nutrition/exchange-system'
import { OBJECTIVE_LABELS, ACTIVITY_LEVEL_LABELS, type Objective, type ActivityLevel } from '@/types'


interface PatientProfile {
  id: string
  name: string
  firstName: string
  lastName: string
  birthDate: string
  sex: string
  heightCm: number
  objective: string
  activityLevel: string
  allergies: string
  intolerances: string
  dietaryPreferences: string
  foodAversions?: string
  medicalHistory?: string
  currentMedications?: string
  isGLP1Treatment?: boolean
  isTCAProtocol?: boolean
  latestWeightKg: number
  latestBodyFatPct: number | null
}

interface FoodOption {
  id: number
  name: string
  category: string | null
  imageUrl: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

interface GridItem {
  uid: string
  foodId: number
  quantityG: number
  notes: string
}

const DEFAULT_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: 'Desayuno', order: 1 },
  { type: 'MID_MORNING', label: 'Media Mañana', order: 2 },
  { type: 'LUNCH', label: 'Comida', order: 3 },
  { type: 'SNACK', label: 'Merienda', order: 4 },
  { type: 'DINNER', label: 'Cena', order: 5 },
]

export function PlanBuilderForm({
  patients,
  foods,
}: {
  patients: PatientProfile[]
  foods: FoodOption[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 1. Selected patient state
  const [patientId, setPatientId] = useState(patients[0]?.id || '')
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === patientId) || patients[0],
    [patients, patientId]
  )

  // 2. Precision Calculator Parameters
  const [calcWeightKg, setCalcWeightKg] = useState<number>(selectedPatient?.latestWeightKg || 70)
  const [calcHeightCm, setCalcHeightCm] = useState<number>(selectedPatient?.heightCm || 170)
  const [calcAge, setCalcAge] = useState<number>(30)
  const [calcSex, setCalcSex] = useState<'MALE' | 'FEMALE'>('FEMALE')
  const [calcBodyFatPct, setCalcBodyFatPct] = useState<number>(selectedPatient?.latestBodyFatPct || 22)
  const [calcFormula, setCalcFormula] = useState<'katch' | 'mifflin' | 'harris' | 'cunningham'>('katch')
  const [useAdjustedWeight, setUseAdjustedWeight] = useState<boolean>(false)
  const [calcPal, setCalcPal] = useState<number>(1.55)
  const [calcDeficit, setCalcDeficit] = useState<number>(-500)
  const [proteinGPerKg, setProteinGPerKg] = useState<number>(2.0)
  const [fatGPerKg, setFatGPerKg] = useState<number>(0.9)
  const [minCaloricSafetyKcal, setMinCaloricSafetyKcal] = useState<number>(1200)

  // 3. EDITABLE DAY NAMES (Column Headers)
  const [dayNames, setDayNames] = useState<string[]>([...DEFAULT_DAYS])

  // Plan metadata
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [generalNotes, setGeneralNotes] = useState(
    'Beber 2 a 2.5 litros de agua al día. Priorizar cocciones a la plancha, al vapor o al horno con el aceite indicado. Respetar los descansos de 7-8 horas de sueño.'
  )

  // Notice badge for automated generation
  const [autoGenNotice, setAutoGenNotice] = useState<string | null>(null)

  // Clinical Protocols
  const [isGLP1, setIsGLP1] = useState<boolean>(false)
  const [isTCA, setIsTCA] = useState<boolean>(false)
  const [showExchangesModal, setShowExchangesModal] = useState<boolean>(false)

  // 4. WEEKLY MATRIX STATE: grid[mealType][dayIndex] = GridItem[]
  const [gridSchedule, setGridSchedule] = useState<{
    [mealType: string]: { [dayIndex: number]: GridItem[] }
  }>(() => {
    const initial: any = {}
    MEAL_TYPES.forEach((m) => {
      initial[m.type] = {}
      for (let d = 0; d < 7; d++) {
        initial[m.type][d] = []
      }
    })
    return initial
  })

  // 5. INTERNAL CLIPBOARD FOR COPY/PASTE WITH 1 CLICK
  const [copiedItem, setCopiedItem] = useState<{ foodId: number; quantityG: number; notes: string } | null>(null)
  const [copiedItemName, setCopiedItemName] = useState<string>('')

  // 6. ADD FOOD MODAL / QUICK SELECTOR
  const [modalTarget, setModalTarget] = useState<{ mealType: string; dayIndex: number } | null>(null)
  const [foodSearchQuery, setFoodSearchQuery] = useState('')

  // 7. DRAG AND DROP STATE
  const [draggedInfo, setDraggedInfo] = useState<{
    mealType: string
    dayIndex: number
    itemIndex: number
  } | null>(null)

  // 8. ALLERGEN SAFETY VERIFICATION TARGET MODAL
  const [allergenWarningTarget, setAllergenWarningTarget] = useState<{
    food: FoodOption
    conflict: PatientAllergenConflict
  } | null>(null)

  // Map foods for quick O(1) lookup
  const foodMap = useMemo(() => {
    const map = new Map<number, FoodOption>()
    foods.forEach((f) => map.set(f.id, f))
    return map
  }, [foods])

  // Clinical drug-food interactions
  const drugAlerts = useMemo(() => {
    return checkDrugInteractions(
      selectedPatient?.currentMedications || '',
      selectedPatient?.medicalHistory || ''
    )
  }, [selectedPatient])

  // Clinical allergen scanner for the current plan
  const planAllergenConflicts = useMemo(() => {
    return scanPlanForAllergens(gridSchedule, foodMap, selectedPatient, dayNames)
  }, [gridSchedule, foodMap, selectedPatient, dayNames])

  // Precision Calculator outputs
  const precisionResults = useMemo(() => {
    const isMale = calcSex === 'MALE'
    const heightM = calcHeightCm / 100
    const bmi = calcWeightKg / (heightM * heightM)

    const idealWeight = isMale
      ? 50 + 2.3 * (calcHeightCm / 2.54 - 60)
      : 45.5 + 2.3 * (calcHeightCm / 2.54 - 60)

    const adjustedWeight = idealWeight + 0.25 * (calcWeightKg - idealWeight)
    const effectiveWeight = useAdjustedWeight && bmi >= 30 ? adjustedWeight : calcWeightKg
    const lbmKg = calcWeightKg * (1 - calcBodyFatPct / 100)

    let bmr = 0
    if (calcFormula === 'katch') {
      bmr = 370 + 21.6 * lbmKg
    } else if (calcFormula === 'cunningham') {
      bmr = 500 + 22 * lbmKg
    } else if (calcFormula === 'mifflin') {
      bmr = isMale
        ? 10 * effectiveWeight + 6.25 * calcHeightCm - 5 * calcAge + 5
        : 10 * effectiveWeight + 6.25 * calcHeightCm - 5 * calcAge - 161
    } else {
      bmr = isMale
        ? 88.362 + 13.397 * effectiveWeight + 4.799 * calcHeightCm - 5.677 * calcAge
        : 447.593 + 9.247 * effectiveWeight + 3.098 * calcHeightCm - 4.33 * calcAge
    }

    const tdee = Math.round(bmr * calcPal)
    const targetKcal = Math.max(minCaloricSafetyKcal, Math.round(tdee + calcDeficit))

    const targetProteinG = Math.round(effectiveWeight * proteinGPerKg)
    const targetFatG = Math.round(effectiveWeight * fatGPerKg)

    const proteinKcal = targetProteinG * 4
    const fatKcal = targetFatG * 9
    const carbsKcal = Math.max(0, targetKcal - (proteinKcal + fatKcal))
    const targetCarbsG = Math.round(carbsKcal / 4)

    return {
      bmi: Math.round(bmi * 10) / 10,
      idealWeight: Math.round(idealWeight * 10) / 10,
      adjustedWeight: Math.round(adjustedWeight * 10) / 10,
      lbmKg: Math.round(lbmKg * 10) / 10,
      bmr: Math.round(bmr),
      tdee,
      targetKcal,
      targetProteinG,
      targetCarbsG,
      targetFatG,
    }
  }, [
    calcWeightKg,
    calcHeightCm,
    calcAge,
    calcSex,
    calcBodyFatPct,
    calcFormula,
    useAdjustedWeight,
    calcPal,
    calcDeficit,
    proteinGPerKg,
    fatGPerKg,
    minCaloricSafetyKcal,
  ])

  // FUNCTION: Trigger automatic plan generation
  const handleAutoGeneratePlan = () => {
    if (!selectedPatient) return

    const generated = generateAutomatedWeeklyPlan(
      {
        firstName: selectedPatient.firstName,
        lastName: selectedPatient.lastName,
        objective: selectedPatient.objective,
        targetKcal: precisionResults.targetKcal,
        targetProteinG: precisionResults.targetProteinG,
        targetCarbsG: precisionResults.targetCarbsG,
        targetFatG: precisionResults.targetFatG,
        allergies: selectedPatient.allergies,
        intolerances: selectedPatient.intolerances,
        dietaryPreferences: selectedPatient.dietaryPreferences,
        foodAversions: selectedPatient.foodAversions,
        medicalHistory: selectedPatient.medicalHistory,
      },
      foods
    )

    const updatedGrid: any = {}
    MEAL_TYPES.forEach((m) => {
      updatedGrid[m.type] = {}
      for (let d = 0; d < 7; d++) {
        updatedGrid[m.type][d] = (generated[d] as any)?.[m.type] || []
      }
    })

    setGridSchedule(updatedGrid)
    setAutoGenNotice(
      `Pauta base generada automáticamente: ${precisionResults.targetKcal} kcal/día, ${precisionResults.targetProteinG}g P, adaptada a ${selectedPatient.firstName}. Puedes modificar cualquier cantidad o arrastrar alimentos.`
    )
  }

  // FUNCTION: Apply 1-Click Clinical Diet Template with automatic proportional scaling
  const handleApplyTemplate = (templateId: string) => {
    const template = CLINICAL_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    const targetKcal = precisionResults.targetKcal
    const scaledGrid = buildPlanFromClinicalTemplate(templateId, targetKcal, foods, selectedPatient)

    setGridSchedule(scaledGrid as any)
    setAutoGenNotice(
      `✨ Plantilla clínica "${template.name}" aplicada con 1 clic: Escalada proporcionalmente a ${targetKcal} kcal/día (${template.macroRatio.proteinPct}% P / ${template.macroRatio.carbsPct}% C / ${template.macroRatio.fatPct}% G). Gramajes ajustados para ${selectedPatient?.firstName || 'el paciente'}.`
    )
  }


  // Update defaults when patient changes and auto-generate base plan
  useEffect(() => {
    if (!selectedPatient) return

    const birthDate = new Date(selectedPatient.birthDate)
    const age = Math.max(16, new Date().getFullYear() - birthDate.getFullYear())
    const weight = selectedPatient.latestWeightKg || 70
    const height = selectedPatient.heightCm || 170
    const isMale = selectedPatient.sex === 'MALE'
    const fatPct = selectedPatient.latestBodyFatPct || (isMale ? 16 : 24)

    setCalcWeightKg(weight)
    setCalcHeightCm(height)
    setCalcAge(age)
    setCalcSex(isMale ? 'MALE' : 'FEMALE')
    setCalcBodyFatPct(fatPct)

    const formula = selectedPatient.latestBodyFatPct ? 'katch' : 'mifflin'
    setCalcFormula(formula)

    const palMap: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.9,
    }
    const pal = palMap[selectedPatient.activityLevel] || 1.55
    setCalcPal(pal)

    let deficit = 0
    let protPerKg = 1.8
    let fatPerKg = 0.9
    if (selectedPatient.objective === 'WEIGHT_LOSS') {
      deficit = -500
      protPerKg = 2.0
      fatPerKg = 0.8
    } else if (selectedPatient.objective === 'MUSCLE_GAIN') {
      deficit = 300
      protPerKg = 2.2
      fatPerKg = 1.0
    }
    setCalcDeficit(deficit)
    setProteinGPerKg(protPerKg)
    setFatGPerKg(fatPerKg)

    const isPatientGLP1 = Boolean(selectedPatient.isGLP1Treatment)
    const isPatientTCA = Boolean(selectedPatient.isTCAProtocol)
    setIsGLP1(isPatientGLP1)
    setIsTCA(isPatientTCA)

    if (isPatientGLP1) {
      protPerKg = Math.max(1.5, protPerKg)
      setProteinGPerKg(protPerKg)
      setGeneralNotes(
        'PROTOCOLO CLÍNICO GLP-1 ACTIVO: Priorizar la proteína en primer lugar. Beber mínimo 2.5 litros de agua al día para evitar estreñimiento. Fraccionar tomas en volúmenes pequeños y masticación pausada para reducir náuseas.'
      )
    }

    setName(`Pauta de ${selectedPatient.firstName} - ${OBJECTIVE_LABELS[selectedPatient.objective as Objective] || 'Personalizada'}`)

    // Compute exact physiological targets for this patient
    const lbmKg = weight * (1 - fatPct / 100)
    const bmr = formula === 'katch'
      ? 370 + 21.6 * lbmKg
      : (isMale ? 10 * weight + 6.25 * height - 5 * age + 5 : 10 * weight + 6.25 * height - 5 * age - 161)
    const tdee = Math.round(bmr * pal)
    const calculatedTargetKcal = Math.max(1200, Math.round(tdee + deficit))
    const calculatedProt = Math.round(weight * protPerKg)
    const calculatedFat = Math.round(weight * fatPerKg)
    const calculatedCarbs = Math.max(50, Math.round((calculatedTargetKcal - (calculatedProt * 4 + calculatedFat * 9)) / 4))

    // Auto-generate realistic initial base plan adapted to all patient clinical adjustments
    const generated = generateAutomatedWeeklyPlan(
      {
        firstName: selectedPatient.firstName,
        lastName: selectedPatient.lastName,
        objective: selectedPatient.objective,
        targetKcal: calculatedTargetKcal,
        targetProteinG: calculatedProt,
        targetCarbsG: calculatedCarbs,
        targetFatG: calculatedFat,
        allergies: selectedPatient.allergies,
        intolerances: selectedPatient.intolerances,
        dietaryPreferences: selectedPatient.dietaryPreferences,
        foodAversions: selectedPatient.foodAversions,
        medicalHistory: selectedPatient.medicalHistory,
      },
      foods
    )

    const initialGrid: any = {}
    MEAL_TYPES.forEach((m) => {
      initialGrid[m.type] = {}
      for (let d = 0; d < 7; d++) {
        initialGrid[m.type][d] = (generated[d] as any)?.[m.type] || []
      }
    })
    setGridSchedule(initialGrid)
    setAutoGenNotice(`Pauta base generada automáticamente: ${calculatedTargetKcal} kcal/día, ${calculatedProt}g Proteína, adaptada a ${selectedPatient.firstName}.`)
  }, [selectedPatient])

  // Calculate day-by-day nutritional totals across the 7 columns
  const dayTotals = useMemo(() => {
    const totals: { kcal: number; prot: number; carbs: number; fat: number }[] = []

    for (let d = 0; d < 7; d++) {
      let kcal = 0
      let prot = 0
      let carbs = 0
      let fat = 0

      MEAL_TYPES.forEach((m) => {
        const items = gridSchedule[m.type]?.[d] || []
        items.forEach((it) => {
          const food = foodMap.get(it.foodId)
          if (food && it.quantityG > 0) {
            const factor = it.quantityG / 100
            kcal += food.calories * factor
            prot += food.proteinG * factor
            carbs += food.carbsG * factor
            fat += food.fatG * factor
          }
        })
      })

      totals.push({
        kcal: Math.round(kcal),
        prot: Math.round(prot * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
      })
    }

    return totals
  }, [gridSchedule, foodMap])

  // Validador de planes: Ajustar proporcionalmente los gramos de un día al objetivo calórico
  const adjustDayGramsToTarget = (dayIdx: number) => {
    const tot = dayTotals[dayIdx]
    if (!tot || tot.kcal <= 0 || precisionResults.targetKcal <= 0) return
    const ratio = precisionResults.targetKcal / tot.kcal
    setGridSchedule((prev) => {
      const next: any = {}
      MEAL_TYPES.forEach((m) => {
        next[m.type] = { ...prev[m.type] }
        const items = next[m.type][dayIdx] || []
        next[m.type][dayIdx] = items.map((it: any) => ({
          ...it,
          quantityG: Math.max(5, Math.round((it.quantityG * ratio) / 5) * 5),
        }))
      })
      return next
    })
  }

  const adjustAllDaysGramsToTarget = () => {
    if (precisionResults.targetKcal <= 0) return
    setGridSchedule((prev) => {
      const next: any = {}
      MEAL_TYPES.forEach((m) => {
        next[m.type] = { ...prev[m.type] }
      })
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const tot = dayTotals[dayIdx]
        if (!tot || tot.kcal <= 0) continue
        const ratio = precisionResults.targetKcal / tot.kcal
        MEAL_TYPES.forEach((m) => {
          const items = next[m.type][dayIdx] || []
          next[m.type][dayIdx] = items.map((it: any) => ({
            ...it,
            quantityG: Math.max(5, Math.round((it.quantityG * ratio) / 5) * 5),
          }))
        })
      }
      return next
    })
  }

  // --- ACTIONS: RENAME DAY ---
  function handleRenameDay(index: number, newName: string) {
    const updated = [...dayNames]
    updated[index] = newName
    setDayNames(updated)
  }

  // --- ACTIONS: UPDATE FOOD QUANTITY DIRECTLY IN TABLE CELL ---
  function handleUpdateQuantity(mealType: string, dayIndex: number, itemIndex: number, newGrams: number) {
    const updated = { ...gridSchedule }
    const cellItems = [...(updated[mealType]?.[dayIndex] || [])]
    if (cellItems[itemIndex]) {
      cellItems[itemIndex] = { ...cellItems[itemIndex], quantityG: newGrams }
      updated[mealType][dayIndex] = cellItems
      setGridSchedule(updated)
    }
  }

  // --- ACTIONS: REMOVE ITEM FROM CELL ---
  function handleRemoveItem(mealType: string, dayIndex: number, itemIndex: number) {
    const updated = { ...gridSchedule }
    const cellItems = [...(updated[mealType]?.[dayIndex] || [])]
    cellItems.splice(itemIndex, 1)
    updated[mealType][dayIndex] = cellItems
    setGridSchedule(updated)
  }

  // --- ACTIONS: COPY ITEM TO CLIPBOARD ---
  function handleCopyItem(item: GridItem) {
    const food = foodMap.get(item.foodId)
    setCopiedItem({
      foodId: item.foodId,
      quantityG: item.quantityG,
      notes: item.notes,
    })
    setCopiedItemName(food?.name || 'Alimento')
  }

  // --- ACTIONS: PASTE CLIPBOARD ITEM INTO CELL ---
  function handlePasteItem(mealType: string, dayIndex: number) {
    if (!copiedItem) return
    const updated = { ...gridSchedule }
    const cellItems = [...(updated[mealType]?.[dayIndex] || [])]
    cellItems.push({
      uid: `pasted-${Date.now()}-${Math.random()}`,
      foodId: copiedItem.foodId,
      quantityG: copiedItem.quantityG,
      notes: copiedItem.notes,
    })
    updated[mealType][dayIndex] = cellItems
    setGridSchedule(updated)
  }

  // --- ACTIONS: ADD FOOD FROM SEARCH MODAL WITH ALLERGEN INTERCEPTION ---
  function handleSelectFoodForCell(food: FoodOption, bypassWarning = false) {
    if (!modalTarget) return
    const { mealType, dayIndex } = modalTarget

    // Clinical Allergen Interception: warn immediately if patient has allergy/intolerance
    if (!bypassWarning && selectedPatient) {
      const conflict = checkPatientAllergenConflict(food, selectedPatient)
      if (conflict) {
        setAllergenWarningTarget({
          food,
          conflict,
        })
        return
      }
    }

    const updated = { ...gridSchedule }
    const cellItems = [...(updated[mealType]?.[dayIndex] || [])]

    cellItems.push({
      uid: `new-${Date.now()}-${Math.random()}`,
      foodId: food.id,
      quantityG: 100,
      notes: 'Preparación al gusto',
    })

    updated[mealType][dayIndex] = cellItems
    setGridSchedule(updated)
    setModalTarget(null)
    setFoodSearchQuery('')
    setAllergenWarningTarget(null)
  }

  // --- ACTIONS: DRAG AND DROP HANDLERS ---
  function handleDragStart(mealType: string, dayIndex: number, itemIndex: number) {
    setDraggedInfo({ mealType, dayIndex, itemIndex })
  }

  function handleDrop(targetMealType: string, targetDayIndex: number) {
    if (!draggedInfo) return
    const { mealType: fromMeal, dayIndex: fromDay, itemIndex: fromIdx } = draggedInfo

    if (fromMeal === targetMealType && fromDay === targetDayIndex) {
      setDraggedInfo(null)
      return
    }

    const updated = { ...gridSchedule }
    const sourceItems = [...(updated[fromMeal]?.[fromDay] || [])]
    const [movedItem] = sourceItems.splice(fromIdx, 1)

    if (movedItem) {
      const targetItems = [...(updated[targetMealType]?.[targetDayIndex] || [])]
      targetItems.push({
        ...movedItem,
        uid: `moved-${Date.now()}-${Math.random()}`,
      })

      updated[fromMeal][fromDay] = sourceItems
      updated[targetMealType][targetDayIndex] = targetItems
      setGridSchedule(updated)
    }

    setDraggedInfo(null)
  }

  // Search filtered foods for modal
  const filteredFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return foods.slice(0, 30)
    const q = foodSearchQuery.toLowerCase()
    return foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 30)
  }, [foods, foodSearchQuery])

  // --- SUBMIT FINAL PLAN ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) {
      alert('Por favor selecciona un paciente.')
      return
    }

    setLoading(true)
    try {
      const daysData = []
      for (let d = 0; d < 7; d++) {
        const meals = MEAL_TYPES.map((m) => ({
          mealType: m.type,
          order: m.order,
          items: (gridSchedule[m.type]?.[d] || []).map((it) => ({
            foodId: it.foodId,
            quantityG: it.quantityG,
            notes: it.notes || undefined,
          })),
        }))

        daysData.push({
          dayNumber: d + 1,
          customName: dayNames[d] || `Día ${d + 1}`,
          meals,
        })
      }

      await createMealPlan({
        patientId,
        name: name || `Pauta Semanal de ${selectedPatient?.firstName || 'Paciente'}`,
        startDate,
        targetKcal: precisionResults.targetKcal,
        targetProteinG: precisionResults.targetProteinG,
        targetCarbsG: precisionResults.targetCarbsG,
        targetFatG: precisionResults.targetFatG,
        notes: generalNotes,
        hideCaloriesTCA: isTCA,
        isGLP1: isGLP1,
        daysCount: 7,
        daysData,
      })

      router.push('/dashboard/plans')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al guardar el plan.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* 1. CALCULADORA DE PRECISIÓN CLÍNICA Y BOTÓN DE GENERACIÓN INTELIGENTE */}
      <Card className="rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-5 bg-gradient-to-r from-blue-50/90 to-sky-50/40 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <CardTitle className="text-sm flex items-center gap-2 text-blue-950 font-bold">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span>Calculadora Nutricional de Precisión Clínica</span>
              </CardTitle>
              <CardDescription className="text-[11px] text-blue-900/70">
                Ajustes biométricos por paciente: Katch-McArdle, Mifflin-St Jeor, Harris-Benedict y distribución de macros en g/kg.
              </CardDescription>
            </div>

            {/* ACTION: GENERAR PLAN BASE AUTOMÁTICO */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleAutoGeneratePlan}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 px-3 flex items-center gap-1.5 shadow-xs"
                title="Genera una semana completa de alimentos reales ajustados exactamente al objetivo del paciente"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>Generar Plan Base Automático</span>
              </Button>

              {selectedPatient && (
                <Badge variant="default" className="bg-blue-100 text-blue-900 border-0 text-xs py-1 px-2.5 font-bold">
                  <User className="h-3 w-3 mr-1 text-blue-700" />
                  <span>{selectedPatient.firstName} {selectedPatient.lastName}</span>
                </Badge>
              )}
            </div>
          </div>

        </CardHeader>

        <CardContent className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs font-bold text-gray-700">Paciente *</Label>
              <Select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="h-8 text-xs font-semibold"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.latestWeightKg} kg • {OBJECTIVE_LABELS[p.objective as Objective] || p.objective})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Título del Plan *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Pauta Semanal Personalizada"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Fecha de Inicio *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* ALERTA CLÍNICA FÁRMACO-NUTRIENTE EN TIEMPO REAL */}
          {drugAlerts.length > 0 && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Interacción Fármaco-Alimento ({drugAlerts.map((a) => a.drugName).join(', ')}):</span>
              </div>
              <p className="text-2xs text-rose-800 leading-relaxed">
                {drugAlerts.map((a) => a.clinicalRecommendation).join(' ')}
              </p>
            </div>
          )}

          {/* SELECTORES DE PROTOCOLOS ESPECIALES (GLP-1, TCA, INTERCAMBIOS) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-700 hover:text-amber-900">
                <input
                  type="checkbox"
                  checked={isGLP1}
                  onChange={(e) => {
                    const val = e.target.checked
                    setIsGLP1(val)
                    if (val) {
                      setProteinGPerKg(Math.max(1.5, proteinGPerKg))
                    }
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                />
                <Pill className="h-3.5 w-3.5 text-amber-600" />
                <span>Protocolo GLP-1 (Ozempic/Wegovy)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-700 hover:text-purple-900">
                <input
                  type="checkbox"
                  checked={isTCA}
                  onChange={(e) => setIsTCA(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
                />
                <EyeOff className="h-3.5 w-3.5 text-purple-600" />
                <span>Modo Privacidad TCA (Sin Gramos/Kcal)</span>
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowExchangesModal(true)}
              className="h-7 text-xs gap-1.5 rounded-lg border-blue-300 text-blue-800 hover:bg-blue-50 font-bold"
            >
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>Ver Tabla de Intercambios (CESNID)</span>
            </Button>
          </div>

          {/* Quick Precision Tuners */}
          <div className="p-2.5 bg-gray-50 border rounded-xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-gray-600 block">Peso (kg)</span>
              <Input
                type="number"
                step="any"
                value={calcWeightKg}
                onChange={(e) => setCalcWeightKg(parseFloat(e.target.value) || 70)}
                className="h-7 text-xs font-bold"
              />
            </div>

            <div>
              <span className="text-[10px] font-semibold text-gray-600 block">Altura (cm)</span>
              <Input
                type="number"
                step="any"
                value={calcHeightCm}
                onChange={(e) => setCalcHeightCm(parseFloat(e.target.value) || 170)}
                className="h-7 text-xs font-bold"
              />
            </div>

            <div>
              <span className="text-[10px] font-semibold text-gray-600 block">% Grasa</span>
              <Input
                type="number"
                step="any"
                value={calcBodyFatPct}
                onChange={(e) => setCalcBodyFatPct(parseFloat(e.target.value) || 20)}
                className="h-7 text-xs font-bold"
              />
            </div>

            <div>
              <span className="text-[10px] font-semibold text-gray-600 block">Fórmula TMB</span>
              <Select
                value={calcFormula}
                onChange={(e) => setCalcFormula(e.target.value as any)}
                className="h-7 text-xs font-semibold"
              >
                <option value="katch">Katch-McArdle (Masa Magra)</option>
                <option value="mifflin">Mifflin-St Jeor</option>
                <option value="harris">Harris-Benedict</option>
                <option value="cunningham">Cunningham</option>
              </Select>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-gray-600 block">Actividad</span>
              <Select
                value={calcPal.toString()}
                onChange={(e) => setCalcPal(parseFloat(e.target.value))}
                className="h-7 text-xs font-semibold"
              >
                <option value="1.2">Sedentario (1.20)</option>
                <option value="1.375">Ligero (1.375)</option>
                <option value="1.55">Moderado (1.55)</option>
                <option value="1.725">Activo (1.725)</option>
                <option value="1.9">Muy Activo (1.90)</option>
              </Select>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-gray-600 block">Ajuste Kcal</span>
              <Select
                value={calcDeficit.toString()}
                onChange={(e) => setCalcDeficit(parseInt(e.target.value))}
                className="h-7 text-xs font-semibold"
              >
                <option value="-600">-600 kcal</option>
                <option value="-500">-500 kcal</option>
                <option value="-300">-300 kcal</option>
                <option value="0">0 kcal (Normo)</option>
                <option value="250">+250 kcal</option>
                <option value="400">+400 kcal</option>
              </Select>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-gray-600 block">Prot (g/kg)</span>
              <Input
                type="number"
                step="any"
                value={proteinGPerKg}
                onChange={(e) => setProteinGPerKg(parseFloat(e.target.value) || 2.0)}
                className="h-7 text-xs font-bold text-blue-700"
              />
            </div>

            <div>
              <span className="text-[10px] font-semibold text-amber-800 block">Suelo Kcal</span>
              <Input
                type="number"
                step="50"
                min="800"
                max="2500"
                value={minCaloricSafetyKcal}
                onChange={(e) => setMinCaloricSafetyKcal(parseInt(e.target.value) || 1200)}
                className="h-7 text-xs font-bold text-amber-700 bg-amber-50/50"
                title="Mínimo de seguridad calórica clínica"
              />
            </div>

            {/* Target Output Badge */}
            <div className="bg-blue-100/70 p-1 rounded border border-blue-200 text-center flex flex-col justify-center">
              <span className="text-[9px] font-bold text-blue-800 uppercase block">Meta Diaria</span>
              <span className="text-sm font-black text-blue-950 leading-tight">{precisionResults.targetKcal} kcal</span>
              <span className="text-[9px] text-blue-700 font-semibold">{precisionResults.targetProteinG}g P • {precisionResults.targetCarbsG}g C</span>
            </div>
          </div>

          {/* Alert Notice for Auto-generated plan */}
          {autoGenNotice && (
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <span>{autoGenNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoGenNotice(null)}
                className="text-blue-700 hover:text-blue-900 text-[11px] underline"
              >
                Cerrar
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PLANTILLAS DIETÉTICAS CLÍNICAS DE 1 CLIC */}
      <Card className="rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-white to-sky-50/40 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-5 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold text-blue-950 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Plantillas Dietéticas Clínicas de 1 Clic</span>
              <Badge className="bg-blue-600 text-white border-0 text-[10px] font-black uppercase rounded-full px-2 py-0.5">
                Auto-Escalado Proporcional
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-blue-900/80">
              Menús completos prediseñados que escalan automáticamente todos los gramos al objetivo de <strong>{precisionResults.targetKcal} kcal</strong> del paciente.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CLINICAL_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tmpl.id)}
                className="group p-3.5 rounded-2xl bg-white border border-blue-200/90 hover:border-blue-600 hover:shadow-md text-left transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200 rounded-lg">
                      {tmpl.badge}
                    </Badge>
                    <span className="text-[11px] text-blue-600 font-black group-hover:scale-105 transition-transform">
                      1 Clic ⚡
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {tmpl.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-semibold text-gray-600">
                  <span>{tmpl.macroRatio.proteinPct}% P • {tmpl.macroRatio.carbsPct}% C</span>
                  <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                    {precisionResults.targetKcal} kcal
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. PORTAPAPELES INTERNO CON 1 CLIC (SI HAY ELEMENTO COPIADO) */}

      {copiedItem && (
        <div className="bg-blue-50 border border-blue-300 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-blue-900 font-semibold">
            <Copy className="h-4 w-4 text-blue-600" />
            <span>Alimento en memoria:</span>
            <span className="font-extrabold underline">{copiedItemName} ({copiedItem.quantityG}g)</span>
            <span className="text-blue-700 text-[11px]">→ Haz clic en "Pegar" en cualquier celda de la tabla para duplicarlo al instante.</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCopiedItem(null)}
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-900"
          >
            <X className="h-3 w-3 mr-1" />
            <span>Descartar</span>
          </Button>
        </div>
      )}

      {/* 2.5. ALERTA CLÍNICA CRÍTICA DE ALÉRGENOS DEL PACIENTE */}
      {planAllergenConflicts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-4 shadow-md space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-red-950 flex items-center gap-1.5">
                  🚨 ALERTA CRÍTICA: {planAllergenConflicts.length} ALIMENTO{planAllergenConflicts.length > 1 ? 'S' : ''} INCOMPATIBLE{planAllergenConflicts.length > 1 ? 'S' : ''} CON ALÉRGENOS DEL PACIENTE
                </h3>
                <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                  Riesgo Médico Grave
                </span>
              </div>
              <p className="text-xs text-red-900 mt-1">
                El paciente <strong>{selectedPatient?.firstName} {selectedPatient?.lastName}</strong> tiene registrado en su expediente:
                <span className="font-extrabold underline ml-1">
                  {[selectedPatient?.allergies && `Alergias: ${selectedPatient.allergies}`, selectedPatient?.intolerances && `Intolerancias: ${selectedPatient.intolerances}`].filter(Boolean).join(' • ')}
                </span>
                . Se han detectado alimentos en la pauta que representan un peligro alérgico directo:
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {planAllergenConflicts.map((c, i) => (
                  <div key={i} className="text-xs font-bold bg-white text-red-950 px-3 py-1.5 rounded-xl border-2 border-red-300 shadow-xs flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
                    <span className="font-black text-red-900">{c.foodName}</span>
                    <span className="text-[10px] text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded">
                      {c.conflict.allergenLabel} • {c.mealLabel} ({c.dayName})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LA GRAN TABLA SEMANAL INTERACTIVA (AJUSTADA AL 100% DE LA PANTALLA SIN SCROLL LATERAL) */}
      <Card className="rounded-3xl shadow-xs border border-gray-200 overflow-hidden">
        <CardHeader className="py-2.5 px-4 bg-gray-50/80 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-green-600" />
            <CardTitle className="text-sm font-black text-gray-900">
              Pauta Semanal en Cuadrícula (7 Días Visibles • Arrastrar y Soltar • Edición Directa de Gramos)
            </CardTitle>
          </div>

          <span className="text-[11px] font-semibold text-gray-500 hidden md:inline">
            💡 Haz clic en el nombre de cualquier día para renombrarlo
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full">
            {/* TABLE-FIXED W-FULL: Guarantees 100% screen fit without horizontal scrolling */}
            <table className="w-full table-fixed border-collapse text-left">
              {/* TABLE HEADER: EDITABLE DAY NAMES */}
              <thead>
                <tr className="bg-gray-900 text-white border-b border-gray-800 text-xs">
                  {/* Meal Header Column (Fixed 96px width) */}
                  <th className="py-2.5 px-1.5 w-24 uppercase font-black text-[10px] tracking-wider text-green-400 bg-black/50 text-center">
                    Toma
                  </th>

                  {/* 7 Days Columns: Equal 1/7 width slice each */}
                  {dayNames.map((dName, dayIdx) => (
                    <th key={dayIdx} className="py-1.5 px-1 border-l border-gray-800 text-center">
                      <div className="space-y-0.5">
                        <input
                          type="text"
                          value={dName}
                          onChange={(e) => handleRenameDay(dayIdx, e.target.value)}
                          className="w-full text-center font-bold text-xs bg-gray-800/90 hover:bg-gray-800 text-white rounded px-1 py-0.5 focus:bg-white focus:text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-400 transition-colors"
                          title="Haz clic para cambiar el nombre de este día"
                        />
                        <div className="text-[9px] text-gray-400 font-normal">
                          Día {dayIdx + 1}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TABLE BODY: MEALS ROWS */}
              <tbody className="divide-y divide-gray-200 text-xs">
                {MEAL_TYPES.map((meal) => (
                  <tr key={meal.type} className="hover:bg-gray-50/30 transition-colors">
                    {/* Meal Type Label */}
                    <td className="py-2.5 px-1.5 bg-gray-50 border-r border-gray-200 font-black text-gray-900 uppercase text-[10px] tracking-wider text-center">
                      <span>{meal.label}</span>
                    </td>

                    {/* 7 Days Cells for this Meal */}
                    {dayNames.map((_, dayIdx) => {
                      const cellItems = gridSchedule[meal.type]?.[dayIdx] || []

                      let cellKcal = 0
                      cellItems.forEach((it) => {
                        const food = foodMap.get(it.foodId)
                        if (food && it.quantityG > 0) {
                          cellKcal += food.calories * (it.quantityG / 100)
                        }
                      })

                      return (
                        <td
                          key={dayIdx}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(meal.type, dayIdx)}
                          className="py-1.5 px-1 border-l border-gray-200 align-top bg-white transition-colors hover:bg-green-50/20"
                        >
                          <div className="space-y-1 min-h-[75px] flex flex-col justify-between">
                            {/* Food items inside this cell */}
                            <div className="space-y-1">
                              {cellItems.map((it, itIdx) => {
                                const food = foodMap.get(it.foodId)
                                const imageUrl = food ? getFoodImage(food) : ''
                                const kcal = food ? Math.round(food.calories * (it.quantityG / 100)) : 0
                                const itemConflict = food && selectedPatient ? checkPatientAllergenConflict(food, selectedPatient) : null

                                return (
                                  <div
                                    key={it.uid || itIdx}
                                    draggable={true}
                                    onDragStart={() => handleDragStart(meal.type, dayIdx, itIdx)}
                                    className={`p-1 rounded transition-all cursor-grab active:cursor-grabbing group relative ${
                                      itemConflict
                                        ? 'bg-red-50/95 border-2 border-red-400 shadow-xs ring-1 ring-red-400'
                                        : 'bg-gray-50 border border-gray-200 hover:border-green-400 hover:shadow-2xs'
                                    }`}
                                    title={itemConflict ? itemConflict.alertMessage : 'Arrastra para mover este alimento a otro día u otra comida'}
                                  >
                                    <div className="flex items-center gap-1 min-w-0">
                                      <GripVertical className="h-2.5 w-2.5 text-gray-400 group-hover:text-green-600 shrink-0" />

                                      {/* Food Photo Thumbnail */}
                                      <div className={`h-6 w-6 rounded overflow-hidden shrink-0 border ${itemConflict ? 'border-red-300' : 'border-gray-200 bg-gray-200'}`}>
                                        <img
                                          src={imageUrl}
                                          alt={food?.name || 'Alimento'}
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null
                                            e.currentTarget.src = FALLBACK_FOOD_SVG
                                          }}
                                        />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                          <span className={`font-bold text-[10px] block truncate leading-tight ${itemConflict ? 'text-red-950 font-black' : 'text-gray-900'}`}>
                                            {food?.name || 'Alimento'}
                                          </span>
                                          {itemConflict && (
                                            <span className="shrink-0 px-1 py-0.2 rounded text-[7.5px] font-black bg-red-600 text-white shadow-2xs">
                                              🚨 {itemConflict.allergenLabel}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                          {/* Quantity Grams Inline Input */}
                                          <div className="flex items-center gap-0.5">
                                            <input
                                              type="number"
                                              step="any"
                                              value={it.quantityG}
                                              onChange={(e) =>
                                                handleUpdateQuantity(
                                                  meal.type,
                                                  dayIdx,
                                                  itIdx,
                                                  parseFloat(e.target.value) || 0
                                                )
                                              }
                                              className="w-10 text-center text-[9px] font-black bg-white border border-gray-300 rounded px-0.5 py-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                                            />
                                            <span className="text-[9px] text-gray-400">g</span>
                                          </div>

                                          <span className="text-[9px] font-bold text-gray-700">
                                            {kcal}k
                                          </span>
                                        </div>
                                      </div>

                                      {/* Quick Actions (Copy / Remove) */}
                                      <div className="flex flex-col gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                                        <button
                                          type="button"
                                          onClick={() => handleCopyItem(it)}
                                          className="text-gray-400 hover:text-green-700 p-0.5"
                                          title="Copiar alimento"
                                        >
                                          <Copy className="h-2 w-2" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveItem(meal.type, dayIdx, itIdx)}
                                          className="text-gray-400 hover:text-rose-600 p-0.5"
                                          title="Eliminar alimento"
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Cell Bottom Controls (Add & Paste) */}
                            <div className="pt-0.5 flex items-center justify-between border-t border-gray-100 gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalTarget({ mealType: meal.type, dayIndex: dayIdx })
                                  setFoodSearchQuery('')
                                }}
                                className="text-[9px] font-bold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                              >
                                <Plus className="h-2 w-2" />
                                <span>Añadir</span>
                              </button>

                              {copiedItem && (
                                <button
                                  type="button"
                                  onClick={() => handlePasteItem(meal.type, dayIdx)}
                                  className="text-[9px] font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                                  title="Pegar alimento copiado aquí"
                                >
                                  <ClipboardPaste className="h-2 w-2" />
                                  <span>Pegar</span>
                                </button>
                              )}

                              <span className="text-[9px] font-extrabold text-gray-400 ml-auto">
                                {Math.round(cellKcal)}k
                              </span>
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>

              {/* TABLE FOOTER: DAY-BY-DAY TOTALS */}
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 text-xs">
                  <td className="py-2 px-1.5 uppercase font-black text-gray-900 text-center bg-gray-200 text-[10px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>Total Día</span>
                      <button
                        type="button"
                        onClick={adjustAllDaysGramsToTarget}
                        title={`Ajustar proporcionalmente todos los días a ${precisionResults.targetKcal} kcal`}
                        className="text-[8px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-1.5 py-0.5 rounded shadow-2xs whitespace-nowrap transition-colors"
                      >
                        Ajustar Todos
                      </button>
                    </div>
                  </td>

                  {dayTotals.map((tot, dayIdx) => {
                    const diff = tot.kcal - precisionResults.targetKcal
                    const isOptimal = Math.abs(diff) <= 50
                    const isAcceptable = Math.abs(diff) <= 120

                    return (
                      <td key={dayIdx} className="py-2 px-1 border-l border-gray-300 text-center">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-center gap-0.5 font-black text-xs text-gray-900">
                            <Flame className={`h-3 w-3 ${isOptimal ? 'text-blue-600' : isAcceptable ? 'text-amber-500' : 'text-rose-600'}`} />
                            <span>{tot.kcal}</span>
                            <span className="text-[9px] text-gray-500 font-normal">k</span>
                          </div>

                          <div className="text-[9px] font-bold text-gray-600">
                            <span className="text-blue-700">{tot.prot}P</span> •{' '}
                            <span className="text-amber-700">{tot.carbs}C</span> •{' '}
                            <span className="text-rose-700">{tot.fat}G</span>
                          </div>

                          <Badge
                            variant="default"
                            className={`text-[8px] py-0 px-1 ${
                              isOptimal
                                ? 'bg-blue-100 text-blue-800'
                                : isAcceptable
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {diff === 0 ? 'Meta' : diff > 0 ? `+${diff}` : diff}k
                          </Badge>

                          <div>
                            <button
                              type="button"
                              onClick={() => adjustDayGramsToTarget(dayIdx)}
                              title={`Ajustar gramos de este día al objetivo (${precisionResults.targetKcal} kcal)`}
                              className="mt-0.5 text-[8px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-1 py-0.5 rounded whitespace-nowrap transition-colors"
                            >
                              🎯 Ajustar
                            </button>
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. NOTAS CLÍNICAS Y PAUTAS GENERALES PARA EL PACIENTE */}
      <Card className="shadow-sm">
        <CardHeader className="py-2.5 px-4 border-b bg-gray-50/50">
          <CardTitle className="text-xs font-bold flex items-center gap-2 text-gray-900">
            <FileText className="h-4 w-4 text-green-600" />
            <span>Notas Clínicas, Pautas de Hidratación y Recomendaciones Generales</span>
          </CardTitle>
          <CardDescription className="text-[11px]">
            Estas notas aparecerán ordenadas en la portada y encabezado del informe PDF entregado al paciente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <Textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={2}
            placeholder="Indicaciones sobre suplementación, horarios de tomas, pautas de intercambio..."
            className="text-xs text-gray-700 leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* 5. MODAL DE BÚSQUEDA RÁPIDA DE ALIMENTOS */}
      {modalTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-3.5 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-extrabold text-xs text-gray-900">
                  Añadir Alimento a la Tabla
                </h3>
                <p className="text-[10px] text-gray-500">
                  {MEAL_TYPES.find((m) => m.type === modalTarget.mealType)?.label} • {dayNames[modalTarget.dayIndex]}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar entre los más de 1.000 alimentos (pollo, avena, salmón...)"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  autoFocus
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* List of Foods with HD Photos */}
            <div className="overflow-y-auto divide-y divide-gray-100 flex-1 p-2 space-y-1">
              {filteredFoods.map((food) => {
                const imageUrl = getFoodImage(food)
                const conflict = selectedPatient ? checkPatientAllergenConflict(food, selectedPatient) : null

                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFoodForCell(food)}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors group ${
                      conflict
                        ? 'bg-red-50/90 border-2 border-red-400 hover:bg-red-100/90'
                        : 'hover:bg-green-50/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className={`h-8 w-8 rounded-lg overflow-hidden shrink-0 border ${conflict ? 'border-red-300' : 'border-gray-200 bg-gray-100'}`}>
                        <img
                          src={imageUrl}
                          alt={food.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = FALLBACK_FOOD_SVG
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs block ${conflict ? 'text-red-950 font-black' : 'text-gray-900 group-hover:text-green-800'}`}>
                            {food.name}
                          </span>
                          {conflict && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white font-black text-[9px] tracking-wide inline-flex items-center gap-0.5 shadow-xs">
                              🚨 ALÉRGENO: {conflict.allergenLabel.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] block ${conflict ? 'text-red-700 font-semibold' : 'text-gray-400'}`}>
                          {food.category || 'General'}
                          {conflict && ` • ⚠️ Incompatible con ${selectedPatient?.firstName}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[10px] shrink-0">
                      <span className={`font-black block ${conflict ? 'text-red-950' : 'text-gray-900'}`}>{food.calories} kcal</span>
                      <span className="text-[9px] text-gray-500">{food.proteinG}P • {food.carbsG}C • {food.fatG}G</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="p-2.5 border-t bg-gray-50 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalTarget(null)}
                className="text-xs h-7"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5.5. MODAL DE CONFIRMACIÓN CLÍNICA ANTE ALÉRGENOS DEL PACIENTE */}
      {allergenWarningTarget && (
        <div className="fixed inset-0 bg-red-950/70 z-[70] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-red-500 animate-in zoom-in-95 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-red-950 tracking-tight">
                {allergenWarningTarget.conflict.alertTitle}
              </h3>
              <p className="text-xs text-red-900/90 mt-2 font-medium leading-relaxed">
                {allergenWarningTarget.conflict.alertMessage}
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold">Alimento:</span>
                <span className="font-extrabold text-gray-900">{allergenWarningTarget.food.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold">Alérgeno detectado:</span>
                <span className="font-extrabold text-red-700">{allergenWarningTarget.conflict.allergenLabel} ({allergenWarningTarget.conflict.matchedFoodTerm})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold">Ficha del paciente:</span>
                <span className="font-extrabold text-red-700">{selectedPatient?.firstName}: {allergenWarningTarget.conflict.severity === 'CRITICAL_ALLERGY' ? 'Alergia Médica Registrada' : 'Intolerancia Registrada'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAllergenWarningTarget(null)}
                className="flex-1 border-gray-300 font-bold text-gray-700 hover:bg-gray-100 text-xs h-9"
              >
                Cancelar (Recomendado)
              </Button>
              <Button
                type="button"
                onClick={() => handleSelectFoodForCell(allergenWarningTarget.food, true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs h-9 shadow-md shadow-red-600/20"
              >
                Añadir de todos modos
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL SISTEMA DE INTERCAMBIOS (CESNID / SEEDO) */}
      {showExchangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
            <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-700" />
                <div>
                  <h3 className="font-black text-sm text-gray-900">
                    Sistema Clínico de Intercambios de Alimentos (Estilo EasyDiet / CESNID)
                  </h3>
                  <p className="text-2xs text-gray-600">
                    Equivalencias nutricionales estándar para flexibilizar la dieta del paciente sin desajustar sus macronutrientes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExchangesModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {Object.values(FOOD_EXCHANGE_GROUPS).map((group) => (
                <div key={group.id} className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-black ${group.badgeBg} ${group.badgeText}`}>
                      {group.name}
                    </span>
                    <span className="text-2xs text-gray-500 font-bold">
                      {group.baseUnitDefinition}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {group.examples.map((ex, i) => (
                      <div key={i} className="p-2 rounded-xl bg-white border border-gray-100 shadow-2xs">
                        <span className="text-gray-900 font-bold block truncate">{ex.food}</span>
                        <span className="text-blue-700 font-extrabold text-2xs block">{ex.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t bg-gray-50 flex justify-end">
              <Button
                type="button"
                onClick={() => setShowExchangesModal(false)}
                className="bg-gray-900 hover:bg-black text-white text-xs rounded-xl font-bold"
              >
                Cerrar Guía
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT BUTTONS */}
      <div className="flex items-center justify-between pt-3 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/plans')}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="min-w-[200px] bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold text-xs h-9"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Guardando Plan...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 mr-2" />
              Guardar Pauta Semanal
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
