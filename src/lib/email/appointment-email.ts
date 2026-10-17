import nodemailer from 'nodemailer'
import { generateGoogleCalendarUrl, generateIcsContent } from '@/lib/calendar-utils'

// Re-export for backward compat (server-only consumers)
export { generateGoogleCalendarUrl, generateIcsContent }

interface SendAppointmentEmailParams {
  patientName: string
  patientEmail: string
  appointmentDate: Date
  durationMin?: number
  modality?: 'ONLINE' | 'PRESENCIAL' | string
  notes?: string
  location?: string
  professionalName?: string
  clinicName?: string
  rescheduleUrl?: string
}


export function generateAppointmentEmailHtml({
  patientName,
  appointmentDate,
  durationMin = 45,
  modality = 'ONLINE',
  notes = '',
  location = 'Consulta Nutricional Eva Vidal',
  professionalName = 'Eva Vidal',
  clinicName = 'Consulta Nutricional Eva Vidal',
  googleCalendarUrl,
  rescheduleUrl,
}: {
  patientName: string
  appointmentDate: Date
  durationMin?: number
  modality?: string
  notes?: string
  location?: string
  professionalName?: string
  clinicName?: string
  googleCalendarUrl: string
  rescheduleUrl?: string
}) {
  const firstName = patientName.split(' ')[0]
  
  // Format in Spanish
  const dateStr = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  })
  const timeStr = appointmentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })

  const isOnline = modality.toUpperCase() === 'ONLINE'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cita Nutricional</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Barra superior clínica -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #0284c7 0%, #0369a1 50%, #0284c7 100%);"></td>
          </tr>

          <!-- Encabezado Institucional Refinado -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0284c7; margin-bottom: 4px;">
                      EVA VIDAL &bull; NUTRICIÓN CLÍNICA
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                      Confirmación de Consulta Nutricional
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #059669;">
                      Confirmada
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0;">
                Hola, ${firstName}:
              </h1>

              <p style="font-size: 15px; color: #334155; margin: 0 0 22px 0; line-height: 1.6;">
                Te confirmo que tienes agendada tu sesión nutricional con <strong>${professionalName}</strong>. A continuación dispones de todos los detalles de tu cita:
              </p>

              <!-- Tarjeta de Cita con Iconos SVG -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 26px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      
                      <!-- Fecha -->
                      <tr>
                        <td style="width: 32px; vertical-align: top; padding-bottom: 16px;">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px; padding-bottom: 16px;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</div>
                          <div style="font-size: 15px; font-weight: 700; color: #0f172a; text-transform: capitalize; margin-top: 1px;">${dateStr}</div>
                        </td>
                      </tr>

                      <!-- Hora y Duración -->
                      <tr>
                        <td style="width: 32px; vertical-align: top; padding-bottom: 16px;">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px; padding-bottom: 16px;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Horario y Duración</div>
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 1px;">${timeStr} h (sesión de aprox. ${durationMin} minutos)</div>
                        </td>
                      </tr>

                      <!-- Modalidad -->
                      <tr>
                        <td style="width: 32px; vertical-align: top; ${location && !isOnline ? 'padding-bottom: 16px;' : notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            ${isOnline
                              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
                              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
                            }
                          </div>
                        </td>
                        <td style="padding-left: 10px; ${location && !isOnline ? 'padding-bottom: 16px;' : notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Modalidad</div>
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 1px;">
                            ${isOnline ? 'Videollamada Online (recibirás el enlace de Google Meet)' : 'Presencial en Consulta'}
                          </div>
                        </td>
                      </tr>

                      <!-- Dirección (si presencial) -->
                      ${location && !isOnline ? `
                      <tr>
                        <td style="width: 32px; vertical-align: top; ${notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px; ${notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Ubicación</div>
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 1px;">${location}</div>
                        </td>
                      </tr>
                      ` : ''}

                      <!-- Notas -->
                      ${notes ? `
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Motivo / Observaciones</div>
                          <div style="font-size: 14px; font-weight: 500; color: #334155; margin-top: 1px;">${notes}</div>
                        </td>
                      </tr>
                      ` : ''}

                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón Añadir a Google Calendar -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 26px 0;">
                <tr>
                  <td align="center">
                    <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); text-align: center;">
                      Añadir a mi Google Calendar &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Recomendaciones previas -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                      Recomendaciones para tu sesión
                    </div>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; line-height: 1.6;">
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 3px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Si dispones de analíticas sanguíneas recientes (últimos 6 meses), tenlas a mano o responde a este correo adjuntándolas.</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 3px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Si es tu primera consulta y aún no has completado tu cuestionario clínico de anamnesis, avísame para remitirte el enlace.</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 3px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td>Anota cualquier duda sobre horarios o síntomas digestivos que desees revisar en detalle durante la cita.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                Si necesitas reprogramar tu cita, por favor comunícalo respondiendo a este correo con al menos 24 horas de antelación.
              </p>

              ${rescheduleUrl ? `
              <p style="font-size: 13px; margin: 16px 0 0 0; text-align: center;">
                <a href="${rescheduleUrl}" style="display: inline-block; background-color: #f1f5f9; color: #0284c7; font-weight: 600; text-decoration: none; padding: 10px 22px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 13px;">
                  Gestionar o reprogramar cita online &rarr;
                </a>
              </p>
              ` : ''}

              <div style="border-top: 1px solid #e2e8f0; margin-top: 26px; padding-top: 22px;">
                <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                  Atentamente,<br>
                  <strong style="color: #0f172a; font-size: 14px;">${professionalName}</strong><br>
                  <span style="color: #0284c7; font-weight: 600;">Dietista &bull; Nutricionista Colegiada</span><br>
                  <span style="color: #64748b; font-size: 12px;">info@evavidalnutricion.com</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 6px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 6px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </td>
                  <td style="vertical-align: middle; font-size: 11px; font-weight: 700; color: #475569;">
                    Confidencialidad Médica y RGPD
                  </td>
                </tr>
              </table>
              <p style="margin: 0;">
                ${clinicName} &bull; Consulta de Nutrición Clínica y Dietética Personalizada.<br>
                Contacto oficial: <a href="mailto:info@evavidalnutricion.com" style="color: #0284c7; text-decoration: none;">info@evavidalnutricion.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function sendAppointmentEmail({
  patientName,
  patientEmail,
  appointmentDate,
  durationMin = 45,
  modality = 'ONLINE',
  notes = '',
  location = 'Consulta Nutricional Eva Vidal',
  professionalName = 'Eva Vidal',
  clinicName = 'Consulta Nutricional Eva Vidal',
  rescheduleUrl,
}: SendAppointmentEmailParams) {
  const isOnline = modality.toUpperCase() === 'ONLINE'
  const eventTitle = `Cita de Nutrición: ${patientName} - ${professionalName}`
  const eventDesc = `Consulta Nutricional con ${professionalName} (${clinicName}).\nModalidad: ${isOnline ? 'Online (Videollamada)' : 'Presencial'}\nNotas: ${notes || 'Consulta programada'}\nContacto: info@evavidalnutricion.com`

  const googleCalendarUrl = generateGoogleCalendarUrl({
    title: eventTitle,
    startDate: appointmentDate,
    durationMin,
    description: eventDesc,
    location: isOnline ? 'Online / Google Meet' : location,
  })

  const icsData = generateIcsContent({
    title: eventTitle,
    startDate: appointmentDate,
    durationMin,
    description: eventDesc,
    location: isOnline ? 'Online / Google Meet' : location,
  })

  const emailSubject = `Confirmación de Cita Nutricional: ${patientName} (${appointmentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`
  const emailHtml = generateAppointmentEmailHtml({
    patientName,
    appointmentDate,
    durationMin,
    modality,
    notes,
    location,
    professionalName,
    clinicName,
    googleCalendarUrl,
    rescheduleUrl,
  })

  const plainText = `Hola ${patientName.split(' ')[0]},\n\nTu cita de nutrición con ${professionalName} está confirmada para el ${appointmentDate.toLocaleDateString('es-ES')} a las ${appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h.\n\nModalidad: ${isOnline ? 'Online' : 'Presencial'}\n\nAñadir a Google Calendar: ${googleCalendarUrl}\n\nAtentamente,\n${professionalName}\n${clinicName}\ninfo@evavidalnutricion.com`

  const smtpFrom = process.env.SMTP_FROM || 'info@evavidalnutricion.com'
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  if (!smtpFrom || !smtpUser || !smtpPass || !smtpHost) return { success: false, message: 'Falta configuración del servicio de correo.' }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.sendMail({
      from: `"${professionalName} - ${clinicName}" <${smtpFrom}>`,
      replyTo: smtpFrom,
      to: patientEmail,
      subject: emailSubject,
      text: `${plainText}${rescheduleUrl ? `\n\nReprogramar de forma segura: ${rescheduleUrl}` : ''}`,
      html: `${emailHtml}${rescheduleUrl ? `<p style="font-family:Arial,sans-serif;text-align:center"><a href="${rescheduleUrl}">Reprogramar esta cita de forma segura</a></p>` : ''}`,
      icalEvent: {
        filename: 'cita-nutricion.ics',
        method: 'REQUEST',
        content: icsData,
      },
    })

    const { logEmailSent } = await import('./log-email')
    await logEmailSent({
      recipientEmail: patientEmail,
      recipientName: patientName,
      subject: emailSubject,
      type: 'APPOINTMENT',
      status: 'SENT',
    })

    return {
      success: true,
      message: `Cita enviada por email a ${patientEmail} desde ${smtpFrom}`,
      googleCalendarUrl,
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error)
    console.error('Error al enviar email de cita:', error)
    try {
      const { logEmailSent } = await import('./log-email')
      await logEmailSent({
        recipientEmail: patientEmail,
        recipientName: patientName,
        subject: emailSubject,
        type: 'APPOINTMENT',
        status: 'FAILED',
        errorDetails: errMessage,
      })
    } catch {}

    return {
      success: false,
      message: `Error al enviar correo: ${errMessage}`,
      googleCalendarUrl,
    }
  }
}

