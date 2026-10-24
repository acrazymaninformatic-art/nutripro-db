'use server'

import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { deletePrivateFileStrict, savePrivateFile } from '@/lib/storage/private-storage'

const ALLOWED_CATEGORIES = new Set(['ANALYSIS', 'MEDICAL_REPORT', 'BODY_COMP', 'DIET_HISTORY', 'OTHER'])

export async function addPatientDocument(formData: FormData) {
  const userId = await requireUserId()

  const patientId = String(formData.get('patientId') || '')
  const title = String(formData.get('title') || '').trim().slice(0, 200)
  const categoryRaw = String(formData.get('category') || 'ANALYSIS')
  const category = ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : 'OTHER'
  const notes = String(formData.get('notes') || '').trim().slice(0, 2000) || null
  const isSharedWithPatient =
    formData.get('isSharedWithPatient') === 'true' || formData.get('isSharedWithPatient') === 'on'
  const file = formData.get('file')

  if (!patientId) throw new Error('Paciente no identificado.')
  if (!(file instanceof File) || file.size === 0) throw new Error('Selecciona un archivo para guardar el documento.')

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId, isActive: true, isHardDeleted: false },
    select: { id: true },
  })
  if (!patient) throw new Error('Paciente no encontrado.')

  const stored = await savePrivateFile({ patientId, category: 'documents', file })
  let doc
  try {
    doc = await prisma.$transaction(async (tx) => {
      const created = await tx.patientDocument.create({
        data: {
          patientId,
          title: title || stored.fileName,
          category,
          fileUrl: stored.storageKey,
          fileName: stored.fileName,
          fileSizeKb: stored.fileSizeKb,
          mimeType: stored.mimeType,
          notes,
          isSharedWithPatient,
        },
      })
      await tx.auditLog.create({
        data: {
          userId,
          patientId,
          action: 'PATIENT_DOCUMENT_UPLOADED',
          entityType: 'PatientDocument',
          entityId: created.id,
          details: `Documento "${created.title}" almacenado en almacenamiento privado. Compartido con el paciente: ${isSharedWithPatient ? 'sí' : 'no'}.`,
        },
      })
      return created
    })
  } catch (error) {
    await deletePrivateFileStrict(stored.storageKey).catch((cleanupError) => {
      console.error('No se pudo limpiar el documento huérfano:', cleanupError)
    })
    throw error
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/documentos')
  return doc
}

export async function toggleDocumentSharing(documentId: string, patientId: string, isShared: boolean) {
  const userId = await requireUserId()
  if (typeof isShared !== 'boolean') throw new Error('El estado de compartición no es válido.')

  const doc = await prisma.patientDocument.findFirst({
    where: { id: documentId, patientId, patient: { userId } },
    select: { id: true, title: true },
  })
  if (!doc) throw new Error('Documento no encontrado.')

  await prisma.$transaction([
    prisma.patientDocument.update({
      where: { id: doc.id },
      data: { isSharedWithPatient: isShared },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        patientId,
        action: isShared ? 'DOCUMENT_SHARED_WITH_PATIENT' : 'DOCUMENT_SHARING_REVOKED',
        entityType: 'PatientDocument',
        entityId: doc.id,
        details: `Documento "${doc.title}".`,
      },
    }),
  ])

  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/documentos')
  return { success: true }
}

export async function deletePatientDocument(documentId: string, patientId: string) {
  const userId = await requireUserId()

  const doc = await prisma.patientDocument.findFirst({
    where: { id: documentId, patientId, patient: { userId } },
    select: { id: true, title: true, fileUrl: true },
  })
  if (!doc) throw new Error('Documento no encontrado.')

  // Primero el binario; si el storage falla, el documento sigue en la ficha y
  // se puede reintentar. Después se eliminan metadatos y auditoría juntos.
  await deletePrivateFileStrict(doc.fileUrl)
  await prisma.$transaction([
    prisma.patientDocument.delete({ where: { id: doc.id } }),
    prisma.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'PATIENT_DOCUMENT_DELETED',
        entityType: 'PatientDocument',
        entityId: doc.id,
        details: `Documento "${doc.title}" eliminado.`,
      },
    }),
  ])

  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente/documentos')
  return { success: true }
}
