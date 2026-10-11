'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Apple,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  ArrowUpDown,
  Sparkles,
  X,
} from 'lucide-react'
import { FoodImage } from '@/components/nutrition/food-image'
import { getFoodImage } from '@/lib/nutrition'

export interface FoodItem {
  id: number
  name: string
  category: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  source?: string
  imageUrl?: string | null
}

export function InstantFoodsBrowser({
  initialFoods,
  categories,
  totalCount,
}: {
  initialFoods: FoodItem[]
  categories: string[]
  totalCount: number
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'name' | 'calories' | 'protein' | 'carbs' | 'fat'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 30

  // Instant in-memory filter
  const filteredAndSortedFoods = useMemo(() => {
    let result = initialFoods

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((f) => f.category === selectedCategory)
    }

    // Search query filter (instant, case-insensitive, multiple tokens)
    if (searchTerm.trim()) {
      const tokens = searchTerm.toLowerCase().trim().split(/\s+/)
      result = result.filter((f) => {
        const text = `${f.name} ${f.category || ''}`.toLowerCase()
        return tokens.every((token) => text.includes(token))
      })
    }

    // Sort
    result = [...result].sort((a, b) => {
      let valA: any = a.name
      let valB: any = b.name

      if (sortBy === 'calories') {
        valA = a.calories
        valB = b.calories
      } else if (sortBy === 'protein') {
        valA = a.proteinG
        valB = b.proteinG
      } else if (sortBy === 'carbs') {
        valA = a.carbsG
        valB = b.carbsG
      } else if (sortBy === 'fat') {
        valA = a.fatG
        valB = b.fatG
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA
    })

    return result
  }, [initialFoods, searchTerm, selectedCategory, sortBy, sortOrder])

  // Pagination on filtered result
  const totalFiltered = filteredAndSortedFoods.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const paginatedFoods = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredAndSortedFoods.slice(start, start + PAGE_SIZE)
  }, [filteredAndSortedFoods, currentPage])

  // Reset to page 1 on filter change
  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setCurrentPage(1)
  }

  const toggleSort = (field: 'name' | 'calories' | 'protein' | 'carbs' | 'fat') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder(field === 'name' ? 'asc' : 'desc')
    }
    setCurrentPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Search & Fast Filters Bar */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Instant Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Escribe para buscar al instante (ej. pechuga, avena, salmón, nuez, skyr, whey)..."
                className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-2xs text-gray-500 font-bold uppercase hidden md:inline">
                Ordenar por:
              </span>
              <button
                type="button"
                onClick={() => toggleSort('calories')}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  sortBy === 'calories'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>Calorías</span>
                {sortBy === 'calories' && (
                  <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleSort('protein')}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  sortBy === 'protein'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>Proteína</span>
                {sortBy === 'protein' && (
                  <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleSort('name')}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  sortBy === 'name'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>A-Z</span>
                {sortBy === 'name' && (
                  <span className="text-[10px]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-2xs">
            <button
              type="button"
              onClick={() => handleCategoryChange('ALL')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({totalCount})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Foods Table */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
              <Apple className="h-5 w-5 text-blue-600" />
              <span>
                Catálogo de Alimentos ({totalFiltered.toLocaleString('es-ES')} resultados)
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Valores nutricionales netos por 100g de alimento • Búsqueda instantánea en navegador (0 ms de espera)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-200 font-bold px-3 py-1">
              Página {currentPage} de {totalPages}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {paginatedFoods.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Apple className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No se encontraron alimentos para "{searchTerm}".</p>
              <p className="text-xs text-gray-400 mt-1">Prueba con otra palabra clave o restablece la categoría.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('ALL')
                }}
                className="mt-4 rounded-2xl text-xs font-bold"
              >
                Restablecer búsqueda
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5">Alimento</th>
                      <th className="px-6 py-3.5">Categoría</th>
                      <th className="px-6 py-3.5 text-right cursor-pointer hover:text-blue-600" onClick={() => toggleSort('calories')}>
                        Energía {sortBy === 'calories' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 text-right text-blue-700 cursor-pointer hover:underline" onClick={() => toggleSort('protein')}>
                        Proteína {sortBy === 'protein' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 text-right text-amber-700 cursor-pointer hover:underline" onClick={() => toggleSort('carbs')}>
                        Carbos {sortBy === 'carbs' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 text-right text-rose-700 cursor-pointer hover:underline" onClick={() => toggleSort('fat')}>
                        Grasas {sortBy === 'fat' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 text-right text-sky-700">Fibra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedFoods.map((food) => {
                      const imageUrl = food.imageUrl || getFoodImage(food as any)
                      return (
                        <tr key={food.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-blue-50 border border-gray-200 shadow-2xs">
                                <FoodImage
                                  src={imageUrl}
                                  alt={food.name}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900">{food.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              {food.category || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            {food.calories} kcal
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-blue-700">
                            {food.proteinG} g
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-amber-700">
                            {food.carbsG} g
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-rose-700">
                            {food.fatG} g
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-sky-700">
                            {food.fiberG} g
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    Mostrando del{' '}
                    <span className="font-bold text-gray-800">
                      {(currentPage - 1) * PAGE_SIZE + 1}
                    </span>{' '}
                    al{' '}
                    <span className="font-bold text-gray-800">
                      {Math.min(currentPage * PAGE_SIZE, totalFiltered)}
                    </span>{' '}
                    de <span className="font-bold text-gray-800">{totalFiltered}</span> alimentos
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="rounded-2xl text-xs flex items-center gap-1 font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Anterior</span>
                    </Button>

                    <span className="text-xs font-bold text-gray-700 px-2">
                      {currentPage} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="rounded-2xl text-xs flex items-center gap-1 font-semibold"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
