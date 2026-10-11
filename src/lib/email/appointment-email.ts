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
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f4f8; padding: 36px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.08); border: 1px solid #dbeafe;">
          
          <!-- Encabezado con gradiente azul clínico -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #1e40af 100%); padding: 38px 30px; text-align: center;">
              <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; display: inline-block;">
                📅 ${clinicName}
              </span>
              <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 14px; font-weight: 500;">
                Confirmación de Cita Nutricional y Reserva Oficial
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="font-size: 21px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">
                ¡Hola, ${firstName}!
              </h1>

              <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
                Te confirmo que tienes agendada tu sesión nutricional con <strong>${professionalName}</strong>. A continuación encontrarás todos los detalles de tu cita:
              </p>

              <!-- Tarjeta de Cita Destacada -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f9ff; border: 2px solid #bae6fd; border-radius: 20px; padding: 24px; margin-bottom: 28px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      DATOS DE TU RESERVA
                    </div>
                    
                    <div style="font-size: 18px; font-weight: 800; color: #0c4a6e; margin-bottom: 12px; text-transform: capitalize;">
                      🗓️ ${dateStr}
                    </div>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #334155;">
                      <tr>
                        <td style="padding: 4px 0;"><strong>⏰ Hora:</strong> ${timeStr} h (duración aprox. ${durationMin} min)</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>📍 Modalidad:</strong> ${isOnline ? '💻 Videollamada Online (recibirás el enlace)' : '🏥 Presencial en Consulta'}</td>
                      </tr>
                      ${location && !isOnline ? `<tr><td style="padding: 4px 0;"><strong>🏢 Dirección:</strong> ${location}</td></tr>` : ''}
                      ${notes ? `<tr><td style="padding: 4px 0;"><strong>📝 Motivo/Notas:</strong> ${notes}</td></tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón Añadir a Google Calendar -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 50px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); text-align: center;">
                      📅 Añadir a mi Google Calendar
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Recomendaciones previas -->
              <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #334155;">
                  💡 Recomendaciones para tu consulta:
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #64748b; line-height: 1.6;">
                  <li>Si dispones de analíticas sanguíneas recientes de los últimos 6 meses, tenlas a mano o envíalas respondiendo a este email.</li>
                  <li>Si es tu primera consulta y aún no has completado tu cuestionario de anamnesis, avísame para enviarte tu enlace.</li>
                  <li>Anota cualquier duda o síntoma digestivo que desees comentar durante la sesión.</li>
                </ul>
              </div>

              <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">
                Si necesitas reprogramar tu cita, por favor responde a este correo con al menos 24 horas de antelación.
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #475569;">
                ${professionalName} — Nutricionista Colegiada
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
                ${clinicName} • Email de contacto: <a href="mailto:evavidalinfo@gmail.com" style="color: #0284c7; text-decoration: none;">evavidalinfo@gmail.com</a>
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
}: SendAppointmentEmailParams) {
  const isOnline = modality.toUpperCase() === 'ONLINE'
  const eventTitle = `Cita de Nutrición: ${patientName} - ${professionalName}`
  const eventDesc = `Consulta Nutricional con ${professionalName} (${clinicName}).\nModalidad: ${isOnline ? 'Online (Videollamada)' : 'Presencial'}\nNotas: ${notes || 'Consulta programada'}\nContacto: evavidalinfo@gmail.com`

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
  })

  const plainText = `Hola ${patientName.split(' ')[0]},\n\nTu cita de nutrición con ${professionalName} está confirmada para el ${appointmentDate.toLocaleDateString('es-ES')} a las ${appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h.\n\nModalidad: ${isOnline ? 'Online' : 'Presencial'}\n\nAñadir a Google Calendar: ${googleCalendarUrl}\n\nAtentamente,\n${professionalName}\n${clinicName}\nevavidalinfo@gmail.com`

  const smtpFrom = 'evavidalinfo@gmail.com'
  const smtpUser = process.env.SMTP_USER || 'evavidalinfo@gmail.com'
  const smtpPass = process.env.SMTP_PASS || 'bocpzmoggkajgeqk'
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587

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
      to: patientEmail,
      subject: emailSubject,
      text: plainText,
      html: emailHtml,
      icalEvent: {
        filename: 'cita-nutricion.ics',
        method: 'REQUEST',
        content: icsData,
      },
    })

    return {
      success: true,
      message: `Cita enviada por email a ${patientEmail} desde ${smtpFrom}`,
      googleCalendarUrl,
    }
  } catch (error: any) {
    console.error('Error al enviar email de cita:', error)
    return {
      success: false,
      message: `Error al enviar correo: ${error?.message || 'Error desconocido'}`,
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
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f4f8; padding: 36px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.08); border: 1px solid #dbeafe;">
          
          <!-- Encabezado con gradiente azul clínico -->
          <tr>
            <td style="background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%); padding: 36px 30px; text-align: center;">
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; display: inline-block;">
                🔔 Recordatorio de Cita: Mañana
              </span>
              <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 14px; font-weight: 500;">
                ${clinicName} • ${professionalName}
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="font-size: 21px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0;">
                ¡Hola, ${firstName}!
              </h1>

              <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
                Te escribo para recordarte que <strong>mañana</strong> tenemos programada tu consulta nutricional. Aquí tienes el resumen de tu sesión:
              </p>

              <!-- Tarjeta de Cita Destacada -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f9ff; border: 2px solid #bae6fd; border-radius: 20px; padding: 22px; margin-bottom: 26px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                      TU CITA EN MENOS DE 24 HORAS
                    </div>
                    
                    <div style="font-size: 19px; font-weight: 800; color: #0c4a6e; margin-bottom: 12px; text-transform: capitalize;">
                      🗓️ Mañana, ${dateStr}
                    </div>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #334155;">
                      <tr>
                        <td style="padding: 4px 0;"><strong>⏰ Hora:</strong> ${timeStr} h (${durationMin} min aprox.)</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0;"><strong>📍 Modalidad:</strong> ${isOnline ? '💻 Videollamada Online (recibirás el enlace o Google Meet)' : '🏥 Presencial en Consulta'}</td>
                      </tr>
                      ${location && !isOnline ? `<tr><td style="padding: 4px 0;"><strong>🏢 Dirección:</strong> ${location}</td></tr>` : ''}
                      ${notes ? `<tr><td style="padding: 4px 0;"><strong>📝 Notas:</strong> ${notes}</td></tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón Google Calendar -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 15px 34px; border-radius: 50px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); text-align: center;">
                      📅 Ver en Google Calendar
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Checklist -->
              <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 22px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #334155;">
                  📋 Consejos para aprovechar al máximo la sesión:
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #64748b; line-height: 1.6;">
                  <li>Si es consulta de revisión, apunta cómo te has sentido con el plan y si has tenido dificultades.</li>
                  <li>Ten a mano tus dudas o apetencias sobre recetas para ajustarlas sobre la marcha.</li>
                  <li>Si es por videollamada, procura conectarte 2 minutos antes en un espacio tranquilo.</li>
                </ul>
              </div>

              <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                ¿Te ha surgido algún imprevisto? Si necesitas cambiar la hora o avisar de un retraso, responde directamente a este correo o contacta lo antes posible.
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #475569;">
                ${professionalName} — Nutricionista Colegiada
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
                Email oficial: <a href="mailto:evavidalinfo@gmail.com" style="color: #0284c7; text-decoration: none;">evavidalinfo@gmail.com</a>
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
  const eventDesc = `Consulta Nutricional con ${professionalName} (${clinicName}).\nModalidad: ${isOnline ? 'Online (Videollamada)' : 'Presencial'}\nNotas: ${notes || 'Consulta programada'}\nContacto: evavidalinfo@gmail.com`

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

  const emailSubject = `🔔 Recordatorio: Tu consulta nutricional es mañana (${appointmentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`
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

  const plainText = `Hola ${patientName.split(' ')[0]},\n\nTe recordamos que mañana ${appointmentDate.toLocaleDateString('es-ES')} a las ${appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h tienes tu consulta de nutrición con ${professionalName}.\n\nModalidad: ${isOnline ? 'Online' : 'Presencial'}\n\nAñadir / Ver en Google Calendar: ${googleCalendarUrl}\n\nAtentamente,\n${professionalName}\n${clinicName}\nevavidalinfo@gmail.com`

  const smtpFrom = 'evavidalinfo@gmail.com'
  const smtpUser = process.env.SMTP_USER || 'evavidalinfo@gmail.com'
  const smtpPass = process.env.SMTP_PASS || 'bocpzmoggkajgeqk'
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587

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

    return {
      success: true,
      message: `Recordatorio enviado por email a ${patientEmail} desde ${smtpFrom}`,
      googleCalendarUrl,
    }
  } catch (error: any) {
    console.error('Error al enviar recordatorio de cita:', error)
    return {
      success: false,
      message: `Error al enviar recordatorio: ${error?.message || 'Error desconocido'}`,
      googleCalendarUrl,
    }
  }
}

