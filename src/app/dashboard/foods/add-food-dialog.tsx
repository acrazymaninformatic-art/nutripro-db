'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFood } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus, X, Apple, Loader2 } from 'lucide-react'

export function AddFoodDialog({ categories }: { categories: string[] }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createFood(formData)
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al registrar el alimento')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        <span>Nuevo Alimento</span>
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in-50 zoom-in-95">
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-green-50 text-green-700 rounded-lg">
                <Apple className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Crear Alimento Personalizado</h3>
                <p className="text-xs text-gray-500">Valores nutricionales por cada 100g de porción</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del Alimento *</Label>
              <Input id="name" name="name" required placeholder="Ej. Lomo de salmón fresco" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoría *</Label>
                <Select id="category" name="category" defaultValue="Carnes">
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Suplementos">Suplementos</option>
                  <option value="Otros">Otros</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="servingSize">Tamaño Porción (g)</Label>
                <Input id="servingSize" name="servingSize" type="number" defaultValue="100" />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-3">
                Macronutrientes (por 100g)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="calories" className="text-xs">Energía (kcal) *</Label>
                  <Input id="calories" name="calories" type="number" step="any" required placeholder="150" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="proteinG" className="text-xs">Proteína (g) *</Label>
                  <Input id="proteinG" name="proteinG" type="number" step="any" required placeholder="20" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carbsG" className="text-xs">Carbos (g) *</Label>
                  <Input id="carbsG" name="carbsG" type="number" step="any" required placeholder="5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fatG" className="text-xs">Grasas (g) *</Label>
                  <Input id="fatG" name="fatG" type="number" step="any" required placeholder="8" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="fiberG" className="text-xs">Fibra (g)</Label>
                  <Input id="fiberG" name="fiberG" type="number" step="any" placeholder="2.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sodiumMg" className="text-xs">Sodio (mg)</Label>
                  <Input id="sodiumMg" name="sodiumMg" type="number" step="1" placeholder="60" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Alimento'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
