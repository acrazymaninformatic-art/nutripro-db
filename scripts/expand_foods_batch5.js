const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const batch5 = [
  // AVES Y CARNES MAGRAS ADICIONALES
  { name: 'Solomillo de pavo fresco', category: 'Carnes', calories: 105, proteinG: 23.5, carbsG: 0, fatG: 1.2, fiberG: 0 },
  { name: 'Picada de pavo 100% pechuga', category: 'Carnes', calories: 110, proteinG: 24.0, carbsG: 0, fatG: 1.5, fiberG: 0 },
  { name: 'Muslo de pavo deshuesado sin piel', category: 'Carnes', calories: 135, proteinG: 21.0, carbsG: 0, fatG: 5.5, fiberG: 0 },
  { name: 'Codornices frescas limpias al horno', category: 'Carnes', calories: 161, proteinG: 22.0, carbsG: 0, fatG: 8.0, fiberG: 0 },
  { name: 'Pato confitado (muslo desgrasado)', category: 'Carnes', calories: 280, proteinG: 26.0, carbsG: 0, fatG: 19.5, fiberG: 0 },
  { name: 'Carne picada mixta 50% ternera 50% cerdo magro', category: 'Carnes', calories: 195, proteinG: 20.0, carbsG: 0, fatG: 12.8, fiberG: 0 },
  { name: 'Choto / Cabrito lechal asado', category: 'Carnes', calories: 155, proteinG: 21.0, carbsG: 0, fatG: 7.8, fiberG: 0 },
  { name: 'Costillas de cordero lechal a la brasa', category: 'Carnes', calories: 295, proteinG: 18.0, carbsG: 0, fatG: 24.5, fiberG: 0 },
  { name: 'Pierna de cordero lechal asada', category: 'Carnes', calories: 210, proteinG: 22.0, carbsG: 0, fatG: 13.5, fiberG: 0 },
  { name: 'Paletilla de cordero asada', category: 'Carnes', calories: 235, proteinG: 20.5, carbsG: 0, fatG: 17.0, fiberG: 0 },

  // PESCADOS Y CONSERVAS
  { name: 'Atún claro al natural Calvo / Isabel', category: 'Pescados y Mariscos', calories: 101, proteinG: 24.0, carbsG: 0, fatG: 0.6, fiberG: 0 },
  { name: 'Atún claro en aceite de girasol', category: 'Pescados y Mariscos', calories: 185, proteinG: 23.5, carbsG: 0, fatG: 10.2, fiberG: 0 },
  { name: 'Salmón salvaje en conserva al natural', category: 'Pescados y Mariscos', calories: 136, proteinG: 21.5, carbsG: 0, fatG: 5.5, fiberG: 0 },
  { name: 'Sardinas en tomate picante', category: 'Pescados y Mariscos', calories: 180, proteinG: 19.0, carbsG: 3.5, fatG: 10.0, fiberG: 0.5 },
  { name: 'Chipirones en su tinta enlatados', category: 'Pescados y Mariscos', calories: 140, proteinG: 15.0, carbsG: 5.0, fatG: 6.8, fiberG: 0.5 },
  { name: 'Pulpo en salsa marinera enlatado', category: 'Pescados y Mariscos', calories: 135, proteinG: 14.0, carbsG: 4.8, fatG: 6.5, fiberG: 0.4 },
  { name: 'Calamar pota congelada en anillas', category: 'Pescados y Mariscos', calories: 80, proteinG: 16.0, carbsG: 1.0, fatG: 1.3, fiberG: 0 },
  { name: 'Filetes de panga limpios', category: 'Pescados y Mariscos', calories: 75, proteinG: 15.0, carbsG: 0, fatG: 1.7, fiberG: 0 },
  { name: 'Filetes de tilapia limpios al vapor', category: 'Pescados y Mariscos', calories: 96, proteinG: 20.0, carbsG: 0, fatG: 1.7, fiberG: 0 },
  { name: 'Perca del Nilo en filetes', category: 'Pescados y Mariscos', calories: 88, proteinG: 18.5, carbsG: 0, fatG: 1.5, fiberG: 0 },

  // PASTAS, HARINAS Y LEGUMBRES
  { name: 'Espaguetis 100% integrales Barilla crudos', category: 'Cereales y Derivados', calories: 350, proteinG: 13.0, carbsG: 65.0, fatG: 2.5, fiberG: 8.0 },
  { name: 'Macarrones 100% integrales cocidos', category: 'Cereales y Derivados', calories: 140, proteinG: 5.5, carbsG: 26.5, fatG: 1.0, fiberG: 3.5 },
  { name: 'Pasta penne rigate clásica cocida', category: 'Cereales y Derivados', calories: 158, proteinG: 5.8, carbsG: 31.0, fatG: 0.9, fiberG: 1.8 },
  { name: 'Ñoquis de patata italianos cocidos', category: 'Cereales y Derivados', calories: 135, proteinG: 3.5, carbsG: 28.0, fatG: 0.8, fiberG: 1.5 },
  { name: 'Lasaña en placas de huevo cocidas', category: 'Cereales y Derivados', calories: 160, proteinG: 6.0, carbsG: 30.0, fatG: 1.5, fiberG: 1.6 },
  { name: 'Harina de trigo de fuerza para panadería', category: 'Cereales y Derivados', calories: 355, proteinG: 12.5, carbsG: 71.0, fatG: 1.2, fiberG: 3.0 },
  { name: 'Harina de centeno integral pura', category: 'Cereales y Derivados', calories: 335, proteinG: 9.8, carbsG: 65.0, fatG: 1.6, fiberG: 13.5 },
  { name: 'Harina de espelta integral pura', category: 'Cereales y Derivados', calories: 345, proteinG: 14.0, carbsG: 63.0, fatG: 2.5, fiberG: 9.0 },
  { name: 'Harina de almendra molida desgrasada', category: 'Frutos Secos y Semillas', calories: 395, proteinG: 45.0, carbsG: 12.0, fatG: 16.0, fiberG: 16.0 },
  { name: 'Harina de coco orgánica rica en fibra', category: 'Frutos Secos y Semillas', calories: 420, proteinG: 18.0, carbsG: 25.0, fatG: 18.0, fiberG: 38.0 },

  // FRUTAS Y SUPERALIMENTOS
  { name: 'Manzana Golden Delicious fresca', category: 'Frutas', calories: 52, proteinG: 0.3, carbsG: 13.8, fatG: 0.2, fiberG: 2.4 },
  { name: 'Manzana Granny Smith verde ácida', category: 'Frutas', calories: 50, proteinG: 0.4, carbsG: 13.2, fatG: 0.2, fiberG: 2.8 },
  { name: 'Manzana Pink Lady fresca', category: 'Frutas', calories: 54, proteinG: 0.3, carbsG: 14.1, fatG: 0.2, fiberG: 2.3 },
  { name: 'Pera Conferencia española', category: 'Frutas', calories: 57, proteinG: 0.4, carbsG: 15.2, fatG: 0.1, fiberG: 3.1 },
  { name: 'Pera Blanquilla / de agua fresca', category: 'Frutas', calories: 50, proteinG: 0.3, carbsG: 13.0, fatG: 0.1, fiberG: 2.8 },
  { name: 'Uva de mesa blanca sin pepitas', category: 'Frutas', calories: 69, proteinG: 0.7, carbsG: 18.1, fatG: 0.2, fiberG: 0.9 },
  { name: 'Uva tinta de mesa fresca', category: 'Frutas', calories: 71, proteinG: 0.8, carbsG: 18.5, fatG: 0.2, fiberG: 1.0 },
  { name: 'Ciruela roja fresca dulce', category: 'Frutas', calories: 46, proteinG: 0.7, carbsG: 11.4, fatG: 0.3, fiberG: 1.4 },
  { name: 'Dátiles Medjoul gigantes naturales', category: 'Frutas', calories: 277, proteinG: 1.8, carbsG: 75.0, fatG: 0.2, fiberG: 6.7 },
  { name: 'Dátiles deglet nour deshidratados', category: 'Frutas', calories: 282, proteinG: 2.5, carbsG: 75.0, fatG: 0.4, fiberG: 8.0 },
  { name: 'Orejones de albaricoque secos', category: 'Frutas', calories: 241, proteinG: 3.4, carbsG: 62.6, fatG: 0.5, fiberG: 7.3 },
  { name: 'Ciruelas pasas sin hueso secas', category: 'Frutas', calories: 240, proteinG: 2.2, carbsG: 63.9, fatG: 0.4, fiberG: 7.1 },
  { name: 'Higos secos cuello de dama de Almoharín', category: 'Frutas', calories: 250, proteinG: 3.3, carbsG: 64.0, fatG: 1.0, fiberG: 9.8 },
  { name: 'Uvas pasas sultanas sin pepita', category: 'Frutas', calories: 299, proteinG: 3.1, carbsG: 79.2, fatG: 0.5, fiberG: 3.7 },
  { name: 'Bayas de Goji desecadas tibetanas', category: 'Frutas', calories: 349, proteinG: 14.3, carbsG: 77.0, fatG: 0.4, fiberG: 13.0 },

  // SNACKS SALUDABLES Y ENCURTIDOS
  { name: 'Banderillas picantes en vinagre', category: 'Verduras y Hortalizas', calories: 25, proteinG: 1.0, carbsG: 3.0, fatG: 0.8, fiberG: 1.5 },
  { name: 'Cebollitas francesas en vinagre', category: 'Verduras y Hortalizas', calories: 28, proteinG: 0.9, carbsG: 5.5, fatG: 0.1, fiberG: 1.2 },
  { name: 'Guindillas vascas / Piparras de Ibarra en vinagre', category: 'Verduras y Hortalizas', calories: 26, proteinG: 1.2, carbsG: 4.2, fatG: 0.4, fiberG: 2.0 },
  { name: 'Maíz dulce en grano enlatado Bonduelle', category: 'Verduras y Hortalizas', calories: 86, proteinG: 2.9, carbsG: 17.0, fatG: 1.2, fiberG: 2.4 },
  { name: 'Palmitos enteros en conserva escurridos', category: 'Verduras y Hortalizas', calories: 28, proteinG: 2.5, carbsG: 4.6, fatG: 0.6, fiberG: 2.4 },
  { name: 'Champiñones laminados en conserva escurridos', category: 'Verduras y Hortalizas', calories: 18, proteinG: 2.2, carbsG: 1.5, fatG: 0.3, fiberG: 2.2 },
  { name: 'Espárragos blancos gruesos de Navarra D.O.', category: 'Verduras y Hortalizas', calories: 15, proteinG: 1.5, carbsG: 1.8, fatG: 0.2, fiberG: 1.5 },
  { name: 'Yemas de espárragos blancos en conserva', category: 'Verduras y Hortalizas', calories: 16, proteinG: 1.6, carbsG: 1.9, fatG: 0.2, fiberG: 1.6 },
  { name: 'Puerros en conserva al natural', category: 'Verduras y Hortalizas', calories: 22, proteinG: 1.1, carbsG: 4.0, fatG: 0.2, fiberG: 1.8 },
  { name: 'Alcachofas baby en aceite de oliva escurridas', category: 'Verduras y Hortalizas', calories: 95, proteinG: 2.2, carbsG: 6.5, fatG: 6.8, fiberG: 4.0 },
];

async function main() {
  console.log(`🌱 Insertando lote 5 ampliado de alimentos...`);
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < batch5.length; i += batchSize) {
    const batch = batch5.slice(i, i + batchSize).map(food => ({
      ...food,
      source: 'spanish_curated_batch5',
      servingSize: 100,
      servingUnit: 'g',
    }));
    await prisma.food.createMany({ data: batch });
    inserted += batch.length;
  }
  const total = await prisma.food.count();
  console.log(`✅ Lote 5 completado: ${inserted} nuevos alimentos.`);
  console.log(`📊 TOTAL ALIMENTOS EN BASE DE DATOS: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
