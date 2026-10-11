const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const batch4 = [
  // COMIDA ASIÁTICA Y SALUDABLE
  { name: 'Sashimi de salmón fresco', category: 'Pescados y Mariscos', calories: 198, proteinG: 21.0, carbsG: 0, fatG: 12.5, fiberG: 0 },
  { name: 'Sashimi de atún rojo', category: 'Pescados y Mariscos', calories: 144, proteinG: 23.3, carbsG: 0, fatG: 4.9, fiberG: 0 },
  { name: 'Nigiri de salmón (arroz y pescado)', category: 'Preparados y Otros', calories: 165, proteinG: 7.2, carbsG: 26.5, fatG: 3.8, fiberG: 0.5 },
  { name: 'Nigiri de atún (arroz y atún)', category: 'Preparados y Otros', calories: 145, proteinG: 8.5, carbsG: 26.0, fatG: 0.8, fiberG: 0.5 },
  { name: 'Maki sushi de pepino (Kappa maki)', category: 'Preparados y Otros', calories: 120, proteinG: 2.8, carbsG: 26.0, fatG: 0.4, fiberG: 1.2 },
  { name: 'Maki sushi de aguacate', category: 'Preparados y Otros', calories: 145, proteinG: 2.5, carbsG: 25.0, fatG: 3.8, fiberG: 2.0 },
  { name: 'Alga Nori tostada para sushi', category: 'Verduras y Hortalizas', calories: 35, proteinG: 5.8, carbsG: 5.1, fatG: 0.3, fiberG: 3.5 },
  { name: 'Alga Wakame deshidratada', category: 'Verduras y Hortalizas', calories: 45, proteinG: 3.0, carbsG: 9.1, fatG: 0.6, fiberG: 0.5 },
  { name: 'Ensalada de alga wakame aliñada', category: 'Verduras y Hortalizas', calories: 95, proteinG: 1.8, carbsG: 12.5, fatG: 4.2, fiberG: 1.8 },
  { name: 'Sopa Miso tradicional japonesa con tofu', category: 'Preparados y Otros', calories: 40, proteinG: 3.0, carbsG: 4.5, fatG: 1.2, fiberG: 0.8 },
  { name: 'Pasta de Miso blanco fermentado (Shira Miso)', category: 'Preparados y Otros', calories: 199, proteinG: 12.8, carbsG: 26.5, fatG: 6.0, fiberG: 5.4 },
  { name: 'Salsa Tamari sin gluten 100% soja', category: 'Preparados y Otros', calories: 60, proteinG: 10.5, carbsG: 5.5, fatG: 0, fiberG: 0 },
  { name: 'Vinagre de arroz suave para sushi', category: 'Preparados y Otros', calories: 18, proteinG: 0.1, carbsG: 4.5, fatG: 0, fiberG: 0 },
  { name: 'Jengibre encurtido rosa para sushi (Gari)', category: 'Verduras y Hortalizas', calories: 65, proteinG: 0.2, carbsG: 16.0, fatG: 0.3, fiberG: 1.0 },
  { name: 'Pasta de Wasabi auténtica', category: 'Preparados y Otros', calories: 142, proteinG: 2.2, carbsG: 30.0, fatG: 4.5, fiberG: 6.0 },
  { name: 'Tempeh de soja bio fermentado', category: 'Legumbres', calories: 193, proteinG: 20.3, carbsG: 7.6, fatG: 10.8, fiberG: 4.8 },
  { name: 'Seitán artesanal de trigo (alto en proteína)', category: 'Cereales y Derivados', calories: 143, proteinG: 24.8, carbsG: 4.0, fatG: 1.9, fiberG: 0.5 },
  { name: 'Soja texturizada fina para cocinar (cruda)', category: 'Legumbres', calories: 345, proteinG: 50.0, carbsG: 26.0, fatG: 1.5, fiberG: 14.0 },
  { name: 'Soja texturizada gruesa (tipo carne)', category: 'Legumbres', calories: 350, proteinG: 51.0, carbsG: 25.5, fatG: 1.6, fiberG: 14.5 },
  { name: 'Heura bocados originales mediterráneos', category: 'Legumbres', calories: 126, proteinG: 18.0, carbsG: 2.2, fatG: 3.1, fiberG: 6.4 },

  // GASTRONOMÍA MEXICANA SALUDABLE
  { name: 'Frijoles negros cocidos enteros', category: 'Legumbres', calories: 91, proteinG: 6.0, carbsG: 15.0, fatG: 0.5, fiberG: 5.2 },
  { name: 'Pico de gallo fresco (tomate, cebolla, jalapeño, cilantro)', category: 'Verduras y Hortalizas', calories: 25, proteinG: 0.9, carbsG: 5.2, fatG: 0.2, fiberG: 1.4 },
  { name: 'Chile jalapeño fresco', category: 'Verduras y Hortalizas', calories: 29, proteinG: 0.9, carbsG: 6.5, fatG: 0.4, fiberG: 2.8 },
  { name: 'Cilantro fresco aromático', category: 'Verduras y Hortalizas', calories: 23, proteinG: 2.1, carbsG: 3.7, fatG: 0.5, fiberG: 2.8 },
  { name: 'Salsa verde mexicana casera de tomatillo', category: 'Verduras y Hortalizas', calories: 35, proteinG: 1.1, carbsG: 6.8, fatG: 0.5, fiberG: 1.9 },
  { name: 'Tortilla de maíz nixtamalizado 100%', category: 'Cereales y Derivados', calories: 218, proteinG: 5.7, carbsG: 45.0, fatG: 2.8, fiberG: 6.3 },
  { name: 'Nopales tiernos cocidos al vapor', category: 'Verduras y Hortalizas', calories: 16, proteinG: 1.4, carbsG: 3.3, fatG: 0.1, fiberG: 2.2 },

  // QUESOS Y LÁCTEOS DEL MUNDO
  { name: 'Queso Parmigiano Reggiano 24 meses D.O.P.', category: 'Huevos y Lácteos', calories: 392, proteinG: 33.0, carbsG: 0, fatG: 28.4, fiberG: 0 },
  { name: 'Queso Grana Padano D.O.P.', category: 'Huevos y Lácteos', calories: 384, proteinG: 33.0, carbsG: 0, fatG: 28.0, fiberG: 0 },
  { name: 'Queso Pecorino Romano de oveja D.O.P.', category: 'Huevos y Lácteos', calories: 387, proteinG: 26.0, carbsG: 0, fatG: 31.0, fiberG: 0 },
  { name: 'Queso Gorgonzola D.O.P.', category: 'Huevos y Lácteos', calories: 314, proteinG: 18.0, carbsG: 0.5, fatG: 27.0, fiberG: 0 },
  { name: 'Queso Roquefort francés D.O.P.', category: 'Huevos y Lácteos', calories: 369, proteinG: 21.5, carbsG: 2.0, fatG: 30.6, fiberG: 0 },
  { name: 'Queso Camembert de Normandía', category: 'Huevos y Lácteos', calories: 300, proteinG: 19.8, carbsG: 0.5, fatG: 24.3, fiberG: 0 },
  { name: 'Queso Brie francés suave', category: 'Huevos y Lácteos', calories: 334, proteinG: 20.8, carbsG: 0.5, fatG: 27.7, fiberG: 0 },
  { name: 'Queso Gouda curado holandés', category: 'Huevos y Lácteos', calories: 356, proteinG: 24.9, carbsG: 2.2, fatG: 27.4, fiberG: 0 },
  { name: 'Queso Edam bola holandés', category: 'Huevos y Lácteos', calories: 357, proteinG: 25.0, carbsG: 1.4, fatG: 27.8, fiberG: 0 },
  { name: 'Queso Emmental suizo con agujeros', category: 'Huevos y Lácteos', calories: 380, proteinG: 28.0, carbsG: 0.5, fatG: 30.0, fiberG: 0 },
  { name: 'Queso Gruyère suizo auténtico', category: 'Huevos y Lácteos', calories: 413, proteinG: 29.8, carbsG: 0.4, fatG: 32.3, fiberG: 0 },
  { name: 'Queso Cheddar inglés tradicional madurado', category: 'Huevos y Lácteos', calories: 403, proteinG: 25.0, carbsG: 1.3, fatG: 33.1, fiberG: 0 },
  { name: 'Queso Ricotta italiano fresco de suero', category: 'Huevos y Lácteos', calories: 138, proteinG: 11.3, carbsG: 3.0, fatG: 8.8, fiberG: 0 },
  { name: 'Queso Mascarpone para repostería', category: 'Huevos y Lácteos', calories: 455, proteinG: 4.6, carbsG: 3.0, fatG: 47.0, fiberG: 0 },

  // PANADERÍA, BOLLERÍA Y REPOSTERÍA ARTESANA
  { name: 'Baguette tradicional francesa crujiente', category: 'Cereales y Derivados', calories: 270, proteinG: 8.5, carbsG: 55.0, fatG: 1.2, fiberG: 2.8 },
  { name: 'Pan ciabatta / chapata artesana', category: 'Cereales y Derivados', calories: 260, proteinG: 8.8, carbsG: 52.0, fatG: 1.8, fiberG: 2.5 },
  { name: 'Pan de molde 100% integral sin corteza', category: 'Cereales y Derivados', calories: 235, proteinG: 10.0, carbsG: 41.0, fatG: 2.5, fiberG: 6.8 },
  { name: 'Pan brioche artesano suave', category: 'Cereales y Derivados', calories: 345, proteinG: 9.0, carbsG: 50.0, fatG: 12.0, fiberG: 2.2 },
  { name: 'Pan de maíz gallego tradicional (Broa)', category: 'Cereales y Derivados', calories: 220, proteinG: 5.5, carbsG: 46.0, fatG: 1.5, fiberG: 4.5 },
  { name: 'Picos camperos con aceite de oliva virgen extra', category: 'Cereales y Derivados', calories: 410, proteinG: 9.5, carbsG: 72.0, fatG: 8.5, fiberG: 3.5 },
  { name: 'Colines tostados crujientes', category: 'Cereales y Derivados', calories: 395, proteinG: 10.0, carbsG: 73.0, fatG: 6.5, fiberG: 3.2 },
  { name: 'Regañás andaluzas de ajonjolí', category: 'Cereales y Derivados', calories: 415, proteinG: 10.5, carbsG: 70.0, fatG: 9.5, fiberG: 4.0 },

  // PESCADOS Y MARISCOS ADICIONALES
  { name: 'Corvina fresca en filetes a la plancha', category: 'Pescados y Mariscos', calories: 95, proteinG: 19.5, carbsG: 0, fatG: 1.8, fiberG: 0 },
  { name: 'Pez espada / Emperador a la plancha', category: 'Pescados y Mariscos', calories: 135, proteinG: 21.5, carbsG: 0, fatG: 5.2, fiberG: 0 },
  { name: 'Atún rojo salvaje de almadraba a la plancha', category: 'Pescados y Mariscos', calories: 155, proteinG: 25.0, carbsG: 0, fatG: 6.0, fiberG: 0 },
  { name: 'Bonito del norte fresco a la plancha', category: 'Pescados y Mariscos', calories: 142, proteinG: 24.0, carbsG: 0, fatG: 4.8, fiberG: 0 },
  { name: 'Jurel / Chicharro al horno con limón', category: 'Pescados y Mariscos', calories: 138, proteinG: 20.0, carbsG: 0, fatG: 6.2, fiberG: 0 },
  { name: 'Caballa fresca al horno', category: 'Pescados y Mariscos', calories: 185, proteinG: 19.0, carbsG: 0, fatG: 12.0, fiberG: 0 },
  { name: 'Sardinas frescas asadas a la brasa', category: 'Pescados y Mariscos', calories: 165, proteinG: 20.5, carbsG: 0, fatG: 9.0, fiberG: 0 },
  { name: 'Boquerones frescos fritos en AOVE', category: 'Pescados y Mariscos', calories: 210, proteinG: 18.0, carbsG: 3.5, fatG: 13.5, fiberG: 0.2 },
  { name: 'Boquerones en vinagre caseros con ajo y perejil', category: 'Pescados y Mariscos', calories: 130, proteinG: 17.5, carbsG: 1.0, fatG: 6.5, fiberG: 0.1 },
  { name: 'Rape en medallones al horno con patatas', category: 'Pescados y Mariscos', calories: 85, proteinG: 16.5, carbsG: 1.5, fatG: 1.2, fiberG: 0.3 },
  { name: 'Trucha de río fresca a la navarra (con jamón)', category: 'Pescados y Mariscos', calories: 165, proteinG: 21.0, carbsG: 0.5, fatG: 8.5, fiberG: 0 },
  { name: 'Anguila fresca guisada en all i pebre', category: 'Pescados y Mariscos', calories: 235, proteinG: 16.0, carbsG: 2.0, fatG: 18.0, fiberG: 0.3 },

  // ACEITES, GRASAS Y SEMILLAS PREMIUM
  { name: 'Aceite de oliva virgen extra Picual Jaén', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de oliva virgen extra Arbequina Cataluña', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de oliva virgen extra Hojiblanca Córdoba', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de oliva virgen extra Cornicabra Toledo', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de nuez prensado en frío', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Manteca de cerdo ibérico pura', category: 'Aceites y Grasas', calories: 898, proteinG: 0, carbsG: 0, fatG: 99.8, fiberG: 0 },
  { name: 'Mantequilla tradicional de Soria con sal', category: 'Aceites y Grasas', calories: 735, proteinG: 0.7, carbsG: 0.7, fatG: 81.0, fiberG: 0 },
  { name: 'Ghee mantequilla clarificada ecológica', category: 'Aceites y Grasas', calories: 899, proteinG: 0.1, carbsG: 0, fatG: 99.8, fiberG: 0 },

  // FRUTAS Y VERDURAS DE MERCADO DE ABASTOS
  { name: 'Puerro fresco limpio al vapor', category: 'Verduras y Hortalizas', calories: 32, proteinG: 1.5, carbsG: 6.5, fatG: 0.3, fiberG: 2.2 },
  { name: 'Cebolla dulce de Fuentes de Ebro D.O.', category: 'Verduras y Hortalizas', calories: 34, proteinG: 1.1, carbsG: 7.5, fatG: 0.1, fiberG: 1.8 },
  { name: 'Cebolletas frescas con tallo verde', category: 'Verduras y Hortalizas', calories: 32, proteinG: 1.8, carbsG: 7.3, fatG: 0.2, fiberG: 2.6 },
  { name: 'Chalotas francesas peladas', category: 'Verduras y Hortalizas', calories: 72, proteinG: 2.5, carbsG: 16.8, fatG: 0.1, fiberG: 3.2 },
  { name: 'Ajo morado de Las Pedroñeras D.O.', category: 'Verduras y Hortalizas', calories: 135, proteinG: 6.0, carbsG: 26.5, fatG: 0.5, fiberG: 2.8 },
  { name: 'Ajo negro fermentado gourmet', category: 'Verduras y Hortalizas', calories: 145, proteinG: 6.5, carbsG: 29.0, fatG: 0.3, fiberG: 3.0 },
  { name: 'Pimiento del piquillo asado entero', category: 'Verduras y Hortalizas', calories: 35, proteinG: 1.2, carbsG: 7.0, fatG: 0.3, fiberG: 2.0 },
  { name: 'Pimiento verde italiano frito en AOVE', category: 'Verduras y Hortalizas', calories: 75, proteinG: 1.1, carbsG: 4.8, fatG: 5.8, fiberG: 1.8 },
  { name: 'Berenjenas asadas con piel', category: 'Verduras y Hortalizas', calories: 35, proteinG: 1.1, carbsG: 6.2, fatG: 0.8, fiberG: 3.2 },
  { name: 'Calabaza cacahuete asada al horno', category: 'Verduras y Hortalizas', calories: 45, proteinG: 1.0, carbsG: 11.5, fatG: 0.1, fiberG: 2.0 },
  { name: 'Boniato asado dulce (Batata)', category: 'Verduras y Hortalizas', calories: 90, proteinG: 2.0, carbsG: 20.7, fatG: 0.1, fiberG: 3.3 },
  { name: 'Patatas nuevas baby al vapor con piel', category: 'Verduras y Hortalizas', calories: 76, proteinG: 2.0, carbsG: 17.0, fatG: 0.1, fiberG: 2.1 },
  { name: 'Zanahorias baby frescas ecológicas', category: 'Verduras y Hortalizas', calories: 35, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, fiberG: 2.9 },
  { name: 'Remolacha cocida envasada al vacío', category: 'Verduras y Hortalizas', calories: 43, proteinG: 1.6, carbsG: 9.6, fatG: 0.2, fiberG: 2.8 },
  { name: 'Rabanitos frescos crujientes', category: 'Verduras y Hortalizas', calories: 16, proteinG: 0.7, carbsG: 3.4, fatG: 0.1, fiberG: 1.6 },
  { name: 'Nabos blancos cocidos', category: 'Verduras y Hortalizas', calories: 22, proteinG: 0.7, carbsG: 5.1, fatG: 0.1, fiberG: 2.0 },
  { name: 'Pepino holandés / Almería fresco con piel', category: 'Verduras y Hortalizas', calories: 15, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5 },
  { name: 'Pepinillos en vinagre agridulces sin azúcar', category: 'Verduras y Hortalizas', calories: 12, proteinG: 0.6, carbsG: 2.2, fatG: 0.2, fiberG: 1.1 },
  { name: 'Aceitunas manzanilla con hueso en salmuera', category: 'Verduras y Hortalizas', calories: 145, proteinG: 1.2, carbsG: 1.0, fatG: 15.0, fiberG: 3.8 },
  { name: 'Aceitunas gordal rellenas de pimiento', category: 'Verduras y Hortalizas', calories: 155, proteinG: 1.3, carbsG: 2.2, fatG: 15.5, fiberG: 3.5 },
  { name: 'Aceitunas negras de Aragón arrugadas', category: 'Verduras y Hortalizas', calories: 285, proteinG: 2.0, carbsG: 3.5, fatG: 30.0, fiberG: 4.5 },
  { name: 'Alcaparras en vinagre escurridas', category: 'Verduras y Hortalizas', calories: 23, proteinG: 2.4, carbsG: 4.9, fatG: 0.9, fiberG: 3.2 },
];

async function main() {
  console.log(`🌱 Insertando lote 4 ampliado de alimentos...`);
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < batch4.length; i += batchSize) {
    const batch = batch4.slice(i, i + batchSize).map(food => ({
      ...food,
      source: 'spanish_curated_batch4',
      servingSize: 100,
      servingUnit: 'g',
    }));
    await prisma.food.createMany({ data: batch });
    inserted += batch.length;
  }
  const total = await prisma.food.count();
  console.log(`✅ Lote 4 completado: ${inserted} nuevos alimentos.`);
  console.log(`📊 TOTAL ALIMENTOS EN BASE DE DATOS: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
