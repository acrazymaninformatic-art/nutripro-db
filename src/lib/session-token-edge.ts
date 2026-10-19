/**
 * Edge-safe session verification used by Next's request proxy.
 * Keep this file free of Node.js imports so static assets and redirects work
 * on Edge runtimes as well as in local development.
 */

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 24) throw new Error('AUTH_SECRET no está configurado correctamente.')
  return secret
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function signPayload(payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return encodeBase64Url(new Uint8Array(signature))
}

function constantTimeStringEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length)
  let difference = left.length ^ right.length
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }
  return difference === 0
}

export async function verifySessionTokenEdge(token: string | undefined) {
  if (!token) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  if (!constantTimeStringEqual(await signPayload(payload), signature)) return false

  try {
    const parsed = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as {
      userId?: string
      expiresAt?: number
    }
    return Boolean(parsed.userId && parsed.expiresAt && parsed.expiresAt > Date.now())
  } catch {
    return false
  }
}
