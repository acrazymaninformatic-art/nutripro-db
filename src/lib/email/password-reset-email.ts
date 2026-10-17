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
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
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
    from: `"EVSoftware · Eva Vidal Nutrición" <${smtpFrom}>`,
    to: email,
    subject: 'Restablece tu contraseña · EVSoftware',
    text: `Hola ${name || ''},\n\nHemos recibido una solicitud para restablecer la contraseña de EVSoftware. Usa este enlace una sola vez dentro de 30 minutos:\n${resetUrl}\n\nSi no lo solicitaste, puedes ignorar este correo.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:36px 16px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #dbeafe;border-radius:24px;overflow:hidden"><tr><td style="padding:30px;background:linear-gradient(135deg,#0369a1,#1d4ed8);color:#fff"><div style="font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase">EVSoftware · Eva Vidal Nutrición</div><div style="font-size:24px;font-weight:800;margin-top:8px">Restablece tu contraseña</div></td></tr><tr><td style="padding:30px"><p style="font-size:16px">Hola, ${safeName}.</p><p style="line-height:1.6;color:#475569">Para proteger los expedientes clínicos, este enlace funciona una única vez y caduca en <strong>30 minutos</strong>.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Crear nueva contraseña</a></p><p style="font-size:13px;line-height:1.5;color:#64748b">Si no solicitaste este cambio, no hagas nada: tu contraseña seguirá igual. No reenvíes este enlace.</p></td></tr></table></td></tr></table></body></html>`,
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
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
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
    from: `"Eva Vidal · Consulta Nutricional" <${smtpFrom}>`,
    replyTo: smtpFrom,
    to: email,
    subject: emailSubject,
    text: plainText,
    html: `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acceso al Portal del Paciente</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:36px 16px;background:#f8fafc">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #dbeafe;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px rgba(2,132,199,0.06)">
          <tr>
            <td style="padding:34px 30px;background:linear-gradient(135deg,#0284c7,#1e40af);color:#ffffff;text-align:center">
              <div style="display:inline-block;width:52px;height:52px;line-height:52px;border-radius:14px;background:#ffffff;color:#0284c7;font-weight:900;font-size:20px;margin-bottom:12px">EV</div>
              <div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#bae6fd">Eva Vidal Nutrición · Portal Clínico</div>
              <div style="font-size:23px;font-weight:800;margin-top:6px;letter-spacing:-0.5px">Bienvenido/a a tu Portal de Paciente</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 30px">
              <p style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 16px 0">¡Hola, ${safeName}!</p>
              <p style="line-height:1.6;color:#475569;margin:0 0 18px 0;font-size:15px">
                Eva Vidal ha activado tu cuenta personal en el <strong>Portal del Paciente</strong>. Desde esta plataforma confidencial podrás consultar tu plan nutricional interactivo, recetas detalladas, registrar tu evolución, gestionar tus citas y completar cuestionarios de salud.
              </p>
              
              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:16px;padding:18px 20px;margin:22px 0">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px">Tu usuario de acceso</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#0c4a6e;word-break:break-all">${safeEmail}</p>
              </div>

              <p style="line-height:1.6;color:#475569;margin:0 0 24px 0;font-size:14px">
                Para empezar a utilizar tu cuenta, haz clic en el siguiente botón para <strong>definir tu contraseña de acceso personal</strong>:
              </p>

              <div style="text-align:center;margin:30px 0">
                <a href="${safeUrl}" style="display:inline-block;background:linear-gradient(135deg,#0284c7,#1e40af);color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:14px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(2,132,199,0.35)">
                  Crear mi contraseña y entrar →
                </a>
              </div>

              <div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:14px;padding:14px 16px;margin:24px 0 0 0">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#92400e">
                  <strong>🔒 Seguridad médica y privacidad:</strong> Por seguridad de tu historial clínico, este enlace es personal de un solo uso y caduca en <strong>24 horas</strong>. Si necesitas asistencia, contacta directamente con Eva en <a href="mailto:info@evavidalnutricion.com" style="color:#b45309;font-weight:600">info@evavidalnutricion.com</a>.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:12px">
              © Eva Vidal Nutrición · Portal Seguro de Salud conforme al RGPD
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
