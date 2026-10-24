'use server'

import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession } from '@/lib/auth'
import { getForwardedClientAddress } from '@/lib/legal'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { consumeRecoveryCode, decryptMfaSecret, verifyTotp } from '@/lib/mfa'

export interface LoginState {
  error?: string
  needsMfa?: boolean
}

// Hash de prueba constante para mitigar ataques de temporización (timing attack) y enumeración de usuarios
const DUMMY_HASH = '$2a$12$e80z94yq5eT83/g5xL2yeeuQG83v7e9K3i0y62y.47K6x/2mO.6Qy'
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_LIMIT_PER_IP = 20
const LOGIN_LIMIT_PER_ACCOUNT = 8

async function clientIp(): Promise<string> {
  const headerList = await headers()
  return getForwardedClientAddress(
    headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')
  )
}

function genericError(needsMfa = false): LoginState {
  return { error: 'Correo, contraseña o código de verificación incorrectos.', needsMfa }
}

export async function login(_previousState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const mfaCode = String(formData.get('totp') || '').trim()
  if (!email || !password) return { error: 'Correo o contraseña incorrectos.' }

  const ip = await clientIp()
  const [ipLimit, accountLimit] = await Promise.all([
    consumeRateLimit({
      key: rateLimitKey('login-ip', ip),
      limit: LOGIN_LIMIT_PER_IP,
      windowMs: LOGIN_WINDOW_MS,
      failClosed: true,
    }),
    consumeRateLimit({
      key: rateLimitKey('login-account', email),
      limit: LOGIN_LIMIT_PER_ACCOUNT,
      windowMs: LOGIN_WINDOW_MS,
      failClosed: true,
    }),
  ])
  if (!ipLimit.allowed || !accountLimit.allowed) {
    return {
      error: `Demasiados intentos. Espera ${Math.max(ipLimit.retryAfterSeconds, accountLimit.retryAfterSeconds)} segundos antes de volver a intentarlo.`,
    }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      passwordChangeRequired: true,
      role: true,
      patientId: true,
      sessionVersion: true,
      mfaEnabled: true,
      mfaSecret: true,
      mfaRecoveryCodesHash: true,
      patientAccount: {
        select: {
          id: true,
          portalAccessEnabled: true,
          isHardDeleted: true,
          isActive: true,
        },
      },
    },
  })

  // Ejecución en tiempo constante: si el usuario no existe, se ejecuta bcrypt contra DUMMY_HASH
  const hashToCompare = user?.passwordHash || DUMMY_HASH
  const passwordMatches = await bcrypt.compare(password, hashToCompare)

  if (!user || !passwordMatches) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: 'LOGIN_FAILED',
          entityType: 'SECURITY',
          details: `Intento de acceso fallido para ${email} desde ${ip}.`,
        },
      })
    } catch {
      // La auditoría nunca debe revelar si la cuenta existe.
    }
    // No se revela si la cuenta existe ni si tiene MFA: el formulario solo
    // muestra el segundo factor después de validar la contraseña.
    return genericError(false)
  }

  // La allowlist de administración se configura en ADMIN_EMAIL. No hay un
  // correo alternativo codificado que pueda sobrevivir a un cambio de entorno.
  const { ADMIN_EMAIL } = await import('@/lib/auth')
  if (user.role !== 'ADMIN' && user.role !== 'PATIENT') {
    return genericError(false)
  }

  if (user.role === 'ADMIN' && user.email.toLowerCase() !== ADMIN_EMAIL) {
    return genericError(false)
  }

  // Si cualquier cuenta tiene MFA activo, el segundo factor es obligatorio.
  // No se limita a ADMIN para que un cambio de rol o un dato heredado no
  // convierta el MFA en una protección meramente decorativa.
  if (user.mfaEnabled) {
    const mfaSecret = decryptMfaSecret(user.mfaSecret)
    if (!mfaSecret) {
      return { error: 'La verificación en dos pasos está mal configurada. Contacta con soporte.', needsMfa: true }
    }
    const normalizedCode = mfaCode.replace(/\s+/g, '')
    const isTotp = /^\d{6}$/.test(normalizedCode)
    const validTotp = isTotp && verifyTotp(mfaSecret, normalizedCode)
    if (!validTotp) {
      const remaining = consumeRecoveryCode(normalizedCode, user.mfaRecoveryCodesHash)
      if (!remaining) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'MFA_FAILED',
            entityType: 'SECURITY',
            details: `Código MFA incorrecto para ${email} desde ${ip}.`,
          },
        })
        return genericError(true)
      }
      // Un código de recuperación es de un solo uso también frente a dos
      // peticiones concurrentes: el UPDATE condicional solo puede ganar una.
      const consumed = await prisma.user.updateMany({
        where: {
          id: user.id,
          mfaRecoveryCodesHash: user.mfaRecoveryCodesHash,
        },
        data: { mfaRecoveryCodesHash: remaining },
      })
      if (consumed.count !== 1) {
        return genericError(true)
      }
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'MFA_RECOVERY_CODE_USED',
          entityType: 'SECURITY',
          details: `Código de recuperación de MFA consumido para ${email} desde ${ip}.`,
        },
      })
    }
  }

  if (user.role === 'PATIENT') {
    if (
      user.patientAccount?.isHardDeleted ||
      user.patientAccount?.portalAccessEnabled === false ||
      user.patientAccount?.isActive === false
    ) {
      return { error: 'El acceso a este portal ha sido desactivado.' }
    }

    const { isEmergencyLockdownActive } = await import('@/lib/auth')
    if (await isEmergencyLockdownActive()) {
      return { error: 'El portal está temporalmente en aislamiento preventivo por seguridad técnica. Por favor, inténtalo más tarde.' }
    }

    if (user.patientId) {
      await prisma.patient.update({
        where: { id: user.patientId },
        data: { portalLastLoginAt: new Date() },
      })
    }
  }

  if (user.role === 'ADMIN') {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(user.mfaEnabled ? { mfaLastVerifiedAt: new Date() } : {}),
      },
    })
    if (!user.mfaEnabled) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ADMIN_MFA_NOT_ENROLLED',
          entityType: 'SECURITY',
          details: 'Acceso de administración sin MFA. Hasta activar TOTP solo se permite acceder a Configuración.',
        },
      })
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      patientId: user.patientId,
      action: 'LOGIN_SUCCESS',
      entityType: 'SECURITY',
      details: `Acceso correcto desde ${ip}${
        user.role === 'ADMIN'
          ? user.mfaEnabled
            ? ' con MFA'
            : ' sin MFA (alta pendiente)'
          : ''
      }.`,
    },
  })

  await createSession({
    id: user.id,
    role: user.role,
    email: user.email,
    patientId: user.patientId,
    sessionVersion: user.sessionVersion,
  })

  const destination = user.passwordChangeRequired
    ? user.role === 'PATIENT'
      ? '/paciente/configuracion?passwordChangeRequired=1'
      : '/dashboard/settings?passwordChangeRequired=1'
    : user.role === 'PATIENT'
      ? '/paciente'
      : '/dashboard'

  redirect(destination)
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
