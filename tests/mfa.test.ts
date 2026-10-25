import { beforeAll, describe, expect, it } from 'vitest'
import {
  buildOtpAuthUri,
  consumeRecoveryCode,
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  generateTotp,
  hashRecoveryCode,
  verifyRecoveryCode,
  verifyTotp,
} from '@/lib/mfa'

// RFC 6238, Apéndice B (SHA-1, secreto ASCII "12345678901234567890").
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-with-enough-entropy-1234567890'
})

describe('TOTP', () => {
  it('coincide con los vectores de prueba de la RFC 6238', () => {
    expect(generateTotp(RFC_SECRET, 59_000)).toBe('287082')
    expect(generateTotp(RFC_SECRET, 1_111_111_109_000)).toBe('081804')
    expect(generateTotp(RFC_SECRET, 1_111_111_111_000)).toBe('050471')
    expect(generateTotp(RFC_SECRET, 1_234_567_890_000)).toBe('005924')
    expect(generateTotp(RFC_SECRET, 2_000_000_000_000)).toBe('279037')
    expect(generateTotp(RFC_SECRET, 20_000_000_000_000)).toBe('353130')
  })

  it('acepta el código actual y el margen de un periodo', () => {
    const now = 1_700_000_000_000
    const code = generateTotp(RFC_SECRET, now)
    expect(verifyTotp(RFC_SECRET, code, now)).toBe(true)
    expect(verifyTotp(RFC_SECRET, code, now + 30_000)).toBe(true)
    expect(verifyTotp(RFC_SECRET, code, now + 120_000)).toBe(false)
  })

  it('rechaza códigos con formato inválido', () => {
    expect(verifyTotp(RFC_SECRET, '12345', 59_000)).toBe(false)
    expect(verifyTotp(RFC_SECRET, 'abcdef', 59_000)).toBe(false)
    expect(verifyTotp(RFC_SECRET, '', 59_000)).toBe(false)
  })

  it('genera URIs otpauth válidas sin filtrar el secreto en la etiqueta', () => {
    const uri = buildOtpAuthUri('JBSWY3DPEHPK3PXP', 'info@evavidalnutricion.com')
    expect(uri).toContain('otpauth://totp/')
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
    expect(uri).toContain('issuer=EVSoftware')
  })
})

describe('códigos de recuperación', () => {
  it('genera códigos de 80 bits en formato 5-5', () => {
    const codes = generateRecoveryCodes(4)
    expect(codes).toHaveLength(4)
    for (const code of codes) {
      expect(code).toMatch(/^[A-F0-9]{5}(?:-[A-F0-9]{5}){3}$/)
    }
    expect(new Set(codes).size).toBe(4)
  })

  it('verifica y consume un código una sola vez', () => {
    const [code] = generateRecoveryCodes(1)
    const hashes = JSON.stringify([hashRecoveryCode(code)])

    expect(verifyRecoveryCode(code, hashes)).toBe(true)
    expect(verifyRecoveryCode('AAAAA-AAAAA', hashes)).toBe(false)

    const remaining = consumeRecoveryCode(code, hashes)
    expect(remaining).not.toBeNull()
    expect(verifyRecoveryCode(code, remaining)).toBe(false)
    expect(consumeRecoveryCode(code, remaining)).toBeNull()
  })
})

describe('cifrado del secreto MFA', () => {
  it('cifra y descifra sin guardar el secreto en claro', () => {
    const encrypted = encryptMfaSecret(RFC_SECRET)
    expect(encrypted.startsWith('v1.')).toBe(true)
    expect(encrypted).not.toContain(RFC_SECRET)
    expect(decryptMfaSecret(encrypted)).toBe(RFC_SECRET)
  })

  it('rechaza un valor cifrado manipulado', () => {
    const encrypted = encryptMfaSecret(RFC_SECRET)
    const parts = encrypted.split('.')
    const tamperedCiphertext = (parts[3][0] === 'A' ? 'B' : 'A') + parts[3].slice(1)
    const tampered = [parts[0], parts[1], parts[2], tamperedCiphertext].join('.')
    expect(decryptMfaSecret(tampered)).toBeNull()
  })

  it('mantiene compatibilidad con secretos antiguos en claro', () => {
    expect(decryptMfaSecret(RFC_SECRET)).toBe(RFC_SECRET)
    expect(decryptMfaSecret(null)).toBeNull()
  })
})
