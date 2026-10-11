import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRecipe } from '../actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteRecipeButton } from './delete-recipe-button'
import { ArrowLeft, ChefHat, Clock, Users, Flame, Utensils, FileText } from 'lucide-react'

import { CLINICAL_RECIPES } from '@/lib/nutrition/recipes-catalog'

export const dynamic = 'force-dynamic'

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params
  const recipe = await getRecipe(id)

  if (!recipe) {
    notFound()
  }

  // Calculate totals
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

  // Fallback to clinical catalog if database ingredients are empty
  if (totalKcal === 0) {
    const cleanRecName = recipe.name.toLowerCase().trim()
    const matchedCat = CLINICAL_RECIPES.find(c => {
      const cName = c.name.toLowerCase().trim()
      return cleanRecName.includes(cName.slice(0, 15)) || cName.includes(cleanRecName.slice(0, 15))
    })
    if (matchedCat) {
      totalKcal = matchedCat.caloriesPerServing * servings
      totalProt = matchedCat.proteinG * servings
      totalCarbs = matchedCat.carbsG * servings
      totalFat = matchedCat.fatG * servings
    }
  }

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/recipes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al recetario</span>
        </Link>
        <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.name} />
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        {recipe.imageUrl && (
          <div className="h-64 w-full bg-gray-100 overflow-hidden relative">
            <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-5 left-6 right-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-white/90 text-gray-900 rounded-full font-bold px-3">
                  {recipe.category || 'General'}
                </Badge>
                <span className="text-xs text-white/90 font-semibold flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Users className="h-3.5 w-3.5" /> {servings} {servings === 1 ? 'ración' : 'raciones'}
                </span>
                {(recipe.prepTimeMin || recipe.cookTimeMin) && (
                  <span className="text-xs text-white/90 font-semibold flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    <Clock className="h-3.5 w-3.5" /> {(recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0)} min
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{recipe.name}</h1>
            </div>
          </div>
        )}

        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {!recipe.imageUrl && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="rounded-full px-3 font-bold">{recipe.category || 'General'}</Badge>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {servings} raciones
                </span>
                {(recipe.prepTimeMin || recipe.cookTimeMin) && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {(recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0)} min
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
              {recipe.description && (
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">{recipe.description}</p>
              )}
            </div>
          )}

          {recipe.imageUrl && recipe.description && (
            <p className="text-sm text-gray-600 max-w-xl font-medium">{recipe.description}</p>
          )}

          {/* Highlight Card */}
          <div className="p-4 rounded-3xl bg-blue-50/90 border border-blue-200 text-center min-w-[240px] shrink-0 shadow-2xs">
            <span className="text-[11px] uppercase font-black text-blue-900 tracking-wider block">Valores por Ración</span>
            <span className="text-3xl font-black text-blue-950 block mt-0.5">{kcalPerServing}</span>
            <span className="text-xs text-blue-700 font-bold">kcal netas</span>
            
            <div className="grid grid-cols-4 gap-1 mt-2.5 pt-2.5 border-t border-blue-200 text-xs font-bold">
              <div className="p-1 rounded-xl bg-white/70">
                <span className="text-[9px] uppercase font-bold text-blue-700 block">Prot</span>
                <span className="text-blue-950 text-xs">{protPerServing}g</span>
              </div>
              <div className="p-1 rounded-xl bg-white/70">
                <span className="text-[9px] uppercase font-bold text-amber-700 block">Carb</span>
                <span className="text-amber-950 text-xs">{carbsPerServing}g</span>
              </div>
              <div className="p-1 rounded-xl bg-white/70">
                <span className="text-[9px] uppercase font-bold text-rose-700 block">Grasa</span>
                <span className="text-rose-950 text-xs">{fatPerServing}g</span>
              </div>
              <div className="p-1 rounded-xl bg-white/70">
                <span className="text-[9px] uppercase font-bold text-sky-700 block">Fibra</span>
                <span className="text-sky-950 text-xs">{fiberPerServing}g</span>
              </div>
            </div>

            {/* Macro Split Bar */}
            <div className="mt-2.5 pt-2 border-t border-blue-200/60 space-y-1">
              <div className="h-1.5 w-full bg-blue-200/50 rounded-full overflow-hidden flex">
                <div style={{ width: `${pPct}%` }} className="bg-blue-600 h-full" title={`Proteína: ${pPct}%`} />
                <div style={{ width: `${cPct}%` }} className="bg-amber-500 h-full" title={`Carbohidratos: ${cPct}%`} />
                <div style={{ width: `${fPct}%` }} className="bg-rose-500 h-full" title={`Grasas: ${fPct}%`} />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-blue-900 px-0.5">
                <span>{pPct}% P</span>
                <span>{cPct}% C</span>
                <span>{fPct}% G</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
            <Utensils className="h-4 w-4 text-blue-600" />
            <span>Ingredientes Necesarios ({recipe.ingredients.length})</span>
          </CardTitle>
          <CardDescription className="text-xs">Cantidades netas pesadas y desglose nutricional</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-y text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Ingrediente</th>
                <th className="px-5 py-3 text-right">Cantidad</th>
                <th className="px-5 py-3 text-right">Calorías</th>
                <th className="px-5 py-3 text-right">Proteína</th>
                <th className="px-5 py-3 text-right">Carbos</th>
                <th className="px-5 py-3 text-right">Grasa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recipe.ingredients.map((ing) => {
                const factor = ing.quantityG / 100
                return (
                  <tr key={ing.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3 font-medium text-gray-900">{ing.food.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{ing.quantityG} g</td>
                    <td className="px-5 py-3 text-right">{Math.round(ing.food.calories * factor)} kcal</td>
                    <td className="px-5 py-3 text-right text-blue-700">{(ing.food.proteinG * factor).toFixed(1)} g</td>
                    <td className="px-5 py-3 text-right text-amber-700">{(ing.food.carbsG * factor).toFixed(1)} g</td>
                    <td className="px-5 py-3 text-right text-rose-700">{(ing.food.fatG * factor).toFixed(1)} g</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t">
              <tr>
                <td className="px-5 py-3">Total Receta</td>
                <td className="px-5 py-3 text-right">
                  {recipe.ingredients.reduce((acc, curr) => acc + curr.quantityG, 0)} g
                </td>
                <td className="px-5 py-3 text-right text-blue-800 font-bold">{Math.round(totalKcal)} kcal</td>
                <td className="px-5 py-3 text-right text-blue-700">{Math.round(totalProt)} g</td>
                <td className="px-5 py-3 text-right text-amber-700">{Math.round(totalCarbs)} g</td>
                <td className="px-5 py-3 text-right text-rose-700">{Math.round(totalFat)} g</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Elaboración y Preparación Paso a Paso</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Instrucciones culinarias para preparar el plato respetando los nutrientes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {recipe.instructions
              ? recipe.instructions
                  .split('\n')
                  .filter((l) => l.trim().length > 0)
                  .map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-200/60"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">
                        {line.replace(/^\d+[\.\)]\s*/, '')}
                      </p>
                    </div>
                  ))
              : (
                <p className="text-sm text-gray-500 italic">Sin instrucciones detalladas.</p>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
