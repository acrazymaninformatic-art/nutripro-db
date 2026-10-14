import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'evsoftware_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 12

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 24) throw new Error('Configura AUTH_SECRET con al menos 24 caracteres aleatorios.')
  return secret
}

export function signSessionPayload(payload: string) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function verifySessionToken(token: string | undefined): { userId: string } | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = Buffer.from(signSessionPayload(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: string; expiresAt?: number }
    if (!parsed.userId || !parsed.expiresAt || parsed.expiresAt <= Date.now()) return null
    return { userId: parsed.userId }
  } catch {
    return null
  }
}
