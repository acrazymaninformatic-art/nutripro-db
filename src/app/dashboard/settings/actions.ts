'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateProfessionalProfile(formData: FormData) {
  const user = await prisma.user.findFirst()
  if (!user) throw new Error('Usuario profesional no encontrado en la base de datos.')

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
