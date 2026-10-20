'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FoodImage } from '@/components/nutrition/food-image'
import { ModalPortal } from '@/components/ui/modal-portal'
import { ArrowRight, ChefHat, Clock, ExternalLink, FileText, Flame, Plus, Printer, Search, Snowflake, Users, Utensils, X } from 'lucide-react'

export interface RecipeWithIngredients {
  id: string
  name: string
  description: string | null
  category: string | null
  servings: number
  prepTimeMin: number | null
  cookTimeMin: number | null
  instructions: string
  imageUrl?: string | null
  dietaryTagsJson?: string | null
  difficulty?: string | null
  estimatedCost?: number | null
  equipmentJson?: string | null
  isBatchCooking?: boolean | null
  isFreezable?: boolean | null
  ingredients: {
    id: string
    quantityG: number
    notes: string | null
    food: {
      id: number
      name: string
      calories: number
      proteinG: number
      carbsG: number
      fatG: number
      fiberG: number | null
      category: string | null
    }
  }[]
}

interface RecipesClientProps {
  initialRecipes: RecipeWithIngredients[]
}

const CATEGORY_CHIPS = [
  'Todas',
  'Comidas',
  'Cenas',
  'Desayunos',
  'Snacks y Meriendas',
  'Platos Únicos',
]

