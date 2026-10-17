import nodemailer from 'nodemailer'

interface SendAnamnesisEmailParams {
  patientName: string
  patientEmail: string
  accessToken: string
  professionalName?: string
  clinicName?: string
}

export function generateAnamnesisEmailHtml({
  patientName,
  anamnesisUrl,
  professionalName = 'Eva Vidal',
  clinicName = 'Consulta Nutricional Eva Vidal',
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
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f4f8; padding: 36px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.08); border: 1px solid #dbeafe;">
          
          <!-- Encabezado con gradiente azul clínico y logotipo oficial -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #1e40af 100%); padding: 38px 30px; text-align: center;">
              <span style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 14px; background: #ffffff; color: #0284c7; font-weight: 900; font-size: 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 12px;">EV</span>
              <br/>
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; display: inline-block;">
                ${clinicName}
              </span>
              <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 14px; font-weight: 500;">
                Cuestionario Clínico y Hábitos Nutricionales Pre-Consulta
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="font-size: 21px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">
                ¡Hola, ${firstName}!
              </h1>

              <p style="font-size: 15px; color: #475569; margin: 0 0 18px 0; line-height: 1.6;">
                Para preparar tu consulta nutricional y diseñar un plan 100% adaptado a tus gustos, horarios, digestiones y objetivos de salud, por favor completa tu <strong>cuestionario clínico pre-consulta</strong>.
              </p>

              <!-- Tarjeta informativa azul -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f9ff; border-radius: 16px; border: 1px solid #bae6fd; margin: 22px 0;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <strong style="color: #0369a1; font-size: 14px; display: block; margin-bottom: 8px;">
                      ⏱️ Te llevará solo entre 3 y 5 minutos:
                    </strong>
                    <ul style="margin: 0; padding-left: 20px; color: #0284c7; font-size: 13px; line-height: 1.6;">
                      <li style="margin-bottom: 5px;">Alimentos que te encantan y alimentos que rechazas</li>
                      <li style="margin-bottom: 5px;">Medicación habitual, patologías o alergias</li>
                      <li style="margin-bottom: 5px;">Salud digestiva (gases, hinchazón, reflujo)</li>
                      <li style="margin-bottom: 5px;">Horarios de comida, consumo de agua y ejercicio</li>
                      <li>Tus objetivos principales para esta consulta</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Botón Principal Azul -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${anamnesisUrl}" target="_blank" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 15px 36px; border-radius: 16px; box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35); text-align: center;">
                      ✍️ Rellenar Mi Cuestionario Ahora
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0 0 24px 0;">
                Si el botón no abre el enlace, copia y pega esta dirección en tu navegador:<br>
                <a href="${anamnesisUrl}" style="color: #0284c7; word-break: break-all; font-size: 12px; text-decoration: underline;">${anamnesisUrl}</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 26px 0;" />

              <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                Atentamente,<br>
                <strong style="color: #1e293b; font-size: 14px;">${professionalName}</strong><br>
                <span style="color: #0284c7; font-weight: 600;">${clinicName}</span><br>
                <span style="color: #64748b; font-size: 12px;">evavidalinfo@gmail.com</span>
              </p>
            </td>
          </tr>

          <!-- Pie de página RGPD y Confidencialidad -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0;">
                🔒 <strong>Confidencialidad Médica (RGPD):</strong> La información facilitada en este cuestionario es estrictamente confidencial y se usará únicamente para tu valoración nutricional.
              </p>
              <p style="margin: 0;">
                Este correo fue enviado de forma automática desde la plataforma clínica EVSoftware.
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
  accessToken,
  professionalName = 'Eva Vidal',
  clinicName = 'Consulta Nutricional Eva Vidal',
}: SendAnamnesisEmailParams): Promise<{
  success: boolean
  message: string
  anamnesisUrl: string
  mailtoUrl: string
}> {
  const resolvedBaseUrl =
    process.env.APP_PUBLIC_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    process.env.NEXTAUTH_URL ||
    'https://evavidalnutricion.es'

  const anamnesisUrl = `${resolvedBaseUrl}/anamnesis?token=${encodeURIComponent(accessToken)}`

  const emailSubject = `Cuestionario Clínico Pre-Consulta - ${clinicName}`
  const emailHtml = generateAnamnesisEmailHtml({
    patientName,
    anamnesisUrl,
    professionalName,
    clinicName,
  })

  const plainText = `Hola ${patientName.split(' ')[0]},\n\nPara preparar tu consulta nutricional y diseñar un menú personalizado adaptado a tus gustos y necesidades, por favor completa tu cuestionario previo en el siguiente enlace:\n\n${anamnesisUrl}\n\nSolo te llevará 3 minutos y nos ayudará a preparar tu pauta.\n\nAtentamente,\n${professionalName}\n${clinicName}\nevavidalinfo@gmail.com`

  const mailtoUrl = `mailto:${encodeURIComponent(patientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainText)}`

  // El correo de remitente oficial siempre es evavidalinfo@gmail.com
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587

  if (!smtpFrom || !smtpUser || !smtpPass || !smtpHost) {
    return { success: false, message: 'Falta configuración del servicio de correo.', anamnesisUrl, mailtoUrl }
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

    const { logEmailSent } = await import('./log-email')
    await logEmailSent({
      recipientEmail: patientEmail,
      recipientName: patientName,
      subject: emailSubject,
      type: 'ANAMNESIS',
      status: 'SENT',
    })

    return {
      success: true,
      message: `Cuestionario enviado automáticamente con éxito a ${patientEmail} desde ${smtpFrom}`,
      anamnesisUrl,
      mailtoUrl,
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error)
    console.error('Error al enviar correo vía SMTP:', error)
    try {
      const { logEmailSent } = await import('./log-email')
      await logEmailSent({
        recipientEmail: patientEmail,
        recipientName: patientName,
        subject: emailSubject,
        type: 'ANAMNESIS',
        status: 'FAILED',
        errorDetails: errMessage,
      })
    } catch {}

    return {
      success: false,
      message: `Error de conexión con el servidor de correo: ${errMessage}. Puedes usar el botón de cliente de correo o compartir el enlace.`,
      anamnesisUrl,
      mailtoUrl,
    }
  }
}