export function generateAppointmentReminderEmailHtml({
  patientName,
  appointmentDate,
  durationMin = 45,
  modality = 'ONLINE',
  notes = '',
  location = 'Consulta Nutricional Eva Vidal',
  professionalName = 'Eva Vidal',
  clinicName = 'Consulta Nutricional Eva Vidal',
  googleCalendarUrl,
}: {
  patientName: string
  appointmentDate: Date
  durationMin?: number
  modality?: string
  notes?: string
  location?: string
  professionalName?: string
  clinicName?: string
  googleCalendarUrl: string
}) {
  const firstName = patientName.split(' ')[0]

  const dateStr = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  })
  const timeStr = appointmentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })

  const isOnline = modality.toUpperCase() === 'ONLINE'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio: Tu Consulta Nutricional es Mañana</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Barra superior clínica -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #0284c7 0%, #0369a1 50%, #0284c7 100%);"></td>
          </tr>

          <!-- Encabezado Institucional Refinado -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0284c7; margin-bottom: 4px;">
                      EVA VIDAL &bull; NUTRICIÓN CLÍNICA
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                      Recordatorio de Consulta Nutricional
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #b45309;">
                      Mañana
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0;">
                Hola, ${firstName}:
              </h1>

              <p style="font-size: 15px; color: #334155; margin: 0 0 22px 0; line-height: 1.6;">
                Te escribo para recordarte que <strong>mañana</strong> tenemos programada tu sesión de consulta nutricional con <strong>${professionalName}</strong>. Aquí tienes el resumen de tu cita:
              </p>

              <!-- Tarjeta de Cita con Iconos SVG -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 26px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      
                      <!-- Fecha -->
                      <tr>
                        <td style="width: 32px; vertical-align: top; padding-bottom: 16px;">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px; padding-bottom: 16px;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Fecha</div>
                          <div style="font-size: 15px; font-weight: 700; color: #0f172a; text-transform: capitalize; margin-top: 1px;">Mañana, ${dateStr}</div>
                        </td>
                      </tr>

                      <!-- Hora y Duración -->
                      <tr>
                        <td style="width: 32px; vertical-align: top; padding-bottom: 16px;">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px; padding-bottom: 16px;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Horario y Duración</div>
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 1px;">${timeStr} h (${durationMin} minutos aprox.)</div>
                        </td>
                      </tr>

                      <!-- Modalidad -->
                      <tr>
                        <td style="width: 32px; vertical-align: top; ${location && !isOnline ? 'padding-bottom: 16px;' : notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            ${isOnline
                              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
                              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
                            }
                          </div>
                        </td>
                        <td style="padding-left: 10px; ${location && !isOnline ? 'padding-bottom: 16px;' : notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Modalidad</div>
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 1px;">
                            ${isOnline ? 'Videollamada Online (enlace de Google Meet en tu calendario)' : 'Presencial en Consulta'}
                          </div>
                        </td>
                      </tr>

                      <!-- Ubicación (si presencial) -->
                      ${location && !isOnline ? `
                      <tr>
                        <td style="width: 32px; vertical-align: top; ${notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px; ${notes ? 'padding-bottom: 16px;' : ''}">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Ubicación</div>
                          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 1px;">${location}</div>
                        </td>
                      </tr>
                      ` : ''}

                      <!-- Notas -->
                      ${notes ? `
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Observaciones</div>
                          <div style="font-size: 14px; font-weight: 500; color: #334155; margin-top: 1px;">${notes}</div>
                        </td>
                      </tr>
                      ` : ''}

                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón Google Calendar -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 26px 0;">
                <tr>
                  <td align="center">
                    <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); text-align: center;">
                      Ver en Google Calendar &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Consejos de preparación -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                      Pautas para aprovechar la sesión
                    </div>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; line-height: 1.6;">
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 3px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Si es consulta de seguimiento, repasa mentalmente o anota cómo te has sentido con la pauta y las recetas.</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 3px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Ten a mano las dudas nutricionales o cambios que te gustaría incorporar para resolverlos durante la consulta.</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 3px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td>En caso de videollamada, procura conectarte 2 minutos antes en un lugar tranquilo y con buena conexión.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                ¿Te ha surgido algún imprevisto? Si necesitas comunicar un retraso o avisar de alguna circunstancia, responde directamente a este correo.
              </p>

              <div style="border-top: 1px solid #e2e8f0; margin-top: 26px; padding-top: 22px;">
                <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                  Atentamente,<br>
                  <strong style="color: #0f172a; font-size: 14px;">${professionalName}</strong><br>
                  <span style="color: #0284c7; font-weight: 600;">Dietista &bull; Nutricionista Colegiada</span><br>
                  <span style="color: #64748b; font-size: 12px;">info@evavidalnutricion.com</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 6px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 6px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </td>
                  <td style="vertical-align: middle; font-size: 11px; font-weight: 700; color: #475569;">
                    Confidencialidad Médica y RGPD
                  </td>
                </tr>
              </table>
              <p style="margin: 0;">
                ${clinicName} &bull; Consulta de Nutrición Clínica y Dietética Personalizada.<br>
                Contacto oficial: <a href="mailto:info@evavidalnutricion.com" style="color: #0284c7; text-decoration: none;">info@evavidalnutricion.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function sendAppointmentReminderEmail({
  patientName,
  patientEmail,
  appointmentDate,
  durationMin = 45,
  modality = 'ONLINE',
  notes = '',
  location = 'Consulta Nutricional Eva Vidal',
  professionalName = 'Eva Vidal',
  clinicName = 'Consulta Nutricional Eva Vidal',
}: SendAppointmentEmailParams) {
  const isOnline = modality.toUpperCase() === 'ONLINE'
  const eventTitle = `Cita de Nutrición: ${patientName} - ${professionalName}`
  const eventDesc = `Consulta Nutricional con ${professionalName} (${clinicName}).\nModalidad: ${isOnline ? 'Online (Videollamada)' : 'Presencial'}\nNotas: ${notes || 'Consulta programada'}\nContacto: info@evavidalnutricion.com`

  const googleCalendarUrl = generateGoogleCalendarUrl({
    title: eventTitle,
    startDate: appointmentDate,
    durationMin,
    description: eventDesc,
    location: isOnline ? 'Online / Google Meet' : location,
  })

  const icsData = generateIcsContent({
    title: eventTitle,
    startDate: appointmentDate,
    durationMin,
    description: eventDesc,
    location: isOnline ? 'Online / Google Meet' : location,
  })

  const emailSubject = `Recordatorio: Tu consulta nutricional es mañana (${appointmentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`
  const emailHtml = generateAppointmentReminderEmailHtml({
    patientName,
    appointmentDate,
    durationMin,
    modality,
    notes,
    location,
    professionalName,
    clinicName,
    googleCalendarUrl,
  })

  const plainText = `Hola ${patientName.split(' ')[0]},\n\nTe recordamos que mañana ${appointmentDate.toLocaleDateString('es-ES')} a las ${appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h tienes tu consulta de nutrición con ${professionalName}.\n\nModalidad: ${isOnline ? 'Online' : 'Presencial'}\n\nAñadir / Ver en Google Calendar: ${googleCalendarUrl}\n\nAtentamente,\n${professionalName}\n${clinicName}\ninfo@evavidalnutricion.com`

  const smtpFrom = process.env.SMTP_FROM || 'info@evavidalnutricion.com'
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  if (!smtpFrom || !smtpUser || !smtpPass || !smtpHost) return { success: false, message: 'Falta configuración del servicio de correo.' }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    await transporter.sendMail({
      from: `"${professionalName} - ${clinicName}" <${smtpFrom}>`,
      replyTo: smtpFrom,
      to: patientEmail,
      subject: emailSubject,
      text: plainText,
      html: emailHtml,
      icalEvent: {
        filename: 'recordatorio-cita-nutricion.ics',
        method: 'REQUEST',
        content: icsData,
      },
    })

    const { logEmailSent } = await import('./log-email')
    await logEmailSent({
      recipientEmail: patientEmail,
      recipientName: patientName,
      subject: emailSubject,
      type: 'REMINDER_24H',
      status: 'SENT',
    })

    return {
      success: true,
      message: `Recordatorio enviado por email a ${patientEmail} desde ${smtpFrom}`,
      googleCalendarUrl,
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error)
    console.error('Error al enviar recordatorio de cita:', error)
    try {
      const { logEmailSent } = await import('./log-email')
      await logEmailSent({
        recipientEmail: patientEmail,
        recipientName: patientName,
        subject: emailSubject,
        type: 'REMINDER_24H',
        status: 'FAILED',
        errorDetails: errMessage,
      })
    } catch {}

    return {
      success: false,
      message: `Error al enviar recordatorio: ${errMessage}`,
      googleCalendarUrl,
    }
  }
}

