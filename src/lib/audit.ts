import { Prisma } from '@prisma/client'

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  PATIENT: 'Paciente',
  Patient: 'Paciente',
  SECURITY: 'Seguridad',
  Security: 'Seguridad',
  Consentimiento: 'Consentimiento',
  PatientConsent: 'Consentimiento',
  Cuestionario: 'Cuestionario',
  Questionnaire: 'Cuestionario',
  PatientQuestionnaire: 'Cuestionario',
  Cita: 'Cita',
  Appointment: 'Cita',
  Plan: 'Plan nutricional',
  MealPlan: 'Plan nutricional',
  Receta: 'Receta',
  Recipe: 'Receta',
  Alimento: 'Alimento',
  Food: 'Alimento',
  Usuario: 'Usuario',
  User: 'Usuario',
  Factura: 'Factura',
  Invoice: 'Factura',
  Protocolo: 'Protocolo clínico',
  Protocol: 'Protocolo clínico',
  ClinicalProtocolRecord: 'Protocolo clínico',
  Cálculo: 'Cálculo nutricional',
  CalculatorResult: 'Cálculo nutricional',
  CalculatorResultRecord: 'Cálculo nutricional',
  Correo: 'Correo',
  EmailLog: 'Correo',
  RGPD: 'Solicitud RGPD',
  DataSubjectRequest: 'Solicitud RGPD',
  Anamnesis: 'Anamnesis',
  AnamnesisSubmission: 'Anamnesis',
  Analítica: 'Analítica',
  BloodAnalysis: 'Analítica',
  Lista: 'Lista de espera',
  WaitlistEntry: 'Lista de espera',
  Documento: 'Documento',
  PatientDocument: 'Documento',
  Agenda: 'Agenda',
  AgendaBlock: 'Bloqueo de agenda',
  Revisión: 'Revisión clínica',
  ClinicalCheckIn: 'Revisión clínica',
  CheckIn: 'Revisión clínica',
  Bloqueo: 'Bloqueo de emergencia',
  EmergencyLockdown: 'Bloqueo de emergencia',
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  PATIENT_CREATED: 'Alta de paciente',
  PATIENT_UPDATED: 'Ficha actualizada',
  PATIENT_DISCHARGED: 'Alta clínica',
  PATIENT_REOPENED: 'Paciente reabierto',
  HARD_DELETE_PATIENT: 'Eliminación definitiva',
  ADMIN_PREVIEW_PATIENT_PORTAL: 'Vista previa del portal',
  CREATE_PORTAL_ACCOUNT: 'Acceso al portal creado',
  REFRESH_PORTAL_INVITE: 'Invitación reenviada',
  CONSENT_SENT_TO_PORTAL: 'Consentimiento enviado',
  CONSENT_REVOKED: 'Consentimiento revocado',
  PORTAL_LEGAL_POLICIES_ACCEPTED: 'Políticas legales aceptadas',
  QUESTIONNAIRE_SENT_TO_PORTAL: 'Cuestionario enviado',
  QUESTIONNAIRE_REOPENED_BY_ADMIN: 'Cuestionario reabierto',
  APPOINTMENT_CREATED: 'Cita creada',
  APPOINTMENT_RESCHEDULED_BY_PATIENT: 'Cita reprogramada por el paciente',
  MEAL_PLAN_PUBLISHED: 'Plan publicado',
  MEAL_PLAN_RECALCULATED: 'Plan recalculado',
  CLINICAL_CHECKIN_CREATED: 'Revisión de hábitos',
  CLINICAL_PROTOCOL_ASSIGNED: 'Protocolo asignado',
  CALCULATOR_ASSESSMENT_SAVED: 'Cálculo guardado',
  CGM_DATA_IMPORTED: 'Datos CGM importados',
  INVOICE_CREATED: 'Factura creada',
  PAYMENT_REGISTERED: 'Pago registrado',
  PASSWORD_CHANGE: 'Contraseña modificada',
  PASSWORD_RESET_REQUESTED: 'Restablecimiento solicitado',
  SECURITY_ALERT_UNAUTHORIZED_ADMIN_ROUTE: 'Acceso no autorizado',
  EMERGENCY_LOCKDOWN_ACTIVATED: 'Bloqueo de emergencia activado',
  EMERGENCY_LOCKDOWN_DEACTIVATED: 'Bloqueo de emergencia desactivado',
  RGPD_EXPORT_REQUESTED: 'Solicitud de exportación',
}

export function auditActionLabel(action: string) {
  if (AUDIT_ACTION_LABELS[action]) return AUDIT_ACTION_LABELS[action]
  return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function auditEntityLabel(entity: string) {
  return AUDIT_ENTITY_LABELS[entity] || entity
}

export type AuditFilters = {
  q: string
  entity: string
  action: string
  from: string
  to: string
  page: number
}

export function parseAuditFilters(params: Record<string, string | string[] | undefined>): AuditFilters {
  const get = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] || '' : value || ''
  }

  const page = Number.parseInt(get('page'), 10)

  return {
    q: get('q').trim(),
    entity: get('entity').trim(),
    action: get('action').trim(),
    from: get('from').trim(),
    to: get('to').trim(),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export function buildAuditWhere(userId: string, filters: AuditFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {
    OR: [{ userId }, { patient: { userId } }],
  }

  const and: Prisma.AuditLogWhereInput[] = []

  if (filters.entity) {
    and.push({ entityType: filters.entity })
  }

  if (filters.action) {
    and.push({ action: filters.action })
  }

  if (filters.from) {
    const from = new Date(`${filters.from}T00:00:00`)
    if (!Number.isNaN(from.getTime())) and.push({ createdAt: { gte: from } })
  }

  if (filters.to) {
    const to = new Date(`${filters.to}T23:59:59`)
    if (!Number.isNaN(to.getTime())) and.push({ createdAt: { lte: to } })
  }

  if (filters.q) {
    and.push({
      OR: [
        { action: { contains: filters.q, mode: 'insensitive' } },
        { details: { contains: filters.q, mode: 'insensitive' } },
        { patient: { is: { OR: [
          { firstName: { contains: filters.q, mode: 'insensitive' } },
          { lastName: { contains: filters.q, mode: 'insensitive' } },
        ] } } },
      ],
    })
  }

  if (and.length) where.AND = and

  return where
}

export function toCsvValue(value: unknown) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",;\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}
