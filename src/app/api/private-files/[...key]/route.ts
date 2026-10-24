import { getSessionUser, isEmergencyLockdownActive } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'
import {
  createSignedPrivateUrl,
  isPrivateStorageKey,
  readLocalPrivateFile,
  stripPrivatePrefix,
  validatePrivateObjectKey,
} from '@/lib/storage/private-storage'

export const dynamic = 'force-dynamic'

function notFound() {
  return new Response('Archivo no encontrado.', { status: 404 })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params
  const objectKey = (key || []).join('/')
  if (!validatePrivateObjectKey(objectKey)) return notFound()

  const storageKey = `private://${objectKey}`
  const patientId = objectKey.split('/')[1]
  const user = await getSessionUser()
  if (!user) return new Response('No autorizado.', { status: 401 })
  if (user.role === 'ADMIN' && (!user.mfaEnabled || user.passwordChangeRequired)) {
    return new Response('Completa la configuración de seguridad antes de acceder a archivos clínicos.', {
      status: 403,
    })
  }
  if (user.role === 'PATIENT' && user.passwordChangeRequired) {
    return new Response('Debes cambiar la contraseña antes de acceder a archivos clínicos.', {
      status: 403,
    })
  }

  const patient = await prisma.patient.findFirst({
    where: { id: patientId },
    select: {
      id: true,
      userId: true,
      portalAccessEnabled: true,
      isHardDeleted: true,
      isActive: true,
      consentRevokedAt: true,
      consentAcceptedAt: true,
      consentPolicyVersion: true,
      consents: {
        where: {
          type: { in: REQUIRED_PORTAL_CONSENTS.map((consent) => consent.type) },
          version: LEGAL_POLICY_VERSION,
          accepted: true,
          revokedAt: null,
          status: 'COMPLETED',
        },
        select: { type: true },
      },
    },
  })
  if (!patient || patient.isHardDeleted) return notFound()

  if (user.role === 'ADMIN') {
    // La profesional conserva acceso a expedientes archivados por motivos
    // clínicos y de conservación; el portal del paciente queda cortado.
    if (patient.userId !== user.id) return notFound()
  } else if (user.role === 'PATIENT') {
    if (!patient.isActive || user.patientId !== patient.id || !patient.portalAccessEnabled) return notFound()
    const hasActiveConsent =
      !patient.consentRevokedAt &&
      Boolean(patient.consentAcceptedAt) &&
      patient.consentPolicyVersion === LEGAL_POLICY_VERSION &&
      REQUIRED_PORTAL_CONSENTS.every((requiredConsent) =>
        patient.consents.some((consent) => consent.type === requiredConsent.type)
      )
    if (!hasActiveConsent) {
      return new Response('Debes aceptar los consentimientos vigentes antes de acceder a tus archivos.', {
        status: 403,
      })
    }
    // El aislamiento preventivo también cubre el acceso directo a archivos
    // privados, no solo las páginas del portal.
    if (await isEmergencyLockdownActive()) {
      return new Response('El portal está temporalmente en aislamiento preventivo.', { status: 403 })
    }
  } else {
    return notFound()
  }

  const [document, photo] = await Promise.all([
    prisma.patientDocument.findFirst({
      where: { patientId: patient.id, fileUrl: storageKey },
      select: { id: true, title: true, fileName: true, isSharedWithPatient: true },
    }),
    prisma.progressPhoto.findFirst({
      where: { patientId: patient.id, photoUrl: storageKey },
      select: { id: true, label: true },
    }),
  ])

  if (!document && !photo) return notFound()
  // El paciente solo puede abrir documentos expresamente compartidos. Las
  // fotografías de evolución son de uso clínico interno y no se sirven por
  // esta ruta al portal.
  if (user.role === 'PATIENT' && (!document || !document.isSharedWithPatient)) return notFound()

  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        patientId: patient.id,
        action: document ? 'PRIVATE_DOCUMENT_ACCESSED' : 'PRIVATE_PHOTO_ACCESSED',
        entityType: document ? 'PatientDocument' : 'ProgressPhoto',
        entityId: document?.id || photo?.id,
        details: document ? `Acceso privado al documento "${document.fileName}"` : 'Acceso privado a fotografía de evolución',
      },
    })
  } catch (error) {
    console.error('No se pudo auditar el acceso al archivo privado:', error)
  }

  const signedUrl = await createSignedPrivateUrl(storageKey, 60)
  if (signedUrl) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: signedUrl,
        'Cache-Control': 'private, no-store, max-age=0',
        'Referrer-Policy': 'no-referrer',
      },
    })
  }

  const localFile = await readLocalPrivateFile(storageKey)
  if (!localFile) return notFound()

  const fileName = encodeURIComponent(document?.fileName || `${photo?.label || 'foto'}.jpg`)
  return new Response(new Uint8Array(localFile.bytes), {
    status: 200,
    headers: {
      'Content-Type': localFile.mimeType,
      'Content-Length': String(localFile.bytes.byteLength),
      'Content-Disposition': `inline; filename*=UTF-8''${fileName}`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
