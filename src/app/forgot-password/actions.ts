'use server'

import { headers } from 'next/headers'
import { requestPasswordResetForEmail } from '@/lib/password-reset'
import { getForwardedClientAddress } from '@/lib/legal'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'

export interface ForgotPasswordState { success?: string; error?: string }

const GENERIC_SUCCESS =
  'Si el correo corresponde a una cuenta, recibirás un enlace de un solo uso. Revisa también la carpeta de spam.'

export async function requestPasswordReset(_previousState: ForgotPasswordState | undefined, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return { error: 'Introduce un correo electrónico válido.' }
  }

  const headerList = await headers()
  const ip = getForwardedClientAddress(
    headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')
  )
  const [ipLimit, emailLimit] = await Promise.all([
    consumeRateLimit({
      key: rateLimitKey('forgot-password-ip', ip),
      limit: 5,
      windowMs: 15 * 60 * 1000,
      failClosed: true,
    }),
    consumeRateLimit({
      key: rateLimitKey('forgot-password-email', email),
      limit: 3,
      windowMs: 60 * 60 * 1000,
      failClosed: false,
    }),
  ])

  // Respuesta genérica también cuando se alcanza el límite: no revela si la
  // cuenta existe ni permite usar el formulario como oráculo de enumeración.
  if (ipLimit.allowed && emailLimit.allowed) {
    await requestPasswordResetForEmail(email)
  }
  return { success: GENERIC_SUCCESS }
}
