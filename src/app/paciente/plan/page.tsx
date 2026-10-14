import Link from 'next/link'
import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, ArrowLeft } from 'lucide-react'
import { PlanClient } from './plan-client'

export const dynamic = 'force-dynamic'

export default async function PacientePlanPage() {
  const { patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({ select: { id: true } })
    patientId = firstPatient?.id || null
  }

  const plan = patientId
    ? await prisma.mealPlan.findFirst({
        where: {
          patientId,
          isSharedWithPatient: true,
          status: 'PUBLISHED',
        },
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              meals: {
                orderBy: { order: 'asc' },
                include: {
                  items: {
                    include: {
                      food: true,
                      recipe: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    : null

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/paciente"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al inicio</span>
          </Link>
        </div>

        <Card className="text-center py-16 px-6 border-dashed border-gray-300 rounded-3xl bg-white shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No tienes un plan publicado todavía</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Tu nutricionista Eva Vidal está elaborando tu pauta alimentaria personalizada.
            En cuanto esté revisada y publicada, la tendrás disponible aquí para consultarla cuando quieras.
          </p>
          <div className="mt-6">
            <Link href="/paciente">
              <Button variant="outline" size="sm" className="rounded-2xl">
                Volver a Inicio
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <PlanClient
      plan={{
        id: plan.id,
        name: plan.name,
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate ? plan.endDate.toISOString() : null,
        targetKcal: plan.targetKcal,
        hideCaloriesTCA: plan.hideCaloriesTCA,
        notes: plan.notes,
        days: plan.days.map((d) => ({
          id: d.id,
          dayNumber: d.dayNumber,
          customName: d.customName,
          meals: d.meals.map((m) => ({
            id: m.id,
            mealType: m.mealType,
            order: m.order,
            items: m.items.map((it) => ({
              id: it.id,
              quantityG: it.quantityG,
              servings: it.servings,
              notes: it.notes,
              food: it.food
                ? {
                    id: it.food.id,
                    name: it.food.name,
                    category: it.food.category,
                    calories: it.food.calories,
                    proteinG: it.food.proteinG,
                    carbsG: it.food.carbsG,
                    fatG: it.food.fatG,
                    servingSize: it.food.servingSize,
                    servingUnit: it.food.servingUnit,
                  }
                : null,
              recipe: it.recipe
                ? {
                    id: it.recipe.id,
                    name: it.recipe.name,
                    instructions: it.recipe.instructions,
                    servings: it.recipe.servings,
                    prepTimeMin: it.recipe.prepTimeMin,
                    cookTimeMin: it.recipe.cookTimeMin,
                  }
                : null,
            })),
          })),
        })),
      }}
    />
  )
}
