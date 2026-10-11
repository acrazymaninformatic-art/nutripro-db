import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { RecipeForm } from './recipe-form'
import { ArrowLeft, ChefHat } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewRecipePage() {
  const foods = await prisma.food.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      category: true,
      calories: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
      fiberG: true,
    },
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/recipes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al recetario</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-green-50 rounded-xl text-green-700">
          <ChefHat className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Receta</h1>
          <p className="text-sm text-gray-500">
            Añade ingredientes de la base de datos para calcular automáticamente los macronutrientes por ración.
          </p>
        </div>
      </div>

      <RecipeForm foods={foods} />
    </div>
  )
}
