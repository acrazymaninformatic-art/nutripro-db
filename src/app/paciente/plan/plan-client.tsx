'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CalendarDays,
  Calendar,
  UtensilsCrossed,
  ChefHat,
  ShoppingCart,
  Printer,
  Sparkles,
  Info,
  Clock,
  Flame,
  ArrowLeft,
  X,
  Layers,
} from 'lucide-react'
import Link from 'next/link'

interface FoodItem {
  id: number
  name: string
  category?: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  servingSize?: number
  servingUnit?: string
}

interface RecipeItem {
  id: string
  name: string
  instructions: string
  servings: number
  prepTimeMin?: number | null
  cookTimeMin?: number | null
  difficulty?: string | null
  equipmentJson?: string | null
  dietaryTagsJson?: string | null
  isBatchCooking?: boolean | null
  isFreezable?: boolean | null
  ingredients?: Array<{
    id: string
    quantityG: number
    notes?: string | null
    food?: FoodItem | null
  }>
}

interface MealItemData {
  id: string
  quantityG: number
  servings: number
  exchangeServings?: number | null
  exchangeGroup?: string | null
  portionMeasureName?: string | null
  portionMeasureGrams?: number | null
  isAlternative?: boolean
  notes?: string | null
  food?: FoodItem | null
  recipe?: RecipeItem | null
}

interface MealData {
  id: string
  mealType: string
  order: number
  isOptionB?: boolean
  optionGroup?: string | null
  isCheatMeal?: boolean
  timingType?: string
  items: MealItemData[]
}

interface DayData {
  id: string
  dayNumber: number
  customName?: string | null
  meals: MealData[]
}

interface PlanData {
  id: string
  name: string
  startDate: string | Date
  endDate?: string | Date | null
  targetKcal: number
  hideCaloriesTCA: boolean
  notes?: string | null
  planningModel?: string | null
  currentPhase?: string | null
  eatingOutGuide?: string | null
  hydrationTargetLiters?: number | null
  days: DayData[]
}

