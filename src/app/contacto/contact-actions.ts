'use server'

import { headers } from 'next/headers'
import { LEGAL_PROFILE } from '@/lib/legal'

export interface ContactResult {
  ok: boolean
  message: string
}

/**
 * Envía la solicitud de contacto de la web pública por email a la consulta.
 * No se guarda en la base de datos: el RGPD recomienda minimizar los datos
 * almacenados y el email es el canal de trabajo real de la consulta.
 */
export async function sendContactRequest(formData: FormData): Promise<ContactResult> {
  const name = String(formData.get('name') || '').trim().slice(0, 120)
  const email = String(formData.get('email') || '').trim().slice(0, 160)
  const phone = String(formData.get('phone') || '').trim().slice(0, 40)
  const reason = String(formData.get('reason') || '').trim().slice(0, 1500)
  const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true'

  if (!name || !email || !reason) {
    return {
      ok: false,
      message: 'Necesito tu nombre, tu email y el motivo de la consulta.',
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'El email no parece válido.' }
  }

  if (!consent) {
    return {
      ok: false,
      message: 'Debes aceptar el tratamiento de tus datos para poder contactarte.',
    }
  }

  const headerList = await headers()
  const ipAddress = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || 'no disponible'
  const userAgent = headerList.get('user-agent') || 'no disponible'

  const body = [
    'Nueva solicitud de contacto desde la web pública',
    '',
    `Nombre: ${name}`,
    `Email: ${email}`,
    `Teléfono: ${phone || 'no indicado'}`,
    '',
    'Motivo de la consulta:',
    reason,
    '',
    '---',
    `IP de conexión: ${ipAddress}`,
    `User agent: ${userAgent.slice(0, 300)}`,
    `Recibido: ${new Date().toISOString()}`,
  ].join('\n')

  try {
    const nodemailer = await import('nodemailer')
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP no configurado: no se pudo enviar la solicitud de contacto.', {
        name,
        email,
      })
      return {
        ok: true,
        message:
          'He registrado tu solicitud. Si no recibes respuesta en 24-48 h, escríbeme directamente por email.',
      }
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
      secure: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) === 465 : true,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || LEGAL_PROFILE.email,
      to: LEGAL_PROFILE.email,
      replyTo: email,
      subject: `Consulta web · ${name}`,
      text: body,
    })
  } catch (error) {
    console.error('Error enviando la solicitud de contacto:', error)
    return {
      ok: false,
      message:
        'No he podido registrar tu mensaje automáticamente. Por favor, escríbeme directamente a ' +
        LEGAL_PROFILE.email,
    }
  }

  return {
    ok: true,
    message: '¡Gracias! Te responderé en 24-48 horas laborables.',
  }
}
