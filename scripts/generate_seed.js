const fs = require('fs');
const path = require('path');

// 500+ Spanish foods with realistic BEDCA/USDA nutritional data per 100g
const carnes = [
  // Pollo
  { name: 'Pechuga de pollo cruda', category: 'Carnes', calories: 120, proteinG: 22.5, carbsG: 0, fatG: 2.6, fiberG: 0 },
  { name: 'Pechuga de pollo a la plancha', category: 'Carnes', calories: 165, proteinG: 31.0, carbsG: 0, fatG: 3.6, fiberG: 0 },
  { name: 'Muslo de pollo con piel', category: 'Carnes', calories: 211, proteinG: 18.2, carbsG: 0, fatG: 15.3, fiberG: 0 },
  { name: 'Muslo de pollo sin piel', category: 'Carnes', calories: 155, proteinG: 20.1, carbsG: 0, fatG: 8.3, fiberG: 0 },
  { name: 'Contramuslo de pollo con piel', category: 'Carnes', calories: 232, proteinG: 17.5, carbsG: 0, fatG: 18.0, fiberG: 0 },
  { name: 'Contramuslo de pollo sin piel', category: 'Carnes', calories: 160, proteinG: 19.8, carbsG: 0, fatG: 9.0, fiberG: 0 },
  { name: 'Alitas de pollo con piel', category: 'Carnes', calories: 222, proteinG: 18.3, carbsG: 0, fatG: 16.0, fiberG: 0 },
  { name: 'Pollo entero asado con piel', category: 'Carnes', calories: 237, proteinG: 24.7, carbsG: 0, fatG: 14.3, fiberG: 0 },
  { name: 'Carne picada de pollo', category: 'Carnes', calories: 143, proteinG: 21.0, carbsG: 0, fatG: 6.5, fiberG: 0 },
  { name: 'Jamoncitos de pollo asados', category: 'Carnes', calories: 172, proteinG: 23.4, carbsG: 0, fatG: 8.8, fiberG: 0 },
  { name: 'Hígado de pollo', category: 'Carnes', calories: 119, proteinG: 16.9, carbsG: 0.7, fatG: 4.8, fiberG: 0 },
  { name: 'Corazones de pollo', category: 'Carnes', calories: 153, proteinG: 15.6, carbsG: 0.7, fatG: 9.3, fiberG: 0 },
  { name: 'Mollejas de pollo', category: 'Carnes', calories: 94, proteinG: 17.7, carbsG: 0, fatG: 2.1, fiberG: 0 },

  // Ternera
  { name: 'Solomillo de ternera', category: 'Carnes', calories: 142, proteinG: 21.8, carbsG: 0, fatG: 6.1, fiberG: 0 },
  { name: 'Solomillo de ternera a la plancha', category: 'Carnes', calories: 198, proteinG: 28.5, carbsG: 0, fatG: 9.3, fiberG: 0 },
  { name: 'Entrecot de ternera', category: 'Carnes', calories: 206, proteinG: 20.4, carbsG: 0, fatG: 13.8, fiberG: 0 },
  { name: 'Chuletón de ternera', category: 'Carnes', calories: 240, proteinG: 19.5, carbsG: 0, fatG: 18.0, fiberG: 0 },
  { name: 'Carne picada de ternera magra', category: 'Carnes', calories: 175, proteinG: 21.4, carbsG: 0, fatG: 10.0, fiberG: 0 },
  { name: 'Carne picada de ternera (mezcla 20% grasa)', category: 'Carnes', calories: 254, proteinG: 17.2, carbsG: 0, fatG: 20.0, fiberG: 0 },
  { name: 'Redondo de ternera', category: 'Carnes', calories: 128, proteinG: 22.0, carbsG: 0, fatG: 4.4, fiberG: 0 },
  { name: 'Falda de ternera', category: 'Carnes', calories: 231, proteinG: 19.0, carbsG: 0, fatG: 17.2, fiberG: 0 },
  { name: 'Morcillo de ternera (jarrete)', category: 'Carnes', calories: 135, proteinG: 21.5, carbsG: 0, fatG: 5.4, fiberG: 0 },
  { name: 'Lengua de ternera', category: 'Carnes', calories: 224, proteinG: 14.9, carbsG: 0, fatG: 18.2, fiberG: 0 },
  { name: 'Lomo de ternera', category: 'Carnes', calories: 146, proteinG: 21.0, carbsG: 0, fatG: 6.9, fiberG: 0 },
  { name: 'Babilla de ternera', category: 'Carnes', calories: 125, proteinG: 22.3, carbsG: 0, fatG: 3.9, fiberG: 0 },
  { name: 'Cadera de ternera', category: 'Carnes', calories: 130, proteinG: 21.8, carbsG: 0, fatG: 4.7, fiberG: 0 },
  { name: 'Aguja de ternera', category: 'Carnes', calories: 170, proteinG: 19.8, carbsG: 0, fatG: 10.2, fiberG: 0 },
  { name: 'Rabo de ternera / buey', category: 'Carnes', calories: 258, proteinG: 18.5, carbsG: 0, fatG: 20.5, fiberG: 0 },
  { name: 'Hígado de ternera', category: 'Carnes', calories: 135, proteinG: 20.4, carbsG: 3.8, fatG: 3.9, fiberG: 0 },
  { name: 'Callos de ternera cocidos', category: 'Carnes', calories: 95, proteinG: 14.5, carbsG: 0, fatG: 4.0, fiberG: 0 },
  { name: 'Carrillera de ternera', category: 'Carnes', calories: 145, proteinG: 20.0, carbsG: 0, fatG: 7.2, fiberG: 0 },

  // Cerdo
  { name: 'Lomo de cerdo fresco', category: 'Carnes', calories: 143, proteinG: 21.7, carbsG: 0, fatG: 6.2, fiberG: 0 },
  { name: 'Lomo de cerdo a la plancha', category: 'Carnes', calories: 192, proteinG: 28.0, carbsG: 0, fatG: 8.8, fiberG: 0 },
  { name: 'Solomillo de cerdo', category: 'Carnes', calories: 120, proteinG: 21.5, carbsG: 0, fatG: 3.8, fiberG: 0 },
  { name: 'Costillas de cerdo', category: 'Carnes', calories: 277, proteinG: 16.0, carbsG: 0, fatG: 23.5, fiberG: 0 },
  { name: 'Chuleta de cerdo', category: 'Carnes', calories: 216, proteinG: 19.3, carbsG: 0, fatG: 15.4, fiberG: 0 },
  { name: 'Panceta de cerdo fresca', category: 'Carnes', calories: 458, proteinG: 12.0, carbsG: 0, fatG: 46.0, fiberG: 0 },
  { name: 'Magro de cerdo', category: 'Carnes', calories: 155, proteinG: 20.5, carbsG: 0, fatG: 8.2, fiberG: 0 },
  { name: 'Presa ibérica', category: 'Carnes', calories: 230, proteinG: 19.0, carbsG: 0, fatG: 17.0, fiberG: 0 },
  { name: 'Secreto ibérico', category: 'Carnes', calories: 310, proteinG: 16.5, carbsG: 0, fatG: 27.0, fiberG: 0 },
  { name: 'Pluma ibérica', category: 'Carnes', calories: 245, proteinG: 18.5, carbsG: 0, fatG: 19.0, fiberG: 0 },
  { name: 'Jamón serrano curado', category: 'Carnes', calories: 241, proteinG: 30.5, carbsG: 0.1, fatG: 13.0, fiberG: 0 },
  { name: 'Jamón ibérico de bellota 100%', category: 'Carnes', calories: 375, proteinG: 33.2, carbsG: 0.2, fatG: 27.0, fiberG: 0 },
  { name: 'Jamón cocido extra (York)', category: 'Carnes', calories: 105, proteinG: 18.5, carbsG: 1.2, fatG: 2.8, fiberG: 0 },
  { name: 'Chorizo curado español', category: 'Carnes', calories: 455, proteinG: 21.0, carbsG: 1.5, fatG: 41.0, fiberG: 0 },
  { name: 'Chorizo fresco para cocinar', category: 'Carnes', calories: 360, proteinG: 15.0, carbsG: 2.0, fatG: 33.0, fiberG: 0 },
  { name: 'Salchichón ibérico', category: 'Carnes', calories: 440, proteinG: 25.8, carbsG: 1.0, fatG: 37.0, fiberG: 0 },
  { name: 'Fuet espetec', category: 'Carnes', calories: 430, proteinG: 27.0, carbsG: 2.5, fatG: 35.0, fiberG: 0 },
  { name: 'Morcilla de Burgos (con arroz)', category: 'Carnes', calories: 260, proteinG: 8.5, carbsG: 18.0, fatG: 17.5, fiberG: 1.0 },
  { name: 'Morcilla de cebolla', category: 'Carnes', calories: 310, proteinG: 10.2, carbsG: 4.5, fatG: 28.0, fiberG: 0.8 },
  { name: 'Longaniza fresca de cerdo', category: 'Carnes', calories: 285, proteinG: 16.5, carbsG: 1.2, fatG: 24.0, fiberG: 0 },
  { name: 'Lomo embuchado', category: 'Carnes', calories: 205, proteinG: 38.0, carbsG: 0.8, fatG: 5.7, fiberG: 0 },
  { name: 'Lomo adobado a la plancha', category: 'Carnes', calories: 180, proteinG: 26.0, carbsG: 1.0, fatG: 8.0, fiberG: 0 },
  { name: 'Sobrasada de Mallorca', category: 'Carnes', calories: 590, proteinG: 10.0, carbsG: 1.5, fatG: 62.0, fiberG: 0 },
  { name: 'Chicharrones de cerdo', category: 'Carnes', calories: 544, proteinG: 61.3, carbsG: 0, fatG: 31.3, fiberG: 0 },
  { name: 'Tocino ibérico curado', category: 'Carnes', calories: 780, proteinG: 5.0, carbsG: 0, fatG: 85.0, fiberG: 0 },

  // Cordero
  { name: 'Pierna de cordero', category: 'Carnes', calories: 215, proteinG: 19.5, carbsG: 0, fatG: 15.2, fiberG: 0 },
  { name: 'Chuletas de cordero lechal', category: 'Carnes', calories: 255, proteinG: 18.0, carbsG: 0, fatG: 20.5, fiberG: 0 },
  { name: 'Paletilla de cordero asada', category: 'Carnes', calories: 260, proteinG: 22.0, carbsG: 0, fatG: 19.0, fiberG: 0 },
  { name: 'Costillar de cordero', category: 'Carnes', calories: 282, proteinG: 16.8, carbsG: 0, fatG: 23.8, fiberG: 0 },
  { name: 'Falda de cordero', category: 'Carnes', calories: 305, proteinG: 15.5, carbsG: 0, fatG: 27.0, fiberG: 0 },

  // Pavo
  { name: 'Pechuga de pavo cruda', category: 'Carnes', calories: 105, proteinG: 24.0, carbsG: 0, fatG: 1.0, fiberG: 0 },
  { name: 'Pechuga de pavo a la plancha', category: 'Carnes', calories: 135, proteinG: 30.0, carbsG: 0, fatG: 1.7, fiberG: 0 },
  { name: 'Muslo de pavo sin piel', category: 'Carnes', calories: 144, proteinG: 20.5, carbsG: 0, fatG: 7.0, fiberG: 0 },
  { name: 'Pavo entero asado', category: 'Carnes', calories: 189, proteinG: 28.5, carbsG: 0, fatG: 7.4, fiberG: 0 },
  { name: 'Fiambre de pechuga de pavo extra', category: 'Carnes', calories: 88, proteinG: 17.5, carbsG: 2.0, fatG: 1.1, fiberG: 0 },
  { name: 'Carne picada de pavo', category: 'Carnes', calories: 130, proteinG: 22.0, carbsG: 0, fatG: 4.7, fiberG: 0 },
  { name: 'Solomillo de pavo', category: 'Carnes', calories: 108, proteinG: 23.5, carbsG: 0, fatG: 1.5, fiberG: 0 },

  // Conejo, codorniz, pato y otros
  { name: 'Carne de conejo', category: 'Carnes', calories: 136, proteinG: 21.8, carbsG: 0, fatG: 5.4, fiberG: 0 },
  { name: 'Pierna de conejo asada', category: 'Carnes', calories: 162, proteinG: 26.0, carbsG: 0, fatG: 6.4, fiberG: 0 },
  { name: 'Codorniz entera', category: 'Carnes', calories: 192, proteinG: 21.8, carbsG: 0, fatG: 11.5, fiberG: 0 },
  { name: 'Pechuga de codorniz', category: 'Carnes', calories: 130, proteinG: 25.0, carbsG: 0, fatG: 3.2, fiberG: 0 },
  { name: 'Magret de pato fresco', category: 'Carnes', calories: 201, proteinG: 19.9, carbsG: 0, fatG: 13.5, fiberG: 0 },
  { name: 'Magret de pato a la plancha sin piel', category: 'Carnes', calories: 140, proteinG: 28.0, carbsG: 0, fatG: 3.0, fiberG: 0 },
  { name: 'Confit de pato (muslo)', category: 'Carnes', calories: 337, proteinG: 21.0, carbsG: 0, fatG: 28.5, fiberG: 0 },
  { name: 'Foie gras de pato', category: 'Carnes', calories: 462, proteinG: 11.4, carbsG: 4.7, fatG: 44.0, fiberG: 0 },
  { name: 'Hígado de cerdo', category: 'Carnes', calories: 134, proteinG: 21.4, carbsG: 2.5, fatG: 4.4, fiberG: 0 }
];

