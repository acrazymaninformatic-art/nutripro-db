/**
 * @file exchange-system.ts
 * @description Sistema de Intercambios Clínicos de Alimentos según los estándares
 * de la Academia Española de Nutrición y Dietética, CESNID y SEEDO (estilo EasyDiet).
 * Permite pautar y flexibilizar dietas por raciones de intercambio en lugar de gramos rígidos.
 */

export interface ExchangeGroup {
  id: string
  name: string
  shortName: string
  color: string
  badgeBg: string
  badgeText: string
  baseUnitDefinition: string
  macronutrientsPerExchange: {
    kcal: number
    carbsG: number
    proteinG: number
    fatG: number
  }
  examples: {
    food: string
    quantity: string
    notes?: string
  }[]
}

export const FOOD_EXCHANGE_GROUPS: Record<string, ExchangeGroup> = {
  carbs: {
    id: 'carbs',
    name: 'Hidratos de Carbono (Harinas / Féculas)',
    shortName: 'HC',
    color: '#F59E0B',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    baseUnitDefinition: '1 Intercambio = 10 g de Hidratos de Carbono netos (aprox. 45-50 kcal)',
    macronutrientsPerExchange: {
      kcal: 48,
      carbsG: 10,
      proteinG: 1.5,
      fatG: 0.3,
    },
    examples: [
      { food: 'Pan integral o blanco', quantity: '20 g' },
      { food: 'Patata cocida o asada', quantity: '55 g' },
      { food: 'Arroz blanco o integral (en crudo)', quantity: '13 g (40 g cocido)' },
      { food: 'Pasta o fideos (en crudo)', quantity: '14 g (45 g cocida)' },
      { food: 'Copos de avena integral', quantity: '16 g' },
      { food: 'Boniato / Batata cocida', quantity: '45 g' },
      { food: 'Biscotes integrales / Tostadas', quantity: '15 g (1 unidad)' },
      { food: 'Quinoa o cuscús (en crudo)', quantity: '15 g' },
    ],
  },
  protein: {
    id: 'protein',
    name: 'Alimentos Proteicos (Carnes, Pescados, Huevos, Tofu)',
    shortName: 'PROT',
    color: '#EF4444',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    baseUnitDefinition: '1 Intercambio = 10 g de Proteína neta (aprox. 55-75 kcal)',
    macronutrientsPerExchange: {
      kcal: 65,
      carbsG: 0,
      proteinG: 10,
      fatG: 2.8,
    },
    examples: [
      { food: 'Pechuga de pollo o pavo limpia', quantity: '45 g' },
      { food: 'Ternera magra / Lomo de cerdo', quantity: '45 g' },
      { food: 'Pescado blanco (merluza, bacalao, dorada)', quantity: '55 g' },
      { food: 'Pescado azul (salmón, atún, sardinas)', quantity: '50 g (incluye grasa saludable)' },
      { food: 'Huevos de gallina camperos L', quantity: '1 unidad mediana + 1 clara' },
      { food: 'Claras de huevo pasteurizadas', quantity: '90 g (3 claras)' },
      { food: 'Atún al natural escurrido', quantity: '42 g (media lata)' },
      { food: 'Tofu firme natural', quantity: '80 g' },
      { food: 'Gambas o langostinos cocidos', quantity: '50 g' },
      { food: 'Sepia o calamar a la plancha', quantity: '60 g' },
    ],
  },
  vegetables: {
    id: 'vegetables',
    name: 'Verduras y Hortalizas',
    shortName: 'VERD',
    color: '#10B981',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    baseUnitDefinition: '1 Intercambio = 5 g de Hidratos de Carbono (aprox. 25-30 kcal, alta fibra)',
    macronutrientsPerExchange: {
      kcal: 28,
      carbsG: 5,
      proteinG: 1.5,
      fatG: 0.2,
    },
    examples: [
      { food: 'Lechuga, canónigos, rúcula, espinacas crudas', quantity: '150-200 g (plato muy hondo)' },
      { food: 'Tomate de ensalada fresco', quantity: '150 g (1 tomate mediano)' },
      { food: 'Calabacín o berenjena', quantity: '150 g' },
      { food: 'Brócoli o coliflor cocida', quantity: '130 g' },
      { food: 'Espárragos verdes o blancos', quantity: '180 g' },
      { food: 'Champiñones o setas', quantity: '160 g' },
      { food: 'Pimiento rojo o verde', quantity: '120 g' },
      { food: 'Zanahoria cruda o cocida', quantity: '70 g' },
    ],
  },
  fruits: {
    id: 'fruits',
    name: 'Frutas Frescas',
    shortName: 'FRUT',
    color: '#F97316',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    baseUnitDefinition: '1 Intercambio = 10 g de Fructosa/Glucosa natural (aprox. 45-50 kcal)',
    macronutrientsPerExchange: {
      kcal: 46,
      carbsG: 10,
      proteinG: 0.6,
      fatG: 0.2,
    },
    examples: [
      { food: 'Manzana o pera con piel', quantity: '90 g (1 unidad pequeña)' },
      { food: 'Naranja o mandarina pelada', quantity: '110 g (1 naranja o 2 mandarinas)' },
      { food: 'Plátano maduro pelado', quantity: '55 g (medio plátano)' },
      { food: 'Fresas, frambuesas o moras', quantity: '150 g (1 taza colmada)' },
      { food: 'Arándanos frescos', quantity: '80 g' },
      { food: 'Kiwi verde o amarillo', quantity: '90 g (1 unidad)' },
      { food: 'Sandía o melón en dados', quantity: '150 g' },
      { food: 'Uvas frescas', quantity: '65 g (8-10 granos)' },
    ],
  },
  dairy: {
    id: 'dairy',
    name: 'Lácteos y Derivados',
    shortName: 'LÁCT',
    color: '#3B82F6',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    baseUnitDefinition: '1 Intercambio = 1 ración láctea estándar (5 g Prot, 9 g HC, aprox. 65-80 kcal)',
    macronutrientsPerExchange: {
      kcal: 75,
      carbsG: 9,
      proteinG: 6,
      fatG: 1.5,
    },
    examples: [
      { food: 'Leche desnatada o semidesnatada', quantity: '200 ml (1 vaso)' },
      { food: 'Yogur natural entero o 0%', quantity: '125 g (1 vasito)' },
      { food: 'Queso fresco batido 0% o Quark', quantity: '100 g' },
      { food: 'Queso fresco tipo Burgos desnatado', quantity: '80 g' },
      { food: 'Kéfir natural sin azucarar', quantity: '180 ml' },
      { food: 'Bebida de soja sin azúcar añadido', quantity: '200 ml' },
    ],
  },
  fats: {
    id: 'fats',
    name: 'Grasas y Aceites Saludables',
    shortName: 'GRAS',
    color: '#EAB308',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    baseUnitDefinition: '1 Intercambio = 10 g de Lípidos puros (aprox. 90 kcal)',
    macronutrientsPerExchange: {
      kcal: 90,
      carbsG: 0,
      proteinG: 0,
      fatG: 10,
    },
    examples: [
      { food: 'Aceite de oliva virgen extra (AOVE)', quantity: '10 g (1 cucharada sopera rasa)' },
      { food: 'Aguacate Hass maduro', quantity: '65 g (¼ aguacate)' },
      { food: 'Nueces de California peladas', quantity: '15 g (4-5 mitades)' },
      { food: 'Almendras o avellanas crudas', quantity: '18 g (15-18 unidades)' },
      { food: 'Semillas de chía o lino molidas', quantity: '25 g' },
      { food: 'Mantequilla o crema de cacahuete 100%', quantity: '18 g (1 cucharada de postre colmada)' },
      { food: 'Aceitunas aliñadas', quantity: '60 g (10-12 aceitunas)' },
    ],
  },
  legumes: {
    id: 'legumes',
    name: 'Legumbres (Carbohidrato + Proteína Vegetal)',
    shortName: 'LEGUM',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    baseUnitDefinition: '1 Intercambio = 10 g HC + 5 g Proteína vegetal (aprox. 75 kcal)',
    macronutrientsPerExchange: {
      kcal: 75,
      carbsG: 10,
      proteinG: 5,
      fatG: 0.6,
    },
    examples: [
      { food: 'Lentejas cocidas escurridas', quantity: '55 g (20 g en crudo)' },
      { food: 'Garbanzos cocidos escurridos', quantity: '50 g (18 g en crudo)' },
      { food: 'Alubias blancas o pintas cocidas', quantity: '55 g (20 g en crudo)' },
      { food: 'Guisantes cocidos', quantity: '70 g' },
      { food: 'Edamame desvainado cocido', quantity: '45 g' },
    ],
  },
}

/**
 * Calcula el número aproximado de intercambios de una comida o alimento
 */
export function calculateFoodExchanges(nutrients: { carbsG: number; proteinG: number; fatG: number }) {
  const carbsExchanges = Math.round((nutrients.carbsG / 10) * 10) / 10
  const proteinExchanges = Math.round((nutrients.proteinG / 10) * 10) / 10
  const fatExchanges = Math.round((nutrients.fatG / 10) * 10) / 10

  return {
    carbsExchanges,
    proteinExchanges,
    fatExchanges,
    summaryLabel: `${carbsExchanges} HC · ${proteinExchanges} PROT · ${fatExchanges} GRASA`,
  }
}
