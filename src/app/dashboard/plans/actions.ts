'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import type { MenuSettings } from '@/lib/menu-config'
import { assertFoodIdsAccessible, assertRecipeIdsOwned } from '@/lib/authorization'
import { scanPlanForAllergenConflicts } from '@/lib/nutrition/allergens'
import { validateMenuSettings } from '@/lib/menu-settings-validation'

async function getDefaultUserId(): Promise<string> {
  return requireUserId()
}

const PLAN_MEAL_TYPES = new Set([
  'BREAKFAST',
  'MID_MORNING',
  'LUNCH',
  'SNACK',
  'DINNER',
  'LATE_SNACK',
  'OTHER',
])
const PLAN_TIMING_TYPES = new Set(['REGULAR', 'PRE_WORKOUT', 'POST_WORKOUT'])
const PLAN_MODELS = new Set(['TRADITIONAL', 'KETO', 'GLP1', 'FLEXIBLE', 'OTHER'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readPlanNumber(
  value: unknown,
  label: string,
  min: number,
  max: number,
  options: { integer?: boolean } = {}
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} debe ser un número válido.`)
  }
  if (value < min || value > max) throw new Error(`${label} debe estar entre ${min} y ${max}.`)
  if (options.integer && !Number.isInteger(value)) throw new Error(`${label} debe ser un número entero.`)
  return value
}

function readOptionalPlanNumber(
  value: unknown,
  label: string,
  min: number,
  max: number
): number | null {
  if (value === undefined || value === null || value === '') return null
  return readPlanNumber(value, label, min, max)
}

function readOptionalPlanString(value: unknown, label: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new Error(`${label} debe ser texto.`)
  const normalized = value.trim()
  if (!normalized) return null
  if (normalized.length > maxLength) throw new Error(`${label} supera el tamaño máximo permitido.`)
  return normalized
}

function readPlanDate(value: unknown, label: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} no es una fecha válida.`)
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} no es una fecha válida.`)
  }
  return date
}

function readOptionalPlanDate(value: unknown, label: string): Date | null {
  if (value === undefined || value === null || value === '') return null
  return readPlanDate(value, label)
}

export async function getMealPlans() {
  const userId = await requireUserId()
  return await prisma.mealPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: true,
      days: {
        include: {
          meals: {
            include: {
              items: {
                include: {
                  food: true,
                  recipe: {
                    include: {
                      ingredients: {
                        include: { food: true },
                        orderBy: { id: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function getMealPlan(id: string) {
  const userId = await requireUserId()
  return await prisma.mealPlan.findFirst({
    where: { id, userId },
    include: {
      patient: true,
      days: {
        orderBy: { dayNumber: 'asc' },
        include: {
          meals: {
            orderBy: { order: 'asc' },
            include: {
              items: {
                include: {
                  food: true,
                  recipe: {
                    include: {
                      ingredients: {
                        include: { food: true },
                        orderBy: { id: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

export interface CreateMealPlanInput {
  patientId: string
  name: string
  startDate: string
  endDate?: string
  targetKcal: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  notes?: string
  hideCaloriesTCA?: boolean
  isGLP1?: boolean
  planningModel?: string
  currentPhase?: string
  autoTransitionDate?: string
  targetKcalRest?: number
  targetCarbsGRest?: number
  targetProteinGRest?: number
  targetFatGRest?: number
  targetKcalMin?: number
  targetKcalMax?: number
  targetProteinGMin?: number
  targetProteinGMax?: number
  hydrationTargetLiters?: number
  eatingOutGuide?: string
  daysCount: number
  daysData: {
    dayNumber: number
    customName?: string
    meals: {
      mealType: string
      order: number
      isOptionB?: boolean
      optionGroup?: string
      isCheatMeal?: boolean
      timingType?: string
      items: {
        foodId?: number
        recipeId?: string
        quantityG: number
        servings?: number
        exchangeServings?: number
        exchangeGroup?: string
        portionMeasureName?: string
        portionMeasureGrams?: number
        isAlternative?: boolean
        notes?: string
      }[]
    }[]
  }[]
  /** Configuración del menú (objetivos, tolerancia, reparto, keto, micros). */
  menuSettings?: MenuSettings
}

export async function createMealPlan(input: CreateMealPlanInput) {
  const userId = await getDefaultUserId()
  if (!input || typeof input !== 'object' || typeof input.patientId !== 'string' || !input.patientId) {
    throw new Error('Los datos del plan no son válidos.')
  }
  if (
    !await prisma.patient.findFirst({
      where: { id: input.patientId, userId, isActive: true, isHardDeleted: false },
      select: { id: true },
    })
  ) {
    throw new Error('Paciente no encontrado o archivado.')
  }

  const name = readOptionalPlanString(input.name, 'El nombre del plan', 200)
  if (!name) throw new Error('El plan debe tener un nombre.')

  const rawDays: unknown = input.daysData
  if (!Array.isArray(rawDays) || rawDays.length === 0 || rawDays.length > 31) {
    throw new Error('El plan debe contener entre 1 y 31 días.')
  }
  if (
    input.daysCount !== undefined &&
    (!Number.isInteger(input.daysCount) || input.daysCount !== rawDays.length)
  ) {
    throw new Error('El número de días no coincide con el contenido del plan.')
  }

  const startDate = readPlanDate(input.startDate, 'La fecha de inicio')
  const endDate = readOptionalPlanDate(input.endDate, 'La fecha de fin')
  if (endDate && endDate.getTime() < startDate.getTime()) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.')
  }
  const autoTransitionDate = readOptionalPlanDate(
    input.autoTransitionDate,
    'La fecha de transición automática'
  )
  if (autoTransitionDate && autoTransitionDate.getTime() < startDate.getTime()) {
    throw new Error('La fecha de transición no puede ser anterior a la fecha de inicio.')
  }

  const targetKcal = readPlanNumber(input.targetKcal, 'El objetivo calórico', 1, 10_000)
  const targetProteinG = readPlanNumber(input.targetProteinG, 'El objetivo de proteína', 0, 2_000)
  const targetCarbsG = readPlanNumber(input.targetCarbsG, 'El objetivo de hidratos', 0, 2_000)
  const targetFatG = readPlanNumber(input.targetFatG, 'El objetivo de grasa', 0, 2_000)
  const targetKcalRest = readOptionalPlanNumber(input.targetKcalRest, 'El objetivo calórico de descanso', 0, 10_000)
  const targetCarbsGRest = readOptionalPlanNumber(input.targetCarbsGRest, 'Los hidratos de descanso', 0, 2_000)
  const targetProteinGRest = readOptionalPlanNumber(input.targetProteinGRest, 'La proteína de descanso', 0, 2_000)
  const targetFatGRest = readOptionalPlanNumber(input.targetFatGRest, 'La grasa de descanso', 0, 2_000)
  const targetKcalMin = readOptionalPlanNumber(input.targetKcalMin, 'El objetivo calórico mínimo', 0, 10_000)
  const targetKcalMax = readOptionalPlanNumber(input.targetKcalMax, 'El objetivo calórico máximo', 0, 10_000)
  const targetProteinGMin = readOptionalPlanNumber(input.targetProteinGMin, 'La proteína mínima', 0, 2_000)
  const targetProteinGMax = readOptionalPlanNumber(input.targetProteinGMax, 'La proteína máxima', 0, 2_000)
  if (targetKcalMin !== null && targetKcalMax !== null && targetKcalMin > targetKcalMax) {
    throw new Error('El rango calórico mínimo no puede ser mayor que el máximo.')
  }
  if (targetProteinGMin !== null && targetProteinGMax !== null && targetProteinGMin > targetProteinGMax) {
    throw new Error('El rango de proteína mínimo no puede ser mayor que el máximo.')
  }
  const hydrationTargetLiters =
    input.hydrationTargetLiters === undefined || input.hydrationTargetLiters === null
      ? 2
      : readPlanNumber(input.hydrationTargetLiters, 'El objetivo de hidratación', 0.5, 10)

  const planningModel = readOptionalPlanString(input.planningModel, 'El modelo de planificación', 40) || 'TRADITIONAL'
  if (!PLAN_MODELS.has(planningModel)) throw new Error('El modelo de planificación no es válido.')
  const currentPhase = readOptionalPlanString(input.currentPhase, 'La fase actual', 100)
  const notes = readOptionalPlanString(input.notes, 'Las notas del plan', 5_000)
  const eatingOutGuide = readOptionalPlanString(input.eatingOutGuide, 'La guía para comer fuera', 10_000)

  const rawMenuSettings: unknown = input.menuSettings
  const menuSettings = rawMenuSettings == null ? null : validateMenuSettings(rawMenuSettings)

  const seenDays = new Set<number>()
  const validatedDays = rawDays.map((dayValue, dayIndex) => {
    if (!isRecord(dayValue)) throw new Error(`El día ${dayIndex + 1} no tiene un formato válido.`)
    const dayNumber = readPlanNumber(dayValue.dayNumber, `El número del día ${dayIndex + 1}`, 1, 31, {
      integer: true,
    })
    if (seenDays.has(dayNumber)) throw new Error(`El día ${dayNumber} está duplicado.`)
    seenDays.add(dayNumber)

    const rawMeals = dayValue.meals
    if (!Array.isArray(rawMeals) || rawMeals.length > 20) {
      throw new Error(`El día ${dayNumber} contiene un número de ingestas no válido.`)
    }
    const seenOrders = new Set<number>()
    const meals = rawMeals.map((mealValue, mealIndex) => {
      if (!isRecord(mealValue)) {
        throw new Error(`La ingesta ${mealIndex + 1} del día ${dayNumber} no es válida.`)
      }
      const rawMealType = mealValue.mealType
      if (typeof rawMealType !== 'string' || !PLAN_MEAL_TYPES.has(rawMealType)) {
        throw new Error(`El tipo de ingesta del día ${dayNumber} no es válido.`)
      }
      const order = readPlanNumber(
        mealValue.order,
        `El orden de la ingesta del día ${dayNumber}`,
        0,
        20,
        { integer: true }
      )
      if (seenOrders.has(order)) {
        throw new Error(`El orden de las ingestas del día ${dayNumber} está duplicado.`)
      }
      seenOrders.add(order)

      const rawTiming = mealValue.timingType
      const timingType =
        rawTiming === undefined || rawTiming === null || rawTiming === ''
          ? 'REGULAR'
          : rawTiming
      if (typeof timingType !== 'string' || !PLAN_TIMING_TYPES.has(timingType)) {
        throw new Error(`El momento de la ingesta del día ${dayNumber} no es válido.`)
      }

      const rawItems = mealValue.items
      if (!Array.isArray(rawItems) || rawItems.length > 500) {
        throw new Error(`La ingesta del día ${dayNumber} contiene demasiadas líneas.`)
      }
      const items = rawItems.map((itemValue, itemIndex) => {
        if (!isRecord(itemValue)) {
          throw new Error(`La línea ${itemIndex + 1} del día ${dayNumber} no es válida.`)
        }
        const foodId =
          itemValue.foodId === undefined || itemValue.foodId === null || itemValue.foodId === ''
            ? null
            : readPlanNumber(itemValue.foodId, `El alimento de la línea ${itemIndex + 1}`, 1, 2_147_483_647, {
                integer: true,
              })
        const recipeId = readOptionalPlanString(
          itemValue.recipeId,
          `La receta de la línea ${itemIndex + 1}`,
          100
        )
        if ((foodId === null) === (recipeId === null)) {
          throw new Error('Cada línea del plan debe contener exactamente un alimento o una receta.')
        }

        return {
          foodId,
          recipeId,
          quantityG: readPlanNumber(
            itemValue.quantityG,
            `La cantidad de la línea ${itemIndex + 1}`,
            0.1,
            10_000
          ),
          servings:
            itemValue.servings === undefined || itemValue.servings === null
              ? 1
              : readPlanNumber(itemValue.servings, `Las raciones de la línea ${itemIndex + 1}`, 0.1, 100),
          exchangeServings: readOptionalPlanNumber(
            itemValue.exchangeServings,
            `Los intercambios de la línea ${itemIndex + 1}`,
            0,
            100
          ),
          exchangeGroup: readOptionalPlanString(
            itemValue.exchangeGroup,
            `El grupo de intercambio de la línea ${itemIndex + 1}`,
            50
          ),
          portionMeasureName: readOptionalPlanString(
            itemValue.portionMeasureName,
            `La medida de la línea ${itemIndex + 1}`,
            100
          ),
          portionMeasureGrams: readOptionalPlanNumber(
            itemValue.portionMeasureGrams,
            `Los gramos de la medida de la línea ${itemIndex + 1}`,
            0.1,
            10_000
          ),
          isAlternative: itemValue.isAlternative === true,
          notes: readOptionalPlanString(
            itemValue.notes,
            `Las notas de la línea ${itemIndex + 1}`,
            1_000
          ),
        }
      })

      return {
        mealType: rawMealType,
        order,
        isOptionB: mealValue.isOptionB === true,
        optionGroup: readOptionalPlanString(
          mealValue.optionGroup,
          `El grupo de opción del día ${dayNumber}`,
          50
        ),
        isCheatMeal: mealValue.isCheatMeal === true,
        timingType,
        items,
      }
    })

    return {
      dayNumber,
      customName: readOptionalPlanString(
        dayValue.customName,
        `El nombre del día ${dayNumber}`,
        100
      ),
      meals,
    }
  })

  const allItems = validatedDays.flatMap((day) => day.meals.flatMap((meal) => meal.items))
  if (allItems.length > 2_000) throw new Error('El plan contiene demasiadas líneas.')

  await assertFoodIdsAccessible(
    userId,
    allItems
      .map((item) => item.foodId)
      .filter((id): id is number => typeof id === 'number')
  )
  await assertRecipeIdsOwned(
    userId,
    allItems
      .map((item) => item.recipeId)
      .filter((id): id is string => typeof id === 'string')
  )

  const mealPlan = await prisma.$transaction(async (tx) => {
    const created = await tx.mealPlan.create({
      data: {
        patientId: input.patientId,
        userId,
        name,
        startDate,
        endDate,
        targetKcal,
        targetProteinG,
        targetCarbsG,
        targetFatG,
        notes,
        hideCaloriesTCA: input.hideCaloriesTCA === true,
        isGLP1: input.isGLP1 === true,
        planningModel,
        currentPhase,
        autoTransitionDate,
        targetKcalRest,
        targetCarbsGRest,
        targetProteinGRest,
        targetFatGRest,
        targetKcalMin,
        targetKcalMax,
        targetProteinGMin,
        targetProteinGMax,
        hydrationTargetLiters,
        eatingOutGuide,
        status: 'DRAFT',
        isSharedWithPatient: false,
        days: {
          create: validatedDays.map((day) => ({
            dayNumber: day.dayNumber,
            customName: day.customName,
            meals: {
              create: day.meals.map((meal) => ({
                mealType: meal.mealType,
                order: meal.order,
                isOptionB: meal.isOptionB,
                optionGroup: meal.optionGroup,
                isCheatMeal: meal.isCheatMeal,
                timingType: meal.timingType,
                items: {
                  create: meal.items.map((item) => ({
                    foodId: item.foodId,
                    recipeId: item.recipeId,
                    quantityG: item.quantityG,
                    servings: item.servings,
                    exchangeServings: item.exchangeServings,
                    exchangeGroup: item.exchangeGroup,
                    portionMeasureName: item.portionMeasureName,
                    portionMeasureGrams: item.portionMeasureGrams,
                    isAlternative: item.isAlternative,
                    notes: item.notes,
                  })),
                },
              })),
            },
          })),
        },
      },
    })

    // La configuración del panel "Información del menú" se guarda junto a la
    // pauta. Si falla, la transacción revierte el plan completo en lugar de
    // dejar una pauta sin configuración clínica.
    if (menuSettings) {
      await tx.menuConfig.create({
        data: {
          userId,
          mealPlanId: created.id,
          title: name,
          internalCode: `MENU-${created.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          status: 'DRAFT',
          startDate,
          settingsJson: JSON.stringify(menuSettings),
          versions: {
            create: {
              version: 1,
              snapshotJson: JSON.stringify(menuSettings),
              summary: 'Configuración inicial de la pauta',
            },
          },
        },
      })
    }

    return created
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/patients/${input.patientId}`)

  return mealPlan
}

export async function deleteMealPlan(id: string) {
  const userId = await requireUserId()
  const plan = await prisma.mealPlan.findFirst({ where: { id, userId }, select: { id: true, patientId: true, name: true } })
  if (!plan) throw new Error('Plan no encontrado.')

  await prisma.$transaction(async (tx) => {
    const updated = await tx.mealPlan.updateMany({
      where: { id: plan.id, userId, isActive: true },
      data: { isActive: false, status: 'ARCHIVED', isSharedWithPatient: false, checklistPassed: false },
    })
    if (updated.count !== 1) throw new Error('Plan no encontrado o ya archivado.')
    await tx.auditLog.create({
      data: {
        userId,
        patientId: plan.patientId,
        action: 'MEAL_PLAN_ARCHIVED',
        entityType: 'MEAL_PLAN',
        entityId: plan.id,
        details: `Plan "${plan.name}" archivado y retirado del portal.`,
      },
    })
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')
  revalidatePath('/paciente/plan')
}

export async function restoreMealPlan(id: string) {
  const userId = await requireUserId()
  const plan = await prisma.mealPlan.findFirst({
    where: { id, userId, isActive: false, status: 'ARCHIVED' },
    select: { id: true, patientId: true, name: true },
  })
  if (!plan) throw new Error('Plan no encontrado o no archivado.')

  // Restaurar un plan archivado no vuelve a publicarlo: debe pasar de nuevo
  // por la validación clínica y de alérgenos.
  await prisma.$transaction(async (tx) => {
    const updated = await tx.mealPlan.updateMany({
      where: { id: plan.id, userId, isActive: false, status: 'ARCHIVED' },
      data: { isActive: true, status: 'DRAFT', isSharedWithPatient: false, checklistPassed: false },
    })
    if (updated.count !== 1) throw new Error('El plan cambió de estado antes de restaurarse.')
    await tx.auditLog.create({
      data: {
        userId,
        patientId: plan.patientId,
        action: 'MEAL_PLAN_RESTORED_AS_DRAFT',
        entityType: 'MEAL_PLAN',
        entityId: plan.id,
        details: `Plan "${plan.name}" restaurado como borrador; requiere nueva validación antes de publicarse.`,
      },
    })
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/plans')
  revalidatePath('/paciente/plan')
}

export async function publishMealPlan(planId: string, checklistNotes?: string) {
  const userId = await requireUserId()
  const plan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
    include: {
      patient: true,
      days: {
        orderBy: { dayNumber: 'asc' },
        include: {
          meals: {
            orderBy: { order: 'asc' },
            include: {
              items: {
                include: {
                  food: true,
                  recipe: { include: { ingredients: { include: { food: true } } } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!plan) throw new Error('Plan no encontrado.')
  if (!plan.isActive || plan.status === 'ARCHIVED') {
    throw new Error('No se puede publicar un plan archivado. Restáuralo primero como borrador.')
  }
  if (plan.patient.isHardDeleted || !plan.patient.isActive) {
    throw new Error('No se puede publicar un plan de un expediente archivado o eliminado.')
  }
  if (plan.patient.consentRevokedAt) {
    throw new Error('No se puede publicar un plan mientras el consentimiento de datos de salud esté retirado.')
  }

  // Validaciones objetivas en servidor: no se confía en las casillas del modal.
  if (plan.days.length === 0 || plan.days.length > 31) {
    throw new Error('El plan debe tener entre 1 y 31 días antes de publicarse.')
  }
  const seenDayNumbers = new Set<number>()
  for (const day of plan.days) {
    if (day.dayNumber < 1 || day.dayNumber > 31 || seenDayNumbers.has(day.dayNumber)) {
      throw new Error('El plan contiene días duplicados o fuera de rango. Corrígelo antes de publicar.')
    }
    seenDayNumbers.add(day.dayNumber)
    if (day.meals.length === 0) {
      throw new Error(`El día ${day.dayNumber} no tiene ingestas. Añade al menos una antes de publicar.`)
    }
    const seenMealOrders = new Set<number>()
    for (const meal of day.meals) {
      if (!PLAN_MEAL_TYPES.has(meal.mealType)) {
        throw new Error(`El día ${day.dayNumber} contiene un tipo de ingesta no válido.`)
      }
      if (
        !Number.isInteger(meal.order) ||
        meal.order < 0 ||
        meal.order > 20 ||
        seenMealOrders.has(meal.order)
      ) {
        throw new Error(`El día ${day.dayNumber} contiene ingestas con orden duplicado o no válido.`)
      }
      seenMealOrders.add(meal.order)
      if (meal.items.length === 0) {
        throw new Error(
          `La ingesta "${meal.mealType}" del día ${day.dayNumber} no tiene alimentos ni recetas.`
        )
      }
    }
  }

  const allItems = plan.days.flatMap((day) => day.meals.flatMap((meal) => meal.items))
  if (allItems.length === 0 || allItems.length > 2_000) {
    throw new Error('El plan no contiene una composición válida de alimentos y recetas.')
  }
  for (const item of allItems) {
    if ((item.food === null) === (item.recipe === null)) {
      throw new Error('Cada línea del plan debe contener exactamente un alimento o una receta.')
    }
    if (!Number.isFinite(item.quantityG) || item.quantityG <= 0 || item.quantityG > 10_000) {
      throw new Error('Hay líneas con cantidades no válidas. Corrígelas antes de publicar.')
    }
    if (!Number.isFinite(item.servings) || item.servings <= 0 || item.servings > 100) {
      throw new Error('Hay líneas con raciones no válidas. Corrígelas antes de publicar.')
    }
  }

  const unknownStatuses: string[] = []
  const safeClinicalStatuses = new Set(['CONFIRMED', 'NINGUNA_CONOCIDA'])
  if (!safeClinicalStatuses.has(plan.patient.allergiesStatus)) unknownStatuses.push('alergias')
  if (!safeClinicalStatuses.has(plan.patient.intolerancesStatus)) unknownStatuses.push('intolerancias')
  if (!safeClinicalStatuses.has(plan.patient.medicationsStatus)) unknownStatuses.push('medicación actual')
  if (!safeClinicalStatuses.has(plan.patient.pathologiesStatus)) unknownStatuses.push('patologías')
  if (unknownStatuses.length > 0) {
    throw new Error(
      `No se puede publicar: falta confirmar en la ficha ${unknownStatuses.join(', ')}. El estado "NO CONSTA" no es un estado seguro para prescribir.`
    )
  }

  const conflicts = scanPlanForAllergenConflicts(plan, plan.patient)
  if (conflicts.length > 0) {
    const summary = conflicts
      .slice(0, 6)
      .map(
        (conflict) =>
          `Día ${conflict.dayNumber} · ${conflict.mealType}: ${conflict.foodName}${
            conflict.recipeName ? ` (receta ${conflict.recipeName})` : ''
          } → ${conflict.conflict.allergenLabel}`
      )
      .join('; ')
    throw new Error(
      `Publicación bloqueada por ${conflicts.length} conflicto(s) de alérgenos/intolerancias: ${summary}${
        conflicts.length > 6 ? '…' : ''
      }`
    )
  }

  const safeNotes =
    typeof checklistNotes === 'string' ? checklistNotes.trim().slice(0, 2_000) : ''
  const publishedAt = new Date()
  const serverChecklistSummary = [
    'Checklist verificado en servidor:',
    'composición del plan completa',
    `alergias=${plan.patient.allergiesStatus}`,
    `intolerancias=${plan.patient.intolerancesStatus}`,
    `medicación=${plan.patient.medicationsStatus}`,
    `patologías=${plan.patient.pathologiesStatus}`,
    `conflictos_alérgenos=0`,
    `revisado=${publishedAt.toISOString()}`,
  ].join(' ')
  const checklistNotesValue = safeNotes
    ? `${serverChecklistSummary}\nObservaciones: ${safeNotes}`
    : serverChecklistSummary

  // La publicación y su rastro de auditoría son atómicos: no puede existir un
  // plan publicado sin la entrada que justifica la validación clínica.
  const updated = await prisma.$transaction(async (tx) => {
    const updatedResult = await tx.mealPlan.updateMany({
      where: {
        id: planId,
        userId,
        isActive: true,
        status: { not: 'ARCHIVED' },
        patient: {
          isActive: true,
          isHardDeleted: false,
          consentRevokedAt: null,
        },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt,
        publishedBy: 'Eva Vidal',
        checklistPassed: true,
        clinicalChecklistNotes: checklistNotesValue,
        isSharedWithPatient: true,
      },
    })
    if (updatedResult.count !== 1) throw new Error('Plan no encontrado.')

    await tx.auditLog.create({
      data: {
        userId,
        patientId: plan.patientId,
        action: 'MEAL_PLAN_PUBLISHED',
        entityType: 'MEAL_PLAN',
        entityId: planId,
        details: `Plan nutricional "${plan.name}" validado y publicado para el paciente. ${serverChecklistSummary}${
          safeNotes ? ` Observaciones: ${safeNotes}` : ''
        }`,
      },
    })

    return tx.mealPlan.findUniqueOrThrow({ where: { id: planId } })
  })

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/patients/${plan.patientId}`)
  revalidatePath('/paciente/plan')
  return updated
}

