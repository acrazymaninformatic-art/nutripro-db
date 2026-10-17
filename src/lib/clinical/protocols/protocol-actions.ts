'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUserId, requireUser } from '@/lib/auth'
import { CLINICAL_PROTOCOLS, parseCGMData } from './protocols-registry'

export async function getPatientProtocolsAction(patientId: string) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado')

  return prisma.clinicalProtocolRecord.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function assignProtocolAction({
  patientId,
  protocolId,
  initialPhase,
  parameters = {},
  notes,
}: {
  patientId: string
  protocolId: string
  initialPhase?: string
  parameters?: Record<string, unknown>
  notes?: string
}) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!patient) throw new Error('Paciente no encontrado')

  const def = CLINICAL_PROTOCOLS.find((p) => p.id === protocolId)
  const title = def ? def.name : protocolId

  const record = await prisma.clinicalProtocolRecord.create({
    data: {
      patientId,
      type: protocolId,
      title,
      phase: initialPhase || def?.phases?.[0]?.id || null,
      parametersJson: JSON.stringify(parameters),
      symptomLogJson: '[]',
      notes: notes || null,
      status: 'ACTIVE',
      startDate: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId,
      action: 'CLINICAL_PROTOCOL_ASSIGNED',
      entityType: 'PROTOCOL',
      entityId: record.id,
      details: `Protocolo clínico "${title}" asignado al paciente.`,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return record
}

export async function updateProtocolPhaseAction({
  recordId,
  newPhase,
  notes,
}: {
  recordId: string
  newPhase: string
  notes?: string
}) {
  await requireUserId()
  const current = await prisma.clinicalProtocolRecord.findUnique({
    where: { id: recordId },
  })
  if (!current) throw new Error('Registro de protocolo no encontrado')

  const updated = await prisma.clinicalProtocolRecord.update({
    where: { id: recordId },
    data: {
      phase: newPhase,
      notes: notes !== undefined ? notes : current.notes,
    },
  })

  revalidatePath(`/dashboard/patients/${current.patientId}`)
  return updated
}

export async function addSymptomLogAction({
  recordId,
  log,
}: {
  recordId: string
  log: {
    date: string
    bristolScale: number // 1 to 7
    bloatingScore: number // 0 to 10
    painScore: number // 0 to 10
    gasScore: number // 0 to 10
    suspectedFood?: string
    notes?: string
  }
}) {
  const user = await requireUser()
  const current = await prisma.clinicalProtocolRecord.findUnique({
    where: { id: recordId },
  })
  if (!current) throw new Error('Registro de protocolo no encontrado')

  // IDOR check: if caller is a patient, they can only write to their own record
  if (user.role === 'PATIENT' && user.patientId !== current.patientId) {
    throw new Error('No autorizado para modificar este protocolo')
  }

  let logs: Array<Record<string, unknown>> = []
  try {
    logs = JSON.parse(current.symptomLogJson || '[]')
  } catch {
    logs = []
  }

  logs.unshift({
    id: `sym-${Date.now()}`,
    ...log,
    recordedAt: new Date().toISOString(),
  })

  const updated = await prisma.clinicalProtocolRecord.update({
    where: { id: recordId },
    data: {
      symptomLogJson: JSON.stringify(logs),
    },
  })

  revalidatePath(`/dashboard/patients/${current.patientId}`)
  revalidatePath('/paciente')
  return updated
}

export async function importCGMReadingsAction({
  patientId,
  glucoseReadings,
  notes,
}: {
  patientId: string
  glucoseReadings: number[]
  notes?: string
}) {
  const userId = await requireUserId()
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!patient) throw new Error('Paciente no encontrado')

  const analysis = parseCGMData(glucoseReadings)

  const record = await prisma.clinicalProtocolRecord.create({
    data: {
      patientId,
      type: 'DIABETES_CGM',
      title: 'Informe de Glucemia Continua (CGM FreeStyle/Dexcom)',
      parametersJson: JSON.stringify(analysis),
      notes: notes || analysis.assessment,
      status: 'ACTIVE',
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId,
      action: 'CGM_DATA_IMPORTED',
      entityType: 'PROTOCOL',
      entityId: record.id,
      details: `Lecturas de sensor CGM importadas: TIR ${analysis.timeInRangePct}%, GMI ${analysis.gmiEstimatedHba1c}%.`,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { record, analysis }
}

export async function updateProtocolStatusAction(
  recordId: string,
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
) {
  await requireUserId()
  const current = await prisma.clinicalProtocolRecord.findUnique({
    where: { id: recordId },
  })
  if (!current) throw new Error('Protocolo no encontrado')

  const updated = await prisma.clinicalProtocolRecord.update({
    where: { id: recordId },
    data: { status },
  })

  revalidatePath(`/dashboard/patients/${current.patientId}`)
  return updated
}
