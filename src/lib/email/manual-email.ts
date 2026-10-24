import 'server-only'
import nodemailer from 'nodemailer'
import { logEmailSent } from './log-email'

export interface SendManualEmailParams {
  recipientEmail: string
  recipientName?: string
  subject: string
  message: string
  patientId?: string
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m] || m)
}

export function generateManualEmailHtml({
  recipientName,
  subject,
  message,
}: {
  recipientName?: string
  subject: string
  message: string
}) {
  const safeName = escapeHtml(recipientName || 'Paciente')
  const formattedParagraphs = message
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155; font-size: 15px;">${escapeHtml(line)}</p>`)
    .join('')

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px; background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);">
          
          <!-- Barra superior clínica -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #0284c7 0%, #0369a1 50%, #0284c7 100%);"></td>
          </tr>

          <!-- Header Branded -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0284c7; margin-bottom: 4px;">
                      EVA VIDAL &bull; NUTRICIÓN CLÍNICA
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">
                      ${escapeHtml(subject)}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #0284c7;">
                      Comunicación Oficial
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 18px 0;">
                Hola, ${safeName}:
              </p>

              <div style="font-size: 15px; color: #334155; line-height: 1.6;">
                ${formattedParagraphs}
              </div>

              <!-- Signature Card -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div style="font-size: 14px; font-weight: 800; color: #0f172a;">Eva Vidal</div>
                      <div style="font-size: 12px; font-weight: 600; color: #0284c7;">Dietista &bull; Nutricionista Colegiada</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Email oficial: <a href="mailto:info@evavidalnutricion.com" style="color: #0284c7; text-decoration: none;">info@evavidalnutricion.com</a></div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- RGPD Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5; color: #94a3b8; text-align: center;">
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
              <p style="margin: 0 0 4px 0;">
                Este mensaje y sus posibles adjuntos contienen información médica confidencial dirigida exclusivamente a su destinatario.
              </p>
              <p style="margin: 0;">
                Eva Vidal Nutrición &bull; Tratamiento de datos de salud bajo el Reglamento (UE) 2016/679 (RGPD).
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendManualEmail({
  recipientEmail,
  recipientName,
  subject,
  message,
  patientId,
}: SendManualEmailParams) {
  const email = recipientEmail.trim().toLowerCase()
  if (
    !email ||
    email.length > 254 ||
    /[\r\n]/.test(email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error('Dirección de correo electrónico no válida.')
  }
  const safeSubject = subject.trim()
  if (!safeSubject || safeSubject.length > 200 || /[\r\n]/.test(safeSubject)) {
    throw new Error('El asunto del correo no es válido.')
  }
  if (message.length > 20_000) {
    throw new Error('El mensaje no puede superar 20.000 caracteres.')
  }
  const safeRecipientName = (recipientName || '').trim().slice(0, 120)

  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || 'info@evavidalnutricion.com'
  const smtpFromName = process.env.SMTP_FROM_NAME || 'Eva Vidal - Consulta Nutricional'

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Servicio de correo SMTP no configurado en las variables de entorno.')
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })

  const html = generateManualEmailHtml({
    recipientName: safeRecipientName,
    subject: safeSubject,
    message,
  })

  try {
    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpFrom}>`,
      replyTo: smtpFrom,
      to: email,
      subject: safeSubject,
      text: message,
      html,
    })

    await logEmailSent({
      recipientEmail: email,
      recipientName: safeRecipientName || null,
      patientId: patientId || null,
      subject: safeSubject,
      type: 'MANUAL',
      status: 'SENT',
    })

    return { success: true, message: `Correo enviado exitosamente a ${email}` }
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    console.error('Error al enviar correo manual:', error)

    await logEmailSent({
      recipientEmail: email,
      recipientName: safeRecipientName || null,
      patientId: patientId || null,
      subject: safeSubject,
      type: 'MANUAL',
      status: 'FAILED',
      errorDetails: errorMsg,
    })

    throw new Error(`Error en el servidor de correo: ${errorMsg}`)
  }
}
