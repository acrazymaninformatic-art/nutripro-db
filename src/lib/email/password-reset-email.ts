import 'server-only'

import nodemailer from 'nodemailer'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] || character)
}

export async function sendPasswordResetEmail({ email, name, resetUrl }: { email: string; name: string; resetUrl: string }) {
  const smtpFrom = process.env.SMTP_FROM || 'info@evavidalnutricion.com'
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465
  if (!smtpFrom || !smtpUser || !smtpPass || !smtpHost) {
    throw new Error('El servicio de correo no está configurado.')
  }

  const safeName = escapeHtml(name || 'profesional')
  const safeUrl = escapeHtml(resetUrl)
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  await transporter.sendMail({
    from: `"Eva Vidal Nutrición" <${smtpFrom}>`,
    replyTo: smtpFrom,
    to: email,
    subject: 'Restablece tu contraseña · Eva Vidal Nutrición',
    text: `Hola ${name || ''},\n\nHemos recibido una solicitud para restablecer tu contraseña en Eva Vidal Nutrición. Usa este enlace de un solo uso (válido durante 30 minutos):\n${resetUrl}\n\nSi no lo has solicitado, puedes ignorar este correo de forma segura.`,
    html: `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px; background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);">
          
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
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                      Restablecimiento de Contraseña
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #dc2626;">
                      Seguridad
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">
                Hola, ${safeName}:
              </p>

              <p style="line-height: 1.6; color: #334155; margin: 0 0 18px 0; font-size: 15px;">
                Hemos recibido una solicitud para cambiar tu contraseña de acceso a la plataforma de Eva Vidal Nutrición.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width: 26px; vertical-align: top;">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </td>
                        <td style="padding-left: 8px; font-size: 13px; color: #475569; line-height: 1.5;">
                          Por motivos de protección de tu expediente e historial clínico, este enlace es de uso único y caduca en <strong style="color: #0f172a;">30 minutos</strong>.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${safeUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
                  Definir Nueva Contraseña &rarr;
                </a>
              </div>

              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 22px 0;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${safeUrl}" style="color: #0284c7; word-break: break-all; text-decoration: underline;">${safeUrl}</a>
              </p>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 13px; color: #64748b; line-height: 1.5;">
                Si tú no has solicitado este cambio, puedes ignorar este mensaje: tu contraseña actual seguirá siendo la misma.
              </div>
            </td>
          </tr>

          <!-- RGPD Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.5; color: #94a3b8; text-align: center;">
              <p style="margin: 0;">
                Eva Vidal Nutrición &bull; Plataforma clínica segura bajo el Reglamento (UE) 2016/679 (RGPD).
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}

export async function sendPatientPortalWelcomeEmail({
  email,
  name,
  inviteUrl,
}: {
  email: string
  name: string
  inviteUrl: string
}) {
  const smtpFrom = process.env.SMTP_FROM || 'info@evavidalnutricion.com'
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465
  if (!smtpFrom || !smtpUser || !smtpPass || !smtpHost) {
    throw new Error('El servicio de correo no está configurado.')
  }

  const safeName = escapeHtml(name || 'Paciente')
  const safeEmail = escapeHtml(email)
  const safeUrl = escapeHtml(inviteUrl)
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  const emailSubject = 'Activa tu acceso al Portal del Paciente · Eva Vidal Nutrición'
  const plainText = `Hola ${name || 'Paciente'},\n\nEva Vidal ha creado tu acceso exclusivo al Portal del Paciente.\n\nPara activar tu cuenta y fijar tu contraseña de acceso, haz clic en el siguiente enlace seguro (válido durante 24 horas):\n${inviteUrl}\n\nTu usuario de acceso es: ${email}\n\nDesde el portal podrás revisar tus planes de alimentación, tus recetas detalladas, registrar tu evolución y consultar tus próximas citas.\n\nAtentamente,\nEva Vidal Nutrición\ninfo@evavidalnutricion.com`

  await transporter.sendMail({
    from: `"Eva Vidal · Nutrición Clínica" <${smtpFrom}>`,
    replyTo: smtpFrom,
    to: email,
    subject: emailSubject,
    text: plainText,
    html: `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso al Portal del Paciente</title>
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
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                      Bienvenido/a a tu Portal de Paciente
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #059669;">
                      Activación
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0;">
                Hola, ${safeName}:
              </p>
              
              <p style="line-height: 1.6; color: #334155; margin: 0 0 20px 0; font-size: 15px;">
                Eva Vidal ha habilitado tu acceso exclusivo al <strong>Portal del Paciente</strong>. Desde este espacio podrás consultar tu pauta nutricional interactiva, recetario clínico detallado, evolución antropométrica y próximas citas.
              </p>
              
              <!-- Tarjeta de Usuario con icono SVG -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 22px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width: 32px; vertical-align: middle;">
                          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 26px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 10px;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Tu Usuario de Acceso</div>
                          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 1px; word-break: break-all;">${safeEmail}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="line-height: 1.6; color: #334155; margin: 0 0 24px 0; font-size: 14px;">
                Para comenzar a utilizar tu cuenta, haz clic en el siguiente botón para <strong>establecer tu contraseña personal</strong>:
              </p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${safeUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
                  Definir mi Contraseña y Entrar &rarr;
                </a>
              </div>

              <!-- Aviso de seguridad con icono SVG -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 24px 0 0 0;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width: 24px; vertical-align: top;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </td>
                        <td style="padding-left: 8px; font-size: 12px; line-height: 1.5; color: #64748b;">
                          <strong style="color: #475569;">Seguridad y privacidad clínica:</strong> Por protección de tu historial de salud, este enlace es personal, intransferible y caduca en <strong>24 horas</strong>. Si necesitas asistencia, contacta en <a href="mailto:info@evavidalnutricion.com" style="color: #0284c7; font-weight: 600; text-decoration: none;">info@evavidalnutricion.com</a>.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="border-top: 1px solid #e2e8f0; margin-top: 26px; padding-top: 22px;">
                <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                  Atentamente,<br>
                  <strong style="color: #0f172a; font-size: 14px;">Eva Vidal</strong><br>
                  <span style="color: #0284c7; font-weight: 600;">Dietista &bull; Nutricionista Colegiada</span><br>
                  <span style="color: #64748b; font-size: 12px;">info@evavidalnutricion.com</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Pie de página RGPD -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
              <p style="margin: 0;">
                Eva Vidal Nutrición &bull; Portal seguro de salud conforme al Reglamento (UE) 2016/679 (RGPD).
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}
