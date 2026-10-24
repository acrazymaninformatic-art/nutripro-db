import 'server-only'

import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionPayload,
  verifySessionToken,
  createSessionTokenPayload,
  type SessionPayload,
} from '@/lib/session-token'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'info@evavidalnutricion.com').trim().toLowerCase()

export async function createSession(
  userOrId:
    | string
    | {
        id: string
        role?: string
        email?: string
        patientId?: string | null
        sessionVersion?: number
      }
) {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id
  let role = typeof userOrId === 'string' ? undefined : userOrId.role
  let email = typeof userOrId === 'string' ? undefined : userOrId.email
  let patientId = typeof userOrId === 'string' ? undefined : userOrId.patientId
  let sessionVersion = typeof userOrId === 'string' ? undefined : userOrId.sessionVersion

  if (!role || !email || sessionVersion === undefined) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, patientId: true, sessionVersion: true },
    })
    if (dbUser) {
      role = dbUser.role
      email = dbUser.email
      patientId = dbUser.patientId
      sessionVersion = dbUser.sessionVersion
    }
  }

  const payload = createSessionTokenPayload({ userId, role, email, patientId, sessionVersion })
  const secure = process.env.NODE_ENV === 'production'
  ;(await cookies()).set(SESSION_COOKIE, `${payload}.${signSessionPayload(payload)}`, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function destroySession() {
  ;(await cookies()).delete(SESSION_COOKIE)
}

export async function isEmergencyLockdownActive(): Promise<boolean> {
  try {
    const lockdown = await prisma.emergencyLockdown.findFirst({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })
    return !!lockdown
  } catch (error) {
    // Ante una duda técnica no se puede garantizar el aislamiento: se falla
    // cerrado para el portal y se deja rastro para que la profesional lo vea.
    console.error('No se pudo comprobar el aislamiento de emergencia; se bloquea el acceso al portal:', error)
    return true
  }
}

export async function getSessionUser() {
  let session: (SessionPayload & { expiresAt: number }) | null
  try {
    session = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
  } catch {
    return null
  }
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      patientId: true,
      licenseNumber: true,
      clinicName: true,
      phone: true,
      address: true,
      sessionRevokedAt: true,
      sessionVersion: true,
      passwordChangeRequired: true,
      mfaEnabled: true,
      mfaEnrolledAt: true,
      patientAccount: {
        select: {
          id: true,
          portalAccessEnabled: true,
          isHardDeleted: true,
          isActive: true,
          consentRevokedAt: true,
        },
      },
    },
  })
  if (!user) return null

  // Immediate session termination if the session was revoked (e.g. portal access blocked)
  if (user.sessionRevokedAt && user.sessionRevokedAt.getTime() > 0) {
    return null
  }

  // Ensure role, email and credential version match the signed session token
  if (session.role && user.role !== session.role) return null
  if (session.email && user.email.toLowerCase() !== session.email.toLowerCase()) return null
  if (session.sessionVersion === undefined || session.sessionVersion !== user.sessionVersion) return null

  // Immediate session termination if patient is suspended, deleted or inactive
  if (user.role === 'PATIENT') {
    if (
      user.patientAccount?.portalAccessEnabled === false ||
      user.patientAccount?.isHardDeleted ||
      user.patientAccount?.isActive === false
    ) {
      return null
    }
  }

  return user
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export interface RequireAdminOptions {
  /**
   * Permite unicamente la configuracion mientras el administrador no ha
   * completado el alta de MFA o debe cambiar la contrasena.
   */
  allowPendingSetup?: boolean
}

