import 'server-only'
import { createHash, randomBytes } from 'node:crypto'

export function createAnamnesisToken() {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    hash: createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
}

export function hashAnamnesisToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