const pescadosYMariscos = [
  // Pescados blancos
  { name: 'Merluza fresca', category: 'Pescados y Mariscos', calories: 72, proteinG: 16.5, carbsG: 0, fatG: 0.8, fiberG: 0 },
  { name: 'Merluza a la plancha', category: 'Pescados y Mariscos', calories: 112, proteinG: 22.0, carbsG: 0, fatG: 2.6, fiberG: 0 },
  { name: 'Bacalao fresco', category: 'Pescados y Mariscos', calories: 82, proteinG: 17.8, carbsG: 0, fatG: 0.7, fiberG: 0 },
  { name: 'Bacalao desalado', category: 'Pescados y Mariscos', calories: 77, proteinG: 17.5, carbsG: 0, fatG: 0.8, fiberG: 0 },
  { name: 'Lenguado fresco', category: 'Pescados y Mariscos', calories: 86, proteinG: 17.5, carbsG: 0, fatG: 1.5, fiberG: 0 },
  { name: 'Lenguado a la plancha', category: 'Pescados y Mariscos', calories: 110, proteinG: 23.0, carbsG: 0, fatG: 2.0, fiberG: 0 },
  { name: 'Rape fresco', category: 'Pescados y Mariscos', calories: 76, proteinG: 14.9, carbsG: 0, fatG: 1.8, fiberG: 0 },
  { name: 'Lubina fresca (salvaje)', category: 'Pescados y Mariscos', calories: 98, proteinG: 19.3, carbsG: 0, fatG: 2.0, fiberG: 0 },
  { name: 'Lubina al horno', category: 'Pescados y Mariscos', calories: 124, proteinG: 23.5, carbsG: 0, fatG: 3.3, fiberG: 0 },
  { name: 'Dorada fresca', category: 'Pescados y Mariscos', calories: 96, proteinG: 19.8, carbsG: 0, fatG: 1.9, fiberG: 0 },
  { name: 'Dorada a la sal', category: 'Pescados y Mariscos', calories: 130, proteinG: 24.5, carbsG: 0, fatG: 3.5, fiberG: 0 },
  { name: 'Besugo fresco', category: 'Pescados y Mariscos', calories: 91, proteinG: 17.2, carbsG: 0, fatG: 2.4, fiberG: 0 },
  { name: 'Rodaballo fresco', category: 'Pescados y Mariscos', calories: 95, proteinG: 16.1, carbsG: 0, fatG: 3.0, fiberG: 0 },
  { name: 'Mero fresco', category: 'Pescados y Mariscos', calories: 92, proteinG: 19.4, carbsG: 0, fatG: 1.3, fiberG: 0 },
  { name: 'Gallo fresco', category: 'Pescados y Mariscos', calories: 82, proteinG: 16.8, carbsG: 0, fatG: 1.6, fiberG: 0 },
  { name: 'Pescadilla fresca', category: 'Pescados y Mariscos', calories: 73, proteinG: 16.6, carbsG: 0, fatG: 0.7, fiberG: 0 },
  { name: 'Panga fresca', category: 'Pescados y Mariscos', calories: 79, proteinG: 15.0, carbsG: 0, fatG: 2.0, fiberG: 0 },
  { name: 'Corvina fresca', category: 'Pescados y Mariscos', calories: 94, proteinG: 18.5, carbsG: 0, fatG: 2.2, fiberG: 0 },
  { name: 'Raya fresca', category: 'Pescados y Mariscos', calories: 68, proteinG: 14.2, carbsG: 0, fatG: 0.9, fiberG: 0 },
  { name: 'Abadejo fresco', category: 'Pescados y Mariscos', calories: 81, proteinG: 17.5, carbsG: 0, fatG: 0.9, fiberG: 0 },
  { name: 'Pargo fresco', category: 'Pescados y Mariscos', calories: 100, proteinG: 20.5, carbsG: 0, fatG: 1.7, fiberG: 0 },

  // Pescados azules
  { name: 'Salmón fresco', category: 'Pescados y Mariscos', calories: 208, proteinG: 20.4, carbsG: 0, fatG: 13.4, fiberG: 0 },
  { name: 'Salmón a la plancha', category: 'Pescados y Mariscos', calories: 232, proteinG: 25.0, carbsG: 0, fatG: 14.6, fiberG: 0 },
  { name: 'Salmón ahumado', category: 'Pescados y Mariscos', calories: 182, proteinG: 22.0, carbsG: 0.5, fatG: 10.2, fiberG: 0 },
  { name: 'Atún fresco', category: 'Pescados y Mariscos', calories: 130, proteinG: 23.3, carbsG: 0, fatG: 4.0, fiberG: 0 },
  { name: 'Atún rojo a la plancha', category: 'Pescados y Mariscos', calories: 184, proteinG: 29.9, carbsG: 0, fatG: 6.3, fiberG: 0 },
  { name: 'Sardina fresca', category: 'Pescados y Mariscos', calories: 153, proteinG: 17.9, carbsG: 0, fatG: 9.1, fiberG: 0 },
  { name: 'Sardinas a la plancha o brasas', category: 'Pescados y Mariscos', calories: 198, proteinG: 24.6, carbsG: 0, fatG: 11.2, fiberG: 0 },
  { name: 'Caballa fresca (verdel)', category: 'Pescados y Mariscos', calories: 189, proteinG: 18.7, carbsG: 0, fatG: 12.5, fiberG: 0 },
  { name: 'Bonito del norte fresco', category: 'Pescados y Mariscos', calories: 138, proteinG: 23.8, carbsG: 0, fatG: 4.8, fiberG: 0 },
  { name: 'Pez espada (emperador) fresco', category: 'Pescados y Mariscos', calories: 144, proteinG: 19.8, carbsG: 0, fatG: 7.0, fiberG: 0 },
  { name: 'Boquerón fresco crudo', category: 'Pescados y Mariscos', calories: 131, proteinG: 20.4, carbsG: 0, fatG: 4.9, fiberG: 0 },
  { name: 'Boquerones en vinagre', category: 'Pescados y Mariscos', calories: 142, proteinG: 17.5, carbsG: 1.5, fatG: 7.2, fiberG: 0 },
  { name: 'Trucha fresca', category: 'Pescados y Mariscos', calories: 141, proteinG: 19.9, carbsG: 0, fatG: 6.6, fiberG: 0 },
  { name: 'Anguila fresca', category: 'Pescados y Mariscos', calories: 236, proteinG: 15.0, carbsG: 0, fatG: 19.2, fiberG: 0 },
  { name: 'Arenque fresco', category: 'Pescados y Mariscos', calories: 158, proteinG: 18.0, carbsG: 0, fatG: 9.6, fiberG: 0 },
  { name: 'Jurel (chicharro) fresco', category: 'Pescados y Mariscos', calories: 127, proteinG: 19.7, carbsG: 0, fatG: 5.3, fiberG: 0 },
  { name: 'Melva fresca', category: 'Pescados y Mariscos', calories: 137, proteinG: 23.0, carbsG: 0, fatG: 5.0, fiberG: 0 },
  { name: 'Palometa fresca', category: 'Pescados y Mariscos', calories: 125, proteinG: 20.0, carbsG: 0, fatG: 5.0, fiberG: 0 },

  // Mariscos y cefalópodos
  { name: 'Gambas frescas crudas', category: 'Pescados y Mariscos', calories: 85, proteinG: 18.1, carbsG: 0.9, fatG: 0.9, fiberG: 0 },
  { name: 'Gambas cocidas', category: 'Pescados y Mariscos', calories: 99, proteinG: 20.9, carbsG: 0, fatG: 1.1, fiberG: 0 },
  { name: 'Gambón a la plancha', category: 'Pescados y Mariscos', calories: 105, proteinG: 21.5, carbsG: 0.5, fatG: 1.8, fiberG: 0 },
  { name: 'Langostinos cocidos', category: 'Pescados y Mariscos', calories: 103, proteinG: 21.0, carbsG: 0.8, fatG: 1.4, fiberG: 0 },
  { name: 'Mejillones frescos crudos', category: 'Pescados y Mariscos', calories: 67, proteinG: 10.8, carbsG: 3.4, fatG: 1.9, fiberG: 0 },
  { name: 'Mejillones al vapor', category: 'Pescados y Mariscos', calories: 86, proteinG: 12.8, carbsG: 3.7, fatG: 2.2, fiberG: 0 },
  { name: 'Almejas crudas', category: 'Pescados y Mariscos', calories: 48, proteinG: 10.7, carbsG: 0.5, fatG: 0.5, fiberG: 0 },
  { name: 'Chirlas frescas', category: 'Pescados y Mariscos', calories: 47, proteinG: 10.0, carbsG: 0.8, fatG: 0.5, fiberG: 0 },
  { name: 'Berberechos frescos al vapor', category: 'Pescados y Mariscos', calories: 47, proteinG: 10.2, carbsG: 0.5, fatG: 0.5, fiberG: 0 },
  { name: 'Calamar fresco', category: 'Pescados y Mariscos', calories: 80, proteinG: 16.1, carbsG: 1.3, fatG: 1.4, fiberG: 0 },
  { name: 'Calamar a la plancha', category: 'Pescados y Mariscos', calories: 110, proteinG: 21.0, carbsG: 1.5, fatG: 2.3, fiberG: 0 },
  { name: 'Pulpo crudo', category: 'Pescados y Mariscos', calories: 82, proteinG: 14.9, carbsG: 2.2, fatG: 1.0, fiberG: 0 },
  { name: 'Pulpo cocido (á feira)', category: 'Pescados y Mariscos', calories: 112, proteinG: 20.0, carbsG: 2.5, fatG: 2.1, fiberG: 0 },
  { name: 'Sepia fresca', category: 'Pescados y Mariscos', calories: 75, proteinG: 16.1, carbsG: 0.7, fatG: 0.9, fiberG: 0 },
  { name: 'Sepia a la plancha', category: 'Pescados y Mariscos', calories: 102, proteinG: 20.5, carbsG: 1.0, fatG: 1.8, fiberG: 0 },
  { name: 'Chipirones frescos', category: 'Pescados y Mariscos', calories: 82, proteinG: 16.5, carbsG: 1.0, fatG: 1.3, fiberG: 0 },
  { name: 'Vieiras frescas', category: 'Pescados y Mariscos', calories: 69, proteinG: 12.1, carbsG: 2.4, fatG: 0.8, fiberG: 0 },
  { name: 'Nécoras cocidas', category: 'Pescados y Mariscos', calories: 87, proteinG: 18.2, carbsG: 0, fatG: 1.4, fiberG: 0 },
  { name: 'Bogavante cocido', category: 'Pescados y Mariscos', calories: 89, proteinG: 19.0, carbsG: 0.5, fatG: 0.9, fiberG: 0 },
  { name: 'Buey de mar cocido', category: 'Pescados y Mariscos', calories: 92, proteinG: 18.5, carbsG: 0, fatG: 1.8, fiberG: 0 },
  { name: 'Ostras frescas', category: 'Pescados y Mariscos', calories: 51, proteinG: 7.0, carbsG: 2.7, fatG: 1.2, fiberG: 0 },
  { name: 'Centollo cocido', category: 'Pescados y Mariscos', calories: 88, proteinG: 18.0, carbsG: 0.5, fatG: 1.3, fiberG: 0 },
  { name: 'Navajas frescas', category: 'Pescados y Mariscos', calories: 68, proteinG: 13.5, carbsG: 1.2, fatG: 0.9, fiberG: 0 },
  { name: 'Cigalas cocidas', category: 'Pescados y Mariscos', calories: 85, proteinG: 17.6, carbsG: 0, fatG: 1.2, fiberG: 0 },
  { name: 'Carabineros cocidos', category: 'Pescados y Mariscos', calories: 95, proteinG: 20.0, carbsG: 0, fatG: 1.5, fiberG: 0 },

  // Conservas
  { name: 'Atún claro en aceite de oliva en lata', category: 'Pescados y Mariscos', calories: 198, proteinG: 26.5, carbsG: 0, fatG: 10.2, fiberG: 0 },
  { name: 'Atún claro al natural en lata', category: 'Pescados y Mariscos', calories: 101, proteinG: 23.5, carbsG: 0, fatG: 0.8, fiberG: 0 },
  { name: 'Atún claro en aceite de girasol en lata', category: 'Pescados y Mariscos', calories: 190, proteinG: 26.0, carbsG: 0, fatG: 9.5, fiberG: 0 },
  { name: 'Bonito del norte en aceite de oliva en lata', category: 'Pescados y Mariscos', calories: 210, proteinG: 27.0, carbsG: 0, fatG: 11.0, fiberG: 0 },
  { name: 'Ventresca de atún en aceite de oliva en lata', category: 'Pescados y Mariscos', calories: 245, proteinG: 23.0, carbsG: 0, fatG: 17.0, fiberG: 0 },
  { name: 'Sardinas en aceite de oliva en lata', category: 'Pescados y Mariscos', calories: 215, proteinG: 24.0, carbsG: 0, fatG: 13.0, fiberG: 0 },
  { name: 'Sardinillas en aceite de oliva en lata', category: 'Pescados y Mariscos', calories: 220, proteinG: 24.5, carbsG: 0, fatG: 13.5, fiberG: 0 },
  { name: 'Sardinas en tomate en lata', category: 'Pescados y Mariscos', calories: 165, proteinG: 18.0, carbsG: 3.5, fatG: 9.0, fiberG: 0.5 },
  { name: 'Caballa en aceite de oliva en lata', category: 'Pescados y Mariscos', calories: 210, proteinG: 22.0, carbsG: 0, fatG: 13.5, fiberG: 0 },
  { name: 'Berberechos al natural en lata', category: 'Pescados y Mariscos', calories: 54, proteinG: 11.5, carbsG: 0.8, fatG: 0.5, fiberG: 0 },
  { name: 'Mejillones en escabeche en lata', category: 'Pescados y Mariscos', calories: 172, proteinG: 15.0, carbsG: 4.8, fatG: 10.2, fiberG: 0 },
  { name: 'Anchoas en aceite de oliva en lata', category: 'Pescados y Mariscos', calories: 210, proteinG: 28.0, carbsG: 0.2, fatG: 10.8, fiberG: 0 },
  { name: 'Calamares en su tinta en lata', category: 'Pescados y Mariscos', calories: 145, proteinG: 14.5, carbsG: 4.2, fatG: 7.8, fiberG: 0.3 }
];

