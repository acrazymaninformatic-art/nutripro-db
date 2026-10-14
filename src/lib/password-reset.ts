import 'server-only'

import { prisma } from '@/lib/prisma'
import { createPasswordResetToken, getPublicAppUrl } from '@/lib/password-reset-token'
import { sendPasswordResetEmail } from '@/lib/email/password-reset-email'

const REQUEST_COOLDOWN_MS = 60 * 1000

export async function requestPasswordResetForEmail(emailInput: string) {
  const email = emailInput.trim().toLowerCase()
  if (!email || email.length > 254) return

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordResetRequestedAt: true },
  })
  if (!user || (user.passwordResetRequestedAt && Date.now() - user.passwordResetRequestedAt.getTime() < REQUEST_COOLDOWN_MS)) return

  const reset = createPasswordResetToken()
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: reset.hash,
      passwordResetExpiresAt: reset.expiresAt,
      passwordResetRequestedAt: new Date(),
    },
  })
  await prisma.auditLog.create({
    data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED', entityType: 'User', entityId: user.id },
  })

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl: `${getPublicAppUrl()}/reset-password?token=${encodeURIComponent(reset.token)}`,
    })
  } catch (error) {
    console.error('No se pudo enviar el correo de restablecimiento:', error)
  }
}
