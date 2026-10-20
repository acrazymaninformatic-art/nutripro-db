'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createRecipe } from '../actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, ChefHat, Flame, Scale, Loader2 } from 'lucide-react'

interface FoodItem {
  id: number
  name: string
  category: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

interface SelectedIngredient {
  foodId: number
  quantityG: number
  notes?: string
}

export function RecipeForm({ foods }: { foods: FoodItem[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState<number>(1)
  const [prepTimeMin, setPrepTimeMin] = useState<number>(15)
  const [cookTimeMin, setCookTimeMin] = useState<number>(20)
  const [category, setCategory] = useState('Almuerzo')
  const [instructions, setInstructions] = useState('')

  // Ingredients state
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([
    { foodId: foods[0]?.id || 1, quantityG: 150 },
  ])

  // Food map for rapid lookup
  const foodMap = useMemo(() => {
    const map = new Map<number, FoodItem>()
    foods.forEach((f) => map.set(f.id, f))
    return map
  }, [foods])

  // Calculate live macros
  const nutritionalTotals = useMemo(() => {
    let kcal = 0
    let prot = 0
    let carbs = 0
    let fat = 0
    let fiber = 0

    ingredients.forEach((ing) => {
      const food = foodMap.get(ing.foodId)
      if (food && ing.quantityG > 0) {
        const factor = ing.quantityG / 100
        kcal += food.calories * factor
        prot += food.proteinG * factor
        carbs += food.carbsG * factor
        fat += food.fatG * factor
        fiber += food.fiberG * factor
      }
    })

    const s = Math.max(1, servings)
    return {
      totalKcal: Math.round(kcal),
      totalProt: Math.round(prot * 10) / 10,
      totalCarbs: Math.round(carbs * 10) / 10,
      totalFat: Math.round(fat * 10) / 10,
      totalFiber: Math.round(fiber * 10) / 10,
      perServingKcal: Math.round(kcal / s),
      perServingProt: Math.round((prot / s) * 10) / 10,
      perServingCarbs: Math.round((carbs / s) * 10) / 10,
      perServingFat: Math.round((fat / s) * 10) / 10,
    }
  }, [ingredients, servings, foodMap])

  function handleAddIngredient() {
    setIngredients([...ingredients, { foodId: foods[0]?.id || 1, quantityG: 100 }])
  }

  function handleRemoveIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function handleIngredientChange(index: number, field: keyof SelectedIngredient, value: any) {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      alert('Por favor introduce un nombre para la receta.')
      return
    }
    if (ingredients.length === 0) {
      alert('Añade al menos un ingrediente a la receta.')
      return
    }

    setLoading(true)
    try {
      await createRecipe({
        name,
        description,
        servings,
        prepTimeMin,
        cookTimeMin,
        instructions,
        category,
        ingredients,
      })
      router.push('/dashboard/recipes')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al guardar la receta.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: General Info & Ingredients (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-blue-600" />
                <span>Información General de la Receta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre del Plato *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej. Pechuga de pollo marinada con arroz y brócoli al vapor"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Desayuno">Desayuno</option>
                    <option value="Media mañana">Media mañana</option>
                    <option value="Almuerzo">Almuerzo</option>
                    <option value="Merienda">Merienda</option>
                    <option value="Cena">Cena</option>
                    <option value="Snack">Snack</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="servings">Raciones</Label>
                  <Input
                    id="servings"
                    type="number"
                    step="any"
                    value={servings}
                    onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="totalTime">Tiempo Total (min)</Label>
                  <Input
                    id="totalTime"
                    type="number"
                    step="any"
                    value={prepTimeMin + cookTimeMin}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 20
                      setPrepTimeMin(Math.round(total * 0.4))
                      setCookTimeMin(Math.round(total * 0.6))
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Breve Descripción</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Plato rico en proteína magra y carbohidratos complejos, ideal para post-entreno."
                />
              </div>
            </CardContent>
          </Card>

          {/* Ingredients Builder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-600" />
                  <span>Ingredientes de la Receta</span>
                </CardTitle>
                <CardDescription>
                  Selecciona de tu base de datos y define los gramos exactos
                </CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleAddIngredient}>
                <Plus className="h-4 w-4 mr-1" />
                Añadir Ingrediente
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {ingredients.map((ing, index) => {
                const currentFood = foodMap.get(ing.foodId)
                const factor = ing.quantityG / 100
                const kcal = currentFood ? Math.round(currentFood.calories * factor) : 0

                return (
                  <div
                    key={index}
                    className="p-3 bg-gray-50/70 rounded-lg border border-gray-200 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <div className="flex-1 w-full">
                      <Label className="text-[10px] text-gray-500 mb-1 block">Alimento</Label>
                      <Select
                        value={ing.foodId}
                        onChange={(e) =>
                          handleIngredientChange(index, 'foodId', parseInt(e.target.value))
                        }
                      >
                        {foods.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.calories} kcal/100g)
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="w-full sm:w-28">
                      <Label className="text-[10px] text-gray-500 mb-1 block">Gramos (g)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={ing.quantityG}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            'quantityG',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="w-full sm:w-24 text-right pt-4 sm:pt-0">
                      <span className="text-xs font-bold text-gray-900 block">{kcal} kcal</span>
                      <span className="text-[10px] text-gray-500">
                        {currentFood ? `${(currentFood.proteinG * factor).toFixed(1)}g P` : ''}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preparación y Paso a Paso</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={5}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="1. Cocinar el arroz en abundante agua con sal durante 18 minutos...&#10;2. Cortar la pechuga en dados y dorar a la plancha con una gota de aceite...&#10;3. Saltear el brócoli y servir caliente."
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Real-time Nutritional Values (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-3xl p-5 shadow-sm border border-blue-600/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-300" />
                Valor por Ración
              </span>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-medium">
                {servings} {servings === 1 ? 'ración' : 'raciones'}
              </span>
            </div>

            <div>
              <span className="text-3xl font-extrabold">{nutritionalTotals.perServingKcal}</span>
              <span className="text-blue-100 text-sm ml-1">kcal / ración</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
              <div>
                <span className="text-[10px] text-blue-100 block">PROTEÍNA</span>
                <span className="text-base font-bold">{nutritionalTotals.perServingProt}g</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-100 block">CARBOS</span>
                <span className="text-base font-bold">{nutritionalTotals.perServingCarbs}g</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-100 block">GRASAS</span>
                <span className="text-base font-bold">{nutritionalTotals.perServingFat}g</span>
              </div>
            </div>
          </div>

          {/* Full Recipe Totals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-gray-500">
                Totales de Toda la Receta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Calorías Totales:</span>
                <span className="font-bold text-gray-900">{nutritionalTotals.totalKcal} kcal</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Proteínas Totales:</span>
                <span className="font-semibold text-blue-700">{nutritionalTotals.totalProt} g</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Carbohidratos Totales:</span>
                <span className="font-semibold text-amber-700">{nutritionalTotals.totalCarbs} g</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Grasas Totales:</span>
                <span className="font-semibold text-rose-700">{nutritionalTotals.totalFat} g</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Fibra Total:</span>
                <span className="font-semibold text-blue-700">{nutritionalTotals.totalFiber} g</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Action */}
          <Button type="submit" disabled={loading} className="w-full py-6 text-base font-semibold shadow-md">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Guardando Receta...
              </>
            ) : (
              'Guardar Receta en el Catálogo'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