const huevosYLacteos = [
  // Huevos
  { name: 'Huevo de gallina entero fresco', category: 'Huevos y Lácteos', calories: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5, fiberG: 0 },
  { name: 'Huevo cocido / duro', category: 'Huevos y Lácteos', calories: 155, proteinG: 13.0, carbsG: 1.1, fatG: 10.6, fiberG: 0 },
  { name: 'Huevo frito con aceite de oliva', category: 'Huevos y Lácteos', calories: 200, proteinG: 13.5, carbsG: 0.8, fatG: 15.5, fiberG: 0 },
  { name: 'Huevo escalfado / poché', category: 'Huevos y Lácteos', calories: 143, proteinG: 12.5, carbsG: 0.7, fatG: 9.5, fiberG: 0 },
  { name: 'Clara de huevo fresca', category: 'Huevos y Lácteos', calories: 52, proteinG: 11.0, carbsG: 0.7, fatG: 0.2, fiberG: 0 },
  { name: 'Yema de huevo fresca', category: 'Huevos y Lácteos', calories: 322, proteinG: 16.0, carbsG: 3.6, fatG: 26.5, fiberG: 0 },
  { name: 'Huevo de codorniz', category: 'Huevos y Lácteos', calories: 158, proteinG: 13.0, carbsG: 0.4, fatG: 11.1, fiberG: 0 },

  // Leches
  { name: 'Leche entera de vaca', category: 'Huevos y Lácteos', calories: 63, proteinG: 3.2, carbsG: 4.7, fatG: 3.6, fiberG: 0 },
  { name: 'Leche semidesnatada de vaca', category: 'Huevos y Lácteos', calories: 46, proteinG: 3.3, carbsG: 4.8, fatG: 1.6, fiberG: 0 },
  { name: 'Leche desnatada de vaca', category: 'Huevos y Lácteos', calories: 34, proteinG: 3.4, carbsG: 4.9, fatG: 0.2, fiberG: 0 },
  { name: 'Leche sin lactosa entera', category: 'Huevos y Lácteos', calories: 62, proteinG: 3.1, carbsG: 4.7, fatG: 3.5, fiberG: 0 },
  { name: 'Leche sin lactosa desnatada', category: 'Huevos y Lácteos', calories: 34, proteinG: 3.4, carbsG: 4.8, fatG: 0.2, fiberG: 0 },
  { name: 'Leche de cabra', category: 'Huevos y Lácteos', calories: 69, proteinG: 3.6, carbsG: 4.5, fatG: 4.1, fiberG: 0 },
  { name: 'Leche de oveja', category: 'Huevos y Lácteos', calories: 108, proteinG: 5.6, carbsG: 5.4, fatG: 7.0, fiberG: 0 },
  { name: 'Leche evaporada entera', category: 'Huevos y Lácteos', calories: 134, proteinG: 6.8, carbsG: 10.0, fatG: 7.5, fiberG: 0 },
  { name: 'Leche condensada tradicional', category: 'Huevos y Lácteos', calories: 321, proteinG: 7.9, carbsG: 54.4, fatG: 8.7, fiberG: 0 },

  // Yogures y fermentados
  { name: 'Yogur natural entero', category: 'Huevos y Lácteos', calories: 61, proteinG: 3.5, carbsG: 4.7, fatG: 3.3, fiberG: 0 },
  { name: 'Yogur natural desnatado 0%', category: 'Huevos y Lácteos', calories: 38, proteinG: 4.3, carbsG: 4.8, fatG: 0.1, fiberG: 0 },
  { name: 'Yogur griego natural entero', category: 'Huevos y Lácteos', calories: 115, proteinG: 6.5, carbsG: 4.0, fatG: 9.0, fiberG: 0 },
  { name: 'Yogur griego natural desnatado 0%', category: 'Huevos y Lácteos', calories: 58, proteinG: 10.0, carbsG: 3.6, fatG: 0.2, fiberG: 0 },
  { name: 'Kéfir natural entero', category: 'Huevos y Lácteos', calories: 64, proteinG: 3.5, carbsG: 4.8, fatG: 3.5, fiberG: 0 },
  { name: 'Kéfir natural desnatado', category: 'Huevos y Lácteos', calories: 36, proteinG: 3.7, carbsG: 4.6, fatG: 0.3, fiberG: 0 },
  { name: 'Cuajada de leche pasteurizada', category: 'Huevos y Lácteos', calories: 92, proteinG: 4.5, carbsG: 5.2, fatG: 6.0, fiberG: 0 },
  { name: 'Queso batido desnatado 0%', category: 'Huevos y Lácteos', calories: 47, proteinG: 8.5, carbsG: 3.5, fatG: 0.1, fiberG: 0 },

  // Quesos
  { name: 'Queso fresco tipo Burgos', category: 'Huevos y Lácteos', calories: 174, proteinG: 11.0, carbsG: 3.1, fatG: 13.0, fiberG: 0 },
  { name: 'Queso fresco 0% desnatado', category: 'Huevos y Lácteos', calories: 72, proteinG: 12.5, carbsG: 4.0, fatG: 0.5, fiberG: 0 },
  { name: 'Requesón tradicional', category: 'Huevos y Lácteos', calories: 98, proteinG: 11.3, carbsG: 3.2, fatG: 4.3, fiberG: 0 },
  { name: 'Ricotta de vaca', category: 'Huevos y Lácteos', calories: 140, proteinG: 8.8, carbsG: 4.0, fatG: 10.0, fiberG: 0 },
  { name: 'Queso curado manchego', category: 'Huevos y Lácteos', calories: 420, proteinG: 29.0, carbsG: 0.5, fatG: 34.0, fiberG: 0 },
  { name: 'Queso semicurado de mezcla', category: 'Huevos y Lácteos', calories: 380, proteinG: 26.0, carbsG: 1.0, fatG: 30.5, fiberG: 0 },
  { name: 'Queso tierno de vaca', category: 'Huevos y Lácteos', calories: 330, proteinG: 23.0, carbsG: 1.2, fatG: 26.0, fiberG: 0 },
  { name: 'Mozzarella fresca (bola)', category: 'Huevos y Lácteos', calories: 250, proteinG: 18.0, carbsG: 1.5, fatG: 19.0, fiberG: 0 },
  { name: 'Mozzarella rallada', category: 'Huevos y Lácteos', calories: 300, proteinG: 25.0, carbsG: 2.5, fatG: 21.5, fiberG: 0 },
  { name: 'Queso Parmesano (Parmigiano Reggiano)', category: 'Huevos y Lácteos', calories: 431, proteinG: 38.5, carbsG: 4.1, fatG: 28.6, fiberG: 0 },
  { name: 'Queso Grana Padano', category: 'Huevos y Lácteos', calories: 398, proteinG: 33.0, carbsG: 0, fatG: 29.0, fiberG: 0 },
  { name: 'Queso Gouda', category: 'Huevos y Lácteos', calories: 356, proteinG: 24.9, carbsG: 2.2, fatG: 27.4, fiberG: 0 },
  { name: 'Queso Emmental', category: 'Huevos y Lácteos', calories: 380, proteinG: 28.5, carbsG: 0.5, fatG: 29.5, fiberG: 0 },
  { name: 'Queso Cheddar', category: 'Huevos y Lácteos', calories: 403, proteinG: 24.9, carbsG: 1.3, fatG: 33.1, fiberG: 0 },
  { name: 'Queso Brie', category: 'Huevos y Lácteos', calories: 334, proteinG: 20.7, carbsG: 0.5, fatG: 27.7, fiberG: 0 },
  { name: 'Queso Camembert', category: 'Huevos y Lácteos', calories: 300, proteinG: 19.8, carbsG: 0.5, fatG: 24.3, fiberG: 0 },
  { name: 'Queso rulo de cabra', category: 'Huevos y Lácteos', calories: 290, proteinG: 18.5, carbsG: 1.0, fatG: 23.5, fiberG: 0 },
  { name: 'Queso Feta', category: 'Huevos y Lácteos', calories: 264, proteinG: 14.2, carbsG: 4.1, fatG: 21.3, fiberG: 0 },
  { name: 'Queso azul tradicional', category: 'Huevos y Lácteos', calories: 353, proteinG: 21.4, carbsG: 2.3, fatG: 28.7, fiberG: 0 },
  { name: 'Queso Roquefort', category: 'Huevos y Lácteos', calories: 369, proteinG: 21.5, carbsG: 2.0, fatG: 30.6, fiberG: 0 },
  { name: 'Queso crema para untar (tipo Philadelphia)', category: 'Huevos y Lácteos', calories: 245, proteinG: 5.5, carbsG: 4.0, fatG: 23.5, fiberG: 0 },
  { name: 'Queso crema light para untar', category: 'Huevos y Lácteos', calories: 140, proteinG: 8.5, carbsG: 5.5, fatG: 9.5, fiberG: 0 },
  { name: 'Queso Mascarpone', category: 'Huevos y Lácteos', calories: 412, proteinG: 4.2, carbsG: 3.5, fatG: 43.5, fiberG: 0 },
  { name: 'Queso Havarti', category: 'Huevos y Lácteos', calories: 371, proteinG: 21.5, carbsG: 1.0, fatG: 31.0, fiberG: 0 },
  { name: 'Queso Provolone', category: 'Huevos y Lácteos', calories: 351, proteinG: 25.5, carbsG: 2.1, fatG: 26.6, fiberG: 0 },

  // Natas y grasas lácteas
  { name: 'Nata líquida para cocinar (18% MG)', category: 'Huevos y Lácteos', calories: 195, proteinG: 2.8, carbsG: 3.8, fatG: 18.5, fiberG: 0 },
  { name: 'Nata para montar (35% MG)', category: 'Huevos y Lácteos', calories: 345, proteinG: 2.2, carbsG: 3.2, fatG: 36.0, fiberG: 0 },
  { name: 'Nata montada azucarada en spray', category: 'Huevos y Lácteos', calories: 285, proteinG: 2.0, carbsG: 12.0, fatG: 25.5, fiberG: 0 },
  { name: 'Mantequilla con sal', category: 'Huevos y Lácteos', calories: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81.1, fiberG: 0 },
  { name: 'Mantequilla sin sal tradicional', category: 'Huevos y Lácteos', calories: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81.1, fiberG: 0 }
];

