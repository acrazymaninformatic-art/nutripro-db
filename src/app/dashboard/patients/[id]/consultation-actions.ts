'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createSoapConsultation(formData: FormData) {
  const admin = await requireAdmin()

  const patientId = String(formData.get('patientId') || '')
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const dateStr = String(formData.get('date') || new Date().toISOString())
  const consultationDate = new Date(dateStr)
  if (Number.isNaN(consultationDate.getTime())) throw new Error('La fecha de la consulta no es válida.')
  const subjectiveNotes = String(formData.get('subjectiveNotes') || '').trim().slice(0, 20_000) || null
  const objectiveNotes = String(formData.get('objectiveNotes') || '').trim().slice(0, 20_000) || null
  const assessmentNotes = String(formData.get('assessmentNotes') || '').trim().slice(0, 20_000) || null
  const planNotes = String(formData.get('planNotes') || '').trim().slice(0, 20_000) || null
  const clinicianSignature = String(formData.get('clinicianSignature') || '').trim().slice(0, 500) || null
  const patientSummary = String(formData.get('patientSummary') || '').trim().slice(0, 20_000) || null
  const attachments = String(formData.get('attachments') || '').trim().slice(0, 1_000) || null
  const isSharedWithPatient = formData.get('isSharedWithPatient') === 'true'

  if (isSharedWithPatient && !patientSummary) {
    throw new Error('Para compartir una consulta con el paciente, redacta un resumen específico para él.')
  }

  const consultation = await prisma.$transaction(async (tx) => {
    const created = await tx.consultation.create({
      data: {
        patientId,
        date: consultationDate,
        notes: assessmentNotes || subjectiveNotes || 'Consulta clínica',
        subjectiveNotes,
        objectiveNotes,
        assessmentNotes,
        planNotes,
        clinicianSignature,
        patientSummary,
        attachments,
        isSharedWithPatient,
      },
    })
    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId,
        action: 'CONSULTATION_CREATED',
        entityType: 'Consultation',
        entityId: created.id,
        details: `Consulta registrada. Compartida con el paciente: ${isSharedWithPatient ? 'sí' : 'no'}.`,
      },
    })
    return created
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return consultation
}

export async function deleteConsultation(consultationId: string, patientId: string) {
  const admin = await requireAdmin()

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, patientId, patient: { userId: admin.id } },
    select: { id: true, date: true },
  })
  if (!consultation) throw new Error('Consulta no encontrada.')

  await prisma.$transaction([
    prisma.consultation.delete({
      where: { id: consultationId },
    }),
    prisma.auditLog.create({
      data: {
        userId: admin.id,
        patientId,
        action: 'CONSULTATION_DELETED',
        entityType: 'Consultation',
        entityId: consultation.id,
        details: `Consulta del ${consultation.date.toISOString()} eliminada.`,
      },
    }),
  ])

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function toggleConsultationSharing(consultationId: string, patientId: string, isShared: boolean) {
  const admin = await requireAdmin()
  if (typeof isShared !== 'boolean') throw new Error('El estado de compartición no es válido.')

  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, patientId, patient: { userId: admin.id } },
    select: { id: true, patientSummary: true },
  })
  if (!consultation) throw new Error('Consulta no encontrada.')
  if (isShared && !consultation.patientSummary?.trim()) {
    throw new Error('No se puede compartir una consulta sin un resumen específico para el paciente.')
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.consultation.update({
      where: { id: consultationId },
      data: { isSharedWithPatient: isShared },
    })
    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId,
        action: isShared ? 'CONSULTATION_SHARED_WITH_PATIENT' : 'CONSULTATION_SHARING_REVOKED',
        entityType: 'Consultation',
        entityId: consultation.id,
        details: isShared
          ? 'Consulta compartida con el paciente mostrando únicamente el resumen redactado para él.'
          : 'Acceso del paciente al resumen de la consulta revocado.',
      },
    })
    return result
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/documentos')
  return updated
}