export async function duplicateMealPlan(planId: string, targetPatientId?: string) {
  const userId = await requireUserId()
  const sourcePlan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
    include: {
      days: {
        include: {
          meals: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  if (!sourcePlan) throw new Error('Plan no encontrado para duplicar')

  const patientId = targetPatientId || sourcePlan.patientId
  const targetPatient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false, consentRevokedAt: null },
    select: { id: true },
  })
  if (!targetPatient) {
    throw new Error('Paciente de destino no encontrado, archivado o sin consentimiento vigente.')
  }

  const duplicated = await prisma.mealPlan.create({
    data: {
      userId,
      patientId,
      name: `${sourcePlan.name} (Copia)`,
      startDate: new Date(),
      endDate: sourcePlan.endDate,
      targetKcal: sourcePlan.targetKcal,
      targetProteinG: sourcePlan.targetProteinG,
      targetCarbsG: sourcePlan.targetCarbsG,
      targetFatG: sourcePlan.targetFatG,
      notes: sourcePlan.notes,
      hideCaloriesTCA: sourcePlan.hideCaloriesTCA,
      isGLP1: sourcePlan.isGLP1,
      planningModel: sourcePlan.planningModel,
      currentPhase: sourcePlan.currentPhase,
      targetKcalRest: sourcePlan.targetKcalRest,
      targetCarbsGRest: sourcePlan.targetCarbsGRest,
      targetProteinGRest: sourcePlan.targetProteinGRest,
      targetFatGRest: sourcePlan.targetFatGRest,
      targetKcalMin: sourcePlan.targetKcalMin,
      targetKcalMax: sourcePlan.targetKcalMax,
      targetProteinGMin: sourcePlan.targetProteinGMin,
      targetProteinGMax: sourcePlan.targetProteinGMax,
      hydrationTargetLiters: sourcePlan.hydrationTargetLiters,
      supplementationPlanJson: sourcePlan.supplementationPlanJson,
      eatingOutGuide: sourcePlan.eatingOutGuide,
      batchCookingGuideJson: sourcePlan.batchCookingGuideJson,
      status: 'DRAFT',
      isSharedWithPatient: false,
      days: {
        create: sourcePlan.days.map((d) => ({
          dayNumber: d.dayNumber,
          customName: d.customName,
          meals: {
            create: d.meals.map((m) => ({
              mealType: m.mealType,
              order: m.order,
              isOptionB: m.isOptionB,
              optionGroup: m.optionGroup,
              isCheatMeal: m.isCheatMeal,
              timingType: m.timingType,
              items: {
                create: m.items.map((it) => ({
                  foodId: it.foodId,
                  recipeId: it.recipeId,
                  quantityG: it.quantityG,
                  servings: it.servings,
                  exchangeServings: it.exchangeServings,
                  exchangeGroup: it.exchangeGroup,
                  portionMeasureName: it.portionMeasureName,
                  portionMeasureGrams: it.portionMeasureGrams,
                  isAlternative: it.isAlternative,
                  notes: it.notes,
                })),
              },
            })),
          },
        })),
      },
    },
  })

  revalidatePath('/dashboard/plans')
  return duplicated
}

