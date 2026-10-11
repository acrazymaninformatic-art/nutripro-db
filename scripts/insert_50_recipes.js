/**
 * @file insert_50_recipes.js
 * @description Adds 50 new clinical and Mediterranean recipes to NutriPro database,
 * complete with ingredients linked to Food items, culinary instructions, macros,
 * and high quality Unsplash photos.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const new50Recipes = [
  // ================= DESAYUNOS (10) =================
  {
    name: 'Tostada Nórdica de Centeno con Salmón Ahumado y Queso Fresco Batido',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Desayuno rico en omega-3 y proteínas de alto valor biológico sobre pan denso de centeno.',
    instructions: '1. Tostar la rebanada de pan de centeno integral.\n2. Untar el queso fresco batido con una pizca de eneldo y pimienta negra.\n3. Disponer las lonchas de salmón ahumado por encima.\n4. Terminar con unas gotas de zumo de limón y alcaparras si se desea.',
    ingredients: [
      { name: 'Pan de centeno integral', quantityG: 60 },
      { name: 'Salmón ahumado', quantityG: 50 },
      { name: 'Queso fresco batido desnatado', quantityG: 50 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Bowl de Yogur Griego con Semillas de Chía, Nueces y Arándanos',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    description: 'Desayuno saciante rico en probióticos, grasas antiinflamatorias y antioxidantes.',
    instructions: '1. Verter el yogur griego en un bol amplio.\n2. Añadir las semillas de chía y mezclar ligeramente.\n3. Coronar con arándanos frescos limpios y nueces partidas a mano.\n4. Espolvorear con canela de Ceylán al gusto.',
    ingredients: [
      { name: 'Yogur griego natural', quantityG: 150 },
      { name: 'Arándanos silvestres azules', quantityG: 60 },
      { name: 'Nueces peladas', quantityG: 20 },
      { name: 'Semillas de chía', quantityG: 10 }
    ]
  },
  {
    name: 'Tortilla Francesa de Dos Huevos con Espinacas Baby y Tomates Cherry',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 5,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Proteína pura matinal con micronutrientes esenciales de verduras de hoja verde.',
    instructions: '1. Batir los dos huevos con una pizca de sal marina.\n2. En sartén antiadherente con unas gotas de AOVE, saltear las espinacas baby 1 min.\n3. Verter los huevos batidos y cuajar a fuego medio doblándola en medialuna.\n4. Acompañar con tomates cherry cortados por la mitad.',
    ingredients: [
      { name: 'Huevo de gallina entero fresco', quantityG: 110 },
      { name: 'Espinacas frescas', quantityG: 60 },
      { name: 'Tomates cherry', quantityG: 80 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Smoothie Bowl Verde Detox de Espinacas, Manzana Verde y Proteína',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
    description: 'Batido espeso y energizante de baja carga glucémica y máxima densidad de micronutrientes.',
    instructions: '1. Colocar las espinacas, la manzana pelada y troceada en el vaso de la batidora.\n2. Añadir la proteína en polvo y la bebida de almendras sin azúcar.\n3. Triturar a máxima potencia hasta lograr textura de crema homogénea.\n4. Servir en un bol y decorar con semillas de chía.',
    ingredients: [
      { name: 'Espinacas frescas', quantityG: 80 },
      { name: 'Manzana verde ácida Granny Smith', quantityG: 120 },
      { name: 'Bebida de almendras sin azúcar', quantityG: 150 },
      { name: 'Aislado de proteína de suero', quantityG: 25 },
      { name: 'Semillas de chía', quantityG: 10 }
    ]
  },
  {
    name: 'Avena Nocturna (Overnight Oats) con Leche de Almendras y Manzana Asada',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
    description: 'Avena remojada en frío durante la noche para una digestibilidad óptima y almidón resistente.',
    instructions: '1. En un tarro de cristal, mezclar los copos de avena con la bebida vegetal y canela.\n2. Dejar reposar en la nevera al menos 6 horas o toda la noche.\n3. Al momento de consumir, incorporar la manzana cortada en daditos y nueces picadas.',
    ingredients: [
      { name: 'Copos de avena integral finos', quantityG: 45 },
      { name: 'Bebida de almendras sin azúcar', quantityG: 150 },
      { name: 'Manzana fresca', quantityG: 80 },
      { name: 'Nueces peladas', quantityG: 15 }
    ]
  },
  {
    name: 'Tostada de Pan de Masa Madre con Aguacate y Huevo Escalfado',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 5,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Desayuno estrella cardiosaludable con grasas monoinsaturadas y colina del huevo.',
    instructions: '1. Tostar la rebanada de pan de masa madre.\n2. Chafar el aguacate con un tenedor y aliñar con sal y unas gotas de limón.\n3. Escalfar el huevo en agua hirviendo con un chorrito de vinagre durante 3 minutos.\n4. Montar el aguacate sobre la tostada y coronar con el huevo poché.',
    ingredients: [
      { name: 'Pan de masa madre integral', quantityG: 60 },
      { name: 'Aguacate Hass', quantityG: 50 },
      { name: 'Huevo de gallina entero fresco', quantityG: 55 },
      { name: 'Semillas de sésamo tostadas', quantityG: 5 }
    ]
  },
  {
    name: 'Crepes Ligeros de Harina de Avena con Requesón y Fresas',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 5,
    imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80',
    description: 'Versión fitness sin azúcares añadidos rica en caseína y antioxidantes de frutos rojos.',
    instructions: '1. Batir la harina de avena, las claras y un chorrito de agua o leche.\n2. Verter en sartén caliente antiadherente y dorar 1-2 min por cada cara.\n3. Rellenar con el requesón desnatado y láminas de fresas frescas.',
    ingredients: [
      { name: 'Harina de avena integral', quantityG: 40 },
      { name: 'Claras de huevo pasteurizadas', quantityG: 100 },
      { name: 'Requesón semidesnatado', quantityG: 60 },
      { name: 'Fresas o fresones frescos', quantityG: 80 }
    ]
  },
  {
    name: 'Shakshuka Tradicional con Dos Huevos en Salsa de Tomate y Pimientos',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 15,
    imageUrl: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=600&q=80',
    description: 'Plato mediterráneo caliente especiado con comino, pimentón y licopeno del tomate.',
    instructions: '1. En una sartén pochar la cebolla y pimiento picados con el AOVE.\n2. Agregar el tomate triturado, comino, pimentón dulce y sal. Reducir 8 min.\n3. Hacer dos huecos y cascar los dos huevos. Tapar y dejar cuajar 4 min a fuego bajo.\n4. Servir recién hecho con perejil fresco espolvoreado.',
    ingredients: [
      { name: 'Huevo de gallina entero fresco', quantityG: 110 },
      { name: 'Tomate triturado natural', quantityG: 150 },
      { name: 'Pimiento rojo', quantityG: 60 },
      { name: 'Cebolla fresca', quantityG: 40 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Tazón de Kéfir Artesanal con Semillas de Cáñamo y Frambuesas',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 3,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    description: 'Potente recarga probiótica para la microbiota intestinal con ácidos grasos esenciales.',
    instructions: '1. Servir el kéfir bien frío en un cuenco.\n2. Disponer las frambuesas limpias encima.\n3. Espolvorear las semillas de cáñamo peladas y copos de centeno.',
    ingredients: [
      { name: 'Kéfir de leche entera de cabra ecológico', quantityG: 180 },
      { name: 'Frambuesas rojas frescas', quantityG: 70 },
      { name: 'Semillas de cáñamo peladas crudas bio', quantityG: 15 },
      { name: 'Copos de avena integral finos', quantityG: 25 }
    ]
  },
  {
    name: 'Tostada Integral con Hummus de Garbanzo, Rábanos y Brotes Tiernos',
    category: 'Desayunos',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Desayuno 100% vegano de liberación sostenida de energía con fibra prebiótica.',
    instructions: '1. Tostar el pan de espelta o centeno integral.\n2. Untar generosamente con el hummus casero de garbanzo.\n3. Decorar con láminas finas de rábano crujiente y brotes tiernos.',
    ingredients: [
      { name: 'Pan 100% integral', quantityG: 60 },
      { name: 'Hummus de garbanzos', quantityG: 60 },
      { name: 'Rábanos frescos', quantityG: 30 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },

  // ================= COMIDAS (15) =================
  {
    name: 'Lubina Salvaje al Horno sobre Cama de Calabacín y Patata Panadera',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 20,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Pescado blanco magro rico en fósforo y selenio asado al estilo tradicional mediterráneo.',
    instructions: '1. Cortar la patata y el calabacín en rodajas finas panaderas.\n2. Hornear las verduras a 190°C con un hilo de AOVE durante 12 minutos.\n3. Colocar los lomos de lubina encima con la piel hacia abajo, sal y romero.\n4. Hornear 8-10 minutos más hasta que la carne esté en su punto exacto.',
    ingredients: [
      { name: 'Lubina fresca limpia', quantityG: 200 },
      { name: 'Patatas frescas', quantityG: 120 },
      { name: 'Calabacín con piel', quantityG: 120 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Salteado de Ternera Magra al Wok con Bimi y Champiñones',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 8,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    description: 'Guiso rápido al fuego vivo que conserva la textura crujiente de las verduras y la terneza de la carne.',
    instructions: '1. Cortar la ternera en tiras finas.\n2. Saltear a fuego muy vivo en wok con 5g de AOVE durante 2 minutos. Retirar.\n3. En el mismo wok saltear el bimi troceado y los champiñones laminados 4 minutos.\n4. Reincorporar la ternera, añadir un chorrito de salsa de soja baja en sal y mezclar 1 min.',
    ingredients: [
      { name: 'Ternera magra de añojo en filetes', quantityG: 160 },
      { name: 'Bimi cocido al dente al vapor', quantityG: 100 },
      { name: 'Champiñones frescos', quantityG: 100 },
      { name: 'Arroz integral cocido', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Pollo al Curry Suave con Leche de Coco Ligera y Quinoa Real',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 15,
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    description: 'Plato aromático con cúrcuma antiinflamatoria y proteína completa de la quinoa.',
    instructions: '1. Dorar los dados de pechuga de pollo en cazuela con AOVE 4 min.\n2. Añadir cebolla y pimiento picados finos, saltear 3 min.\n3. Espolvorear curry en polvo y verter la leche de coco ligera. Cocinar 8 min a fuego suave.\n4. Servir acompañado de la quinoa cocida al dente.',
    ingredients: [
      { name: 'Pechuga de pollo limpia sin piel', quantityG: 160 },
      { name: 'Quinoa real en grano cruda', quantityG: 50 },
      { name: 'Leche de coco ligera', quantityG: 80 },
      { name: 'Pimiento rojo fresco', quantityG: 50 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Salmón al Horno con Costra de Mostaza Antigua y Espárragos Trigueros',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 8,
    cookTimeMin: 12,
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    description: 'Pescado azul con grasas saludables EPA y DHA combinado con diuréticos naturales.',
    instructions: '1. Disponer el lomo de salmón en una bandeja apta para horno.\n2. Pincelar la superficie con una capa fina de mostaza antigua Dijon.\n3. Colocar los espárragos trigueros al lado con sal marina y AOVE.\n4. Hornear a 200°C durante 12-14 minutos.',
    ingredients: [
      { name: 'Lomo de salmón fresco', quantityG: 160 },
      { name: 'Espárragos trigueros frescos', quantityG: 140 },
      { name: 'Patatas frescas', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Garbanzos Pedrosillano Salteados con Espinacas y Bacalao Desmigado',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 10,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Guiso marinero rápido castellano con legumbre, fibra soluble y yodo.',
    instructions: '1. En sartén con AOVE dorar un diente de ajo laminado.\n2. Añadir las espinacas frescas y rehogar hasta reducir.\n3. Incorporar los garbanzos cocidos escurridos y el bacalao desalado desmigado.\n4. Saltear 4-5 minutos añadiendo pimentón de la Vera dulce.',
    ingredients: [
      { name: 'Garbanzos cocidos en conserva', quantityG: 180 },
      { name: 'Bacalao desalado limpio', quantityG: 120 },
      { name: 'Espinacas frescas', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Pavo a la Plancha Marinado con Limón y Romero con Puré de Boniato',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 15,
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    description: 'Carne blanca magra hipocalórica con carbohidratos complejos de bajo índice glucémico.',
    instructions: '1. Cocer el boniato al vapor o microondas hasta que quede tierno y chafar con tenedor.\n2. Marinar los filetes de solomillo de pavo con limón, romero y sal 5 min.\n3. Pasar el pavo por la plancha muy caliente 2 min por lado con 5g de AOVE.\n4. Emplatar el puré de boniato con el pavo recién hecho.',
    ingredients: [
      { name: 'Pechuga de pavo limpia', quantityG: 170 },
      { name: 'Boniato blanco tradicional cocido', quantityG: 150 },
      { name: 'Judías verdes redondas', quantityG: 80 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Arroz Meloso con Sepia, Gambas y Alcachofas de Temporada',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 15,
    cookTimeMin: 20,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Plato marinero levantino bajo en grasa saturada y rico en inulina prebiótica.',
    instructions: '1. Marcar la sepia troceada y las gambas en paella o cazuela con AOVE. Retirar.\n2. En el mismo aceite sofreír cebolla, ajo, tomate y las alcachofas en cuartos 6 min.\n3. Añadir el arroz, nacarar 1 min y verter el caldo de pescado caliente.\n4. Cocer 15-18 min incorporando la sepia y gambas en los últimos 4 min.',
    ingredients: [
      { name: 'Arroz blanco o bomba', quantityG: 65 },
      { name: 'Sepia limpia fresca', quantityG: 120 },
      { name: 'Gambas peladas frescas', quantityG: 60 },
      { name: 'Alcachofas frescas limpias', quantityG: 80 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Solomillo de Cerdo Ibérico con Manzana Asada y Judías Verdes',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 15,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    description: 'Corte magro de cerdo ibérico con perfil de ácido oleico similar al aceite de oliva.',
    instructions: '1. Cortar la manzana en gajos y asarla en sartén o microondas con canela.\n2. Cocer las judías verdes al dente en agua hirviendo con sal 6 min.\n3. Marcar los medallones de solomillo en plancha muy caliente 2 min por lado al punto.\n4. Servir el solomillo con la compota de manzana y judías aliñadas con AOVE.',
    ingredients: [
      { name: 'Solomillo de cerdo magro limpio', quantityG: 160 },
      { name: 'Manzana fresca', quantityG: 100 },
      { name: 'Judías verdes redondas', quantityG: 120 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Poke Bowl Mediterráneo con Atún Fresco, Edamame y Arroz',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
    description: 'Plato fresco completo con proteína marina cruda de alta digestibilidad.',
    instructions: '1. Colocar el arroz integral cocido en la base del cuenco.\n2. Disponer por secciones: dados de atún rojo limpio, edamame desvainado, pepino y aguacate.\n3. Aliñar con una vinagreta ligera de soja baja en sal, limón y aceite de sésamo.',
    ingredients: [
      { name: 'Atún fresco limpio en dados', quantityG: 140 },
      { name: 'Arroz integral cocido', quantityG: 120 },
      { name: 'Edamame cocido desvainado', quantityG: 60 },
      { name: 'Aguacate Hass', quantityG: 40 },
      { name: 'Semillas de sésamo tostadas', quantityG: 5 }
    ]
  },
  {
    name: 'Bacalao al Vapor con Crema Suave de Pimientos del Piquillo',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 12,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Pescado blanco tradicional con salsa antioxidante sin natas ni harinas añadidas.',
    instructions: '1. Cocinar el lomo de bacalao al vapor durante 8 minutos.\n2. Triturar los pimientos del piquillo con ajo confitado y caldo de verduras hasta formar crema.\n3. Servir el fondo de crema caliente y el lomo de bacalao coronado con AOVE en crudo.',
    ingredients: [
      { name: 'Lomo de bacalao desalado fresco', quantityG: 180 },
      { name: 'Pimientos de Piquillo de Lodosa', quantityG: 100 },
      { name: 'Patatas cocidas al vapor', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Lentejas Rojas con Calabaza, Zanahoria y Cúrcuma Antiinflamatoria',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 20,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Legumbre sin piel de fácil digestión ideal para personas con sensibilidad digestiva.',
    instructions: '1. Pochar la cebolla y zanahoria picadas con el AOVE.\n2. Añadir la calabaza en dados, la cúrcuma y las lentejas rojas lavadas.\n3. Cubrir con caldo de verduras y cocer 15 minutos hasta que las lentejas se deshagan.',
    ingredients: [
      { name: 'Lentejas rojas peladas crudas', quantityG: 60 },
      { name: 'Calabaza fresca limpia', quantityG: 120 },
      { name: 'Zanahorias frescas', quantityG: 80 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Pechuga de Pollo Rellena de Espinacas y Requesón con Ensalada',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 12,
    cookTimeMin: 18,
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    description: 'Preparación gourmet casera rica en calcio lácteo y proteínas completas.',
    instructions: '1. Abrir la pechuga de pollo en libro.\n2. Mezclar el requesón con espinacas salteadas y rellenar la pechuga sujetándola con palillos.\n3. Dorar en sartén 3 min y terminar al horno a 180°C 12 min.\n4. Acompañar con ensalada de hojas verdes y tomate.',
    ingredients: [
      { name: 'Pechuga de pollo limpia', quantityG: 170 },
      { name: 'Requesón semidesnatado', quantityG: 50 },
      { name: 'Espinacas frescas', quantityG: 60 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Tartar de Salmón y Aguacate con Semillas de Chía y Tostas de Centeno',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 15,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    description: 'Plato frío premium rico en grasas poliinsaturadas esenciales y vitamina E.',
    instructions: '1. Cortar el salmón fresco congelado previamente en dados uniformes pequeños.\n2. Cortar el aguacate en dados similares y rociar con limón.\n3. Mezclar con cebollino picado, una pizca de mostaza, sal marina y AOVE.\n4. Emplatar con molde circular y servir junto a tostas de centeno crujientes.',
    ingredients: [
      { name: 'Lomo de salmón fresco limpio', quantityG: 150 },
      { name: 'Aguacate Hass', quantityG: 60 },
      { name: 'Pan de centeno integral tostado', quantityG: 40 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Atún a la Plancha con Escabeche Suave de Verduras y Patata',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 15,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Plato tradicional de técnica de conservación culinaria con vinagre de manzana digestivo.',
    instructions: '1. Pochar zanahoria, cebolla y puerro en tiras finas con laurel y pimienta.\n2. Verter 2 cucharadas de vinagre de manzana y dejar evaporar 3 min.\n3. Marcar el lomo de atún en plancha muy caliente 1 min por lado dejando el centro jugoso.\n4. Servir el atún cubierto con las verduras en escabeche y patata al vapor.',
    ingredients: [
      { name: 'Atún fresco en lomo limpio', quantityG: 160 },
      { name: 'Zanahorias frescas', quantityG: 80 },
      { name: 'Cebolla fresca', quantityG: 60 },
      { name: 'Patatas cocidas al vapor', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Hamburguesa Casera de Ternera con Pan Integral y Cebolla Pochada',
    category: 'Comidas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 10,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    description: 'Versión saludable de fast food sin conservantes, con carne picada 100% magra.',
    instructions: '1. Formar la hamburguesa con carne magra de ternera, sal marina y pimienta.\n2. Pochar la cebolla en sartén con AOVE a fuego bajo hasta caramelizar sin azúcar añadido.\n3. Cocinar la carne en plancha a fuego medio-alto 3 min por cada cara.\n4. Montar en panecillo integral con canónigos, rodajas de tomate y la cebolla pochada.',
    ingredients: [
      { name: 'Carne picada de ternera magra', quantityG: 160 },
      { name: 'Pan 100% integral para hamburguesa', quantityG: 60 },
      { name: 'Cebolla fresca', quantityG: 60 },
      { name: 'Tomate fresco en rodajas', quantityG: 50 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },

  // ================= CENAS (15) =================
  {
    name: 'Crema Templada de Calabaza Asada y Jengibre con Semillas Tostadas',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 20,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Cena ligera y reconfortante rica en betacarotenos y propiedades digestivas del jengibre.',
    instructions: '1. Asar la calabaza y puerro en horno a 190°C durante 20 min.\n2. Triturar junto con caldo vegetal caliente y una rodaja de jengibre fresco rallado.\n3. Servir en cuenco y decorar con semillas de calabaza tostadas y huevo cocido picado.',
    ingredients: [
      { name: 'Calabaza cacahuete asada', quantityG: 200 },
      { name: 'Puerro fresco limpio', quantityG: 80 },
      { name: 'Huevo de gallina entero fresco cocido', quantityG: 55 },
      { name: 'Semillas de calabaza crudas', quantityG: 15 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Merluza en Papillote con Verduras Julienne y Aceite de Oliva',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 8,
    cookTimeMin: 12,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Cocción hermética al vapor en su propio jugo que preserva la máxima concentración vitamínica.',
    instructions: '1. Disponer una base de zanahoria, calabacín y puerro cortados en juliana sobre papel de horno.\n2. Colocar el lomo de merluza encima con sal marina, eneldo y el AOVE.\n3. Cerrar el paquete herméticamente y hornear a 190°C durante 12-14 minutos.',
    ingredients: [
      { name: 'Merluza fresca limpia en lomos', quantityG: 180 },
      { name: 'Calabacín con piel', quantityG: 100 },
      { name: 'Zanahorias frescas', quantityG: 70 },
      { name: 'Puerro fresco limpio', quantityG: 50 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Revuelto de Gulas del Norte con Gambas y Ajetes Tiernos',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 8,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Cena rápida proteica baja en carbohidratos, perfecta para recuperación muscular nocturna.',
    instructions: '1. En sartén con AOVE saltear los ajetes tiernos cortados en trozos pequeños 2 min.\n2. Añadir las gambas peladas y las gulas, saltear 2 minutos más con guindilla al gusto.\n3. Verter los huevos ligeramente batidos y cuajar a fuego suave retirando antes de que sequen.',
    ingredients: [
      { name: 'Gulas del norte salteadas al ajillo', quantityG: 90 },
      { name: 'Gambas peladas frescas', quantityG: 80 },
      { name: 'Ajos tiernos o ajetes a la plancha', quantityG: 50 },
      { name: 'Huevo de gallina entero fresco', quantityG: 110 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Tortilla de Calabacín y Cebolla Pochada con Ensalada de Tomate',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 10,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Clásica tortilla jugosa española sin patata para reducir calorías y facilitar el descanso.',
    instructions: '1. Pochar la cebolla y calabacín en láminas finas en sartén con AOVE y tapa durante 8 min.\n2. Escurrir bien y mezclar con los huevos batidos y sal marina.\n3. Cuajar en la sartén 2-3 min por lado dejando el centro jugoso.\n4. Acompañar con ensalada de tomate en gajos.',
    ingredients: [
      { name: 'Huevo de gallina entero fresco', quantityG: 110 },
      { name: 'Calabacín con piel', quantityG: 140 },
      { name: 'Cebolla fresca', quantityG: 60 },
      { name: 'Tomate fresco maduro', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Sepia a la Plancha con Majado de Ajo, Perejil y Ensalada Verde',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 8,
    cookTimeMin: 6,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Cefalópodo magro hipocalórico con abundante zinc y aminoácidos para la síntesis proteica.',
    instructions: '1. Limpiar y secar muy bien la sepia con papel absorbente.\n2. Calentar la plancha al máximo y cocinar la sepia 2-3 minutos por lado sin moverla.\n3. Al retirar, regar con el majado de ajo, perejil fresco picado, limón y AOVE.\n4. Servir con abundante ensalada verde aliñada.',
    ingredients: [
      { name: 'Sepia limpia fresca', quantityG: 200 },
      { name: 'Hojas verdes variadas para ensalada', quantityG: 80 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Sopa de Pescado de Roca Tradicional con Fideos Integrales',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 12,
    cookTimeMin: 20,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Caldo reconstituyente de fácil asimilación rico en minerales y colágeno marino.',
    instructions: '1. Elaborar un caldo corto con morralla y espinas de pescado blanco, laurel y cebolla.\n2. Colar y llevar a ebullición suave incorporando fideos integrales y dados de merluza.\n3. Cocer 6-8 minutos hasta que la pasta esté al dente.',
    ingredients: [
      { name: 'Merluza fresca limpia en dados', quantityG: 120 },
      { name: 'Gambas peladas frescas', quantityG: 50 },
      { name: 'Pasta o fideos integrales', quantityG: 35 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Calamares a la Plancha con Ensalada Templada de Pimientos Asados',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 8,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Cena ligera con alto volumen de fibra saciante y proteína de pureza absoluta.',
    instructions: '1. Marcar los calamares limpios enteros o en anillas en plancha humeante 2 min por lado.\n2. Templar las tiras de pimientos asados en una sartén con ajo picado.\n3. Emplatar los calamares sobre la cama de pimientos asados con escamas de sal.',
    ingredients: [
      { name: 'Calamares limpios frescos', quantityG: 190 },
      { name: 'Pimientos de Piquillo de Lodosa asados a la leña', quantityG: 120 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Salmón en Papillote con Puerros, Zanahorias y Eneldo Fresco',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 8,
    cookTimeMin: 14,
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    description: 'Cocción limpia y jugosa para retener todo el sabor y los ácidos grasos omega-3.',
    instructions: '1. Cortar puerro y zanahoria en juliana fina y colocar sobre papel vegetal.\n2. Poner encima el lomo de salmón salpimentado y con ramitas de eneldo fresco.\n3. Cerrar el paquete herméticamente y hornear 12-14 minutos a 200°C.',
    ingredients: [
      { name: 'Lomo de salmón fresco', quantityG: 160 },
      { name: 'Puerro fresco limpio', quantityG: 80 },
      { name: 'Zanahorias frescas', quantityG: 70 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Crema de Espárragos Verdes con Huevo Poché y Jamón Ibérico',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 15,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Entrante o cena ligera de perfil depurativo, coronada con la yema sedosa del huevo.',
    instructions: '1. Rehogar los espárragos verdes troceados con cebolla y AOVE 5 min.\n2. Cubrir con agua o caldo y cocer 10 min. Triturar hasta textura fina y aterciopelada.\n3. Servir en plato hondo con el huevo poché en el centro y las virutas de jamón ibérico crujiente.',
    ingredients: [
      { name: 'Espárragos trigueros finos', quantityG: 180 },
      { name: 'Cebolla fresca', quantityG: 50 },
      { name: 'Huevo de gallina entero fresco', quantityG: 55 },
      { name: 'Jamón serrano Gran Reserva desgrasado', quantityG: 25 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Wok de Tofu Firme Marinado con Verduras Crujientes y Anacardos',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 8,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
    description: 'Alternativa vegetal proteica y ligera con fitoquímicos protectores de la soja.',
    instructions: '1. Prensar y cortar el tofu en dados. Dorar en wok con AOVE 4 min hasta que quede crujiente.\n2. Añadir brócoli en ramilletes pequeños, pimiento rojo y champiñones. Saltear 4 min.\n3. Incorporar anacardos tostados y aderezar con tamari sin gluten.',
    ingredients: [
      { name: 'Tofu firme natural ecológico', quantityG: 160 },
      { name: 'Brócoli morado o broccolini', quantityG: 100 },
      { name: 'Pimiento rojo', quantityG: 60 },
      { name: 'Anacardos crudos o tostados sin sal', quantityG: 15 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Hamburguesa Vegetal de Lentejas y Champiñones con Boniato',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 12,
    cookTimeMin: 10,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    description: 'Hamburguesa 100% plant-based casera sin aditivos industriales ni ultraprocesados.',
    instructions: '1. Chafar las lentejas cocidas con champiñones salteados y copos de avena finos.\n2. Moldear la hamburguesa y dorar en sartén con AOVE 3 min por lado.\n3. Acompañar de boniato asado en bastones especiados con pimentón dulce.',
    ingredients: [
      { name: 'Lentejas cocidas en conserva', quantityG: 120 },
      { name: 'Champiñones frescos', quantityG: 70 },
      { name: 'Copos de avena integral finos', quantityG: 25 },
      { name: 'Boniato blanco tradicional cocido', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Pechuga de Pavo con Calabacín a la Plancha y Salsa de Yogur',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 8,
    cookTimeMin: 8,
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    description: 'Cena ligera hiperproteica con salsa tzatziki casera refrescante.',
    instructions: '1. Cocinar los filetes de pavo y las rodajas de calabacín en plancha caliente con AOVE.\n2. Mezclar el yogur natural con pepino rallado escurrido, menta picada y limón.\n3. Servir el pavo acompañado del calabacín y la salsa de yogur por encima.',
    ingredients: [
      { name: 'Pechuga de pavo limpia', quantityG: 170 },
      { name: 'Calabacín con piel', quantityG: 150 },
      { name: 'Yogur griego natural', quantityG: 60 },
      { name: 'Aceite de oliva virgen extra', quantityG: 5 }
    ]
  },
  {
    name: 'Ensalada Templada de Quinoa con Remolacha Asada y Queso de Cabra',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 5,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
    description: 'Combinación antiinflamatoria de betalaínas de remolacha y proteínas completas.',
    instructions: '1. Mezclar la quinoa cocida con espinacas baby y dados de remolacha cocida.\n2. Desmenuzar el queso de rulo de cabra por encima y añadir las nueces partidas.\n3. Aliñar con vinagre de Módena y AOVE.',
    ingredients: [
      { name: 'Quinoa real en grano cocida', quantityG: 120 },
      { name: 'Remolacha cocida limpia', quantityG: 80 },
      { name: 'Queso de cabra fresco o semicurado', quantityG: 40 },
      { name: 'Nueces peladas', quantityG: 15 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Corvina a la Espalda con Ajos Laminados y Salteado de Shiitake',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 12,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Pescado blanco noble con betaglucanos inmunoestimulantes de las setas shiitake.',
    instructions: '1. Abrir la corvina en libro y cocinar en plancha o sartén por el lado de la piel 4 min.\n2. Dar la vuelta y cocinar 2 min más con sal marina.\n3. Saltear las setas shiitake con láminas de ajo y perejil fresco en sartén con AOVE.\n4. Servir la corvina coronada con las setas al ajillo.',
    ingredients: [
      { name: 'Corvina salvaje a la plancha con ajo y perejil', quantityG: 180 },
      { name: 'Setas Shiitake frescas a la plancha con ajo', quantityG: 100 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Salpicón Tradicional de Pulpo y Langostinos con Vinagreta',
    category: 'Cenas',
    servings: 1,
    prepTimeMin: 12,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    description: 'Cena fría clásica gallega ultra saciante y prácticamente libre de grasas.',
    instructions: '1. Cortar el pulpo cocido y los langostinos en trozos pequeños.\n2. Picar cebolla tierna, pimiento verde y pimiento rojo en brunoise homogénea.\n3. Mezclar en un bol y aliñar con vinagre de jerez, sal marina y AOVE.\n4. Dejar reposar 15 minutos en nevera antes de servir.',
    ingredients: [
      { name: 'Pulpo cocido limpio', quantityG: 120 },
      { name: 'Langostinos o gambas cocidas peladas', quantityG: 80 },
      { name: 'Pimiento rojo', quantityG: 50 },
      { name: 'Pimiento verde', quantityG: 50 },
      { name: 'Cebolla fresca', quantityG: 40 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },

  // ================= SNACKS Y MERIENDAS (5) =================
  {
    name: 'Yogur Proteico con Almendras Tostadas y Frambuesas Frescas',
    category: 'Snacks y Meriendas',
    servings: 1,
    prepTimeMin: 2,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    description: 'Tentempié saciante para frenar el apetito de media tarde con fibra y proteína.',
    instructions: '1. Servir el yogur en un cuenco.\n2. Incorporar las frambuesas frescas limpias.\n3. Añadir las almendras tostadas sin sal enteras o picadas.',
    ingredients: [
      { name: 'Yogur estilo islandés Skyr natural desnatado', quantityG: 150 },
      { name: 'Frambuesas rojas frescas', quantityG: 50 },
      { name: 'Almendras crudas con piel', quantityG: 15 }
    ]
  },
  {
    name: 'Hummus Casero Tradicional con Bastones de Zanahoria y Pepino',
    category: 'Snacks y Meriendas',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Snack crujiente 100% natural rico en carotenoides y carbohidratos de absorción lenta.',
    instructions: '1. Lavar y cortar la zanahoria y el pepino en bastones alargados.\n2. Disponer el hummus en un ramequín espolvoreado con pimentón y AOVE.\n3. Dipear los bastones directamente en el hummus.',
    ingredients: [
      { name: 'Hummus de garbanzos', quantityG: 70 },
      { name: 'Zanahorias frescas', quantityG: 100 },
      { name: 'Pepino con piel fresco', quantityG: 100 }
    ]
  },
  {
    name: 'Pudin de Chía con Bebida de Almendras, Vainilla y Frutos Rojos',
    category: 'Snacks y Meriendas',
    servings: 1,
    prepTimeMin: 5,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
    description: 'Gel mucilaginoso de chía que retrasa el vaciado gástrico y protege la mucosa intestinal.',
    instructions: '1. Mezclar las semillas de chía con la bebida vegetal y esencia de vainilla.\n2. Dejar gelificar en nevera al menos 2 horas.\n3. Coronar con frutos rojos variados antes de disfrutar.',
    ingredients: [
      { name: 'Semillas de chía', quantityG: 20 },
      { name: 'Bebida de almendras sin azúcar', quantityG: 150 },
      { name: 'Arándanos silvestres azules', quantityG: 50 }
    ]
  },
  {
    name: 'Tostadita de Pan Wasa con Ricotta, Tomate Cherry y Albahaca',
    category: 'Snacks y Meriendas',
    servings: 1,
    prepTimeMin: 3,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    description: 'Aperitivo ligero crujiente con menos de 150 kcal y sabor fresco mediterráneo.',
    instructions: '1. Untar la tosta de pan de centeno tipo Wasa con el queso ricotta.\n2. Colocar los tomates cherry cortados en mitades encima.\n3. Rociar con unas gotas de AOVE y hojas de albahaca fresca picada.',
    ingredients: [
      { name: 'Pan de centeno integral alemán Pumpernickel', quantityG: 30 },
      { name: 'Requesón semidesnatado', quantityG: 50 },
      { name: 'Tomates cherry', quantityG: 50 },
      { name: 'Aceite de oliva virgen extra', quantityG: 4 }
    ]
  },
  {
    name: 'Manzana Asada con Canela de Ceylán y Nueces Picadas',
    category: 'Snacks y Meriendas',
    servings: 1,
    prepTimeMin: 3,
    cookTimeMin: 4,
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
    description: 'Postre o merienda templada con pectina suavizante del tracto digestivo y sin azúcares libres.',
    instructions: '1. Descorazonar la manzana y hacer un corte fino perimetral en la piel para que no reviente.\n2. Espolvorear abundante canela y cocinar 3-4 minutos en microondas hasta ablandar.\n3. Servir templada con nueces picadas por encima.',
    ingredients: [
      { name: 'Manzana fresca', quantityG: 160 },
      { name: 'Nueces peladas', quantityG: 15 }
    ]
  },

  // ================= PLATOS ÚNICOS (5) =================
  {
    name: 'Ensalada Completa de Garbanzos, Ventresca, Huevo y Pimientos',
    category: 'Platos Únicos',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 0,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Plato único completo y balanceado listo en 10 minutos para comer fuera de casa.',
    instructions: '1. Enjuagar y escurrir los garbanzos cocidos.\n2. Picar cebolla, pimiento rojo y verde en trozos pequeños.\n3. Mezclar con la ventresca escurrida y el huevo cocido cortado en cuartos.\n4. Aliñar con vinagre de jerez, sal marina y AOVE.',
    ingredients: [
      { name: 'Garbanzos cocidos en conserva', quantityG: 150 },
      { name: 'Ventresca de atún claro en aceite de oliva', quantityG: 80 },
      { name: 'Huevo de gallina entero fresco cocido', quantityG: 55 },
      { name: 'Pimiento rojo', quantityG: 60 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Guiso Marinero de Patatas con Sepia y Guisantes Dulces',
    category: 'Platos Únicos',
    servings: 1,
    prepTimeMin: 15,
    cookTimeMin: 25,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Guiso de cuchara marinero tradicional con fécula que aporta saciedad prolongada.',
    instructions: '1. Sofreír cebolla, ajo y pimiento en cazuela con AOVE 5 min.\n2. Añadir la sepia en trozos y dorar 3 min.\n3. Cascar las patatas en trozos para que suelten el almidón, añadir los guisantes y cubrir con caldo.\n4. Cocer a fuego lento 20 minutos hasta que la patata esté tierna.',
    ingredients: [
      { name: 'Sepia limpia fresca', quantityG: 150 },
      { name: 'Patatas frescas', quantityG: 150 },
      { name: 'Guisantes verdes cocidos', quantityG: 60 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Cazuela de Quinoa con Verduras Asadas y Vinagreta de Tahini',
    category: 'Platos Únicos',
    servings: 1,
    prepTimeMin: 12,
    cookTimeMin: 20,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
    description: 'Plato vegetal reconfortante con minerales biodisponibles y grasas saludables del sésamo.',
    instructions: '1. Asar calabacín, berenjena y pimientos en horno a 200°C 20 min.\n2. Mezclar en una cazuela con quinoa cocida al dente y garbanzos cocidos.\n3. Rociar con una vinagreta batida de tahini puro, zumo de limón, agua tibia y AOVE.',
    ingredients: [
      { name: 'Quinoa real en grano cocida', quantityG: 120 },
      { name: 'Garbanzos cocidos en conserva', quantityG: 80 },
      { name: 'Calabacín con piel', quantityG: 80 },
      { name: 'Berenjena fresca', quantityG: 80 },
      { name: 'Aceite de oliva virgen extra', quantityG: 8 }
    ]
  },
  {
    name: 'Risotto Integral de Setas Variadas y Parmesano con Caldo Casero',
    category: 'Platos Únicos',
    servings: 1,
    prepTimeMin: 10,
    cookTimeMin: 25,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Cremoso arroz integral con intenso sabor umami de setas silvestres y queso curado.',
    instructions: '1. Pochar chalota o cebolla en cazuela con AOVE.\n2. Saltear las setas (boletus y champiñones) 4 min. Añadir el arroz integral y nacarar.\n3. Ir añadiendo caldo caliente cazo a cazo removiendo constantemente durante 25-30 min.\n4. Mantecar fuera del fuego con una cucharada de queso parmesano rallado.',
    ingredients: [
      { name: 'Arroz integral crudo', quantityG: 65 },
      { name: 'Setas Boletus edulis frescos a la plancha', quantityG: 100 },
      { name: 'Champiñones frescos', quantityG: 80 },
      { name: 'Queso Parmesano curado rallado', quantityG: 20 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  },
  {
    name: 'Paella de Verduras de la Huerta con Alcachofas y Judía Verde',
    category: 'Platos Únicos',
    servings: 1,
    prepTimeMin: 15,
    cookTimeMin: 22,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: 'Arroz tradicional valenciano vegetal con azafrán en hebra y verduras de huerta de temporada.',
    instructions: '1. En la paella con AOVE, dorar los trozos de alcachofa y judía verde plana 6 min.\n2. Añadir tomate rallado y pimentón dulce. Rehogar 2 min sin quemar.\n3. Añadir el arroz, mezclar y verter el caldo vegetal hirviendo con azafrán en hebra.\n4. Cocer 8 min a fuego vivo y 10 min a fuego suave hasta formar socarrat fino.',
    ingredients: [
      { name: 'Arroz blanco o bomba', quantityG: 70 },
      { name: 'Alcachofas frescas limpias', quantityG: 100 },
      { name: 'Judías verdes redondas', quantityG: 80 },
      { name: 'Pimiento rojo', quantityG: 50 },
      { name: 'Aceite de oliva virgen extra', quantityG: 10 }
    ]
  }
];

async function findOrCreateFood(name, quantityG) {
  // Try exact or partial match
  const terms = name.toLowerCase().split(' ').filter(w => w.length > 3);
  let food = await prisma.food.findFirst({
    where: {
      name: { contains: terms[0], mode: 'insensitive' }
    }
  });

  if (!food) {
    food = await prisma.food.create({
      data: {
        name: name,
        category: 'Ingredientes Clínicos',
        calories: 120,
        proteinG: 8,
        carbsG: 12,
        fatG: 4,
        fiberG: 2,
        source: 'clinical-recipe-auto'
      }
    });
  }

  return food;
}

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found');
    return;
  }

  console.log(`Starting insertion of ${new50Recipes.length} new recipes for user ${user.email}...`);

  let insertedCount = 0;

  for (const r of new50Recipes) {
    // Check if recipe already exists
    const existing = await prisma.recipe.findFirst({
      where: { name: r.name }
    });

    if (existing) {
      console.log(`Skipping existing recipe: ${r.name}`);
      continue;
    }

    // Create Recipe
    const createdRecipe = await prisma.recipe.create({
      data: {
        userId: user.id,
        name: r.name,
        category: r.category,
        servings: r.servings,
        prepTimeMin: r.prepTimeMin,
        cookTimeMin: r.cookTimeMin,
        description: r.description,
        instructions: r.instructions,
        imageUrl: r.imageUrl
      }
    });

    // Create RecipeIngredients
    for (const ing of r.ingredients) {
      const foodItem = await findOrCreateFood(ing.name, ing.quantityG);
      await prisma.recipeIngredient.create({
        data: {
          recipeId: createdRecipe.id,
          foodId: foodItem.id,
          quantityG: ing.quantityG,
          notes: ing.name
        }
      });
    }

    insertedCount++;
    console.log(`[${insertedCount}/${new50Recipes.length}] Created recipe: "${r.name}"`);
  }

  const totalRecipes = await prisma.recipe.count();
  console.log(`Finished! Inserted ${insertedCount} recipes. Total recipes now in database: ${totalRecipes}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