const cerealesYDerivados = [
  // Arroces
  { name: 'Arroz blanco crudo', category: 'Cereales y Derivados', calories: 360, proteinG: 7.0, carbsG: 79.0, fatG: 0.7, fiberG: 1.3 },
  { name: 'Arroz blanco cocido', category: 'Cereales y Derivados', calories: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3, fiberG: 0.4 },
  { name: 'Arroz integral crudo', category: 'Cereales y Derivados', calories: 362, proteinG: 7.5, carbsG: 76.2, fatG: 2.7, fiberG: 3.5 },
  { name: 'Arroz integral cocido', category: 'Cereales y Derivados', calories: 123, proteinG: 2.7, carbsG: 25.6, fatG: 1.0, fiberG: 1.8 },
  { name: 'Arroz basmati crudo', category: 'Cereales y Derivados', calories: 350, proteinG: 8.0, carbsG: 77.0, fatG: 0.6, fiberG: 1.5 },
  { name: 'Arroz basmati cocido', category: 'Cereales y Derivados', calories: 121, proteinG: 3.5, carbsG: 25.2, fatG: 0.4, fiberG: 0.6 },
  { name: 'Arroz salvaje crudo', category: 'Cereales y Derivados', calories: 357, proteinG: 14.7, carbsG: 74.9, fatG: 1.1, fiberG: 6.2 },
  { name: 'Arroz salvaje cocido', category: 'Cereales y Derivados', calories: 101, proteinG: 4.0, carbsG: 21.3, fatG: 0.3, fiberG: 1.8 },
  { name: 'Arroz bomba crudo', category: 'Cereales y Derivados', calories: 355, proteinG: 7.2, carbsG: 78.5, fatG: 0.8, fiberG: 1.4 },

  // Pastas
  { name: 'Pasta de trigo tradicional cruda', category: 'Cereales y Derivados', calories: 371, proteinG: 13.0, carbsG: 74.7, fatG: 1.5, fiberG: 3.2 },
  { name: 'Pasta de trigo tradicional cocida', category: 'Cereales y Derivados', calories: 131, proteinG: 5.2, carbsG: 25.0, fatG: 0.8, fiberG: 1.4 },
  { name: 'Espaguetis cocidos', category: 'Cereales y Derivados', calories: 131, proteinG: 5.2, carbsG: 25.0, fatG: 0.8, fiberG: 1.4 },
  { name: 'Macarrones cocidos', category: 'Cereales y Derivados', calories: 131, proteinG: 5.2, carbsG: 25.0, fatG: 0.8, fiberG: 1.4 },
  { name: 'Pasta integral cruda', category: 'Cereales y Derivados', calories: 348, proteinG: 14.6, carbsG: 64.2, fatG: 2.5, fiberG: 9.0 },
  { name: 'Pasta integral cocida', category: 'Cereales y Derivados', calories: 124, proteinG: 5.3, carbsG: 22.8, fatG: 0.9, fiberG: 3.9 },
  { name: 'Tallarines al huevo crudos', category: 'Cereales y Derivados', calories: 384, proteinG: 14.2, carbsG: 71.0, fatG: 4.4, fiberG: 3.0 },
  { name: 'Fideos de arroz crudos', category: 'Cereales y Derivados', calories: 364, proteinG: 3.4, carbsG: 82.0, fatG: 0.6, fiberG: 1.6 },
  { name: 'Fideos de arroz cocidos', category: 'Cereales y Derivados', calories: 109, proteinG: 1.0, carbsG: 24.9, fatG: 0.2, fiberG: 1.0 },
  { name: 'Cuscús de trigo crudo', category: 'Cereales y Derivados', calories: 376, proteinG: 12.8, carbsG: 77.4, fatG: 0.6, fiberG: 5.0 },
  { name: 'Cuscús cocido', category: 'Cereales y Derivados', calories: 112, proteinG: 3.8, carbsG: 23.2, fatG: 0.2, fiberG: 1.4 },
  { name: 'Bulgur crudo', category: 'Cereales y Derivados', calories: 342, proteinG: 12.3, carbsG: 75.9, fatG: 1.3, fiberG: 18.3 },
  { name: 'Bulgur cocido', category: 'Cereales y Derivados', calories: 83, proteinG: 3.1, carbsG: 18.6, fatG: 0.2, fiberG: 4.5 },
  { name: 'Quinoa cruda', category: 'Cereales y Derivados', calories: 368, proteinG: 14.1, carbsG: 64.2, fatG: 6.1, fiberG: 7.0 },
  { name: 'Quinoa cocida', category: 'Cereales y Derivados', calories: 120, proteinG: 4.4, carbsG: 21.3, fatG: 1.9, fiberG: 2.8 },
  { name: 'Mijo crudo', category: 'Cereales y Derivados', calories: 378, proteinG: 11.0, carbsG: 73.0, fatG: 4.2, fiberG: 8.5 },
  { name: 'Trigo sarraceno crudo', category: 'Cereales y Derivados', calories: 343, proteinG: 13.3, carbsG: 71.5, fatG: 3.4, fiberG: 10.0 },
  { name: 'Trigo sarraceno cocido', category: 'Cereales y Derivados', calories: 92, proteinG: 3.4, carbsG: 19.9, fatG: 0.6, fiberG: 2.7 },
  { name: 'Amaranto en grano crudo', category: 'Cereales y Derivados', calories: 371, proteinG: 13.6, carbsG: 65.3, fatG: 7.0, fiberG: 6.7 },

  // Panes
  { name: 'Pan blanco de barra común', category: 'Cereales y Derivados', calories: 265, proteinG: 9.0, carbsG: 51.5, fatG: 1.2, fiberG: 2.7 },
  { name: 'Baguette tradicional', category: 'Cereales y Derivados', calories: 270, proteinG: 9.5, carbsG: 53.0, fatG: 1.1, fiberG: 2.5 },
  { name: 'Pan integral de trigo', category: 'Cereales y Derivados', calories: 247, proteinG: 13.0, carbsG: 41.3, fatG: 3.4, fiberG: 7.0 },
  { name: 'Pan de centeno 100%', category: 'Cereales y Derivados', calories: 226, proteinG: 8.5, carbsG: 44.0, fatG: 1.7, fiberG: 8.0 },
  { name: 'Pan de molde blanco', category: 'Cereales y Derivados', calories: 266, proteinG: 8.9, carbsG: 49.0, fatG: 3.3, fiberG: 2.7 },
  { name: 'Pan de molde integral', category: 'Cereales y Derivados', calories: 245, proteinG: 10.2, carbsG: 43.0, fatG: 3.5, fiberG: 6.5 },
  { name: 'Pan de chapata', category: 'Cereales y Derivados', calories: 272, proteinG: 9.2, carbsG: 53.0, fatG: 1.8, fiberG: 2.8 },
  { name: 'Pan de masa madre', category: 'Cereales y Derivados', calories: 240, proteinG: 8.8, carbsG: 48.0, fatG: 1.2, fiberG: 3.2 },
  { name: 'Pan de espelta integral', category: 'Cereales y Derivados', calories: 250, proteinG: 11.5, carbsG: 45.0, fatG: 2.6, fiberG: 6.8 },
  { name: 'Pan de pita blanco', category: 'Cereales y Derivados', calories: 275, proteinG: 9.1, carbsG: 55.7, fatG: 1.2, fiberG: 2.2 },
  { name: 'Pan tostado biscote', category: 'Cereales y Derivados', calories: 388, proteinG: 11.0, carbsG: 74.0, fatG: 4.5, fiberG: 4.0 },
  { name: 'Pan tostado integral', category: 'Cereales y Derivados', calories: 375, proteinG: 13.5, carbsG: 66.0, fatG: 4.8, fiberG: 8.5 },
  { name: 'Picos de pan / Colines / Regañás', category: 'Cereales y Derivados', calories: 415, proteinG: 10.5, carbsG: 72.0, fatG: 8.5, fiberG: 3.8 },
  { name: 'Pan rallado tradicional', category: 'Cereales y Derivados', calories: 351, proteinG: 12.0, carbsG: 70.0, fatG: 1.8, fiberG: 4.5 },

  // Copos y harinas
  { name: 'Copos de avena suaves', category: 'Cereales y Derivados', calories: 375, proteinG: 13.5, carbsG: 58.7, fatG: 7.0, fiberG: 10.0 },
  { name: 'Copos de avena integrales gruesos', category: 'Cereales y Derivados', calories: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9, fiberG: 10.6 },
  { name: 'Salvado de avena', category: 'Cereales y Derivados', calories: 246, proteinG: 17.3, carbsG: 66.2, fatG: 7.0, fiberG: 15.4 },
  { name: 'Salvado de trigo', category: 'Cereales y Derivados', calories: 216, proteinG: 15.5, carbsG: 64.5, fatG: 4.3, fiberG: 42.8 },
  { name: 'Copos de maíz tostados (Corn Flakes)', category: 'Cereales y Derivados', calories: 378, proteinG: 7.5, carbsG: 84.0, fatG: 0.9, fiberG: 3.0 },
  { name: 'Muesli tradicional sin azúcar añadido', category: 'Cereales y Derivados', calories: 365, proteinG: 11.0, carbsG: 63.0, fatG: 6.5, fiberG: 9.5 },
  { name: 'Granola artesanal con frutos secos', category: 'Cereales y Derivados', calories: 450, proteinG: 12.0, carbsG: 55.0, fatG: 19.0, fiberG: 8.0 },
  { name: 'Harina de trigo blanca común', category: 'Cereales y Derivados', calories: 364, proteinG: 10.3, carbsG: 76.3, fatG: 1.0, fiberG: 2.7 },
  { name: 'Harina de trigo integral', category: 'Cereales y Derivados', calories: 340, proteinG: 13.2, carbsG: 72.0, fatG: 2.5, fiberG: 10.7 },
  { name: 'Harina de avena integral', category: 'Cereales y Derivados', calories: 370, proteinG: 14.0, carbsG: 59.0, fatG: 7.2, fiberG: 9.8 },
  { name: 'Harina de maíz refinada (Maizena)', category: 'Cereales y Derivados', calories: 355, proteinG: 0.5, carbsG: 87.0, fatG: 0.1, fiberG: 1.0 },
  { name: 'Harina de centeno', category: 'Cereales y Derivados', calories: 335, proteinG: 10.0, carbsG: 68.0, fatG: 1.8, fiberG: 13.0 },
  { name: 'Tortitas de arroz inflado', category: 'Cereales y Derivados', calories: 382, proteinG: 8.0, carbsG: 81.5, fatG: 2.2, fiberG: 3.1 },
  { name: 'Tortitas de maíz inflado', category: 'Cereales y Derivados', calories: 387, proteinG: 8.3, carbsG: 82.0, fatG: 2.3, fiberG: 3.5 }
];

const legumbres = [
  // Lentejas, garbanzos, alubias
  { name: 'Lentejas crudas', category: 'Legumbres', calories: 353, proteinG: 25.8, carbsG: 60.1, fatG: 1.1, fiberG: 10.7 },
  { name: 'Lentejas cocidas de bote', category: 'Legumbres', calories: 116, proteinG: 9.0, carbsG: 20.1, fatG: 0.4, fiberG: 7.9 },
  { name: 'Lentejas pardinas cocidas', category: 'Legumbres', calories: 114, proteinG: 8.8, carbsG: 19.5, fatG: 0.5, fiberG: 7.5 },
  { name: 'Lentejas rojas peladas crudas', category: 'Legumbres', calories: 340, proteinG: 24.5, carbsG: 58.0, fatG: 1.2, fiberG: 8.0 },
  { name: 'Garbanzos crudos', category: 'Legumbres', calories: 364, proteinG: 19.3, carbsG: 60.7, fatG: 6.0, fiberG: 17.4 },
  { name: 'Garbanzos cocidos de bote', category: 'Legumbres', calories: 164, proteinG: 8.9, carbsG: 27.4, fatG: 2.6, fiberG: 7.6 },
  { name: 'Alubias blancas crudas', category: 'Legumbres', calories: 337, proteinG: 22.3, carbsG: 60.8, fatG: 1.5, fiberG: 15.2 },
  { name: 'Alubias blancas cocidas de bote', category: 'Legumbres', calories: 139, proteinG: 9.7, carbsG: 25.1, fatG: 0.5, fiberG: 6.3 },
  { name: 'Alubias rojas crudas', category: 'Legumbres', calories: 333, proteinG: 23.6, carbsG: 60.0, fatG: 0.8, fiberG: 15.0 },
  { name: 'Alubias rojas cocidas', category: 'Legumbres', calories: 127, proteinG: 8.7, carbsG: 22.8, fatG: 0.5, fiberG: 6.4 },
  { name: 'Alubias pintas crudas', category: 'Legumbres', calories: 347, proteinG: 21.4, carbsG: 62.6, fatG: 1.2, fiberG: 15.5 },
  { name: 'Alubias pintas cocidas', category: 'Legumbres', calories: 143, proteinG: 9.0, carbsG: 26.2, fatG: 0.7, fiberG: 9.0 },
  { name: 'Judía azuki cruda', category: 'Legumbres', calories: 329, proteinG: 19.9, carbsG: 63.0, fatG: 0.5, fiberG: 12.7 },
  
  // Guisantes, habas y derivados
  { name: 'Guisantes congelados / hervidos', category: 'Legumbres', calories: 81, proteinG: 5.4, carbsG: 14.5, fatG: 0.4, fiberG: 5.7 },
  { name: 'Guisantes secos partidos crudos', category: 'Legumbres', calories: 341, proteinG: 24.6, carbsG: 60.4, fatG: 1.2, fiberG: 25.5 },
  { name: 'Habas frescas crudas', category: 'Legumbres', calories: 88, proteinG: 7.9, carbsG: 17.6, fatG: 0.7, fiberG: 5.4 },
  { name: 'Habas secas cocidas', category: 'Legumbres', calories: 110, proteinG: 7.6, carbsG: 19.7, fatG: 0.4, fiberG: 5.4 },
  { name: 'Altramuces en salmuera', category: 'Legumbres', calories: 119, proteinG: 15.6, carbsG: 9.9, fatG: 2.9, fiberG: 2.8 },
  
  // Soja y derivados
  { name: 'Soja en grano cruda', category: 'Legumbres', calories: 446, proteinG: 36.5, carbsG: 30.2, fatG: 19.9, fiberG: 9.3 },
  { name: 'Soja texturizada fina seca', category: 'Legumbres', calories: 348, proteinG: 50.0, carbsG: 29.0, fatG: 1.5, fiberG: 16.0 },
  { name: 'Edamame hervido con vaina', category: 'Legumbres', calories: 122, proteinG: 11.9, carbsG: 8.9, fatG: 5.2, fiberG: 5.2 },
  { name: 'Tofu firme tradicional', category: 'Legumbres', calories: 83, proteinG: 10.0, carbsG: 1.2, fatG: 5.0, fiberG: 0.8 },
  { name: 'Tofu sedoso (silken tofu)', category: 'Legumbres', calories: 55, proteinG: 5.8, carbsG: 2.0, fatG: 2.8, fiberG: 0.3 },
  { name: 'Tempeh de soja tradicional', category: 'Legumbres', calories: 192, proteinG: 20.3, carbsG: 7.6, fatG: 10.8, fiberG: 4.8 },
  { name: 'Hummus tradicional de garbanzo', category: 'Legumbres', calories: 177, proteinG: 4.9, carbsG: 20.1, fatG: 8.6, fiberG: 4.0 },
  { name: 'Harina de garbanzo', category: 'Legumbres', calories: 387, proteinG: 22.4, carbsG: 57.8, fatG: 6.7, fiberG: 10.8 }
];

