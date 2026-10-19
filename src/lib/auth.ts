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

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'info@evavidalnutricion.com').trim().toLowerCase()

export async function createSession(
  userOrId: string | { id: string; role?: string; email?: string; patientId?: string | null }
) {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id
  let role = typeof userOrId === 'string' ? undefined : userOrId.role
  let email = typeof userOrId === 'string' ? undefined : userOrId.email
  let patientId = typeof userOrId === 'string' ? undefined : userOrId.patientId

  if (!role || !email) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, patientId: true },
    })
    if (dbUser) {
      role = dbUser.role
      email = dbUser.email
      patientId = dbUser.patientId
    }
  }

  const payload = createSessionTokenPayload({ userId, role, email, patientId })
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
  } catch {
    return false
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
      patientAccount: {
        select: {
          id: true,
          portalAccessEnabled: true,
          isHardDeleted: true,
        },
      },
    },
  })
  if (!user) return null

  // Immediate session termination if the session was revoked (e.g. portal access blocked)
  if (user.sessionRevokedAt && user.sessionRevokedAt.getTime() > 0) {
    return null
  }

  // Ensure role and email match the cryptographically signed session token
  if (session.role && user.role !== session.role) return null
  if (session.email && user.email.toLowerCase() !== session.email.toLowerCase()) return null

  // Immediate session termination if patient is suspended or deleted
  if (user.role === 'PATIENT') {
    if (user.patientAccount?.portalAccessEnabled === false || user.patientAccount?.isHardDeleted) {
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

export async function requireAdmin() {
  const user = await getSessionUser()
  const isAdminEmail = user && (user.email.toLowerCase() === ADMIN_EMAIL || user.email.toLowerCase() === 'info@evavidalnutricion.com')
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
  return user
}

export async function requirePatient() {
  const user = await requireUser()
  const isAdminUser = user.role === 'ADMIN' && (user.email.toLowerCase() === ADMIN_EMAIL || user.email.toLowerCase() === 'info@evavidalnutricion.com')
  if (isAdminUser) {
    // Vista previa de solo lectura generada por el servidor para Eva Vidal (3.5)
    const cookieStore = await cookies()
    const previewPatientId = cookieStore.get('evsoftware_preview_patient_id')?.value
    return {
      user,
      patientId: previewPatientId || user.patientId || null,
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

  if (user.patientAccount?.portalAccessEnabled === false || user.patientAccount?.isHardDeleted) {
    redirect('/login')
  }

  return { user, patientId: user.patientId, isAdminPreview: false }
}

export async function requireUserId() {
  return (await requireAdmin()).id
}


