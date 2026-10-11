import nodemailer from 'nodemailer'

interface SendAnamnesisEmailParams {
  patientName: string
  patientEmail: string
  patientId: string
  professionalName?: string
  clinicName?: string
  baseUrl?: string
}

export function generateAnamnesisEmailHtml({
  patientName,
  anamnesisUrl,
  professionalName = 'Tu Especialista en Nutrición',
  clinicName = 'Consulta NutriPro',
}: {
  patientName: string
  anamnesisUrl: string
  professionalName?: string
  clinicName?: string
}) {
  const firstName = patientName.split(' ')[0]

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuestionario Pre-Consulta de Nutrición</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Encabezado con gradiente verde médico -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 36px 30px; text-align: center;">
              <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; display: inline-block;">
                🥗 ${clinicName}
              </span>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px; font-weight: 500;">
                Cuestionario Clínico y Hábitos Nutricionales Pre-Consulta
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px 30px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">
                ¡Hola, ${firstName}!
              </h1>

              <p style="font-size: 15px; color: #475569; margin: 0 0 16px 0;">
                Para preparar tu consulta nutricional personalizada y diseñar un plan 100% adaptado a tus gustos, horarios y necesidades de salud, te invitamos a completar tu <strong>cuestionario clínico pre-consulta</strong>.
              </p>

              <!-- Tarjeta informativa -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 14px; border: 1px solid #bbf7d0; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <strong style="color: #166534; font-size: 14px; display: block; margin-bottom: 6px;">
                      ⏱️ Solo te llevará entre 3 y 5 minutos:
                    </strong>
                    <ul style="margin: 0; padding-left: 20px; color: #15803d; font-size: 13px;">
                      <li style="margin-bottom: 4px;">Alimentos que te encantan y alimentos que rechazas</li>
                      <li style="margin-bottom: 4px;">Alergias, intolerancias o patologías previas</li>
                      <li style="margin-bottom: 4px;">Horarios de comida y consumo de agua</li>
                      <li>Tus objetivos principales para esta etapa</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Botón Principal -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${anamnesisUrl}" target="_blank" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.35); text-align: center;">
                      ✍️ Rellenar Mi Cuestionario Ahora
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0 0 20px 0;">
                Si el botón no funciona en tu dispositivo, copia y pega el siguiente enlace en tu navegador:<br>
                <a href="${anamnesisUrl}" style="color: #059669; word-break: break-all; font-size: 12px;">${anamnesisUrl}</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="font-size: 13px; color: #64748b; margin: 0;">
                Atentamente,<br>
                <strong style="color: #1e293b;">${professionalName}</strong><br>
                <span style="color: #059669; font-weight: 600;">${clinicName}</span>
              </p>
            </td>
          </tr>

          <!-- Pie de página RGPD -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0;">
                🔒 <strong>Confidencialidad Médica (RGPD):</strong> La información introducida en este cuestionario será tratada de forma estrictamente confidencial exclusivamente para fines de evaluación dietética y clínica.
              </p>
              <p style="margin: 0;">
                Este correo fue enviado de forma automática por el sistema de gestión clínica NutriPro.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function sendAnamnesisEmail({
  patientName,
  patientEmail,
  patientId,
  professionalName = 'Tu Especialista en Nutrición',
  clinicName = 'Consulta NutriPro',
  baseUrl,
}: SendAnamnesisEmailParams): Promise<{
  success: boolean
  message: string
  anamnesisUrl: string
  mailtoUrl: string
}> {
  const resolvedBaseUrl =
    baseUrl ||
    process.env.APP_PUBLIC_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  const anamnesisUrl = `${resolvedBaseUrl}/anamnesis?patientId=${patientId}`

  const emailSubject = `Cuestionario Clínico Pre-Consulta - ${clinicName}`
  const emailHtml = generateAnamnesisEmailHtml({
    patientName,
    anamnesisUrl,
    professionalName,
    clinicName,
  })

  const plainText = `Hola ${patientName.split(' ')[0]},\n\nPara preparar tu consulta nutricional y diseñar un menú personalizado adaptado a tus gustos y necesidades, por favor completa tu cuestionario previo en el siguiente enlace:\n\n${anamnesisUrl}\n\nSolo te llevará 3 minutos y nos ayudará a aprovechar al máximo tu sesión.\n\nAtentamente,\n${professionalName}\n${clinicName}`

  // Generar URL mailto de respaldo directo
  const mailtoUrl = `mailto:${encodeURIComponent(patientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainText)}`

  // Comprobar si hay credenciales SMTP configuradas en variables de entorno
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'consulta@nutripro.local'

  if (!smtpUser || !smtpPass) {
    // Modo sin SMTP configurado todavía
    return {
      success: false,
      message: 'Credenciales SMTP no configuradas aún en el archivo de entorno (.env). Puedes abrir tu gestor de correo predeterminado con el botón de respaldo o configurar tu cuenta de Gmail/Outlook para envíos 100% automáticos.',
      anamnesisUrl,
      mailtoUrl,
    }
  }

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
    })

    return {
      success: true,
      message: `Cuestionario enviado automáticamente con éxito a ${patientEmail}`,
      anamnesisUrl,
      mailtoUrl,
    }
  } catch (error: any) {
    console.error('Error al enviar correo vía SMTP:', error)
    return {
      success: false,
      message: `Error de conexión con el servidor de correo: ${error?.message || 'Error desconocido'}. Puedes usar el enlace directo o el cliente de correo.`,
      anamnesisUrl,
      mailtoUrl,
    }
  }
}
