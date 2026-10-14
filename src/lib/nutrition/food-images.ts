/**
 * @file food-images.ts
 * @description Curated high-resolution food photography mapping for EVSoftware.
 * Provides realistic, professional culinary images from Unsplash CDN for each food item.
 */

// Specific food photography mapping
const SPECIFIC_FOOD_IMAGES: Record<string, string> = {
  // Aves y Carnes
  'pechuga de pollo': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
  'pollo': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&auto=format&fit=crop&q=80',
  'pavo': 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=500&auto=format&fit=crop&q=80',
  'ternera': 'https://images.unsplash.com/photo-1558030006-450675393462?w=500&auto=format&fit=crop&q=80',
  'solomillo': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
  'entrecot': 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=500&auto=format&fit=crop&q=80',
  'cerdo': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&auto=format&fit=crop&q=80',
  'jamon': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&auto=format&fit=crop&q=80',
  'jamón': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&auto=format&fit=crop&q=80',
  'lomo': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500&auto=format&fit=crop&q=80',

  // Pescados y Mariscos
  'salmon': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80',
  'salmón': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80',
  'atun': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=500&auto=format&fit=crop&q=80',
  'atún': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=500&auto=format&fit=crop&q=80',
  'merluza': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80',
  'bacalao': 'https://images.unsplash.com/photo-1511421585906-57a6e6dc3a2f?w=500&auto=format&fit=crop&q=80',
  'dorada': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop&q=80',
  'lubina': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop&q=80',
  'gamba': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=80',
  'langostino': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=80',
  'pulpo': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=80',
  'calamar': 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500&auto=format&fit=crop&q=80',

  // Huevos y Lácteos
  'huevo': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=500&auto=format&fit=crop&q=80',
  'clara': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=500&auto=format&fit=crop&q=80',
  'leche': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
  'yogur': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80',
  'queso': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop&q=80',
  'parmesano': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=500&auto=format&fit=crop&q=80',
  'kefir': 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=500&auto=format&fit=crop&q=80',

  // Cereales y Granos
  'arroz': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&auto=format&fit=crop&q=80',
  'avena': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
  'pasta': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500&auto=format&fit=crop&q=80',
  'espagueti': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500&auto=format&fit=crop&q=80',
  'pan': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  'quinoa': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
  'cuscus': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=500&auto=format&fit=crop&q=80',

  // Legumbres
  'lenteja': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
  'garbanzo': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  'alubia': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=80',
  'guisante': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80',
  'tofu': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',

  // Frutas
  'platano': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  'plátano': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  'manzana': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80',
  'aguacate': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80',
  'naranja': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&auto=format&fit=crop&q=80',
  'fresa': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80',
  'arandano': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&auto=format&fit=crop&q=80',
  'arándano': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&auto=format&fit=crop&q=80',
  'kiwi': 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=500&auto=format&fit=crop&q=80',
  'pina': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=80',
  'piña': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=80',

  // Verduras y Hortalizas
  'brocoli': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&auto=format&fit=crop&q=80',
  'brócoli': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&auto=format&fit=crop&q=80',
  'espinaca': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80',
  'tomate': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  'patata': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
  'boniato': 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=500&auto=format&fit=crop&q=80',
  'zanahoria': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80',
  'calabacin': 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=500&auto=format&fit=crop&q=80',
  'calabacín': 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=500&auto=format&fit=crop&q=80',
  'lechuga': 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=500&auto=format&fit=crop&q=80',
  'cebolla': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80',
  'champinon': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=500&auto=format&fit=crop&q=80',
  'champiñón': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=500&auto=format&fit=crop&q=80',
  'esparrago': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
  'espárrago': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',

  // Grasas y Frutos Secos
  'aceite': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
  'almendra': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop&q=80',
  'nuez': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop&q=80',
  'cacahuete': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
  'chia': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80',
  'chía': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80',

  // Bebidas y Suplementos
  'cafe': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80',
  'café': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80',
  'te': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
  'té': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
  'proteina': 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80',
  'whey': 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80',
}

// Category fallback photography
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Carnes': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=80',
  'Pescados y Mariscos': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80',
  'Pescados': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80',
  'Huevos y Lácteos': 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&auto=format&fit=crop&q=80',
  'Lácteos': 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&auto=format&fit=crop&q=80',
  'Huevos': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=500&auto=format&fit=crop&q=80',
  'Cereales y Derivados': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  'Cereales': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
  'Legumbres': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
  'Verduras y Hortalizas': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  'Verduras': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  'Frutas': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80',
  'Frutos Secos y Semillas': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop&q=80',
  'Frutos secos': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop&q=80',
  'Aceites y Grasas': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
  'Aceites': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
  'Azúcares y Edulcorantes': 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=500&auto=format&fit=crop&q=80',
  'Bebidas': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
  'Preparados y Otros': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&auto=format&fit=crop&q=80',
}

const GLOBAL_DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&auto=format&fit=crop&q=80'

// Instant fallback SVG (Nutritious Bowl/Apple in emerald palette, 0 network overhead)
export const FALLBACK_FOOD_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><rect width="80" height="80" rx="16" fill="%23f0fdf4"/><circle cx="40" cy="42" r="22" fill="%23bbf7d0"/><path d="M40 22c-7 0-14 5.5-14 14 0 9.5 12 20 14 22 2-2 14-12.5 14-22 0-8.5-7-14-14-14z" fill="%2316a34a"/><path d="M40 16v6M42 17c2-2.5 5.5-3.5 8-2.5" stroke="%2315803d" stroke-width="2.5" stroke-linecap="round"/><circle cx="34" cy="34" r="2" fill="%23ffffff" opacity="0.6"/></svg>'

/**
 * Resolves a realistic high-definition food photograph for any food item.
 * Prioritizes custom database URL, then specific food name keywords, then food category fallback.
 */
export function getFoodImage(food: {
  name: string
  category?: string | null
  imageUrl?: string | null
}): string {
  // 1. If explicit URL provided and valid, return it
  if (food.imageUrl && food.imageUrl.startsWith('http')) {
    return food.imageUrl
  }

  const normalizedName = food.name.toLowerCase()

  // 2. Check keyword matches in specific food images
  for (const [key, url] of Object.entries(SPECIFIC_FOOD_IMAGES)) {
    if (normalizedName.includes(key)) {
      return url
    }
  }

  // 3. Fallback to category image
  if (food.category && CATEGORY_FALLBACK_IMAGES[food.category]) {
    return CATEGORY_FALLBACK_IMAGES[food.category]
  }

  // 4. Default fresh food photo
  return GLOBAL_DEFAULT_IMAGE
}

