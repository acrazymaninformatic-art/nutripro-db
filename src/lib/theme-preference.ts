'use client'

import { useCallback, useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ev_theme_preference'
export const THEME_CHANGE_EVENT = 'ev:theme-preference-change'

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage bloqueado: seguimos con la preferencia del sistema.
  }

  return 'system'
}

export function writeThemePreference(preference: ThemePreference) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Sin persistencia: la preferencia solo vive en esta sesión.
  }

  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: preference }))
}

export function systemPrefersDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'dark') return 'dark'
  if (preference === 'light') return 'light'
  return systemPrefersDark() ? 'dark' : 'light'
}

export function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const sync = () => {
      const next = readThemePreference()
      const nextResolved = resolveTheme(next)
      setPreferenceState(next)
      setResolved(nextResolved)
      applyTheme(nextResolved)
    }

    sync()

    window.addEventListener(THEME_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', sync)

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
      mediaQuery.removeEventListener('change', sync)
    }
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    writeThemePreference(next)
    const nextResolved = resolveTheme(next)
    setPreferenceState(next)
    setResolved(nextResolved)
    applyTheme(nextResolved)
  }, [])

  const toggle = useCallback(() => {
    const current = resolveTheme(readThemePreference())
    setPreference(current === 'dark' ? 'light' : 'dark')
  }, [setPreference])

  return { preference, resolved, setPreference, toggle }
}
