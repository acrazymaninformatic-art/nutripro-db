'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin, requirePatient } from '@/lib/auth'

export interface AppNotification {
  id: string
  title: string
  description: string
  time: string
  href: string
  type: 'APPOINTMENT' | 'QUESTIONNAIRE' | 'PLAN' | 'DOCUMENT' | 'ALERT'
  unread: boolean
}

export async function getNotificationsAction(role: 'ADMIN' | 'PATIENT'): Promise<AppNotification[]> {
  const notifications: AppNotification[] = []

  if (role === 'ADMIN') {
    const admin = await requireAdmin()

    // 1. Solicitudes de cita pendientes de aprobación
    const pendingAppointments = await prisma.appointmentRequest.findMany({
      where: { status: 'PENDING', patient: { userId: admin.id } },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    for (const req of pendingAppointments) {
      notifications.push({
        id: `req-${req.id}`,
        title: req.type === 'NEW' ? 'Nueva solicitud de cita' : 'Solicitud de cambio de cita',
        description: `${req.patient.firstName} ${req.patient.lastName} ha solicitado cita (${req.modality === 'ONLINE' ? 'Online' : 'Presencial'}).`,
        time: req.createdAt.toISOString(),
        href: `/dashboard/appointments`,
        type: 'APPOINTMENT',
        unread: true,
      })
    }

    // 2. Cuestionarios completados por pacientes pendientes de revisar
    const completedQuestionnaires = await prisma.patientQuestionnaire.findMany({
      where: {
        status: 'COMPLETED',
        pendingFieldsCount: { gt: 0 },
        patient: { userId: admin.id },
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    for (const q of completedQuestionnaires) {
      notifications.push({
        id: `q-${q.id}`,
        title: 'Cuestionario pendiente de validar',
        description: `${q.patient.firstName} ${q.patient.lastName} completó su anamnesis. ${q.pendingFieldsCount} campos para incorporar.`,
        time: q.updatedAt.toISOString(),
        href: `/dashboard/patients/${q.patient.id}?tab=cuestionario`,
        type: 'QUESTIONNAIRE',
        unread: true,
      })
    }

    // 3. Pacientes con anamnesis completada reciente
    const recentAnamnesisPatients = await prisma.patient.findMany({
      where: {
        anamnesisStatus: 'COMPLETED',
        userId: admin.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        anamnesisCompletedAt: true,
      },
      orderBy: { anamnesisCompletedAt: 'desc' },
      take: 3,
    })

    for (const p of recentAnamnesisPatients) {
      if (p.anamnesisCompletedAt && !notifications.some((n) => n.href.includes(p.id))) {
        notifications.push({
          id: `anam-${p.id}`,
          title: 'Anamnesis de salud completada',
          description: `${p.firstName} ${p.lastName} ha finalizado su cuestionario clínico previo.`,
          time: p.anamnesisCompletedAt.toISOString(),
          href: `/dashboard/patients/${p.id}?tab=cuestionario`,
          type: 'QUESTIONNAIRE',
          unread: true,
        })
      }
    }
  } else {
    // ROL PACIENTE
    const { patientId } = await requirePatient()
    if (patientId) {
      // 1. Citas próximas confirmadas
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          patientId,
          status: 'CONFIRMED',
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        take: 3,
      })

      for (const app of upcomingAppointments) {
        const d = new Date(app.date)
        notifications.push({
          id: `app-${app.id}`,
          title: 'Cita programada con Eva Vidal',
          description: `Tu consulta está confirmada para el ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} a las ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h.`,
          time: app.date.toISOString(),
          href: `/paciente/citas`,
          type: 'APPOINTMENT',
          unread: false,
        })
      }

      // 2. Plan nutricional publicado
      const activePlan = await prisma.mealPlan.findFirst({
        where: {
          patientId,
          isSharedWithPatient: true,
        },
        orderBy: { updatedAt: 'desc' },
      })

      if (activePlan) {
        notifications.push({
          id: `plan-${activePlan.id}`,
          title: 'Nuevo plan nutricional activo',
          description: `Tu pauta "${activePlan.name}" está disponible con el recetario completo.`,
          time: activePlan.updatedAt.toISOString(),
          href: `/paciente/plan`,
          type: 'PLAN',
          unread: false,
        })
      }

      // 3. Cuestionario asignado o pendiente
      const pendingQuestionnaire = await prisma.patientQuestionnaire.findFirst({
        where: {
          patientId,
          status: { in: ['SENT', 'IN_PROGRESS'] },
        },
        orderBy: { updatedAt: 'desc' },
      })

      if (pendingQuestionnaire) {
        notifications.push({
          id: `q-pend-${pendingQuestionnaire.id}`,
          title: 'Cuestionario pre-consulta pendiente',
          description: 'Por favor, completa tus datos para que Eva pueda preparar tu estudio.',
          time: pendingQuestionnaire.updatedAt.toISOString(),
          href: `/paciente/cuestionarios/alta`,
          type: 'QUESTIONNAIRE',
          unread: true,
        })
      }

      // 4. Documentos compartidos
      const sharedDocs = await prisma.patientDocument.findMany({
        where: {
          patientId,
          isSharedWithPatient: true,
        },
        orderBy: { uploadedAt: 'desc' },
        take: 2,
      })

      for (const doc of sharedDocs) {
        notifications.push({
          id: `doc-${doc.id}`,
          title: 'Nuevo documento en tu expediente',
          description: `Eva ha compartido contigo "${doc.title || doc.fileName}".`,
          time: doc.uploadedAt.toISOString(),
          href: `/paciente/documentos`,
          type: 'DOCUMENT',
          unread: false,
        })
      }
    }
  }

  return notifications
}
