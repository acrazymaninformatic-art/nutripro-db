const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const batch3 = [
  // CEREALES, DESAYUNOS Y BOLLERÍA FITNESS
  { name: 'Copos de maíz tostados sin azúcar (Corn Flakes)', category: 'Cereales y Derivados', calories: 375, proteinG: 7.5, carbsG: 84.0, fatG: 0.9, fiberG: 3.0 },
  { name: 'Granola casera con nueces, semillas y miel', category: 'Cereales y Derivados', calories: 471, proteinG: 10.2, carbsG: 64.0, fatG: 20.0, fiberG: 7.8 },
  { name: 'Muesli suizo tradicional sin azúcar añadido', category: 'Cereales y Derivados', calories: 365, proteinG: 11.0, carbsG: 62.0, fatG: 6.5, fiberG: 9.2 },
  { name: 'Salvado de avena bio rico en betaglucanos', category: 'Cereales y Derivados', calories: 246, proteinG: 17.3, carbsG: 66.2, fatG: 7.0, fiberG: 15.4 },
  { name: 'Salvado de trigo fino', category: 'Cereales y Derivados', calories: 216, proteinG: 15.5, carbsG: 64.5, fatG: 4.2, fiberG: 42.8 },
  { name: 'Copos de espelta integral suaves', category: 'Cereales y Derivados', calories: 340, proteinG: 13.0, carbsG: 63.0, fatG: 2.7, fiberG: 8.5 },
  { name: 'Copos de centeno integral bio', category: 'Cereales y Derivados', calories: 325, proteinG: 9.5, carbsG: 61.0, fatG: 1.7, fiberG: 13.0 },
  { name: 'Arroz hinchado bio sin azúcar', category: 'Cereales y Derivados', calories: 382, proteinG: 6.5, carbsG: 85.0, fatG: 1.0, fiberG: 2.0 },
  { name: 'Quinoa hinchada bio para desayuno', category: 'Cereales y Derivados', calories: 364, proteinG: 12.0, carbsG: 65.0, fatG: 5.5, fiberG: 6.8 },
  { name: 'Espelta hinchada con miel', category: 'Cereales y Derivados', calories: 370, proteinG: 11.5, carbsG: 72.0, fatG: 2.5, fiberG: 6.0 },

  // LEGUMBRES COCIDAS Y EN BOTE DE CONSERVA ESPAÑOLAS
  { name: 'Garbanzo pedrosillano cocido en conserva', category: 'Legumbres', calories: 128, proteinG: 7.2, carbsG: 18.5, fatG: 2.1, fiberG: 5.8 },
  { name: 'Garbanzo lechoso andaluz cocido', category: 'Legumbres', calories: 132, proteinG: 7.5, carbsG: 19.0, fatG: 2.3, fiberG: 6.0 },
  { name: 'Alubia blanca de riñón cocida en tarro', category: 'Legumbres', calories: 95, proteinG: 7.0, carbsG: 13.5, fatG: 0.5, fiberG: 5.5 },
  { name: 'Alubia tolosana / negra cocida', category: 'Legumbres', calories: 105, proteinG: 8.2, carbsG: 15.0, fatG: 0.6, fiberG: 6.2 },
  { name: 'Alubia pinta cocida en tarro', category: 'Legumbres', calories: 102, proteinG: 7.8, carbsG: 14.8, fatG: 0.5, fiberG: 5.8 },
  { name: 'Alubia del Ganxet D.O. cocida', category: 'Legumbres', calories: 98, proteinG: 8.0, carbsG: 14.0, fatG: 0.6, fiberG: 5.9 },
  { name: 'Judión de La Granja cocido', category: 'Legumbres', calories: 112, proteinG: 7.6, carbsG: 16.5, fatG: 0.7, fiberG: 6.5 },
  { name: 'Lenteja pardina cocida en tarro', category: 'Legumbres', calories: 116, proteinG: 9.0, carbsG: 16.2, fatG: 0.6, fiberG: 4.8 },
  { name: 'Lenteja castellana cocida en tarro', category: 'Legumbres', calories: 118, proteinG: 8.8, carbsG: 16.8, fatG: 0.7, fiberG: 5.2 },
  { name: 'Lenteja verde du Puy cocida', category: 'Legumbres', calories: 115, proteinG: 9.2, carbsG: 15.5, fatG: 0.6, fiberG: 5.5 },
  { name: 'Habas secas baby cocidas', category: 'Legumbres', calories: 110, proteinG: 7.6, carbsG: 15.0, fatG: 0.6, fiberG: 5.4 },
  { name: 'Altramuces en salmuera escurridos', category: 'Legumbres', calories: 119, proteinG: 15.6, carbsG: 7.1, fatG: 2.9, fiberG: 3.0 },

  // FRUTOS SECOS Y SEMILLAS SELECCIONADAS
  { name: 'Nueces de pecán crudas', category: 'Frutos Secos y Semillas', calories: 691, proteinG: 9.2, carbsG: 13.9, fatG: 72.0, fiberG: 9.6 },
  { name: 'Nueces de California peladas', category: 'Frutos Secos y Semillas', calories: 654, proteinG: 15.2, carbsG: 13.7, fatG: 65.2, fiberG: 6.7 },
  { name: 'Avellanas de Reus D.O. tostadas sin sal', category: 'Frutos Secos y Semillas', calories: 646, proteinG: 15.0, carbsG: 11.0, fatG: 62.4, fiberG: 9.7 },
  { name: 'Almendra marcona frita con sal marina', category: 'Frutos Secos y Semillas', calories: 620, proteinG: 18.5, carbsG: 9.0, fatG: 56.0, fiberG: 8.5 },
  { name: 'Almendra marcona cruda con piel', category: 'Frutos Secos y Semillas', calories: 579, proteinG: 21.2, carbsG: 21.6, fatG: 49.9, fiberG: 12.5 },
  { name: 'Pistachos tostados de La Mancha con cáscara', category: 'Frutos Secos y Semillas', calories: 562, proteinG: 20.3, carbsG: 27.5, fatG: 45.3, fiberG: 10.6 },
  { name: 'Piñones nacionales de Castilla y León', category: 'Frutos Secos y Semillas', calories: 673, proteinG: 13.7, carbsG: 13.1, fatG: 68.4, fiberG: 3.7 },
  { name: 'Castañas asadas al fuego', category: 'Frutos Secos y Semillas', calories: 245, proteinG: 3.2, carbsG: 53.0, fatG: 2.2, fiberG: 5.1 },
  { name: 'Castañas gallegas frescas crudas', category: 'Frutos Secos y Semillas', calories: 170, proteinG: 2.0, carbsG: 36.5, fatG: 1.5, fiberG: 4.8 },

  // HUEVOS Y PREPARACIONES DE HUEVO
  { name: 'Huevos camperos clase L (Caserío/Granja)', category: 'Huevos y Lácteos', calories: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5, fiberG: 0 },
  { name: 'Huevos ecológicos certificados', category: 'Huevos y Lácteos', calories: 145, proteinG: 12.8, carbsG: 0.6, fatG: 9.7, fiberG: 0 },
  { name: 'Huevo poché / escalfado en agua con vinagre', category: 'Huevos y Lácteos', calories: 143, proteinG: 12.5, carbsG: 0.7, fatG: 9.5, fiberG: 0 },
  { name: 'Huevo cocido duro (10 minutos)', category: 'Huevos y Lácteos', calories: 155, proteinG: 13.0, carbsG: 1.1, fatG: 10.6, fiberG: 0 },
  { name: 'Huevo pasado por agua (4 minutos)', category: 'Huevos y Lácteos', calories: 150, proteinG: 12.8, carbsG: 0.8, fatG: 10.2, fiberG: 0 },
  { name: 'Huevos revueltos con unas gotas de aceite', category: 'Huevos y Lácteos', calories: 168, proteinG: 12.0, carbsG: 1.5, fatG: 12.5, fiberG: 0 },
  { name: 'Huevos a la plancha sin aceite añadido', category: 'Huevos y Lácteos', calories: 152, proteinG: 13.2, carbsG: 0.8, fatG: 10.5, fiberG: 0 },
  { name: 'Claras pasteurizadas en botella Mercadona', category: 'Huevos y Lácteos', calories: 50, proteinG: 11.0, carbsG: 0.7, fatG: 0.2, fiberG: 0 },

  // POSTRES SALUDABLES, CHOCOLATES Y SNACKS
  { name: 'Chocolate negro 90% cacao Lindt Excellence', category: 'Azúcares y Edulcorantes', calories: 592, proteinG: 10.0, carbsG: 14.0, fatG: 55.0, fiberG: 13.0 },
  { name: 'Chocolate negro 99% cacao puro', category: 'Azúcares y Edulcorantes', calories: 573, proteinG: 13.0, carbsG: 8.0, fatG: 53.0, fiberG: 17.0 },
  { name: 'Chocolate negro 85% cacao con almendras', category: 'Azúcares y Edulcorantes', calories: 580, proteinG: 11.0, carbsG: 20.0, fatG: 49.0, fiberG: 11.0 },
  { name: 'Cacao nibs ecológicos crudos (trozos de haba)', category: 'Azúcares y Edulcorantes', calories: 600, proteinG: 14.0, carbsG: 16.0, fatG: 52.0, fiberG: 21.0 },
  { name: 'Pudin de semillas de chía con leche de almendras', category: 'Preparados y Otros', calories: 95, proteinG: 3.5, carbsG: 6.5, fatG: 5.8, fiberG: 5.2 },
  { name: 'Porridge de avena con canela y manzana', category: 'Preparados y Otros', calories: 115, proteinG: 3.8, carbsG: 19.5, fatG: 2.2, fiberG: 3.1 },
  { name: 'Açai bowl puro congelado sin azúcar', category: 'Frutas', calories: 70, proteinG: 1.5, carbsG: 4.0, fatG: 5.0, fiberG: 3.5 },
  { name: 'Manzana asada al horno con canela', category: 'Frutas', calories: 65, proteinG: 0.4, carbsG: 15.5, fatG: 0.2, fiberG: 2.5 },
  { name: 'Pera cocida al vino tinto sin azúcar', category: 'Frutas', calories: 75, proteinG: 0.5, carbsG: 16.0, fatG: 0.2, fiberG: 2.8 },

  // BEBIDAS E INFUSIONES SALUDABLES
  { name: 'Té verde Matcha ceremonial en polvo', category: 'Bebidas', calories: 320, proteinG: 30.0, carbsG: 38.0, fatG: 5.0, fiberG: 28.0 },
  { name: 'Infusión de manzanilla con anís', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Infusión de poleo menta natural', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Infusión de rooibos con vainilla', category: 'Bebidas', calories: 2, proteinG: 0, carbsG: 0.4, fatG: 0, fiberG: 0 },
  { name: 'Infusión de jengibre y cúrcuma fresca', category: 'Bebidas', calories: 3, proteinG: 0.1, carbsG: 0.6, fatG: 0, fiberG: 0 },
  { name: 'Café solo espresso sin azúcar', category: 'Bebidas', calories: 2, proteinG: 0.1, carbsG: 0.3, fatG: 0, fiberG: 0 },
  { name: 'Café con leche desnatada sin azúcar', category: 'Bebidas', calories: 22, proteinG: 1.8, carbsG: 2.5, fatG: 0.1, fiberG: 0 },
  { name: 'Café con leche de soja sin azúcar', category: 'Bebidas', calories: 20, proteinG: 1.7, carbsG: 1.0, fatG: 0.9, fiberG: 0.3 },
  { name: 'Agua con gas natural Magma de Cabreiroá', category: 'Bebidas', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  { name: 'Agua de coco 100% pura natural', category: 'Bebidas', calories: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, fiberG: 1.1 },
];

async function main() {
  console.log(`🌱 Insertando lote 3 ampliado de alimentos...`);
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < batch3.length; i += batchSize) {
    const batch = batch3.slice(i, i + batchSize).map(food => ({
      ...food,
      source: 'spanish_curated_batch3',
      servingSize: 100,
      servingUnit: 'g',
    }));
    await prisma.food.createMany({ data: batch });
    inserted += batch.length;
  }
  const total = await prisma.food.count();
  console.log(`✅ Lote 3 completado: ${inserted} nuevos alimentos.`);
  console.log(`📊 TOTAL ALIMENTOS EN BASE DE DATOS: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
