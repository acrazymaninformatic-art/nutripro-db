import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  isPrivateStorageKey,
  privateFileHref,
  stripPrivatePrefix,
} from '@/lib/storage/private-file-url'
import { validatePrivateObjectKey } from '@/lib/storage/private-storage'

describe('referencias a archivos privados', () => {
  it('convierte claves privadas en rutas autenticadas con segmentos codificados', () => {
    const key = 'private://documents/123e4567-e89b-12d3-a456-426614174000/informe final.pdf'
    expect(privateFileHref(key)).toBe(
      '/api/private-files/documents/123e4567-e89b-12d3-a456-426614174000/informe%20final.pdf'
    )
  })

  it('no sirve URLs heredadas y reconoce el prefijo privado', () => {
    expect(privateFileHref('https://example.com/legacy.pdf')).toBe('')
    expect(isPrivateStorageKey('private://photos/patient/photo.jpg')).toBe(true)
    expect(isPrivateStorageKey('https://example.com/photo.jpg')).toBe(false)
    expect(stripPrivatePrefix('private://photos/patient/photo.jpg')).toBe('photos/patient/photo.jpg')
  })

  it('solo admite claves con categoría, paciente y nombre de archivo seguros', () => {
    const patientId = '123e4567-e89b-12d3-a456-426614174000'
    expect(validatePrivateObjectKey(`documents/${patientId}/informe.pdf`)).toBe(true)
    expect(validatePrivateObjectKey(`photos/${patientId}/foto.jpg`)).toBe(true)

    expect(validatePrivateObjectKey(`documents/../${patientId}/informe.pdf`)).toBe(false)
    expect(validatePrivateObjectKey(`documents/${patientId}/../secreto.pdf`)).toBe(false)
    expect(validatePrivateObjectKey(`documents/${patientId}/..`)).toBe(false)
    expect(validatePrivateObjectKey(`photos/${patientId}/.`)).toBe(false)
    expect(validatePrivateObjectKey(`documents/${patientId}/informe.pdf.exe`)).toBe(true)
    expect(validatePrivateObjectKey(`documents/${patientId}/`)).toBe(false)
    expect(validatePrivateObjectKey(`otros/${patientId}/informe.pdf`)).toBe(false)
    expect(validatePrivateObjectKey(`documents/corto/informe.pdf`)).toBe(false)
  })
})
