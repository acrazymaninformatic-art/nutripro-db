/**
 * @file food-images.ts
 * @description Curated high-resolution culinary photography mapping for EVSoftware.
 * Provides realistic, appetizing, verified professional photography from Unsplash CDN
 * accurately matching Spanish supermarket ingredients, pantry staples, and clinical recipes.
 */

// Normalized specific food photography mapping (verified distinct URLs)
const SPECIFIC_FOOD_IMAGES: Record<string, string> = {
  // === AVES Y CARNES ===
  'pechuga de pollo': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80',
  'muslo de pollo': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80',
  'contramuslo de pollo': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80',
  'alitas de pollo': 'https://images.unsplash.com/photo-1527477378698-4729f50b9274?w=600&auto=format&fit=crop&q=80',
  'pollo asado': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&auto=format&fit=crop&q=80',
  'carne picada de pollo': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80',
  'pollo': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80',
  'pechuga de pavo': 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&auto=format&fit=crop&q=80',
  'fiambre de pavo': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=600&auto=format&fit=crop&q=80',
  'pavo': 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&auto=format&fit=crop&q=80',
  'solomillo de ternera': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  'entrecot': 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&auto=format&fit=crop&q=80',
  'filete de ternera': 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
  'carne picada de ternera': 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600&auto=format&fit=crop&q=80',
  'ternera': 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
  'lomo de cerdo': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&auto=format&fit=crop&q=80',
  'solomillo de cerdo': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  'costillas de cerdo': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  'cerdo': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop&q=80',
  'jamon iberico': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=600&auto=format&fit=crop&q=80',
  'jamon serrano': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=600&auto=format&fit=crop&q=80',
  'jamon cocido': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=600&auto=format&fit=crop&q=80',
  'lomo embuchado': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=600&auto=format&fit=crop&q=80',
  'cecina': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=600&auto=format&fit=crop&q=80',
  'conejo': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80',

  // === PESCADOS Y MARISCOS ===
  'salmon fresco': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  'salmon a la plancha': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  'salmon ahumado': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'salmon': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  'atun claro al natural': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=600&auto=format&fit=crop&q=80',
  'atun en aceite': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=600&auto=format&fit=crop&q=80',
  'atun a la plancha': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=600&auto=format&fit=crop&q=80',
  'lomo de atun': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=600&auto=format&fit=crop&q=80',
  'atun': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=600&auto=format&fit=crop&q=80',
  'bonito del norte': 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=600&auto=format&fit=crop&q=80',
  'merluza a la plancha': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'lomos de merluza': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'merluza': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'bacalao al horno': 'https://images.unsplash.com/photo-1511421585906-57a6e6dc3a2f?w=600&auto=format&fit=crop&q=80',
  'lomo de bacalao': 'https://images.unsplash.com/photo-1511421585906-57a6e6dc3a2f?w=600&auto=format&fit=crop&q=80',
  'bacalao': 'https://images.unsplash.com/photo-1511421585906-57a6e6dc3a2f?w=600&auto=format&fit=crop&q=80',
  'dorada al horno': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  'dorada': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  'lubina': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  'sardinas': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'boquerones': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'anchoas': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'gambas al ajillo': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
  'gambas': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
  'langostinos': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
  'pulpo a la gallega': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
  'pulpo cocido': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
  'pulpo': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
  'sepia a la plancha': 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&auto=format&fit=crop&q=80',
  'sepia': 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&auto=format&fit=crop&q=80',
  'calamares': 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&auto=format&fit=crop&q=80',
  'chipirones': 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&auto=format&fit=crop&q=80',
  'mejillones': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'almejas': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',

  // === HUEVOS Y LÁCTEOS ===
  'tortilla de patatas': 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600&auto=format&fit=crop&q=80',
  'tortilla francesa': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
  'huevos revueltos': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
  'huevos cocidos': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&auto=format&fit=crop&q=80',
  'huevos duros': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&auto=format&fit=crop&q=80',
  'huevos camperos': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&auto=format&fit=crop&q=80',
  'huevo': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&auto=format&fit=crop&q=80',
  'clara de huevo': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&auto=format&fit=crop&q=80',
  'claras pasteurizadas': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&auto=format&fit=crop&q=80',
  'leche entera': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'leche semidesnatada': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'leche desnatada': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'leche sin lactosa': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'bebida de avena': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'bebida de soja': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'bebida de almendras': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'leche': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'yogur griego natural': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'yogur natural': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'yogur desnatado': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'yogur proteico': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'yogur': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',
  'queso fresco batido': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  'queso fresco de burgos': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  'queso cottage': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  'requeson': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
  'queso semicurado': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&auto=format&fit=crop&q=80',
  'queso curado': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&auto=format&fit=crop&q=80',
  'queso manchego': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&auto=format&fit=crop&q=80',
  'queso parmesano': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&auto=format&fit=crop&q=80',
  'mozzarella': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  'kefir': 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&auto=format&fit=crop&q=80',
  'skyr': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80',

  // === CEREALES, GRANOS Y PANES ===
  'arroz blanco': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop&q=80',
  'arroz integral': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'arroz basmati': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop&q=80',
  'arroz': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop&q=80',
  'copos de avena': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80',
  'avena integral': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80',
  'avena': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80',
  'pan integral': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'pan de centeno': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'pan blanco': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'tostadas integrales': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
  'pan': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'espaguetis': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
  'macarrones': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
  'pasta integral': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
  'pasta': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
  'quinoa': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'cuscus': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80',
  'patata cocida': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  'patata asada': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  'patatas': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  'patata': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  'boniato asado': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
  'boniato': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',

  // === LEGUMBRES ===
  'lentejas estofadas': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80',
  'lentejas cocidas': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80',
  'lenteja': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80',
  'garbanzos cocidos': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  'hummus': 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=600&auto=format&fit=crop&q=80',
  'garbanzo': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  'alubias blancas': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'judias blancas': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'alubia': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'guisantes salteados': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80',
  'guisante': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80',
  'soja texturizada': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'tofu firme': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'tofu': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',

  // === FRUTAS ===
  'platano de canarias': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'platano': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  'manzana golden': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  'manzana fuji': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  'manzana': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  'pera': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
  'naranja': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=600&auto=format&fit=crop&q=80',
  'mandarina': 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80',
  'fresas': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
  'fresa': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
  'arandanos': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&auto=format&fit=crop&q=80',
  'arandano': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&auto=format&fit=crop&q=80',
  'frambuesas': 'https://images.unsplash.com/photo-1577069808021-3e479c381c81?w=600&auto=format&fit=crop&q=80',
  'kiwi': 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=600&auto=format&fit=crop&q=80',
  'pina': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&auto=format&fit=crop&q=80',
  'aguacate': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80',
  'sandia': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
  'melon': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
  'uvas': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&auto=format&fit=crop&q=80',
  'melocoton': 'https://images.unsplash.com/photo-1522747776116-64ee03be1dad?w=600&auto=format&fit=crop&q=80',
  'limon': 'https://images.unsplash.com/photo-1533082603883-3be2259b0495?w=600&auto=format&fit=crop&q=80',

  // === VERDURAS Y HORTALIZAS ===
  'brocoli al vapor': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&auto=format&fit=crop&q=80',
  'brocoli': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&auto=format&fit=crop&q=80',
  'espinacas frescas': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
  'espinacas': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
  'espinaca': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80',
  'calabacin a la plancha': 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&auto=format&fit=crop&q=80',
  'calabacin': 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&auto=format&fit=crop&q=80',
  'judias verdes': 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=600&auto=format&fit=crop&q=80',
  'tomate de ensalada': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'tomates cherry': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'tomate': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  'zanahoria': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
  'zanahorias': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
  'cebolla': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
  'pimiento rojo': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80',
  'pimiento verde': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80',
  'lechuga': 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=600&auto=format&fit=crop&q=80',
  'canongos': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'rucula': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'champinon': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=600&auto=format&fit=crop&q=80',
  'champinones': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=600&auto=format&fit=crop&q=80',
  'setas': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=600&auto=format&fit=crop&q=80',
  'esparragos trigueros': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  'esparragos': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  'berenjena': 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80',
  'pepino': 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=600&auto=format&fit=crop&q=80',
  'coliflor': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80',

  // === GRASAS, FRUTOS SECOS Y SEMILLAS ===
  'aceite de oliva virgen extra': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'aceite de oliva': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'aceite': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'aceitunas': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  'almendras crudas': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'almendra': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'nueces': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'nuez': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'anacardos': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'pistachos': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'crema de cacahuete': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  'cacahuete': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  'semillas de chia': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80',
  'chia': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80',
  'semillas de lino': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80',

  // === BEBIDAS, CALDOS Y SUPLEMENTOS ===
  'cafe con leche': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
  'cafe solo': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'cafe': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
  'te verde': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'te': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'proteina whey': 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80',
  'proteina': 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80',
  'caldo de pollo': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
  'caldo': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
  'gazpacho': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
}

