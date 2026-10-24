'use server'

import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createSession, requireAdmin } from '@/lib/auth'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'
import {
  buildOtpAuthUri,
  consumeRecoveryCode,
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotp,
} from '@/lib/mfa'

const MFA_ENROLLMENT_TTL_MS = 10 * 60 * 1000

export interface MfaEnrollmentStartResult {
  error?: string
  secret?: string
  otpauthUri?: string
  qrDataUrl?: string
}

export interface MfaEnrollmentConfirmResult {
  error?: string
  success?: string
  recoveryCodes?: string[]
}

/**
 * Inicia el alta o la reconfiguración de TOTP. La contraseña actual es
 * obligatoria y, si ya hay MFA activo, también un código del autenticador
 * actual o un código de recuperación.
 */
export async function startMfaEnrollmentAction(
  currentPassword: string,
  currentCode = ''
): Promise<MfaEnrollmentStartResult> {
  const password = typeof currentPassword === 'string' ? currentPassword : ''
  const code = typeof currentCode === 'string' ? currentCode : ''
  const user = await requireAdmin({ allowPendingSetup: true })
  const limit = await consumeRateLimit({
    key: rateLimitKey('mfa-enrollment-start', user.id),
    limit: 5,
    windowMs: 15 * 60 * 1000,
    failClosed: true,
  })
  if (!limit.allowed) {
    return { error: `Demasiados intentos. Espera ${limit.retryAfterSeconds} segundos.` }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      mfaEnabled: true,
      mfaSecret: true,
      mfaRecoveryCodesHash: true,
      sessionVersion: true,
    },
  })
  if (!dbUser || !password || !(await bcrypt.compare(password, dbUser.passwordHash))) {
    return { error: 'La contraseña actual no es correcta.' }
  }

  const normalizedCode = code.replace(/\s+/g, '')
  let remainingRecoveryCodes: string | undefined
  if (dbUser.mfaEnabled) {
    const mfaSecret = decryptMfaSecret(dbUser.mfaSecret)
    if (!mfaSecret) {
      return { error: 'El segundo factor está mal configurado. Contacta con soporte técnico.' }
    }
    if (!verifyTotp(mfaSecret, normalizedCode)) {
      const remaining = consumeRecoveryCode(normalizedCode, dbUser.mfaRecoveryCodesHash)
      if (!remaining) {
        return { error: 'Introduce el código actual de tu aplicación autenticadora o un código de recuperación.' }
      }
      remainingRecoveryCodes = remaining
    }
  }

  const secret = generateTotpSecret()
  const otpauthUri = buildOtpAuthUri(secret, dbUser.email)
  const qrDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  // El secreto pendiente se guarda en servidor, cifrado y con caducidad. Así la
  // confirmación no confía en el secreto que envía el navegador y una sesión
  // robada no puede sustituir el segundo factor sin superar el alta completa.
  // La escritura es condicional a la versión de sesión y, si se usa un código
  // de recuperación, al hash leído: dos peticiones concurrentes no pueden
  // reutilizar el mismo código ni una sesión invalidada dejar un alta abierta.
  const enrolled = await prisma.user.updateMany({
    where: {
      id: dbUser.id,
      sessionVersion: dbUser.sessionVersion,
      ...(remainingRecoveryCodes !== undefined
        ? { mfaRecoveryCodesHash: dbUser.mfaRecoveryCodesHash }
        : {}),
    },
    data: {
      mfaEnrollmentSecret: encryptMfaSecret(secret),
      mfaEnrollmentExpiresAt: new Date(Date.now() + MFA_ENROLLMENT_TTL_MS),
      ...(remainingRecoveryCodes !== undefined
        ? { mfaRecoveryCodesHash: remainingRecoveryCodes }
        : {}),
    },
  })
  if (enrolled.count !== 1) {
    return { error: 'La sesión ha cambiado. Vuelve a iniciar sesión e inténtalo de nuevo.' }
  }

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      action: dbUser.mfaEnabled ? 'MFA_REENROLLMENT_STARTED' : 'MFA_ENROLLMENT_STARTED',
      entityType: 'SECURITY',
      details: 'Alta/reconfiguración de TOTP iniciada y pendiente de confirmación con código.',
    },
  })

  return { secret, otpauthUri, qrDataUrl }
}

