'use server'

import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createPortalInviteToken, getPublicAppUrl } from '@/lib/password-reset-token'
import { sendPatientPortalWelcomeEmail } from '@/lib/email/password-reset-email'
import { logEmailSent } from '@/lib/email/log-email'

export async function createPortalAccount(patientId: string) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id },
    include: { portalUser: true },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado.')
  }

  if (!patient.email || !patient.email.includes('@')) {
    throw new Error('El paciente debe tener un correo electrónico válido registrado para crear acceso al portal.')
  }

  const patientEmail = patient.email.trim().toLowerCase()

  // Comprobar si ya existe una cuenta con ese correo
  let portalUser = await prisma.user.findUnique({
    where: { email: patientEmail },
  })

  const { token, hash, expiresAt } = createPortalInviteToken(24)

  if (portalUser) {
    if (portalUser.patientId && portalUser.patientId !== patient.id) {
      throw new Error('Este correo ya está asociado a otro expediente de paciente.')
    }
    // Si la cuenta existe, vincular y generar nuevo token de 24h
    portalUser = await prisma.user.update({
      where: { id: portalUser.id },
      data: {
        role: 'PATIENT',
        patientId: patient.id,
        passwordChangeRequired: true,
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: expiresAt,
        passwordResetRequestedAt: new Date(),
      },
    })
  } else {
    // Crear la cuenta con contraseña temporal aleatoria
    const tempRandomPass = randomBytes(16).toString('hex')
    const passwordHash = await bcrypt.hash(tempRandomPass, 12)

    portalUser = await prisma.user.create({
      data: {
        email: patientEmail,
        name: `${patient.firstName} ${patient.lastName}`.trim(),
        passwordHash,
        passwordChangeRequired: true,
        role: 'PATIENT',
        patientId: patient.id,
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: expiresAt,
        passwordResetRequestedAt: new Date(),
      },
    })
  }

  // Activar acceso en la ficha
  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      portalAccessEnabled: true,
    },
  })

  // Registro de auditoría
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId: patient.id,
      action: 'CREATE_PORTAL_ACCOUNT',
      entityType: 'PATIENT',
      entityId: patient.id,
      details: `Acceso al portal EVSoftware creado para ${patientEmail} con enlace de 24 horas`,
    },
  })

  const inviteUrl = `${getPublicAppUrl()}/reset-password?token=${token}`

  // Envío automático de correo con enlace de 24h para definir contraseña
  let emailSent = false
  let emailError: string | null = null
  try {
    await sendPatientPortalWelcomeEmail({
      email: patientEmail,
      name: `${patient.firstName} ${patient.lastName}`.trim(),
      inviteUrl,
    })
    emailSent = true
    await logEmailSent({
      recipientEmail: patientEmail,
      recipientName: `${patient.firstName} ${patient.lastName}`.trim(),
      patientId: patient.id,
      subject: 'Activa tu acceso al Portal del Paciente · Eva Vidal Nutrición',
      type: 'PORTAL_INVITE',
      status: 'SENT',
    })
  } catch (err: any) {
    console.error('Error enviando correo de bienvenida al portal:', err)
    emailError = err?.message || 'Error al conectar con servidor SMTP'
    await logEmailSent({
      recipientEmail: patientEmail,
      recipientName: `${patient.firstName} ${patient.lastName}`.trim(),
      patientId: patient.id,
      subject: 'Activa tu acceso al Portal del Paciente · Eva Vidal Nutrición',
      type: 'PORTAL_INVITE',
      status: 'FAILED',
      errorDetails: emailError,
    })
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return {
    success: true,
    inviteUrl,
    expiresAt: expiresAt.toISOString(),
    emailSent,
    message: emailSent
      ? `Acceso al portal creado y correo electrónico enviado automáticamente a ${patientEmail}. El paciente podrá definir su contraseña con el enlace recibido (válido por 24 horas).`
      : `Acceso al portal creado. No se pudo enviar el correo automático (${emailError}), pero puedes copiar el enlace directo generado.`,
  }
}

export async function togglePortalAccess(patientId: string, enabled: boolean) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado.')
  }

  await prisma.patient.update({
    where: { id: patient.id },
    data: { portalAccessEnabled: enabled },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId: patient.id,
      action: enabled ? 'REACTIVATE_PORTAL_ACCESS' : 'SUSPEND_PORTAL_ACCESS',
      entityType: 'PATIENT',
      entityId: patient.id,
      details: `Acceso al portal ${enabled ? 'reactivado' : 'suspendido al instante (cierre de sesiones)'} por Eva`,
    },
  })

  revalidatePath(`/dashboard/patients/${patientId}`)
  return {
    success: true,
    portalAccessEnabled: enabled,
    message: enabled
      ? 'Acceso al portal reactivado correctamente.'
      : 'Acceso al portal bloqueado al instante. Las sesiones del paciente han quedado cerradas.',
  }
}

export async function generateNewPortalInviteLink(patientId: string) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id },
    include: { portalUser: true },
  })

  if (!patient) throw new Error('Paciente no encontrado.')
  if (!patient.portalUser) throw new Error('El paciente aún no tiene cuenta de portal creada.')

  const { token, hash, expiresAt } = createPortalInviteToken(24)

  await prisma.user.update({
    where: { id: patient.portalUser.id },
    data: {
      passwordChangeRequired: true,
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: expiresAt,
      passwordResetRequestedAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId: patient.id,
      action: 'REFRESH_PORTAL_INVITE',
      entityType: 'PATIENT',
      entityId: patient.id,
      details: `Nuevo enlace de activación de portal de 24h generado para ${patient.portalUser.email}`,
    },
  })

  const inviteUrl = `${getPublicAppUrl()}/reset-password?token=${token}`

  // Envío automático de correo con el nuevo enlace de 24h
  let emailSent = false
  let emailError: string | null = null
  try {
    await sendPatientPortalWelcomeEmail({
      email: patient.portalUser.email,
      name: `${patient.firstName} ${patient.lastName}`.trim(),
      inviteUrl,
    })
    emailSent = true
    await logEmailSent({
      recipientEmail: patient.portalUser.email,
      recipientName: `${patient.firstName} ${patient.lastName}`.trim(),
      patientId: patient.id,
      subject: 'Activa tu acceso al Portal del Paciente · Eva Vidal Nutrición',
      type: 'PORTAL_INVITE',
      status: 'SENT',
    })
  } catch (err: any) {
    console.error('Error enviando enlace de invitación al portal:', err)
    emailError = err?.message || 'Error al conectar con servidor SMTP'
    await logEmailSent({
      recipientEmail: patient.portalUser.email,
      recipientName: `${patient.firstName} ${patient.lastName}`.trim(),
      patientId: patient.id,
      subject: 'Activa tu acceso al Portal del Paciente · Eva Vidal Nutrición',
      type: 'PORTAL_INVITE',
      status: 'FAILED',
      errorDetails: emailError,
    })
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return {
    success: true,
    inviteUrl,
    expiresAt: expiresAt.toISOString(),
    emailSent,
    message: emailSent
      ? `Nuevo enlace generado y enviado por correo a ${patient.portalUser.email} (válido por 24 horas).`
      : `Nuevo enlace de 24 horas generado con éxito. Copia el enlace a continuación para facilitárselo al paciente.`,
  }
}