const verdurasYHortalizas = [
  // Hojas
  { name: 'Espinacas frescas crudas', category: 'Verduras y Hortalizas', calories: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, fiberG: 2.2 },
  { name: 'Espinacas cocidas', category: 'Verduras y Hortalizas', calories: 23, proteinG: 3.0, carbsG: 3.8, fatG: 0.3, fiberG: 2.4 },
  { name: 'Acelgas frescas', category: 'Verduras y Hortalizas', calories: 19, proteinG: 1.8, carbsG: 3.7, fatG: 0.2, fiberG: 1.6 },
  { name: 'Acelgas cocidas', category: 'Verduras y Hortalizas', calories: 20, proteinG: 1.9, carbsG: 4.1, fatG: 0.1, fiberG: 2.1 },
  { name: 'Lechuga romana', category: 'Verduras y Hortalizas', calories: 17, proteinG: 1.2, carbsG: 3.3, fatG: 0.3, fiberG: 2.1 },
  { name: 'Lechuga iceberg', category: 'Verduras y Hortalizas', calories: 14, proteinG: 0.9, carbsG: 3.0, fatG: 0.1, fiberG: 1.2 },
  { name: 'Canónigos frescos', category: 'Verduras y Hortalizas', calories: 19, proteinG: 2.0, carbsG: 2.4, fatG: 0.4, fiberG: 1.5 },
  { name: 'Rúcula fresca', category: 'Verduras y Hortalizas', calories: 25, proteinG: 2.6, carbsG: 3.7, fatG: 0.7, fiberG: 1.6 },
  { name: 'Berros de agua frescos', category: 'Verduras y Hortalizas', calories: 11, proteinG: 2.3, carbsG: 1.3, fatG: 0.1, fiberG: 0.5 },
  { name: 'Kale / Col rizada cruda', category: 'Verduras y Hortalizas', calories: 49, proteinG: 4.3, carbsG: 8.8, fatG: 0.9, fiberG: 3.6 },
  { name: 'Endivias frescas', category: 'Verduras y Hortalizas', calories: 17, proteinG: 1.3, carbsG: 3.4, fatG: 0.2, fiberG: 3.1 },
  { name: 'Escarola fresca', category: 'Verduras y Hortalizas', calories: 17, proteinG: 1.3, carbsG: 3.4, fatG: 0.2, fiberG: 2.8 },
  { name: 'Achicoria fresca', category: 'Verduras y Hortalizas', calories: 23, proteinG: 1.7, carbsG: 4.7, fatG: 0.3, fiberG: 4.0 },

  // Crucíferas
  { name: 'Brócoli crudo', category: 'Verduras y Hortalizas', calories: 34, proteinG: 2.8, carbsG: 6.6, fatG: 0.4, fiberG: 2.6 },
  { name: 'Brócoli cocido al vapor', category: 'Verduras y Hortalizas', calories: 35, proteinG: 2.4, carbsG: 7.2, fatG: 0.4, fiberG: 3.3 },
  { name: 'Coliflor cruda', category: 'Verduras y Hortalizas', calories: 25, proteinG: 1.9, carbsG: 5.0, fatG: 0.3, fiberG: 2.0 },
  { name: 'Coliflor cocida', category: 'Verduras y Hortalizas', calories: 23, proteinG: 1.8, carbsG: 4.1, fatG: 0.5, fiberG: 2.3 },
  { name: 'Col lombarda cruda', category: 'Verduras y Hortalizas', calories: 31, proteinG: 1.4, carbsG: 7.4, fatG: 0.2, fiberG: 2.1 },
  { name: 'Coles de Bruselas crudas', category: 'Verduras y Hortalizas', calories: 43, proteinG: 3.4, carbsG: 9.0, fatG: 0.3, fiberG: 3.8 },
  { name: 'Coles de Bruselas cocidas', category: 'Verduras y Hortalizas', calories: 36, proteinG: 2.6, carbsG: 7.1, fatG: 0.5, fiberG: 2.6 },
  { name: 'Repollo blanco crudo', category: 'Verduras y Hortalizas', calories: 25, proteinG: 1.3, carbsG: 5.8, fatG: 0.1, fiberG: 2.5 },
  { name: 'Col china (Bok Choy)', category: 'Verduras y Hortalizas', calories: 13, proteinG: 1.5, carbsG: 2.2, fatG: 0.2, fiberG: 1.0 },

  // Tubérculos y raíces
  { name: 'Patata cruda', category: 'Verduras y Hortalizas', calories: 77, proteinG: 2.0, carbsG: 17.5, fatG: 0.1, fiberG: 2.2 },
  { name: 'Patata cocida con sal', category: 'Verduras y Hortalizas', calories: 87, proteinG: 1.9, carbsG: 20.1, fatG: 0.1, fiberG: 1.8 },
  { name: 'Patata asada al horno', category: 'Verduras y Hortalizas', calories: 93, proteinG: 2.5, carbsG: 21.2, fatG: 0.1, fiberG: 2.2 },
  { name: 'Patata frita tradicional', category: 'Verduras y Hortalizas', calories: 312, proteinG: 3.4, carbsG: 41.4, fatG: 15.0, fiberG: 3.8 },
  { name: 'Boniato / Batata crudo', category: 'Verduras y Hortalizas', calories: 86, proteinG: 1.6, carbsG: 20.1, fatG: 0.1, fiberG: 3.0 },
  { name: 'Boniato asado', category: 'Verduras y Hortalizas', calories: 90, proteinG: 2.0, carbsG: 20.7, fatG: 0.2, fiberG: 3.3 },
  { name: 'Zanahoria fresca cruda', category: 'Verduras y Hortalizas', calories: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2, fiberG: 2.8 },
  { name: 'Zanahoria cocida', category: 'Verduras y Hortalizas', calories: 35, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, fiberG: 3.0 },
  { name: 'Remolacha fresca cruda', category: 'Verduras y Hortalizas', calories: 43, proteinG: 1.6, carbsG: 9.6, fatG: 0.2, fiberG: 2.8 },
  { name: 'Remolacha cocida de bote', category: 'Verduras y Hortalizas', calories: 44, proteinG: 1.7, carbsG: 10.0, fatG: 0.2, fiberG: 2.0 },
  { name: 'Nabo blanco crudo', category: 'Verduras y Hortalizas', calories: 28, proteinG: 0.9, carbsG: 6.4, fatG: 0.1, fiberG: 1.8 },
  { name: 'Rábano rojo crudo', category: 'Verduras y Hortalizas', calories: 16, proteinG: 0.7, carbsG: 3.4, fatG: 0.1, fiberG: 1.6 },
  { name: 'Chirivía fresca', category: 'Verduras y Hortalizas', calories: 75, proteinG: 1.2, carbsG: 18.0, fatG: 0.3, fiberG: 4.9 },
  { name: 'Yuca / Mandioca cruda', category: 'Verduras y Hortalizas', calories: 160, proteinG: 1.4, carbsG: 38.1, fatG: 0.3, fiberG: 1.8 },

  // Frutos
  { name: 'Tomate maduro de ensalada', category: 'Verduras y Hortalizas', calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2 },
  { name: 'Tomate pera', category: 'Verduras y Hortalizas', calories: 20, proteinG: 1.0, carbsG: 4.0, fatG: 0.2, fiberG: 1.4 },
  { name: 'Tomate cherry', category: 'Verduras y Hortalizas', calories: 22, proteinG: 1.1, carbsG: 4.2, fatG: 0.2, fiberG: 1.3 },
  { name: 'Tomate seco en aceite', category: 'Verduras y Hortalizas', calories: 213, proteinG: 5.2, carbsG: 23.0, fatG: 14.0, fiberG: 6.0 },
  { name: 'Pepino fresco con piel', category: 'Verduras y Hortalizas', calories: 15, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5 },
  { name: 'Pimiento rojo crudo', category: 'Verduras y Hortalizas', calories: 31, proteinG: 1.0, carbsG: 6.0, fatG: 0.3, fiberG: 2.1 },
  { name: 'Pimiento rojo asado', category: 'Verduras y Hortalizas', calories: 35, proteinG: 1.1, carbsG: 7.2, fatG: 0.4, fiberG: 2.4 },
  { name: 'Pimiento verde crudo', category: 'Verduras y Hortalizas', calories: 20, proteinG: 0.9, carbsG: 4.6, fatG: 0.2, fiberG: 1.7 },
  { name: 'Pimiento amarillo crudo', category: 'Verduras y Hortalizas', calories: 27, proteinG: 1.0, carbsG: 6.3, fatG: 0.2, fiberG: 0.9 },
  { name: 'Padrón pimientos fritos', category: 'Verduras y Hortalizas', calories: 85, proteinG: 1.5, carbsG: 6.0, fatG: 6.5, fiberG: 2.0 },
  { name: 'Berenjena cruda', category: 'Verduras y Hortalizas', calories: 25, proteinG: 1.0, carbsG: 5.9, fatG: 0.2, fiberG: 3.0 },
  { name: 'Berenjena asada', category: 'Verduras y Hortalizas', calories: 35, proteinG: 1.2, carbsG: 8.0, fatG: 0.3, fiberG: 3.5 },
  { name: 'Calabacín fresco con piel', category: 'Verduras y Hortalizas', calories: 17, proteinG: 1.2, carbsG: 3.1, fatG: 0.3, fiberG: 1.0 },
  { name: 'Calabacín cocido', category: 'Verduras y Hortalizas', calories: 16, proteinG: 1.1, carbsG: 3.0, fatG: 0.4, fiberG: 1.1 },
  { name: 'Calabaza cacahuete cruda', category: 'Verduras y Hortalizas', calories: 26, proteinG: 1.0, carbsG: 6.5, fatG: 0.1, fiberG: 0.5 },
  { name: 'Calabaza asada', category: 'Verduras y Hortalizas', calories: 40, proteinG: 1.2, carbsG: 9.8, fatG: 0.2, fiberG: 1.5 },
  { name: 'Aguacate Hass fresco', category: 'Verduras y Hortalizas', calories: 160, proteinG: 2.0, carbsG: 8.5, fatG: 14.7, fiberG: 6.7 },

  // Bulbos
  { name: 'Cebolla blanca cruda', category: 'Verduras y Hortalizas', calories: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, fiberG: 1.7 },
  { name: 'Cebolla cocida / pochada', category: 'Verduras y Hortalizas', calories: 52, proteinG: 1.2, carbsG: 11.0, fatG: 0.5, fiberG: 2.0 },
  { name: 'Cebolla roja cruda', category: 'Verduras y Hortalizas', calories: 40, proteinG: 1.2, carbsG: 9.3, fatG: 0.1, fiberG: 1.7 },
  { name: 'Cebolleta tierna fresca', category: 'Verduras y Hortalizas', calories: 32, proteinG: 1.8, carbsG: 7.3, fatG: 0.2, fiberG: 2.6 },
  { name: 'Puerro fresco', category: 'Verduras y Hortalizas', calories: 61, proteinG: 1.5, carbsG: 14.2, fatG: 0.3, fiberG: 1.8 },
  { name: 'Ajo fresco crudo', category: 'Verduras y Hortalizas', calories: 149, proteinG: 6.4, carbsG: 33.1, fatG: 0.5, fiberG: 2.1 },
  { name: 'Chalota fresca', category: 'Verduras y Hortalizas', calories: 72, proteinG: 2.5, carbsG: 16.8, fatG: 0.1, fiberG: 3.2 },
  { name: 'Calçots crudos', category: 'Verduras y Hortalizas', calories: 35, proteinG: 1.6, carbsG: 7.5, fatG: 0.2, fiberG: 2.2 },

  // Tallos y otros
  { name: 'Espárragos verdes crudos', category: 'Verduras y Hortalizas', calories: 20, proteinG: 2.2, carbsG: 3.9, fatG: 0.1, fiberG: 2.1 },
  { name: 'Espárragos verdes a la plancha', category: 'Verduras y Hortalizas', calories: 38, proteinG: 2.5, carbsG: 4.5, fatG: 1.5, fiberG: 2.2 },
  { name: 'Espárragos blancos en conserva de bote', category: 'Verduras y Hortalizas', calories: 15, proteinG: 1.6, carbsG: 2.0, fatG: 0.2, fiberG: 1.5 },
  { name: 'Apio fresco', category: 'Verduras y Hortalizas', calories: 14, proteinG: 0.7, carbsG: 3.0, fatG: 0.2, fiberG: 1.6 },
  { name: 'Hinojo fresco', category: 'Verduras y Hortalizas', calories: 31, proteinG: 1.2, carbsG: 7.3, fatG: 0.2, fiberG: 3.1 },
  { name: 'Alcachofa fresca', category: 'Verduras y Hortalizas', calories: 47, proteinG: 3.3, carbsG: 10.5, fatG: 0.2, fiberG: 5.4 },
  { name: 'Alcachofa cocida', category: 'Verduras y Hortalizas', calories: 53, proteinG: 2.9, carbsG: 12.0, fatG: 0.3, fiberG: 5.7 },
  { name: 'Corazones de alcachofa en conserva', category: 'Verduras y Hortalizas', calories: 32, proteinG: 2.0, carbsG: 6.0, fatG: 0.3, fiberG: 3.8 },
  { name: 'Judías verdes crudas', category: 'Verduras y Hortalizas', calories: 31, proteinG: 1.8, carbsG: 7.0, fatG: 0.2, fiberG: 2.7 },
  { name: 'Judías verdes cocidas', category: 'Verduras y Hortalizas', calories: 35, proteinG: 1.9, carbsG: 7.9, fatG: 0.3, fiberG: 3.2 },
  { name: 'Maíz dulce en grano (lata)', category: 'Verduras y Hortalizas', calories: 86, proteinG: 3.2, carbsG: 19.0, fatG: 1.2, fiberG: 2.0 },
  { name: 'Palmitos en conserva', category: 'Verduras y Hortalizas', calories: 28, proteinG: 2.5, carbsG: 4.6, fatG: 0.6, fiberG: 2.4 },
  { name: 'Brotes de soja (judía mungo)', category: 'Verduras y Hortalizas', calories: 30, proteinG: 3.0, carbsG: 6.0, fatG: 0.2, fiberG: 1.8 },

  // Setas
  { name: 'Champiñón común crudo', category: 'Verduras y Hortalizas', calories: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, fiberG: 1.0 },
  { name: 'Champiñón salteado', category: 'Verduras y Hortalizas', calories: 45, proteinG: 3.5, carbsG: 4.0, fatG: 2.2, fiberG: 1.5 },
  { name: 'Seta de ostra (Pleurotus)', category: 'Verduras y Hortalizas', calories: 33, proteinG: 3.3, carbsG: 6.1, fatG: 0.4, fiberG: 2.3 },
  { name: 'Seta Shiitake fresca', category: 'Verduras y Hortalizas', calories: 34, proteinG: 2.2, carbsG: 6.8, fatG: 0.5, fiberG: 2.5 },
  { name: 'Boletus edulis (hongo porcini)', category: 'Verduras y Hortalizas', calories: 28, proteinG: 3.4, carbsG: 3.9, fatG: 0.4, fiberG: 2.0 },
  { name: 'Seta Portobello fresca', category: 'Verduras y Hortalizas', calories: 22, proteinG: 2.1, carbsG: 3.9, fatG: 0.4, fiberG: 1.3 },
  { name: 'Níscalos (robellones) frescos', category: 'Verduras y Hortalizas', calories: 23, proteinG: 1.9, carbsG: 3.1, fatG: 0.8, fiberG: 2.5 },

  // Encurtidos
  { name: 'Aceitunas verdes Manzanilla con hueso', category: 'Verduras y Hortalizas', calories: 145, proteinG: 1.0, carbsG: 3.8, fatG: 15.3, fiberG: 3.3 },
  { name: 'Aceitunas negras deshuesadas', category: 'Verduras y Hortalizas', calories: 115, proteinG: 0.8, carbsG: 6.0, fatG: 10.7, fiberG: 3.0 },
  { name: 'Aceitunas rellenas de anchoa', category: 'Verduras y Hortalizas', calories: 160, proteinG: 1.8, carbsG: 2.5, fatG: 16.5, fiberG: 3.0 },
  { name: 'Pepinillos en vinagre', category: 'Verduras y Hortalizas', calories: 14, proteinG: 0.6, carbsG: 2.8, fatG: 0.2, fiberG: 1.2 },
  { name: 'Cebollitas en vinagre', category: 'Verduras y Hortalizas', calories: 28, proteinG: 1.1, carbsG: 6.2, fatG: 0.1, fiberG: 1.4 },
  { name: 'Alcaparras en salmuera', category: 'Verduras y Hortalizas', calories: 23, proteinG: 2.4, carbsG: 4.9, fatG: 0.9, fiberG: 3.2 }
];

