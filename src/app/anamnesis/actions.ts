'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface AnamnesisPayload {
  patientId?: string
  name: string
  birthDate?: string
  gender?: string
  phone?: string
  email?: string
  medicalHistory?: string
  currentMedications?: string
  isGLP1Treatment?: boolean
  digestiveIssues?: string
  foodPreferences?: string
  foodAversions?: string
  waterIntakeLiters?: number
  mealsPerDay?: number
  mealScheduleNotes?: string
  recall24h?: string
  shortTermGoal?: string
}

export async function submitAnamnesis(data: AnamnesisPayload) {
  if (data.patientId) {
    const existing = await prisma.patient.findUnique({
      where: { id: data.patientId },
    })

    if (!existing) {
      throw new Error('Paciente no encontrado en el sistema.')
    }

    // 1. Guardar la respuesta completa en la entidad dedicada de Anamnesis (NO sobrescribe la ficha técnica)
    const submission = await prisma.anamnesisSubmission.create({
      data: {
        patientId: data.patientId,
        declaredName: data.name || `${existing.firstName} ${existing.lastName}`,
        declaredPhone: data.phone || existing.phone,
        declaredEmail: data.email || existing.email,
        declaredBirthDate: data.birthDate ? new Date(data.birthDate) : existing.birthDate,
        declaredGender: data.gender || existing.sex,
        foodPreferences: data.foodPreferences || null,
        foodAversions: data.foodAversions || null,
        mealsPerDay: data.mealsPerDay ? Number(data.mealsPerDay) : null,
        mealScheduleNotes: data.mealScheduleNotes || null,
        waterIntakeLiters: data.waterIntakeLiters ? Number(data.waterIntakeLiters) : null,
        recall24h: data.recall24h || null,
        digestiveIssues: data.digestiveIssues || null,
        medicalHistory: data.medicalHistory || null,
        currentMedications: data.currentMedications || null,
        isGLP1Treatment: Boolean(data.isGLP1Treatment),
        shortTermGoal: data.shortTermGoal || null,
      },
    })

    // 2. Marcar el estado en el paciente como COMPLETADO sin tocar las notas clínicas del nutricionista
    await prisma.patient.update({
      where: { id: data.patientId },
      data: {
        anamnesisStatus: 'COMPLETED',
        anamnesisCompletedAt: new Date(),
        // Solo actualizar teléfono o email si antes no estaban registrados
        phone: existing.phone || data.phone || undefined,
        email: existing.email || data.email || undefined,
      },
    })

    revalidatePath(`/dashboard/patients/${data.patientId}`)
    revalidatePath('/dashboard/patients')
    return { success: true, patientId: existing.id, submissionId: submission.id }
  }

  // Paciente nuevo que llega a través del formulario público
  const user = await prisma.user.findFirst()
  if (!user) throw new Error('No hay usuario profesional registrado')

  const parts = (data.name || '').trim().split(' ')
  const firstName = parts[0] || 'Paciente'
  const lastName = parts.slice(1).join(' ') || 'Nuevo'

  const created = await prisma.patient.create({
    data: {
      userId: user.id,
      firstName,
      lastName,
      birthDate: data.birthDate ? new Date(data.birthDate) : new Date('1990-01-01'),
      sex: (data.gender || 'FEMALE').toUpperCase(),
      heightCm: 168,
      objective: 'WEIGHT_LOSS',
      activityLevel: 'MODERATE',
      phone: data.phone || null,
      email: data.email || null,
      anamnesisStatus: 'COMPLETED',
      anamnesisCompletedAt: new Date(),
    },
  })

  // Crear la submission para el nuevo paciente
  await prisma.anamnesisSubmission.create({
    data: {
      patientId: created.id,
      declaredName: data.name,
      declaredPhone: data.phone || null,
      declaredEmail: data.email || null,
      declaredBirthDate: data.birthDate ? new Date(data.birthDate) : null,
      declaredGender: data.gender || null,
      foodPreferences: data.foodPreferences || null,
      foodAversions: data.foodAversions || null,
      mealsPerDay: data.mealsPerDay ? Number(data.mealsPerDay) : null,
      mealScheduleNotes: data.mealScheduleNotes || null,
      waterIntakeLiters: data.waterIntakeLiters ? Number(data.waterIntakeLiters) : null,
      recall24h: data.recall24h || null,
      digestiveIssues: data.digestiveIssues || null,
      medicalHistory: data.medicalHistory || null,
      currentMedications: data.currentMedications || null,
      isGLP1Treatment: Boolean(data.isGLP1Treatment),
      shortTermGoal: data.shortTermGoal || null,
    },
  })

  revalidatePath('/dashboard/patients')
  return { success: true, patientId: created.id }
}
