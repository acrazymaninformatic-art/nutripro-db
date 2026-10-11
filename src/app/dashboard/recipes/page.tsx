import { getRecipes } from './actions'
import { RecipesClient } from './recipes-client'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const recipes = await getRecipes()

  return (
    <div className="max-w-7xl mx-auto">
      <RecipesClient initialRecipes={recipes as any} />
    </div>
  )
}
