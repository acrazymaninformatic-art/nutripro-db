'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renderiza los modales fuera del flujo de la página (en `document.body`).
 *
 * Es imprescindible porque el contenedor de la página crea un contexto de
 * apilamiento (`isolation: isolate`): sin portal, un modal con `z-50` queda
 * atrapado en ese contexto y la cabecera de la aplicación (z-30) se pinta
 * encima, recortando la parte superior del modal.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(children, document.body)
}
