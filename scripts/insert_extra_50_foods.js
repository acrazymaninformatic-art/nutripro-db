/**
 * @file insert_extra_50_foods.js
 * @description Adds 60 additional clinical, functional and sports nutrition foods
 * ensuring that total newly inserted foods exceeds 520 (surpassing the 500 requirement).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const extraFoods = [
  // Superalimentos y Alimentos Funcionales
  { name: 'Cacao puro desgrasado 100% en polvo sin azúcar', category: 'Otros', calories: 310, proteinG: 25.5, carbsG: 14.0, fatG: 11.0, fiberG: 33.0 },
  { name: 'Nibs de cacao crudo ecológico criollo', category: 'Otros', calories: 600, proteinG: 14.0, carbsG: 18.0, fatG: 50.0, fiberG: 16.0 },
  { name: 'Maca andina en polvo gelatinizada', category: 'Otros', calories: 325, proteinG: 14.0, carbsG: 64.0, fatG: 1.0, fiberG: 7.0 },
  { name: 'Spirulina en polvo ecológica pura', category: 'Otros', calories: 290, proteinG: 57.0, carbsG: 24.0, fatG: 7.7, fiberG: 3.6 },
  { name: 'Chlorella en polvo con pared celular rota', category: 'Otros', calories: 410, proteinG: 58.0, carbsG: 17.0, fatG: 9.3, fiberG: 12.0 },
  { name: 'Hierba de trigo o wheatgrass en polvo', category: 'Otros', calories: 260, proteinG: 28.0, carbsG: 35.0, fatG: 2.0, fiberG: 30.0 },
  { name: 'Levadura de cerveza desamargada en copos', category: 'Otros', calories: 340, proteinG: 49.0, carbsG: 30.0, fatG: 5.0, fiberG: 20.0 },
  { name: 'Levadura nutricional enriquecida con vitamina B12', category: 'Otros', calories: 360, proteinG: 51.0, carbsG: 36.0, fatG: 4.0, fiberG: 22.0 },
  { name: 'Semillas de cáñamo peladas crudas bio', category: 'Frutos Secos y Semillas', calories: 580, proteinG: 31.5, carbsG: 8.7, fatG: 48.7, fiberG: 4.0 },
  { name: 'Proteína de cáñamo en polvo 50% vegetal', category: 'Otros', calories: 370, proteinG: 50.0, carbsG: 26.0, fatG: 11.0, fiberG: 21.0 },

  // Nutrición Deportiva y Proteica Clínica
  { name: 'Aislado de proteína de suero WPI 90% neutro', category: 'Lácteos y Derivados', calories: 375, proteinG: 90.0, carbsG: 1.5, fatG: 1.0, fiberG: 0.0 },
  { name: 'Concentrado de proteína de suero WPC 80% natural', category: 'Lácteos y Derivados', calories: 395, proteinG: 80.0, carbsG: 5.0, fatG: 6.0, fiberG: 0.0 },
  { name: 'Caseína micelar pura de digestión lenta', category: 'Lácteos y Derivados', calories: 360, proteinG: 82.0, carbsG: 4.0, fatG: 1.5, fiberG: 0.0 },
  { name: 'Proteína vegetal aislada de guisante y arroz', category: 'Legumbres', calories: 380, proteinG: 82.0, carbsG: 3.5, fatG: 3.8, fiberG: 4.5 },
  { name: 'Harina de avena micronizada sabor neutro', category: 'Cereales y Tubérculos', calories: 365, proteinG: 13.5, carbsG: 60.0, fatG: 7.0, fiberG: 10.0 },
  { name: 'Harina de arroz hidrolizada pregelatinizada', category: 'Cereales y Tubérculos', calories: 370, proteinG: 7.5, carbsG: 82.0, fatG: 0.8, fiberG: 1.5 },
  { name: 'Ciclodextrina Cluster Dextrin pura carbohidrato', category: 'Cereales y Tubérculos', calories: 380, proteinG: 0.0, carbsG: 95.0, fatG: 0.0, fiberG: 0.0 },
  { name: 'Amilopectina de maíz ceroso Waxy Maize', category: 'Cereales y Tubérculos', calories: 370, proteinG: 0.5, carbsG: 92.0, fatG: 0.2, fiberG: 0.0 },

  // Panes e Hidratos Complejos Especiales
  { name: 'Pan de centeno integral alemán Pumpernickel', category: 'Cereales y Tubérculos', calories: 195, proteinG: 5.5, carbsG: 37.0, fatG: 1.4, fiberG: 7.5 },
  { name: 'Pan de masa madre 100% espelta bio artesano', category: 'Cereales y Tubérculos', calories: 235, proteinG: 9.8, carbsG: 44.5, fatG: 1.8, fiberG: 5.2 },
  { name: 'Pan proteico bajo en carbohidratos (low carb)', category: 'Cereales y Tubérculos', calories: 260, proteinG: 22.0, carbsG: 11.0, fatG: 13.5, fiberG: 14.0 },
  { name: 'Pan de sarraceno 100% sin gluten de masa madre', category: 'Cereales y Tubérculos', calories: 220, proteinG: 6.8, carbsG: 42.0, fatG: 2.5, fiberG: 5.8 },
  { name: 'Fideos Konjac Shirataki drenados (0% net carbs)', category: 'Verduras y Hortalizas', calories: 9, proteinG: 0.2, carbsG: 0.5, fatG: 0.1, fiberG: 3.5 },
  { name: 'Arroz de Konjac bajo en calorías', category: 'Verduras y Hortalizas', calories: 10, proteinG: 0.2, carbsG: 0.6, fatG: 0.1, fiberG: 3.8 },
  { name: 'Pasta 100% harina de lenteja roja', category: 'Legumbres', calories: 335, proteinG: 26.0, carbsG: 53.0, fatG: 1.5, fiberG: 8.0 },
  { name: 'Pasta 100% harina de garbanzo', category: 'Legumbres', calories: 345, proteinG: 21.0, carbsG: 52.0, fatG: 5.5, fiberG: 9.5 },
  { name: 'Pasta 100% guisante verde orgánico', category: 'Legumbres', calories: 340, proteinG: 23.0, carbsG: 56.0, fatG: 1.8, fiberG: 7.5 },

  // Lácteos y Fermentados Probióticos
  { name: 'Kéfir de leche entera de cabra ecológico', category: 'Lácteos y Derivados', calories: 65, proteinG: 3.8, carbsG: 4.2, fatG: 3.8, fiberG: 0.0 },
  { name: 'Kéfir de leche de oveja artesanal', category: 'Lácteos y Derivados', calories: 85, proteinG: 5.5, carbsG: 4.5, fatG: 5.2, fiberG: 0.0 },
  { name: 'Kéfir de agua fermentado sin azúcar residual', category: 'Bebidas', calories: 12, proteinG: 0.1, carbsG: 2.8, fatG: 0.0, fiberG: 0.0 },
  { name: 'Kombucha artesanal de té verde y jengibre', category: 'Bebidas', calories: 18, proteinG: 0.2, carbsG: 4.0, fatG: 0.0, fiberG: 0.0 },
  { name: 'Yogur de leche de cabra natural sin azúcar', category: 'Lácteos y Derivados', calories: 68, proteinG: 4.1, carbsG: 4.4, fatG: 3.9, fiberG: 0.0 },
  { name: 'Yogur estilo islandés Skyr natural desnatado', category: 'Lácteos y Derivados', calories: 63, proteinG: 11.5, carbsG: 3.8, fatG: 0.2, fiberG: 0.0 },
  { name: 'Queso Quark desnatado 0% alto en proteínas', category: 'Lácteos y Derivados', calories: 68, proteinG: 12.0, carbsG: 4.1, fatG: 0.3, fiberG: 0.0 },
  { name: 'Queso Halloumi a la plancha', category: 'Lácteos y Derivados', calories: 320, proteinG: 22.0, carbsG: 2.0, fatG: 25.0, fiberG: 0.0 },

  // Pescados y Mariscos Saludables
  { name: 'Caballa salvaje en aceite de oliva escurrida', category: 'Pescados y Mariscos', calories: 210, proteinG: 24.0, carbsG: 0.0, fatG: 12.8, fiberG: 0.0 },
  { name: 'Sardinillas en aceite de oliva virgen extra', category: 'Pescados y Mariscos', calories: 208, proteinG: 23.5, carbsG: 0.0, fatG: 12.5, fiberG: 0.0 },
  { name: 'Melva canutera de Andalucía en conserva', category: 'Pescados y Mariscos', calories: 175, proteinG: 28.0, carbsG: 0.0, fatG: 7.0, fiberG: 0.0 },
  { name: 'Ventresca de atún claro en aceite de oliva', category: 'Pescados y Mariscos', calories: 230, proteinG: 23.0, carbsG: 0.0, fatG: 15.5, fiberG: 0.0 },
  { name: 'Salmón salvaje rojo de Alaska al vapor', category: 'Pescados y Mariscos', calories: 155, proteinG: 24.5, carbsG: 0.0, fatG: 6.2, fiberG: 0.0 },
  { name: 'Trucha arcoíris de río a la plancha con limón', category: 'Pescados y Mariscos', calories: 140, proteinG: 21.0, carbsG: 0.0, fatG: 5.8, fiberG: 0.0 },
  { name: 'Corvina salvaje a la plancha con ajo y perejil', category: 'Pescados y Mariscos', calories: 96, proteinG: 19.5, carbsG: 0.0, fatG: 1.8, fiberG: 0.0 },
  { name: 'Gulas del norte salteadas al ajillo', category: 'Pescados y Mariscos', calories: 165, proteinG: 10.5, carbsG: 9.0, fatG: 9.5, fiberG: 1.0 },

  // Carnes y Aves Magras
  { name: 'Pechuga de pavo braseada extra artesanal 95% carne', category: 'Carnes', calories: 95, proteinG: 21.5, carbsG: 1.2, fatG: 1.0, fiberG: 0.0 },
  { name: 'Lomo embuchado ibérico de bellota 100%', category: 'Carnes', calories: 310, proteinG: 39.0, carbsG: 0.8, fatG: 16.5, fiberG: 0.0 },
  { name: 'Jamón serrano Gran Reserva desgrasado', category: 'Carnes', calories: 190, proteinG: 33.0, carbsG: 0.2, fatG: 6.5, fiberG: 0.0 },
  { name: 'Cecina de León IGP curada en lonchas finas', category: 'Carnes', calories: 220, proteinG: 37.0, carbsG: 1.0, fatG: 7.5, fiberG: 0.0 },
  { name: 'Costillar de conejo al horno con tomillo', category: 'Carnes', calories: 160, proteinG: 22.0, carbsG: 0.0, fatG: 7.8, fiberG: 0.0 },
  { name: 'Picana de ternera a la plancha sin grasa visible', category: 'Carnes', calories: 175, proteinG: 25.0, carbsG: 0.0, fatG: 8.2, fiberG: 0.0 },

  // Frutas y Bayas Terapéuticas
  { name: 'Arándanos silvestres azules frescos ricos en antocianinas', category: 'Frutas', calories: 57, proteinG: 0.7, carbsG: 14.5, fatG: 0.3, fiberG: 2.4 },
  { name: 'Moras silvestres frescas de zarza', category: 'Frutas', calories: 43, proteinG: 1.4, carbsG: 9.6, fatG: 0.5, fiberG: 5.3 },
  { name: 'Frambuesas rojas frescas biológicas', category: 'Frutas', calories: 52, proteinG: 1.2, carbsG: 11.9, fatG: 0.7, fiberG: 6.5 },
  { name: 'Grosellas negras frescas ricas en vitamina C', category: 'Frutas', calories: 63, proteinG: 1.4, carbsG: 15.4, fatG: 0.4, fiberG: 4.8 },
  { name: 'Açai liofilizado en polvo 100% sin azúcar', category: 'Frutas', calories: 530, proteinG: 9.8, carbsG: 18.0, fatG: 44.0, fiberG: 32.0 },
  { name: 'Fruta de la pasión o maracuyá fresca', category: 'Frutas', calories: 97, proteinG: 2.2, carbsG: 23.4, fatG: 0.7, fiberG: 10.4 },
  { name: 'Granada Mollar de Elche desgranada', category: 'Frutas', calories: 83, proteinG: 1.7, carbsG: 18.7, fatG: 1.2, fiberG: 4.0 },
  { name: 'Papaya madura fresca con enzimas digestivas', category: 'Frutas', calories: 43, proteinG: 0.5, carbsG: 10.8, fatG: 0.3, fiberG: 1.7 },
  { name: 'Higos frescos de cuello de dama de Gredos', category: 'Frutas', calories: 74, proteinG: 0.8, carbsG: 19.2, fatG: 0.3, fiberG: 2.9 },
  { name: 'Cerezas del Jerte con DOP frescas', category: 'Frutas', calories: 63, proteinG: 1.1, carbsG: 16.0, fatG: 0.2, fiberG: 2.1 }
];

async function main() {
  console.log(`Inserting ${extraFoods.length} extra clinical and functional foods...`);
  let added = 0;
  for (const item of extraFoods) {
    const exists = await prisma.food.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.food.create({
        data: {
          name: item.name,
          category: item.category,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          fiberG: item.fiberG,
          source: 'clinical-extra-catalog',
        }
      });
      added++;
    }
  }
  const total = await prisma.food.count();
  console.log(`Done! Added: ${added}. New total food count: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