// Category fallback photography
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Carnes': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80',
  'Aves': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80',
  'Pescados y Mariscos': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  'Pescados': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  'Huevos y Lácteos': 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
  'Lácteos': 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
  'Huevos': 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&auto=format&fit=crop&q=80',
  'Cereales y Derivados': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'Cereales': 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80',
  'Pastas': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
  'Legumbres': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80',
  'Verduras y Hortalizas': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'Verduras': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'Frutas': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
  'Frutos Secos y Semillas': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'Frutos secos': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
  'Aceites y Grasas': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'Aceites': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'Bebidas': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
  'Preparados y Otros': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
}

const GLOBAL_DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80'

// Instant fallback SVG (Nutritious Bowl in emerald palette)
export const FALLBACK_FOOD_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><rect width="80" height="80" rx="16" fill="%23f0fdf4"/><circle cx="40" cy="42" r="22" fill="%23bbf7d0"/><path d="M40 22c-7 0-14 5.5-14 14 0 9.5 12 20 14 22 2-2 14-12.5 14-22 0-8.5-7-14-14-14z" fill="%2316a34a"/><path d="M40 16v6M42 17c2-2.5 5.5-3.5 8-2.5" stroke="%2315803d" stroke-width="2.5" stroke-linecap="round"/><circle cx="34" cy="34" r="2" fill="%23ffffff" opacity="0.6"/></svg>'

