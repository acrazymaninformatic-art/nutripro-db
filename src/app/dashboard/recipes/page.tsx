import Link from 'next/link'
import { getRecipes } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChefHat, Plus, Clock, Users, Flame, Utensils } from 'lucide-react'
import { FoodImage } from '@/components/nutrition/food-image'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const recipes = await getRecipes()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recetario Clínico</h1>
          <p className="text-sm text-gray-500">
            Platos y recetas calculadas automáticamente por ración para pautas dietéticas.
          </p>
        </div>
        <Link href="/dashboard/recipes/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Crear Receta</span>
          </Button>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No hay recetas creadas todavía</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Crea platos personalizados combinando ingredientes de tu base de datos con cálculo automático de calorías.
            </p>
            <Link href="/dashboard/recipes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Receta
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => {
            // Calculate total nutrients
            let totalKcal = 0
            let totalProt = 0
            let totalCarbs = 0
            let totalFat = 0

            recipe.ingredients.forEach((ing) => {
              const factor = ing.quantityG / 100
              totalKcal += ing.food.calories * factor
              totalProt += ing.food.proteinG * factor
              totalCarbs += ing.food.carbsG * factor
              totalFat += ing.food.fatG * factor
            })

            const servings = recipe.servings || 1
            const kcalPerServing = Math.round(totalKcal / servings)
            const protPerServing = Math.round((totalProt / servings) * 10) / 10
            const carbsPerServing = Math.round((totalCarbs / servings) * 10) / 10
            const fatPerServing = Math.round((totalFat / servings) * 10) / 10

            return (
              <Card key={recipe.id} className="flex flex-col hover:shadow-lg transition-all rounded-3xl border-gray-200 overflow-hidden hover:border-emerald-300">
                {recipe.imageUrl && (
                  <div className="h-44 w-full bg-gray-100 overflow-hidden relative">
                    <FoodImage
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="text-xs bg-white/90 backdrop-blur-xs font-bold rounded-full px-3 shadow-2xs">
                        {recipe.category || 'General'}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-black text-emerald-950 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-emerald-600" />
                        {kcalPerServing} kcal
                      </span>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  {!recipe.imageUrl && (
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="text-xs rounded-full px-3 font-bold">
                        {recipe.category || 'General'}
                      </Badge>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-emerald-600" />
                        {kcalPerServing} kcal/ración
                      </span>
                    </div>
                  )}
                  <CardTitle className="text-base mt-1.5 text-gray-900 line-clamp-1 font-bold">
                    {recipe.name}
                  </CardTitle>
                  {recipe.description && (
                    <CardDescription className="line-clamp-2 mt-1 text-xs text-gray-500">
                      {recipe.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 space-y-4 p-5 pt-0">
                  {/* Servings and Time */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {servings} {servings === 1 ? 'ración' : 'raciones'}
                    </span>
                    {(recipe.prepTimeMin || recipe.cookTimeMin) && (
                      <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {(recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0)} min
                      </span>
                    )}
                  </div>

                  {/* Macros Per Serving */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-100">
                    <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Prot</span>
                      <span className="text-xs font-black text-blue-900">{protPerServing}g</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Carb</span>
                      <span className="text-xs font-black text-amber-900">{carbsPerServing}g</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Grasa</span>
                      <span className="text-xs font-black text-rose-900">{fatPerServing}g</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t bg-gray-50/70 p-4">
                  <Link href={`/dashboard/recipes/${recipe.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full rounded-2xl font-bold border-gray-200 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300">
                      Ver Elaboración Paso a Paso →
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
