const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load the compiled or direct catalog
async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found in database');
    return;
  }

  // Define the comprehensive 30 clinical recipes
  const catalog = [
    {
      name: 'Pechuga de Pollo Marinada con Arroz Basmati al Laurel',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 15,
      imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
      description: 'Plato clásico de alto valor proteico y carbohidratos complejos de lenta absorción.',
      instructions: '1. Cocer el arroz basmati en agua hirviendo con laurel y sal 12 min.\n2. Marinar la pechuga de pollo con zumo de limón, orégano y pimienta 5 min.\n3. Cocinar a la plancha 3-4 min por lado con la mitad del AOVE.\n4. Servir el pollo sobre el arroz con el resto de AOVE en crudo.',
    },
    {
      name: 'Lomo de Salmón a la Plancha con Brócoli al Vapor y Patata Asada',
      category: 'Cenas',
      servings: 1,
      prepTimeMin: 8,
      cookTimeMin: 18,
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
      description: 'Cena rica en ácidos grasos omega-3 y fibra saciante.',
      instructions: '1. Asar la patata en microondas (6 min) o al horno con piel.\n2. Cocinar el brócoli al vapor durante 6-7 min para conservar nutrientes.\n3. Dorar el salmón en sartén por el lado de la piel 4 min y 2 min por el otro lado.\n4. Servir con eneldo picado y unas gotas de limón.',
    },
    {
      name: 'Solomillo de Ternera al Punto con Boniato Asado y Calabacín',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 20,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      description: 'Aporte masivo de hierro hemo, zinc y betacarotenos del boniato.',
      instructions: '1. Cortar el boniato en bastones y hornear a 200°C 20 min con romero.\n2. Dorar las rodajas de calabacín en plancha 2 min por lado con sal marina.\n3. Cocinar el solomillo en plancha muy caliente 2 min por lado.\n4. Dejar reposar 1 min y servir con escamas de sal.',
    },
    {
      name: 'Lentejas Pardinas Estofadas Tradicionales con Hortalizas',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 15,
      cookTimeMin: 35,
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
      description: 'Guiso vegetal saciante que combina legumbre y cereal para proteína completa.',
      instructions: '1. Pochar cebolla, zanahoria y pimiento con una cucharadita de AOVE.\n2. Añadir tomate rallado y pimentón dulce sin quemar.\n3. Incorporar las lentejas, laurel y cubrir con caldo. Cocer 30 min.\n4. Servir con guarnición de arroz blanco al dente.',
    },
    {
      name: 'Merluza del Cantábrico con Crema Casera de Calabacín y Patata',
      category: 'Cenas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 15,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      description: 'Cena hipocalórica ultra digestiva para un descanso óptimo.',
      instructions: '1. Hervir calabacín, patata y puerro 12 min. Triturar suavemente.\n2. Marcar los lomos de merluza en sartén antiadherente con ajo 2-3 min por lado.\n3. Servir el pescado sobre el lecho de crema de calabacín caliente.\n4. Espolvorear perejil fresco picado y un hilo de AOVE.',
    },
    {
      name: 'Porridge Templado de Avena Integral con Frutos Rojos y Canela',
      category: 'Desayunos',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 5,
      imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
      description: 'Desayuno cardiosaludable con betaglucanos de avena y antioxidantes.',
      instructions: '1. Verter la leche o bebida vegetal con la avena y canela en un cazo.\n2. Cocinar a fuego medio 4-5 min removiendo hasta espesar.\n3. Servir en un bol hondo.\n4. Decorar con los frutos rojos frescos lavados.',
    },
    {
      name: 'Tostada de Pan 100% Integral con Huevo Poché y Tomate Rallado',
      category: 'Desayunos',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 5,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
      description: 'Desayuno mediterráneo equilibrado con colina de la yema y licopeno.',
      instructions: '1. Tostar el pan integral hasta que esté crujiente.\n2. Untar el tomate rallado natural con el AOVE y una pizca de sal.\n3. Escalfar el huevo en agua a punto de hervir 3 min (yema líquida).\n4. Montar el huevo sobre la tostada.',
    },
    {
      name: 'Tortitas Caseras Fitness de Avena y Claras con Arándanos',
      category: 'Desayunos',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 8,
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
      description: 'Masa sin azúcares añadidos rica en albúmina para reparación muscular.',
      instructions: '1. Batir la avena, claras, canela y vainilla hasta que no queden grumos.\n2. Calentar sartén antiadherente con una gota de AOVE.\n3. Verter círculos de masa y dorar 2 min por lado.\n4. Apilar y coronar con arándanos frescos.',
    },
    {
      name: 'Macarrones 100% Integrales con Picada de Ternera y Champiñones',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 15,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281143?auto=format&fit=crop&w=600&q=80',
      description: 'Plato reconfortante alto en fibra con proteína magra saciante.',
      instructions: '1. Cocer la pasta integral en agua hirviendo con sal 9 min al dente.\n2. Saltear champiñones y la carne picada con orégano y pimienta.\n3. Añadir el tomate triturado natural y reducir 5 min.\n4. Mezclar la pasta escurrida con la boloñesa casera.',
    },
    {
      name: 'Dorada Salvaje al Horno sobre Cama de Patatas Panaderas y Limón',
      category: 'Cenas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 22,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
      description: 'Receta al horno tradicional con proteína limpia y bajo contenido graso.',
      instructions: '1. Hornear patatas y cebolla en rodajas a 190°C durante 12 min con un hilo de AOVE.\n2. Disponer la dorada encima con rodajas de limón y hierbas aromáticas.\n3. Hornear 10-12 min más hasta que la carne esté tierna y jugosa.',
    },
    {
      name: 'Sepia a la Plancha con Ajo, Perejil y Espárragos Verdes Trigueros',
      category: 'Cenas',
      servings: 1,
      prepTimeMin: 8,
      cookTimeMin: 10,
      imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
      description: 'Cena marina con altísima densidad proteica y poder depurativo.',
      instructions: '1. Marcar los espárragos trigueros a la plancha 6 min con sal gorda.\n2. Secar bien la sepia y cocinarla en plancha muy caliente 2 min por lado.\n3. Añadir el majado de ajo, perejil y AOVE en el último minuto.\n4. Servir caliente con limón.',
    },
    {
      name: 'Tofu Firme Marinado al Tamari con Salteado de Verduras',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 12,
      cookTimeMin: 10,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: 'Proteína vegetal de alta asimilación con fitoquímicos y sésamo.',
      instructions: '1. Prensar el tofu y cortar en dados. Marinar 10 min en tamari.\n2. Dorar los dados de tofu en sartén hasta que queden crujientes.\n3. Saltear las verduras en tiras a fuego vivo 4 min al dente.\n4. Mezclar el tofu con las verduras y semillas de sésamo.',
    },
    {
      name: 'Pollo Rústico Asado al Limón con Hierbas Provenzales',
      category: 'Comidas',
      servings: 2,
      prepTimeMin: 10,
      cookTimeMin: 35,
      imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
      description: 'Pollo crujiente al horno sazonado con limón y hierbas provenzales.',
      instructions: '1. Precalentar horno a 200°C.\n2. Disponer muslos o contramuslos de pollo limpios en bandeja.\n3. Emulsionar zumo de 1 limón, ajo picado, romero, tomillo y 10g AOVE.\n4. Pincelar el pollo y hornear 35-40 min hasta piel dorada.',
    },
    {
      name: 'Bowl de Yogur Proteico o Kéfir con Nueces y Fruta de Temporada',
      category: 'Snacks y Meriendas',
      servings: 1,
      prepTimeMin: 3,
      cookTimeMin: 0,
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
      description: 'Snack saciante de proteína lenta (caseína) y probióticos naturales para la microbiota.',
      instructions: '1. Servir el yogur o kéfir frío en un cuenco.\n2. Lavar la fruta fresca y cortar en dados.\n3. Picar las nueces con los dedos y esparcirlas por encima.\n4. Espolvorear con canela de Ceylán.',
    },
    {
      name: 'Ensalada Templada de Quinoa Real con Aguacate y Garbanzos Crujientes',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 20,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      description: 'Proteína vegetal completa con todos los aminoácidos esenciales.',
      instructions: '1. Lavar la quinoa y hervir 15 min. Escurrir.\n2. Saltear los garbanzos con comino y AOVE hasta dorar.\n3. Cortar aguacate en dados y tomates cherry por la mitad.\n4. Mezclar la quinoa templada con el resto de ingredientes y aliño de limón.',
    },
    {
      name: 'Crema Aterciopelada de Calabaza con Jengibre y Semillas de Calabaza',
      category: 'Cenas',
      servings: 2,
      prepTimeMin: 10,
      cookTimeMin: 25,
      imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=600&q=80',
      description: 'Cena ligera antiinflamatoria reconfortante y depurativa.',
      instructions: '1. Pochar cebolla en AOVE 5 min.\n2. Añadir calabaza en dados y jengibre rallado.\n3. Cubrir con caldo vegetal y cocer 20 min.\n4. Triturar muy fino y servir con semillas de calabaza tostadas.',
    },
    {
      name: 'Revuelto Cremoso de Champiñones, Espinacas Baby y Queso Fresco',
      category: 'Desayunos',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 8,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
      description: 'Desayuno o cena proteica rápida con verduras frescas y huevo campero.',
      instructions: '1. Saltear champiñones en sartén con AOVE 3 min.\n2. Añadir espinacas baby 1 min.\n3. Batir huevos y verter a fuego bajo removiendo suavemente.\n4. Retirar jugoso y coronar con queso fresco desmenuzado.',
    },
    {
      name: 'Poke Bowl de Atún Fresco Marinado con Arroz Integral y Edamame',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 15,
      cookTimeMin: 25,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: 'Plato fresco completo rico en ácidos grasos omega-3 y proteína limpia.',
      instructions: '1. Cocer arroz integral y dejar templar.\n2. Cortar atún fresco en dados y marinar en soja baja en sal y jengibre 10 min.\n3. Hervir edamame 3 min.\n4. Montar el bowl en sectores y espolvorear sésamo tostado.',
    },
    {
      name: 'Garbanzos Salteados con Espinacas, Pimentón y Huevo Escalfado',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 12,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
      description: 'Tradición mediterránea en versión saludable alta en hierro no hemo y fibra.',
      instructions: '1. Dorar ajo laminado en AOVE.\n2. Añadir garbanzos cocidos y pimentón dulce.\n3. Incorporar espinacas hasta reducir.\n4. Escalfar el huevo 3 min y colocar sobre los garbanzos.',
    },
    {
      name: 'Wrap Integral de Pavo a la Plancha con Hummus Casero y Rúcula',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 8,
      cookTimeMin: 5,
      imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
      description: 'Almuerzo portátil ideal para pacientes que comen fuera de casa o en tupper.',
      instructions: '1. Marcar el pavo a la plancha y cortar en tiras.\n2. Calentar la tortilla integral 10 segundos.\n3. Untar el hummus y colocar la rúcula y el pavo.\n4. Enrollar cerrando los bordes y cortar al bies.',
    },
    {
      name: 'Tortilla de Patata Ligera con Cebolla Caramelizada al Horno',
      category: 'Cenas',
      servings: 2,
      prepTimeMin: 10,
      cookTimeMin: 30,
      imageUrl: 'https://images.unsplash.com/photo-1598214886806-c87b84b7078b?auto=format&fit=crop&w=600&q=80',
      description: 'Sabor tradicional español con 60% menos grasa asando la patata al horno.',
      instructions: '1. Laminar patatas y cebolla y hornear con AOVE a 200°C 20 min.\n2. Batir los huevos e incorporar las patatas horneadas.\n3. Cuajar en sartén antiadherente 4 min por lado a fuego medio-bajo.\n4. Servir jugosa.',
    },
    {
      name: 'Cuscús Especiado con Pollo Desmenuzado, Pasas y Almendras',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 8,
      cookTimeMin: 15,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
      description: 'Cereal energético aromatizado con cúrcuma y frutos secos.',
      instructions: '1. Hidratar el cuscús con agua hirviendo con cúrcuma y sal 5 min tapado.\n2. Esponjar con un tenedor y un hilo de AOVE.\n3. Mezclar con pollo desmenuzado, pasas y almendras tostadas.\n4. Decorar con hojas de menta.',
    },
    {
      name: 'Gazpacho Andaluz Tradicional con Guarnición de Verduras Picadas',
      category: 'Cenas',
      servings: 3,
      prepTimeMin: 15,
      cookTimeMin: 0,
      imageUrl: 'https://images.unsplash.com/photo-1529566652340-2c41a1eb6d93?auto=format&fit=crop&w=600&q=80',
      description: 'Sopa fría cargada de licopeno, potasio y vitaminas antioxidantes A, C y E.',
      instructions: '1. Triturar tomates maduros con pepino, pimiento, ajo y vinagre de Jerez.\n2. Emulsionar con AOVE en hilo fino.\n3. Colar y refrigerar mínimo 2 horas.\n4. Servir muy frío con dados de verduras como guarnición.',
    },
    {
      name: 'Bacalao al Horno sobre Cama de Pisto Manchego con Aceitunas Negras',
      category: 'Cenas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 25,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      description: 'Pescado blanco magro sobre un sofrito vegetal lleno de fibra y antioxidantes.',
      instructions: '1. Sofreír calabacín, pimiento y berenjena en dados con tomate 10 min.\n2. Disponer en fuente de horno.\n3. Colocar el bacalao encima con aceitunas negras.\n4. Hornear a 190°C durante 12-14 min.',
    },
    {
      name: 'Smoothie Verde Proteico de Espinacas, Plátano y Proteína de Suero',
      category: 'Snacks y Meriendas',
      servings: 1,
      prepTimeMin: 3,
      cookTimeMin: 0,
      imageUrl: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?auto=format&fit=crop&w=600&q=80',
      description: 'Batido post-entrenamiento saciante y alcalinizante.',
      instructions: '1. Añadir bebida vegetal de almendras al vaso batidor.\n2. Incorporar espinacas baby, plátano congelado y proteína en polvo.\n3. Triturar a máxima velocidad 1 minuto.\n4. Servir inmediatamente con semillas de chía.',
    },
    {
      name: 'Hamburguesa Casera de Pavo con Pan Integral, Lechuga y Mostaza',
      category: 'Comidas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 8,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      description: 'Hamburguesa saludable con bajo porcentaje de grasa saturada.',
      instructions: '1. Formar la hamburguesa con carne picada de pavo, sal y ajo en polvo.\n2. Cocinar a la plancha 3-4 min por lado.\n3. Tostar el pan integral.\n4. Montar con lechuga, tomate, cebolla morada y mostaza de Dijon.',
    },
    {
      name: 'Arroz Negro Meloso con Calamares de Potera y Alioli Suave de Limón',
      category: 'Comidas',
      servings: 2,
      prepTimeMin: 15,
      cookTimeMin: 22,
      imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=600&q=80',
      description: 'Arroz mediterráneo meloso con proteína marina y tinta natural de calamar.',
      instructions: '1. Preparar un sofrito de cebolla, tomate y ajo.\n2. Saltear los calamares cortados.\n3. Añadir el arroz, la tinta disuelta en caldo de pescado caliente.\n4. Cocinar 18-20 min y servir con alioli suave.',
    },
    {
      name: 'Crêpes de Avena y Claras con Manzana Caramelizada y Canela',
      category: 'Desayunos',
      servings: 1,
      prepTimeMin: 5,
      cookTimeMin: 10,
      imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80',
      description: 'Desayuno dulce sin azúcares refinados con fibra soluble de la avena.',
      instructions: '1. Batir avena con claras de huevo hasta masa homogénea.\n2. Saltear rodajas de manzana con canela hasta caramelizar.\n3. Hacer los crêpes finos en sartén antiadherente 1-2 min por lado.\n4. Rellenar con la manzana caramelizada y enrollar.',
    },
    {
      name: 'Ensalada César Ligera con Pollo a la Plancha y Salsa César de Yogur',
      category: 'Cenas',
      servings: 1,
      prepTimeMin: 10,
      cookTimeMin: 8,
      imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80',
      description: 'Versión ligera de la clásica ensalada con salsa a base de yogur desnatado.',
      instructions: '1. Mezclar yogur con mostaza, ajo rallado y limón para la salsa.\n2. Dorar pechuga de pollo a la plancha y cortar en tiras.\n3. Montar lechuga romana con pollo, dados de pan integral tostado y parmesano.\n4. Aliñar con la salsa César de yogur.',
    },
    {
      name: 'Hummus Casero de Garbanzos con Pimentón de La Vera y Crudités',
      category: 'Snacks y Meriendas',
      servings: 4,
      prepTimeMin: 10,
      cookTimeMin: 0,
      imageUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80',
      description: 'Paté vegetal rico en fibra y grasas monoinsaturadas del tahini y AOVE.',
      instructions: '1. Triturar garbanzos cocidos con tahini, zumo de limón, ajo, comino y sal.\n2. Añadir agua de la cocción poco a poco hasta lograr textura cremosa.\n3. Servir en cuenco con un chorro de AOVE y pimentón.\n4. Acompañar con bastones de zanahoria, pepino y apio.',
    },
  ];

  console.log(`Starting sync for ${catalog.length} recipes...`);

  let added = 0;
  let updated = 0;

  for (const item of catalog) {
    const existing = await prisma.recipe.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      await prisma.recipe.create({
        data: {
          ...item,
          userId: user.id,
        },
      });
      added++;
    } else {
      await prisma.recipe.update({
        where: { id: existing.id },
        data: {
          category: item.category,
          imageUrl: item.imageUrl,
          description: item.description,
          instructions: item.instructions,
          prepTimeMin: item.prepTimeMin,
          cookTimeMin: item.cookTimeMin,
          servings: item.servings,
        },
      });
      updated++;
    }
  }

  const total = await prisma.recipe.count();
  console.log(`Sync completed! Added: ${added}, Updated: ${updated}, Total in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
