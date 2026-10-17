'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Barcode, Search, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { getFoodByBarcode } from './actions'
import { FoodDetailData } from './food-details-modal'

export function BarcodeScannerModal({
  onClose,
  onFoodFound,
}: {
  onClose: () => void
  onFoodFound: (food: FoodDetailData) => void
}) {
  const [barcode, setBarcode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!barcode.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const found = await getFoodByBarcode(barcode.trim())
      if (found) {
        onFoodFound(found as any)
      } else {
        setError(`No se encontró ningún alimento en el catálogo con el código ${barcode}.`)
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar código de barras')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Escáner de Código de Barras</h2>
              <p className="text-xs text-blue-100">Búsqueda rápida EAN-13 y productos de supermercado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Código de barras EAN-13 / UPC</label>
            <div className="relative">
              <Input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ej. 8480000123456"
                className="font-mono text-sm pl-9 rounded-2xl h-11"
                autoFocus
              />
              <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl text-xs">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !barcode.trim()}
              className="rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Buscando...' : 'Buscar Alimento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
