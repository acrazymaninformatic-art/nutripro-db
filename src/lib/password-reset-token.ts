import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

const RESET_TTL_MS = 30 * 60 * 1000

export function createPasswordResetToken() {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    hash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  }
}

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function getPublicAppUrl() {
  const configured = process.env.APP_PUBLIC_URL || process.env.NEXTAUTH_URL
  if (configured) return configured.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  return 'http://localhost:3000'
}
