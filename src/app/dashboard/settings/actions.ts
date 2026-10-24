'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { ADMIN_EMAIL, createSession, requireAdmin } from '@/lib/auth'
import { getForwardedClientAddress } from '@/lib/legal'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'
import { consumeRecoveryCode, decryptMfaSecret, verifyTotp } from '@/lib/mfa'

export interface ChangeAdminPasswordState {
  error?: string
  success?: string
}

function isValidAdminPassword(password: string) {
  return password.length >= 14 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
}

export async function changeAdminPasswordAction(
  _previousState: ChangeAdminPasswordState | undefined,
  formData: FormData
): Promise<ChangeAdminPasswordState> {
  const user = await requireAdmin({ allowPendingSetup: true })
  const currentPassword = String(formData.get('currentPassword') || '')
  const newPassword = String(formData.get('newPassword') || '')
  const confirmation = String(formData.get('newPasswordConfirmation') || '')
  const mfaCode = String(formData.get('mfaCode') || '').trim()

  if (!currentPassword || !newPassword || !confirmation) {
    return { error: 'Completa todos los campos de contraseña.' }
  }
  if (!isValidAdminPassword(newPassword)) {
    return { error: 'La nueva contraseña debe tener al menos 14 caracteres, mayúscula, minúscula y número.' }
  }
  if (newPassword !== confirmation) {
    return { error: 'La nueva contraseña y su confirmación no coinciden.' }
  }
  if (newPassword === currentPassword) {
    return { error: 'La nueva contraseña debe ser distinta de la actual.' }
  }

  const headerList = await headers()
  const ip = getForwardedClientAddress(
    headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')
  )
  const limit = await consumeRateLimit({
    key: rateLimitKey('change-admin-password', user.id),
    limit: 5,
    windowMs: 15 * 60 * 1000,
    failClosed: true,
  })
  if (!limit.allowed) {
    return { error: `Demasiados intentos. Espera ${limit.retryAfterSeconds} segundos antes de volver a intentarlo.` }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      patientId: true,
      passwordHash: true,
      mfaEnabled: true,
      mfaSecret: true,
      mfaRecoveryCodesHash: true,
    },
  })
  if (!dbUser || !(await bcrypt.compare(currentPassword, dbUser.passwordHash))) {
    return { error: 'La contraseña actual no es correcta.' }
  }

  let remainingRecoveryCodes: string | undefined
  if (dbUser.mfaEnabled) {
    const mfaSecret = decryptMfaSecret(dbUser.mfaSecret)
    if (!mfaSecret) {
      return { error: 'El segundo factor está mal configurado. Restablece el alta de MFA antes de cambiar la contraseña.' }
    }
    const normalizedCode = mfaCode.replace(/\s+/g, '')
    const validTotp = /^\d{6}$/.test(normalizedCode) && verifyTotp(mfaSecret, normalizedCode)
    if (!validTotp) {
      const remaining = consumeRecoveryCode(normalizedCode, dbUser.mfaRecoveryCodesHash)
      if (!remaining) return { error: 'Introduce un código TOTP válido o un código de recuperación.' }
      remainingRecoveryCodes = remaining
    }
  }

  const newHash = await bcrypt.hash(newPassword, 12)

  // La versión de sesión se lee del UPDATE, no del valor previo: si otra
  // petición la incrementó entre la lectura y la escritura, la sesión reemitida
  // debe usar la versión real para no quedar invalidada.
  let recoveryCodeRejected = false
  const newSessionVersion = await prisma.$transaction(async (tx) => {
    if (remainingRecoveryCodes !== undefined) {
      // El código de recuperación se consume de forma atómica: dos peticiones
      // concurrentes no pueden usar el mismo código.
      const consumed = await tx.user.updateMany({
        where: {
          id: dbUser.id,
          mfaRecoveryCodesHash: dbUser.mfaRecoveryCodesHash,
        },
        data: { mfaRecoveryCodesHash: remainingRecoveryCodes },
      })
      if (consumed.count !== 1) {
        recoveryCodeRejected = true
        throw new Error('El código de recuperación ya no es válido.')
      }
    }

    const updated = await tx.user.update({
      where: { id: dbUser.id },
      data: {
        passwordHash: newHash,
        passwordChangeRequired: false,
        // Un cambio de contraseña invalida los enlaces de reseteo pendientes.
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
        sessionVersion: { increment: 1 },
        // Un alta de MFA pendiente deja de ser válida al cambiar la contraseña.
        mfaEnrollmentSecret: null,
        mfaEnrollmentExpiresAt: null,
      },
      select: { sessionVersion: true },
    })
    await tx.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'ADMIN_PASSWORD_CHANGE',
        entityType: 'USER',
        entityId: dbUser.id,
        details: `Contraseña de administración cambiada desde Configuración. Sesiones anteriores invalidadas. IP: ${ip}.`,
      },
    })
    return updated.sessionVersion
  }).catch((error) => {
    if (recoveryCodeRejected) return null
    throw error
  })

  if (newSessionVersion === null) {
    return { error: 'El código de recuperación ya no es válido.' }
  }

  await createSession({
    id: dbUser.id,
    role: dbUser.role,
    email: dbUser.email,
    patientId: dbUser.patientId,
    sessionVersion: newSessionVersion,
  })

  return { success: 'Contraseña actualizada. Las demás sesiones han sido cerradas.' }
}

