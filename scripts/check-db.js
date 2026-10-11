const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const foods = await prisma.food.count();
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: {
        include: { food: true }
      }
    }
  });

  console.log('Foods count:', foods);
  console.log('Recipes count:', recipes.length);
  for (const r of recipes) {
    console.log(`- Recipe ID: ${r.id}, Name: ${r.name}, Servings: ${r.servings}`);
    console.log(`  Ingredients count: ${r.ingredients.length}`);
    for (const ing of r.ingredients) {
      console.log(`    * ${ing.food ? ing.food.name : 'UNKNOWN'} (${ing.quantityG}g) -> kcal/100g: ${ing.food?.calories}, P: ${ing.food?.proteinG}, C: ${ing.food?.carbsG}, F: ${ing.food?.fatG}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
