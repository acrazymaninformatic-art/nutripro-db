'use client'

import { useCallback, useEffect, useState } from 'react'

export type MotionPreference = 'auto' | 'on' | 'off'

export const MOTION_STORAGE_KEY = 'ev_motion_preference'
export const MOTION_CHANGE_EVENT = 'ev:motion-preference-change'

/**
 * Preferencia de animaciones de la interfaz.
 * - `on`:   (por defecto) animaciones siempre activas.
 * - `auto`: respeta la configuración del sistema (prefers-reduced-motion).
 * - `off`:  desactiva siempre las animaciones.
 */
export function readMotionPreference(): MotionPreference {
  if (typeof window === 'undefined') return 'on'

  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY)
    if (stored === 'on' || stored === 'off' || stored === 'auto') return stored
  } catch {
    // localStorage bloqueado: seguimos con la preferencia por defecto.
  }

  return 'on'
}

export function writeMotionPreference(preference: MotionPreference) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, preference)
  } catch {
    // Sin persistencia: la preferencia solo vive en esta sesión.
  }

  window.dispatchEvent(new CustomEvent(MOTION_CHANGE_EVENT, { detail: preference }))
}

export function systemPrefersReducedMotion() {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function resolveMotionEnabled(preference: MotionPreference) {
  if (preference === 'on') return true
  if (preference === 'off') return false

  return !systemPrefersReducedMotion()
}

export function useMotionPreference() {
  // El primer render debe coincidir con el servidor (SSR) para no provocar
  // errores de hidratación: el valor real se sincroniza en el efecto.
  const [preference, setPreferenceState] = useState<MotionPreference>('on')
  const [enabled, setEnabled] = useState<boolean>(true)

  useEffect(() => {
    const sync = () => {
      const next = readMotionPreference()
      setPreferenceState(next)
      setEnabled(resolveMotionEnabled(next))
    }

    sync()

    window.addEventListener(MOTION_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', sync)

    return () => {
      window.removeEventListener(MOTION_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
      mediaQuery.removeEventListener('change', sync)
    }
  }, [])

  const setPreference = useCallback((next: MotionPreference) => {
    writeMotionPreference(next)
  }, [])

  return { preference, enabled, setPreference }
}
