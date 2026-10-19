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

export interface SessionPayload {
  userId: string
  role?: string
  email?: string
  patientId?: string | null
}

export function createSessionTokenPayload(data: SessionPayload, ttlSeconds = SESSION_TTL_SECONDS): string {
  const expiresAt = Date.now() + ttlSeconds * 1000
  return Buffer.from(JSON.stringify({ ...data, expiresAt }), 'utf8').toString('base64url')
}

export function verifySessionToken(token: string | undefined): (SessionPayload & { expiresAt: number }) | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  // Constant-time comparison: always compare equal-length buffers to prevent timing attacks.
  // HMAC-SHA256 output is fixed-length (32 bytes -> 44 base64url chars), so pad shorter buffers.
  const expected = Buffer.from(signSessionPayload(payload))
  const received = Buffer.from(signature)
  const len = Math.max(expected.length, received.length)
  const expectedPadded = Buffer.alloc(len, 0)
  const receivedPadded = Buffer.alloc(len, 0)
  expected.copy(expectedPadded)
  received.copy(receivedPadded)
  if (!timingSafeEqual(expectedPadded, receivedPadded)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload & { expiresAt?: number }
    if (!parsed.userId || !parsed.expiresAt || parsed.expiresAt <= Date.now()) return null
    return {
      userId: parsed.userId,
      role: parsed.role,
      email: parsed.email,
      patientId: parsed.patientId,
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

