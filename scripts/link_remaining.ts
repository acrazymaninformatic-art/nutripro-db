import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dorada = await prisma.recipe.findFirst({ where: { name: { contains: 'Dorada' } } })
  const pollo = await prisma.recipe.findFirst({ where: { name: { contains: 'Pollo Rústico' } } })
  const fDorada = await prisma.food.findFirst({ where: { name: { contains: 'Dorada' } } })
  const fPatata = await prisma.food.findFirst({ where: { name: { contains: 'Patata' } } })
  const fPollo = await prisma.food.findFirst({ where: { name: { contains: 'Pollo' } } })
  const fAceite = await prisma.food.findFirst({ where: { name: { contains: 'Aceite' } } })

  if (dorada && fDorada && fPatata && fAceite) {
    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: dorada.id, foodId: fDorada.id, quantityG: 200, notes: '200g limpia' },
        { recipeId: dorada.id, foodId: fPatata.id, quantityG: 150, notes: '150g' },
        { recipeId: dorada.id, foodId: fAceite.id, quantityG: 10, notes: '10g' }
      ]
    })
    console.log('✅ Dorada linked successfully!')
  }

  if (pollo && fPollo && fPatata && fAceite) {
    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: pollo.id, foodId: fPollo.id, quantityG: 300, notes: '300g' },
        { recipeId: pollo.id, foodId: fPatata.id, quantityG: 200, notes: '200g' },
        { recipeId: pollo.id, foodId: fAceite.id, quantityG: 15, notes: '15g' }
      ]
    })
    console.log('✅ Pollo linked successfully!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
