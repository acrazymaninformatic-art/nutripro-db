'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deletePrivateFileStrict } from '@/lib/storage/private-storage'
import { isPrivateStorageKey } from '@/lib/storage/private-file-url'
import { REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

async function ownedPatient(patientId: string, userId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')
}

export async function revokePatientConsent(patientId: string, reason: string) {
  const userId = await requireUserId()
  await ownedPatient(patientId, userId)
  const revokedAt = new Date()
  const safeReason =
    (typeof reason === 'string' ? reason.trim().slice(0, 500) : '') ||
    'Retirada del consentimiento solicitada por la persona interesada.'

  await prisma.$transaction(async (tx) => {
    await tx.patient.update({
      where: { id: patientId },
      data: {
        consentRevokedAt: revokedAt,
        consentRevocationReason: safeReason,
        // La retirada del consentimiento de datos de salud detiene el
        // tratamiento y cierra el acceso al portal de forma inmediata.
        portalAccessEnabled: false,
        consentDeliveryStatus: 'NOT_SENT',
      },
    })
    await tx.patientConsent.updateMany({
      where: {
        patientId,
        type: { in: REQUIRED_PORTAL_CONSENTS.map((consent) => consent.type) },
        revokedAt: null,
      },
      data: {
        accepted: false,
        revokedAt,
        revocationReason: safeReason,
        status: 'NOT_SENT',
      },
    })
    await tx.user.updateMany({
      where: { patientId },
      data: {
        sessionRevokedAt: revokedAt,
        sessionVersion: { increment: 1 },
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
      },
    })
    await tx.auditLog.create({
      data: {
        userId,
        patientId,
        action: 'CONSENT_REVOKED',
        entityType: 'Patient',
        entityId: patientId,
        details: `Consentimiento de datos de salud retirado. Acceso al portal bloqueado y sesiones invalidadas. Motivo: ${safeReason}`,
      },
    })
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  revalidatePath('/paciente')
  return { message: 'Consentimiento retirado. El acceso al portal ha quedado bloqueado y las sesiones han sido invalidadas.' }
}

export async function registerDataSubjectRequest(patientId: string, requestType: 'EXPORT' | 'ERASURE') {
  const userId = await requireUserId()
  if (requestType !== 'EXPORT' && requestType !== 'ERASURE') {
    throw new Error('Tipo de solicitud RGPD no válido.')
  }
  await ownedPatient(patientId, userId)
  const existing = await prisma.dataSubjectRequest.findFirst({ where: { userId, patientId, requestType, status: { in: ['PENDING', 'IN_PROGRESS'] } }, select: { id: true } })
  if (existing) return { message: 'Ya existe una solicitud abierta de este tipo.' }
  await prisma.$transaction([
    prisma.dataSubjectRequest.create({ data: { userId, patientId, requestType } }),
    prisma.auditLog.create({ data: { userId, patientId, action: `RGPD_${requestType}_REQUESTED`, entityType: 'Patient', entityId: patientId } }),
  ])
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { message: requestType === 'EXPORT' ? 'Solicitud de exportación registrada. Ya puedes descargar la copia desde esta ficha.' : 'Solicitud de eliminación registrada para revisión antes de borrar permanentemente.' }
}

async function releaseErasureClaim(
  requestId: string,
  userId: string,
  patientId: string,
  error: unknown
) {
  const reason = error instanceof Error ? error.message.slice(0, 500) : 'Error desconocido'
  try {
    // La solicitud vuelve a quedar pendiente para poder reintentarse tras
    // corregir la causa. Sin esto quedaría bloqueada en IN_PROGRESS para
    // siempre aunque no se hubiera borrado ningún dato.
    await prisma.$transaction([
      prisma.dataSubjectRequest.updateMany({
        where: { id: requestId, userId, status: 'IN_PROGRESS' },
        data: { status: 'PENDING' },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          patientId,
          action: 'RGPD_ERASURE_FAILED',
          entityType: 'DataSubjectRequest',
          entityId: requestId,
          details: `Supresión abortada sin borrar el expediente. Motivo: ${reason}`,
        },
      }),
    ])
  } catch (releaseError) {
    // Nunca se oculta el error original por un fallo al liberar la solicitud.
    console.error('No se pudo liberar la reclamación de la solicitud de supresión:', releaseError)
  }
}

async function deletePatientData(input: {
  requestId: string
  userId: string
  patientId: string
  notes: string
  reviewer: string
  privateFiles: string[]
}) {
  const { requestId, userId, patientId, notes, reviewer, privateFiles } = input

  const counts = await Promise.all([
    prisma.anthropometry.count({ where: { patientId } }),
    prisma.mealPlan.count({ where: { patientId } }),
    prisma.consultation.count({ where: { patientId } }),
    prisma.patientConsent.count({ where: { patientId } }),
    prisma.patientDocument.count({ where: { patientId } }),
    prisma.progressPhoto.count({ where: { patientId } }),
    prisma.patientQuestionnaire.count({ where: { patientId } }),
    prisma.anamnesisSubmission.count({ where: { patientId } }),
  ])

  // Primero se borran los objetos del storage. Si alguno falla, se aborta antes
  // de tocar la base de datos para no dejar archivos clínicos huérfanos.
  await Promise.all(privateFiles.map((storageKey) => deletePrivateFileStrict(storageKey)))

  const executedAt = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        // La auditoria se conserva aunque se borre el expediente y la cuenta.
        userId,
        patientId,
        action: 'RGPD_ERASURE_EXECUTED',
        entityType: 'PATIENT',
        entityId: patientId,
        details: JSON.stringify({
          requestId,
          legalReview: notes,
          reviewedBy: reviewer,
          counts: {
            anthropometries: counts[0],
            mealPlans: counts[1],
            consultations: counts[2],
            consents: counts[3],
            documents: counts[4],
            photos: counts[5],
            questionnaires: counts[6],
            anamnesisSubmissions: counts[7],
          },
          executedAt: executedAt.toISOString(),
        }),
      },
    })

    // La solicitud sobrevive al borrado del paciente (patientId pasa a NULL).
    // Se cierra en la misma transaccion para no dejarla pendiente.
    const closed = await tx.dataSubjectRequest.updateMany({
      where: { id: requestId, userId, status: 'IN_PROGRESS' },
      data: {
        status: 'COMPLETED',
        completedAt: executedAt,
        notes,
        legalReviewedAt: executedAt,
        legalReviewedBy: userId,
      },
    })
    if (closed.count !== 1) {
      throw new Error('La solicitud de supresión cambió de estado durante la ejecución.')
    }

    // EmailLog.patientId es SetNull: sin este borrado expreso sobrevivirían
    // el correo, el nombre y el asunto del paciente tras la supresión.
    await tx.emailLog.deleteMany({ where: { patientId } })

    await tx.patient.delete({ where: { id: patientId } })
  })

  return { deleted: true, counts }
}

