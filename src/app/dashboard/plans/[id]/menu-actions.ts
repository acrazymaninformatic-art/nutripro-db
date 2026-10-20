'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth'
import {
  buildInternalCode,
  defaultMenuSettings,
  safeParseSettings,
  type MenuSettings,
  type MenuStatus,
} from '@/lib/menu-config'
import { duplicateMealPlan } from '../actions'

const MAX_VERSIONS = 60

export interface MenuConfigDTO {
  id: string
  menuId: string
  title: string
  internalCode: string
  status: MenuStatus
  startDate: string | null
  endDate: string | null
  internalNotes: string | null
  isTemplate: boolean
  version: number
  settings: MenuSettings
  assignments: Array<{
    id: string
    patientId: string
    servings: number
    profile: Record<string, unknown>
    patient: {
      id: string
      firstName: string
      lastName: string
      email: string | null
    }
  }>
  versions: Array<{
    id: string
    version: number
    summary: string | null
    createdAt: string
  }>
}

function toDTO(
  menu: {
    id: string
    mealPlanId: string
    title: string
    internalCode: string
    status: string
    startDate: Date | null
    endDate: Date | null
    internalNotes: string | null
    isTemplate: boolean
    version: number
    settingsJson: string
    assignments: Array<{
      id: string
      patientId: string
      servings: number
      profileJson: string
      patient: { id: string; firstName: string; lastName: string; email: string | null }
    }>
    versions: Array<{
      id: string
      version: number
      summary: string | null
      createdAt: Date
    }>
  }
): MenuConfigDTO {
  return {
    id: menu.id,
    menuId: menu.mealPlanId,
    title: menu.title,
    internalCode: menu.internalCode,
    status: (menu.status as MenuStatus) || 'DRAFT',
    startDate: menu.startDate ? menu.startDate.toISOString() : null,
    endDate: menu.endDate ? menu.endDate.toISOString() : null,
    internalNotes: menu.internalNotes,
    isTemplate: menu.isTemplate,
    version: menu.version,
    settings: safeParseSettings(menu.settingsJson) || defaultMenuSettings({}),
    assignments: menu.assignments.map((assignment) => ({
      id: assignment.id,
      patientId: assignment.patientId,
      servings: assignment.servings,
      profile: safeParseSettings(assignment.profileJson) || {},
      patient: assignment.patient,
    })),
    versions: menu.versions.map((version) => ({
      id: version.id,
      version: version.version,
      summary: version.summary,
      createdAt: version.createdAt.toISOString(),
    })),
  }
}

async function loadMenu(planId: string) {
  const userId = await requireUserId()
  const plan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true, name: true, patientId: true },
  })
  if (!plan) throw new Error('Pauta no encontrada.')

  return plan
}

/**
 * Devuelve la configuración del menú de una pauta. Si no existe todavía, la
 * crea con los valores por defecto derivados de la propia pauta.
 */
export async function getOrCreateMenuConfig(planId: string): Promise<MenuConfigDTO> {
  const userId = await requireUserId()
  const plan = await loadMenu(planId)

  const includeConfig = {
    assignments: {
      include: { patient: { select: { id: true, firstName: true, lastName: true, email: true } } },
    },
    versions: { orderBy: { version: 'desc' as const }, take: MAX_VERSIONS },
  }

  const existing = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    include: includeConfig,
  })

  if (existing) return toDTO(existing as never)

  const planData = await prisma.mealPlan.findUnique({
    where: { id: plan.id },
    select: {
      targetKcal: true,
      targetProteinG: true,
      targetCarbsG: true,
      targetFatG: true,
      patient: { select: { declaredWeightKg: true, heightCm: true } },
    },
  })

  const settings = defaultMenuSettings({
    targetKcal: planData?.targetKcal,
    targetProteinG: planData?.targetProteinG,
    targetCarbsG: planData?.targetCarbsG,
    targetFatG: planData?.targetFatG,
    weightKg: planData?.patient?.declaredWeightKg,
  })

  const created = await prisma.menuConfig.create({
    data: {
      userId,
      mealPlanId: plan.id,
      title: plan.name,
      internalCode: buildInternalCode(),
      status: 'DRAFT',
      startDate: null,
      endDate: null,
      settingsJson: JSON.stringify(settings),
      versions: {
        create: {
          version: 1,
          snapshotJson: JSON.stringify(settings),
          summary: 'Configuración inicial',
        },
      },
    },
    include: includeConfig,
  })

  return toDTO(created as never)
}

