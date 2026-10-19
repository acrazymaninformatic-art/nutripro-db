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

export async function createBloodAnalysis(input: CreateBloodAnalysisInput) {
  if (!input.patientId) {
    throw new Error('ID de paciente obligatorio')
  }

  const userId = await requireUserId()
  if (!await prisma.patient.findFirst({ where: { id: input.patientId, userId }, select: { id: true } })) throw new Error('Paciente no encontrado.')

  const record = await prisma.bloodAnalysis.create({
    data: {
      patientId: input.patientId,
      date: new Date(input.date || Date.now()),
      glucoseMgDl: input.glucoseMgDl || null,
      hba1cPct: input.hba1cPct || null,
      cholesterolMgDl: input.cholesterolMgDl || null,
      hdlMgDl: input.hdlMgDl || null,
      ldlMgDl: input.ldlMgDl || null,
      triglyceridesMgDl: input.triglyceridesMgDl || null,
      ferritinNgMl: input.ferritinNgMl || null,
      tshUiuMl: input.tshUiuMl || null,
      vitaminDNgMl: input.vitaminDNgMl || null,
      creatinineMgDl: input.creatinineMgDl || null,
      uricAcidMgDl: input.uricAcidMgDl || null,
      gotAstUL: input.gotAstUL || null,
      gptAltUL: input.gptAltUL || null,
      insulinUiuMl: input.insulinUiuMl || null,
      plateletsKUl: input.plateletsKUl || null,
      notes: input.notes || null,
    },
  })

  revalidatePath(`/dashboard/patients/${input.patientId}`)
  return record
}

export async function deleteBloodAnalysis(id: string, patientId: string) {
  const userId = await requireUserId()
  if (!await prisma.bloodAnalysis.findFirst({ where: { id, patientId, patient: { userId } }, select: { id: true } })) throw new Error('Analítica no encontrada.')
  await prisma.bloodAnalysis.delete({
    where: { id },
  })
  revalidatePath(`/dashboard/patients/${patientId}`)
}