async function executeErasure(requestId: string, userId: string, notes: string) {
  const request = await prisma.dataSubjectRequest.findFirst({
    where: {
      id: requestId,
      userId,
      requestType: 'ERASURE',
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: {
      patient: {
        include: {
          documents: { select: { fileUrl: true } },
          photos: { select: { photoUrl: true } },
          patientQuestionnaires: { select: { attachmentsJson: true } },
        },
      },
    },
  })
  if (!request) throw new Error('Solicitud de supresión no encontrada.')

  if (!request.patientId || !request.patient) {
    throw new Error('Solicitud de supresión no encontrada o ya ejecutada.')
  }
  const patientId = request.patientId

  const username = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })
  const reviewer = username ? `${username.name} <${username.email}>` : userId
  const questionnaireFiles: string[] = []
  for (const questionnaire of request.patient.patientQuestionnaires) {
    if (!questionnaire.attachmentsJson) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(questionnaire.attachmentsJson)
    } catch {
      throw new Error(
        'El expediente contiene un adjunto de cuestionario ilegible. Revisa y migra ese adjunto antes de ejecutar la supresión definitiva.'
      )
    }
    if (!Array.isArray(parsed)) {
      throw new Error(
        'El expediente contiene un adjunto de cuestionario con formato desconocido. Revisa y migra ese adjunto antes de ejecutar la supresión definitiva.'
      )
    }
    for (const attachment of parsed) {
      if (
        attachment &&
        typeof attachment === 'object' &&
        'url' in attachment &&
        typeof (attachment as { url?: unknown }).url === 'string'
      ) {
        questionnaireFiles.push((attachment as { url: string }).url)
      }
    }
  }
  const privateFiles = Array.from(
    new Set([
      ...request.patient.documents.map((document) => document.fileUrl),
      ...request.patient.photos.map((photo) => photo.photoUrl),
      ...questionnaireFiles,
    ])
  )

  // Una URL externa heredada no se puede borrar con el storage privado. Si se
  // ignora, la supresión quedaría incompleta y se declararía un borrado que no
  // lo es. Se bloquea antes de reclamar la solicitud: así queda PENDING y no
  // atrapada en IN_PROGRESS por un preflight que no ha borrado nada.
  const legacyExternalFiles = privateFiles.filter(
    (storageKey) => !storageKey || !isPrivateStorageKey(storageKey)
  )
  if (legacyExternalFiles.length > 0) {
    throw new Error(
      `El expediente contiene ${legacyExternalFiles.length} archivo(s) con una referencia externa heredada. Migra o elimina esos archivos antes de ejecutar la supresión definitiva.`
    )
  }

  // Reclamar la solicitud de forma atómica antes de borrar archivos evita que
  // dos peticiones simultáneas ejecuten la supresión dos veces.
  const claimed = await prisma.dataSubjectRequest.updateMany({
    where: {
      id: requestId,
      userId,
      requestType: 'ERASURE',
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    data: { status: 'IN_PROGRESS' },
  })
  if (claimed.count !== 1) {
    throw new Error('La solicitud ya ha sido reclamada por otra ejecución.')
  }

  try {
    return await deletePatientData({
      requestId,
      userId,
      patientId,
      notes,
      reviewer,
      privateFiles,
    })
  } catch (error) {
    await releaseErasureClaim(requestId, userId, patientId, error)
    throw error
  }
}

