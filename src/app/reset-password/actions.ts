'use server'

import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { hashPasswordResetToken } from '@/lib/password-reset-token'
import { getForwardedClientAddress } from '@/lib/legal'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'

export interface ResetPasswordState { error?: string; success?: string }

function validPassword(password: string) {
  return password.length >= 14 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
}

export async function resetPassword(_previousState: ResetPasswordState | undefined, formData: FormData): Promise<ResetPasswordState> {
  const token = String(formData.get('token') || '')
  const password = String(formData.get('password') || '')
  const confirmation = String(formData.get('confirmation') || '')
  if (!token) return { error: 'El enlace no es válido o ya ha caducado.' }
  if (!validPassword(password)) return { error: 'Usa al menos 14 caracteres, con mayúscula, minúscula y número.' }
  if (password !== confirmation) return { error: 'Las contraseñas no coinciden.' }

  const tokenHash = hashPasswordResetToken(token)
  const headerList = await headers()
  const ip = getForwardedClientAddress(
    headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')
  )
  const [ipLimit, tokenLimit] = await Promise.all([
    consumeRateLimit({
      key: rateLimitKey('reset-password-ip', ip),
      limit: 10,
      windowMs: 60 * 60 * 1000,
      failClosed: true,
    }),
    consumeRateLimit({
      key: rateLimitKey('reset-password-token', tokenHash),
      limit: 5,
      windowMs: 60 * 60 * 1000,
      failClosed: true,
    }),
  ])
  if (!ipLimit.allowed || !tokenLimit.allowed) {
    return { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' }
  }

  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
    select: { id: true, patientId: true },
  })
  if (!user) return { error: 'El enlace no es válido o ya ha caducado. Solicita uno nuevo.' }

  const newHash = await bcrypt.hash(password, 12)
  const completed = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: user.id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
      data: {
        passwordHash: newHash,
        passwordChangeRequired: false,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
        // Un alta de MFA pendiente deja de ser válida al restablecer la contraseña.
        mfaEnrollmentSecret: null,
        mfaEnrollmentExpiresAt: null,
        // Invalida todas las sesiones firmadas antes del restablecimiento.
        sessionVersion: { increment: 1 },
      },
    })
    if (updated.count !== 1) return false

    await tx.auditLog.create({
      data: {
        userId: user.id,
        patientId: user.patientId,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'USER',
        entityId: user.id,
        details: 'Contraseña restablecida mediante enlace de un solo uso. Todas las sesiones anteriores han sido invalidadas.',
      },
    })
    return true
  })

  if (!completed) {
    return { error: 'Este enlace ya se ha utilizado o ha caducado. Solicita uno nuevo.' }
  }
  return { success: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
}
