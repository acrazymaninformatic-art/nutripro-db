'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin, requireUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function addPatientDocument(formData: FormData) {
  const userId = await requireUserId()

  const patientId = String(formData.get('patientId') || '')
  const title = String(formData.get('title') || '').trim()
  const category = String(formData.get('category') || 'ANALYSIS')
  const fileUrl = String(formData.get('fileUrl') || '').trim()
  const fileName = String(formData.get('fileName') || title)
  const notes = String(formData.get('notes') || '').trim() || null
  const isSharedWithPatient = formData.get('isSharedWithPatient') === 'true'

  if (!patientId || !title || !fileUrl) {
    throw new Error('Faltan campos obligatorios para guardar el documento.')
  }

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const doc = await prisma.patientDocument.create({
    data: {
      patientId,
      title,
      category,
      fileUrl,
      fileName,
      notes,
      isSharedWithPatient,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return doc
}

export async function toggleDocumentSharing(documentId: string, patientId: string, isShared: boolean) {
  const userId = await requireUserId()

  const doc = await prisma.patientDocument.findFirst({
    where: { id: documentId, patientId, patient: { userId } },
    select: { id: true },
  })
  if (!doc) throw new Error('Documento no encontrado.')

  await prisma.patientDocument.update({
    where: { id: documentId },
    data: { isSharedWithPatient: isShared },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function deletePatientDocument(documentId: string, patientId: string) {
  const userId = await requireUserId()

  const doc = await prisma.patientDocument.findFirst({
    where: { id: documentId, patientId, patient: { userId } },
    select: { id: true },
  })
  if (!doc) throw new Error('Documento no encontrado.')

  await prisma.patientDocument.delete({
    where: { id: documentId },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
