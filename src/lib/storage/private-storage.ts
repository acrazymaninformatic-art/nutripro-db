import 'server-only'

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Almacenamiento privado de documentos y fotografías clínicas.
 *
 * - En producción usa Supabase Storage con un bucket privado y URLs firmadas
 *   de corta duración (service role solo en servidor).
 * - En desarrollo, si no hay credenciales, escribe fuera de `public/` y sirve
 *   los archivos mediante una ruta autenticada.
 *
 * La base de datos guarda una clave opaca `private://...`, nunca una URL
 * pública. Las URLs externas antiguas se conservan solo como legado.
 */

export type PrivateFileCategory = 'documents' | 'photos'

export interface SavedPrivateFile {
  storageKey: string
  fileName: string
  fileSizeKb: number
  mimeType: string
}

const MAX_FILE_BYTES = 15 * 1024 * 1024

const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

const EXTENSION_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXTENSIONS).map(([mime, extension]) => [extension, mime])
)

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

import {
  PRIVATE_FILE_PREFIX,
  isPrivateStorageKey,
  privateFileHref,
  stripPrivatePrefix,
} from '@/lib/storage/private-file-url'

export { PRIVATE_FILE_PREFIX, isPrivateStorageKey, privateFileHref, stripPrivatePrefix }

function storageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'patient-private'
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return { url, key }
}

function localBaseDir(): string {
  const configured = process.env.PRIVATE_UPLOAD_DIR?.trim()
  const base = configured || path.join(/* turbopackIgnore: true */ process.cwd(), '.private-uploads')
  return path.resolve(/* turbopackIgnore: true */ base)
}

export function validatePrivateObjectKey(objectKey: string): boolean {
  if (!/^(documents|photos)\/[a-zA-Z0-9-]{8,64}\/[a-zA-Z0-9._-]{1,160}$/.test(objectKey)) return false
  // Evita segmentos `.` o `..` que podrían resolver fuera de la carpeta del
  // paciente aunque el resto de la clave tenga el formato esperado.
  return objectKey.split('/').every((segment) => segment !== '.' && segment !== '..')
}

function safeOriginalName(name: string): string {
  return path.basename(name || 'archivo').replace(/[^\w.\- ()áéíóúüñÁÉÍÓÚÜÑ]/g, '_').slice(0, 180)
}

export async function savePrivateFile(input: {
  patientId: string
  category: PrivateFileCategory
  file: File
}): Promise<SavedPrivateFile> {
  const { patientId, category, file } = input
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(patientId)) throw new Error('Paciente no válido para almacenar el archivo.')
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('No se ha recibido ningún archivo.')
  if (file.size <= 0) throw new Error('El archivo está vacío.')
  if (file.size > MAX_FILE_BYTES) throw new Error('El archivo supera el máximo permitido de 15 MB.')

  const allowed = category === 'photos' ? PHOTO_MIME_TYPES : DOCUMENT_MIME_TYPES
  if (!allowed.has(file.type)) {
    throw new Error('Formato de archivo no permitido. Usa PDF, JPG, PNG, WEBP, HEIC, DOC o DOCX.')
  }

  const extension = MIME_EXTENSIONS[file.type] || 'bin'
  const objectKey = `${category}/${patientId}/${randomUUID()}.${extension}`
  if (!validatePrivateObjectKey(objectKey)) throw new Error('Clave de almacenamiento no válida.')

  const bytes = Buffer.from(await file.arrayBuffer())
  const supabase = supabaseConfig()

  if (supabase) {
    await uploadToSupabase(supabase, objectKey, bytes, file.type)
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'El almacenamiento privado no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en producción.'
      )
    }
    const target = path.join(/* turbopackIgnore: true */ localBaseDir(), ...objectKey.split('/'))
    const resolved = path.resolve(/* turbopackIgnore: true */ target)
    if (!resolved.startsWith(localBaseDir() + path.sep)) throw new Error('Ruta de almacenamiento no válida.')
    await mkdir(path.dirname(resolved), { recursive: true })
    await writeFile(resolved, bytes, { mode: 0o600 })
  }

  return {
    storageKey: `${PRIVATE_FILE_PREFIX}${objectKey}`,
    fileName: safeOriginalName(file.name),
    fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
    mimeType: file.type,
  }
}

