const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const batch2 = [
  // SETAS SILVESTRES Y CULTIVADAS
  { name: 'Níscalos / Robellones frescos', category: 'Verduras y Hortalizas', calories: 24, proteinG: 2.2, carbsG: 2.8, fatG: 0.5, fiberG: 3.2 },
  { name: 'Boletus edulis frescos', category: 'Verduras y Hortalizas', calories: 28, proteinG: 3.2, carbsG: 3.5, fatG: 0.4, fiberG: 2.8 },
  { name: 'Trompetas de la muerte secas', category: 'Verduras y Hortalizas', calories: 210, proteinG: 18.5, carbsG: 32.0, fatG: 2.5, fiberG: 28.0 },
  { name: 'Rebozuelos frescos (Chantarelas)', category: 'Verduras y Hortalizas', calories: 32, proteinG: 1.5, carbsG: 6.9, fatG: 0.5, fiberG: 3.8 },
  { name: 'Seta Shiitake fresca', category: 'Verduras y Hortalizas', calories: 34, proteinG: 2.2, carbsG: 6.8, fatG: 0.5, fiberG: 2.5 },
  { name: 'Seta de cardo fresca silvestre', category: 'Verduras y Hortalizas', calories: 26, proteinG: 2.0, carbsG: 3.8, fatG: 0.4, fiberG: 2.6 },
  { name: 'Seta Enoki cruda', category: 'Verduras y Hortalizas', calories: 37, proteinG: 2.7, carbsG: 7.8, fatG: 0.3, fiberG: 2.7 },
  { name: 'Trufa negra fresca de Teruel (Tuber melanosporum)', category: 'Verduras y Hortalizas', calories: 84, proteinG: 9.0, carbsG: 6.0, fatG: 1.5, fiberG: 8.0 },

  // MARISCOS Y PESCADOS DE LONJA
  { name: 'Carabineros del sur a la plancha', category: 'Pescados y Mariscos', calories: 105, proteinG: 21.0, carbsG: 0.8, fatG: 1.8, fiberG: 0 },
  { name: 'Cigalas frescas cocidas', category: 'Pescados y Mariscos', calories: 86, proteinG: 18.2, carbsG: 0.5, fatG: 1.2, fiberG: 0 },
  { name: 'Coquinas / Tellinas de Huelva al ajillo', category: 'Pescados y Mariscos', calories: 74, proteinG: 13.5, carbsG: 1.5, fatG: 1.2, fiberG: 0 },
  { name: 'Chirlas frescas gallegas', category: 'Pescados y Mariscos', calories: 64, proteinG: 11.8, carbsG: 2.0, fatG: 0.9, fiberG: 0 },
  { name: 'Buey de mar cocido desmigado', category: 'Pescados y Mariscos', calories: 90, proteinG: 18.5, carbsG: 0, fatG: 1.5, fiberG: 0 },
  { name: 'Nécora gallega cocida', category: 'Pescados y Mariscos', calories: 88, proteinG: 18.0, carbsG: 0.2, fatG: 1.4, fiberG: 0 },
  { name: 'Ostras frescas de las Rías con limón', category: 'Pescados y Mariscos', calories: 68, proteinG: 9.0, carbsG: 4.5, fatG: 1.8, fiberG: 0 },
  { name: 'Erizos de mar frescos (huevas)', category: 'Pescados y Mariscos', calories: 120, proteinG: 14.0, carbsG: 3.5, fatG: 5.2, fiberG: 0 },
  { name: 'Gallo de ración a la plancha', category: 'Pescados y Mariscos', calories: 92, proteinG: 18.4, carbsG: 0, fatG: 1.8, fiberG: 0 },
  { name: 'Corvina salvaje a la sal', category: 'Pescados y Mariscos', calories: 102, proteinG: 20.5, carbsG: 0, fatG: 2.1, fiberG: 0 },
  { name: 'Dentón salvaje al horno', category: 'Pescados y Mariscos', calories: 115, proteinG: 21.0, carbsG: 0, fatG: 3.2, fiberG: 0 },
  { name: 'Cabrarroca / Rascacio fresco', category: 'Pescados y Mariscos', calories: 88, proteinG: 18.0, carbsG: 0, fatG: 1.6, fiberG: 0 },
  { name: 'Cazón adobado en bienmesabe', category: 'Pescados y Mariscos', calories: 135, proteinG: 17.5, carbsG: 4.2, fatG: 5.5, fiberG: 0.2 },
  { name: 'Arenque marinado en vinagre', category: 'Pescados y Mariscos', calories: 195, proteinG: 14.0, carbsG: 9.5, fatG: 11.5, fiberG: 0 },

  // CARNES DE CAZA Y SELECTAS
  { name: 'Lomo de corzo / ciervo asado', category: 'Carnes', calories: 120, proteinG: 23.0, carbsG: 0, fatG: 2.8, fiberG: 0 },
  { name: 'Solomillo de jabalí salvaje', category: 'Carnes', calories: 125, proteinG: 22.5, carbsG: 0, fatG: 3.5, fiberG: 0 },
  { name: 'Perdiz estofada en escabeche', category: 'Carnes', calories: 165, proteinG: 24.0, carbsG: 0.8, fatG: 7.2, fiberG: 0.1 },
  { name: 'Conejo de monte guisado', category: 'Carnes', calories: 140, proteinG: 22.0, carbsG: 0, fatG: 5.5, fiberG: 0 },
  { name: 'Magret de pato a la plancha (sin grasa)', category: 'Carnes', calories: 190, proteinG: 20.0, carbsG: 0, fatG: 12.0, fiberG: 0 },
  { name: 'Foie gras de pato mi-cuit', category: 'Carnes', calories: 462, proteinG: 7.5, carbsG: 2.0, fatG: 48.0, fiberG: 0 },
  { name: 'Carrilleras de cerdo ibérico estofadas', category: 'Carnes', calories: 185, proteinG: 18.5, carbsG: 2.2, fatG: 11.2, fiberG: 0.3 },

  // ARROCES, PASTAS Y CEREALES DE ESPECIALIDAD
  { name: 'Arroz bomba D.O. Calasparra crudo', category: 'Cereales y Derivados', calories: 350, proteinG: 7.0, carbsG: 78.0, fatG: 0.8, fiberG: 1.4 },
  { name: 'Arroz bomba D.O. Valencia crudo', category: 'Cereales y Derivados', calories: 348, proteinG: 7.2, carbsG: 77.5, fatG: 0.9, fiberG: 1.5 },
  { name: 'Arroz jazmín aromático cocido', category: 'Cereales y Derivados', calories: 128, proteinG: 2.4, carbsG: 28.5, fatG: 0.3, fiberG: 0.4 },
  { name: 'Arroz rojo integral silvestre cocido', category: 'Cereales y Derivados', calories: 115, proteinG: 2.8, carbsG: 23.5, fatG: 0.8, fiberG: 2.2 },
  { name: 'Arroz negro venere italiano cocido', category: 'Cereales y Derivados', calories: 122, proteinG: 3.2, carbsG: 24.5, fatG: 0.9, fiberG: 2.5 },
  { name: 'Pasta de espelta 100% integral cocida', category: 'Cereales y Derivados', calories: 135, proteinG: 5.8, carbsG: 26.0, fatG: 0.9, fiberG: 3.8 },
  { name: 'Pasta de lenteja roja 100% (sin gluten) cocida', category: 'Legumbres', calories: 145, proteinG: 10.5, carbsG: 23.0, fatG: 0.8, fiberG: 4.2 },
  { name: 'Pasta de garbanzo 100% cocida', category: 'Legumbres', calories: 152, proteinG: 9.8, carbsG: 24.0, fatG: 1.5, fiberG: 4.8 },
  { name: 'Fideos soba de trigo sarraceno 100% cocidos', category: 'Cereales y Derivados', calories: 118, proteinG: 4.5, carbsG: 24.0, fatG: 0.5, fiberG: 2.0 },
  { name: 'Fideos Shirataki de konjac (bajos en kcal)', category: 'Preparados y Otros', calories: 9, proteinG: 0.2, carbsG: 0.5, fatG: 0.1, fiberG: 3.8 },
  { name: 'Polenta de maíz cocida', category: 'Cereales y Derivados', calories: 75, proteinG: 1.8, carbsG: 16.0, fatG: 0.3, fiberG: 1.2 },
  { name: 'Trigo sarraceno en grano cocido', category: 'Cereales y Derivados', calories: 120, proteinG: 4.4, carbsG: 25.0, fatG: 1.0, fiberG: 2.7 },
  { name: 'Mijo dorado pelado cocido', category: 'Cereales y Derivados', calories: 119, proteinG: 3.5, carbsG: 23.5, fatG: 1.0, fiberG: 1.3 },
  { name: 'Amaranto en grano cocido', category: 'Cereales y Derivados', calories: 102, proteinG: 3.8, carbsG: 19.0, fatG: 1.6, fiberG: 2.1 },

  // LÁCTEOS Y POSTRES TRADICIONALES
  { name: 'Cuajada de leche de oveja tradicional', category: 'Huevos y Lácteos', calories: 95, proteinG: 5.2, carbsG: 4.5, fatG: 6.2, fiberG: 0 },
  { name: 'Requesón artesanal de cabra', category: 'Huevos y Lácteos', calories: 135, proteinG: 11.5, carbsG: 3.2, fatG: 8.5, fiberG: 0 },
  { name: 'Yogur de leche de oveja artesanal', category: 'Huevos y Lácteos', calories: 98, proteinG: 5.5, carbsG: 4.8, fatG: 6.5, fiberG: 0 },
  { name: 'Yogur de leche de cabra natural', category: 'Huevos y Lácteos', calories: 72, proteinG: 4.2, carbsG: 4.5, fatG: 4.0, fiberG: 0 },
  { name: 'Queso quark desnatado 0% grasa', category: 'Huevos y Lácteos', calories: 65, proteinG: 12.0, carbsG: 3.5, fatG: 0.2, fiberG: 0 },
  { name: 'Skyr natural estilo islandés', category: 'Huevos y Lácteos', calories: 62, proteinG: 11.0, carbsG: 3.8, fatG: 0.2, fiberG: 0 },
  { name: 'Skyr de vainilla 0% azúcar añadido', category: 'Huevos y Lácteos', calories: 65, proteinG: 10.5, carbsG: 4.2, fatG: 0.2, fiberG: 0 },
  { name: 'Postre de proteínas sabor natillas (Danone/Mercadona)', category: 'Huevos y Lácteos', calories: 78, proteinG: 10.0, carbsG: 6.0, fatG: 0.5, fiberG: 0 },
  { name: 'Mousse de proteínas de chocolate 20g', category: 'Huevos y Lácteos', calories: 82, proteinG: 10.0, carbsG: 5.5, fatG: 1.5, fiberG: 0.8 },

  // HORTALIZAS Y ENSALADAS GOURMET
  { name: 'Canónigos frescos listos para consumir', category: 'Verduras y Hortalizas', calories: 14, proteinG: 2.0, carbsG: 0.8, fatG: 0.4, fiberG: 1.5 },
  { name: 'Rúcula salvaje fresca', category: 'Verduras y Hortalizas', calories: 25, proteinG: 2.6, carbsG: 3.7, fatG: 0.7, fiberG: 1.6 },
  { name: 'Berros de agua frescos', category: 'Verduras y Hortalizas', calories: 11, proteinG: 2.3, carbsG: 1.3, fatG: 0.1, fiberG: 0.5 },
  { name: 'Espárragos trigueros silvestres a la plancha', category: 'Verduras y Hortalizas', calories: 28, proteinG: 3.0, carbsG: 3.5, fatG: 0.3, fiberG: 2.5 },
  { name: 'Alcachofas de Tudela D.O. cocidas', category: 'Verduras y Hortalizas', calories: 47, proteinG: 3.2, carbsG: 10.5, fatG: 0.2, fiberG: 5.4 },
  { name: 'Bimi / Broccolini al vapor', category: 'Verduras y Hortalizas', calories: 35, proteinG: 3.0, carbsG: 4.2, fatG: 0.5, fiberG: 3.2 },
  { name: 'Pak Choi / Bok Choy salteado', category: 'Verduras y Hortalizas', calories: 18, proteinG: 1.8, carbsG: 2.5, fatG: 0.3, fiberG: 1.4 },
  { name: 'Edamame en vaina cocido con sal marina', category: 'Legumbres', calories: 122, proteinG: 11.0, carbsG: 8.9, fatG: 5.2, fiberG: 5.2 },
  { name: 'Chirivía fresca asada', category: 'Verduras y Hortalizas', calories: 75, proteinG: 1.2, carbsG: 18.0, fatG: 0.3, fiberG: 4.9 },
  { name: 'Colinabo / Rutabaga al vapor', category: 'Verduras y Hortalizas', calories: 37, proteinG: 1.2, carbsG: 8.6, fatG: 0.2, fiberG: 2.3 },
  { name: 'Apionabo / Céleri rábano cocido', category: 'Verduras y Hortalizas', calories: 42, proteinG: 1.5, carbsG: 9.2, fatG: 0.3, fiberG: 1.8 },
  { name: 'Hinojo fresco en ensalada', category: 'Verduras y Hortalizas', calories: 31, proteinG: 1.2, carbsG: 7.3, fatG: 0.2, fiberG: 3.1 },
  { name: 'Tomate de rama maduro español', category: 'Verduras y Hortalizas', calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2 },
  { name: 'Tomate Raff de Almería', category: 'Verduras y Hortalizas', calories: 21, proteinG: 1.0, carbsG: 4.2, fatG: 0.2, fiberG: 1.3 },
  { name: 'Tomate Cherry dulce en rama', category: 'Verduras y Hortalizas', calories: 22, proteinG: 1.1, carbsG: 4.5, fatG: 0.2, fiberG: 1.4 },
  { name: 'Tomate Rosa de Barbastro D.O.', category: 'Verduras y Hortalizas', calories: 20, proteinG: 1.0, carbsG: 4.0, fatG: 0.2, fiberG: 1.2 },
  { name: 'Tomate seco en aceite escurrido', category: 'Verduras y Hortalizas', calories: 215, proteinG: 5.2, carbsG: 23.0, fatG: 12.0, fiberG: 6.5 },
  { name: 'Pimientos de Padrón fritos con sal gorda', category: 'Verduras y Hortalizas', calories: 68, proteinG: 1.5, carbsG: 4.5, fatG: 5.0, fiberG: 2.0 },
  { name: 'Pimientos del piquillo de Lodosa asados D.O.', category: 'Verduras y Hortalizas', calories: 38, proteinG: 1.2, carbsG: 7.8, fatG: 0.3, fiberG: 2.1 },
  { name: 'Grelos gallegos cocidos', category: 'Verduras y Hortalizas', calories: 22, proteinG: 2.5, carbsG: 2.0, fatG: 0.3, fiberG: 3.0 },
  { name: 'Borraja de Aragón limpia cocida', category: 'Verduras y Hortalizas', calories: 21, proteinG: 1.8, carbsG: 3.1, fatG: 0.2, fiberG: 2.8 },
  { name: 'Cardo blanco navarro cocido', category: 'Verduras y Hortalizas', calories: 17, proteinG: 0.8, carbsG: 3.5, fatG: 0.1, fiberG: 1.8 },
];

async function main() {
  console.log(`🌱 Insertando lote 2 ampliado de alimentos...`);
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < batch2.length; i += batchSize) {
    const batch = batch2.slice(i, i + batchSize).map(food => ({
      ...food,
      source: 'spanish_artisan',
      servingSize: 100,
      servingUnit: 'g',
    }));
    await prisma.food.createMany({ data: batch });
    inserted += batch.length;
  }
  const total = await prisma.food.count();
  console.log(`✅ Lote 2 completado: ${inserted} nuevos alimentos.`);
  console.log(`📊 TOTAL ALIMENTOS EN BASE DE DATOS: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
