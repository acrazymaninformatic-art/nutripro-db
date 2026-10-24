export const PRIVATE_FILE_PREFIX = 'private://'

export function isPrivateStorageKey(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(PRIVATE_FILE_PREFIX))
}

export function stripPrivatePrefix(storageKey: string): string {
  return storageKey.startsWith(PRIVATE_FILE_PREFIX)
    ? storageKey.slice(PRIVATE_FILE_PREFIX.length)
    : storageKey
}

/**
 * Convierte una clave privada en una ruta autenticada. Es seguro importarlo
 * desde componentes cliente: no contiene secretos ni acceso a disco.
 */
export function privateFileHref(storageKey: string): string {
  // Las URLs externas antiguas no se sirven desde la aplicación: podrían ser
  // públicas y quedar fuera del control de acceso. Solo se enlazan objetos
  // migrados al almacenamiento privado.
  if (!isPrivateStorageKey(storageKey)) return ''
  return `/api/private-files/${stripPrivatePrefix(storageKey)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
}
