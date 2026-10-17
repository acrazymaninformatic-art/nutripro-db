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
                      Cuestionario Clínico Pre-Consulta
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #0284c7;">
                      Pauta Inicial
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

              <p style="font-size: 15px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;">
                Para preparar tu consulta nutricional y diseñar una pauta 100% personalizada y adaptada a tus ritmos, gustos, digestiones y objetivos de salud, por favor completa tu <strong>cuestionario clínico previo</strong>.
              </p>

              <!-- Tarjeta de información con icono SVG -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                      <tr>
                        <td style="width: 28px; vertical-align: middle;">
                          <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #e0f2fe; text-align: center; line-height: 24px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </div>
                        </td>
                        <td style="padding-left: 8px; vertical-align: middle;">
                          <strong style="color: #0369a1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Duración estimada: 3 a 5 minutos
                          </strong>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; line-height: 1.7;">
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Preferencias, intolerancias y aversiones alimentarias</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Medicación habitual, patologías o analíticas recientes</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Salud digestiva (hinchazón, reflujo, regularidad)</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td style="padding-bottom: 6px;">Horarios diarios, actividad física y ritmos de vida</td>
                      </tr>
                      <tr>
                        <td style="width: 18px; vertical-align: top; padding-top: 4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </td>
                        <td>Tus objetivos primordiales para la consulta</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón Principal Clínico -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${anamnesisUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); text-align: center;">
                      Completar Cuestionario Clínico &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0 0 24px 0; line-height: 1.5;">
                Si el botón no abre el formulario, accede directamente mediante este enlace:<br>
                <a href="${anamnesisUrl}" style="color: #0284c7; word-break: break-all; font-size: 12px; text-decoration: underline;">${anamnesisUrl}</a>
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

          <!-- Pie de página RGPD y Confidencialidad -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
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
                La información clínica recogida en este cuestionario es estrictamente confidencial bajo el Reglamento (UE) 2016/679 (RGPD) y se utilizará exclusivamente para tu plan nutricional personalizado.
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

  const plainText = `Hola ${patientName.split(' ')[0]},\n\nPara preparar tu consulta nutricional y diseñar un menú personalizado adaptado a tus gustos y necesidades, por favor completa tu cuestionario previo en el siguiente enlace:\n\n${anamnesisUrl}\n\nSolo te llevará 3 minutos y nos ayudará a preparar tu pauta.\n\nAtentamente,\n${professionalName}\n${clinicName}\ninfo@evavidalnutricion.com`

  const mailtoUrl = `mailto:${encodeURIComponent(patientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainText)}`

  // El correo de remitente oficial siempre es info@evavidalnutricion.com
  const smtpFrom = process.env.SMTP_FROM || 'info@evavidalnutricion.com'
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465

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
      replyTo: smtpFrom,
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
