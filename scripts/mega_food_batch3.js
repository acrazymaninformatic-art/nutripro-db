const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const foodsBatch3 = [
  // Platos tradicionales regionales españoles
  { name: 'Marmitako de bonito del norte tradicional', category: 'Preparados y Otros', calories: 125, proteinG: 12.5, carbsG: 9.8, fatG: 4.0, fiberG: 1.5 },
  { name: 'Escalivada catalana asada con berenjena, pimiento y cebolla', category: 'Verduras y Hortalizas', calories: 52, proteinG: 1.4, carbsG: 6.8, fatG: 2.2, fiberG: 2.8 },
  { name: 'Tumbet mallorquín de verduras al horno', category: 'Verduras y Hortalizas', calories: 88, proteinG: 1.8, carbsG: 10.5, fatG: 4.5, fiberG: 2.4 },
  { name: 'Bacalao al ajoarriero con tomate y pimientos', category: 'Pescados y Mariscos', calories: 135, proteinG: 16.0, carbsG: 4.5, fatG: 6.0, fiberG: 1.2 },
  { name: 'Zarzuela de pescados y mariscos de roca', category: 'Pescados y Mariscos', calories: 118, proteinG: 17.5, carbsG: 3.5, fatG: 3.8, fiberG: 0.8 },
  { name: 'Papas arrugadas con piel cocidas en salmuera', category: 'Cereales y Derivados', calories: 78, proteinG: 2.0, carbsG: 17.0, fatG: 0.1, fiberG: 2.2 },
  { name: 'Mojo rojo picón canario tradicional con AOVE', category: 'Grasas y Aceites', calories: 245, proteinG: 1.8, carbsG: 6.5, fatG: 24.0, fiberG: 1.5 },
  { name: 'Mojo verde de cilantro canario con AOVE', category: 'Grasas y Aceites', calories: 235, proteinG: 1.5, carbsG: 5.5, fatG: 23.5, fiberG: 1.2 },
  { name: 'Gofio canario de trigo y millo tostado', category: 'Cereales y Derivados', calories: 368, proteinG: 11.2, carbsG: 72.5, fatG: 2.8, fiberG: 7.0 },
  { name: 'Cocido montañés con alubias blancas y berza', category: 'Preparados y Otros', calories: 165, proteinG: 9.8, carbsG: 13.5, fatG: 8.5, fiberG: 4.2 },
  { name: 'Olla podrida burgalesa tradicional', category: 'Preparados y Otros', calories: 185, proteinG: 11.5, carbsG: 14.5, fatG: 9.5, fiberG: 4.5 },
  { name: 'Potaje de vigilia con garbanzos, bacalao y espinacas', category: 'Legumbres', calories: 135, proteinG: 12.8, carbsG: 14.2, fatG: 3.2, fiberG: 4.8 },
  { name: 'Sopa castellana de ajo con huevo escalfado y pimentón', category: 'Preparados y Otros', calories: 95, proteinG: 4.8, carbsG: 7.5, fatG: 5.2, fiberG: 0.8 },
  { name: 'Sopa de marisco y pescado de roca desgrasada', category: 'Preparados y Otros', calories: 58, proteinG: 7.2, carbsG: 2.8, fatG: 2.1, fiberG: 0.4 },
  { name: 'Consomé de carne clarificado casero', category: 'Preparados y Otros', calories: 15, proteinG: 2.8, carbsG: 0.4, fatG: 0.2, fiberG: 0 },
  { name: 'Empanada gallega de bonito masa casera', category: 'Preparados y Otros', calories: 245, proteinG: 9.5, carbsG: 28.0, fatG: 10.5, fiberG: 2.0 },
  { name: 'Empanada de pollo y verduras al horno', category: 'Preparados y Otros', calories: 220, proteinG: 11.0, carbsG: 26.0, fatG: 8.0, fiberG: 1.8 },
  { name: 'Pastel de verduras y queso de cabra al horno', category: 'Preparados y Otros', calories: 125, proteinG: 7.5, carbsG: 6.2, fatG: 7.8, fiberG: 2.1 },
  { name: 'Lasaña vegetal de calabacín y ricotta ligera', category: 'Preparados y Otros', calories: 110, proteinG: 7.8, carbsG: 6.5, fatG: 5.8, fiberG: 2.4 },
  { name: 'Berenjenas rellenas de carne magra de pavo al horno', category: 'Preparados y Otros', calories: 115, proteinG: 12.5, carbsG: 5.8, fatG: 4.8, fiberG: 2.6 },
  { name: 'Calabacines redondos rellenos de atún y verduras', category: 'Preparados y Otros', calories: 92, proteinG: 11.2, carbsG: 4.8, fatG: 3.2, fiberG: 2.0 },
  { name: 'Pimientos rellenos de bacalao en salsa de piquillos', category: 'Preparados y Otros', calories: 108, proteinG: 10.5, carbsG: 7.5, fatG: 4.2, fiberG: 1.5 },

  // Supermercado: gama Hacendado / Mercadona staples
  { name: 'Tiras de pollo al horno Hacendado 99% carne', category: 'Carnes', calories: 105, proteinG: 23.0, carbsG: 0.5, fatG: 1.2, fiberG: 0 },
  { name: 'Tiras de lomo de cerdo asado Hacendado', category: 'Carnes', calories: 135, proteinG: 24.5, carbsG: 0.5, fatG: 3.8, fiberG: 0 },
  { name: 'Gelatina +Proteínas sabor frutos silvestres Hacendado', category: 'Preparados y Otros', calories: 39, proteinG: 6.0, carbsG: 3.5, fatG: 0.1, fiberG: 0 },
  { name: 'Natillas +Proteínas sabor vainilla Hacendado', category: 'Huevos y Lácteos', calories: 72, proteinG: 10.0, carbsG: 5.0, fatG: 1.2, fiberG: 0 },
  { name: 'Mousse +Proteínas sabor chocolate Hacendado', category: 'Huevos y Lácteos', calories: 76, proteinG: 10.0, carbsG: 4.8, fatG: 1.8, fiberG: 0.8 },
  { name: 'Bebida láctea +Proteínas sabor café latte Hacendado', category: 'Huevos y Lácteos', calories: 55, proteinG: 8.5, carbsG: 4.2, fatG: 0.4, fiberG: 0 },
  { name: 'Bebida láctea +Proteínas sabor plátano', category: 'Huevos y Lácteos', calories: 52, proteinG: 8.5, carbsG: 3.9, fatG: 0.3, fiberG: 0 },
  { name: 'Copos de avena crujientes sin azúcar Hacendado', category: 'Cereales y Derivados', calories: 375, proteinG: 12.0, carbsG: 62.0, fatG: 7.0, fiberG: 9.0 },
  { name: 'Crema de cacahuete crunchy con trocitos 100% Mercadona', category: 'Frutos Secos y Semillas', calories: 618, proteinG: 27.0, carbsG: 11.5, fatG: 50.0, fiberG: 7.5 },
  { name: 'Crema de avellana 100% natural sin azúcar añadido', category: 'Frutos Secos y Semillas', calories: 645, proteinG: 15.5, carbsG: 10.0, fatG: 62.0, fiberG: 9.0 },
  { name: 'Crema de pistacho 100% pura tostada', category: 'Frutos Secos y Semillas', calories: 595, proteinG: 21.0, carbsG: 18.0, fatG: 48.0, fiberG: 9.8 },
  { name: 'Pan de molde 100% espelta integral Mercadona', category: 'Cereales y Derivados', calories: 238, proteinG: 10.2, carbsG: 42.0, fatG: 2.4, fiberG: 7.5 },
  { name: 'Pan tostado 100% integral bajo en sal Hacendado', category: 'Cereales y Derivados', calories: 370, proteinG: 12.5, carbsG: 68.0, fatG: 3.5, fiberG: 9.2 },
  { name: 'Barrita de cereales espelta y manzana 0% azúcar', category: 'Cereales y Derivados', calories: 310, proteinG: 7.5, carbsG: 62.0, fatG: 3.5, fiberG: 14.0 },
  { name: 'Barrita proteica sabor galleta y crema 32% proteína', category: 'Preparados y Otros', calories: 345, proteinG: 32.0, carbsG: 29.0, fatG: 11.0, fiberG: 10.0 },

  // Alimentos celíacos / sin gluten certificados
  { name: 'Pan de molde sin gluten clásico Schär', category: 'Cereales y Derivados', calories: 235, proteinG: 3.5, carbsG: 44.0, fatG: 4.2, fiberG: 6.8 },
  { name: 'Pan rústico sin gluten con masa madre Schär', category: 'Cereales y Derivados', calories: 242, proteinG: 4.0, carbsG: 42.0, fatG: 5.0, fiberG: 7.2 },
  { name: 'Pasta sin gluten de maíz y arroz Barilla cocida', category: 'Cereales y Derivados', calories: 142, proteinG: 2.8, carbsG: 30.0, fatG: 0.6, fiberG: 1.2 },
  { name: 'Galletas María sin gluten Gullón', category: 'Cereales y Derivados', calories: 425, proteinG: 4.5, carbsG: 72.0, fatG: 13.0, fiberG: 3.5 },
  { name: 'Copos de avena certificados sin gluten bio', category: 'Cereales y Derivados', calories: 365, proteinG: 13.0, carbsG: 58.0, fatG: 6.8, fiberG: 10.0 },
  { name: 'Harina panificable sin gluten Mix B Schär', category: 'Cereales y Derivados', calories: 345, proteinG: 2.5, carbsG: 80.0, fatG: 0.8, fiberG: 4.5 },
  { name: 'Harina de teff marrón sin gluten bio', category: 'Cereales y Derivados', calories: 340, proteinG: 13.0, carbsG: 65.0, fatG: 2.5, fiberG: 8.0 },
  { name: 'Harina de mijo dorado sin gluten', category: 'Cereales y Derivados', calories: 355, proteinG: 11.0, carbsG: 70.0, fatG: 3.2, fiberG: 6.5 },
  { name: 'Harina de garbanzo pura para rebozados sin gluten', category: 'Legumbres', calories: 340, proteinG: 21.0, carbsG: 48.0, fatG: 5.5, fiberG: 11.0 },

  // Condimentos, especias y aderezos saludables
  { name: 'Vinagre de manzana ecológico sin filtrar con madre', category: 'Grasas y Aceites', calories: 21, proteinG: 0, carbsG: 0.9, fatG: 0, fiberG: 0 },
  { name: 'Vinagre de Módena IGP balsámico envejecido', category: 'Grasas y Aceites', calories: 88, proteinG: 0.5, carbsG: 17.0, fatG: 0, fiberG: 0 },
  { name: 'Vinagre de Jerez DOP reserva', category: 'Grasas y Aceites', calories: 25, proteinG: 0.1, carbsG: 1.2, fatG: 0, fiberG: 0 },
  { name: 'Mostaza de Dijon pura antigua en grano', category: 'Preparados y Otros', calories: 155, proteinG: 7.2, carbsG: 6.0, fatG: 10.5, fiberG: 4.2 },
  { name: 'Tamari salsa de soja 100% sin gluten ni trigo bio', category: 'Preparados y Otros', calories: 80, proteinG: 12.0, carbsG: 6.0, fatG: 0.1, fiberG: 0.8 },
  { name: 'Pasta de miso blanco shiro miso bio japonés', category: 'Preparados y Otros', calories: 198, proteinG: 11.5, carbsG: 24.5, fatG: 5.8, fiberG: 4.8 },
  { name: 'Pasta de miso rojo aka miso bio fermentado', category: 'Preparados y Otros', calories: 215, proteinG: 13.0, carbsG: 22.0, fatG: 6.8, fiberG: 5.2 },
  { name: 'Pimentón de La Vera DOP dulce ahumado', category: 'Verduras y Hortalizas', calories: 282, proteinG: 14.0, carbsG: 35.0, fatG: 12.5, fiberG: 21.0 },
  { name: 'Pimentón de La Vera DOP picante selecto', category: 'Verduras y Hortalizas', calories: 285, proteinG: 14.5, carbsG: 34.0, fatG: 13.0, fiberG: 20.5 },
  { name: 'Cúrcuma molida pura con pimienta negra bio', category: 'Verduras y Hortalizas', calories: 312, proteinG: 9.5, carbsG: 58.0, fatG: 3.2, fiberG: 22.0 },
  { name: 'Jengibre fresco raíz rallada', category: 'Verduras y Hortalizas', calories: 80, proteinG: 1.8, carbsG: 17.8, fatG: 0.8, fiberG: 2.0 },
  { name: 'Canela de Ceylán auténtica en polvo bio', category: 'Azúcares y Edulcorantes', calories: 247, proteinG: 4.0, carbsG: 50.5, fatG: 1.2, fiberG: 53.0 },
  { name: 'Orégano seco silvestre mediterráneo', category: 'Verduras y Hortalizas', calories: 265, proteinG: 9.0, carbsG: 42.0, fatG: 4.3, fiberG: 42.8 },
  { name: 'Albahaca fresca en hojas aromáticas', category: 'Verduras y Hortalizas', calories: 23, proteinG: 3.1, carbsG: 2.6, fatG: 0.6, fiberG: 1.6 },
  { name: 'Romero fresco de monte', category: 'Verduras y Hortalizas', calories: 131, proteinG: 3.3, carbsG: 20.7, fatG: 5.9, fiberG: 14.1 },
  { name: 'Tomillo seco aromático', category: 'Verduras y Hortalizas', calories: 276, proteinG: 9.1, carbsG: 44.0, fatG: 7.4, fiberG: 37.0 },
  { name: 'Laurel seco hojas enteras', category: 'Verduras y Hortalizas', calories: 313, proteinG: 7.6, carbsG: 48.7, fatG: 8.4, fiberG: 26.3 },
  { name: 'Comino molido puro aromático', category: 'Verduras y Hortalizas', calories: 375, proteinG: 17.8, carbsG: 33.7, fatG: 22.3, fiberG: 10.5 },
  { name: 'Cilantro fresco aromático en hojas', category: 'Verduras y Hortalizas', calories: 23, proteinG: 2.1, carbsG: 3.7, fatG: 0.5, fiberG: 2.8 },
  { name: 'Perejil fresco rizado picado', category: 'Verduras y Hortalizas', calories: 36, proteinG: 3.0, carbsG: 6.3, fatG: 0.8, fiberG: 3.3 },
  { name: 'Hierbabuena fresca silvestre', category: 'Verduras y Hortalizas', calories: 44, proteinG: 3.3, carbsG: 8.4, fatG: 0.7, fiberG: 6.8 },

  // Alimentos clínicos y geriátricos especializados
  { name: 'Espesante instantáneo claro para disfagia Resource', category: 'Preparados y Otros', calories: 360, proteinG: 0.5, carbsG: 88.0, fatG: 0.1, fiberG: 6.5 },
  { name: 'Suplemento nutricional hiperproteico Ensure Plus sabor vainilla (brik 200ml)', category: 'Preparados y Otros', calories: 150, proteinG: 6.3, carbsG: 20.2, fatG: 4.8, fiberG: 0 },
  { name: 'Módulo de proteína concentrada de suero en polvo Resource Protein', category: 'Preparados y Otros', calories: 370, proteinG: 90.0, carbsG: 1.0, fatG: 1.0, fiberG: 0 },
  { name: 'Puré triturado geriátrico de ternera con verduras enriquecido', category: 'Preparados y Otros', calories: 85, proteinG: 6.8, carbsG: 8.5, fatG: 2.8, fiberG: 1.8 },
  { name: 'Puré triturado geriátrico de merluza con patata y verduras', category: 'Preparados y Otros', calories: 75, proteinG: 6.2, carbsG: 8.2, fatG: 1.9, fiberG: 1.5 },

  // Algas marinas y superalimentos orientales
  { name: 'Alga Wakame deshidratada bio en tiras', category: 'Verduras y Hortalizas', calories: 45, proteinG: 3.0, carbsG: 9.1, fatG: 0.6, fiberG: 5.0 },
  { name: 'Alga Nori tostada en hojas para sushi', category: 'Verduras y Hortalizas', calories: 35, proteinG: 5.8, carbsG: 4.0, fatG: 0.3, fiberG: 4.8 },
  { name: 'Alga Nori snack con AOVE y sal marina', category: 'Verduras y Hortalizas', calories: 520, proteinG: 25.0, carbsG: 22.0, fatG: 38.0, fiberG: 18.0 },
  { name: 'Alga Espagueti de mar gallega limpia', category: 'Verduras y Hortalizas', calories: 32, proteinG: 2.2, carbsG: 5.5, fatG: 0.4, fiberG: 4.2 },
  { name: 'Alga Kombu de Galicia para cocción de legumbres', category: 'Verduras y Hortalizas', calories: 43, proteinG: 1.7, carbsG: 9.6, fatG: 0.6, fiberG: 6.2 }
];

async function main() {
  console.log(`Starting Batch 3 food expansion with ${foodsBatch3.length} items...`);
  let added = 0;
  let skipped = 0;

  for (const item of foodsBatch3) {
    const existing = await prisma.food.findFirst({
      where: { name: { equals: item.name, mode: 'insensitive' } }
    });

    if (!existing) {
      await prisma.food.create({
        data: {
          name: item.name,
          category: item.category,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          fiberG: item.fiberG || 0,
          source: 'clinical_spanish_db',
          servingSize: 100,
          servingUnit: 'g'
        }
      });
      added++;
    } else {
      skipped++;
    }
  }

  const total = await prisma.food.count();
  console.log(`🎉 Batch 3 finished! Added: ${added}, Already existing: ${skipped}, Total foods in DB: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
