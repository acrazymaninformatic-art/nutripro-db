'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function startPatientPreview(patientId: string) {
  const admin = await requireAdmin()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: admin.id },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado.')
  }

  const cookieStore = await cookies()
  cookieStore.set('evsoftware_preview_patient_id', patient.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hora
  })

  // Auditoría obligatoria de vista previa de paciente (3.5)
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      patientId: patient.id,
      action: 'ADMIN_PREVIEW_PATIENT_PORTAL',
      entityType: 'PATIENT',
      entityId: patient.id,
      details: `Eva Vidal accedió a la vista previa de solo lectura del portal del paciente ${patient.firstName} ${patient.lastName}`,
    },
  })

  redirect('/paciente')
}

export async function exitPatientPreview() {
  const cookieStore = await cookies()
  const patientId = cookieStore.get('evsoftware_preview_patient_id')?.value
  cookieStore.delete('evsoftware_preview_patient_id')

  if (patientId) {
    redirect(`/dashboard/patients/${patientId}`)
  }
  redirect('/dashboard/patients')
}
