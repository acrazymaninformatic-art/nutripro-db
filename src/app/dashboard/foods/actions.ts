'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getFoods(
  search?: string,
  category?: string,
  page: number = 1,
  pageSize: number = 40
) {
  const where: any = {}

  if (search && search.trim() !== '') {
    where.name = {
      contains: search.trim(),
    }
  }

  if (category && category !== 'ALL') {
    where.category = category
  }

  const [total, foods] = await Promise.all([
    prisma.food.count({ where }),
    prisma.food.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: Math.max(0, (page - 1) * pageSize),
      take: pageSize,
    }),
  ])

  return {
    foods,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}


export async function getCategories() {
  const foods = await prisma.food.findMany({
    select: { category: true },
    distinct: ['category'],
  })
  return foods.map(f => f.category).filter(Boolean) as string[]
}

export async function getAllFoodsForBrowser() {
  return prisma.food.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      calories: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
      fiberG: true,
      imageUrl: true,
      source: true,
    },
    orderBy: { name: 'asc' },
  })
}


export async function createFood(formData: FormData) {
  const name = formData.get('name') as string
  const category = (formData.get('category') as string) || 'Otros'
  const servingSize = parseFloat(formData.get('servingSize') as string) || 100
  const calories = parseFloat(formData.get('calories') as string) || 0
  const proteinG = parseFloat(formData.get('proteinG') as string) || 0
  const carbsG = parseFloat(formData.get('carbsG') as string) || 0
  const fatG = parseFloat(formData.get('fatG') as string) || 0
  const fiberG = parseFloat(formData.get('fiberG') as string) || 0
  const sodiumMg = parseFloat(formData.get('sodiumMg') as string) || 0

  const food = await prisma.food.create({
    data: {
      name,
      category,
      servingSize,
      servingUnit: 'g',
      calories,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      sodiumMg,
      source: 'custom',
    },
  })

  revalidatePath('/dashboard/foods')
  revalidatePath('/dashboard/recipes')
  revalidatePath('/dashboard/plans')
  return food
}

export async function deleteFood(id: number) {
  await prisma.food.delete({
    where: { id },
  })

  revalidatePath('/dashboard/foods')
}