const frutas = [
  // Cítricos
  { name: 'Naranja de mesa fresca', category: 'Frutas', calories: 47, proteinG: 0.9, carbsG: 11.8, fatG: 0.1, fiberG: 2.4 },
  { name: 'Mandarina fresca', category: 'Frutas', calories: 53, proteinG: 0.8, carbsG: 13.3, fatG: 0.3, fiberG: 1.8 },
  { name: 'Clementina fresca', category: 'Frutas', calories: 47, proteinG: 0.9, carbsG: 12.0, fatG: 0.2, fiberG: 1.7 },
  { name: 'Limón fresco con piel', category: 'Frutas', calories: 29, proteinG: 1.1, carbsG: 9.3, fatG: 0.3, fiberG: 2.8 },
  { name: 'Lima fresca', category: 'Frutas', calories: 30, proteinG: 0.7, carbsG: 10.5, fatG: 0.2, fiberG: 2.8 },
  { name: 'Pomelo rosa fresco', category: 'Frutas', calories: 42, proteinG: 0.8, carbsG: 10.7, fatG: 0.1, fiberG: 1.6 },

  // De hueso
  { name: 'Melocotón fresco', category: 'Frutas', calories: 39, proteinG: 0.9, carbsG: 9.5, fatG: 0.3, fiberG: 1.5 },
  { name: 'Nectarina fresca', category: 'Frutas', calories: 44, proteinG: 1.1, carbsG: 10.6, fatG: 0.3, fiberG: 1.7 },
  { name: 'Albaricoque fresco', category: 'Frutas', calories: 48, proteinG: 1.4, carbsG: 11.1, fatG: 0.4, fiberG: 2.0 },
  { name: 'Cereza fresca', category: 'Frutas', calories: 63, proteinG: 1.1, carbsG: 16.0, fatG: 0.2, fiberG: 2.1 },
  { name: 'Ciruela roja fresca', category: 'Frutas', calories: 46, proteinG: 0.7, carbsG: 11.4, fatG: 0.3, fiberG: 1.4 },
  { name: 'Ciruela claudia fresca', category: 'Frutas', calories: 48, proteinG: 0.8, carbsG: 12.0, fatG: 0.2, fiberG: 1.5 },
  { name: 'Paraguayo fresco', category: 'Frutas', calories: 43, proteinG: 0.9, carbsG: 10.2, fatG: 0.2, fiberG: 1.5 },

  // De pepita
  { name: 'Manzana Golden', category: 'Frutas', calories: 52, proteinG: 0.3, carbsG: 13.8, fatG: 0.2, fiberG: 2.4 },
  { name: 'Manzana Fuji', category: 'Frutas', calories: 54, proteinG: 0.3, carbsG: 14.0, fatG: 0.2, fiberG: 2.2 },
  { name: 'Manzana Granny Smith', category: 'Frutas', calories: 48, proteinG: 0.4, carbsG: 12.5, fatG: 0.2, fiberG: 2.8 },
  { name: 'Pera Conferencia', category: 'Frutas', calories: 57, proteinG: 0.4, carbsG: 15.2, fatG: 0.1, fiberG: 3.1 },
  { name: 'Pera de agua (Blanquilla)', category: 'Frutas', calories: 49, proteinG: 0.3, carbsG: 13.0, fatG: 0.1, fiberG: 2.5 },
  { name: 'Uva blanca de mesa', category: 'Frutas', calories: 69, proteinG: 0.7, carbsG: 18.1, fatG: 0.2, fiberG: 0.9 },
  { name: 'Uva tinta / negra', category: 'Frutas', calories: 71, proteinG: 0.7, carbsG: 18.5, fatG: 0.3, fiberG: 1.0 },

  // Tropicales y exóticas
  { name: 'Plátano de Canarias maduro', category: 'Frutas', calories: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, fiberG: 2.6 },
  { name: 'Piña natural fresca', category: 'Frutas', calories: 50, proteinG: 0.5, carbsG: 13.1, fatG: 0.1, fiberG: 1.4 },
  { name: 'Mango maduro fresco', category: 'Frutas', calories: 60, proteinG: 0.8, carbsG: 15.0, fatG: 0.4, fiberG: 1.6 },
  { name: 'Papaya fresca', category: 'Frutas', calories: 43, proteinG: 0.5, carbsG: 10.8, fatG: 0.3, fiberG: 1.7 },
  { name: 'Pulpa de coco fresco', category: 'Frutas', calories: 354, proteinG: 3.3, carbsG: 15.2, fatG: 33.5, fiberG: 9.0 },
  { name: 'Agua de coco natural', category: 'Frutas', calories: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, fiberG: 1.1 },
  { name: 'Maracuyá (fruta de la pasión)', category: 'Frutas', calories: 97, proteinG: 2.2, carbsG: 23.4, fatG: 0.7, fiberG: 10.4 },
  { name: 'Kiwi verde fresco', category: 'Frutas', calories: 61, proteinG: 1.1, carbsG: 14.7, fatG: 0.5, fiberG: 3.0 },
  { name: 'Kiwi amarillo (Gold)', category: 'Frutas', calories: 63, proteinG: 1.3, carbsG: 15.5, fatG: 0.3, fiberG: 1.4 },
  { name: 'Higo fresco', category: 'Frutas', calories: 74, proteinG: 0.8, carbsG: 19.2, fatG: 0.3, fiberG: 2.9 },
  { name: 'Breva fresca', category: 'Frutas', calories: 68, proteinG: 0.8, carbsG: 17.5, fatG: 0.2, fiberG: 2.6 },
  { name: 'Dátil fresco Medjool', category: 'Frutas', calories: 277, proteinG: 1.8, carbsG: 75.0, fatG: 0.2, fiberG: 6.7 },
  { name: 'Granada fresca en grano', category: 'Frutas', calories: 83, proteinG: 1.7, carbsG: 18.7, fatG: 1.2, fiberG: 4.0 },
  { name: 'Guayaba fresca', category: 'Frutas', calories: 68, proteinG: 2.6, carbsG: 14.3, fatG: 1.0, fiberG: 5.4 },
  { name: 'Pitahaya (fruta del dragón)', category: 'Frutas', calories: 51, proteinG: 1.2, carbsG: 11.8, fatG: 0.6, fiberG: 2.9 },

  // Berries
  { name: 'Fresa fresca', category: 'Frutas', calories: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, fiberG: 2.0 },
  { name: 'Frambuesa fresca', category: 'Frutas', calories: 52, proteinG: 1.2, carbsG: 11.9, fatG: 0.7, fiberG: 6.5 },
  { name: 'Arándano azul fresco', category: 'Frutas', calories: 57, proteinG: 0.7, carbsG: 14.5, fatG: 0.3, fiberG: 2.4 },
  { name: 'Mora silvestre fresca', category: 'Frutas', calories: 43, proteinG: 1.4, carbsG: 9.6, fatG: 0.5, fiberG: 5.3 },
  { name: 'Grosella roja fresca', category: 'Frutas', calories: 56, proteinG: 1.4, carbsG: 13.8, fatG: 0.2, fiberG: 4.3 },

  // Melón, sandía y otras
  { name: 'Melón piel de sapo', category: 'Frutas', calories: 28, proteinG: 0.8, carbsG: 6.5, fatG: 0.1, fiberG: 0.9 },
  { name: 'Melón cantalupo', category: 'Frutas', calories: 34, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, fiberG: 0.9 },
  { name: 'Sandía fresca', category: 'Frutas', calories: 30, proteinG: 0.6, carbsG: 7.6, fatG: 0.2, fiberG: 0.4 },
  { name: 'Caqui persimon', category: 'Frutas', calories: 70, proteinG: 0.6, carbsG: 18.6, fatG: 0.2, fiberG: 3.6 },
  { name: 'Chirimoya fresca', category: 'Frutas', calories: 75, proteinG: 1.6, carbsG: 17.7, fatG: 0.7, fiberG: 3.0 },
  { name: 'Níspero fresco', category: 'Frutas', calories: 47, proteinG: 0.4, carbsG: 12.1, fatG: 0.2, fiberG: 1.7 },
  { name: 'Membrillo fresco', category: 'Frutas', calories: 57, proteinG: 0.4, carbsG: 15.3, fatG: 0.1, fiberG: 1.9 },
  { name: 'Dulce de membrillo', category: 'Frutas', calories: 220, proteinG: 0.4, carbsG: 55.0, fatG: 0.1, fiberG: 2.0 },
  { name: 'Higo chumbo fresco', category: 'Frutas', calories: 41, proteinG: 0.7, carbsG: 9.6, fatG: 0.5, fiberG: 3.6 },

  // Frutas desecadas
  { name: 'Pasas sultanas sin pepita', category: 'Frutas', calories: 299, proteinG: 3.1, carbsG: 79.2, fatG: 0.5, fiberG: 3.7 },
  { name: 'Orejones de albaricoque secos', category: 'Frutas', calories: 241, proteinG: 3.4, carbsG: 62.6, fatG: 0.5, fiberG: 7.3 },
  { name: 'Higos secos', category: 'Frutas', calories: 249, proteinG: 3.3, carbsG: 63.9, fatG: 0.9, fiberG: 9.8 },
  { name: 'Ciruelas pasas sin hueso', category: 'Frutas', calories: 240, proteinG: 2.2, carbsG: 63.9, fatG: 0.4, fiberG: 7.1 },
  { name: 'Arándanos rojos desecados', category: 'Frutas', calories: 325, proteinG: 0.5, carbsG: 82.0, fatG: 1.4, fiberG: 5.7 },
  { name: 'Dátiles secos deglet noor', category: 'Frutas', calories: 282, proteinG: 2.5, carbsG: 75.0, fatG: 0.4, fiberG: 8.0 },
  { name: 'Manzana deshidratada en aros', category: 'Frutas', calories: 243, proteinG: 0.9, carbsG: 66.0, fatG: 0.3, fiberG: 8.7 },
  { name: 'Chips de plátano deshidratado', category: 'Frutas', calories: 519, proteinG: 2.3, carbsG: 58.4, fatG: 33.6, fiberG: 7.7 }
];

