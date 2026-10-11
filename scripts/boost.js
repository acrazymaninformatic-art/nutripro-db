const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const extra = [
  { name: 'Claras de huevo líquidas pasteurizadas Pascual', category: 'Huevos y Lácteos', calories: 48, proteinG: 10.5, carbsG: 0.8, fatG: 0.2, fiberG: 0 },
  { name: 'Queso rallado 4 quesos especial gratinar', category: 'Huevos y Lácteos', calories: 360, proteinG: 25.0, carbsG: 1.5, fatG: 29.0, fiberG: 0 },
  { name: 'Yogur proteico sabor arándanos 10g prot', category: 'Huevos y Lácteos', calories: 60, proteinG: 10.0, carbsG: 4.5, fatG: 0.1, fiberG: 0 },
  { name: 'Yogur proteico sabor fresa 10g prot', category: 'Huevos y Lácteos', calories: 60, proteinG: 10.0, carbsG: 4.5, fatG: 0.1, fiberG: 0 },
  { name: 'Yogur bífidus desnatado natural edulcorado', category: 'Huevos y Lácteos', calories: 42, proteinG: 4.6, carbsG: 5.2, fatG: 0.1, fiberG: 0 },
  { name: 'Lentejas cocidas ecológicas Luengo', category: 'Legumbres', calories: 110, proteinG: 8.5, carbsG: 15.5, fatG: 0.6, fiberG: 5.0 },
  { name: 'Garbanzos cocidos ecológicos Luengo', category: 'Legumbres', calories: 125, proteinG: 7.2, carbsG: 18.0, fatG: 2.0, fiberG: 5.5 },
  { name: 'Alubias blancas cocidas ecológicas Luengo', category: 'Legumbres', calories: 92, proteinG: 6.8, carbsG: 13.0, fatG: 0.5, fiberG: 5.2 },
  { name: 'Pechuga de pavo 92% carne en lonchas Campofrío', category: 'Carnes', calories: 90, proteinG: 18.5, carbsG: 1.2, fatG: 1.1, fiberG: 0 },
  { name: 'Jamón cocido 95% carne categoría extra BienStar', category: 'Carnes', calories: 95, proteinG: 19.0, carbsG: 0.9, fatG: 1.4, fiberG: 0 },
  { name: 'Salmón fresco en lomos sin espinas a la plancha', category: 'Pescados y Mariscos', calories: 215, proteinG: 21.0, carbsG: 0, fatG: 14.5, fiberG: 0 },
  { name: 'Merluza del Cantábrico al vapor con perejil', category: 'Pescados y Mariscos', calories: 78, proteinG: 17.0, carbsG: 0, fatG: 0.9, fiberG: 0 },
  { name: 'Lubina de estero a la espalda con ajos', category: 'Pescados y Mariscos', calories: 115, proteinG: 19.8, carbsG: 0.5, fatG: 3.8, fiberG: 0 },
  { name: 'Dorada salvaje a la sal horneada', category: 'Pescados y Mariscos', calories: 108, proteinG: 20.0, carbsG: 0, fatG: 2.9, fiberG: 0 },
  { name: 'Gambón austral a la plancha con sal gorda', category: 'Pescados y Mariscos', calories: 95, proteinG: 20.5, carbsG: 0.5, fatG: 1.1, fiberG: 0 },
  { name: 'Arroz basmati cocido al punto', category: 'Cereales y Derivados', calories: 121, proteinG: 3.5, carbsG: 25.2, fatG: 0.4, fiberG: 0.6 },
  { name: 'Arroz integral redondo cocido', category: 'Cereales y Derivados', calories: 111, proteinG: 2.6, carbsG: 23.0, fatG: 0.9, fiberG: 1.8 },
  { name: 'Pasta penne rigate 100% integral cocida', category: 'Cereales y Derivados', calories: 138, proteinG: 5.6, carbsG: 26.2, fatG: 0.9, fiberG: 3.8 },
  { name: 'Pan 100% integral de centeno masa madre', category: 'Cereales y Derivados', calories: 215, proteinG: 7.5, carbsG: 41.0, fatG: 1.5, fiberG: 7.2 },
  { name: 'Avena integral fina en copos suaves Kölln', category: 'Cereales y Derivados', calories: 375, proteinG: 13.5, carbsG: 61.0, fatG: 7.0, fiberG: 10.0 },
  { name: 'Aguacate Hass punto óptimo maduración', category: 'Frutas', calories: 160, proteinG: 2.0, carbsG: 8.5, fatG: 14.7, fiberG: 6.7 },
  { name: 'Plátano de Canarias I.G.P. maduro', category: 'Frutas', calories: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, fiberG: 2.6 },
  { name: 'Fresas de Huelva frescas dulces', category: 'Frutas', calories: 33, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, fiberG: 2.0 },
  { name: 'Arándanos silvestres frescos del bosque', category: 'Frutas', calories: 57, proteinG: 0.7, carbsG: 14.5, fatG: 0.3, fiberG: 2.4 },
  { name: 'Nueces de nogal nacional en grano', category: 'Frutos Secos y Semillas', calories: 654, proteinG: 15.2, carbsG: 13.7, fatG: 65.2, fiberG: 6.7 },
  { name: 'Aceite de oliva virgen extra ecológico primera prensada', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 }
];

async function main() {
  await prisma.food.createMany({
    data: extra.map(f => ({ ...f, source: 'final_boost', servingSize: 100, servingUnit: 'g' })),
  });
  const count = await prisma.food.count();
  console.log('✅ BASE DE DATOS SUPERADA CON ÉXITO: TOTAL ALIMENTOS =', count);
}

main().finally(() => prisma.$disconnect());
