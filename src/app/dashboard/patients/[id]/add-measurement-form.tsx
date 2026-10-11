'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnthropometry } from '../actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Scale, Loader2 } from 'lucide-react'

export function AddMeasurementForm({ patientId }: { patientId: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createAnthropometry(patientId, formData)
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al registrar la medición antropométrica')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        <span>Registrar Nueva Medición</span>
      </Button>
    )
  }

  return (
    <Card className="border-green-200 bg-green-50/20 shadow-sm animate-in fade-in-50 duration-200">
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-green-900">
              <Scale className="h-4 w-4 text-green-600" />
              <span>Nueva Medición Antropométrica</span>
            </CardTitle>
            <CardDescription>
              Introduce el peso, pliegues cutáneos y perímetros corporales del control
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* General measurements */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs">Fecha de Control *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weightKg" className="text-xs">Peso (kg)</Label>
              <Input id="weightKg" name="weightKg" type="number" step="any" placeholder="70.5" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bodyFatPct" className="text-xs">% Grasa Corporal</Label>
              <Input id="bodyFatPct" name="bodyFatPct" type="number" step="any" placeholder="18.2" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="muscleMassKg" className="text-xs">Masa Muscular (kg)</Label>
              <Input id="muscleMassKg" name="muscleMassKg" type="number" step="any" placeholder="32.0" />
            </div>
          </div>

          {/* Perimeters */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Perímetros Corporales (cm)</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label htmlFor="waistCm" className="text-xs">Cintura</Label>
                <Input id="waistCm" name="waistCm" type="number" step="any" placeholder="80" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hipCm" className="text-xs">Cadera</Label>
                <Input id="hipCm" name="hipCm" type="number" step="any" placeholder="95" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="chestCm" className="text-xs">Pecho</Label>
                <Input id="chestCm" name="chestCm" type="number" step="any" placeholder="98" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="armCm" className="text-xs">Brazo</Label>
                <Input id="armCm" name="armCm" type="number" step="any" placeholder="32" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="thighCm" className="text-xs">Muslo</Label>
                <Input id="thighCm" name="thighCm" type="number" step="any" placeholder="54" />
              </div>
            </div>
          </div>

          {/* Skinfolds */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Pliegues Cutáneos (mm)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="skinfoldTriceps" className="text-xs">Tricipital</Label>
                <Input id="skinfoldTriceps" name="skinfoldTriceps" type="number" step="any" placeholder="12" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="skinfoldSubscapular" className="text-xs">Subescapular</Label>
                <Input id="skinfoldSubscapular" name="skinfoldSubscapular" type="number" step="any" placeholder="14" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="skinfoldSuprailiac" className="text-xs">Suprailíaco</Label>
                <Input id="skinfoldSuprailiac" name="skinfoldSuprailiac" type="number" step="any" placeholder="16" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="skinfoldAbdominal" className="text-xs">Abdominal</Label>
                <Input id="skinfoldAbdominal" name="skinfoldAbdominal" type="number" step="any" placeholder="18" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs">Observaciones de la sesión</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Ej. Buena adherencia al plan, comenta mayor energía en entrenamientos..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t bg-gray-50/50 px-6 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Medición'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
