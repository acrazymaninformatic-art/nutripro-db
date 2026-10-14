'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function addPatientDocument(formData: FormData) {
  await requireAdmin()

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
  await requireAdmin()

  await prisma.patientDocument.update({
    where: { id: documentId },
    data: { isSharedWithPatient: isShared },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function deletePatientDocument(documentId: string, patientId: string) {
  await requireAdmin()

  await prisma.patientDocument.delete({
    where: { id: documentId },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