const frutosSecosYSemillas = [
  // Frutos secos
  { name: 'Almendras crudas con piel', category: 'Frutos Secos y Semillas', calories: 579, proteinG: 21.2, carbsG: 21.6, fatG: 49.9, fiberG: 12.5 },
  { name: 'Almendras tostadas sin sal', category: 'Frutos Secos y Semillas', calories: 598, proteinG: 21.0, carbsG: 21.0, fatG: 52.5, fiberG: 11.0 },
  { name: 'Almendras fritas con sal', category: 'Frutos Secos y Semillas', calories: 620, proteinG: 19.5, carbsG: 18.0, fatG: 56.0, fiberG: 10.0 },
  { name: 'Nueces de nogal peladas', category: 'Frutos Secos y Semillas', calories: 654, proteinG: 15.2, carbsG: 13.7, fatG: 65.2, fiberG: 6.7 },
  { name: 'Avellanas crudas', category: 'Frutos Secos y Semillas', calories: 628, proteinG: 15.0, carbsG: 16.7, fatG: 60.8, fiberG: 9.7 },
  { name: 'Avellanas tostadas', category: 'Frutos Secos y Semillas', calories: 646, proteinG: 15.0, carbsG: 17.6, fatG: 62.4, fiberG: 9.4 },
  { name: 'Pistachos tostados sin sal', category: 'Frutos Secos y Semillas', calories: 562, proteinG: 20.3, carbsG: 27.5, fatG: 45.4, fiberG: 10.3 },
  { name: 'Pistachos tostados con sal', category: 'Frutos Secos y Semillas', calories: 567, proteinG: 20.0, carbsG: 28.0, fatG: 45.8, fiberG: 10.0 },
  { name: 'Anacardos crudos', category: 'Frutos Secos y Semillas', calories: 553, proteinG: 18.2, carbsG: 30.2, fatG: 43.8, fiberG: 3.3 },
  { name: 'Anacardos tostados sin sal', category: 'Frutos Secos y Semillas', calories: 574, proteinG: 16.8, carbsG: 32.7, fatG: 46.4, fiberG: 3.0 },
  { name: 'Nueces de Macadamia crudas', category: 'Frutos Secos y Semillas', calories: 718, proteinG: 7.9, carbsG: 13.8, fatG: 75.8, fiberG: 8.6 },
  { name: 'Nueces de Brasil (coquitos)', category: 'Frutos Secos y Semillas', calories: 659, proteinG: 14.3, carbsG: 12.3, fatG: 67.1, fiberG: 7.5 },
  { name: 'Nueces pecanas', category: 'Frutos Secos y Semillas', calories: 691, proteinG: 9.2, carbsG: 13.9, fatG: 72.0, fiberG: 9.6 },
  { name: 'Piñones ibéricos nacionales', category: 'Frutos Secos y Semillas', calories: 673, proteinG: 13.7, carbsG: 13.1, fatG: 68.4, fiberG: 3.7 },
  { name: 'Castañas crudas', category: 'Frutos Secos y Semillas', calories: 196, proteinG: 1.6, carbsG: 44.0, fatG: 1.3, fiberG: 8.1 },
  { name: 'Castañas asadas', category: 'Frutos Secos y Semillas', calories: 239, proteinG: 2.4, carbsG: 53.0, fatG: 2.2, fiberG: 5.1 },

  // Semillas
  { name: 'Semillas de chía', category: 'Frutos Secos y Semillas', calories: 486, proteinG: 16.5, carbsG: 42.1, fatG: 30.7, fiberG: 34.4 },
  { name: 'Semillas de lino dorado', category: 'Frutos Secos y Semillas', calories: 534, proteinG: 18.3, carbsG: 28.9, fatG: 42.2, fiberG: 27.3 },
  { name: 'Semillas de lino marrón molidas', category: 'Frutos Secos y Semillas', calories: 534, proteinG: 18.3, carbsG: 28.9, fatG: 42.2, fiberG: 27.3 },
  { name: 'Semillas de girasol peladas (pipas)', category: 'Frutos Secos y Semillas', calories: 584, proteinG: 20.8, carbsG: 20.0, fatG: 51.5, fiberG: 8.6 },
  { name: 'Pipas de girasol con cáscara saladas', category: 'Frutos Secos y Semillas', calories: 590, proteinG: 20.0, carbsG: 21.0, fatG: 52.0, fiberG: 8.0 },
  { name: 'Semillas de calabaza peladas', category: 'Frutos Secos y Semillas', calories: 559, proteinG: 30.2, carbsG: 10.7, fatG: 49.1, fiberG: 6.0 },
  { name: 'Semillas de sésamo blanco crudo', category: 'Frutos Secos y Semillas', calories: 573, proteinG: 17.7, carbsG: 23.4, fatG: 49.7, fiberG: 11.8 },
  { name: 'Semillas de sésamo tostado', category: 'Frutos Secos y Semillas', calories: 565, proteinG: 17.0, carbsG: 25.0, fatG: 48.0, fiberG: 14.0 },
  { name: 'Semillas de amapola', category: 'Frutos Secos y Semillas', calories: 525, proteinG: 18.0, carbsG: 28.1, fatG: 41.6, fiberG: 19.5 },
  { name: 'Semillas de cáñamo peladas', category: 'Frutos Secos y Semillas', calories: 553, proteinG: 31.6, carbsG: 8.7, fatG: 48.8, fiberG: 4.0 },

  // Cremas de frutos secos y cacahuetes
  { name: 'Cacahuetes crudos sin sal', category: 'Frutos Secos y Semillas', calories: 567, proteinG: 25.8, carbsG: 16.1, fatG: 49.2, fiberG: 8.5 },
  { name: 'Cacahuetes tostados sin sal', category: 'Frutos Secos y Semillas', calories: 585, proteinG: 26.0, carbsG: 15.0, fatG: 50.0, fiberG: 8.0 },
  { name: 'Cacahuetes fritos con sal', category: 'Frutos Secos y Semillas', calories: 615, proteinG: 24.5, carbsG: 15.5, fatG: 54.0, fiberG: 7.8 },
  { name: 'Mantequilla de cacahuete 100% natural', category: 'Frutos Secos y Semillas', calories: 588, proteinG: 25.1, carbsG: 20.0, fatG: 50.4, fiberG: 6.0 },
  { name: 'Crema de almendras 100%', category: 'Frutos Secos y Semillas', calories: 614, proteinG: 21.0, carbsG: 19.0, fatG: 55.5, fiberG: 10.5 },
  { name: 'Crema de avellanas 100%', category: 'Frutos Secos y Semillas', calories: 650, proteinG: 14.5, carbsG: 16.0, fatG: 63.0, fiberG: 9.0 },
  { name: 'Tahini blanco (pasta de sésamo)', category: 'Frutos Secos y Semillas', calories: 595, proteinG: 17.0, carbsG: 21.2, fatG: 53.8, fiberG: 9.3 },
  { name: 'Tahini integral', category: 'Frutos Secos y Semillas', calories: 610, proteinG: 18.0, carbsG: 18.5, fatG: 55.0, fiberG: 12.0 },
  { name: 'Crema de anacardos 100%', category: 'Frutos Secos y Semillas', calories: 587, proteinG: 17.5, carbsG: 28.0, fatG: 48.5, fiberG: 3.5 }
];

const aceitesYGrasas = [
  { name: 'Aceite de oliva virgen extra (AOVE)', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de oliva virgen', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de oliva suave (0.4º)', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de oliva intenso (1º)', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de girasol refinado', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de girasol alto oleico', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de coco virgen prensado en frío', category: 'Aceites y Grasas', calories: 862, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de sésamo tostado', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de lino (linaza)', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de aguacate virgen', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de nuez prensado en frío', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Aceite de maíz', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Ghee (mantequilla clarificada)', category: 'Aceites y Grasas', calories: 876, proteinG: 0.3, carbsG: 0, fatG: 99.5, fiberG: 0 },
  { name: 'Margarina vegetal tradicional (80% grasa)', category: 'Aceites y Grasas', calories: 717, proteinG: 0.2, carbsG: 0.7, fatG: 80.5, fiberG: 0 },
  { name: 'Margarina vegetal ligera (40% grasa)', category: 'Aceites y Grasas', calories: 360, proteinG: 0.1, carbsG: 1.5, fatG: 40.0, fiberG: 0 },
  { name: 'Manteca de cerdo ibérico', category: 'Aceites y Grasas', calories: 902, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 },
  { name: 'Grasa de pato para confitar', category: 'Aceites y Grasas', calories: 882, proteinG: 0, carbsG: 0, fatG: 99.8, fiberG: 0 },
  { name: 'Aceite de colza / canola', category: 'Aceites y Grasas', calories: 884, proteinG: 0, carbsG: 0, fatG: 100.0, fiberG: 0 }
];

const azucaresYEdulcorantes = [
  { name: 'Azúcar blanco refinado', category: 'Azúcares y Edulcorantes', calories: 400, proteinG: 0, carbsG: 100.0, fatG: 0, fiberG: 0 },
  { name: 'Azúcar moreno de caña', category: 'Azúcares y Edulcorantes', calories: 380, proteinG: 0.1, carbsG: 98.0, fatG: 0, fiberG: 0 },
  { name: 'Azúcar glas (impalpable)', category: 'Azúcares y Edulcorantes', calories: 389, proteinG: 0, carbsG: 99.5, fatG: 0, fiberG: 0 },
  { name: 'Azúcar de coco', category: 'Azúcares y Edulcorantes', calories: 375, proteinG: 1.1, carbsG: 93.0, fatG: 0.4, fiberG: 2.2 },
  { name: 'Panela molida de caña', category: 'Azúcares y Edulcorantes', calories: 351, proteinG: 0.7, carbsG: 87.0, fatG: 0.2, fiberG: 0.5 },
  { name: 'Miel de abeja milflores', category: 'Azúcares y Edulcorantes', calories: 304, proteinG: 0.3, carbsG: 82.4, fatG: 0, fiberG: 0.2 },
  { name: 'Miel de romero', category: 'Azúcares y Edulcorantes', calories: 302, proteinG: 0.3, carbsG: 82.0, fatG: 0, fiberG: 0.2 },
  { name: 'Sirope de arce puro grado A', category: 'Azúcares y Edulcorantes', calories: 260, proteinG: 0, carbsG: 67.0, fatG: 0.1, fiberG: 0 },
  { name: 'Sirope de agave azul', category: 'Azúcares y Edulcorantes', calories: 310, proteinG: 0.1, carbsG: 76.4, fatG: 0.5, fiberG: 0.2 },
  { name: 'Melaza de caña de azúcar', category: 'Azúcares y Edulcorantes', calories: 290, proteinG: 0, carbsG: 74.7, fatG: 0.1, fiberG: 0 },
  { name: 'Mermelada de fresa tradicional', category: 'Azúcares y Edulcorantes', calories: 240, proteinG: 0.5, carbsG: 59.0, fatG: 0.1, fiberG: 1.1 },
  { name: 'Mermelada de melocotón tradicional', category: 'Azúcares y Edulcorantes', calories: 238, proteinG: 0.4, carbsG: 58.5, fatG: 0.1, fiberG: 1.0 },
  { name: 'Mermelada de fresa 0% azúcares añadidos', category: 'Azúcares y Edulcorantes', calories: 42, proteinG: 0.6, carbsG: 8.5, fatG: 0.2, fiberG: 3.5 },
  { name: 'Cacao puro en polvo desgrasado 100%', category: 'Azúcares y Edulcorantes', calories: 310, proteinG: 25.0, carbsG: 14.0, fatG: 11.0, fiberG: 32.0 },
  { name: 'Chocolate negro 70% cacao', category: 'Azúcares y Edulcorantes', calories: 566, proteinG: 7.8, carbsG: 36.0, fatG: 42.5, fiberG: 10.9 },
  { name: 'Chocolate negro 85% cacao', category: 'Azúcares y Edulcorantes', calories: 584, proteinG: 11.0, carbsG: 20.0, fatG: 51.0, fiberG: 14.0 },
  { name: 'Chocolate negro 99% cacao', category: 'Azúcares y Edulcorantes', calories: 590, proteinG: 13.0, carbsG: 8.0, fatG: 54.0, fiberG: 17.0 },
  { name: 'Chocolate con leche tradicional', category: 'Azúcares y Edulcorantes', calories: 535, proteinG: 7.6, carbsG: 59.4, fatG: 29.7, fiberG: 3.4 },
  { name: 'Chocolate blanco', category: 'Azúcares y Edulcorantes', calories: 539, proteinG: 5.9, carbsG: 59.0, fatG: 32.1, fiberG: 0 },
  { name: 'Cacao soluble tipo ColaCao', category: 'Azúcares y Edulcorantes', calories: 378, proteinG: 6.8, carbsG: 78.0, fatG: 2.5, fiberG: 8.5 },
  { name: 'Eritritol en polvo', category: 'Azúcares y Edulcorantes', calories: 0, proteinG: 0, carbsG: 100.0, fatG: 0, fiberG: 0 },
  { name: 'Stevia granulada con eritritol', category: 'Azúcares y Edulcorantes', calories: 0, proteinG: 0, carbsG: 99.0, fatG: 0, fiberG: 0 }
];

