import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PlanBuilderForm } from './plan-builder-form'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function NewMealPlanPage() {
  const userId = await requireUserId()
  const [patients, foods] = await Promise.all([
    prisma.patient.findMany({
      where: { userId, isActive: true },
      orderBy: { lastName: 'asc' },
      include: {
        anthropometries: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.food.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        imageUrl: true,
        calories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        fiberG: true,
        sugarG: true,
        saturatedFatG: true,
        sodiumMg: true,
      },
    }),
  ])

  const formattedPatients = patients.map((p) => ({
    id: p.id,
    name: `${p.lastName}, ${p.firstName}`,
    firstName: p.firstName,
    lastName: p.lastName,
    birthDate: p.birthDate.toISOString(),
    sex: p.sex,
    heightCm: p.heightCm,
    objective: p.objective,
    activityLevel: p.activityLevel,
    allergies: p.allergies || '',
    intolerances: p.intolerances || '',
    dietaryPreferences: p.dietaryPreferences || '',
    foodAversions: p.foodAversions || '',
    medicalHistory: p.medicalHistory || '',
    currentMedications: p.currentMedications || '',
    isGLP1Treatment: Boolean(p.isGLP1Treatment),
    isTCAProtocol: Boolean(p.isTCAProtocol),
    latestWeightKg: p.anthropometries[0]?.weightKg || 70,
    latestBodyFatPct: p.anthropometries[0]?.bodyFatPct || null,
  }))

  return (
    <div className="space-y-6 max-w-[1750px] w-full px-2 sm:px-6 mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a planes</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-green-50 rounded-xl text-green-700">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Pauta Nutricional</h1>
          <p className="text-sm text-gray-500">
            Diseña el menú semanal adaptado automáticamente a la biometría, objetivos y alérgenos del paciente.
          </p>
        </div>
      </div>

      <PlanBuilderForm patients={formattedPatients} foods={foods} />
    </div>
  )
}
