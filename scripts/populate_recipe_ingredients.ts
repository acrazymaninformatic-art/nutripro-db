import { PrismaClient } from '@prisma/client'
import { CLINICAL_RECIPES } from '../src/lib/nutrition/recipes-catalog'

const prisma = new PrismaClient()

// Helper to parse grams from quantity string
function parseQuantityGrams(quantityStr: string): number {
  const str = quantityStr.toLowerCase().trim()
  
  // Direct grams match: "180 g", "80g en crudo", etc.
  const gMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramos)/)
  if (gMatch) {
    return parseFloat(gMatch[1].replace(',', '.'))
  }

  // Milliliters match: "200 ml" -> roughly 200g
  const mlMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|mililitros)/)
  if (mlMatch) {
    return parseFloat(mlMatch[1].replace(',', '.'))
  }

  // Units match: "2 huevos (110 g)" -> already has grams or units
  const unitsMatch = str.match(/(\d+)\s*(?:u|unidad|unidades)/)
  if (unitsMatch) {
    const count = parseInt(unitsMatch[1], 10)
    if (str.includes('huevo')) return count * 55
    if (str.includes('diente') || str.includes('ajo')) return count * 5
    if (str.includes('hoja') || str.includes('laurel')) return 1
    return count * 50
  }

  // Tablespoons / teaspoons
  if (str.includes('cucharada sopera') || str.includes('1 cda')) return 15
  if (str.includes('cucharadita') || str.includes('1 cdta')) return 5
  if (str.includes('pizca') || str.includes('al gusto')) return 2

  // Default fallback
  const anyNum = str.match(/\d+/)
  if (anyNum) return parseInt(anyNum[0], 10)
  return 30
}

async function findOrCreateFood(ingredientName: string) {
  const cleanName = ingredientName.toLowerCase()

  // Keyword lookup in existing Food table
  const searchTerms = cleanName
    .replace(/[(),]/g, ' ')
    .split(' ')
    .filter(w => w.length > 3 && !['fresco', 'limpia', 'limpio', 'cocido', 'cocida', 'trozos', 'rodajas', 'dados', 'crudo', 'fileteada'].includes(w))

  for (const term of searchTerms) {
    const found = await prisma.food.findFirst({
      where: {
        name: {
          contains: term,
          mode: 'insensitive'
        }
      }
    })
    if (found) return found
  }

  // Fallback: create food if not found
  console.log(`Creating food for ingredient: "${ingredientName}"`)
  return await prisma.food.create({
    data: {
      name: ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1),
      category: 'Preparados y Otros',
      calories: 120,
      proteinG: 8,
      carbsG: 12,
      fatG: 4,
      fiberG: 1.5,
      source: 'custom'
    }
  })
}

async function main() {
  console.log('Connecting ingredients to all clinical recipes...')

  for (const clinicalRec of CLINICAL_RECIPES) {
    // Find recipe in DB
    const dbRecipe = await prisma.recipe.findFirst({
      where: {
        name: {
          contains: clinicalRec.name.slice(0, 25),
          mode: 'insensitive'
        }
      },
      include: {
        ingredients: true
      }
    })

    if (!dbRecipe) {
      console.log(`⚠️ Recipe not found in DB: ${clinicalRec.name}`)
      continue
    }

    // If it has no ingredients, let's populate them
    if (dbRecipe.ingredients.length === 0) {
      console.log(`📦 Seeding ingredients for: "${dbRecipe.name}"`)
      for (const ing of clinicalRec.ingredients) {
        const grams = parseQuantityGrams(ing.quantity)
        const food = await findOrCreateFood(ing.name)

        await prisma.recipeIngredient.create({
          data: {
            recipeId: dbRecipe.id,
            foodId: food.id,
            quantityG: grams,
            notes: ing.quantity
          }
        })
      }
    } else {
      console.log(`✓ Recipe "${dbRecipe.name}" already has ${dbRecipe.ingredients.length} ingredients.`)
    }
  }

  console.log('✅ Finished linking recipe ingredients!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
