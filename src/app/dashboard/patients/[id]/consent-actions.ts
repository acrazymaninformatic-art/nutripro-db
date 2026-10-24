'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

const ALLOWED_CONSENT_TYPES = new Set([
  ...REQUIRED_PORTAL_CONSENTS.map((consent) => consent.type),
  'RGPD',
  'INFORMED_CONSENT',
  'IMAGE_RIGHTS',
  'ONLINE_CONSULTATION',
])

async function ownedPatient(patientId: string, userId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })
  if (!patient) throw new Error('Paciente no encontrado.')
  return patient
}

export async function createPatientConsent(patientId: string, type: string, title: string) {
  const admin = await requireAdmin()
  await ownedPatient(patientId, admin.id)
  if (!ALLOWED_CONSENT_TYPES.has(type)) throw new Error('Tipo de consentimiento no permitido.')

  const required = REQUIRED_PORTAL_CONSENTS.find((consent) => consent.type === type)
  const safeTitle = String(required?.title || title || '').trim().slice(0, 200)
  if (!safeTitle) throw new Error('El consentimiento debe tener un título.')
  if (required) {
    const existing = await prisma.patientConsent.findFirst({
      where: {
        patientId,
        type,
        version: LEGAL_POLICY_VERSION,
        revokedAt: null,
      },
      select: { id: true },
    })
    if (existing) {
      throw new Error('Ya existe un consentimiento vigente de este tipo para el paciente.')
    }
  }
  const consent = await prisma.patientConsent.create({
    data: {
      patientId,
      type,
      title: safeTitle,
      version: required ? LEGAL_POLICY_VERSION : '1.0',
      status: 'NOT_SENT',
      accepted: false,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId,
      action: 'CONSENT_CREATED',
      entityType: 'PatientConsent',
      entityId: consent.id,
      details: `Consentimiento "${consent.title}" creado pendiente de firma.`,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return consent
}

export async function acceptPatientConsentByAdmin(consentId: string, patientId: string) {
  const admin = await requireAdmin()
  await ownedPatient(patientId, admin.id)

  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId },
    select: { id: true, type: true, title: true, version: true, revokedAt: true, accepted: true, status: true },
  })
  if (!consent) throw new Error('Consentimiento no encontrado.')
  if (consent.revokedAt) {
    throw new Error('Este consentimiento está retirado. Crea un documento nuevo para la nueva aceptación.')
  }
  if (consent.accepted || consent.status === 'COMPLETED') {
    throw new Error('Este consentimiento ya está firmado y no puede modificarse.')
  }
  const isRequiredConsent = REQUIRED_PORTAL_CONSENTS.some((item) => item.type === consent.type)
  if (isRequiredConsent && consent.version !== LEGAL_POLICY_VERSION) {
    throw new Error('Este consentimiento pertenece a una versión anterior. Crea el documento vigente antes de firmarlo.')
  }

  const acceptedAt = new Date()
  await prisma.$transaction(async (tx) => {
    const updated = await tx.patientConsent.updateMany({
      where: {
        id: consentId,
        patientId,
        revokedAt: null,
        accepted: false,
        status: { not: 'COMPLETED' },
        ...(isRequiredConsent ? { version: LEGAL_POLICY_VERSION } : {}),
      },
      data: {
        accepted: true,
        acceptedAt,
        status: 'COMPLETED',
        signatureData: `Firma presencial verificada por ${admin.name} (${admin.email})`,
        revokedAt: null,
        revocationReason: null,
      },
    })
    if (updated.count !== 1) {
      throw new Error('Este consentimiento ya fue firmado por otra persona. Recarga la ficha.')
    }

    // Si ya constan todos los consentimientos obligatorios vigentes, la
    // retirada global puede levantarse; el acceso al portal se reactiva aparte.
    const active = await tx.patientConsent.findMany({
      where: {
        patientId,
        type: { in: REQUIRED_PORTAL_CONSENTS.map((item) => item.type) },
        version: LEGAL_POLICY_VERSION,
        accepted: true,
        revokedAt: null,
        status: 'COMPLETED',
      },
      select: { type: true },
    })
    const allRequired = REQUIRED_PORTAL_CONSENTS.every((item) => active.some((row) => row.type === item.type))
    if (allRequired) {
      const patient = await tx.patient.findUnique({
        where: { id: patientId },
        select: {
          consentAcceptedAt: true,
          consentPolicyVersion: true,
          consentRevokedAt: true,
        },
      })
      const alreadyCurrent = Boolean(
        patient?.consentAcceptedAt &&
        patient.consentPolicyVersion === LEGAL_POLICY_VERSION &&
        !patient.consentRevokedAt
      )
      await tx.patient.update({
        where: { id: patientId },
        data: {
          consentAcceptedAt: alreadyCurrent ? patient!.consentAcceptedAt : acceptedAt,
          consentPolicyVersion: LEGAL_POLICY_VERSION,
          ...(alreadyCurrent
            ? {}
            : { consentRevokedAt: null, consentRevocationReason: null }),
          consentDeliveryStatus: 'COMPLETED',
        },
      })
    }

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId,
        action: 'CONSENT_ACCEPTED_IN_PERSON',
        entityType: 'PatientConsent',
        entityId: consent.id,
        details: `Consentimiento "${consent.title}" firmado presencialmente y verificado por la profesional.`,
      },
    })
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function revokePatientConsent(consentId: string, patientId: string, reason: string) {
  const admin = await requireAdmin()
  await ownedPatient(patientId, admin.id)

  const consent = await prisma.patientConsent.findFirst({
    where: { id: consentId, patientId },
    select: { id: true, type: true, title: true, revokedAt: true },
  })
  if (!consent) throw new Error('Consentimiento no encontrado.')
  if (consent.revokedAt) {
    throw new Error('Este consentimiento ya está retirado. No se puede volver a retirar.')
  }

  const revokedAt = new Date()
  const safeReason = String(reason || '').trim().slice(0, 500) || 'Revocado por solicitud del interesado'
  const isRequired = REQUIRED_PORTAL_CONSENTS.some((item) => item.type === consent.type)

  await prisma.$transaction(async (tx) => {
    const updated = await tx.patientConsent.updateMany({
      where: { id: consentId, patientId, revokedAt: null },
      data: {
        accepted: false,
        revokedAt,
        revocationReason: safeReason,
        status: 'NOT_SENT',
      },
    })
    if (updated.count !== 1) {
      throw new Error('Este consentimiento ya está retirado. No se puede volver a retirar.')
    }
    if (isRequired) {
      await tx.patient.update({
        where: { id: patientId },
        data: {
          consentRevokedAt: revokedAt,
          consentRevocationReason: safeReason,
          portalAccessEnabled: false,
          consentDeliveryStatus: 'NOT_SENT',
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
    }
    await tx.auditLog.create({
      data: {
        userId: admin.id,
        patientId,
        action: isRequired ? 'CONSENT_REVOKED_ACCESS_BLOCKED' : 'CONSENT_REVOKED',
        entityType: 'PatientConsent',
        entityId: consent.id,
        details: `${consent.title}: ${safeReason}${isRequired ? '. Portal y sesiones bloqueados.' : ''}`,
      },
    })
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true, portalBlocked: isRequired }
}