export async function updateProfessionalProfile(formData: FormData) {
  const user = await requireAdmin()

  const name = String(formData.get('name') || user.name).trim().slice(0, 120)
  if (!name) throw new Error('El nombre profesional es obligatorio.')
  const email = String(formData.get('email') || user.email).trim()
  const normalizedEmail = email.toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || normalizedEmail !== ADMIN_EMAIL) {
    throw new Error(
      'El correo de la cuenta administradora debe coincidir con el correo autorizado en el entorno (ADMIN_EMAIL).'
    )
  }
  const licenseNumber = String(formData.get('licenseNumber') || '').trim().slice(0, 120) || null
  const clinicName = String(formData.get('clinicName') || '').trim().slice(0, 160) || null
  const phone = String(formData.get('phone') || '').trim().slice(0, 50) || null
  const address = String(formData.get('address') || '').trim().slice(0, 500) || null
  const emailChanged = normalizedEmail !== user.email.toLowerCase()

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email: normalizedEmail,
      licenseNumber,
      clinicName,
      phone,
      address,
      // Un enlace de reseteo emitido antes de cambiar el correo no debe seguir
      // siendo válido para la cuenta actual.
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordResetRequestedAt: null,
    },
    select: {
      role: true,
      email: true,
      patientId: true,
      sessionVersion: true,
    },
  })

  // El token de sesión incluye el email y la versión. Si el correo cambia,
  // reemitimos la sesión actual para no expulsar a la administradora.
  if (emailChanged) {
    await createSession({
      id: user.id,
      role: updated.role,
      email: updated.email,
      patientId: updated.patientId,
      sessionVersion: updated.sessionVersion,
    })
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'ADMIN_PROFILE_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      details: emailChanged
        ? `Perfil profesional actualizado. Correo cambiado de ${user.email} a ${updated.email}.`
        : 'Perfil profesional actualizado.',
    },
  })

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard/plans')
  return { success: true, message: 'Perfil profesional guardado correctamente en la base de datos.' }
}

export async function toggleEmergencyLockdown(
  active: boolean,
  reason?: string,
  durationHours: number | null = 72
) {
  const user = await requireAdmin()

  if (active) {
    const expiresAt = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null
    await prisma.emergencyLockdown.create({
      data: {
        isActive: true,
        activatedAt: new Date(),
        expiresAt,
        reason: reason || 'Aislamiento preventivo de seguridad activado por la administradora.',
        activatedByEmail: user.email,
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMERGENCY_LOCKDOWN_ACTIVATED',
        entityType: 'SYSTEM',
        details: `Aislamiento activado (${durationHours ? `${durationHours}h` : 'indefinido'}). Motivo: ${reason || 'Preventivo'}`,
      },
    })
  } else {
    await prisma.emergencyLockdown.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMERGENCY_LOCKDOWN_DEACTIVATED',
        entityType: 'SYSTEM',
        details: 'Aislamiento de emergencia desactivado manualmente por la administradora.',
      },
    })
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

