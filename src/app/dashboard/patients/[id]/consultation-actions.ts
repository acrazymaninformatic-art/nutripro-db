'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createSoapConsultation(formData: FormData) {
  await requireAdmin()

  const patientId = String(formData.get('patientId') || '')
  const dateStr = String(formData.get('date') || new Date().toISOString())
  const subjectiveNotes = String(formData.get('subjectiveNotes') || '').trim() || null
  const objectiveNotes = String(formData.get('objectiveNotes') || '').trim() || null
  const assessmentNotes = String(formData.get('assessmentNotes') || '').trim() || null
  const planNotes = String(formData.get('planNotes') || '').trim() || null
  const isSharedWithPatient = formData.get('isSharedWithPatient') === 'true'

  if (!patientId) throw new Error('Paciente no especificado.')

  const consultation = await prisma.consultation.create({
    data: {
      patientId,
      date: new Date(dateStr),
      notes: assessmentNotes || subjectiveNotes || 'Consulta clínica',
      subjectiveNotes,
      objectiveNotes,
      assessmentNotes,
      planNotes,
      isSharedWithPatient,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return consultation
}

export async function deleteConsultation(consultationId: string, patientId: string) {
  await requireAdmin()

  await prisma.consultation.delete({
    where: { id: consultationId },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
