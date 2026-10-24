'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker que hace la aplicación instalable (PWA) y
 * permite recibir avisos en el móvil.
 *
 * En desarrollo no se registra: los chunks cambian en cada compilación y un
 * service worker antiguo puede servir código obsoleto. Si un navegador de
 * desarrollo ya tenía uno registrado, se elimina junto con sus cachés.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => (typeof caches === 'undefined' ? undefined : caches.keys()))
        .then((keys) => (keys ? Promise.all(keys.map((key) => caches.delete(key))) : undefined))
        .catch(() => undefined)
      return
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })

        // Un worker nuevo toma el control en cuanto termina de instalarse, para
        // que las correcciones de seguridad no esperen a cerrar todas las
        // pestañas de la aplicación.
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })

        await registration.update()
      } catch {
        // Sin service worker la aplicación sigue funcionando; solo se pierde
        // la instalación como PWA y los avisos push.
      }
    }

    if (document.readyState === 'complete') {
      void register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
