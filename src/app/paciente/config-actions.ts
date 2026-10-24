'use server'

import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { createSession, requirePatient } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getForwardedClientAddress } from '@/lib/legal'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'

export interface ChangePasswordState {
  error?: string
  success?: string
}

function isValidPassword(p: string): boolean {
  return p.length >= 14 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p)
}

export async function changePasswordAction(
  _prevState: ChangePasswordState | undefined,
  formData: FormData
): Promise<ChangePasswordState> {
  const { user, isAdminPreview } = await requirePatient({ allowPasswordChangePending: true })
  if (isAdminPreview) return { error: 'Modo vista previa de solo lectura (Eva Vidal). No se puede modificar la contraseña del paciente.' }
  const currentPassword = String(formData.get('currentPassword') || '')
  const newPassword = String(formData.get('newPassword') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Por favor, completa todos los campos.' }
  }

  if (!isValidPassword(newPassword)) {
    return { error: 'La nueva contraseña debe tener al menos 14 caracteres, mayúscula, minúscula y número.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'La nueva contraseña y su confirmación no coinciden.' }
  }

  const headerList = await headers()
  const ip = getForwardedClientAddress(
    headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')
  )
  // El límite se consume antes de comprobar la contraseña actual: si no,
  // una sesión robada permitiría probar contraseñas sin restricción.
  const limit = await consumeRateLimit({
    key: rateLimitKey('change-password-user', user.id),
    limit: 5,
    windowMs: 15 * 60 * 1000,
    failClosed: true,
  })
  if (!limit.allowed) {
    return { error: `Demasiados intentos. Espera ${limit.retryAfterSeconds} segundos antes de volver a intentarlo.` }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true, patientId: true },
  })

  if (!dbUser || !(await bcrypt.compare(currentPassword, dbUser.passwordHash))) {
    return { error: 'La contraseña actual no es correcta.' }
  }

  const newHash = await bcrypt.hash(newPassword, 12)

  // La versión se obtiene del UPDATE para que la sesión reemitida coincida con
  // la base de datos incluso si otra petición incrementó el contador.
  const newSessionVersion = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordChangeRequired: false,
        // Un cambio de contraseña invalida cualquier enlace de reseteo que
        // siguiera pendiente, para que no pueda reutilizarse posteriormente.
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordResetRequestedAt: null,
        sessionVersion: { increment: 1 },
      },
      select: { sessionVersion: true },
    })
    await tx.auditLog.create({
      data: {
        userId: user.id,
        patientId: dbUser.patientId,
        action: 'PASSWORD_CHANGE',
        entityType: 'USER',
        entityId: user.id,
        details: `El paciente actualizó su contraseña desde la configuración del portal. Sesiones anteriores invalidadas. IP: ${ip}.`,
      },
    })
    return updated.sessionVersion
  })

  // Se reemite solo la sesión actual; cualquier cookie robada o sesión previa
  // queda invalidada por el incremento de sessionVersion.
  await createSession({
    id: user.id,
    role: user.role,
    email: user.email,
    patientId: user.patientId,
    sessionVersion: newSessionVersion,
  })

  return { success: 'Contraseña actualizada correctamente. Las demás sesiones han sido cerradas.' }
}

async function createPatientDataSubjectRequest(
  requestType: 'ERASURE' | 'ACCESS' | 'RECTIFICATION' | 'RESTRICTION' | 'OPPOSITION' | 'EXPORT',
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const { user, patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) {
    return {
      success: false,
      message: 'Modo vista previa de solo lectura (Eva Vidal). Las solicitudes RGPD no se pueden enviar en este modo.',
    }
  }
  if (!patientId) throw new Error('Paciente no identificado')

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, userId: true },
  })

  if (!patient) throw new Error('Expediente no encontrado')
  const safeNotes = typeof notes === 'string' ? notes.trim().slice(0, 2000) : ''

  const existingRequest = await prisma.dataSubjectRequest.findFirst({
    where: { userId: patient.userId, patientId: patient.id, requestType, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    select: { id: true },
  })
  if (existingRequest) {
    return { success: true, message: 'Ya existe una solicitud abierta de este tipo. La consulta la tramitará dentro del plazo legal.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.dataSubjectRequest.create({
      data: {
        userId: patient.userId,
        patientId: patient.id,
        requestType,
        status: 'PENDING',
        notes: safeNotes || `Solicitud ${requestType} tramitada por el paciente desde su portal.`,
      },
    })

    await tx.auditLog.create({
      data: {
        // La solicitud pertenece al expediente de la profesional, pero la
        // auditoría debe identificar a la persona que la ha enviado.
        userId: user.id,
        patientId: patient.id,
        action: `DATA_${requestType}_REQUEST`,
        entityType: 'PATIENT',
        entityId: patient.id,
        details: `Solicitud de derechos ${requestType} registrada por el paciente conforme al RGPD.`,
      },
    })
  })

  revalidatePath('/paciente/configuracion')
  return {
    success: true,
    message: `Solicitud de ${requestType === 'ERASURE' ? 'supresión' : requestType === 'RECTIFICATION' ? 'rectificación' : requestType === 'ACCESS' ? 'acceso' : 'derechos'} registrada formalmente. Eva Vidal la revisará conforme a los plazos legales.`,
  }
}

