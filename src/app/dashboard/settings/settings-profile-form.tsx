'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, CheckCircle2, Loader2, Save } from 'lucide-react'
import { updateProfessionalProfile } from './actions'

interface Props {
  user: {
    name: string
    email: string
    licenseNumber?: string | null
    clinicName?: string | null
    phone?: string | null
    address?: string | null
  }
}

export function SettingsProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition()
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const res = await updateProfessionalProfile(formData)
        setSavedMessage(res.message || 'Cambios guardados con éxito')
        setTimeout(() => setSavedMessage(null), 3500)
      } catch (err: any) {
        alert(err?.message || 'Error al guardar los cambios')
      }
    })
  }

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Perfil del Profesional Nutricionista</span>
            </CardTitle>
            {savedMessage && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-fadeIn">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                <span>{savedMessage}</span>
              </span>
            )}
          </div>
          <CardDescription>
            Información médica oficial que aparecerá en las portadas de los planes y en los correos automáticos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profName">Nombre y Apellidos *</Label>
              <Input
                id="profName"
                name="name"
                defaultValue={user.name || 'Eva Vidal'}
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="license">Nº de Colegiado Profesional</Label>
              <Input
                id="license"
                name="licenseNumber"
                defaultValue={user.licenseNumber || 'MAD-04821'}
                placeholder="Ej. AND-01234"
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo Oficial de Consulta (Remitente) *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email || 'evavidalinfo@gmail.com'}
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic">Nombre de la Clínica / Despacho</Label>
              <Input
                id="clinic"
                name="clinicName"
                defaultValue={user.clinicName || 'Consulta Nutricional Eva Vidal'}
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono de Consulta</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={user.phone || ''}
                placeholder="Ej. +34 611 222 333"
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección del Centro</Label>
              <Input
                id="address"
                name="address"
                defaultValue={user.address || ''}
                placeholder="Ej. C/ Gran Vía 12, Madrid"
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t bg-gray-50/50 py-3 px-5">
          <span className="text-2xs text-gray-500 font-medium">
            Todos los cambios se guardan permanentemente en la base de datos en tiempo real.
          </span>
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 h-9 px-4 transition-all shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Guardar Cambios de Perfil</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
