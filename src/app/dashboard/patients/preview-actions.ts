'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requireUserId } from '@/lib/auth'

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

export interface PatientPreviewSummary {
  nombre: string
  email: string | null
  phone: string | null
  objetivo: string | null
  pesoActual: number | null
  imc: number | null
  ultimaVisita: string | null
  proximaCita: string | null
  planActivo: string | null
  kcalPlan: number | null
  camposPendientes: number
  consentimientos: { total: number; completados: number }
  alertas: string[]
  ultimoSeguimiento: string | null
}

/**
 * Resumen de la ficha para la vista previa (drawer): lo mínimo para decidir
 * sin abrir el expediente completo.
 */
export async function getPatientPreviewSummary(patientId: string): Promise<PatientPreviewSummary> {
  const userId = await requireUserId()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      objective: true,
      heightCm: true,
      declaredWeightKg: true,
      pendingReviewFieldsCount: true,
      questionnaireDeliveryStatus: true,
      anthropometries: { orderBy: { date: 'desc' }, take: 1 },
      appointments: { orderBy: { date: 'desc' }, take: 5 },
      mealPlans: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      consents: { select: { accepted: true, status: true } },
      clinicalCheckIns: { orderBy: { date: 'desc' }, take: 1 },
    },
  })

  if (!patient) throw new Error('Paciente no encontrado.')

  const lastAnthropometry = patient.anthropometries[0]
  const weight = lastAnthropometry?.weightKg ?? patient.declaredWeightKg ?? null
  const height = patient.heightCm || null
  const imc = weight && height ? Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10 : null

  const now = Date.now()
  const upcoming = patient.appointments.find(
    (appointment) => new Date(appointment.date).getTime() >= now
  )
  const past = patient.appointments
    .filter((appointment) => new Date(appointment.date).getTime() < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  const alertas: string[] = []
  if ((patient.pendingReviewFieldsCount || 0) > 0) {
    alertas.push(`${patient.pendingReviewFieldsCount} campos del cuestionario por revisar`)
  }
  if (patient.questionnaireDeliveryStatus === 'NOT_SENT') {
    alertas.push('Cuestionario de alta sin enviar')
  }
  if (!upcoming) alertas.push('Sin cita programada')
  if (patient.mealPlans.length === 0) alertas.push('Sin plan nutricional activo')

  return {
    nombre: `${patient.firstName} ${patient.lastName}`,
    email: patient.email,
    phone: patient.phone,
    objetivo: patient.objective,
    pesoActual: weight,
    imc,
    ultimaVisita: past ? new Date(past.date).toLocaleDateString('es-ES') : null,
    proximaCita: upcoming ? new Date(upcoming.date).toLocaleString('es-ES') : null,
    planActivo: patient.mealPlans[0]?.name ?? null,
    kcalPlan: patient.mealPlans[0]?.targetKcal ?? null,
    camposPendientes: patient.pendingReviewFieldsCount || 0,
    consentimientos: {
      total: patient.consents.length,
      completados: patient.consents.filter((consent) => consent.accepted).length,
    },
    alertas,
    ultimoSeguimiento: patient.clinicalCheckIns[0]
      ? new Date(patient.clinicalCheckIns[0].date).toLocaleDateString('es-ES')
      : null,
  }
}

/**
 * Duplica la ficha clínica de un paciente (datos, objetivo, antecedentes y
 * alérgenos) sin copiar la cuenta del portal ni los consentimientos firmados.
 */
export async function duplicatePatient(patientId: string) {
  const userId = await requireUserId()

  const source = await prisma.patient.findFirst({
    where: { id: patientId, userId },
  })

  if (!source) throw new Error('Paciente no encontrado.')

  const copy = await prisma.patient.create({
    data: {
      userId,
      firstName: `${source.firstName} (copia)`,
      lastName: source.lastName,
      email: source.email,
      phone: source.phone,
      birthDate: source.birthDate,
      sex: source.sex,
      heightCm: source.heightCm,
      objective: source.objective,
      activityLevel: source.activityLevel,
      notes: source.notes,
      allergies: source.allergies,
      intolerances: source.intolerances,
      dietaryPreferences: source.dietaryPreferences,
      medicalHistory: source.medicalHistory,
      currentMedications: source.currentMedications,
      isGLP1Treatment: source.isGLP1Treatment,
      isTCAProtocol: source.isTCAProtocol,
      tags: source.tags,
      declaredWeightKg: source.declaredWeightKg,
      declaredHeightCm: source.declaredHeightCm,
      portalAccessEnabled: false,
      isActive: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      patientId: copy.id,
      action: 'PATIENT_DUPLICATED',
      entityType: 'Patient',
      entityId: copy.id,
      details: `Ficha duplicada de ${source.firstName} ${source.lastName}.`,
    },
  })

  revalidatePath('/dashboard/patients')

  return { id: copy.id }
}