/** Autoguardado de la configuración (objetivos, ingestas, keto, micros). */
export async function saveMenuSettings(
  planId: string,
  settings: MenuSettings,
  summary?: string
): Promise<{ savedAt: string; version: number }> {
  await requireUserId()
  const plan = await loadMenu(planId)

  const menu = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    select: { id: true, version: true },
  })
  if (!menu) throw new Error('El menú no está inicializado.')

  const nextVersion = menu.version + 1

  await prisma.$transaction([
    prisma.menuConfig.update({
      where: { id: menu.id },
      data: {
        settingsJson: JSON.stringify(settings),
        version: nextVersion,
      },
    }),
    prisma.menuConfigVersion.create({
      data: {
        menuId: menu.id,
        version: nextVersion,
        snapshotJson: JSON.stringify(settings),
        summary: summary || 'Autoguardado',
      },
    }),
  ])

  // Historial acotado: se limpian las versiones más antiguas.
  const oldVersions = await prisma.menuConfigVersion.findMany({
    where: { menuId: menu.id },
    orderBy: { version: 'desc' },
    skip: MAX_VERSIONS,
    select: { id: true },
  })
  if (oldVersions.length) {
    await prisma.menuConfigVersion.deleteMany({
      where: { id: { in: oldVersions.map((version) => version.id) } },
    })
  }

  revalidatePath(`/dashboard/plans/${planId}`)

  return { savedAt: new Date().toISOString(), version: nextVersion }
}

/** Guarda los datos del menú (título, estado, fechas, notas, plantilla). */
export async function saveMenuData(
  planId: string,
  data: {
    title?: string
    status?: MenuStatus
    startDate?: string | null
    endDate?: string | null
    internalNotes?: string | null
    isTemplate?: boolean
  }
): Promise<{ savedAt: string }> {
  await requireUserId()
  const plan = await loadMenu(planId)

  const menu = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    select: { id: true },
  })
  if (!menu) throw new Error('El menú no está inicializado.')

  await prisma.menuConfig.update({
    where: { id: menu.id },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() || 'Menú sin título' } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startDate !== undefined
        ? { startDate: data.startDate ? new Date(data.startDate) : null }
        : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      ...(data.isTemplate !== undefined ? { isTemplate: data.isTemplate } : {}),
    },
  })

  revalidatePath(`/dashboard/plans/${planId}`)

  return { savedAt: new Date().toISOString() }
}

/** Restaura una versión anterior del historial. */
export async function restoreMenuVersion(planId: string, versionId: string) {
  await requireUserId()
  const plan = await loadMenu(planId)

  const menu = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    select: { id: true, version: true },
  })
  if (!menu) throw new Error('El menú no está inicializado.')

  const version = await prisma.menuConfigVersion.findFirst({
    where: { id: versionId, menuId: menu.id },
  })
  if (!version) throw new Error('Versión no encontrada.')

  const nextVersion = menu.version + 1

  await prisma.$transaction([
    prisma.menuConfig.update({
      where: { id: menu.id },
      data: { settingsJson: version.snapshotJson, version: nextVersion },
    }),
    prisma.menuConfigVersion.create({
      data: {
        menuId: menu.id,
        version: nextVersion,
        snapshotJson: version.snapshotJson,
        summary: `Restaurada la versión ${version.version}`,
      },
    }),
  ])

  revalidatePath(`/dashboard/plans/${planId}`)

  return { settings: safeParseSettings(version.snapshotJson), version: nextVersion }
}

