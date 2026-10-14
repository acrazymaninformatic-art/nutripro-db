import { prisma } from '@/lib/prisma'

export interface LogEmailParams {
  recipientEmail: string
  recipientName?: string | null
  patientId?: string | null
  subject: string
  type: 'APPOINTMENT' | 'REMINDER_24H' | 'PLAN_PUBLISHED' | 'ANAMNESIS' | 'PORTAL_INVITE' | 'SECURITY'
  status: 'SENT' | 'FAILED'
  errorDetails?: string | null
}

export async function logEmailSent(params: LogEmailParams) {
  try {
    return await prisma.emailLog.create({
      data: {
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        patientId: params.patientId,
        subject: params.subject,
        type: params.type,
        status: params.status,
        errorDetails: params.errorDetails,
      },
    })
  } catch (error) {
    console.error('Failed to write email audit log:', error)
    return null
  }
}