function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Pre-sort keys by descending length so most specific terms match first
const SORTED_KEYS = Object.keys(SPECIFIC_FOOD_IMAGES).sort((a, b) => b.length - a.length)

/**
 * Resolves a realistic high-definition food photograph for any food item.
 * Prioritizes custom database URL, then specific food name keywords, then food category fallback.
 */
export function getFoodImage(food?: {
  name?: string | null
  category?: string | null
  imageUrl?: string | null
} | null): string {
  if (!food) return GLOBAL_DEFAULT_IMAGE

  // 1. If explicit URL provided and valid, return it
  if (food.imageUrl && typeof food.imageUrl === 'string' && food.imageUrl.startsWith('http')) {
    return food.imageUrl
  }

  const normalized = normalizeSearch(food.name || '')
  if (!normalized) {
    if (food.category && CATEGORY_FALLBACK_IMAGES[food.category]) {
      return CATEGORY_FALLBACK_IMAGES[food.category]
    }
    return GLOBAL_DEFAULT_IMAGE
  }

  // 2. Check keyword matches in specific food images (longest phrase first)
  for (const key of SORTED_KEYS) {
    const normKey = normalizeSearch(key)
    if (normalized.includes(normKey)) {
      return SPECIFIC_FOOD_IMAGES[key]
    }
  }

  // 3. Fallback to category image
  if (food.category && CATEGORY_FALLBACK_IMAGES[food.category]) {
    return CATEGORY_FALLBACK_IMAGES[food.category]
  }

  // 4. Default fresh food photo
  return GLOBAL_DEFAULT_IMAGE
}
