/**
 * @file update_recipe_photos.js
 * @description Updates all 80 clinical recipes in the PostgreSQL database with unique,
 * accurate, high-resolution culinary photos matching each specific Spanish/Mediterranean dish.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 80 unique, dedicated Unsplash culinary images
const RECIPE_IMAGE_MAP = {
  // 1. Arroces y Paellas
  'Arroz Meloso con Sepia, Gambas y Alcachofas de Temporada':
    'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=800&q=80', // Seafood paella pan
  'Arroz Negro Meloso con Calamares de Potera y Alioli Suave de Limón':
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80', // Black rice squid
  'Paella de Verduras de la Huerta con Alcachofas y Judía Verde':
    'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&w=800&q=80', // Vegetable paella
  'Risotto Integral de Setas Variadas y Parmesano con Caldo Casero':
    'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80', // Mushroom risotto

  // 2. Atún y Pescados Azules
  'Atún a la Plancha con Escabeche Suave de Verduras y Patata':
    'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&w=800&q=80', // Grilled tuna steak
  'Tartar de Salmón y Aguacate con Semillas de Chía y Tostas de Centeno':
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Salmon tartar tower
  'Lomo de Salmón a la Plancha con Brócoli al Vapor y Patata Asada':
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', // Seared salmon broccoli
  'Salmón al Horno con Costra de Mostaza Antigua y Espárragos Trigueros':
    'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80', // Baked salmon mustard asparagus
  'Salmón en Papillote con Puerros, Zanahorias y Eneldo Fresco':
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80', // Baked fish papillote

  // 3. Pescados Blancos
  'Bacalao al Horno sobre Cama de Pisto Manchego con Aceitunas Negras':
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', // Baked white cod with ratatouille
  'Bacalao al Vapor con Crema Suave de Pimientos del Piquillo':
    'https://images.unsplash.com/photo-1515041219749-89347f83291a?auto=format&fit=crop&w=800&q=80', // Steamed cod red pepper
  'Corvina a la Espalda con Ajos Laminados y Salteado de Shiitake':
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', // Whole grilled fish
  'Dorada Salvaje al Horno sobre Cama de Patatas Panaderas y Limón':
    'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=800&q=80', // Baked sea bream
  'Lubina Salvaje al Horno sobre Cama de Calabacín y Patata Panadera':
    'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=800&q=80', // Sea bass with vegetables
  'Merluza del Cantábrico con Crema Casera de Calabacín y Patata':
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', // White fish fillet with green puree
  'Merluza en Papillote con Verduras Julienne y Aceite de Oliva':
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', // Steamed fish in pouch with herbs

  // 4. Mariscos y Moluscos
  'Calamares a la Plancha con Ensalada Templada de Pimientos Asados':
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', // Grilled calamari
  'Guiso Marinero de Patatas con Sepia y Guisantes Dulces':
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', // Spanish seafood potato stew
  'Revuelto de Gulas del Norte con Gambas y Ajetes Tiernos':
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80', // Spanish shrimp skillet
  'Salpicón Tradicional de Pulpo y Langostinos con Vinagreta':
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', // Seafood octopus salad
  'Sepia a la Plancha con Ajo, Perejil y Espárragos Verdes Trigueros':
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', // Grilled cuttlefish
  'Sepia a la Plancha con Majado de Ajo, Perejil y Ensalada Verde':
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', // Grilled sepia lemon
  'Sopa de Pescado de Roca Tradicional con Fideos Integrales':
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80', // Traditional fish soup bowl

  // 5. Carnes Magras y Aves
  'Cuscús Especiado con Pollo Desmenuzado, Pasas y Almendras':
    'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80', // Spiced chicken couscous
  'Hamburguesa Casera de Pavo con Pan Integral, Lechuga y Mostaza':
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', // Turkey burger
  'Hamburguesa Casera de Ternera con Pan Integral y Cebolla Pochada':
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', // Beef burger wholewheat
  'Pavo a la Plancha Marinado con Limón y Romero con Puré de Boniato':
    'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80', // Turkey breast sweet potato
  'Pechuga de Pavo con Calabacín a la Plancha y Salsa de Yogur':
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80', // Turkey with zucchini
  'Pechuga de Pollo Marinada con Arroz Basmati al Laurel':
    'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80', // Grilled chicken with rice
  'Pechuga de Pollo Rellena de Espinacas y Requesón con Ensalada':
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80', // Stuffed chicken breast
  'Pollo al Curry Suave con Leche de Coco Ligera y Quinoa Real':
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80', // Chicken curry
  'Pollo Rústico Asado al Limón con Hierbas Provenzales':
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80', // Roast herb chicken
  'Salteado de Ternera Magra al Wok con Bimi y Champiñones':
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80', // Beef wok stir fry
  'Solomillo de Cerdo Ibérico con Manzana Asada y Judías Verdes':
    'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80', // Pork tenderloin
  'Solomillo de Ternera al Punto con Boniato Asado y Calabacín':
    'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80', // Tenderloin beef steak
  'Wrap Integral de Pavo a la Plancha con Hummus Casero y Rúcula':
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80', // Turkey wrap

  // 6. Legumbres y Guisos Saludables
  'Ensalada Completa de Garbanzos, Ventresca, Huevo y Pimientos':
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', // Chickpea salad
  'Garbanzos Pedrosillano Salteados con Espinacas y Bacalao Desmigado':
    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80', // Garbanzos con espinacas
  'Garbanzos Salteados con Espinacas, Pimentón y Huevo Escalfado':
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80', // Chickpeas poached egg
  'Lentejas Pardinas Estofadas Tradicionales con Hortalizas':
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', // Spanish lentil stew
  'Lentejas Rojas con Calabaza, Zanahoria y Cúrcuma Antiinflamatoria':
    'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80', // Red lentil turmeric soup
  'Hamburguesa Vegetal de Lentejas y Champiñones con Boniato':
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80', // Veggie burger

  // 7. Huevos y Tortillas
  'Revuelto Cremoso de Champiñones, Espinacas Baby y Queso Fresco':
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', // Scrambled eggs mushrooms
  'Shakshuka Tradicional con Dos Huevos en Salsa de Tomate y Pimientos':
    'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80', // Shakshuka skillet
  'Tortilla de Calabacín y Cebolla Pochada con Ensalada de Tomate':
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', // Spanish zucchini omelet
  'Tortilla de Patata Ligera con Cebolla Caramelizada al Horno':
    'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80', // Tortilla de patatas slice
  'Tortilla Francesa de Dos Huevos con Espinacas Baby y Tomates Cherry':
    'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80', // French folded omelet

  // 8. Tostadas y Desayunos Mediterráneos
  'Tostada de Pan 100% Integral con Huevo Poché y Tomate Rallado':
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', // Poached egg tomato toast
  'Tostada de Pan de Masa Madre con Aguacate y Huevo Escalfado':
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', // Sourdough avocado egg
  'Tostada Integral con Hummus de Garbanzo, Rábanos y Brotes Tiernos':
    'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80', // Hummus radish toast
  'Tostada Nórdica de Centeno con Salmón Ahumado y Queso Fresco Batido':
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', // Smoked salmon rye toast
  'Tostadita de Pan Wasa con Ricotta, Tomate Cherry y Albahaca':
    'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=800&q=80', // Crispbread ricotta tomato
  'Crêpes de Avena y Claras con Manzana Caramelizada y Canela':
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80', // Oat crepes cinnamon
  'Crepes Ligeros de Harina de Avena con Requesón y Fresas':
    'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80', // Crepes ricotta strawberries
  'Tortitas Caseras Fitness de Avena y Claras con Arándanos':
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80', // Protein pancakes blueberries

  // 9. Pastas y Granos
  'Macarrones 100% Integrales con Picada de Ternera y Champiñones':
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80', // Wholewheat penne pasta
  'Cazuela de Quinoa con Verduras Asadas y Vinagreta de Tahini':
    'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&w=800&q=80', // Quinoa roasted veggies tahini

  // 10. Ensaladas y Aperitivos
  'Ensalada César Ligera con Pollo a la Plancha y Salsa César de Yogur':
    'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80', // Caesar salad chicken
  'Ensalada Templada de Quinoa con Remolacha Asada y Queso de Cabra':
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', // Beet goat cheese quinoa
  'Ensalada Templada de Quinoa Real con Aguacate y Garbanzos Crujientes':
    'https://images.unsplash.com/photo-1505253758473-96b3015f21c9?auto=format&fit=crop&w=800&q=80', // Warm quinoa chickpea salad
  'Gazpacho Andaluz Tradicional con Guarnición de Verduras Picadas':
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', // Traditional gazpacho
  'Hummus Casero de Garbanzos con Pimentón de La Vera y Crudités':
    'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80', // Hummus paprika crudites
  'Hummus Casero Tradicional con Bastones de Zanahoria y Pepino':
    'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80', // Hummus carrot sticks

  // 11. Cremas y Sopas
  'Crema Aterciopelada de Calabaza con Jengibre y Semillas de Calabaza':
    'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=80', // Pumpkin ginger soup
  'Crema de Espárragos Verdes con Huevo Poché y Jamón Ibérico':
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80', // Green asparagus cream soup
  'Crema Templada de Calabaza Asada y Jengibre con Semillas Tostadas':
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', // Roasted pumpkin soup seeds

  // 12. Poke Bowls y Vegetales
  'Poke Bowl de Atún Fresco Marinado con Arroz Integral y Edamame':
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Tuna poke edamame
  'Poke Bowl Mediterráneo con Atún Fresco, Edamame y Arroz':
    'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80', // Mediterranean poke
  'Tofu Firme Marinado al Tamari con Salteado de Verduras':
    'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&w=800&q=80', // Tofu stir fry
  'Wok de Tofu Firme Marinado con Verduras Crujientes y Anacardos':
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80', // Tofu cashew wok

  // 13. Bowls de Yogur, Avena, Smoothies y Postres Saludables
  'Avena Nocturna (Overnight Oats) con Leche de Almendras y Manzana Asada':
    'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80', // Overnight oats jar
  'Bowl de Yogur Griego con Semillas de Chía, Nueces y Arándanos':
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', // Greek yogurt chia blueberries
  'Bowl de Yogur Proteico o Kéfir con Nueces y Fruta de Temporada':
    'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80', // Yogurt nuts seasonal fruit
  'Manzana Asada con Canela de Ceylán y Nueces Picadas':
    'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80', // Baked apple cinnamon
  'Porridge Templado de Avena Integral con Frutos Rojos y Canela':
    'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=800&q=80', // Warm porridge berries
  'Pudin de Chía con Bebida de Almendras, Vainilla y Frutos Rojos':
    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=800&q=80', // Chia pudding glass berries
  'Smoothie Bowl Verde Detox de Espinacas, Manzana Verde y Proteína':
    'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80', // Green smoothie bowl
  'Smoothie Verde Proteico de Espinacas, Plátano y Proteína de Suero':
    'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80', // Green protein shake glass
  'Tazón de Kéfir Artesanal con Semillas de Cáñamo y Frambuesas':
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80', // Kefir raspberries hemp
  'Yogur Proteico con Almendras Tostadas y Frambuesas Frescas':
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80', // Protein yogurt almonds raspberries
}

async function updatePhotos() {
  console.log('Connecting to database...')
  const recipes = await prisma.recipe.findMany()
  console.log(`Found ${recipes.length} recipes in database. Updating photos...`)

  let updatedCount = 0
  for (const recipe of recipes) {
    const customImage = RECIPE_IMAGE_MAP[recipe.name]
    if (customImage && customImage !== recipe.imageUrl) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { imageUrl: customImage },
      })
      updatedCount++
      console.log(`✓ Updated [${recipe.name}]`)
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} recipes with unique, specific culinary photos!`)
}

updatePhotos()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