/**
 * Confirma el alta. Los códigos de recuperación se devuelven en claro una única
 * vez; en base de datos solo se guardan sus hashes SHA-256.
 */
export async function confirmMfaEnrollmentAction(code: string): Promise<MfaEnrollmentConfirmResult> {
  const token = typeof code === 'string' ? code : ''
  const user = await requireAdmin({ allowPendingSetup: true })

  const limit = await consumeRateLimit({
    key: rateLimitKey('mfa-enrollment-confirm', user.id),
    limit: 8,
    windowMs: 15 * 60 * 1000,
    failClosed: true,
  })
  if (!limit.allowed) {
    return { error: `Demasiados intentos. Espera ${limit.retryAfterSeconds} segundos.` }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      patientId: true,
      sessionVersion: true,
      mfaEnrollmentSecret: true,
      mfaEnrollmentExpiresAt: true,
    },
  })
  if (!dbUser) return { error: 'Usuario no encontrado.' }
  if (
    !dbUser.mfaEnrollmentSecret ||
    !dbUser.mfaEnrollmentExpiresAt ||
    dbUser.mfaEnrollmentExpiresAt.getTime() <= Date.now()
  ) {
    return { error: 'El alta de MFA ha caducado o no se ha iniciado. Vuelve a empezar.' }
  }

  const pendingSecret = decryptMfaSecret(dbUser.mfaEnrollmentSecret)
  if (!pendingSecret) {
    return { error: 'El alta de MFA está mal configurada. Vuelve a empezar.' }
  }
  if (!verifyTotp(pendingSecret, token)) {
    return { error: 'El código de 6 dígitos no es válido o ha caducado. Comprueba la hora del dispositivo e inténtalo de nuevo.' }
  }

  const recoveryCodes = generateRecoveryCodes(10)
  let confirmationConflict = false

  const newSessionVersion = await prisma.$transaction(async (tx) => {
    // La confirmación solo puede consumir el alta que se leyó. Si otra
    // petición la confirmó, la contraseña cambió o la sesión fue invalidada,
    // el UPDATE condicional no afecta a ninguna fila y no se habilitan códigos
    // de recuperación nuevos.
    const updated = await tx.user.updateMany({
      where: {
        id: dbUser.id,
        sessionVersion: dbUser.sessionVersion,
        mfaEnrollmentSecret: dbUser.mfaEnrollmentSecret,
        mfaEnrollmentExpiresAt: { gt: new Date() },
      },
      data: {
        mfaEnabled: true,
        mfaSecret: encryptMfaSecret(pendingSecret),
        mfaEnrollmentSecret: null,
        mfaEnrollmentExpiresAt: null,
        mfaRecoveryCodesHash: JSON.stringify(recoveryCodes.map(hashRecoveryCode)),
        mfaEnrolledAt: new Date(),
        mfaLastVerifiedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
    })
    if (updated.count !== 1) {
      confirmationConflict = true
      throw new Error('El alta de MFA ya no está disponible. Vuelve a empezar.')
    }

    const current = await tx.user.findUniqueOrThrow({
      where: { id: dbUser.id },
      select: { sessionVersion: true },
    })
    await tx.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'MFA_ENABLED',
        entityType: 'SECURITY',
        details: 'TOTP activado correctamente. Se generaron 10 códigos de recuperación de un solo uso. Sesiones anteriores invalidadas.',
      },
    })
    return current.sessionVersion
  }).catch((error) => {
    if (confirmationConflict) return null
    throw error
  })

  if (newSessionVersion === null) {
    return { error: 'El alta de MFA ya no está disponible. Vuelve a empezar.' }
  }

  await createSession({
    id: dbUser.id,
    role: dbUser.role,
    email: dbUser.email,
    patientId: dbUser.patientId,
    sessionVersion: newSessionVersion,
  })

  revalidatePath('/dashboard/settings')
  return { success: 'Verificación en dos pasos activada correctamente.', recoveryCodes }
}
