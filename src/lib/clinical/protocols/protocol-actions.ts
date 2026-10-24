'use server'

import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requirePatient, requireUserId, requireUser } from '@/lib/auth'
import { CLINICAL_PROTOCOLS, parseCGMData } from './protocols-registry'

function boundedScore(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(max, Math.max(min, numeric))
}

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
  if (!def) throw new Error('Protocolo clínico no reconocido.')
  const phaseIds = (def.phases || []).map((phase) => phase.id)
  if (initialPhase && !phaseIds.includes(initialPhase)) {
    throw new Error('La fase inicial no pertenece al protocolo seleccionado.')
  }
  if (parameters && (typeof parameters !== 'object' || Array.isArray(parameters))) {
    throw new Error('Los parámetros del protocolo no son válidos.')
  }
  const parametersJson = JSON.stringify(parameters || {})
  if (parametersJson.length > 100_000) throw new Error('Los parámetros del protocolo son demasiado extensos.')
  const safeNotes = String(notes || '').trim().slice(0, 10_000) || null
  const title = def.name

  const record = await prisma.clinicalProtocolRecord.create({
    data: {
      patientId,
      type: protocolId,
      title,
      phase: initialPhase || def.phases?.[0]?.id || null,
      parametersJson,
      symptomLogJson: '[]',
      notes: safeNotes,
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
  const userId = await requireUserId()
  const current = await prisma.clinicalProtocolRecord.findFirst({
    where: { id: recordId, patient: { userId } },
  })
  if (!current) throw new Error('Registro de protocolo no encontrado.')

  const def = CLINICAL_PROTOCOLS.find((protocol) => protocol.id === current.type)
  if (!def) throw new Error('Protocolo clínico no reconocido.')
  const phaseIds = (def.phases || []).map((phase) => phase.id)
  if (!phaseIds.includes(newPhase)) throw new Error('La fase no pertenece al protocolo.')

  const updated = await prisma.clinicalProtocolRecord.update({
    where: { id: recordId },
    data: {
      phase: newPhase,
      notes: notes !== undefined ? String(notes).trim().slice(0, 10_000) : current.notes,
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
  if (!log || typeof log !== 'object') throw new Error('Registro de síntomas no válido.')

  const sessionUser = await requireUser()
  const previewPatientId = (await cookies()).get('evsoftware_preview_patient_id')?.value
  if (sessionUser.role === 'ADMIN' && previewPatientId) {
    throw new Error('Modo vista previa de solo lectura (Eva Vidal). No se pueden registrar síntomas.')
  }

  let actorUserId: string
  let scopedPatientId: string | null = null
  if (sessionUser.role === 'PATIENT') {
    const patientSession = await requirePatient()
    if (!patientSession.patientId) throw new Error('Paciente no identificado.')
    actorUserId = patientSession.user.id
    scopedPatientId = patientSession.patientId
  } else if (sessionUser.role === 'ADMIN') {
    const admin = await requireAdmin()
    actorUserId = admin.id
  } else {
    throw new Error('No autorizado para modificar este protocolo.')
  }

  const current = await prisma.clinicalProtocolRecord.findFirst({
    where: scopedPatientId
      ? { id: recordId, patientId: scopedPatientId }
      : {
          id: recordId,
          patient: { userId: actorUserId, isActive: true, isHardDeleted: false },
        },
    select: { id: true, patientId: true },
  })
  if (!current) throw new Error('Registro de protocolo no encontrado')

  const parsedDate = new Date(log.date)
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  const safeLog = {
    id: randomUUID(),
    date: safeDate.toISOString(),
    bristolScale: boundedScore(log.bristolScale, 1, 7, 4),
    bloatingScore: boundedScore(log.bloatingScore, 0, 10, 0),
    painScore: boundedScore(log.painScore, 0, 10, 0),
    gasScore: boundedScore(log.gasScore, 0, 10, 0),
    ...(typeof log.suspectedFood === 'string' && log.suspectedFood.trim()
      ? { suspectedFood: log.suspectedFood.trim().slice(0, 200) }
      : {}),
    ...(typeof log.notes === 'string' && log.notes.trim()
      ? { notes: log.notes.trim().slice(0, 2000) }
      : {}),
    recordedAt: new Date().toISOString(),
  }

  // El diario vive en una columna JSON. Sin un bloqueo de fila, dos registros
  // simultáneos podrían leer el mismo array y el último UPDATE borraría el
  // anterior. Se bloquea la fila y se relee dentro de la transacción.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "ClinicalProtocolRecord" WHERE "id" = ${current.id} FOR UPDATE`

    const fresh = await tx.clinicalProtocolRecord.findFirst({
      where: scopedPatientId
        ? { id: current.id, patientId: scopedPatientId }
        : {
            id: current.id,
            patient: { userId: actorUserId, isActive: true, isHardDeleted: false },
          },
      select: { id: true, patientId: true, symptomLogJson: true },
    })
    if (!fresh) throw new Error('Registro de protocolo no encontrado')

    let logs: Array<Record<string, unknown>> = []
    try {
      const parsed: unknown = JSON.parse(fresh.symptomLogJson || '[]')
      if (Array.isArray(parsed)) logs = parsed.slice(0, 199)
    } catch {
      logs = []
    }
    logs.unshift(safeLog)

    const record = await tx.clinicalProtocolRecord.update({
      where: { id: fresh.id },
      data: {
        symptomLogJson: JSON.stringify(logs),
      },
      // No devolver al portal las notas clínicas internas del protocolo.
      select: { id: true, symptomLogJson: true },
    })
    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        patientId: fresh.patientId,
        action: 'SYMPTOM_LOG_ADDED',
        entityType: 'CLINICAL_PROTOCOL',
        entityId: fresh.id,
        details: `Registro de síntomas añadido (Bristol ${safeLog.bristolScale}/7, hinchazón ${safeLog.bloatingScore}/10, dolor ${safeLog.painScore}/10, gases ${safeLog.gasScore}/10).`,
      },
    })
    return record
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

  if (
    !Array.isArray(glucoseReadings) ||
    glucoseReadings.length === 0 ||
    glucoseReadings.length > 10_000 ||
    glucoseReadings.some((value) => !Number.isFinite(value) || value < 20 || value > 600)
  ) {
    throw new Error('Las lecturas de glucosa deben ser números entre 20 y 600 mg/dL.')
  }
  const analysis = parseCGMData(glucoseReadings)
  const safeNotes = String(notes || '').trim().slice(0, 10_000) || analysis.assessment

  const record = await prisma.clinicalProtocolRecord.create({
    data: {
      patientId,
      type: 'DIABETES_CGM',
      title: 'Informe de Glucemia Continua (CGM FreeStyle/Dexcom)',
      parametersJson: JSON.stringify(analysis),
      notes: safeNotes,
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
  if (!['ACTIVE', 'COMPLETED', 'PAUSED'].includes(status)) throw new Error('Estado de protocolo no válido.')
  const userId = await requireUserId()
  const current = await prisma.clinicalProtocolRecord.findFirst({
    where: { id: recordId, patient: { userId } },
  })
  if (!current) throw new Error('Protocolo no encontrado.')

  const updated = await prisma.clinicalProtocolRecord.update({
    where: { id: recordId },
    data: { status },
  })

  revalidatePath(`/dashboard/patients/${current.patientId}`)
  return updated
}
