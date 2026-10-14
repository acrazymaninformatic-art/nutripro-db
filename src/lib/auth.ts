import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSessionPayload, verifySessionToken } from '@/lib/session-token'

export async function createSession(userId: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt }), 'utf8').toString('base64url')
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
  let session: { userId: string } | null
  try {
    session = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
  } catch {
    return null
  }
  if (!session) return null
  return prisma.user.findUnique({
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
    },
  })
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role === 'PATIENT') {
    redirect('/paciente')
  }
  return user
}

export async function requirePatient() {
  const user = await requireUser()
  if (user.role === 'ADMIN') {
    // Admin can preview or manage, or redirect to dashboard
    return { user, patientId: user.patientId || null, isAdminPreview: true }
  }

  // Check emergency lockdown
  const isLocked = await isEmergencyLockdownActive()
  if (isLocked) {
    redirect('/bloqueo-seguridad')
  }

  if (!user.patientId) {
    redirect('/login')
  }

  return { user, patientId: user.patientId, isAdminPreview: false }
}

export async function requireUserId() {
  return (await requireAdmin()).id
}

