import { notFound } from 'next/navigation'
import { getRecipe } from '../actions'
import { RecipeDetailView } from './recipe-detail-view'
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

  // Lookup fallback from static catalog if database recipe ingredients are empty
  const cleanRecName = recipe.name.toLowerCase().trim()
  const matchedCat = CLINICAL_RECIPES.find((c) => {
    const cName = c.name.toLowerCase().trim()
    return cleanRecName.includes(cName.slice(0, 15)) || cName.includes(cleanRecName.slice(0, 15))
  })

  const fallback = matchedCat
    ? {
        caloriesPerServing: matchedCat.caloriesPerServing,
        proteinG: matchedCat.proteinG,
        carbsG: matchedCat.carbsG,
        fatG: matchedCat.fatG,
        chefTip: matchedCat.chefTip,
        ingredients: matchedCat.ingredients,
      }
    : null

  return (
    <RecipeDetailView
      recipe={recipe as any}
      fallback={fallback}
    />
  )
}