interface Props {
  plan: PlanData
  visibleRecipes?: RecipeItem[]
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MID_MORNING: 'Media Mañana',
  LUNCH: 'Comida',
  SNACK: 'Merienda',
  DINNER: 'Cena',
  LATE_SNACK: 'Recena',
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function PlanClient({ plan, visibleRecipes }: Props) {
  // Determine current day of week (1=Monday, 7=Sunday)
  const currentJsDay = new Date().getDay()
  const todayDayNumber = currentJsDay === 0 ? 7 : currentJsDay

  function getSupermarketAisle(category?: string | null): string {
    const c = (category || '').toLowerCase()
    if (c.includes('fruta') || c.includes('verdura') || c.includes('hortaliza')) {
      return '🥦 Frutas y Verduras Frescas'
    }
    if (c.includes('carne') || c.includes('pollo') || c.includes('pescado') || c.includes('marisco') || c.includes('huevo')) {
      return '🥩 Carnes, Pescados y Huevos'
    }
    if (c.includes('lacteo') || c.includes('lácteo') || c.includes('leche') || c.includes('queso') || c.includes('yogur')) {
      return '🧀 Lácteos y Refrigerados'
    }
    if (c.includes('legumbre') || c.includes('cereal') || c.includes('arroz') || c.includes('pasta') || c.includes('pan') || c.includes('avena')) {
      return '🌾 Legumbres, Cereales y Pastas'
    }
    if (c.includes('fruto seco') || c.includes('semilla') || c.includes('aceite') || c.includes('grasa')) {
      return '🥜 Aceites, Frutos Secos y Semillas'
    }
    return '🥫 Despensa, Conservas y Condimentos'
  }

  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'recipes' | 'shopping' | 'guide'>('today')
  const [selectedRecipe, setSelectedRecipe] = useState<{
    name: string
    instructions?: string
    prepTimeMin?: number | null
    cookTimeMin?: number | null
    servings?: number
    difficulty?: string | null
    equipmentJson?: string | null
    isBatchCooking?: boolean | null
    isFreezable?: boolean | null
    ingredients?: Array<{ name: string; quantityG: number }>
  } | null>(null)

  // Collect all unique recipes from plan and visible catalog
  const recipeMap = new Map<string, RecipeItem>()
  plan.days.forEach((d) => {
    d.meals.forEach((m) => {
      m.items.forEach((it) => {
        if (it.recipe) {
          recipeMap.set(it.recipe.id, it.recipe)
        }
      })
    })
  })
  if (visibleRecipes) {
    visibleRecipes.forEach((r) => {
      if (!recipeMap.has(r.id)) {
        recipeMap.set(r.id, r)
      }
    })
  }
  const allRecipeCards = Array.from(recipeMap.values())

  // Find today's day plan
  const todayDay = plan.days.find((d) => d.dayNumber === todayDayNumber) || plan.days[0]

  // Compute shopping list grouped by supermarket aisles (EVSoftware 5.8: lista normal sin casillas de verificación)
  const shoppingItemsByCategory: Record<string, Array<{ name: string; totalG: number }>> = {}
  plan.days.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        const name = item.food?.name || item.recipe?.name || 'Alimento'
        const aisle = getSupermarketAisle(item.food?.category)
        if (!shoppingItemsByCategory[aisle]) {
          shoppingItemsByCategory[aisle] = []
        }
        const existing = shoppingItemsByCategory[aisle].find((x) => x.name === name)
        if (existing) {
          existing.totalG += Math.round(item.quantityG)
        } else {
          shoppingItemsByCategory[aisle].push({ name, totalG: Math.round(item.quantityG) })
        }
      })
    })
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Print */}
      <div className="flex items-center justify-between">
        <Link
          href="/paciente"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors btn-tactile"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="rounded-2xl text-xs gap-1.5 font-bold print:hidden btn-tactile hover-lift"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir / Guardar PDF</span>
        </Button>
      </div>

      {/* Plan Header */}
      <Card className="glass-card hover-lift rounded-3xl border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs animate-slide-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="teal" className="text-xs font-bold rounded-full">
                Plan Activo Publicado
              </Badge>
              {plan.targetKcal > 0 && !plan.hideCaloriesTCA && (
                <Badge variant="outline" className="text-xs font-mono tabular-nums font-bold rounded-full bg-blue-50/80 text-blue-800 border-blue-200">
                  ⚡ ~{Math.round(plan.targetKcal)} kcal/día
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight">
              {plan.name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Pauta nutricional personalizada por Eva Vidal</span>
            </p>
          </div>
        </div>

        {plan.notes && (
          <div className="mt-5 p-4 rounded-2xl bg-blue-50/60 border border-blue-100/90 text-xs text-blue-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-blue-900">Indicaciones de Eva:</span>
              <span className="leading-relaxed text-slate-700">{plan.notes}</span>
            </div>
          </div>
        )}

        {/* View Switcher Tabs (Segmented Control) */}
        <div className="mt-6 pt-5 border-t border-slate-100 print:hidden">
          <div className="p-1.5 bg-slate-100/90 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-slate-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'today'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Hoy ({DAY_NAMES[todayDayNumber - 1]})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('week')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'week'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Semana Completa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recipes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'recipes'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Recetario ({allRecipeCards.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shopping')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'shopping'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Lista de la Compra</span>
            </button>

            {plan.eatingOutGuide && (
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'guide'
                    ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Comer Fuera & Viajes</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* VISTA 1: HOY EN MI PLAN */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>Comidas de Hoy: {DAY_NAMES[todayDayNumber - 1]}</span>
              </h2>
              <p className="text-xs text-gray-500">
                Toca cualquier plato marcado para abrir la receta con ingredientes y modo de preparación
              </p>
            </div>
          </div>

          {!todayDay || todayDay.meals.length === 0 ? (
            <Card className="p-8 text-center text-xs text-gray-400">
              No hay comidas programadas para hoy.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayDay.meals.map((meal) => {
                const label = MEAL_LABELS[meal.mealType] || meal.mealType
                return (
                  <Card key={meal.id} className="rounded-3xl border-gray-200 shadow-2xs overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/70 p-4 border-b border-gray-100">
                      <CardTitle className="text-sm font-bold text-blue-950 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{label}</span>
                          {meal.isOptionB && (
                            <Badge className="bg-amber-100 text-amber-900 border-0 text-[10px] font-bold">
                              Opción B
                            </Badge>
                          )}
                          {meal.timingType === 'PRE_WORKOUT' && (
                            <Badge className="bg-blue-100 text-blue-900 border-0 text-[10px] font-bold">
                              ⚡ Pre-Entreno
                            </Badge>
                          )}
                          {meal.timingType === 'POST_WORKOUT' && (
                            <Badge className="bg-emerald-100 text-emerald-900 border-0 text-[10px] font-bold">
                              🏋️ Post-Entreno
                            </Badge>
                          )}
                          {meal.isCheatMeal && (
                            <Badge className="bg-purple-100 text-purple-900 border-0 text-[10px] font-bold">
                              🍽️ Comida Libre
                            </Badge>
                          )}
                        </div>
                        <UtensilsCrossed className="w-3.5 h-3.5 text-blue-600" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {meal.items.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Comida libre / según pauta</p>
                      ) : (
                        meal.items.map((item) => {
                          const name = item.food?.name || item.recipe?.name || 'Alimento'
                          const isRecipe = Boolean(item.recipe)

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (item.recipe) {
                                  setSelectedRecipe({
                                    name: item.recipe.name,
                                    instructions: item.recipe.instructions,
                                    prepTimeMin: item.recipe.prepTimeMin,
                                    cookTimeMin: item.recipe.cookTimeMin,
                                    servings: item.recipe.servings,
                                    difficulty: item.recipe.difficulty,
                                    equipmentJson: item.recipe.equipmentJson,
                                    isBatchCooking: item.recipe.isBatchCooking,
                                    isFreezable: item.recipe.isFreezable,
                                  })
                                }
                              }}
                              className={`p-3 rounded-2xl border transition-all ${
                                isRecipe
                                  ? 'bg-amber-50/50 border-amber-200/70 hover:bg-amber-100/60 cursor-pointer shadow-2xs'
                                  : 'bg-gray-50 border-gray-100'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-gray-900 leading-snug">{name}</span>
                                {isRecipe && (
                                  <Badge className="bg-amber-600 text-white border-0 text-3xs font-black rounded-full shrink-0">
                                    RECETA
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-2xs text-gray-500 mt-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-gray-700">{Math.round(item.quantityG)}g</span>
                                  {item.portionMeasureName && (
                                    <span className="text-[10px] text-gray-400">
                                      ({item.portionMeasureName})
                                    </span>
                                  )}
                                  {item.exchangeServings && (
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                                      {item.exchangeServings} rac.
                                    </span>
                                  )}
                                </div>
                                {item.food && !plan.hideCaloriesTCA && (
                                  <span className="text-blue-700 font-bold">
                                    {Math.round((item.food.calories * item.quantityG) / (item.food.servingSize || 100))} kcal
                                  </span>
                                )}
                              </div>

                              {item.notes && (
                                <p className="text-3xs text-gray-500 italic mt-1">{item.notes}</p>
                              )}
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: SEMANA COMPLETA */}
      {activeTab === 'week' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {plan.days.map((day) => {
              const dayName = DAY_NAMES[day.dayNumber - 1] || `Día ${day.dayNumber}`
              const isToday = day.dayNumber === todayDayNumber

              return (
                <div
                  key={day.id}
                  className={`flex flex-col rounded-3xl bg-white border shadow-xs overflow-hidden ${
                    isToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
                  }`}
                >
                  <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-xs font-bold text-gray-900 block uppercase tracking-wider">
                      {dayName}
                    </span>
                    {isToday && <span className="text-3xs font-black text-blue-700 uppercase">HOY</span>}
                  </div>

                  <div className="p-3 space-y-3 flex-1 flex flex-col">
                    {day.meals.map((meal) => {
                      const mealLabel = MEAL_LABELS[meal.mealType] || meal.mealType
                      return (
                        <div key={meal.id} className="rounded-2xl bg-gray-50 p-2 border border-gray-100 text-xs space-y-1">
                          <span className="font-bold text-blue-900 text-[10px] uppercase block border-b border-gray-200/60 pb-0.5">
                            {mealLabel}
                          </span>
                          {meal.items.map((item) => (
                            <div key={item.id} className="text-gray-700 flex flex-col justify-between py-0.5">
                              <span className="font-medium text-gray-900 truncate text-[11px]" title={item.food?.name || item.recipe?.name}>
                                {item.food?.name || item.recipe?.name}
                              </span>
                              <span className="text-[10px] text-gray-500 font-semibold">{Math.round(item.quantityG)}g</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VISTA 3: LISTA DE LA COMPRA (PDF pág 5 y 17: lista normal, sin casillas) */}
      {activeTab === 'shopping' && (
        <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span>Lista de la Compra Semanal</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Organizada por pasillos y categorías. Solo para consulta durante tus compras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(shoppingItemsByCategory).map(([category, items]) => (
              <div key={category} className="space-y-2 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-gray-200 pb-1.5">
                  {category}
                </h4>
                <ul className="space-y-1 text-xs text-gray-700 divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <li key={idx} className="pt-1 flex items-center justify-between">
                      <span className="font-medium text-gray-800 truncate pr-2">{it.name}</span>
                      <span className="text-2xs font-bold text-gray-500 whitespace-nowrap">{it.totalG}g</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* VISTA 4: RECETAS DEL PLAN Y RECETARIO VISIBLE (Requerimiento 3.2 Recetas Paciente) */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-blue-600" />
              <span>Recetas de tu Plan y Recetario Clínico ({allRecipeCards.length})</span>
            </h2>
            <p className="text-xs text-gray-500">
              Recetas pautadas y elaboradas por Eva Vidal con ingredientes y modo de preparación interactivo.
            </p>
          </div>

          {allRecipeCards.length === 0 ? (
            <Card className="p-8 text-center text-xs text-gray-400 bg-white rounded-3xl">
              No hay recetas catalogadas en este plan.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allRecipeCards.map((rcp) => (
                <Card
                  key={rcp.id}
                  className="rounded-3xl border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        {rcp.servings} {rcp.servings === 1 ? 'ración' : 'raciones'}
                      </span>
                      {rcp.prepTimeMin && (
                        <span className="text-2xs text-gray-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {rcp.prepTimeMin} min
                        </span>
                      )}
                      {rcp.difficulty && (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {rcp.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{rcp.name}</h3>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      {rcp.isBatchCooking && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">
                          Batch Cooking
                        </span>
                      )}
                      {rcp.isFreezable && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-900">
                          ❄️ Congelable
                        </span>
                      )}
                      {(() => {
                        try {
                          const eq: string[] = rcp.equipmentJson ? JSON.parse(rcp.equipmentJson) : []
                          return eq.map((item) => (
                            <span key={item} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                              {item}
                            </span>
                          ))
                        } catch {
                          return null
                        }
                      })()}
                    </div>

                    {rcp.ingredients && rcp.ingredients.length > 0 && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {rcp.ingredients.map((i) => i.food?.name || 'Ingrediente').join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedRecipe({
                        name: rcp.name,
                        instructions: rcp.instructions,
                        servings: rcp.servings,
                        prepTimeMin: rcp.prepTimeMin,
                        cookTimeMin: rcp.cookTimeMin,
                        difficulty: rcp.difficulty,
                        equipmentJson: rcp.equipmentJson,
                        isBatchCooking: rcp.isBatchCooking,
                        isFreezable: rcp.isFreezable,
                        ingredients: rcp.ingredients?.map((i) => ({
                          name: i.food?.name || 'Ingrediente',
                          quantityG: i.quantityG,
                        })),
                      })
                    }
                    className="mt-4 w-full rounded-2xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs"
                  >
                    Ver preparación e ingredientes
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA 5: GUÍA PARA COMER FUERA, VIAJES Y CELEBRACIONES */}
      {activeTab === 'guide' && plan.eatingOutGuide && (
        <Card className="rounded-3xl border border-blue-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Guía para Comer Fuera, Viajes y Celebraciones</h2>
              <p className="text-xs text-gray-500">Pautas flexibles elaboradas por Eva Vidal para tus comidas sociales</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
            {plan.eatingOutGuide}
          </div>
        </Card>
      )}

      {/* Modal Ficha de Receta Interactiva */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs">
                  <ChefHat className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 truncate">{selectedRecipe.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipe(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar receta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-gray-700 pr-1">
              <div className="flex items-center gap-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 flex-wrap">
                {selectedRecipe.prepTimeMin && (
                  <span className="flex items-center gap-1 font-semibold text-amber-900">
                    <Clock className="w-3.5 h-3.5" /> Prep: {selectedRecipe.prepTimeMin} min
                  </span>
                )}
                {selectedRecipe.cookTimeMin && (
                  <span className="flex items-center gap-1 font-semibold text-amber-900">
                    <Flame className="w-3.5 h-3.5" /> Cocción: {selectedRecipe.cookTimeMin} min
                  </span>
                )}
                {selectedRecipe.servings && (
                  <span className="font-semibold text-amber-900">
                    Raciones: {selectedRecipe.servings}
                  </span>
                )}
                {selectedRecipe.difficulty && (
                  <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-full text-[10px]">
                    {selectedRecipe.difficulty}
                  </span>
                )}
              </div>

              {/* Equipment & Batch badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedRecipe.isBatchCooking && (
                  <Badge className="bg-purple-100 text-purple-900 border-0 text-[10px] font-bold">
                    Batch Cooking
                  </Badge>
                )}
                {selectedRecipe.isFreezable && (
                  <Badge className="bg-sky-100 text-sky-900 border-0 text-[10px] font-bold">
                    ❄️ Congelable
                  </Badge>
                )}
                {(() => {
                  try {
                    const eq: string[] = selectedRecipe.equipmentJson ? JSON.parse(selectedRecipe.equipmentJson) : []
                    return eq.map((item) => (
                      <span key={item} className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 uppercase">
                        {item}
                      </span>
                    ))
                  } catch {
                    return null
                  }
                })()}
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-xs mb-2 uppercase tracking-wide">
                  Instrucciones de preparación:
                </h4>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70 leading-relaxed whitespace-pre-wrap">
                  {selectedRecipe.instructions || 'Sin instrucciones adicionales registradas.'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecipe(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cerrar receta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