export async function requireAdmin(options: RequireAdminOptions = {}) {
  const user = await getSessionUser()
  const isAdminEmail = Boolean(user && user.email.toLowerCase() === ADMIN_EMAIL)
  if (!user || user.role !== 'ADMIN' || !isAdminEmail) {
    if (user) {
      // Alerta y auditoría inmutable de intento de acceso no autorizado a administración (3.6.1 y 3.6.9)
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            patientId: user.patientId,
            action: 'SECURITY_ALERT_UNAUTHORIZED_ADMIN_ROUTE',
            entityType: 'SECURITY',
            details: `Alerta de seguridad: Intento no autorizado de acceso a ruta de administración por ${user.email} (Rol: ${user.role}). Se responde con 404.`,
          },
        })
      } catch (err) {
        console.error('Error al registrar auditoría de seguridad:', err)
      }
    }
    notFound()
  }

  // Sin MFA o con cambio de contrasena pendiente no se puede ejecutar ninguna
  // accion clinica. Solo las pantallas y acciones de configuracion lo permiten.
  if ((!user.mfaEnabled || user.passwordChangeRequired) && !options.allowPendingSetup) {
    notFound()
  }
  return user
}

export interface RequirePatientOptions {
  /**
   * Permite acceder a la pantalla y a las acciones de firma de consentimientos
   * aunque el paciente todavía no haya aceptado la versión vigente. El resto
   * de acciones clínicas queda bloqueado.
   */
  allowPendingConsent?: boolean
  /**
   * Permite acceder únicamente a la configuración para completar el cambio de
   * contraseña obligatorio. Sin esta opción, cualquier acción clínica redirige
   * a la pantalla de cambio de contraseña.
   */
  allowPasswordChangePending?: boolean
}

export async function requirePatient(options: RequirePatientOptions = {}) {
  const user = await requireUser()
  const isAdminUser = user.role === 'ADMIN' && user.email.toLowerCase() === ADMIN_EMAIL
  if (isAdminUser) {
    // La vista previa solo puede abrirse tras completar MFA y elegir un
    // paciente propio. El servidor verifica ambas cosas; la cookie no basta.
    if (!user.mfaEnabled || user.passwordChangeRequired) {
      redirect('/dashboard/settings?mfa=required')
    }

    const cookieStore = await cookies()
    const previewPatientId = cookieStore.get('evsoftware_preview_patient_id')?.value
    if (!previewPatientId) {
      redirect('/dashboard/patients')
    }

    const previewPatient = await prisma.patient.findFirst({
      where: { id: previewPatientId, userId: user.id, isActive: true, isHardDeleted: false },
      select: { id: true },
    })
    if (!previewPatient) {
      // No se puede borrar la cookie durante el render: Next.js solo permite
      // modificarla en Server Actions o Route Handlers. El siguiente inicio de
      // vista previa la sobrescribe y, mientras tanto, no concede acceso.
      redirect('/dashboard/patients')
    }

    return {
      user,
      patientId: previewPatient.id,
      isAdminPreview: true,
    }
  }

  // Check emergency lockdown
  const isLocked = await isEmergencyLockdownActive()
  if (isLocked) {
    redirect('/bloqueo-seguridad')
  }

  if (user.role !== 'PATIENT' || !user.patientId) {
    redirect('/login')
  }

  if (
    user.patientAccount?.portalAccessEnabled === false ||
    user.patientAccount?.isHardDeleted ||
    user.patientAccount?.isActive === false
  ) {
    redirect('/login')
  }

  if (!options.allowPendingConsent) {
    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
      select: {
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
    const hasActiveConsents = Boolean(
      patient &&
        !patient.consentRevokedAt &&
        patient.consentAcceptedAt &&
        patient.consentPolicyVersion === LEGAL_POLICY_VERSION &&
        REQUIRED_PORTAL_CONSENTS.every((requiredConsent) =>
          patient.consents.some((consent) => consent.type === requiredConsent.type)
        )
    )
    if (!hasActiveConsents) {
      redirect('/paciente/politicas')
    }
  }

  if (user.passwordChangeRequired && !options.allowPasswordChangePending) {
    redirect('/paciente/configuracion?passwordChangeRequired=1')
  }

  return { user, patientId: user.patientId, isAdminPreview: false }
}

export async function requireUserId() {
  return (await requireAdmin()).id
}