export async function requestDataErasureAction(notes?: string) {
  return createPatientDataSubjectRequest('ERASURE', notes)
}

export async function requestDataAccessAction(notes?: string) {
  return createPatientDataSubjectRequest('ACCESS', notes)
}

export async function requestDataRectificationAction(notes?: string) {
  return createPatientDataSubjectRequest('RECTIFICATION', notes)
}

export async function exportPatientDataAction(): Promise<{ dataJson: string; fileName: string }> {
  const { user, patientId, isAdminPreview } = await requirePatient()
  if (isAdminPreview) throw new Error('Modo vista previa de solo lectura (Eva Vidal).')
  if (!patientId) throw new Error('Paciente no identificado')

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      anthropometries: {
        where: { isPublishedToPatient: true },
        orderBy: { date: 'asc' },
      },
      mealPlans: {
        where: { isSharedWithPatient: true },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          targetKcal: true,
          notes: true,
        },
      },
      appointments: {
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          durationMin: true,
          modality: true,
          status: true,
        },
      },
      consents: {
        select: {
          id: true,
          type: true,
          title: true,
          version: true,
          accepted: true,
          acceptedAt: true,
        },
      },
      anamnesisSubmissions: {
        orderBy: { submittedAt: 'desc' },
      },
    },
  })

  if (!patient) throw new Error('Expediente no encontrado')

  const exportPayload = {
    formato: 'Portabilidad de Datos Personales y de Salud (RGPD Art. 20)',
    fechaGeneracion: new Date().toISOString(),
    entidadResponsable: 'Consulta Nutricional Eva Vidal (EVSoftware)',
    paciente: {
      nombre: patient.firstName,
      apellidos: patient.lastName,
      email: patient.email,
      telefono: patient.phone,
      fechaNacimiento: patient.birthDate,
      sexo: patient.sex,
      alturaCm: patient.heightCm,
      objetivo: patient.objective,
      nivelActividad: patient.activityLevel,
      alergias: patient.allergies,
      intolerancias: patient.intolerances,
      preferencias: patient.dietaryPreferences,
    },
    historialAntropometrico: patient.anthropometries.map((m) => ({
      fecha: m.date,
      pesoKg: m.weightKg,
      grasaPct: m.bodyFatPct,
      musculoKg: m.muscleMassKg,
      cinturaCm: m.waistCm,
      caderaCm: m.hipCm,
    })),
    planesNutricionales: patient.mealPlans,
    citasYRevisiones: patient.appointments,
    consentimientosFirmados: patient.consents,
    cuestionariosSalud: patient.anamnesisSubmissions,
  }

  const cleanName = `${patient.firstName}_${patient.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const fileName = `mis_datos_salud_${cleanName}_${new Date().toISOString().split('T')[0]}.json`

  // La exportación de datos de salud debe quedar trazada aunque la solicite
  // el propio paciente desde el portal (RGPD Art. 15 y 20).
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      patientId,
      action: 'PATIENT_DATA_EXPORTED_SELF_SERVICE',
      entityType: 'PATIENT',
      entityId: patientId,
      details: `Exportación de datos solicitada por el paciente desde el portal. Antropometrías: ${patient.anthropometries.length}; planes: ${patient.mealPlans.length}; citas: ${patient.appointments.length}; consentimientos: ${patient.consents.length}; cuestionarios: ${patient.anamnesisSubmissions.length}.`,
    },
  })

  return {
    dataJson: JSON.stringify(exportPayload, null, 2),
    fileName,
  }
}
