'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'

export interface CreateBloodAnalysisInput {
  patientId: string
  date: string
  glucoseMgDl?: number
  hba1cPct?: number
  cholesterolMgDl?: number
  hdlMgDl?: number
  ldlMgDl?: number
  triglyceridesMgDl?: number
  ferritinNgMl?: number
  tshUiuMl?: number
  vitaminDNgMl?: number
  creatinineMgDl?: number
  uricAcidMgDl?: number
  gotAstUL?: number
  gptAltUL?: number
  insulinUiuMl?: number
  plateletsKUl?: number
  notes?: string
}

export async function getBloodAnalyses(patientId: string) {
  const userId = await requireUserId()
  if (!await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })) throw new Error('Paciente no encontrado.')
  return await prisma.bloodAnalysis.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
  })
}

function optionalLabNumber(
  value: unknown,
  label: string,
  options: { min: number; max: number }
): number | null {
  if (value === undefined || value === null || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric < options.min || numeric > options.max) {
    throw new Error(`El valor de "${label}" no es válido.`)
  }
  return numeric
}

export async function createBloodAnalysis(input: CreateBloodAnalysisInput) {
  if (!input || typeof input !== 'object' || !input.patientId) {
    throw new Error('ID de paciente obligatorio')
  }

  const userId = await requireUserId()
  if (!await prisma.patient.findFirst({
    where: {
      id: input.patientId,
      userId,
      isActive: true,
      isHardDeleted: false,
      consentRevokedAt: null,
    },
    select: { id: true },
  })) {
    throw new Error('Paciente no encontrado, archivado o sin consentimiento vigente.')
  }

  const analysisDate = new Date(input.date || Date.now())
  if (Number.isNaN(analysisDate.getTime())) throw new Error('La fecha de la analítica no es válida.')
  if (analysisDate.getTime() > Date.now()) {
    throw new Error('La fecha de la analítica no puede estar en el futuro.')
  }

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.bloodAnalysis.create({
      data: {
        patientId: input.patientId,
        date: analysisDate,
        glucoseMgDl: optionalLabNumber(input.glucoseMgDl, 'glucosa', { min: 0, max: 2_000 }),
        hba1cPct: optionalLabNumber(input.hba1cPct, 'HbA1c', { min: 0, max: 30 }),
        cholesterolMgDl: optionalLabNumber(input.cholesterolMgDl, 'colesterol', { min: 0, max: 2_000 }),
        hdlMgDl: optionalLabNumber(input.hdlMgDl, 'HDL', { min: 0, max: 2_000 }),
        ldlMgDl: optionalLabNumber(input.ldlMgDl, 'LDL', { min: 0, max: 2_000 }),
        triglyceridesMgDl: optionalLabNumber(input.triglyceridesMgDl, 'triglicéridos', { min: 0, max: 5_000 }),
        ferritinNgMl: optionalLabNumber(input.ferritinNgMl, 'ferritina', { min: 0, max: 100_000 }),
        tshUiuMl: optionalLabNumber(input.tshUiuMl, 'TSH', { min: 0, max: 1_000 }),
        vitaminDNgMl: optionalLabNumber(input.vitaminDNgMl, 'vitamina D', { min: 0, max: 1_000 }),
        creatinineMgDl: optionalLabNumber(input.creatinineMgDl, 'creatinina', { min: 0, max: 50 }),
        uricAcidMgDl: optionalLabNumber(input.uricAcidMgDl, 'ácido úrico', { min: 0, max: 50 }),
        gotAstUL: optionalLabNumber(input.gotAstUL, 'AST', { min: 0, max: 100_000 }),
        gptAltUL: optionalLabNumber(input.gptAltUL, 'ALT', { min: 0, max: 100_000 }),
        insulinUiuMl: optionalLabNumber(input.insulinUiuMl, 'insulina', { min: 0, max: 1_000 }),
        plateletsKUl: optionalLabNumber(input.plateletsKUl, 'plaquetas', { min: 0, max: 2_000_000 }),
        notes: String(input.notes || '').trim().slice(0, 5_000) || null,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId: input.patientId,
        action: 'BLOOD_ANALYSIS_CREATED',
        entityType: 'BloodAnalysis',
        entityId: created.id,
      },
    })
    return created
  })

  revalidatePath(`/dashboard/patients/${input.patientId}`)
  return record
}

export async function deleteBloodAnalysis(id: string, patientId: string) {
  const userId = await requireUserId()
  const analysis = await prisma.bloodAnalysis.findFirst({
    where: { id, patientId, patient: { userId } },
    select: { id: true },
  })
  if (!analysis) throw new Error('Analítica no encontrada.')

  await prisma.$transaction(async (tx) => {
    const deleted = await tx.bloodAnalysis.deleteMany({ where: { id, patientId } })
    if (deleted.count !== 1) throw new Error('La analítica ya no está disponible.')
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'BLOOD_ANALYSIS_DELETED',
        entityType: 'BloodAnalysis',
        entityId: id,
      },
    })
  })
  revalidatePath(`/dashboard/patients/${patientId}`)
}