const bebidas = [
  // Cafés e infusiones
  { name: 'Agua mineral natural', category: 'Bebidas', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  { name: 'Café solo expreso sin azúcar', category: 'Bebidas', calories: 2, proteinG: 0.1, carbsG: 0.3, fatG: 0.1, fiberG: 0 },
  { name: 'Café descafeinado solo sin azúcar', category: 'Bebidas', calories: 2, proteinG: 0.1, carbsG: 0.3, fatG: 0.1, fiberG: 0 },
  { name: 'Café con leche semidesnatada (sin azúcar)', category: 'Bebidas', calories: 35, proteinG: 2.5, carbsG: 3.6, fatG: 1.2, fiberG: 0 },
  { name: 'Té verde infusión sin azúcar', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Té negro infusión sin azúcar', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.3, fatG: 0, fiberG: 0 },
  { name: 'Té matcha preparado con agua', category: 'Bebidas', calories: 6, proteinG: 0.6, carbsG: 0.8, fatG: 0.1, fiberG: 0.6 },
  { name: 'Infusión de manzanilla sin azúcar', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.2, fatG: 0, fiberG: 0 },
  { name: 'Infusión de rooibos sin azúcar', category: 'Bebidas', calories: 1, proteinG: 0, carbsG: 0.2, fatG: 0, fiberG: 0 },

  // Zumos
  { name: 'Zumo de naranja natural recién exprimido', category: 'Bebidas', calories: 45, proteinG: 0.7, carbsG: 10.4, fatG: 0.2, fiberG: 0.2 },
  { name: 'Zumo de manzana 100% fruta', category: 'Bebidas', calories: 46, proteinG: 0.1, carbsG: 11.3, fatG: 0.1, fiberG: 0.2 },
  { name: 'Zumo de piña sin azúcares añadidos', category: 'Bebidas', calories: 50, proteinG: 0.4, carbsG: 12.0, fatG: 0.1, fiberG: 0.2 },
  { name: 'Zumo de tomate natural', category: 'Bebidas', calories: 17, proteinG: 0.8, carbsG: 3.5, fatG: 0.1, fiberG: 0.8 },
  { name: 'Zumo de pomelo natural', category: 'Bebidas', calories: 39, proteinG: 0.5, carbsG: 9.2, fatG: 0.1, fiberG: 0.2 },

  // Bebidas vegetales
  { name: 'Bebida de almendras sin azúcares añadidos', category: 'Bebidas', calories: 14, proteinG: 0.5, carbsG: 0.2, fatG: 1.2, fiberG: 0.4 },
  { name: 'Bebida de almendras clásica', category: 'Bebidas', calories: 28, proteinG: 0.6, carbsG: 3.5, fatG: 1.3, fiberG: 0.3 },
  { name: 'Bebida de soja sin azúcar añadido', category: 'Bebidas', calories: 33, proteinG: 3.0, carbsG: 1.0, fatG: 1.8, fiberG: 0.6 },
  { name: 'Bebida de soja clásica enriquecida', category: 'Bebidas', calories: 42, proteinG: 3.1, carbsG: 3.0, fatG: 1.9, fiberG: 0.5 },
  { name: 'Bebida de avena clásica', category: 'Bebidas', calories: 45, proteinG: 1.0, carbsG: 7.5, fatG: 1.2, fiberG: 0.8 },
  { name: 'Bebida de avena barista', category: 'Bebidas', calories: 60, proteinG: 1.1, carbsG: 6.8, fatG: 3.0, fiberG: 0.8 },
  { name: 'Bebida de arroz clásica', category: 'Bebidas', calories: 49, proteinG: 0.2, carbsG: 10.0, fatG: 1.0, fiberG: 0.1 },
  { name: 'Bebida de coco sin azúcares añadidos', category: 'Bebidas', calories: 20, proteinG: 0.2, carbsG: 0.8, fatG: 1.8, fiberG: 0.2 },

  // Bebidas fermentadas y con alcohol
  { name: 'Cerveza rubia tradicional (4.8-5% vol)', category: 'Bebidas', calories: 43, proteinG: 0.5, carbsG: 3.6, fatG: 0, fiberG: 0 },
  { name: 'Cerveza sin alcohol 0.0%', category: 'Bebidas', calories: 20, proteinG: 0.3, carbsG: 4.2, fatG: 0, fiberG: 0 },
  { name: 'Vino tinto joven / crianza (13% vol)', category: 'Bebidas', calories: 85, proteinG: 0.1, carbsG: 2.6, fatG: 0, fiberG: 0 },
  { name: 'Vino blanco seco (11.5% vol)', category: 'Bebidas', calories: 82, proteinG: 0.1, carbsG: 2.6, fatG: 0, fiberG: 0 },
  { name: 'Cava brut nature (11.5% vol)', category: 'Bebidas', calories: 70, proteinG: 0.1, carbsG: 1.2, fatG: 0, fiberG: 0 },
  { name: 'Sidra natural asturiana', category: 'Bebidas', calories: 45, proteinG: 0.1, carbsG: 3.2, fatG: 0, fiberG: 0 },

  // Refrescos
  { name: 'Refresco de cola tradicional con azúcar', category: 'Bebidas', calories: 42, proteinG: 0, carbsG: 10.6, fatG: 0, fiberG: 0 },
  { name: 'Refresco de cola Zero azúcares', category: 'Bebidas', calories: 0.3, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  { name: 'Bebida isotónica deportiva', category: 'Bebidas', calories: 24, proteinG: 0, carbsG: 5.8, fatG: 0, fiberG: 0 },
  { name: 'Kombucha de té verde', category: 'Bebidas', calories: 15, proteinG: 0.1, carbsG: 3.5, fatG: 0, fiberG: 0 }
];

const preparadosYOtros = [
  // Suplementos deportivos
  { name: 'Proteína Whey concentrada 80% en polvo', category: 'Preparados y Otros', calories: 395, proteinG: 78.0, carbsG: 5.5, fatG: 6.5, fiberG: 0 },
  { name: 'Proteína Whey aislada (Isolate 90%) en polvo', category: 'Preparados y Otros', calories: 370, proteinG: 88.0, carbsG: 1.5, fatG: 1.2, fiberG: 0 },
  { name: 'Proteína Caseína micelar en polvo', category: 'Preparados y Otros', calories: 360, proteinG: 77.0, carbsG: 4.5, fatG: 2.5, fiberG: 0 },
  { name: 'Proteína vegetal en polvo (guisante y arroz)', category: 'Preparados y Otros', calories: 380, proteinG: 76.0, carbsG: 5.0, fatG: 5.5, fiberG: 4.0 },
  { name: 'Creatina monohidrato en polvo', category: 'Preparados y Otros', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  { name: 'Colágeno hidrolizado en polvo', category: 'Preparados y Otros', calories: 360, proteinG: 90.0, carbsG: 0, fatG: 0, fiberG: 0 },

  // Superalimentos y levaduras
  { name: 'Levadura de cerveza en copos', category: 'Preparados y Otros', calories: 340, proteinG: 48.0, carbsG: 30.0, fatG: 3.5, fiberG: 22.0 },
  { name: 'Levadura nutricional en copos', category: 'Preparados y Otros', calories: 345, proteinG: 50.0, carbsG: 33.0, fatG: 4.0, fiberG: 21.0 },
  { name: 'Espirulina en polvo', category: 'Preparados y Otros', calories: 290, proteinG: 57.5, carbsG: 23.9, fatG: 7.7, fiberG: 3.6 },
  { name: 'Chlorella en polvo', category: 'Preparados y Otros', calories: 410, proteinG: 58.0, carbsG: 23.0, fatG: 9.0, fiberG: 12.0 },
  { name: 'Polen de abeja natural en grano', category: 'Preparados y Otros', calories: 317, proteinG: 24.0, carbsG: 40.0, fatG: 5.0, fiberG: 14.0 },

  // Salsas y condimentos
  { name: 'Vinagre de manzana de sidra', category: 'Preparados y Otros', calories: 21, proteinG: 0, carbsG: 0.9, fatG: 0, fiberG: 0 },
  { name: 'Vinagre de vino blanco', category: 'Preparados y Otros', calories: 19, proteinG: 0, carbsG: 0.6, fatG: 0, fiberG: 0 },
  { name: 'Vinagre balsámico de Módena', category: 'Preparados y Otros', calories: 88, proteinG: 0.5, carbsG: 17.0, fatG: 0, fiberG: 0 },
  { name: 'Salsa de soja tradicional (shoyu)', category: 'Preparados y Otros', calories: 60, proteinG: 10.5, carbsG: 5.6, fatG: 0.1, fiberG: 0.8 },
  { name: 'Salsa de soja baja en sal', category: 'Preparados y Otros', calories: 53, proteinG: 9.0, carbsG: 4.2, fatG: 0.1, fiberG: 0.5 },
  { name: 'Salsa Tamari sin gluten', category: 'Preparados y Otros', calories: 72, proteinG: 12.0, carbsG: 5.0, fatG: 0.1, fiberG: 0.6 },
  { name: 'Salsa de tomate frito estilo casero', category: 'Preparados y Otros', calories: 80, proteinG: 1.4, carbsG: 9.5, fatG: 4.0, fiberG: 1.8 },
  { name: 'Tomate triturado natural en conserva', category: 'Preparados y Otros', calories: 22, proteinG: 1.2, carbsG: 4.0, fatG: 0.2, fiberG: 1.3 },
  { name: 'Tomate concentrado en pasta (doble concentrado)', category: 'Preparados y Otros', calories: 82, proteinG: 4.3, carbsG: 15.0, fatG: 0.5, fiberG: 3.5 },
  { name: 'Ketchup tradicional', category: 'Preparados y Otros', calories: 111, proteinG: 1.2, carbsG: 25.8, fatG: 0.2, fiberG: 0.3 },
  { name: 'Ketchup zero sin azúcares añadidos', category: 'Preparados y Otros', calories: 38, proteinG: 1.0, carbsG: 6.5, fatG: 0.2, fiberG: 1.5 },
  { name: 'Mayonesa tradicional comercial', category: 'Preparados y Otros', calories: 680, proteinG: 1.0, carbsG: 2.5, fatG: 75.0, fiberG: 0 },
  { name: 'Mayonesa ligera (light)', category: 'Preparados y Otros', calories: 280, proteinG: 0.7, carbsG: 7.5, fatG: 28.0, fiberG: 0 },
  { name: 'Mostaza de Dijon tradicional', category: 'Preparados y Otros', calories: 147, proteinG: 7.1, carbsG: 5.8, fatG: 10.3, fiberG: 3.9 },
  { name: 'Mostaza suave de mesa', category: 'Preparados y Otros', calories: 66, proteinG: 4.4, carbsG: 5.3, fatG: 3.3, fiberG: 3.3 },
  { name: 'Salsa pesto verde genovés', category: 'Preparados y Otros', calories: 430, proteinG: 5.5, carbsG: 6.0, fatG: 42.0, fiberG: 2.5 },
  { name: 'Salsa guacamole refrigerada', category: 'Preparados y Otros', calories: 145, proteinG: 1.8, carbsG: 6.5, fatG: 12.5, fiberG: 5.0 },
  { name: 'Salsa chimichurri tradicional', category: 'Preparados y Otros', calories: 380, proteinG: 1.5, carbsG: 4.0, fatG: 40.0, fiberG: 1.5 },
  { name: 'Pasta de miso blanco (Shiro Miso)', category: 'Preparados y Otros', calories: 198, proteinG: 11.5, carbsG: 26.0, fatG: 4.8, fiberG: 4.5 },
  { name: 'Pasta de miso rojo tradicional', category: 'Preparados y Otros', calories: 200, proteinG: 13.0, carbsG: 24.5, fatG: 5.0, fiberG: 5.4 },

  // Caldos y gelificantes
  { name: 'Caldo de pollo casero o brik', category: 'Preparados y Otros', calories: 7, proteinG: 0.7, carbsG: 0.4, fatG: 0.3, fiberG: 0 },
  { name: 'Caldo de verduras casero o brik', category: 'Preparados y Otros', calories: 5, proteinG: 0.3, carbsG: 0.8, fatG: 0.1, fiberG: 0 },
  { name: 'Caldo de pescado y marisco (fumet)', category: 'Preparados y Otros', calories: 9, proteinG: 1.2, carbsG: 0.5, fatG: 0.2, fiberG: 0 },
  { name: 'Caldo de huesos de ternera (bone broth)', category: 'Preparados y Otros', calories: 18, proteinG: 3.5, carbsG: 0.2, fatG: 0.4, fiberG: 0 },
  { name: 'Gelatina neutra sin sabor en polvo', category: 'Preparados y Otros', calories: 335, proteinG: 84.0, carbsG: 0, fatG: 0.1, fiberG: 0 },
  { name: 'Agar-agar en polvo (gelificante vegetal)', category: 'Preparados y Otros', calories: 150, proteinG: 2.0, carbsG: 7.0, fatG: 0.1, fiberG: 77.0 }
];

const allCategories = [
  { name: 'Carnes', items: carnes },
  { name: 'Pescados y Mariscos', items: pescadosYMariscos },
  { name: 'Huevos y Lácteos', items: huevosYLacteos },
  { name: 'Cereales y Derivados', items: cerealesYDerivados },
  { name: 'Legumbres', items: legumbres },
  { name: 'Verduras y Hortalizas', items: verdurasYHortalizas },
  { name: 'Frutas', items: frutas },
  { name: 'Frutos Secos y Semillas', items: frutosSecosYSemillas },
  { name: 'Aceites y Grasas', items: aceitesYGrasas },
  { name: 'Azúcares y Edulcorantes', items: azucaresYEdulcorantes },
  { name: 'Bebidas', items: bebidas },
  { name: 'Preparados y Otros', items: preparadosYOtros }
];

let totalCount = 0;
for (const cat of allCategories) {
  console.log(`${cat.name}: ${cat.items.length} items`);
  totalCount += cat.items.length;
}
console.log(`TOTAL FOODS: ${totalCount}`);

if (totalCount < 500) {
  console.error("ERROR: Total count is less than 500!");
  process.exit(1);
}

// Generate prisma/seed.ts content
const allFoods = [];
for (const cat of allCategories) {
  for (const item of cat.items) {
    allFoods.push({
      name: item.name,
      category: item.category,
      source: 'custom',
      servingSize: 100,
      servingUnit: 'g',
      calories: Number(item.calories.toFixed(1)),
      proteinG: Number(item.proteinG.toFixed(1)),
      carbsG: Number(item.carbsG.toFixed(1)),
      fatG: Number(item.fatG.toFixed(1)),
      fiberG: Number(item.fiberG.toFixed(1))
    });
  }
}

const seedContent = `import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const spanishFoods = ${JSON.stringify(allFoods, null, 2)}

async function main() {
  console.log('🌱 Iniciando seed de NutriPro...')

  // 1. Crear o mantener el usuario nutricionista por defecto
  const hashedPassword = await bcrypt.hash('nutripro123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'nutricionista@nutripro.com' },
    update: {},
    create: {
      email: 'nutricionista@nutripro.com',
      name: 'Dr. Nutricionista',
      passwordHash: hashedPassword,
    },
  })

  console.log(\`✅ Usuario preparado: \${user.name} (\${user.email})\`)

  // 2. Crear paciente de ejemplo si no existe
  let patient = await prisma.patient.findFirst({
    where: { userId: user.id, email: 'maria@email.com' }
  })

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'María',
        lastName: 'García López',
        email: 'maria@email.com',
        phone: '+34 612 345 678',
        birthDate: new Date('1990-05-15'),
        sex: 'FEMALE',
        heightCm: 165,
        objective: 'WEIGHT_LOSS',
        activityLevel: 'MODERATE',
        notes: 'Paciente de ejemplo. Objetivo: perder 5kg en 3 meses.',
        allergies: 'gluten',
        intolerances: 'lactosa',
        dietaryPreferences: 'mediterránea',
      },
    })

    await prisma.anthropometry.create({
      data: {
        patientId: patient.id,
        date: new Date(),
        weightKg: 72,
        bodyFatPct: 28,
        waistCm: 82,
        hipCm: 98,
      },
    })
    console.log(\`✅ Paciente de ejemplo creado: \${patient.firstName} \${patient.lastName}\`)
  } else {
    console.log(\`✅ Paciente existente verificado: \${patient.firstName} \${patient.lastName}\`)
  }

  // 3. Eliminar alimentos previos para evitar duplicados
  console.log('🧹 Limpiando base de datos de alimentos existentes...')
  await prisma.food.deleteMany({})

  // 4. Insertar los alimentos españoles de forma masiva
  console.log(\`📦 Insertando \${spanishFoods.length} alimentos comunes españoles...\`)
  const batchSize = 100
  for (let i = 0; i < spanishFoods.length; i += batchSize) {
    const batch = spanishFoods.slice(i, i + batchSize)
    await prisma.food.createMany({
      data: batch,
    })
  }

  const count = await prisma.food.count()
  console.log(\`✅ Total de alimentos registrados en base de datos: \${count}\`)
  console.log('🎉 Seed completado con éxito!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
`

const outputPath = path.resolve(__dirname, '../prisma/seed.ts');
fs.writeFileSync(outputPath, seedContent, 'utf-8');
console.log(`Archivo generado con éxito en ${outputPath}`);