/** Duplica la pauta completa junto con su configuración de menú. */
export async function duplicateMenu(planId: string) {
  const userId = await requireUserId()
  const plan = await loadMenu(planId)

  const duplicated = await duplicateMealPlan(planId)

  const source = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    include: { assignments: true },
  })

  if (source) {
    await prisma.menuConfig.create({
      data: {
        userId,
        mealPlanId: duplicated.id,
        title: `${source.title} (copia)`,
        internalCode: buildInternalCode(),
        status: 'DRAFT',
        startDate: source.startDate,
        endDate: source.endDate,
        internalNotes: source.internalNotes,
        isTemplate: false,
        settingsJson: source.settingsJson,
        versions: {
          create: {
            version: 1,
            snapshotJson: source.settingsJson,
            summary: 'Copia de la configuración de origen',
          },
        },
        assignments: {
          create: source.assignments.map((assignment) => ({
            patientId: assignment.patientId,
            servings: assignment.servings,
            profileJson: assignment.profileJson,
          })),
        },
      },
    })
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)

  return { planId: duplicated.id }
}

/** Guarda el menú actual como plantilla reutilizable. */
export async function saveMenuAsTemplate(planId: string, isTemplate: boolean) {
  return saveMenuData(planId, { isTemplate })
}

/* ------------------------------------------------------------------ */
/* Pacientes asignados                                                 */
/* ------------------------------------------------------------------ */

export interface PatientOption {
  id: string
  firstName: string
  lastName: string
  email: string | null
  weightKg: number | null
  heightCm: number | null
  birthDate: string | null
  sex: string | null
  objective: string | null
  allergies: string | null
  intolerances: string | null
  dietaryPreferences: string | null
  foodAversions: string | null
  activityLevel: string | null
}

export async function listPatientsForMenu(): Promise<PatientOption[]> {
  const userId = await requireUserId()

  const patients = await prisma.patient.findMany({
    where: { userId },
    orderBy: { lastName: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      declaredWeightKg: true,
      heightCm: true,
      birthDate: true,
      sex: true,
      objective: true,
      allergies: true,
      intolerances: true,
      dietaryPreferences: true,
      foodAversions: true,
      activityLevel: true,
    },
  })

  return patients.map((patient) => ({
    ...patient,
    weightKg: patient.declaredWeightKg,
    birthDate: patient.birthDate ? patient.birthDate.toISOString() : null,
  }))
}

export async function assignPatientToMenu(
  planId: string,
  patientId: string,
  servings: number,
  profile: Record<string, unknown>
) {
  const userId = await requireUserId()
  const plan = await loadMenu(planId)

  const menu = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    select: { id: true },
  })
  if (!menu) throw new Error('El menú no está inicializado.')

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  await prisma.menuPatientAssignment.upsert({
    where: { menuId_patientId: { menuId: menu.id, patientId } },
    create: {
      menuId: menu.id,
      patientId,
      servings: servings > 0 ? servings : 1,
      profileJson: JSON.stringify(profile || {}),
    },
    update: {
      servings: servings > 0 ? servings : 1,
      profileJson: JSON.stringify(profile || {}),
    },
  })

  revalidatePath(`/dashboard/plans/${planId}`)

  return { ok: true }
}

export async function removePatientFromMenu(planId: string, patientId: string) {
  const userId = await requireUserId()
  const plan = await loadMenu(planId)

  const menu = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    select: { id: true },
  })
  if (!menu) throw new Error('El menú no está inicializado.')

  await prisma.menuPatientAssignment.deleteMany({
    where: { menuId: menu.id, patientId },
  })

  revalidatePath(`/dashboard/plans/${planId}`)

  return { ok: true }
}

export async function updateMenuPatientServings(
  planId: string,
  patientId: string,
  servings: number
) {
  const userId = await requireUserId()
  const plan = await loadMenu(planId)

  const menu = await prisma.menuConfig.findUnique({
    where: { mealPlanId: plan.id },
    select: { id: true },
  })
  if (!menu) throw new Error('El menú no está inicializado.')

  await prisma.menuPatientAssignment.updateMany({
    where: { menuId: menu.id, patientId },
    data: { servings: servings > 0 ? servings : 1 },
  })

  revalidatePath(`/dashboard/plans/${planId}`)

  return { ok: true }
}
