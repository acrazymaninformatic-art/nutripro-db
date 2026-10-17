'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Search,
  BookOpen,
  ChevronRight,
  Droplets,
  Scale,
} from 'lucide-react'
import Link from 'next/link'
import { getFoodImage, FALLBACK_FOOD_SVG } from '@/lib/nutrition'
import { PlanDossierPdf } from '@/components/nutrition/plan-dossier-pdf'

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
  imageUrl?: string | null
  equipmentJson?: string | null
  dietaryTagsJson?: string | null
  isBatchCooking?: boolean | null
  isFreezable?: boolean | null
  ingredients?: Array<{
    id?: string
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

interface PatientSummary {
  firstName: string
  lastName: string
  sex?: string | null
  heightCm?: number | null
  allergies?: string | null
  intolerances?: string | null
}

interface PlanData {
  id: string
  name: string
  startDate: string | Date
  endDate?: string | Date | null
  targetKcal: number
  targetProteinG?: number | null
  targetCarbsG?: number | null
  targetFatG?: number | null
  hideCaloriesTCA: boolean
  notes?: string | null
  planningModel?: string | null
  currentPhase?: string | null
  eatingOutGuide?: string | null
  hydrationTargetLiters?: number | null
  patient?: PatientSummary | null
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

function getPreparationTip(foodName: string, category?: string | null, customNotes?: string | null): string {
  if (customNotes && customNotes.trim() && !customNotes.toLowerCase().includes('al gusto')) {
    return customNotes.trim()
  }

  const n = (foodName || '').toLowerCase()
  if (n.includes('pollo') || n.includes('pavo')) {
    return 'A la plancha con unas gotas de AOVE, orégano y zumo de limón natural.'
  }
  if (n.includes('salmón') || n.includes('salmon')) {
    return 'A la plancha dorando 3 min por lado a fuego medio-alto con eneldo fresco.'
  }
  if (n.includes('merluza') || n.includes('dorada') || n.includes('lubina') || n.includes('bacalao')) {
    return 'Al horno a 180°C con rodajitas de limón o al vapor con ajo y perejil picado.'
  }
  if (n.includes('ternera') || n.includes('solomillo') || n.includes('lomo')) {
    return 'A la plancha bien caliente vuelta y vuelta (al punto) con pimienta negra recién molida.'
  }
  if (n.includes('huevo') || n.includes('clara')) {
    return 'Poché (3 min en agua hirviendo), cocido 8 min o revuelto en sartén antiadherente.'
  }
  if (n.includes('tofu') || n.includes('tempeh')) {
    return 'Marinado en salsa de soja baja en sal y dorado a la plancha hasta que quede crujiente.'
  }
  if (n.includes('arroz')) {
    return 'Cocido al dente en agua hirviendo con un diente de ajo machacado y hoja de laurel.'
  }
  if (n.includes('pasta') || n.includes('espagueti') || n.includes('macarron') || n.includes('penne')) {
    return 'Cocida al dente en abundante agua con sal; escurrir sin lavar con agua fría.'
  }
  if (n.includes('avena')) {
    return 'Porridge templado cocinado en agua o bebida vegetal con una pizca de canela.'
  }
  if (n.includes('patata') || n.includes('boniato')) {
    return 'Cocida al vapor o asada en láminas al horno con piel durante 25 minutos.'
  }
  if (n.includes('lenteja') || n.includes('garbanzo') || n.includes('alubia')) {
    return 'Guisadas con sofrito de verduras (cebolla, pimiento, tomate) sin grasas añadidas.'
  }
  if (n.includes('ensalada') || n.includes('lechuga') || n.includes('espinaca') || n.includes('canónigo')) {
    return 'Lavadas y aliñadas en crudo con una cucharada de AOVE, vinagre de manzana y sal.'
  }
  if (n.includes('yogur') || n.includes('kefir') || n.includes('queso')) {
    return 'Tomar fresco; puedes combinar con frutos secos picados o fruta fresca.'
  }
  return 'Preparar respetando las cantidades pautadas. Cocinado saludable al vapor, horno o plancha.'
}

export function PlanClient({ plan, visibleRecipes }: Props) {
  const currentJsDay = new Date().getDay()
  const todayDayNumber = currentJsDay === 0 ? 7 : currentJsDay

  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'recipes' | 'shopping' | 'guide'>('today')
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(todayDayNumber)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<{
    name: string
    instructions?: string
    imageUrl?: string | null
    prepTimeMin?: number | null
    cookTimeMin?: number | null
    servings?: number
    difficulty?: string | null
    equipmentJson?: string | null
    isBatchCooking?: boolean | null
    isFreezable?: boolean | null
    ingredients?: Array<{ name: string; quantityG: number; notes?: string | null }>
  } | null>(null)

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

  const filteredRecipes = allRecipeCards.filter((r) => {
    if (!recipeSearch.trim()) return true
    const q = recipeSearch.toLowerCase()
    const nameMatch = r.name.toLowerCase().includes(q)
    const ingMatch = r.ingredients?.some((i) => i.food?.name.toLowerCase().includes(q))
    return nameMatch || ingMatch
  })

  // Selected day for the detailed view
  const currentSelectedDay =
    plan.days.find((d) => d.dayNumber === selectedDayNumber) || plan.days[0]

  // Compute shopping list grouped by supermarket aisles
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
    <div>
      <div className="space-y-6 animate-fade-in print:hidden">
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
              <span>Pauta nutricional y recetario clínico por Eva Vidal</span>
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
          <div className="p-1.5 bg-slate-100/90 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-slate-200/60 shadow-2xs scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Diario ({DAY_NAMES[selectedDayNumber - 1]})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('week')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Recetario Clínico ({allRecipeCards.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shopping')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
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

      {/* VISTA 1: DIARIO / HOY (Con selector de días y diseño rico con imágenes como el PDF) */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Day Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {plan.days.map((d) => {
              const dayName = DAY_NAMES[d.dayNumber - 1] || `Día ${d.dayNumber}`
              const isSelected = d.dayNumber === selectedDayNumber
              const isToday = d.dayNumber === todayDayNumber
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDayNumber(d.dayNumber)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{dayName}</span>
                  {isToday && (
                    <span
                      className={`text-3xs font-black px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      HOY
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {!currentSelectedDay || currentSelectedDay.meals.length === 0 ? (
            <Card className="p-12 text-center text-xs text-gray-400 bg-white rounded-3xl border border-slate-200">
              No hay tomas alimentarias registradas para este día.
            </Card>
          ) : (
            <div className="space-y-5">
              {currentSelectedDay.meals.map((meal) => {
                const label = MEAL_LABELS[meal.mealType] || meal.mealType
                let mealKcal = 0
                let mealProt = 0
                let mealCarbs = 0
                let mealFat = 0

                meal.items.forEach((it) => {
                  if (it.food && it.quantityG > 0) {
                    const factor = it.quantityG / (it.food.servingSize || 100)
                    mealKcal += it.food.calories * factor
                    mealProt += it.food.proteinG * factor
                    mealCarbs += it.food.carbsG * factor
                    mealFat += it.food.fatG * factor
                  }
                })

                return (
                  <Card key={meal.id} className="rounded-3xl border-slate-200/90 shadow-xs overflow-hidden bg-white">
                    {/* Meal Header */}
                    <CardHeader className="bg-gradient-to-r from-slate-50 via-sky-50/20 to-white px-5 py-3.5 border-b border-slate-100 flex flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                            {label}
                          </span>
                          <span className="text-3xs text-slate-400 uppercase tracking-wider font-semibold">
                            Toma pautada
                          </span>
                        </div>

                        {meal.isOptionB && (
                          <Badge className="bg-amber-100 text-amber-900 border-0 text-3xs font-black rounded-full">
                            Opción Alternativa B
                          </Badge>
                        )}
                        {meal.timingType === 'PRE_WORKOUT' && (
                          <Badge className="bg-sky-100 text-sky-900 border-0 text-3xs font-black rounded-full">
                            ⚡ Pre-Entreno
                          </Badge>
                        )}
                        {meal.timingType === 'POST_WORKOUT' && (
                          <Badge className="bg-emerald-100 text-emerald-900 border-0 text-3xs font-black rounded-full">
                            🏋️ Post-Entreno
                          </Badge>
                        )}
                        {meal.isCheatMeal && (
                          <Badge className="bg-purple-100 text-purple-900 border-0 text-3xs font-black rounded-full">
                            🍽️ Comida Libre
                          </Badge>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {plan.hideCaloriesTCA ? (
                          <span className="text-2xs font-extrabold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                            Pauta Equilibrada
                          </span>
                        ) : (
                          <div className="text-xs font-bold text-slate-800">
                            <span className="text-blue-700 font-extrabold">{Math.round(mealKcal)} kcal</span>
                            <span className="hidden sm:inline text-slate-400 font-normal ml-1">
                              ({mealProt.toFixed(0)}g P · {mealCarbs.toFixed(0)}g C · {mealFat.toFixed(0)}g G)
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    {/* Meal Items List with Photos & Prep Tips (Just like in the PDF / Admin) */}
                    <CardContent className="p-4 sm:p-5 divide-y divide-slate-100">
                      {meal.items.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">Comida libre o según pautas generales.</p>
                      ) : (
                        meal.items.map((item) => {
                          const foodName = item.food?.name || item.recipe?.name || 'Alimento'
                          const imageUrl = item.food
                            ? getFoodImage(item.food)
                            : item.recipe?.imageUrl || FALLBACK_FOOD_SVG
                          const prepTip = getPreparationTip(foodName, item.food?.category, item.notes)
                          const isRecipe = Boolean(item.recipe)

                          return (
                            <div
                              key={item.id}
                              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {/* HD Food Thumbnail */}
                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs shrink-0 relative">
                                  <img
                                    src={imageUrl}
                                    alt={foodName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    loading="eager"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = FALLBACK_FOOD_SVG
                                    }}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-sm text-slate-900 leading-tight">
                                      {foodName}
                                    </span>
                                    {isRecipe && (
                                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 border text-3xs font-black rounded-full">
                                        RECETA
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                                    💡 {prepTip}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 sm:justify-end shrink-0 pl-15 sm:pl-0">
                                <div className="text-left sm:text-right">
                                  <span className="inline-block px-2.5 py-1 rounded-xl font-black text-xs bg-blue-50 text-blue-900 border border-blue-200/80">
                                    {plan.hideCaloriesTCA ? '1 ración' : `${Math.round(item.quantityG)} g`}
                                  </span>
                                  {item.portionMeasureName && (
                                    <span className="block text-3xs text-slate-400 mt-0.5">
                                      ({item.portionMeasureName})
                                    </span>
                                  )}
                                </div>

                                {isRecipe && item.recipe && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedRecipe({
                                        name: item.recipe!.name,
                                        instructions: item.recipe!.instructions,
                                        imageUrl: item.recipe!.imageUrl,
                                        prepTimeMin: item.recipe!.prepTimeMin,
                                        cookTimeMin: item.recipe!.cookTimeMin,
                                        servings: item.recipe!.servings,
                                        difficulty: item.recipe!.difficulty,
                                        equipmentJson: item.recipe!.equipmentJson,
                                        isBatchCooking: item.recipe!.isBatchCooking,
                                        isFreezable: item.recipe!.isFreezable,
                                        ingredients: item.recipe!.ingredients?.map((i) => ({
                                          name: i.food?.name || 'Ingrediente',
                                          quantityG: i.quantityG,
                                          notes: i.notes,
                                        })),
                                      })
                                    }
                                    className="rounded-xl border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100 font-bold text-xs h-8 px-3 gap-1 shadow-2xs cursor-pointer active:scale-[0.97]"
                                  >
                                    <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Ver Receta</span>
                                  </Button>
                                )}
                              </div>
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

      {/* VISTA 2: SEMANA COMPLETA (Grid con subdivisiones limpias e imágenes) */}
      {activeTab === 'week' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {plan.days.map((day) => {
              const dayName = DAY_NAMES[day.dayNumber - 1] || `Día ${day.dayNumber}`
              const isToday = day.dayNumber === todayDayNumber

              return (
                <div
                  key={day.id}
                  className={`flex flex-col rounded-3xl bg-white border shadow-xs overflow-hidden transition-all ${
                    isToday ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' : 'border-slate-200/90'
                  }`}
                >
                  <div
                    className={`p-3.5 px-4 flex items-center justify-between border-b ${
                      isToday
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                        : 'bg-slate-50 border-slate-100 text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block uppercase tracking-wider">
                        {dayName}
                      </span>
                      <span className={`text-3xs font-medium ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                        {day.meals.length} tomas planificadas
                      </span>
                    </div>
                    {isToday && (
                      <span className="text-3xs font-black px-2 py-0.5 rounded-full bg-white text-blue-700">
                        HOY
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-3.5 flex-1 flex flex-col divide-y divide-slate-100">
                    {day.meals.map((meal) => {
                      const mealLabel = MEAL_LABELS[meal.mealType] || meal.mealType
                      return (
                        <div key={meal.id} className="pt-3 first:pt-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              {mealLabel}
                            </span>
                            {meal.isOptionB && (
                              <Badge className="bg-amber-100 text-amber-900 border-0 text-3xs font-black">
                                Opción B
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {meal.items.map((item) => {
                              const foodName = item.food?.name || item.recipe?.name || 'Alimento'
                              const img = item.food ? getFoodImage(item.food) : item.recipe?.imageUrl || FALLBACK_FOOD_SVG
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={img}
                                      alt=""
                                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null
                                        e.currentTarget.src = FALLBACK_FOOD_SVG
                                      }}
                                    />
                                    <span className="font-medium text-slate-800 text-xs truncate">
                                      {foodName}
                                    </span>
                                  </div>
                                  <span className="text-2xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                    {plan.hideCaloriesTCA ? '1 rac.' : `${Math.round(item.quantityG)}g`}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
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

      {/* VISTA 3: RECETARIO CLÍNICO EDITORIAL CON INGREDIENTES COMPLETOS */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-blue-600" />
                <span>Recetario Clínico y Platos Pautados ({filteredRecipes.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Platos recomendados por Eva con lista de ingredientes al gramo y modo de preparación detallado.
              </p>
            </div>

            {/* Recipe search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Buscar por receta o ingrediente..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="pl-9 text-xs rounded-2xl h-9 border-slate-200"
              />
            </div>
          </div>

          {filteredRecipes.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              No se han encontrado recetas que coincidan con tu búsqueda.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecipes.map((rcp) => {
                const img = rcp.imageUrl || getFoodImage({ name: rcp.name })
                const ingredientsList = rcp.ingredients || []

                return (
                  <Card
                    key={rcp.id}
                    className="rounded-3xl border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* Recipe Image Banner */}
                      <div className="h-36 w-full relative overflow-hidden bg-slate-100">
                        <img
                          src={img}
                          alt={rcp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = FALLBACK_FOOD_SVG
                          }}
                        />
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          {rcp.difficulty && (
                            <span className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 shadow-2xs">
                              {rcp.difficulty}
                            </span>
                          )}
                          <span className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                            {rcp.servings} {rcp.servings === 1 ? 'ración' : 'raciones'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {rcp.name}
                          </h3>
                          <div className="flex items-center gap-3 text-2xs text-slate-500 font-medium mt-1">
                            {rcp.prepTimeMin && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" /> Prep: {rcp.prepTimeMin}m
                              </span>
                            )}
                            {rcp.cookTimeMin && (
                              <span className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-amber-600" /> Cocción: {rcp.cookTimeMin}m
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Complete Ingredients List Box */}
                        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2">
                          <span className="text-3xs font-black uppercase tracking-wider text-slate-500 block">
                            Ingredientes ({ingredientsList.length}):
                          </span>
                          {ingredientsList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Ingredientes especificados en las indicaciones.</p>
                          ) : (
                            <ul className="text-xs text-slate-700 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {ingredientsList.map((ing, i) => (
                                <li key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100 last:border-none">
                                  <span className="font-semibold text-slate-800 truncate pr-2">
                                    • {ing.food?.name || 'Ingrediente'}
                                  </span>
                                  <span className="text-2xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                                    {Math.round(ing.quantityG)}g
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Button
                        type="button"
                        onClick={() =>
                          setSelectedRecipe({
                            name: rcp.name,
                            instructions: rcp.instructions,
                            imageUrl: img,
                            prepTimeMin: rcp.prepTimeMin,
                            cookTimeMin: rcp.cookTimeMin,
                            servings: rcp.servings,
                            difficulty: rcp.difficulty,
                            equipmentJson: rcp.equipmentJson,
                            isBatchCooking: rcp.isBatchCooking,
                            isFreezable: rcp.isFreezable,
                            ingredients: rcp.ingredients?.map((i) => ({
                              name: i.food?.name || 'Ingrediente',
                              quantityG: i.quantityG,
                              notes: i.notes,
                            })),
                          })
                        }
                        className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs gap-1.5 h-10 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Ver Modo de Preparación</span>
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 4: LISTA DE LA COMPRA */}
      {activeTab === 'shopping' && (
        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span>Lista de la Compra Semanal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Organizada por pasillos y categorías. Solo para consulta durante tus compras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(shoppingItemsByCategory).map(([category, items]) => (
              <div key={category} className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  {category}
                </h4>
                <ul className="space-y-1 text-xs text-slate-700 divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <li key={idx} className="pt-1 flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate pr-2">{it.name}</span>
                      <span className="text-2xs font-bold text-slate-500 whitespace-nowrap">{it.totalG}g</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* VISTA 5: GUÍA PARA COMER FUERA */}
      {activeTab === 'guide' && plan.eatingOutGuide && (
        <Card className="rounded-3xl border border-blue-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Guía para Comer Fuera, Viajes y Celebraciones</h2>
              <p className="text-xs text-slate-500">Pautas flexibles elaboradas por Eva Vidal para tus comidas sociales</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
            {plan.eatingOutGuide}
          </div>
        </Card>
      )}

      {/* Modal Ficha de Receta Interactiva con Ingredientes y Modo de Preparación */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 truncate">{selectedRecipe.name}</h3>
                  <span className="text-3xs text-slate-400 font-semibold block uppercase">Receta Clínica Eva Vidal</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipe(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar receta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs text-slate-700 pr-1">
              {/* Badges de Tiempos y Raciones */}
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
                  <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-full text-[10px] shadow-2xs">
                    {selectedRecipe.difficulty}
                  </span>
                )}
              </div>

              {/* LISTA COMPLETA DE INGREDIENTES */}
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                  <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ingredientes necesarios:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white border border-blue-100/80 flex items-center justify-between text-xs shadow-2xs"
                      >
                        <span className="font-semibold text-slate-800 truncate pr-2">{ing.name}</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-2xs whitespace-nowrap">
                          {Math.round(ing.quantityG)}g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instrucciones Paso a Paso */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wide">
                  Modo de preparación:
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 leading-relaxed whitespace-pre-wrap font-sans text-slate-800 text-xs">
                  {selectedRecipe.instructions || 'Sin instrucciones adicionales registradas.'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecipe(null)}
                className="rounded-xl text-xs font-bold px-4"
              >
                Cerrar receta
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>

      <PlanDossierPdf plan={plan} className="hidden print:block print:space-y-0" />
    </div>
  )
}
