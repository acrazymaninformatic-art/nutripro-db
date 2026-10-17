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
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Base de Datos de Alimentos</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Catálogo clínico con más de {foods.length.toLocaleString('es-ES')} alimentos para la elaboración precisa de planes y recetas con búsqueda ultrarrápida.
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
