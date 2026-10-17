'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteRecipeButton } from './delete-recipe-button'
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Users,
  Flame,
  Utensils,
  FileText,
  Printer,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Heart,
  Share2,
} from 'lucide-react'

export interface RecipeIngredientData {
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
}

export interface RecipeData {
  id: string
  name: string
  description: string | null
  category: string | null
  servings: number
  prepTimeMin: number | null
  cookTimeMin: number | null
  instructions: string
  imageUrl: string | null
  ingredients: RecipeIngredientData[]
}

interface FallbackData {
  caloriesPerServing: number
  proteinG: number
  carbsG: number
  fatG: number
  chefTip?: string
  ingredients?: { name: string; quantity: string }[]
}

interface RecipeDetailViewProps {
  recipe: RecipeData
  fallback?: FallbackData | null
}

export function RecipeDetailView({ recipe, fallback }: RecipeDetailViewProps) {
  const [servings, setServings] = useState<number>(recipe.servings || 1)
  const [copied, setCopied] = useState(false)

  // Base recipe calculations
  const baseServings = recipe.servings || 1
  const scale = servings / baseServings

  // Calculate totals
  const nutrients = useMemo(() => {
    let totalKcal = 0
    let totalProt = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0

    if (recipe.ingredients.length > 0) {
      recipe.ingredients.forEach((ing) => {
        const factor = ing.quantityG / 100
        totalKcal += ing.food.calories * factor
        totalProt += ing.food.proteinG * factor
        totalCarbs += ing.food.carbsG * factor
        totalFat += ing.food.fatG * factor
        totalFiber += (ing.food.fiberG || 0) * factor
      })
    } else if (fallback) {
      totalKcal = fallback.caloriesPerServing * baseServings
      totalProt = fallback.proteinG * baseServings
      totalCarbs = fallback.carbsG * baseServings
      totalFat = fallback.fatG * baseServings
      totalFiber = 3 * baseServings
    }

    const scaledTotalKcal = Math.round(totalKcal * scale)
    const scaledTotalProt = Math.round(totalProt * scale * 10) / 10
    const scaledTotalCarbs = Math.round(totalCarbs * scale * 10) / 10
    const scaledTotalFat = Math.round(totalFat * scale * 10) / 10
    const scaledTotalFiber = Math.round(totalFiber * scale * 10) / 10

    const perServingKcal = Math.round(scaledTotalKcal / servings)
    const perServingProt = Math.round((scaledTotalProt / servings) * 10) / 10
    const perServingCarbs = Math.round((scaledTotalCarbs / servings) * 10) / 10
    const perServingFat = Math.round((scaledTotalFat / servings) * 10) / 10
    const perServingFiber = Math.round((scaledTotalFiber / servings) * 10) / 10

    const macroCal = (perServingProt * 4) + (perServingCarbs * 4) + (perServingFat * 9)
    const pPct = macroCal > 0 ? Math.round((perServingProt * 4 / macroCal) * 100) : 30
    const cPct = macroCal > 0 ? Math.round((perServingCarbs * 4 / macroCal) * 100) : 40
    const fPct = macroCal > 0 ? Math.max(0, 100 - pPct - cPct) : 30

    return {
      totalKcal: scaledTotalKcal,
      totalProt: scaledTotalProt,
      totalCarbs: scaledTotalCarbs,
      totalFat: scaledTotalFat,
      totalFiber: scaledTotalFiber,
      perServingKcal,
      perServingProt,
      perServingCarbs,
      perServingFat,
      perServingFiber,
      pPct,
      cPct,
      fPct,
    }
  }, [recipe, fallback, baseServings, scale, servings])

  // Copy recipe summary
  const handleCopyRecipe = async () => {
    const text = `🍽️ RECETA: ${recipe.name}
📂 Categoría: ${recipe.category || 'General'} | 👥 Raciones: ${servings}
⚡ Calorías por ración: ${nutrients.perServingKcal} kcal (Prot: ${nutrients.perServingProt}g, Carb: ${nutrients.perServingCarbs}g, Grasas: ${nutrients.perServingFat}g)

🛒 INGREDIENTES (${servings} raciones):
${
  recipe.ingredients.length > 0
    ? recipe.ingredients
        .map(
          (ing) =>
            `- ${ing.food.name}: ${Math.round(ing.quantityG * scale)} g`
        )
        .join('\n')
    : fallback?.ingredients?.map((i) => `- ${i.name}: ${i.quantity}`).join('\n') || ''
}

👨‍🍳 PREPARACIÓN:
${recipe.instructions}

✨ Eva Vidal Nutrición - evavidalinfo@gmail.com`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const instructionsList = (recipe.instructions || '')
    .split('\n')
    .filter((l) => l.trim().length > 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-32">
      {/* Top action bar - Hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/recipes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors bg-white px-3.5 py-2 rounded-2xl border border-gray-200 shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al recetario</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyRecipe}
            className="rounded-2xl text-xs font-bold border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-gray-500" />
                <span>Copiar Receta</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-2xl text-xs font-bold border-blue-200 bg-blue-50/60 text-blue-800 hover:bg-blue-100/70 flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir Ficha Técnica</span>
          </Button>

          <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.name} />
        </div>
      </div>

      {/* Print-only Clinic Header */}
      <div className="hidden print:block border-b-2 border-blue-600 pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-blue-950 uppercase tracking-wide">
              Eva Vidal Nutrición
            </h1>
            <p className="text-xs text-gray-600">Nutrición Clínica y Dietética Personalizada | evavidalinfo@gmail.com</p>
          </div>
          <span className="text-xs font-bold text-gray-500">Ficha Terapéutica de Receta</span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        {recipe.imageUrl && (
          <div className="h-64 sm:h-72 w-full bg-gray-100 overflow-hidden relative">
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute bottom-5 left-6 right-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-white/95 text-blue-950 rounded-full font-black px-3 text-xs shadow-2xs"
                >
                  {recipe.category || 'General'}
                </Badge>

                <span className="text-xs text-white/90 font-semibold flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Users className="h-3.5 w-3.5" /> Ración base: {recipe.servings || 1}
                </span>

                {(recipe.prepTimeMin || recipe.cookTimeMin) && (
                  <span className="text-xs text-white/90 font-semibold flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    <Clock className="h-3.5 w-3.5" />
                    {(recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0)} min total
                  </span>
                )}

                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Clínicamente Validada
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                {recipe.name}
              </h1>
            </div>
          </div>
        )}

        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {!recipe.imageUrl && (
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="rounded-full px-3 font-bold bg-blue-50 text-blue-900 border border-blue-200">
                  {recipe.category || 'General'}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {recipe.servings || 1} raciones
                </span>
                {(recipe.prepTimeMin || recipe.cookTimeMin) && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {(recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0)} min
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{recipe.name}</h1>
              {recipe.description && (
                <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed font-medium">
                  {recipe.description}
                </p>
              )}
            </div>
          )}

          {recipe.imageUrl && recipe.description && (
            <div className="flex-1">
              <h3 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-1">
                Descripción Terapéutica
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {recipe.description}
              </p>
            </div>
          )}

          {/* Interactive Servings Scaler + Nutrition Highlights */}
          <div className="p-4 rounded-3xl bg-blue-50/90 border border-blue-200 text-center min-w-[260px] shrink-0 shadow-2xs space-y-3">
            {/* Servings control */}
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
              <span className="text-[11px] uppercase font-black text-blue-900 tracking-wider">
                Raciones a cocinar:
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-blue-200">
                {[1, 2, 4, 6].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setServings(s)}
                    className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      servings === s
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-black text-blue-800 tracking-wider block">
                Por Ración ({servings} {servings === 1 ? 'persona' : 'personas'})
              </span>
              <span className="text-3xl font-black text-blue-950 block mt-0.5">
                {nutrients.perServingKcal}
              </span>
              <span className="text-xs text-blue-700 font-bold">kcal netas</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
              <div className="p-1.5 rounded-2xl bg-white/90 border border-blue-100 shadow-2xs">
                <span className="text-[9px] uppercase font-bold text-blue-700 block">Prot</span>
                <span className="text-blue-950 text-xs block">{nutrients.perServingProt}g</span>
                <span className="text-[9px] text-blue-600">{nutrients.pPct}%</span>
              </div>
              <div className="p-1.5 rounded-2xl bg-white/90 border border-amber-100 shadow-2xs">
                <span className="text-[9px] uppercase font-bold text-amber-700 block">Carb</span>
                <span className="text-amber-950 text-xs block">{nutrients.perServingCarbs}g</span>
                <span className="text-[9px] text-amber-600">{nutrients.cPct}%</span>
              </div>
              <div className="p-1.5 rounded-2xl bg-white/90 border border-rose-100 shadow-2xs">
                <span className="text-[9px] uppercase font-bold text-rose-700 block">Grasa</span>
                <span className="text-rose-950 text-xs block">{nutrients.perServingFat}g</span>
                <span className="text-[9px] text-rose-600">{nutrients.fPct}%</span>
              </div>
              <div className="p-1.5 rounded-2xl bg-white/90 border border-sky-100 shadow-2xs">
                <span className="text-[9px] uppercase font-bold text-sky-700 block">Fibra</span>
                <span className="text-sky-950 text-xs block">{nutrients.perServingFiber}g</span>
                <span className="text-[9px] text-sky-600">opt</span>
              </div>
            </div>

            {/* Macro Split Bar */}
            <div className="pt-2 border-t border-blue-200/60 space-y-1">
              <div className="h-2 w-full bg-blue-200/50 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${nutrients.pPct}%` }}
                  className="bg-blue-600 h-full"
                  title={`Proteína: ${nutrients.pPct}%`}
                />
                <div
                  style={{ width: `${nutrients.cPct}%` }}
                  className="bg-amber-500 h-full"
                  title={`Carbohidratos: ${nutrients.cPct}%`}
                />
                <div
                  style={{ width: `${nutrients.fPct}%` }}
                  className="bg-rose-500 h-full"
                  title={`Grasas: ${nutrients.fPct}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-blue-900 px-0.5">
                <span>{nutrients.pPct}% Proteínas</span>
                <span>{nutrients.cPct}% Carbos</span>
                <span>{nutrients.fPct}% Grasas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chef & Clinical Tip Card */}
      {(fallback?.chefTip || recipe.description) && (
        <Card className="rounded-3xl border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white shadow-xs overflow-hidden">
          <CardContent className="p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">
                Consejo Clínico y Culinario de Eva Vidal
              </h4>
              <p className="text-xs text-blue-900/90 leading-relaxed font-medium mt-1">
                {fallback?.chefTip ||
                  'Para optimizar la digestión y absorción de nutrientes, mastica pausadamente y procura no beber líquidos en exceso durante la comida. Cocina las verduras al dente para conservar su matriz de polifenoles antioxidantes.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredients Table */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
              <Utensils className="h-4 w-4 text-blue-600" />
              <span>
                Ingredientes Necesarios (Para {servings} {servings === 1 ? 'ración' : 'raciones'})
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Cantidades pesadas netas ajustadas automáticamente según el número de raciones
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-white px-3 py-1 rounded-xl border border-blue-200">
            <span>Factor de escala:</span>
            <span className="text-blue-600">{scale.toFixed(1)}x</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {recipe.ingredients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-y text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Ingrediente</th>
                    <th className="px-5 py-3 text-right">Cantidad ({servings} raciones)</th>
                    <th className="px-5 py-3 text-right">Calorías</th>
                    <th className="px-5 py-3 text-right">Proteína</th>
                    <th className="px-5 py-3 text-right">Carbos</th>
                    <th className="px-5 py-3 text-right">Grasa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recipe.ingredients.map((ing) => {
                    const scaledQty = Math.round(ing.quantityG * scale)
                    const factor = scaledQty / 100
                    const kcal = Math.round(ing.food.calories * factor)
                    const prot = (ing.food.proteinG * factor).toFixed(1)
                    const carbs = (ing.food.carbsG * factor).toFixed(1)
                    const fat = (ing.food.fatG * factor).toFixed(1)

                    return (
                      <tr key={ing.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {ing.food.name}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-blue-950">
                          {scaledQty} g
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium">{kcal} kcal</td>
                        <td className="px-5 py-3.5 text-right text-blue-700 font-semibold">{prot} g</td>
                        <td className="px-5 py-3.5 text-right text-amber-700 font-semibold">{carbs} g</td>
                        <td className="px-5 py-3.5 text-right text-rose-700 font-semibold">{fat} g</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-bold text-gray-900 border-t">
                  <tr>
                    <td className="px-5 py-3.5">Total para {servings} raciones</td>
                    <td className="px-5 py-3.5 text-right text-blue-950">
                      {Math.round(
                        recipe.ingredients.reduce((acc, curr) => acc + curr.quantityG, 0) * scale
                      )}{' '}
                      g
                    </td>
                    <td className="px-5 py-3.5 text-right text-blue-800 font-black">
                      {nutrients.totalKcal} kcal
                    </td>
                    <td className="px-5 py-3.5 text-right text-blue-700">
                      {nutrients.totalProt} g
                    </td>
                    <td className="px-5 py-3.5 text-right text-amber-700">
                      {nutrients.totalCarbs} g
                    </td>
                    <td className="px-5 py-3.5 text-right text-rose-700">
                      {nutrients.totalFat} g
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : fallback?.ingredients && fallback.ingredients.length > 0 ? (
            <div className="p-5">
              <ul className="divide-y divide-gray-100">
                {fallback.ingredients.map((item, i) => (
                  <li key={i} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No hay ingredientes registrados para esta receta.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Preparation Instructions */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Instrucciones de Preparación Culinaria</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Procedimiento técnico estandarizado para la elaboración de la receta
            </CardDescription>
          </div>

          <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
            {instructionsList.length} pasos
          </span>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-3">
            {instructionsList.length > 0 ? (
              instructionsList.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/70 text-gray-900"
                >
                  <span className="w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs bg-blue-600 text-white">
                    {idx + 1}
                  </span>
                  <p className="text-sm leading-relaxed font-medium text-gray-900">
                    {line.replace(/^\d+[\.\)]\s*/, '')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Sin instrucciones detalladas.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
