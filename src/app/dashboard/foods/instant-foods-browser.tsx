'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Apple, ArrowDown, ArrowUp, Barcode, Beef, CheckSquare, ChevronLeft, ChevronRight, Filter, GitMerge, Leaf, Search, Soup, Sparkles, Square, Star, Wheat, X } from 'lucide-react'
import { FoodImage } from '@/components/nutrition/food-image'
import { getFoodImage } from '@/lib/nutrition'
import { FoodDetailsModal, FoodDetailData } from './food-details-modal'
import { DuplicateMergerModal } from './duplicate-merger-modal'
import { BarcodeScannerModal } from './barcode-scanner-modal'
import { toggleFoodFavorite, bulkUpdateFoods } from './actions'

export type FoodItem = FoodDetailData

export function InstantFoodsBrowser({
  initialFoods,
  categories,
  totalCount,
}: {
  initialFoods: FoodItem[]
  categories: string[]
  totalCount: number
}) {
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'name' | 'calories' | 'protein' | 'carbs' | 'fat'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 30

  // 5.6 Filters
  const [filterProtein20, setFilterProtein20] = useState(false)
  const [filterLowSodium, setFilterLowSodium] = useState(false)
  const [filterHighFiber, setFilterHighFiber] = useState(false)
  const [filterLowFodmap, setFilterLowFodmap] = useState(false)
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false)
  const [filterAllergenFree, setFilterAllergenFree] = useState<string>('ALL')

  // Modals & Selection
  const [inspectedFood, setInspectedFood] = useState<FoodDetailData | null>(null)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Instant in-memory filter
  const filteredAndSortedFoods = useMemo(() => {
    let result = foods

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((f) => f.category === selectedCategory)
    }

    // Nutrient Filters
    if (filterProtein20) {
      result = result.filter((f) => f.proteinG >= 20)
    }
    if (filterLowSodium) {
      result = result.filter((f) => (f.sodiumMg || 0) <= 120)
    }
    if (filterHighFiber) {
      result = result.filter((f) => (f.fiberG || 0) >= 6)
    }
    if (filterLowFodmap) {
      result = result.filter((f) => !f.fodmapCategory || f.fodmapCategory === 'BAJO')
    }
    if (filterFavoritesOnly) {
      result = result.filter((f) => f.isFavorite)
    }
    if (filterAllergenFree !== 'ALL') {
      result = result.filter((f) => {
        try {
          const allergens: string[] = f.allergensJson ? JSON.parse(f.allergensJson) : []
          return !allergens.some((a) => a.toLowerCase().includes(filterAllergenFree.toLowerCase()))
        } catch {
          return true
        }
      })
    }

    // Search query filter (instant, case-insensitive, multiple tokens)
    if (searchTerm.trim()) {
      const tokens = searchTerm.toLowerCase().trim().split(/\s+/)
      result = result.filter((f) => {
        const text = `${f.name} ${f.category || ''} ${f.brandName || ''} ${f.barcode || ''}`.toLowerCase()
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
  }, [
    foods,
    searchTerm,
    selectedCategory,
    filterProtein20,
    filterLowSodium,
    filterHighFiber,
    filterLowFodmap,
    filterFavoritesOnly,
    filterAllergenFree,
    sortBy,
    sortOrder,
  ])

  // Pagination on filtered result
  const totalFiltered = filteredAndSortedFoods.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const paginatedFoods = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredAndSortedFoods.slice(start, start + PAGE_SIZE)
  }, [filteredAndSortedFoods, currentPage])

  // Handlers
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

  const handleToggleFavorite = async (e: React.MouseEvent, foodId: number) => {
    e.stopPropagation()
    try {
      const updated = await toggleFoodFavorite(foodId)
      setFoods((prev) =>
        prev.map((f) => (f.id === foodId ? { ...f, isFavorite: updated.isFavorite } : f))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedFoods.map((f) => f.id)
    const allSelected = pageIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleSelectRow = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleBulkFavorite = async () => {
    if (selectedIds.length === 0) return
    await bulkUpdateFoods(selectedIds, { isFavorite: true })
    setFoods((prev) =>
      prev.map((f) => (selectedIds.includes(f.id) ? { ...f, isFavorite: true } : f))
    )
    setSelectedIds([])
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
                placeholder="Escribe para buscar al instante (ej. pechuga, avena, salmón, nuez, skyr, EAN)..."
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

            {/* Quick Actions (Barcode + Duplicates) */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="rounded-2xl text-xs font-bold gap-1.5 border-gray-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <Barcode className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">Escanear</span> EAN
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDuplicateModalOpen(true)}
                className="rounded-2xl text-xs font-bold gap-1.5 border-gray-300 hover:bg-amber-50 hover:text-amber-800"
              >
                <GitMerge className="w-4 h-4 text-amber-600" />
                <span>Duplicados</span>
              </Button>

              {/* Quick Sort Dropdown */}
              <button
                type="button"
                onClick={() => toggleSort('calories')}
                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  sortBy === 'calories'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>Kcal</span>
                {sortBy === 'calories' && (
                  <span className="text-[10px]">{sortOrder === 'asc' ? <ArrowUp className="h-[1em] w-[1em] shrink-0" /> : <ArrowDown className="h-[1em] w-[1em] shrink-0" />}</span>
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
                <span>Prot</span>
                {sortBy === 'protein' && (
                  <span className="text-[10px]">{sortOrder === 'asc' ? <ArrowUp className="h-[1em] w-[1em] shrink-0" /> : <ArrowDown className="h-[1em] w-[1em] shrink-0" />}</span>
                )}
              </button>
            </div>
          </div>

          {/* 5.6 Clinical Nutrient Filter Toggles (Organizado sin cortes) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Filtros Clínicos Directos</span>
              </span>
              {(filterProtein20 || filterLowSodium || filterHighFiber || filterLowFodmap || filterFavoritesOnly || filterAllergenFree !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterProtein20(false)
                    setFilterLowSodium(false)
                    setFilterHighFiber(false)
                    setFilterLowFodmap(false)
                    setFilterFavoritesOnly(false)
                    setFilterAllergenFree('ALL')
                    setCurrentPage(1)
                  }}
                  className="text-3xs font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => { setFilterProtein20(!filterProtein20); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                  filterProtein20
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Beef className="h-4 w-4" /> ≥ 20g Proteína
              </button>
              <button
                type="button"
                onClick={() => { setFilterLowSodium(!filterLowSodium); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                  filterLowSodium
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Soup className="h-4 w-4" /> Bajo sodio (≤ 120mg)
              </button>
              <button
                type="button"
                onClick={() => { setFilterHighFiber(!filterHighFiber); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                  filterHighFiber
                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Wheat className="h-4 w-4" /> Alto en fibra (≥ 6g)
              </button>
              <button
                type="button"
                onClick={() => { setFilterLowFodmap(!filterLowFodmap); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                  filterLowFodmap
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Leaf className="h-4 w-4" /> FODMAP Bajo
              </button>
              <button
                type="button"
                onClick={() => { setFilterFavoritesOnly(!filterFavoritesOnly); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  filterFavoritesOnly
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Mis Favoritos</span>
              </button>
              <select
                value={filterAllergenFree}
                onChange={(e) => { setFilterAllergenFree(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200/80 focus:ring-2 focus:ring-blue-500 text-xs cursor-pointer shadow-2xs"
              >
                <option value="ALL"> Sin exclusión de alérgenos</option>
                <option value="gluten">Sin Gluten</option>
                <option value="lactosa">Sin Lactosa</option>
                <option value="huevo">Sin Huevo</option>
                <option value="frutos">Sin Frutos secos</option>
                <option value="cacahuete">Sin Cacahuetes</option>
                <option value="pescado">Sin Pescado</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar (Multi-row wrapping) */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Categorías ({categories.length + 1})
            </span>
            <div className="flex items-center gap-1.5 flex-wrap text-2xs">
              <button
                type="button"
                onClick={() => handleCategoryChange('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                Todos ({totalCount})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-blue-900 text-white rounded-2xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="font-bold">{selectedIds.length} alimentos seleccionados</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBulkFavorite}
              className="rounded-xl text-2xs font-bold h-7 gap-1"
            >
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>Marcar como Favoritos</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="rounded-xl text-2xs font-bold h-7 text-white/80 hover:text-white hover:bg-white/10"
            >
              Deseleccionar
            </Button>
          </div>
        </div>
      )}

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
              Valores nutricionales netos por 100g • Pulsa en cualquier alimento para abrir su perfil clínico completo
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
              <p className="text-sm font-semibold text-gray-700">No se encontraron alimentos con los filtros actuales.</p>
              <p className="text-xs text-gray-400 mt-1">Prueba a desactivar filtros clínicos o buscar otra palabra clave.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('ALL')
                  setFilterProtein20(false)
                  setFilterLowSodium(false)
                  setFilterHighFiber(false)
                  setFilterLowFodmap(false)
                  setFilterFavoritesOnly(false)
                  setFilterAllergenFree('ALL')
                }}
                className="mt-4 rounded-2xl text-xs font-bold"
              >
                Restablecer todos los filtros
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile/tablet catalogue cards. The full nutrition table needs
                  the wide desktop canvas; on smaller screens it hid kcal and
                  macros behind a horizontal scroll. */}
              <div className="divide-y divide-gray-100 xl:hidden">
                {paginatedFoods.map((food) => {
                  const imageUrl = getFoodImage(food as any)
                  const isSelected = selectedIds.includes(food.id)
                  return (
                    <div
                      key={food.id}
                      onClick={() => setInspectedFood(food)}
                      className={`flex cursor-pointer gap-3 p-3 transition-colors ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={isSelected ? `Deseleccionar ${food.name}` : `Seleccionar ${food.name}`}
                        onClick={(e) => handleToggleSelectRow(e, food.id)}
                        className="mt-1 shrink-0 text-gray-400 hover:text-gray-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-blue-50 shadow-2xs">
                        <FoodImage
                          src={imageUrl}
                          alt={food.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                              {food.name}
                            </p>
                            <p className="truncate text-[10px] font-medium text-gray-500">
                              {food.brandName ? `${food.brandName} · ` : ''}
                              {food.category || 'General'}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={food.isFavorite ? `Quitar ${food.name} de favoritos` : `Marcar ${food.name} como favorito`}
                            onClick={(e) => handleToggleFavorite(e, food.id)}
                            className="-mr-1 shrink-0 rounded-full p-1.5 transition-colors hover:bg-amber-50"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                food.isFavorite
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300 hover:text-amber-400'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
                          <span className="rounded-lg bg-slate-50 px-1 py-1 font-bold text-gray-800">
                            {food.calories}
                            <span className="block text-[8px] font-semibold uppercase tracking-wide text-gray-400">kcal</span>
                          </span>
                          <span className="rounded-lg bg-blue-50 px-1 py-1 font-bold text-blue-800">
                            {food.proteinG}g
                            <span className="block text-[8px] font-semibold uppercase tracking-wide text-blue-500">Prot</span>
                          </span>
                          <span className="rounded-lg bg-amber-50 px-1 py-1 font-bold text-amber-800">
                            {food.carbsG}g
                            <span className="block text-[8px] font-semibold uppercase tracking-wide text-amber-600">Carb</span>
                          </span>
                          <span className="rounded-lg bg-rose-50 px-1 py-1 font-bold text-rose-800">
                            {food.fatG}g
                            <span className="block text-[8px] font-semibold uppercase tracking-wide text-rose-500">Gras</span>
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] font-semibold text-gray-500">
                          <span>Fibra {food.fiberG}g</span>
                          {food.nutriScore && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">NS {food.nutriScore}</span>}
                          {food.novaGroup && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">N{food.novaGroup}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="w-10 px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={handleSelectAllOnPage}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          {paginatedFoods.every((f) => selectedIds.includes(f.id)) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3.5">Alimento</th>
                      <th className="px-4 py-3.5">Categoría / Calidad</th>
                      <th className="px-4 py-3.5 text-right cursor-pointer hover:text-blue-600" onClick={() => toggleSort('calories')}>
                        Energía {sortBy === 'calories' && (sortOrder === 'asc' ? <ArrowUp className="h-[1em] w-[1em] shrink-0" /> : <ArrowDown className="h-[1em] w-[1em] shrink-0" />)}
                      </th>
                      <th className="px-4 py-3.5 text-right text-blue-700 cursor-pointer hover:underline" onClick={() => toggleSort('protein')}>
                        Proteína {sortBy === 'protein' && (sortOrder === 'asc' ? <ArrowUp className="h-[1em] w-[1em] shrink-0" /> : <ArrowDown className="h-[1em] w-[1em] shrink-0" />)}
                      </th>
                      <th className="px-4 py-3.5 text-right text-amber-700 cursor-pointer hover:underline" onClick={() => toggleSort('carbs')}>
                        Carbos {sortBy === 'carbs' && (sortOrder === 'asc' ? <ArrowUp className="h-[1em] w-[1em] shrink-0" /> : <ArrowDown className="h-[1em] w-[1em] shrink-0" />)}
                      </th>
                      <th className="px-4 py-3.5 text-right text-rose-700 cursor-pointer hover:underline" onClick={() => toggleSort('fat')}>
                        Grasas {sortBy === 'fat' && (sortOrder === 'asc' ? <ArrowUp className="h-[1em] w-[1em] shrink-0" /> : <ArrowDown className="h-[1em] w-[1em] shrink-0" />)}
                      </th>
                      <th className="px-4 py-3.5 text-right text-sky-700">Fibra</th>
                      <th className="w-12 px-3 py-3.5 text-center">Fav</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedFoods.map((food) => {
                      const imageUrl = getFoodImage(food as any)
                      const isSelected = selectedIds.includes(food.id)
                      return (
                        <tr
                          key={food.id}
                          onClick={() => setInspectedFood(food)}
                          className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/70' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => handleToggleSelectRow(e, food.id)}>
                            <button type="button" className="text-gray-400 hover:text-gray-700">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
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
                                <span className="font-semibold text-gray-900 block hover:text-blue-600">
                                  {food.name}
                                </span>
                                {food.brandName && (
                                  <span className="text-2xs text-gray-400 block font-normal">
                                    {food.brandName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {food.category || 'General'}
                              </span>
                              {food.nutriScore && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  NS {food.nutriScore}
                                </span>
                              )}
                              {food.novaGroup && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                                  N{food.novaGroup}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {food.calories} kcal
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-700">
                            {food.proteinG} g
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-700">
                            {food.carbsG} g
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-rose-700">
                            {food.fatG} g
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-sky-700">
                            {food.fiberG} g
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, food.id)}
                              className="p-1 rounded-full hover:bg-amber-50 transition-colors"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  food.isFavorite
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300 hover:text-amber-400'
                                }`}
                              />
                            </button>
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

      {/* Clinical Food Details Modal */}
      {inspectedFood && (
        <FoodDetailsModal
          food={inspectedFood}
          onClose={() => setInspectedFood(null)}
        />
      )}

      {/* Duplicate Merger Modal */}
      {isDuplicateModalOpen && (
        <DuplicateMergerModal
          foods={foods}
          onClose={() => setIsDuplicateModalOpen(false)}
          onMerged={() => {
            setIsDuplicateModalOpen(false)
          }}
        />
      )}

      {/* Barcode Scanner Modal */}
      {isBarcodeModalOpen && (
        <BarcodeScannerModal
          onClose={() => setIsBarcodeModalOpen(false)}
          onFoodFound={(found) => {
            setIsBarcodeModalOpen(false)
            setInspectedFood(found)
          }}
        />
      )}
    </div>
  )
}
