import 'server-only'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
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
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px; background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
          <!-- Header Branded -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #bae6fd; margin-bottom: 6px;">
                EVSoftware · Eva Vidal Nutrición
              </div>
              <div style="font-size: 22px; font-weight: 800; line-height: 1.3;">
                ${escapeHtml(subject)}
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 18px 0;">
                Hola, ${safeName}:
              </p>

              ${formattedParagraphs}

              <!-- Signature Card -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div style="font-size: 14px; font-weight: 800; color: #0f172a;">Eva Vidal</div>
                      <div style="font-size: 12px; font-weight: 600; color: #0284c7;">Nutrición Clínica y Dietética Personalizada</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Email oficial: evavidalinfo@gmail.com</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- RGPD Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5; color: #64748b;">
              <p style="margin: 0 0 6px 0;">
                <strong>Confidencialidad médica y RGPD:</strong> Este mensaje y sus posibles adjuntos contienen información confidencial dirigida exclusivamente a su destinatario. Si ha recibido este correo por error, rogamos lo notifique inmediatamente y proceda a su eliminación.
              </p>
              <p style="margin: 0;">
                Eva Vidal Nutrición · Tratamiento de datos sanitarios bajo el Reglamento (UE) 2016/679 (RGPD).
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
  if (!email || !email.includes('@')) {
    throw new Error('Dirección de correo electrónico no válida.')
  }

  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || smtpUser
  const smtpFromName = process.env.SMTP_FROM_NAME || 'Eva Vidal - Consulta Nutricional'

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Servicio de correo SMTP no configurado en las variables de entorno.')
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465 || process.env.SMTP_SECURE === 'true',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })

  const html = generateManualEmailHtml({
    recipientName: recipientName || '',
    subject,
    message,
  })

  try {
    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpFrom}>`,
      to: email,
      subject,
      text: message,
      html,
    })

    await logEmailSent({
      recipientEmail: email,
      recipientName: recipientName || null,
      patientId: patientId || null,
      subject,
      type: 'MANUAL',
      status: 'SENT',
    })

    return { success: true, message: `Correo enviado exitosamente a ${email}` }
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    console.error('Error al enviar correo manual:', error)

    await logEmailSent({
      recipientEmail: email,
      recipientName: recipientName || null,
      patientId: patientId || null,
      subject,
      type: 'MANUAL',
      status: 'FAILED',
      errorDetails: errorMsg,
    })

    throw new Error(`Error en el servidor de correo: ${errorMsg}`)
  }
}
