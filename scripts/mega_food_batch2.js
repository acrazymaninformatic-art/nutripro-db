const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Massive catalog part 2: Spanish staples, regional dishes, clinical foods, specialized products
const foodStaples = [
  // Hortalizas y ensaladas
  { name: 'Canónigos frescos seleccionados', category: 'Verduras y Hortalizas', calories: 14, proteinG: 2.0, carbsG: 0.8, fatG: 0.4, fiberG: 1.5 },
  { name: 'Escarola rizada fresca', category: 'Verduras y Hortalizas', calories: 17, proteinG: 1.2, carbsG: 2.5, fatG: 0.2, fiberG: 2.8 },
  { name: 'Endibias frescas crujientes', category: 'Verduras y Hortalizas', calories: 17, proteinG: 1.3, carbsG: 2.3, fatG: 0.2, fiberG: 3.1 },
  { name: 'Radicchio o achicoria roja', category: 'Verduras y Hortalizas', calories: 23, proteinG: 1.4, carbsG: 4.5, fatG: 0.2, fiberG: 1.8 },
  { name: 'Cogollos de Tudela limpios', category: 'Verduras y Hortalizas', calories: 15, proteinG: 1.3, carbsG: 2.2, fatG: 0.2, fiberG: 1.6 },
  { name: 'Brotes tiernos de espinaca, rúcula y canónigos', category: 'Verduras y Hortalizas', calories: 18, proteinG: 2.1, carbsG: 1.8, fatG: 0.3, fiberG: 2.0 },
  { name: 'Apio verde fresco en ramas limpias', category: 'Verduras y Hortalizas', calories: 16, proteinG: 0.7, carbsG: 3.0, fatG: 0.2, fiberG: 1.6 },
  { name: 'Hinojo fresco en bulbos laminados', category: 'Verduras y Hortalizas', calories: 31, proteinG: 1.2, carbsG: 7.3, fatG: 0.2, fiberG: 3.1 },
  { name: 'Rábanos frescos crujientes', category: 'Verduras y Hortalizas', calories: 16, proteinG: 0.7, carbsG: 3.4, fatG: 0.1, fiberG: 1.6 },
  { name: 'Nabo blanco cocido en dados', category: 'Verduras y Hortalizas', calories: 28, proteinG: 0.9, carbsG: 6.4, fatG: 0.1, fiberG: 1.8 },
  { name: 'Chirivía fresca asada', category: 'Verduras y Hortalizas', calories: 75, proteinG: 1.2, carbsG: 18.0, fatG: 0.3, fiberG: 4.9 },
  { name: 'Zanahorias baby tiernas al vapor', category: 'Verduras y Hortalizas', calories: 35, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, fiberG: 2.8 },
  { name: 'Zanahoria rallada fresca en bolsa', category: 'Verduras y Hortalizas', calories: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2, fiberG: 2.8 },
  { name: 'Cebolla morada fresca en aros', category: 'Verduras y Hortalizas', calories: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, fiberG: 1.7 },
  { name: 'Cebolleta fresca dulce en juliana', category: 'Verduras y Hortalizas', calories: 32, proteinG: 1.8, carbsG: 7.3, fatG: 0.2, fiberG: 2.6 },
  { name: 'Chalotas francesas pochadas', category: 'Verduras y Hortalizas', calories: 72, proteinG: 2.5, carbsG: 16.8, fatG: 0.1, fiberG: 3.2 },
  { name: 'Puerro fresco hervido', category: 'Verduras y Hortalizas', calories: 31, proteinG: 0.8, carbsG: 7.6, fatG: 0.2, fiberG: 1.2 },
  { name: 'Col de Bruselas al vapor con AOVE', category: 'Verduras y Hortalizas', calories: 43, proteinG: 3.4, carbsG: 9.0, fatG: 0.3, fiberG: 3.8 },
  { name: 'Romanesco al vapor con pimentón', category: 'Verduras y Hortalizas', calories: 30, proteinG: 2.8, carbsG: 4.8, fatG: 0.4, fiberG: 2.5 },
  { name: 'Coliflor gratinada con bechamel ligera', category: 'Verduras y Hortalizas', calories: 65, proteinG: 3.8, carbsG: 7.2, fatG: 2.5, fiberG: 2.2 },
  { name: 'Judías verdes redondas bobi al vapor', category: 'Verduras y Hortalizas', calories: 31, proteinG: 1.8, carbsG: 7.0, fatG: 0.2, fiberG: 3.4 },
  { name: 'Tirabeques frescos salteados al dente', category: 'Verduras y Hortalizas', calories: 42, proteinG: 2.8, carbsG: 7.5, fatG: 0.2, fiberG: 2.6 },
  { name: 'Berenjenas asadas con piel', category: 'Verduras y Hortalizas', calories: 25, proteinG: 1.0, carbsG: 5.9, fatG: 0.2, fiberG: 3.0 },
  { name: 'Tomate seco en aceite de oliva escurrido', category: 'Verduras y Hortalizas', calories: 213, proteinG: 5.2, carbsG: 23.5, fatG: 14.2, fiberG: 6.8 },

  // Pescados, conservas y semiconservas
  { name: 'Merluza en salsa verde con guisantes', category: 'Pescados y Mariscos', calories: 110, proteinG: 16.0, carbsG: 3.5, fatG: 3.8, fiberG: 1.0 },
  { name: 'Kokotxas de bacalao al pil-pil', category: 'Pescados y Mariscos', calories: 220, proteinG: 15.2, carbsG: 0.5, fatG: 18.0, fiberG: 0 },
  { name: 'Kokotxas de merluza a la plancha', category: 'Pescados y Mariscos', calories: 125, proteinG: 16.8, carbsG: 0, fatG: 6.5, fiberG: 0 },
  { name: 'Mero salvaje a la plancha', category: 'Pescados y Mariscos', calories: 92, proteinG: 19.4, carbsG: 0, fatG: 1.3, fiberG: 0 },
  { name: 'Besugo al horno a la madrileña', category: 'Pescados y Mariscos', calories: 118, proteinG: 18.5, carbsG: 1.2, fatG: 4.5, fiberG: 0.2 },
  { name: 'Pargo fresco a la espalda', category: 'Pescados y Mariscos', calories: 100, proteinG: 20.5, carbsG: 0, fatG: 2.0, fiberG: 0 },
  { name: 'Sargo fresco a la brasa', category: 'Pescados y Mariscos', calories: 104, proteinG: 19.8, carbsG: 0, fatG: 2.8, fiberG: 0 },
  { name: 'Urta a la roteña tradicional', category: 'Pescados y Mariscos', calories: 115, proteinG: 17.5, carbsG: 4.2, fatG: 3.5, fiberG: 1.2 },
  { name: 'Congrio en rodajas para guiso', category: 'Pescados y Mariscos', calories: 105, proteinG: 19.0, carbsG: 0, fatG: 3.2, fiberG: 0 },
  { name: 'Cazón adobado en bienmesabe frito', category: 'Pescados y Mariscos', calories: 185, proteinG: 18.2, carbsG: 6.8, fatG: 9.8, fiberG: 0.4 },
  { name: 'Cazón en adobo a la plancha saludable', category: 'Pescados y Mariscos', calories: 102, proteinG: 21.0, carbsG: 0.8, fatG: 1.8, fiberG: 0 },
  { name: 'Pez de San Pedro lomos limpios', category: 'Pescados y Mariscos', calories: 82, proteinG: 17.2, carbsG: 0, fatG: 1.4, fiberG: 0 },
  { name: 'Gallineta o cabracho limpio cocido', category: 'Pescados y Mariscos', calories: 90, proteinG: 18.5, carbsG: 0, fatG: 1.8, fiberG: 0 },
  { name: 'Pastel de cabracho artesano con tomate y nata ligera', category: 'Pescados y Mariscos', calories: 145, proteinG: 14.0, carbsG: 4.5, fatG: 8.0, fiberG: 0.3 },
  { name: 'Angulas del norte al ajillo con guindilla', category: 'Pescados y Mariscos', calories: 205, proteinG: 16.5, carbsG: 0.5, fatG: 15.5, fiberG: 0 },
  { name: 'Percebes gallegos hervidos con sal marina', category: 'Pescados y Mariscos', calories: 66, proteinG: 15.7, carbsG: 0, fatG: 0.4, fiberG: 0 },
  { name: 'Cañaíllas cocidas carne limpia', category: 'Pescados y Mariscos', calories: 88, proteinG: 18.0, carbsG: 1.2, fatG: 1.2, fiberG: 0 },
  { name: 'Ortiguillas de mar fritas en AOVE', category: 'Pescados y Mariscos', calories: 160, proteinG: 12.0, carbsG: 8.5, fatG: 9.0, fiberG: 0.5 },
  { name: 'Mojama de atún de Barbate extra en finas lonchas', category: 'Pescados y Mariscos', calories: 210, proteinG: 45.0, carbsG: 0, fatG: 3.2, fiberG: 0 },
  { name: 'Huevas de mújol curadas en salazón (bottarga)', category: 'Pescados y Mariscos', calories: 375, proteinG: 35.5, carbsG: 2.0, fatG: 25.5, fiberG: 0 },
  { name: 'Huevas de maruca curadas en salazón', category: 'Pescados y Mariscos', calories: 320, proteinG: 38.0, carbsG: 1.5, fatG: 18.0, fiberG: 0 },

  // Aves, carnes blancas y embutidos magros
  { name: 'Picantón de granja asado con limón y romero', category: 'Carnes', calories: 150, proteinG: 22.0, carbsG: 0.2, fatG: 7.0, fiberG: 0 },
  { name: 'Pavo relleno de frutos secos al horno', category: 'Carnes', calories: 185, proteinG: 24.5, carbsG: 4.8, fatG: 7.8, fiberG: 0.8 },
  { name: 'Pollo campero cocido en pepitoria tradicional', category: 'Carnes', calories: 175, proteinG: 23.0, carbsG: 2.5, fatG: 8.2, fiberG: 0.5 },
  { name: 'Faisán asado de caza mayor magro', category: 'Carnes', calories: 133, proteinG: 24.0, carbsG: 0, fatG: 4.2, fiberG: 0 },
  { name: 'Perdiz roja de Toledo estofada en escabeche', category: 'Carnes', calories: 165, proteinG: 25.0, carbsG: 1.2, fatG: 6.8, fiberG: 0.2 },
  { name: 'Carpaccio de ternera con parmesano y rúcula', category: 'Carnes', calories: 165, proteinG: 22.0, carbsG: 0.8, fatG: 8.5, fiberG: 0.2 },
  { name: 'Steak tartar de solomillo de ternera aliñado', category: 'Carnes', calories: 175, proteinG: 22.5, carbsG: 1.5, fatG: 9.0, fiberG: 0.3 },
  { name: 'Rabo de toro estofado al vino tinto desgrasado', category: 'Carnes', calories: 195, proteinG: 26.0, carbsG: 3.0, fatG: 8.8, fiberG: 0.4 },
  { name: 'Carrilleras de cerdo ibérico guisadas desgrasadas', category: 'Carnes', calories: 180, proteinG: 25.0, carbsG: 2.8, fatG: 7.8, fiberG: 0.5 },
  { name: 'Carrilleras de ternera al Pedro Ximénez desgrasadas', category: 'Carnes', calories: 170, proteinG: 26.5, carbsG: 3.5, fatG: 5.5, fiberG: 0.4 },
  { name: 'Callos a la madrileña cocinados desgrasados', category: 'Carnes', calories: 145, proteinG: 18.0, carbsG: 4.2, fatG: 6.5, fiberG: 0.8 },
  { name: 'Lengua de ternera cocida fileteada', category: 'Carnes', calories: 224, proteinG: 16.0, carbsG: 0, fatG: 17.5, fiberG: 0 },
  { name: 'Corazón de ternera a la plancha con ajo', category: 'Carnes', calories: 112, proteinG: 17.5, carbsG: 0.1, fatG: 4.5, fiberG: 0 },
  { name: 'Riñones de cordero al jerez a la plancha', category: 'Carnes', calories: 118, proteinG: 16.5, carbsG: 1.0, fatG: 5.2, fiberG: 0 },
  { name: 'Chorizo criollo a la brasa desgrasado', category: 'Carnes', calories: 245, proteinG: 18.0, carbsG: 1.5, fatG: 19.0, fiberG: 0 },
  { name: 'Chorizo de pavo 0% grasa añadida', category: 'Carnes', calories: 165, proteinG: 22.0, carbsG: 2.0, fatG: 7.8, fiberG: 0 },
  { name: 'Salchichón de pavo bajo en grasa', category: 'Carnes', calories: 172, proteinG: 23.5, carbsG: 1.8, fatG: 8.0, fiberG: 0 },
  { name: 'Fuet de pavo extra lonchas', category: 'Carnes', calories: 210, proteinG: 28.0, carbsG: 2.5, fatG: 10.0, fiberG: 0 },
  { name: 'Morcilla vegetal de arroz y cebolla bio', category: 'Preparados y Otros', calories: 145, proteinG: 5.2, carbsG: 22.0, fatG: 4.5, fiberG: 3.8 },

  // Panes especiales, granos y cereales
  { name: 'Pan de centeno 100% de molde The Rustik Bakery', category: 'Cereales y Derivados', calories: 225, proteinG: 6.8, carbsG: 42.5, fatG: 1.8, fiberG: 7.8 },
  { name: 'Pan thins 100% integral Bimbo (1 pan 39g)', category: 'Cereales y Derivados', calories: 245, proteinG: 11.5, carbsG: 42.0, fatG: 2.5, fiberG: 9.8 },
  { name: 'Pan cristal tostado para jamón ibérico', category: 'Cereales y Derivados', calories: 260, proteinG: 8.5, carbsG: 54.0, fatG: 0.9, fiberG: 2.5 },
  { name: 'Pan de pita 100% integral horneado', category: 'Cereales y Derivados', calories: 250, proteinG: 9.5, carbsG: 48.0, fatG: 1.6, fiberG: 6.2 },
  { name: 'Pan naan indio horneado tradicional', category: 'Cereales y Derivados', calories: 295, proteinG: 8.8, carbsG: 52.0, fatG: 6.0, fiberG: 2.8 },
  { name: 'Bagel 100% integral horneado', category: 'Cereales y Derivados', calories: 245, proteinG: 10.0, carbsG: 47.0, fatG: 1.8, fiberG: 5.8 },
  { name: 'Muesli suizo 0% azúcares añadidos con frutos secos', category: 'Cereales y Derivados', calories: 375, proteinG: 11.5, carbsG: 62.0, fatG: 7.8, fiberG: 9.5 },
  { name: 'Granola casera con copos de avena, nueces y canela', category: 'Cereales y Derivados', calories: 420, proteinG: 12.0, carbsG: 55.0, fatG: 16.5, fiberG: 8.5 },
  { name: 'Copos de maíz sin azúcar añadido tostados (corn flakes)', category: 'Cereales y Derivados', calories: 378, proteinG: 7.5, carbsG: 84.0, fatG: 0.9, fiberG: 3.5 },
  { name: 'Copos de trigo espelta hinchados bio sin azúcar', category: 'Cereales y Derivados', calories: 345, proteinG: 13.0, carbsG: 66.0, fatG: 2.2, fiberG: 7.8 },
  { name: 'Arroz hinchado natural bio sin azúcar', category: 'Cereales y Derivados', calories: 365, proteinG: 7.2, carbsG: 81.0, fatG: 0.8, fiberG: 2.0 },
  { name: 'Polenta de maíz amarilla cocida', category: 'Cereales y Derivados', calories: 70, proteinG: 1.6, carbsG: 15.0, fatG: 0.2, fiberG: 1.2 },
  { name: 'Semolina de trigo duro para sopa', category: 'Cereales y Derivados', calories: 350, proteinG: 12.5, carbsG: 71.0, fatG: 1.2, fiberG: 3.8 },

  // Frutas y bayas
  { name: 'Uva blanca de mesa sin pepitas', category: 'Frutas', calories: 69, proteinG: 0.7, carbsG: 18.1, fatG: 0.2, fiberG: 0.9 },
  { name: 'Uva negra moscatel dulce', category: 'Frutas', calories: 73, proteinG: 0.8, carbsG: 18.8, fatG: 0.2, fiberG: 1.1 },
  { name: 'Albaricoques frescos de Murcia maduros', category: 'Frutas', calories: 48, proteinG: 1.4, carbsG: 11.1, fatG: 0.4, fiberG: 2.0 },
  { name: 'Ciruelas amarillas claudias dulces', category: 'Frutas', calories: 46, proteinG: 0.7, carbsG: 11.4, fatG: 0.3, fiberG: 1.4 },
  { name: 'Ciruela roja fresca madura', category: 'Frutas', calories: 45, proteinG: 0.7, carbsG: 11.2, fatG: 0.3, fiberG: 1.5 },
  { name: 'Nísperos de Callosa d’en Sarrià DOP', category: 'Frutas', calories: 47, proteinG: 0.4, carbsG: 12.1, fatG: 0.2, fiberG: 1.7 },
  { name: 'Membrillo fresco cocido sin azúcar', category: 'Frutas', calories: 57, proteinG: 0.4, carbsG: 15.3, fatG: 0.1, fiberG: 1.9 },
  { name: 'Dulce de membrillo artesano con nueces', category: 'Frutas', calories: 260, proteinG: 2.5, carbsG: 58.0, fatG: 3.0, fiberG: 2.5 },
  { name: 'Arándano rojo deshidratado sin azúcar añadido', category: 'Frutas', calories: 308, proteinG: 0.4, carbsG: 82.0, fatG: 1.4, fiberG: 5.7 },
  { name: 'Bayas de goji desecadas ecológicas', category: 'Frutas', calories: 349, proteinG: 14.3, carbsG: 77.1, fatG: 0.4, fiberG: 13.0 },
  { name: 'Grosella negra fresca silvestre (cassis)', category: 'Frutas', calories: 63, proteinG: 1.4, carbsG: 15.4, fatG: 0.4, fiberG: 6.8 },
  { name: 'Guayaba rosa fresca', category: 'Frutas', calories: 68, proteinG: 2.6, carbsG: 14.3, fatG: 1.0, fiberG: 5.4 },
  { name: 'Pomelo rosa fresco exprimido', category: 'Frutas', calories: 39, proteinG: 0.6, carbsG: 9.3, fatG: 0.1, fiberG: 0.2 },
  { name: 'Lima fresca zumo natural', category: 'Frutas', calories: 25, proteinG: 0.4, carbsG: 8.4, fatG: 0.1, fiberG: 0.4 },

  // Bebidas, infusiones y lácteos
  { name: 'Infusión de té verde matcha y sencha', category: 'Bebidas', calories: 2, proteinG: 0.2, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Té negro Earl Grey sin azúcar', category: 'Bebidas', calories: 1, proteinG: 0.1, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Té rojo pu-erh depurativo', category: 'Bebidas', calories: 1, proteinG: 0.1, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Rooibos con canela y naranja sin teína', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Manzanilla con anís verde natural', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Infusión de cola de caballo drenante', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.1, fatG: 0, fiberG: 0 },
  { name: 'Agua de coco 100% natural sin azúcares añadidos', category: 'Bebidas', calories: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, fiberG: 1.1 },
  { name: 'Bebida isotónica deportiva sin azúcar Aquarius Zero', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.1, fatG: 0, fiberG: 0 },
  { name: 'Kombucha de jengibre y limón ecológica Komvida', category: 'Bebidas', calories: 14, proteinG: 0.1, carbsG: 3.2, fatG: 0, fiberG: 0 },
  { name: 'Kombucha de frutos rojos Komvida', category: 'Bebidas', calories: 16, proteinG: 0.1, carbsG: 3.8, fatG: 0, fiberG: 0 },
  { name: 'Yogur de oveja artesano cremoso', category: 'Huevos y Lácteos', calories: 98, proteinG: 5.5, carbsG: 5.2, fatG: 6.2, fiberG: 0 },
  { name: 'Yogur de cabra ecológico natural', category: 'Huevos y Lácteos', calories: 72, proteinG: 4.1, carbsG: 4.5, fatG: 4.2, fiberG: 0 },
  { name: 'Queso emmental suizo en lonchas', category: 'Huevos y Lácteos', calories: 380, proteinG: 28.5, carbsG: 0.5, fatG: 29.5, fiberG: 0 },
  { name: 'Queso gouda holandés semicurado', category: 'Huevos y Lácteos', calories: 356, proteinG: 25.0, carbsG: 2.2, fatG: 27.5, fiberG: 0 },
  { name: 'Queso cheddar curado inglés', category: 'Huevos y Lácteos', calories: 403, proteinG: 25.0, carbsG: 1.3, fatG: 33.0, fiberG: 0 },
  { name: 'Queso provolone a la plancha con orégano', category: 'Huevos y Lácteos', calories: 351, proteinG: 25.5, carbsG: 2.1, fatG: 26.5, fiberG: 0 },
  { name: 'Queso camembert artesano de Normandía', category: 'Huevos y Lácteos', calories: 297, proteinG: 20.0, carbsG: 0.5, fatG: 24.0, fiberG: 0 },
  { name: 'Queso brie francés cremoso', category: 'Huevos y Lácteos', calories: 334, proteinG: 21.0, carbsG: 0.5, fatG: 28.0, fiberG: 0 },
  { name: 'Queso de tetilla gallego DOP suave', category: 'Huevos y Lácteos', calories: 360, proteinG: 23.0, carbsG: 1.2, fatG: 29.5, fiberG: 0 },
  { name: 'Queso San Simón da Costa ahumado DOP', category: 'Huevos y Lácteos', calories: 385, proteinG: 24.5, carbsG: 1.0, fatG: 31.0, fiberG: 0 },
  { name: 'Queso majorero de Fuerteventura con pimentón DOP', category: 'Huevos y Lácteos', calories: 410, proteinG: 28.0, carbsG: 0.8, fatG: 33.0, fiberG: 0 },
  { name: 'Queso palmero ahumado DOP', category: 'Huevos y Lácteos', calories: 395, proteinG: 26.0, carbsG: 0.8, fatG: 32.0, fiberG: 0 },
  { name: 'Queso mascarpone italiano para repostería', category: 'Huevos y Lácteos', calories: 412, proteinG: 4.5, carbsG: 3.5, fatG: 43.0, fiberG: 0 }
];

async function main() {
  console.log(`Starting Batch 2 food expansion with ${foodStaples.length} items...`);
  let added = 0;
  let skipped = 0;

  for (const item of foodStaples) {
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
  console.log(`🎉 Batch 2 finished! Added: ${added}, Already existing: ${skipped}, Total foods in DB: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
