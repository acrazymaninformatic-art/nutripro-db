import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

export function createSecureLinkToken(ttlMs: number) {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashSecureLinkToken(token), expiresAt: new Date(Date.now() + ttlMs) }
}

export function hashSecureLinkToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