export function RecipesClient({ initialRecipes }: RecipesClientProps) {
  const [recipes] = useState<RecipeWithIngredients[]>(initialRecipes)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [selectedEquipment, setSelectedEquipment] = useState('ALL')
  const [onlyBatchCooking, setOnlyBatchCooking] = useState(false)
  const [onlyFreezable, setOnlyFreezable] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null)
  const [modalServings, setModalServings] = useState<number>(1)

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Category filter
      if (selectedCategory !== 'Todas') {
        const cat = (r.category || 'General').toLowerCase()
        if (!cat.includes(selectedCategory.toLowerCase())) {
          return false
        }
      }

      // Dietary tag filter
      if (selectedTag !== 'ALL') {
        try {
          const tags: string[] = r.dietaryTagsJson ? JSON.parse(r.dietaryTagsJson) : []
          if (!tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
            return false
          }
        } catch {
          return false
        }
      }

      // Equipment filter
      if (selectedEquipment !== 'ALL') {
        try {
          const equip: string[] = r.equipmentJson ? JSON.parse(r.equipmentJson) : []
          if (!equip.some((e) => e.toLowerCase() === selectedEquipment.toLowerCase())) {
            return false
          }
        } catch {
          return false
        }
      }

      // Batch cooking filter
      if (onlyBatchCooking && !r.isBatchCooking) {
        return false
      }

      // Freezable filter
      if (onlyFreezable && !r.isFreezable) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = r.name.toLowerCase().includes(q)
        const descMatch = (r.description || '').toLowerCase().includes(q)
        const ingMatch = r.ingredients.some((ing) =>
          ing.food.name.toLowerCase().includes(q)
        )
        if (!nameMatch && !descMatch && !ingMatch) return false
      }

      return true
    })
  }, [recipes, searchQuery, selectedCategory, selectedTag, selectedEquipment, onlyBatchCooking, onlyFreezable])

  // Open modal handler
  const handleOpenRecipeModal = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe)
    setModalServings(recipe.servings || 1)
  }

  // Modal nutrient calculations
  const modalNutrients = useMemo(() => {
    if (!selectedRecipe) return null

    let totalKcal = 0
    let totalProt = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0

    selectedRecipe.ingredients.forEach((ing) => {
      const factor = ing.quantityG / 100
      totalKcal += ing.food.calories * factor
      totalProt += ing.food.proteinG * factor
      totalCarbs += ing.food.carbsG * factor
      totalFat += ing.food.fatG * factor
      totalFiber += (ing.food.fiberG || 0) * factor
    })

    const baseServings = selectedRecipe.servings || 1
    const scaleFactor = modalServings / baseServings

    const kcal = Math.round(totalKcal * scaleFactor)
    const prot = Math.round((totalProt * scaleFactor) * 10) / 10
    const carbs = Math.round((totalCarbs * scaleFactor) * 10) / 10
    const fat = Math.round((totalFat * scaleFactor) * 10) / 10
    const fiber = Math.round((totalFiber * scaleFactor) * 10) / 10

    const totalMacroCal = (prot * 4) + (carbs * 4) + (fat * 9)
    const pPct = totalMacroCal > 0 ? Math.round((prot * 4 / totalMacroCal) * 100) : 30
    const cPct = totalMacroCal > 0 ? Math.round((carbs * 4 / totalMacroCal) * 100) : 40
    const fPct = totalMacroCal > 0 ? Math.max(0, 100 - pPct - cPct) : 30

    return {
      kcal,
      prot,
      carbs,
      fat,
      fiber,
      pPct,
      cPct,
      fPct,
      scaleFactor,
    }
  }, [selectedRecipe, modalServings])

  return (
    <div className="space-y-6 pb-24">
      {/* Header bar */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ChefHat className="h-6 w-6 text-blue-600" />
            <span>Recetario Clínico & Culinario</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Platos calculados con desglose exacto de macronutrientes e instrucciones paso a paso para pautas dietéticas ({recipes.length} recetas).
          </p>
        </div>

        <Link href="/dashboard/recipes/new">
          <Button className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs h-10 px-5 text-xs active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            <span>Crear Nueva Receta</span>
          </Button>
        </Link>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de plato o ingrediente (ej. salmón, lentejas, avena, pollo)..."
            className="pl-10 h-10 rounded-2xl bg-slate-50/60 border-slate-200 text-xs font-semibold focus:ring-blue-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 medical-scrollbar">
          {CATEGORY_CHIPS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-[0.97] ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 5.7 Dietary Tags & Equipment Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 text-2xs">
          <span className="text-gray-400 font-bold uppercase text-[10px] mr-1">Filtros 5.7:</span>
          
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-2.5 py-1 rounded-xl font-bold bg-gray-100 text-gray-700 border-0 focus:ring-1 focus:ring-blue-500 text-2xs cursor-pointer"
          >
            <option value="ALL">Todas las etiquetas dietéticas</option>
            <option value="VEGANO">Vegano</option>
            <option value="SIN_GLUTEN">Sin Gluten</option>
            <option value="SIN_LACTOSA">Sin Lactosa</option>
            <option value="FODMAP">FODMAP / Digestivo</option>
            <option value="BAJO_SODIO">Bajo en Sodio</option>
            <option value="APTO_DIABETICO">Apto Diabético</option>
          </select>

          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="px-2.5 py-1 rounded-xl font-bold bg-gray-100 text-gray-700 border-0 focus:ring-1 focus:ring-blue-500 text-2xs cursor-pointer"
          >
            <option value="ALL">Todo el equipamiento</option>
            <option value="AIRFRYER">Airfryer / Freidora de aire</option>
            <option value="THERMOMIX">Thermomix / Robot</option>
            <option value="HORNO">Horno</option>
            <option value="SARTEN">Sartén / Plancha</option>
            <option value="OLLA_RAPIDA">Olla Rápida / Exprés</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyBatchCooking(!onlyBatchCooking)}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
              onlyBatchCooking ? 'bg-purple-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Batch Cooking
          </button>

          <button
            type="button"
            onClick={() => setOnlyFreezable(!onlyFreezable)}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
              onlyFreezable ? 'bg-sky-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Congelable
          </button>
        </div>
      </div>

      {/* Recipes Cards Grid */}
      {filteredRecipes.length === 0 ? (
        <Card className="text-center py-16 rounded-3xl border-gray-200">
          <CardContent>
            <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No se encontraron recetas</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Prueba a buscar con otro término o selecciona otra categoría.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Todas')
              }}
              className="rounded-2xl text-xs font-bold"
            >
              Restablecer Filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => {
            let totalKcal = 0
            let totalProt = 0
            let totalCarbs = 0
            let totalFat = 0
            let totalFiber = 0

            recipe.ingredients.forEach((ing) => {
              const factor = ing.quantityG / 100
              totalKcal += ing.food.calories * factor
              totalProt += ing.food.proteinG * factor
              totalCarbs += ing.food.carbsG * factor
              totalFat += ing.food.fatG * factor
              totalFiber += (ing.food.fiberG || 0) * factor
            })

            const servings = recipe.servings || 1
            const kcalPerServing = Math.round(totalKcal / servings)
            const protPerServing = Math.round((totalProt / servings) * 10) / 10
            const carbsPerServing = Math.round((totalCarbs / servings) * 10) / 10
            const fatPerServing = Math.round((totalFat / servings) * 10) / 10
            const fiberPerServing = Math.round((totalFiber / servings) * 10) / 10

            const totalMacroCal = (protPerServing * 4) + (carbsPerServing * 4) + (fatPerServing * 9)
            const pPct = totalMacroCal > 0 ? Math.round((protPerServing * 4 / totalMacroCal) * 100) : 30
            const cPct = totalMacroCal > 0 ? Math.round((carbsPerServing * 4 / totalMacroCal) * 100) : 40
            const fPct = totalMacroCal > 0 ? Math.max(0, 100 - pPct - cPct) : 30

            return (
              <Card
                key={recipe.id}
                onClick={() => handleOpenRecipeModal(recipe)}
                className="flex flex-col hover:shadow-lg transition-all rounded-3xl border-gray-200 overflow-hidden hover:border-blue-300 cursor-pointer group bg-white"
              >
                {/* Photo header */}
                {recipe.imageUrl && (
                  <div className="h-44 w-full bg-gray-100 overflow-hidden relative">
                    <FoodImage
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      category={recipe.category || 'Comidas'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 text-gray-900 text-2xs font-extrabold rounded-full px-2.5 py-0.5 backdrop-blur-xs">
                        {recipe.category || 'General'}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-black text-blue-950 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1 border border-blue-100">
                        <Flame className="h-3.5 w-3.5 text-blue-600" />
                        {kcalPerServing} kcal
                      </span>
                    </div>
                  </div>
                )}

                <CardHeader className="p-4 pb-2">
                  {!recipe.imageUrl && (
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-2xs rounded-full px-2.5 font-bold">
                        {recipe.category || 'General'}
                      </Badge>
                      <span className="text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-blue-600" />
                        {kcalPerServing} kcal/ración
                      </span>
                    </div>
                  )}

                  <CardTitle className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {recipe.name}
                  </CardTitle>

                  {recipe.description && (
                    <CardDescription className="line-clamp-2 mt-1 text-2xs text-gray-500">
                      {recipe.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-3">
                  {/* Servings, Time, Equipment and 5.7 Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-2xs text-gray-500 font-medium flex-wrap">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        <Users className="h-3 w-3 text-gray-400" />
                        {servings} {servings === 1 ? 'ración' : 'raciones'}
                      </span>
                      {(recipe.prepTimeMin || recipe.cookTimeMin) && (
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {(recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0)} min
                        </span>
                      )}
                      {recipe.difficulty && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {recipe.difficulty}
                        </span>
                      )}
                      {recipe.estimatedCost && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                          {recipe.estimatedCost} €/rac
                        </span>
                      )}
                    </div>

                    {/* Equipment & Batch Tags */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {recipe.isBatchCooking && (
                        <Badge className="bg-purple-100 text-purple-900 border-0 text-[9px] font-bold py-0 px-1.5 rounded-md">
                          Batch Cooking
                        </Badge>
                      )}
                      {recipe.isFreezable && (
                        <Badge className="bg-sky-100 text-sky-900 border-0 text-[9px] font-bold py-0 px-1.5 rounded-md">
                          <Snowflake className="h-4 w-4" /> Congelable
                        </Badge>
                      )}
                      {(() => {
                        try {
                          const eq: string[] = recipe.equipmentJson ? JSON.parse(recipe.equipmentJson) : []
                          return eq.map((item) => (
                            <span key={item} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase">
                              {item}
                            </span>
                          ))
                        } catch {
                          return null
                        }
                      })()}
                    </div>
                  </div>

                  {/* Macros Per Serving */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 rounded-xl bg-blue-50/70 border border-blue-100">
                        <span className="text-[9px] uppercase font-bold text-blue-700 block">Prot</span>
                        <span className="text-xs font-black text-blue-900">{protPerServing}g</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-amber-50/70 border border-amber-100">
                        <span className="text-[9px] uppercase font-bold text-amber-700 block">Carb</span>
                        <span className="text-xs font-black text-amber-900">{carbsPerServing}g</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-rose-50/70 border border-rose-100">
                        <span className="text-[9px] uppercase font-bold text-rose-700 block">Grasa</span>
                        <span className="text-xs font-black text-rose-900">{fatPerServing}g</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-sky-50/70 border border-sky-100">
                        <span className="text-[9px] uppercase font-bold text-sky-700 block">Fibra</span>
                        <span className="text-xs font-black text-sky-900">{fiberPerServing}g</span>
                      </div>
                    </div>

                    {/* Macro Split Bar */}
                    <div className="space-y-0.5">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${pPct}%` }} className="bg-blue-600 h-full" title={`Proteína: ${pPct}%`} />
                        <div style={{ width: `${cPct}%` }} className="bg-amber-500 h-full" title={`Carbohidratos: ${cPct}%`} />
                        <div style={{ width: `${fPct}%` }} className="bg-rose-500 h-full" title={`Grasas: ${fPct}%`} />
                      </div>
                      <div className="flex justify-between text-[9px] font-semibold text-gray-500 px-0.5">
                        <span className="text-blue-700">{pPct}% P</span>
                        <span className="text-amber-700">{cPct}% C</span>
                        <span className="text-rose-700">{fPct}% G</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t bg-gray-50/60 p-3 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenRecipeModal(recipe)
                    }}
                    className="flex-1 rounded-xl font-bold text-xs border-gray-200 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300"
                  >
                    Vista Rápida
                  </Button>
                  <Link
                    href={`/dashboard/recipes/${recipe.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-center py-2 px-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
                  >
                    Ficha Completa <ArrowRight className="h-[1em] w-[1em] shrink-0" />
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE RECIPE DETAIL MODAL (No overlapping, zero scroll artifacts)
          ========================================================================= */}
      {selectedRecipe && modalNutrients && (
        <ModalPortal>
        <div
          className="fixed inset-0 z-50 modal-backdrop bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 duration-200"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header photo & Title */}
            {selectedRecipe.imageUrl && (
              <div className="relative h-56 w-full bg-gray-100 overflow-hidden shrink-0">
                <FoodImage
                  src={selectedRecipe.imageUrl}
                  alt={selectedRecipe.name}
                  category={selectedRecipe.category || 'Comidas'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className="bg-white/90 text-gray-900 text-2xs font-extrabold rounded-full px-2.5">
                      {selectedRecipe.category || 'General'}
                    </Badge>
                    {(selectedRecipe.prepTimeMin || selectedRecipe.cookTimeMin) && (
                      <span className="text-2xs text-white/90 font-semibold flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        <Clock className="h-3 w-3" />
                        {(selectedRecipe.prepTimeMin || 0) + (selectedRecipe.cookTimeMin || 0)} min preparación
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black leading-tight drop-shadow-sm">
                    {selectedRecipe.name}
                  </h2>
                </div>
              </div>
            )}

            {!selectedRecipe.imageUrl && (
              <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="text-2xs rounded-full px-2.5 font-bold mb-1">
                    {selectedRecipe.category || 'General'}
                  </Badge>
                  <h2 className="text-xl font-black text-gray-900">{selectedRecipe.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content area */}
            <div className="p-6 space-y-5 flex-1">
              {selectedRecipe.description && (
                <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  {selectedRecipe.description}
                </p>
              )}

              {/* Servings Scaler + Nutritional Summary */}
              <div className="p-4 rounded-3xl bg-blue-50/90 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                    Desglose Nutricional Calculado
                  </span>

                  {/* Servings controller */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200">
                    <span className="text-2xs font-bold text-gray-600">Raciones:</span>
                    {[1, 2, 4].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setModalServings(s)}
                        className={`w-6 h-6 rounded-lg text-xs font-black transition-all ${
                          modalServings === s
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Calorías</span>
                    <span className="text-lg font-black text-blue-950 block">{modalNutrients.kcal}</span>
                    <span className="text-[9px] text-gray-400 font-semibold">kcal netas</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Proteína</span>
                    <span className="text-lg font-black text-blue-900 block">{modalNutrients.prot}g</span>
                    <span className="text-[9px] text-blue-600 font-bold">{modalNutrients.pPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-amber-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Carbos</span>
                    <span className="text-lg font-black text-amber-900 block">{modalNutrients.carbs}g</span>
                    <span className="text-[9px] text-amber-600 font-bold">{modalNutrients.cPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-rose-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Grasas</span>
                    <span className="text-lg font-black text-rose-900 block">{modalNutrients.fat}g</span>
                    <span className="text-[9px] text-rose-600 font-bold">{modalNutrients.fPct}%</span>
                  </div>
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Utensils className="h-3.5 w-3.5 text-blue-600" />
                  <span>Ingredientes Necesarios ({selectedRecipe.ingredients.length})</span>
                </h4>

                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 border-b text-[11px] font-bold uppercase text-gray-500">
                      <tr>
                        <th className="px-3.5 py-2">Ingrediente</th>
                        <th className="px-3.5 py-2 text-right">Cantidad</th>
                        <th className="px-3.5 py-2 text-right">Calorías</th>
                        <th className="px-3.5 py-2 text-right">Prot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedRecipe.ingredients.map((ing) => {
                        const scaledQty = Math.round(ing.quantityG * modalNutrients.scaleFactor)
                        const ingFactor = scaledQty / 100
                        const kcal = Math.round(ing.food.calories * ingFactor)
                        const prot = (ing.food.proteinG * ingFactor).toFixed(1)

                        return (
                          <tr key={ing.id} className="hover:bg-gray-50/60">
                            <td className="px-3.5 py-2 font-medium text-gray-900">{ing.food.name}</td>
                            <td className="px-3.5 py-2 text-right font-bold text-blue-950">{scaledQty} g</td>
                            <td className="px-3.5 py-2 text-right text-gray-600">{kcal} kcal</td>
                            <td className="px-3.5 py-2 text-right text-blue-700 font-semibold">{prot} g</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions Paso a Paso */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span>Elaboración y Preparación Paso a Paso</span>
                </h4>

                <div className="space-y-2">
                  {selectedRecipe.instructions
                    .split('\n')
                    .filter((l) => l.trim().length > 0)
                    .map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/80 border border-gray-200/60"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-2xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-gray-800 leading-relaxed font-medium">
                          {line.replace(/^\d+[\.\)]\s*/, '')}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3 shrink-0">
              <Link
                href={`/dashboard/recipes/${selectedRecipe.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
              >
                <span>Abrir en página completa</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-xl text-xs font-bold"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Imprimir Receta
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSelectedRecipe(null)}
                  className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
