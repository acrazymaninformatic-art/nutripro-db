'use server'

import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth'

export interface GlobalSearchResult {
  id: string
  title: string
  subtitle?: string
  category: 'Pacientes' | 'Recetas' | 'Alimentos' | 'Planes'
  href: string
}

/**
 * Búsqueda global de la consulta: pacientes, recetas, alimentos y planes.
 * Devuelve como máximo 6 resultados por tipo para no saturar la paleta.
 */
export async function searchEverything(query: string): Promise<GlobalSearchResult[]> {
  const userId = await requireUserId()
  const term = query.trim()

  if (term.length < 2) return []

  const [patients, recipes, foods, plans] = await Promise.all([
    prisma.patient.findMany({
      where: {
        userId,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 6,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        objective: true,
        isActive: true,
      },
    }),
    prisma.recipe.findMany({
      where: {
        userId,
        name: { contains: term, mode: 'insensitive' },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, category: true, servings: true },
    }),
    prisma.food.findMany({
      where: {
        name: { contains: term, mode: 'insensitive' },
        OR: [{ userId: null, isPrivate: false }, { userId }],
      },
      take: 5,
      select: { id: true, name: true, category: true, calories: true },
    }),
    prisma.mealPlan.findMany({
      where: {
        userId,
        name: { contains: term, mode: 'insensitive' },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        targetKcal: true,
        patient: { select: { firstName: true, lastName: true } },
      },
    }),
  ])

  return [
    ...patients.map((patient) => ({
      id: `patient-${patient.id}`,
      title: `${patient.firstName} ${patient.lastName}`,
      subtitle: `${patient.email || patient.phone || 'Sin contacto'}${
        patient.isActive ? '' : ' · En papelera'
      }`,
      category: 'Pacientes' as const,
      href: `/dashboard/patients/${patient.id}`,
    })),
    ...recipes.map((recipe) => ({
      id: `recipe-${recipe.id}`,
      title: recipe.name,
      subtitle: `${recipe.category || 'Receta'} · ${recipe.servings} raciones`,
      category: 'Recetas' as const,
      href: `/dashboard/recipes/${recipe.id}`,
    })),
    ...foods.map((food) => ({
      id: `food-${food.id}`,
      title: food.name,
      subtitle: `${food.category || 'Alimento'} · ${Math.round(food.calories)} kcal / 100 g`,
      category: 'Alimentos' as const,
      href: `/dashboard/foods?q=${encodeURIComponent(food.name)}`,
    })),
    ...plans.map((plan) => ({
      id: `plan-${plan.id}`,
      title: plan.name,
      subtitle: `${plan.patient.firstName} ${plan.patient.lastName} · ${Math.round(
        plan.targetKcal
      )} kcal/día`,
      category: 'Planes' as const,
      href: `/dashboard/plans/${plan.id}`,
    })),
  ]
}
