import 'server-only'

import nodemailer from 'nodemailer'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] || character)
}

export async function sendPasswordResetEmail({ email, name, resetUrl }: { email: string; name: string; resetUrl: string }) {
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER
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
