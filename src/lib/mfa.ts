import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Implementación mínima y auditables de TOTP (RFC 6238) para el segundo factor
 * de la cuenta de administración. No depende de servicios externos: el secreto
 * nunca sale del servidor salvo durante el alta inicial, cuando se muestra una
 * única vez a la profesional para vincularlo a su aplicación autenticadora.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_PERIOD_SECONDS = 30
const TOTP_DIGITS = 6
const TOTP_WINDOW = 1

function encodeBase32(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

function decodeBase32(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20))
}

function hotp(secret: string, counter: number): string {
  const key = decodeBase32(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac('sha1', key).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0')
}

export function generateTotp(secret: string, at: number = Date.now()): string {
  return hotp(secret, Math.floor(at / 1000 / TOTP_PERIOD_SECONDS))
}

export function verifyTotp(secret: string, token: string, at: number = Date.now()): boolean {
  const normalized = token.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalized)) return false
  const counter = Math.floor(at / 1000 / TOTP_PERIOD_SECONDS)
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const expected = hotp(secret, counter + offset)
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) return true
  }
  return false
}

export function buildOtpAuthUri(secret: string, accountName: string, issuer = 'EVSoftware'): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

function mfaEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 24) {
    throw new Error('AUTH_SECRET no está configurado para cifrar el secreto MFA.')
  }
  return createHash('sha256').update(`mfa:${secret}`).digest()
}

/**
 * Cifra el secreto TOTP antes de guardarlo. Así una copia de la base de datos
 * no permite generar códigos válidos sin la clave de la aplicación.
 */
export function encryptMfaSecret(secret: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', mfaEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.')
}

/**
 * Devuelve el secreto en claro. Los valores sin prefijo `v1.` se aceptan como
 * legado para no romper una instalación que ya tuviera MFA configurado.
 */
export function decryptMfaSecret(stored: string | null | undefined): string | null {
  if (!stored) return null
  if (!stored.startsWith('v1.')) return stored
  try {
    const [version, ivValue, tagValue, encryptedValue] = stored.split('.')
    if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) return null
    const decipher = createDecipheriv(
      'aes-256-gcm',
      mfaEncryptionKey(),
      Buffer.from(ivValue, 'base64url')
    )
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return null
  }
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = []
  for (let index = 0; index < count; index += 1) {
    // 80 bits de entropía por código; se muestran en cuatro bloques de 5.
    const raw = randomBytes(10).toString('hex').toUpperCase()
    codes.push(raw.match(/.{5}/g)!.join('-'))
  }
  return codes
}

export function verifyRecoveryCode(code: string, storedHashesJson: string | null | undefined): boolean {
  if (!storedHashesJson) return false
  try {
    const hashes = JSON.parse(storedHashesJson)
    if (!Array.isArray(hashes)) return false
    const candidate = hashRecoveryCode(code)
    return hashes.some((hash) => typeof hash === 'string' && timingSafeEqual(Buffer.from(hash), Buffer.from(candidate)))
  } catch {
    return false
  }
}

export function consumeRecoveryCode(code: string, storedHashesJson: string | null | undefined): string | null {
  if (!storedHashesJson) return null
  try {
    const hashes = JSON.parse(storedHashesJson)
    if (!Array.isArray(hashes)) return null
    const candidate = hashRecoveryCode(code)
    const remaining = hashes.filter((hash) => typeof hash === 'string' && hash !== candidate)
    if (remaining.length === hashes.length) return null
    return JSON.stringify(remaining)
  } catch {
    return null
  }
}
