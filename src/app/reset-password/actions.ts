'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { hashPasswordResetToken } from '@/lib/password-reset-token'

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

  const changed = await prisma.user.updateMany({
    where: { passwordResetTokenHash: hashPasswordResetToken(token), passwordResetExpiresAt: { gt: new Date() } },
    data: { passwordHash: await bcrypt.hash(password, 12), passwordChangeRequired: false, passwordResetTokenHash: null, passwordResetExpiresAt: null, passwordResetRequestedAt: null },
  })
  if (changed.count !== 1) return { error: 'El enlace no es válido o ya ha caducado. Solicita uno nuevo.' }
  return { success: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
}