export async function resolveDataSubjectRequest(
  requestId: string,
  status: 'COMPLETED' | 'REJECTED',
  notes?: string,
  legalReviewConfirmed = false
) {
  const userId = await requireUserId()
  if (status !== 'COMPLETED' && status !== 'REJECTED') {
    throw new Error('Estado de solicitud no válido.')
  }
  const request = await prisma.dataSubjectRequest.findFirst({
    where: {
      id: requestId,
      userId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    select: { id: true, patientId: true, requestType: true, status: true },
  })
  if (!request) throw new Error('Solicitud RGPD no encontrada.')

  const safeNotes = typeof notes === 'string' ? notes.trim().slice(0, 2000) : ''
  const now = new Date()

  if (request.requestType === 'ERASURE' && status === 'COMPLETED') {
    if (!request.patientId) {
      throw new Error('Esta solicitud ya no tiene un expediente asociado. No se puede volver a ejecutar.')
    }
    // Los argumentos de una Server Action no son de fianza: un valor truthy
    // como la cadena "false" no puede sustituir la confirmación booleana.
    if (legalReviewConfirmed !== true) {
      throw new Error('La supresión definitiva requiere confirmación expresa de revisión legal.')
    }
    if (!safeNotes) {
      throw new Error('Documenta la base jurídica y el alcance de la supresión antes de ejecutarla.')
    }
    const result = await executeErasure(requestId, userId, safeNotes)
    revalidatePath('/dashboard/patients')
    revalidatePath('/dashboard/operations')
    revalidatePath('/dashboard/audit')
    return {
      message: `Expediente suprimido definitivamente. Registros eliminados: ${Object.values(result.counts).reduce((sum, count) => sum + count, 0)}. La trazabilidad de la supresión se conserva en auditoría.`,
      // El expediente ya no existe: el panel debe salir de su ficha en lugar
      // de refrescarla y acabar en un 404 tras un borrado correcto.
      patientDeleted: true,
    }
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.dataSubjectRequest.updateMany({
      where: { id: request.id, userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? now : null,
        notes: safeNotes || undefined,
        // `legalReviewedAt` se reserva para la supresión, que exige revisión
        // legal expresa. Una exportación completada no implica esa revisión.
      },
    })
    if (updated.count !== 1) {
      throw new Error('La solicitud ya había sido resuelta por otra persona.')
    }
    await tx.auditLog.create({
      data: {
        userId,
        patientId: request.patientId,
        action: `RGPD_${request.requestType}_${status}`,
        entityType: 'DataSubjectRequest',
        entityId: request.id,
        details: safeNotes || null,
      },
    })
  })

  if (request.patientId) revalidatePath(`/dashboard/patients/${request.patientId}`)
  revalidatePath('/dashboard/operations')
  return { message: status === 'COMPLETED' ? 'Solicitud marcada como completada.' : 'Solicitud marcada como rechazada.' }
}