export async function renewMealPlanVersion(planId: string) {
  const userId = await requireUserId()
  const sourcePlan = await prisma.mealPlan.findFirst({
    where: {
      id: planId,
      userId,
      isActive: true,
      status: { not: 'ARCHIVED' },
      patient: {
        isActive: true,
        isHardDeleted: false,
        consentRevokedAt: null,
      },
    },
    include: {
      menuConfig: true,
      days: {
        include: {
          meals: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  if (!sourcePlan) {
    throw new Error('Plan original no encontrado, archivado o sin consentimiento vigente.')
  }

  const nextVersion = sourcePlan.version + 1
  const now = new Date()

  const newVersion = await prisma.$transaction(async (tx) => {
    const created = await tx.mealPlan.create({
      data: {
        userId,
        patientId: sourcePlan.patientId,
        name: `${sourcePlan.name.replace(/\s*\(v\d+\)$/, '')} (v${nextVersion})`,
        startDate: now,
        endDate: null,
        targetKcal: sourcePlan.targetKcal,
        targetProteinG: sourcePlan.targetProteinG,
        targetCarbsG: sourcePlan.targetCarbsG,
        targetFatG: sourcePlan.targetFatG,
        notes: sourcePlan.notes,
        hideCaloriesTCA: sourcePlan.hideCaloriesTCA,
        isGLP1: sourcePlan.isGLP1,
        planningModel: sourcePlan.planningModel,
        currentPhase: sourcePlan.currentPhase,
        targetKcalRest: sourcePlan.targetKcalRest,
        targetCarbsGRest: sourcePlan.targetCarbsGRest,
        targetProteinGRest: sourcePlan.targetProteinGRest,
        targetFatGRest: sourcePlan.targetFatGRest,
        targetKcalMin: sourcePlan.targetKcalMin,
        targetKcalMax: sourcePlan.targetKcalMax,
        targetProteinGMin: sourcePlan.targetProteinGMin,
        targetProteinGMax: sourcePlan.targetProteinGMax,
        hydrationTargetLiters: sourcePlan.hydrationTargetLiters,
        supplementationPlanJson: sourcePlan.supplementationPlanJson,
        eatingOutGuide: sourcePlan.eatingOutGuide,
        batchCookingGuideJson: sourcePlan.batchCookingGuideJson,
        version: nextVersion,
        previousVersionId: sourcePlan.id,
        status: 'DRAFT',
        isSharedWithPatient: false,
        days: {
          create: sourcePlan.days.map((d) => ({
            dayNumber: d.dayNumber,
            customName: d.customName,
            meals: {
              create: d.meals.map((m) => ({
                mealType: m.mealType,
                order: m.order,
                isOptionB: m.isOptionB,
                optionGroup: m.optionGroup,
                isCheatMeal: m.isCheatMeal,
                timingType: m.timingType,
                items: {
                  create: m.items.map((it) => ({
                    foodId: it.foodId,
                    recipeId: it.recipeId,
                    quantityG: it.quantityG,
                    servings: it.servings,
                    exchangeServings: it.exchangeServings,
                    exchangeGroup: it.exchangeGroup,
                    portionMeasureName: it.portionMeasureName,
                    portionMeasureGrams: it.portionMeasureGrams,
                    isAlternative: it.isAlternative,
                    notes: it.notes,
                  })),
                },
              })),
            },
          })),
        },
      },
    })

    if (sourcePlan.menuConfig) {
      const menu = sourcePlan.menuConfig
      await tx.menuConfig.create({
        data: {
          userId,
          mealPlanId: created.id,
          title: menu.title,
          internalCode: `MENU-${created.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          status: 'DRAFT',
          startDate: now,
          endDate: null,
          internalNotes: menu.internalNotes,
          isTemplate: false,
          version: 1,
          settingsJson: menu.settingsJson,
          versions: {
            create: {
              version: 1,
              snapshotJson: menu.settingsJson,
              summary: 'Configuración copiada al renovar la versión del plan',
            },
          },
        },
      })
    }

    return created
  })

  revalidatePath('/dashboard/plans')
  return newVersion
}

export async function checkPatientAversionWarning(patientId: string, foodName: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { foodAversions: true },
  })

  if (!patient || !patient.foodAversions) return null

  const aversions = patient.foodAversions
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const foodLower = foodName.toLowerCase()
  for (const av of aversions) {
    if (foodLower.includes(av)) {
      return `Aviso clínico: El alimento "${foodName}" coincide con el rechazo/aversión anotado en la ficha del paciente ("${av}").`
    }
  }

  return null
}

