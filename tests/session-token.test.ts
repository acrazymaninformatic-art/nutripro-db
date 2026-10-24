import { beforeAll, describe, expect, it } from 'vitest'
import {
  createSessionTokenPayload,
  signSessionPayload,
  verifySessionToken,
  type SessionPayload,
} from '@/lib/session-token'

const payload: SessionPayload = {
  userId: 'user-1',
  role: 'ADMIN',
  email: 'info@evavidalnutricion.com',
  patientId: null,
  sessionVersion: 4,
}

describe('token de sesión firmado', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = 'test-secret-with-enough-entropy-1234567890'
  })

  it('conserva la versión de credenciales al verificar', () => {
    const body = createSessionTokenPayload(payload, 60)
    const token = `${body}.${signSessionPayload(body)}`
    const verified = verifySessionToken(token)
    expect(verified?.userId).toBe('user-1')
    expect(verified?.sessionVersion).toBe(4)
  })

  it('rechaza un token manipulado', () => {
    const body = createSessionTokenPayload(payload, 60)
    const signature = signSessionPayload(body)
    const tampered = `${body}.${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`
    expect(verifySessionToken(tampered)).toBeNull()
  })

  it('rechaza un token caducado', () => {
    const body = createSessionTokenPayload(payload, -1)
    const token = `${body}.${signSessionPayload(body)}`
    expect(verifySessionToken(token)).toBeNull()
  })

  it('rechaza tokens sin firma o vacíos', () => {
    expect(verifySessionToken(undefined)).toBeNull()
    expect(verifySessionToken('')).toBeNull()
    expect(verifySessionToken('solo-payload')).toBeNull()
  })
})
