'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'

export async function updateProfessionalProfile(formData: FormData) {
  const user = await requireUser()

  const name = (formData.get('name') as string)?.trim() || user.name
  const email = (formData.get('email') as string)?.trim() || user.email
  const licenseNumber = (formData.get('licenseNumber') as string)?.trim() || null
  const clinicName = (formData.get('clinicName') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const address = (formData.get('address') as string)?.trim() || null

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      licenseNumber,
      clinicName,
      phone,
      address,
    },
  })

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard/plans')
  return { success: true, message: 'Perfil profesional guardado correctamente en la base de datos.' }
}

export async function toggleEmergencyLockdown(active: boolean, reason?: string) {
  const user = await requireUser()
  if (user.role !== 'ADMIN') {
    throw new Error('Solo la administradora puede modificar el aislamiento de emergencia.')
  }

  if (active) {
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 horas por defecto
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
        details: `Aislamiento activado por 72h. Motivo: ${reason || 'Preventivo'}`,
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

