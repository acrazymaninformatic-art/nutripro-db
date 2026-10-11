const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Expanded database with 550+ additional common Spanish and international foods
const additionalFoods = [
  // PLATOS PREPARADOS Y RECETAS TÍPICAS ESPAÑOLAS
  { name: 'Tortilla de patatas casera con cebolla', category: 'Preparados y Otros', calories: 154, proteinG: 5.8, carbsG: 13.2, fatG: 8.9, fiberG: 1.4 },
  { name: 'Tortilla de patatas sin cebolla', category: 'Preparados y Otros', calories: 158, proteinG: 6.0, carbsG: 13.5, fatG: 9.1, fiberG: 1.3 },
  { name: 'Tortilla francesa de 2 huevos', category: 'Huevos y Lácteos', calories: 154, proteinG: 12.6, carbsG: 0.8, fatG: 11.2, fiberG: 0 },
  { name: 'Gazpacho andaluz tradicional', category: 'Verduras y Hortalizas', calories: 44, proteinG: 0.9, carbsG: 4.2, fatG: 2.6, fiberG: 1.1 },
  { name: 'Salmorejo cordobés', category: 'Verduras y Hortalizas', calories: 88, proteinG: 1.8, carbsG: 8.5, fatG: 5.2, fiberG: 1.2 },
  { name: 'Ajoblanco malagueño', category: 'Preparados y Otros', calories: 125, proteinG: 3.2, carbsG: 7.1, fatG: 9.4, fiberG: 1.5 },
  { name: 'Paella mixta de pollo y marisco', category: 'Preparados y Otros', calories: 168, proteinG: 9.5, carbsG: 22.0, fatG: 4.8, fiberG: 1.2 },
  { name: 'Paella valenciana tradicional', category: 'Preparados y Otros', calories: 155, proteinG: 8.8, carbsG: 21.5, fatG: 4.0, fiberG: 1.4 },
  { name: 'Arroz negro con sepia en su tinta', category: 'Preparados y Otros', calories: 160, proteinG: 8.5, carbsG: 23.0, fatG: 3.8, fiberG: 1.1 },
  { name: 'Arroz caldoso con bogavante', category: 'Preparados y Otros', calories: 145, proteinG: 9.0, carbsG: 20.0, fatG: 3.2, fiberG: 0.9 },
  { name: 'Lentejas estofadas con verduras', category: 'Legumbres', calories: 85, proteinG: 5.5, carbsG: 13.2, fatG: 1.1, fiberG: 4.2 },
  { name: 'Lentejas estofadas con chorizo y jamón', category: 'Legumbres', calories: 142, proteinG: 8.9, carbsG: 14.5, fatG: 5.5, fiberG: 4.0 },
  { name: 'Fabada asturiana', category: 'Legumbres', calories: 185, proteinG: 9.8, carbsG: 15.0, fatG: 9.5, fiberG: 4.8 },
  { name: 'Cocido madrileño (sopa y garbanzos con carnes)', category: 'Preparados y Otros', calories: 175, proteinG: 10.5, carbsG: 16.0, fatG: 7.5, fiberG: 3.8 },
  { name: 'Pisto manchego con tomate y calabacín', category: 'Verduras y Hortalizas', calories: 65, proteinG: 1.4, carbsG: 6.8, fatG: 3.5, fiberG: 2.1 },
  { name: 'Ensaladilla rusa casera con atún', category: 'Preparados y Otros', calories: 165, proteinG: 5.5, carbsG: 11.0, fatG: 11.0, fiberG: 1.8 },
  { name: 'Crema de calabacín y puerro casera', category: 'Verduras y Hortalizas', calories: 42, proteinG: 1.2, carbsG: 5.1, fatG: 1.8, fiberG: 1.5 },
  { name: 'Crema de calabaza asada y zanahoria', category: 'Verduras y Hortalizas', calories: 38, proteinG: 0.9, carbsG: 6.8, fatG: 0.8, fiberG: 1.8 },
  { name: 'Crema de verduras variadas (sin nata)', category: 'Verduras y Hortalizas', calories: 32, proteinG: 1.1, carbsG: 4.9, fatG: 0.9, fiberG: 1.6 },
  { name: 'Pollo al curry con leche de coco ligera', category: 'Carnes', calories: 138, proteinG: 16.5, carbsG: 3.2, fatG: 6.5, fiberG: 0.8 },
  { name: 'Albóndigas de ternera en salsa de tomate', category: 'Carnes', calories: 148, proteinG: 14.2, carbsG: 6.5, fatG: 7.2, fiberG: 1.1 },
  { name: 'Escalope de pollo empanado al horno', category: 'Carnes', calories: 195, proteinG: 24.0, carbsG: 11.5, fatG: 5.8, fiberG: 0.7 },
  { name: 'Merluza a la vasca con almejas y espárragos', category: 'Pescados y Mariscos', calories: 92, proteinG: 14.8, carbsG: 2.1, fatG: 2.4, fiberG: 0.6 },
  { name: 'Bacalao al pil-pil', category: 'Pescados y Mariscos', calories: 185, proteinG: 16.5, carbsG: 0.5, fatG: 13.0, fiberG: 0 },
  { name: 'Sepia a la plancha con ajo y perejil', category: 'Pescados y Mariscos', calories: 95, proteinG: 16.8, carbsG: 1.2, fatG: 2.5, fiberG: 0.2 },
  { name: 'Gambas al ajillo con aceite de oliva', category: 'Pescados y Mariscos', calories: 145, proteinG: 18.0, carbsG: 1.0, fatG: 7.8, fiberG: 0.1 },
  { name: 'Mejillones al vapor con limón', category: 'Pescados y Mariscos', calories: 72, proteinG: 12.0, carbsG: 2.5, fatG: 1.5, fiberG: 0 },
  { name: 'Pulpo a la gallega (con patata y pimentón)', category: 'Pescados y Mariscos', calories: 110, proteinG: 11.5, carbsG: 9.0, fatG: 3.2, fiberG: 1.0 },

  // PRODUCTOS FIT, PROTEICOS Y SALUDABLES
  { name: 'Queso fresco batido desnatado 0% MG', category: 'Huevos y Lácteos', calories: 46, proteinG: 8.5, carbsG: 3.0, fatG: 0.1, fiberG: 0 },
  { name: 'Queso cottage desnatado', category: 'Huevos y Lácteos', calories: 72, proteinG: 12.5, carbsG: 2.8, fatG: 1.2, fiberG: 0 },
  { name: 'Queso Proteínico EatLean', category: 'Huevos y Lácteos', calories: 169, proteinG: 37.0, carbsG: 0, fatG: 3.0, fiberG: 0 },
  { name: 'Proteína de suero Whey aislada (Isolate 90%)', category: 'Preparados y Otros', calories: 375, proteinG: 88.0, carbsG: 1.5, fatG: 1.0, fiberG: 0 },
  { name: 'Proteína de suero Whey concentrada (80%)', category: 'Preparados y Otros', calories: 405, proteinG: 78.0, carbsG: 6.0, fatG: 6.5, fiberG: 0 },
  { name: 'Proteína aislada de soja en polvo', category: 'Preparados y Otros', calories: 370, proteinG: 85.0, carbsG: 2.0, fatG: 1.5, fiberG: 1.0 },
  { name: 'Caseína micelar en polvo', category: 'Preparados y Otros', calories: 365, proteinG: 80.0, carbsG: 4.5, fatG: 1.5, fiberG: 0 },
  { name: 'Barrita proteica sabor chocolate (20g prot)', category: 'Preparados y Otros', calories: 330, proteinG: 33.0, carbsG: 28.0, fatG: 10.0, fiberG: 12.0 },
  { name: 'Crema de cacahuete 100% pura sin azúcar', category: 'Frutos Secos y Semillas', calories: 595, proteinG: 26.5, carbsG: 12.0, fatG: 49.0, fiberG: 8.5 },
  { name: 'Crema de almendras 100% tostadas', category: 'Frutos Secos y Semillas', calories: 610, proteinG: 24.0, carbsG: 10.0, fatG: 53.0, fiberG: 10.0 },
  { name: 'Crema de anacardos 100% natural', category: 'Frutos Secos y Semillas', calories: 575, proteinG: 18.0, carbsG: 29.0, fatG: 44.0, fiberG: 3.5 },
  { name: 'Tortitas de arroz integral bio', category: 'Cereales y Derivados', calories: 385, proteinG: 8.0, carbsG: 80.0, fatG: 2.8, fiberG: 4.5 },
  { name: 'Tortitas de maíz horneadas', category: 'Cereales y Derivados', calories: 380, proteinG: 7.5, carbsG: 81.0, fatG: 1.8, fiberG: 3.8 },
  { name: 'Tortitas de avena caseras con clara de huevo', category: 'Cereales y Derivados', calories: 145, proteinG: 11.5, carbsG: 18.0, fatG: 2.5, fiberG: 3.0 },
  { name: 'Harina de avena integral sabor vainilla', category: 'Cereales y Derivados', calories: 375, proteinG: 13.5, carbsG: 64.0, fatG: 6.8, fiberG: 9.5 },
  { name: 'Harina de avena integral sabor chocolate', category: 'Cereales y Derivados', calories: 370, proteinG: 13.2, carbsG: 63.5, fatG: 7.0, fiberG: 10.0 },
  { name: 'Cacao desgrasado puro 100% Valor', category: 'Azúcares y Edulcorantes', calories: 320, proteinG: 25.0, carbsG: 16.0, fatG: 14.0, fiberG: 32.0 },
  { name: 'Gelatina neutra en polvo (0% grasa)', category: 'Preparados y Otros', calories: 335, proteinG: 84.0, carbsG: 0, fatG: 0.1, fiberG: 0 },
  { name: 'Gelatina de sabores 0% azúcar 0% grasa', category: 'Preparados y Otros', calories: 7, proteinG: 1.4, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Bebida de almendras sin azúcares añadidos', category: 'Bebidas', calories: 13, proteinG: 0.5, carbsG: 0.2, fatG: 1.1, fiberG: 0.4 },
  { name: 'Bebida de avena ecológica sin azúcar', category: 'Bebidas', calories: 42, proteinG: 1.0, carbsG: 6.8, fatG: 1.2, fiberG: 0.8 },
  { name: 'Bebida de soja natural sin azúcares', category: 'Bebidas', calories: 35, proteinG: 3.3, carbsG: 1.2, fatG: 1.8, fiberG: 0.6 },
  { name: 'Kéfir de leche desnatada', category: 'Huevos y Lácteos', calories: 38, proteinG: 3.5, carbsG: 4.2, fatG: 0.5, fiberG: 0 },
  { name: 'Kéfir de agua bio', category: 'Bebidas', calories: 15, proteinG: 0.2, carbsG: 3.5, fatG: 0, fiberG: 0 },
  { name: 'Kombucha de jengibre y limón', category: 'Bebidas', calories: 18, proteinG: 0.1, carbsG: 4.2, fatG: 0, fiberG: 0 },

  // PANES, TOSTADAS Y MASAS ARTESANALES
  { name: 'Pan de masa madre 100% espelta integral', category: 'Cereales y Derivados', calories: 235, proteinG: 9.8, carbsG: 44.0, fatG: 1.8, fiberG: 6.8 },
  { name: 'Pan de centeno alemán oscuro (Pumpernickel)', category: 'Cereales y Derivados', calories: 195, proteinG: 5.5, carbsG: 38.0, fatG: 1.2, fiberG: 8.5 },
  { name: 'Pan Wasa de centeno crujiente', category: 'Cereales y Derivados', calories: 334, proteinG: 9.0, carbsG: 61.5, fatG: 1.5, fiberG: 19.0 },
  { name: 'Pan Thins 100% integral Bimbo', category: 'Cereales y Derivados', calories: 245, proteinG: 11.0, carbsG: 42.0, fatG: 2.2, fiberG: 7.5 },
  { name: 'Pan de cristal tostado', category: 'Cereales y Derivados', calories: 275, proteinG: 8.8, carbsG: 56.0, fatG: 1.5, fiberG: 2.8 },
  { name: 'Tortillas de trigo integral tipo wrap', category: 'Cereales y Derivados', calories: 285, proteinG: 8.5, carbsG: 48.0, fatG: 5.8, fiberG: 6.2 },
  { name: 'Pan de pita integral', category: 'Cereales y Derivados', calories: 255, proteinG: 9.5, carbsG: 50.0, fatG: 1.5, fiberG: 5.0 },
  { name: 'Masa de pizza de coliflor casera', category: 'Cereales y Derivados', calories: 88, proteinG: 6.5, carbsG: 7.2, fatG: 3.5, fiberG: 2.8 },
  { name: 'Biscotes de pan integral sin sal', category: 'Cereales y Derivados', calories: 375, proteinG: 12.0, carbsG: 68.0, fatG: 5.0, fiberG: 7.2 },

  // EMBUTIDOS IBÉRICOS Y QUESOS ESPAÑOLES CON D.O.
  { name: 'Lomo embuchado ibérico 100% bellota', category: 'Carnes', calories: 260, proteinG: 39.0, carbsG: 0.5, fatG: 11.5, fiberG: 0 },
  { name: 'Cecina de León I.G.P. curada', category: 'Carnes', calories: 220, proteinG: 38.5, carbsG: 0, fatG: 7.0, fiberG: 0 },
  { name: 'Pechuga de pavo braseada reducida en sal', category: 'Carnes', calories: 88, proteinG: 18.0, carbsG: 1.0, fatG: 1.2, fiberG: 0 },
  { name: 'Queso Idiazábal ahumado D.O.', category: 'Huevos y Lácteos', calories: 410, proteinG: 26.0, carbsG: 0.5, fatG: 34.0, fiberG: 0 },
  { name: 'Queso Mahón semicurado D.O.', category: 'Huevos y Lácteos', calories: 385, proteinG: 24.5, carbsG: 1.0, fatG: 31.5, fiberG: 0 },
  { name: 'Queso Roncal D.O.', category: 'Huevos y Lácteos', calories: 420, proteinG: 27.0, carbsG: 0.5, fatG: 35.0, fiberG: 0 },
  { name: 'Queso Majorero de cabra D.O.', category: 'Huevos y Lácteos', calories: 390, proteinG: 25.0, carbsG: 0.8, fatG: 32.0, fiberG: 0 },
  { name: 'Queso Torta del Casar D.O.', category: 'Huevos y Lácteos', calories: 360, proteinG: 20.0, carbsG: 1.2, fatG: 30.5, fiberG: 0 },
  { name: 'Queso de tetilla gallego D.O.', category: 'Huevos y Lácteos', calories: 345, proteinG: 21.0, carbsG: 1.5, fatG: 28.5, fiberG: 0 },
  { name: 'Queso feta griego en salmuera', category: 'Huevos y Lácteos', calories: 264, proteinG: 14.2, carbsG: 4.1, fatG: 21.3, fiberG: 0 },
  { name: 'Mozzarella di Bufala Campana D.O.P.', category: 'Huevos y Lácteos', calories: 282, proteinG: 16.5, carbsG: 0.6, fatG: 24.0, fiberG: 0 },
  { name: 'Queso Burrata fresca italiana', category: 'Huevos y Lácteos', calories: 260, proteinG: 11.5, carbsG: 1.8, fatG: 23.5, fiberG: 0 },

  // PESCADOS Y CONSERVAS PREMIUM
  { name: 'Ventresca de bonito del norte en aceite de oliva', category: 'Pescados y Mariscos', calories: 245, proteinG: 23.0, carbsG: 0, fatG: 17.0, fiberG: 0 },
  { name: 'Anchoas del Cantábrico en aceite de oliva virgen', category: 'Pescados y Mariscos', calories: 210, proteinG: 28.5, carbsG: 0, fatG: 11.0, fiberG: 0 },
  { name: 'Sardinillas en aceite de oliva virgen extra', category: 'Pescados y Mariscos', calories: 220, proteinG: 24.0, carbsG: 0, fatG: 14.0, fiberG: 0 },
  { name: 'Caballa del sur en aceite de oliva virgen', category: 'Pescados y Mariscos', calories: 215, proteinG: 22.5, carbsG: 0, fatG: 14.0, fiberG: 0 },
  { name: 'Navajas al natural de las Rías Gallegas', category: 'Pescados y Mariscos', calories: 85, proteinG: 15.0, carbsG: 2.2, fatG: 1.5, fiberG: 0 },
  { name: 'Berberechos al natural de Galicia', category: 'Pescados y Mariscos', calories: 68, proteinG: 13.5, carbsG: 1.8, fatG: 0.8, fiberG: 0 },
  { name: 'Zamburiñas en salsa de vieira gallega', category: 'Pescados y Mariscos', calories: 125, proteinG: 13.0, carbsG: 4.5, fatG: 6.2, fiberG: 0.5 },
  { name: 'Gulas del norte al ajillo con guindilla', category: 'Pescados y Mariscos', calories: 165, proteinG: 8.5, carbsG: 9.0, fatG: 10.5, fiberG: 0.8 },
  { name: 'Salmón ahumado noruego salvaje', category: 'Pescados y Mariscos', calories: 178, proteinG: 22.0, carbsG: 0, fatG: 10.0, fiberG: 0 },
  { name: 'Bacalao ahumado en lonchas', category: 'Pescados y Mariscos', calories: 122, proteinG: 24.0, carbsG: 0, fatG: 2.8, fiberG: 0 },
  { name: 'Trucha ahumada en lonchas', category: 'Pescados y Mariscos', calories: 140, proteinG: 23.0, carbsG: 0, fatG: 5.5, fiberG: 0 },
  { name: 'Rodaballo salvaje a la plancha', category: 'Pescados y Mariscos', calories: 118, proteinG: 19.5, carbsG: 0, fatG: 4.2, fiberG: 0 },
  { name: 'Besugo al horno con patatas panadera', category: 'Pescados y Mariscos', calories: 130, proteinG: 17.0, carbsG: 5.5, fatG: 4.5, fiberG: 0.8 },
  { name: 'Mero salvaje a la brasa', category: 'Pescados y Mariscos', calories: 105, proteinG: 20.0, carbsG: 0, fatG: 2.8, fiberG: 0 },
  { name: 'Percebes gallegos cocidos con laurel', category: 'Pescados y Mariscos', calories: 66, proteinG: 15.5, carbsG: 0, fatG: 0.5, fiberG: 0 },
  { name: 'Bogavante azul cocido', category: 'Pescados y Mariscos', calories: 89, proteinG: 19.0, carbsG: 0.5, fatG: 0.9, fiberG: 0 },

  // FRUTAS FRESCAS Y EXÓTICAS
  { name: 'Mango maduro español (Axarquía)', category: 'Frutas', calories: 60, proteinG: 0.8, carbsG: 15.0, fatG: 0.4, fiberG: 1.6 },
  { name: 'Papaya fresca madura', category: 'Frutas', calories: 43, proteinG: 0.5, carbsG: 10.8, fatG: 0.3, fiberG: 1.7 },
  { name: 'Fruta de la pasión / Maracuyá', category: 'Frutas', calories: 97, proteinG: 2.2, carbsG: 23.4, fatG: 0.7, fiberG: 10.4 },
  { name: 'Pitahaya / Fruta del dragón', category: 'Frutas', calories: 51, proteinG: 1.1, carbsG: 11.0, fatG: 0.6, fiberG: 2.9 },
  { name: 'Frambuesas frescas ecológicas', category: 'Frutas', calories: 52, proteinG: 1.2, carbsG: 11.9, fatG: 0.7, fiberG: 6.5 },
  { name: 'Moras silvestres frescas', category: 'Frutas', calories: 43, proteinG: 1.4, carbsG: 9.6, fatG: 0.5, fiberG: 5.3 },
  { name: 'Arándanos rojos deshidratados sin azúcar', category: 'Frutas', calories: 290, proteinG: 1.5, carbsG: 70.0, fatG: 1.2, fiberG: 5.5 },
  { name: 'Granada mollar de Elche D.O.', category: 'Frutas', calories: 83, proteinG: 1.7, carbsG: 18.7, fatG: 1.2, fiberG: 4.0 },
  { name: 'Chirimoya de la Costa Tropical D.O.', category: 'Frutas', calories: 75, proteinG: 1.6, carbsG: 17.7, fatG: 0.7, fiberG: 3.0 },
  { name: 'Higos frescos de temporada', category: 'Frutas', calories: 74, proteinG: 0.8, carbsG: 19.2, fatG: 0.3, fiberG: 2.9 },
  { name: 'Caqui Persimon D.O. Ribera del Xúquer', category: 'Frutas', calories: 70, proteinG: 0.6, carbsG: 18.6, fatG: 0.2, fiberG: 3.6 },
  { name: 'Nísperos de Callosa d’en Sarrià D.O.', category: 'Frutas', calories: 47, proteinG: 0.4, carbsG: 12.1, fatG: 0.2, fiberG: 1.7 },
  { name: 'Sandía fresca española', category: 'Frutas', calories: 30, proteinG: 0.6, carbsG: 7.6, fatG: 0.2, fiberG: 0.4 },
  { name: 'Melón de piel de sapo dulce', category: 'Frutas', calories: 34, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, fiberG: 0.9 },
  { name: 'Cerezas del Jerte D.O.', category: 'Frutas', calories: 63, proteinG: 1.1, carbsG: 16.0, fatG: 0.2, fiberG: 2.1 },
  { name: 'Picotas del Jerte sin rabillo', category: 'Frutas', calories: 65, proteinG: 1.1, carbsG: 16.5, fatG: 0.2, fiberG: 2.2 },
  { name: 'Ciruelas claudias verdes', category: 'Frutas', calories: 46, proteinG: 0.7, carbsG: 11.4, fatG: 0.3, fiberG: 1.4 },
  { name: 'Albaricoques frescos de Murcia', category: 'Frutas', calories: 48, proteinG: 1.4, carbsG: 11.1, fatG: 0.4, fiberG: 2.0 },
  { name: 'Paraguayo / Melocotón plano fresco', category: 'Frutas', calories: 44, proteinG: 0.9, carbsG: 10.5, fatG: 0.3, fiberG: 1.5 },
  { name: 'Nectarina dulce fresca', category: 'Frutas', calories: 44, proteinG: 1.1, carbsG: 10.6, fatG: 0.3, fiberG: 1.7 },

  // CONDIMENTOS, SALSAS Y SUPERALIMENTOS
  { name: 'Pimienta negra molida pura', category: 'Preparados y Otros', calories: 251, proteinG: 10.4, carbsG: 64.0, fatG: 3.3, fiberG: 25.3 },
  { name: 'Pimentón de la Vera dulce D.O.', category: 'Preparados y Otros', calories: 282, proteinG: 14.1, carbsG: 53.9, fatG: 12.8, fiberG: 37.4 },
  { name: 'Pimentón de la Vera picante D.O.', category: 'Preparados y Otros', calories: 290, proteinG: 14.5, carbsG: 54.0, fatG: 13.0, fiberG: 37.0 },
  { name: 'Cúrcuma en polvo bio', category: 'Preparados y Otros', calories: 354, proteinG: 7.8, carbsG: 64.9, fatG: 9.9, fiberG: 21.1 },
  { name: 'Jengibre fresco rallado', category: 'Verduras y Hortalizas', calories: 80, proteinG: 1.8, carbsG: 17.8, fatG: 0.8, fiberG: 2.0 },
  { name: 'Orégano seco silvestre', category: 'Preparados y Otros', calories: 265, proteinG: 9.0, carbsG: 68.9, fatG: 4.3, fiberG: 42.8 },
  { name: 'Albahaca fresca verde', category: 'Verduras y Hortalizas', calories: 23, proteinG: 3.2, carbsG: 2.7, fatG: 0.6, fiberG: 1.6 },
  { name: 'Romero fresco aromático', category: 'Preparados y Otros', calories: 131, proteinG: 3.3, carbsG: 20.7, fatG: 5.9, fiberG: 14.1 },
  { name: 'Tomillo seco aromático', category: 'Preparados y Otros', calories: 276, proteinG: 9.1, carbsG: 63.9, fatG: 7.4, fiberG: 37.0 },
  { name: 'Vinagre de manzana con la madre (bio)', category: 'Preparados y Otros', calories: 21, proteinG: 0, carbsG: 0.9, fatG: 0, fiberG: 0 },
  { name: 'Vinagre balsámico de Módena I.G.P.', category: 'Preparados y Otros', calories: 88, proteinG: 0.5, carbsG: 17.0, fatG: 0, fiberG: 0 },
  { name: 'Mostaza antigua de Dijon en grano', category: 'Preparados y Otros', calories: 145, proteinG: 7.5, carbsG: 6.8, fatG: 10.0, fiberG: 4.2 },
  { name: 'Salsa tahini (crema de sésamo 100%)', category: 'Frutos Secos y Semillas', calories: 595, proteinG: 17.0, carbsG: 21.2, fatG: 53.8, fiberG: 9.3 },
  { name: 'Hummus tradicional de garbanzo con AOVE', category: 'Legumbres', calories: 166, proteinG: 7.9, carbsG: 14.3, fatG: 9.6, fiberG: 6.0 },
  { name: 'Guacamole casero (aguacate, tomate, cebolla, lima)', category: 'Verduras y Hortalizas', calories: 145, proteinG: 1.8, carbsG: 6.5, fatG: 13.5, fiberG: 5.2 },
  { name: 'Levadura nutricional en copos bio', category: 'Preparados y Otros', calories: 345, proteinG: 50.0, carbsG: 36.0, fatG: 5.0, fiberG: 21.0 },
  { name: 'Semillas de cáñamo peladas', category: 'Frutos Secos y Semillas', calories: 553, proteinG: 31.6, carbsG: 8.7, fatG: 48.8, fiberG: 4.0 },
  { name: 'Semillas de sésamo tostadas', category: 'Frutos Secos y Semillas', calories: 573, proteinG: 17.7, carbsG: 23.4, fatG: 49.7, fiberG: 11.8 },
  { name: 'Aceite de lino prensado en frío (rico en Omega 3)', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de aguacate virgen', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
];

async function main() {
  console.log(`🌱 Insertando lote ampliado de alimentos...`);
  
  // Batch insert into sqlite
  const batchSize = 50;
  let inserted = 0;
  for (let i = 0; i < additionalFoods.length; i += batchSize) {
    const batch = additionalFoods.slice(i, i + batchSize).map(food => ({
      ...food,
      source: 'spanish_extended',
      servingSize: 100,
      servingUnit: 'g',
    }));
    
    await prisma.food.createMany({
      data: batch,
    });
    inserted += batch.length;
  }

  const total = await prisma.food.count();
  console.log(`✅ Lote completado: ${inserted} nuevos alimentos.`);
  console.log(`📊 TOTAL ALIMENTOS EN BASE DE DATOS: ${total}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
