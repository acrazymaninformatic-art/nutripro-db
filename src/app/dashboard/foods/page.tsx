import { getAllFoodsForBrowser, getCategories } from './actions'
import { AddFoodDialog } from './add-food-dialog'
import { InstantFoodsBrowser } from './instant-foods-browser'

export const dynamic = 'force-dynamic'

export default async function FoodsPage() {
  const [foods, categories] = await Promise.all([
    getAllFoodsForBrowser(),
    getCategories(),
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Base de Datos de Alimentos</h1>
          <p className="text-sm text-gray-500">
            Catálogo clínico con más de {foods.length.toLocaleString('es-ES')} alimentos para la elaboración precisa de planes y recetas con búsqueda ultrarrápida (0 ms).
          </p>
        </div>
        <AddFoodDialog categories={categories} />
      </div>

      {/* Instant Interactive Browser */}
      <InstantFoodsBrowser
        initialFoods={foods}
        categories={categories}
        totalCount={foods.length}
      />
    </div>
  )
}
