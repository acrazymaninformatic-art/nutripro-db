'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, GitMerge, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { mergeDuplicateFoods } from './actions'

interface MinimalFood {
  id: number
  name: string
  category: string | null
  calories: number
}

export function DuplicateMergerModal({
  foods,
  onClose,
  onMerged,
}: {
  foods: MinimalFood[]
  onClose: () => void
  onMerged: () => void
}) {
  const [searchPrimary, setSearchPrimary] = useState('')
  const [searchDuplicate, setSearchDuplicate] = useState('')
  const [primaryFood, setPrimaryFood] = useState<MinimalFood | null>(null)
  const [duplicateFood, setDuplicateFood] = useState<MinimalFood | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredPrimary = foods
    .filter((f) => f.name.toLowerCase().includes(searchPrimary.toLowerCase()))
    .slice(0, 5)

  const filteredDuplicate = foods
    .filter((f) => f.name.toLowerCase().includes(searchDuplicate.toLowerCase()) && f.id !== primaryFood?.id)
    .slice(0, 5)

  const handleMerge = async () => {
    if (!primaryFood || !duplicateFood) return
    setIsLoading(true)
    setErrorMessage(null)
    setResultMessage(null)

    try {
      const res = await mergeDuplicateFoods(primaryFood.id, duplicateFood.id)
      setResultMessage(
        `Alimento "${res.mergedName}" fusionado con éxito en "${res.primaryName}". Se reasignaron ${res.reassignedRecipes} recetas y ${res.reassignedMeals} comidas de planes.`
      )
      onMerged()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al fusionar alimentos duplicados')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Control de Calidad: Fusión de Duplicados</h2>
              <p className="text-xs text-orange-100">
                Reasigna recetas y comidas al alimento canónico y elimina el duplicado de forma segura.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {resultMessage ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Fusión completada</h3>
                <p className="text-xs mt-1 leading-relaxed">{resultMessage}</p>
                <Button
                  onClick={onClose}
                  className="mt-4 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Food Selection */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>1. Alimento Principal (Se conserva)</span>
                  </span>
                  {primaryFood ? (
                    <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">{primaryFood.name}</span>
                        <span className="text-2xs text-gray-500">{primaryFood.category} • {primaryFood.calories} kcal</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimaryFood(null)}
                        className="text-2xs text-gray-400 hover:text-gray-700 h-6 px-2"
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Input
                        placeholder="Buscar alimento principal..."
                        value={searchPrimary}
                        onChange={(e) => setSearchPrimary(e.target.value)}
                        className="text-xs h-8 rounded-xl"
                      />
                      <div className="space-y-1">
                        {filteredPrimary.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setPrimaryFood(f)}
                            className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 text-xs flex justify-between items-center transition-colors border border-transparent hover:border-emerald-200"
                          >
                            <span className="font-medium text-gray-800">{f.name}</span>
                            <span className="text-2xs text-gray-400">{f.calories} kcal</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Duplicate Food Selection */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>2. Alimento Duplicado (Se fusiona y borra)</span>
                  </span>
                  {duplicateFood ? (
                    <div className="p-3 bg-white rounded-xl border border-rose-300 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">{duplicateFood.name}</span>
                        <span className="text-2xs text-gray-500">{duplicateFood.category} • {duplicateFood.calories} kcal</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDuplicateFood(null)}
                        className="text-2xs text-gray-400 hover:text-gray-700 h-6 px-2"
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Input
                        placeholder="Buscar duplicado a eliminar..."
                        value={searchDuplicate}
                        onChange={(e) => setSearchDuplicate(e.target.value)}
                        className="text-xs h-8 rounded-xl"
                      />
                      <div className="space-y-1">
                        {filteredDuplicate.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setDuplicateFood(f)}
                            className="w-full text-left p-2 rounded-lg hover:bg-rose-50 text-xs flex justify-between items-center transition-colors border border-transparent hover:border-rose-200"
                          >
                            <span className="font-medium text-gray-800">{f.name}</span>
                            <span className="text-2xs text-gray-400">{f.calories} kcal</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {primaryFood && duplicateFood && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{duplicateFood.name}</span>
                    <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-emerald-800">{primaryFood.name}</span>
                  </div>
                  <Button
                    onClick={handleMerge}
                    disabled={isLoading}
                    className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                  >
                    {isLoading ? 'Fusionando...' : 'Confirmar Fusión'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
