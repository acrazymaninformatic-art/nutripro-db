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

export function createPortalInviteToken(hours = 24) {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    hash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
  }
}

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function getPublicAppUrl() {
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProd) return `https://${vercelProd.replace(/^https?:\/\//, '').replace(/\/$/, '')}`

  const configured = process.env.APP_PUBLIC_URL || process.env.NEXTAUTH_URL
  if (configured && !configured.includes('localhost')) {
    return configured.replace(/\/$/, '')
  }

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`

  if (configured) return configured.replace(/\/$/, '')

  return 'http://localhost:3000'
}
