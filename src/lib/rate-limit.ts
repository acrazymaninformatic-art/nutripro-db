import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
  /** Si la base de datos falla, permite la operación (por defecto) o la bloquea. */
  failClosed?: boolean
}

/**
 * Contador atómico en PostgreSQL. Sirve para limitar intentos de login,
 * restablecimiento de contraseña y envíos públicos. La ventana se reinicia
 * de forma perezosa, sin necesidad de un cron.
 */
export async function consumeRateLimit({
  key,
  limit,
  windowMs,
  failClosed = false,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - windowMs)
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; windowStart: Date }>>`
      INSERT INTO "RateLimitCounter" ("key", "windowStart", "count", "updatedAt")
      VALUES (${key}, ${now}, 1, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitCounter"."windowStart" <= ${cutoff} THEN 1
          ELSE "RateLimitCounter"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimitCounter"."windowStart" <= ${cutoff} THEN ${now}
          ELSE "RateLimitCounter"."windowStart"
        END,
        "updatedAt" = ${now}
      RETURNING "count", "windowStart"
    `
    const row = rows[0]
    const count = Number(row?.count || 1)
    const windowStart = row?.windowStart ? new Date(row.windowStart) : now
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)
    )

    if (Math.random() < 0.01) {
      prisma.rateLimitCounter
        .deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } })
        .catch(() => undefined)
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds,
    }
  } catch (error) {
    console.error('Rate limit no disponible:', error)
    return failClosed
      ? { allowed: false, remaining: 0, retryAfterSeconds: 60 }
      : { allowed: true, remaining: limit, retryAfterSeconds: 0 }
  }
}

export function rateLimitKey(scope: string, identifier: string): string {
  // El contador no necesita el correo/IP en claro: se guarda un hash estable
  // para minimizar datos personales en la base de datos.
  const normalizedScope = scope.trim().toLowerCase()
  const normalizedIdentifier = identifier.trim().toLowerCase().slice(0, 180)
  const identifierHash = createHash('sha256').update(normalizedIdentifier).digest('hex')
  return `${normalizedScope}:${identifierHash}`
}
