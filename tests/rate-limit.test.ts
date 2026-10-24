import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    rateLimitCounter: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { consumeRateLimit, rateLimitKey } from '@/lib/rate-limit'

const queryRaw = prisma.$queryRaw as unknown as ReturnType<typeof vi.fn>

describe('limitación de frecuencia', () => {
  beforeEach(() => {
    queryRaw.mockReset()
    vi.spyOn(Math, 'random').mockReturnValue(1)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('permite los intentos dentro del límite', async () => {
    queryRaw.mockResolvedValueOnce([{ count: 2, windowStart: new Date() }])
    const result = await consumeRateLimit({ key: 'login:a@b.c', limit: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(3)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('bloquea cuando se supera el límite', async () => {
    queryRaw.mockResolvedValueOnce([{ count: 6, windowStart: new Date() }])
    const result = await consumeRateLimit({ key: 'login:a@b.c', limit: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('falla abierto por defecto si la base de datos no responde', async () => {
    queryRaw.mockRejectedValueOnce(new Error('db down'))
    const result = await consumeRateLimit({ key: 'login:a@b.c', limit: 5, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
  })

  it('falla cerrado cuando la operación es sensible y así se solicita', async () => {
    queryRaw.mockRejectedValueOnce(new Error('db down'))
    const result = await consumeRateLimit({
      key: 'reset:a@b.c',
      limit: 5,
      windowMs: 60_000,
      failClosed: true,
    })
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBe(60)
  })

  it('normaliza y anonimiza la clave para no duplicar contadores ni guardar el correo en claro', () => {
    const key = rateLimitKey(' Login ', '  A@B.C  ')
    expect(key.startsWith('login:')).toBe(true)
    expect(key).toBe(rateLimitKey('login', 'a@b.c'))
    expect(key).not.toContain('a@b.c')
  })
})