async function uploadToSupabase(
  config: { url: string; key: string },
  objectKey: string,
  bytes: Buffer,
  contentType: string
) {
  const encodedPath = objectKey.split('/').map(encodeURIComponent).join('/')
  const endpoint = `${config.url}/storage/v1/object/${encodeURIComponent(storageBucket())}/${encodedPath}`
  const doUpload = () =>
    fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.key}`,
        apikey: config.key,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: new Uint8Array(bytes),
    })

  let response = await doUpload()
  if (response.status === 404) {
    const bucketResponse = await fetch(`${config.url}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.key}`,
        apikey: config.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: storageBucket(),
        name: storageBucket(),
        public: false,
        fileSizeLimit: MAX_FILE_BYTES,
        allowedMimeTypes: Array.from(DOCUMENT_MIME_TYPES),
      }),
    })
    if (!bucketResponse.ok && bucketResponse.status !== 409) {
      const detail = await bucketResponse.text()
      throw new Error(`No se pudo crear el bucket privado: ${detail.slice(0, 200)}`)
    }
    response = await doUpload()
  }

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`No se pudo subir el archivo al almacenamiento privado: ${detail.slice(0, 200)}`)
  }
}

export async function createSignedPrivateUrl(storageKey: string, expiresInSeconds = 60): Promise<string | null> {
  const supabase = supabaseConfig()
  if (!supabase || !isPrivateStorageKey(storageKey)) return null
  const objectKey = stripPrivatePrefix(storageKey)
  if (!validatePrivateObjectKey(objectKey)) return null
  const encodedPath = objectKey.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(
    `${supabase.url}/storage/v1/object/sign/${encodeURIComponent(storageBucket())}/${encodedPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabase.key}`,
        apikey: supabase.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: Math.min(3600, Math.max(10, expiresInSeconds)) }),
    }
  )
  if (!response.ok) {
    console.error('No se pudo firmar la URL privada:', await response.text())
    return null
  }
  const payload = (await response.json()) as { signedURL?: string }
  if (!payload.signedURL) return null
  if (payload.signedURL.startsWith('http')) return payload.signedURL
  return `${supabase.url}/storage/v1${payload.signedURL.startsWith('/') ? '' : '/'}${payload.signedURL}`
}

export async function readLocalPrivateFile(
  storageKey: string
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  if (!isPrivateStorageKey(storageKey)) return null
  const objectKey = stripPrivatePrefix(storageKey)
  if (!validatePrivateObjectKey(objectKey)) return null
  const target = path.resolve(/* turbopackIgnore: true */ localBaseDir(), ...objectKey.split('/'))
  if (!target.startsWith(localBaseDir() + path.sep)) return null
  try {
    const bytes = await readFile(target)
    const extension = path.extname(target).slice(1).toLowerCase()
    return { bytes, mimeType: EXTENSION_MIME[extension] || 'application/octet-stream' }
  } catch {
    return null
  }
}

/**
 * Borrado con propagación de errores. Se usa antes de eliminar metadatos o el
 * expediente para no dejar objetos clínicos huérfanos si el almacenamiento
 * falla. Un 404/ENOENT se considera éxito: el objeto ya no existe.
 */
export async function deletePrivateFileStrict(storageKey: string | null | undefined): Promise<void> {
  if (!storageKey || !isPrivateStorageKey(storageKey)) return
  const objectKey = stripPrivatePrefix(storageKey)
  if (!validatePrivateObjectKey(objectKey)) {
    throw new Error('La clave del archivo privado no es válida.')
  }

  const supabase = supabaseConfig()
  if (supabase) {
    const encodedPath = objectKey.split('/').map(encodeURIComponent).join('/')
    const response = await fetch(
      `${supabase.url}/storage/v1/object/${encodeURIComponent(storageBucket())}/${encodedPath}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${supabase.key}`, apikey: supabase.key },
      }
    )
    if (!response.ok && response.status !== 404) {
      throw new Error(`No se pudo borrar el archivo privado (HTTP ${response.status}).`)
    }
    return
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('El almacenamiento privado no está configurado; no se puede confirmar el borrado.')
  }

  try {
    const target = path.resolve(/* turbopackIgnore: true */ localBaseDir(), ...objectKey.split('/'))
    if (!target.startsWith(localBaseDir() + path.sep)) {
      throw new Error('Ruta de almacenamiento no válida.')
    }
    await unlink(target)
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
  }
}
