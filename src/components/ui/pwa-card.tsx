'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, Download, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaCard() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPermission | 'unsupported'>(
    'unsupported'
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Se sincroniza en el siguiente frame para no provocar un desajuste de
    // hidratación entre el HTML del servidor y el primer render del cliente.
    const frame = requestAnimationFrame(() => {
      if ('Notification' in window) setNotifications(Notification.permission)
      if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    })

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }, [installPrompt])

  const handleNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') return

    const permission = await Notification.requestPermission()
    setNotifications(permission)

    if (permission === 'granted') {
      new Notification('EVSoftware · Eva Vidal Nutrición', {
        body: 'Los avisos de tu portal están activados.',
        icon: '/icon-192.png',
      })
    }
  }, [])

  return (
    <Card className="rounded-3xl border-slate-200/80 shadow-xs overflow-hidden">
      <CardHeader className="bg-slate-50/60 pb-3.5 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-blue-600" />
          <span>Usar la app en el móvil</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Instálala en tu pantalla de inicio para abrirla a pantalla completa y recibir avisos.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {installed ? (
          <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
            <Check className="h-4 w-4 shrink-0" />
            La app ya está instalada en este dispositivo.
          </p>
        ) : installPrompt ? (
          <Button
            type="button"
            onClick={handleInstall}
            className="w-full rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Instalar la app
          </Button>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
            En el móvil: <strong>Compartir → Añadir a pantalla de inicio</strong>. En el ordenador: el
            icono de instalación aparece en la barra de direcciones.
          </p>
        )}

        {notifications === 'granted' ? (
          <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
            <Check className="h-4 w-4 shrink-0" />
            Avisos activados en este dispositivo.
          </p>
        ) : (
          <Button
            type="button"
            onClick={handleNotifications}
            disabled={notifications === 'denied'}
            variant="outline"
            className="w-full rounded-2xl border-slate-200 text-xs font-bold text-slate-700"
          >
            <Bell className="mr-1.5 h-4 w-4" />
            {notifications === 'denied' ? 'Avisos bloqueados por el navegador' : 'Activar avisos'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
