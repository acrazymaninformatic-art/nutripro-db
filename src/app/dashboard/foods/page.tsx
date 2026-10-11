import Link from 'next/link'
import { getFoods, getCategories } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddFoodDialog } from './add-food-dialog'
import { Apple, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { getFoodImage } from '@/lib/nutrition'
import { FoodImage } from '@/components/nutrition/food-image'

export const dynamic = 'force-dynamic'

interface FoodsPageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}

export default async function FoodsPage({ searchParams }: FoodsPageProps) {
  const { q, category, page } = await searchParams
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1)
  const PAGE_SIZE = 40

  const [{ foods, total, totalPages }, categories] = await Promise.all([
    getFoods(q, category, currentPage, PAGE_SIZE),
    getCategories(),
  ])

  // Build pagination query string helper
  const getPageHref = (targetPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category && category !== 'ALL') params.set('category', category)
    params.set('page', targetPage.toString())
    return `/dashboard/foods?${params.toString()}`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Base de Datos de Alimentos</h1>
          <p className="text-sm text-gray-500">
            Catálogo clínico con más de 1.000 alimentos para la elaboración precisa de planes y recetas.
          </p>
        </div>
        <AddFoodDialog categories={categories} />
      </div>

      {/* Filter bar */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardContent className="p-4">
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q || ''}
                placeholder="Buscar por nombre de alimento (ej. pechuga, avena, salmón, nuez)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="category"
                defaultValue={category || 'ALL'}
                className="px-3.5 py-2 border border-gray-200 rounded-2xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Todas las categorías ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" size="sm" className="px-5 rounded-2xl font-bold text-xs">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filtrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Foods Table */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-emerald-50/30 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
              <Apple className="h-5 w-5 text-emerald-600" />
              <span>
                Catálogo Nutricional ({total.toLocaleString('es-ES')} alimentos)
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Mostrando {Math.min(PAGE_SIZE, foods.length)} alimentos por página • Valores por 100g de porción limpia
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-200 font-bold px-3 py-1">
              Página {currentPage} de {totalPages}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {foods.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Apple className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No se encontraron alimentos con ese filtro.</p>
              <p className="text-xs text-gray-400 mt-1">Prueba con otra palabra clave o restablece la categoría.</p>
              <Link href="/dashboard/foods" className="inline-block mt-4">
                <Button variant="outline" size="sm" className="rounded-2xl text-xs">
                  Restablecer filtros
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5">Alimento</th>
                      <th className="px-6 py-3.5">Categoría</th>
                      <th className="px-6 py-3.5 text-right">Energía</th>
                      <th className="px-6 py-3.5 text-right text-blue-700">Proteína</th>
                      <th className="px-6 py-3.5 text-right text-amber-700">Carbos</th>
                      <th className="px-6 py-3.5 text-right text-rose-700">Grasas</th>
                      <th className="px-6 py-3.5 text-right text-emerald-700">Fibra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {foods.map((food) => {
                      const imageUrl = getFoodImage(food)
                      return (
                        <tr key={food.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-emerald-50 border border-gray-200 shadow-2xs">
                                <FoodImage
                                  src={imageUrl}
                                  alt={food.name}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900">{food.name}</span>
                                {food.source === 'usda' && (
                                  <span className="ml-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                    USDA
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              {food.category || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            {food.calories} kcal
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-blue-700">
                            {food.proteinG} g
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-amber-700">
                            {food.carbsG} g
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-rose-700">
                            {food.fatG} g
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-emerald-700">
                            {food.fiberG} g
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    Mostrando del{' '}
                    <span className="font-bold text-gray-800">
                      {(currentPage - 1) * PAGE_SIZE + 1}
                    </span>{' '}
                    al{' '}
                    <span className="font-bold text-gray-800">
                      {Math.min(currentPage * PAGE_SIZE, total)}
                    </span>{' '}
                    de <span className="font-bold text-gray-800">{total}</span> alimentos
                  </div>

                  <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <Link href={getPageHref(currentPage - 1)}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl text-xs flex items-center gap-1 font-semibold"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Anterior</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="rounded-2xl text-xs flex items-center gap-1 font-semibold opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Anterior</span>
                      </Button>
                    )}

                    <span className="text-xs font-bold text-gray-700 px-2">
                      {currentPage} / {totalPages}
                    </span>

                    {currentPage < totalPages ? (
                      <Link href={getPageHref(currentPage + 1)}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl text-xs flex items-center gap-1 font-semibold"
                        >
                          <span>Siguiente</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="rounded-2xl text-xs flex items-center gap-1 font-semibold opacity-50"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
