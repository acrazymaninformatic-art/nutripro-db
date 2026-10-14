'use server'

import { requestPasswordResetForEmail } from '@/lib/password-reset'

export interface ForgotPasswordState { success?: string; error?: string }

export async function requestPasswordReset(_previousState: ForgotPasswordState | undefined, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') || '').trim()
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { error: 'Introduce un correo electrónico válido.' }
  await requestPasswordResetForEmail(email)
  return { success: 'Si el correo corresponde a una cuenta, recibirás un enlace de un solo uso. Revisa también la carpeta de spam.' }
}
