'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  Apple,
  Flame,
  ShieldCheck,
  Scale,
  Sparkles,
  Barcode,
  Layers,
  Leaf,
  Droplets,
  DollarSign,
  AlertTriangle,
  Info,
  Calendar,
} from 'lucide-react'

export interface FoodDetailData {
  id: number
  name: string
  category: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG?: number
  saturatedFatG?: number
  monounsaturatedFatG?: number
  polyunsaturatedFatG?: number
  cholesterolMg?: number
  sodiumMg?: number
  potassiumMg?: number
  calciumMg?: number
  ironMg?: number
  magnesiumMg?: number
  zincMg?: number
  iodineUg?: number
  omega3G?: number
  addedSugarsG?: number
  solubleFiberG?: number
  insolubleFiberG?: number
  glycemicIndex?: number | null
  glycemicLoad?: number | null
  fodmapCategory?: string | null
  purinesMg?: number
  oxalatesMg?: number
  nutriScore?: string | null
  novaGroup?: number | null
  householdMeasuresJson?: string
  cookedConversionFactor?: number | null
  ediblePartPercentage?: number | null
  allergensJson?: string
  dietaryTagsJson?: string
  barcode?: string | null
  brandName?: string | null
  dataSource?: string
  isFavorite?: boolean
  isPrivate?: boolean
  isSupplement?: boolean
  supplementDose?: string | null
  seasonMonthsJson?: string
  pricePerKg?: number | null
  carbonFootprintKgCo2?: number | null
  waterFootprintLiters?: number | null
  imageUrl?: string | null
  source?: string
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function FoodDetailsModal({
  food,
  onClose,
}: {
  food: FoodDetailData | null
  onClose: () => void
}) {
  if (!food) return null

  let allergens: string[] = []
  try {
    allergens = food.allergensJson ? JSON.parse(food.allergensJson) : []
  } catch {
    allergens = []
  }

  let dietaryTags: string[] = []
  try {
    dietaryTags = food.dietaryTagsJson ? JSON.parse(food.dietaryTagsJson) : []
  } catch {
    dietaryTags = []
  }

  let householdMeasures: Array<{ name: string; grams: number }> = []
  try {
    householdMeasures = food.householdMeasuresJson ? JSON.parse(food.householdMeasuresJson) : []
  } catch {
    householdMeasures = []
  }

  let seasonMonths: number[] = []
  try {
    seasonMonths = food.seasonMonthsJson ? JSON.parse(food.seasonMonthsJson) : []
  } catch {
    seasonMonths = []
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-start justify-between">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wide bg-blue-700/80 text-blue-100 border border-blue-500/30">
                {food.category || 'Alimento'}
              </span>
              {food.dataSource && (
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-white/10 text-white">
                  Fuente: {food.dataSource}
                </span>
              )}
              {food.nutriScore && (
                <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                  food.nutriScore === 'A' ? 'bg-emerald-600 text-white' :
                  food.nutriScore === 'B' ? 'bg-emerald-500 text-white' :
                  food.nutriScore === 'C' ? 'bg-yellow-500 text-black' :
                  food.nutriScore === 'D' ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'
                }`}>
                  Nutri-Score {food.nutriScore}
                </span>
              )}
              {food.novaGroup && (
                <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                  food.novaGroup === 1 ? 'bg-emerald-600 text-white' :
                  food.novaGroup === 4 ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  NOVA {food.novaGroup} {food.novaGroup === 4 ? '(Ultraprocesado)' : ''}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{food.name}</h2>
            {food.brandName && (
              <p className="text-xs text-blue-200 font-semibold">Marca comercial: {food.brandName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Macros Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <span className="text-2xs font-bold text-gray-500 uppercase block">Energía</span>
              <span className="text-lg font-black text-gray-900">{food.calories}</span>
              <span className="text-2xs text-gray-400 block font-semibold">kcal / 100g</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
              <span className="text-2xs font-bold text-blue-700 uppercase block">Proteína</span>
              <span className="text-lg font-black text-blue-800">{food.proteinG} g</span>
              <span className="text-2xs text-blue-500 block font-semibold">por 100g</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
              <span className="text-2xs font-bold text-amber-700 uppercase block">Carbohidratos</span>
              <span className="text-lg font-black text-amber-800">{food.carbsG} g</span>
              <span className="text-2xs text-amber-500 block font-semibold">Azúcares: {food.sugarG || 0}g</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
              <span className="text-2xs font-bold text-rose-700 uppercase block">Grasas Totales</span>
              <span className="text-lg font-black text-rose-800">{food.fatG} g</span>
              <span className="text-2xs text-rose-500 block font-semibold">Sat: {food.saturatedFatG || 0}g</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center col-span-2 sm:col-span-1">
              <span className="text-2xs font-bold text-emerald-700 uppercase block">Fibra Total</span>
              <span className="text-lg font-black text-emerald-800">{food.fiberG} g</span>
              <span className="text-2xs text-emerald-500 block font-semibold">Sol: {food.solubleFiberG || 0}g</span>
            </div>
          </div>

          {/* Section: Minerales y Vitaminas Clave (5.6: Na, K, Ca, Fe, Mg, Zn, I) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Minerales y Micronutrientes (por 100g)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Sodio (Na):</span>
                <span className="font-bold text-gray-900">{food.sodiumMg || 0} mg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Potasio (K):</span>
                <span className="font-bold text-gray-900">{food.potassiumMg || 0} mg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Calcio (Ca):</span>
                <span className="font-bold text-gray-900">{food.calciumMg || 0} mg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Hierro (Fe):</span>
                <span className="font-bold text-gray-900">{food.ironMg || 0} mg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Magnesio (Mg):</span>
                <span className="font-bold text-gray-900">{food.magnesiumMg || 0} mg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Zinc (Zn):</span>
                <span className="font-bold text-gray-900">{food.zincMg || 0} mg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Yodo (I):</span>
                <span className="font-bold text-gray-900">{food.iodineUg || 0} µg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-600 font-medium">Omega-3:</span>
                <span className="font-bold text-gray-900">{food.omega3G || 0} g</span>
              </div>
            </div>
          </div>

          {/* Section: Perfil Clínico Específico (FODMAP, Purinas, Oxalatos, IG, CG) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Parámetros Clínicos de Seguridad y Digestión</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50/40 border border-blue-100">
                <span className="text-gray-500 block text-2xs uppercase font-bold">FODMAP</span>
                <span className="font-extrabold text-blue-900 text-sm">
                  {food.fodmapCategory || 'Bajo / Apto'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/40 border border-amber-100">
                <span className="text-gray-500 block text-2xs uppercase font-bold">Índice / Carga Glucémica</span>
                <span className="font-extrabold text-amber-900 text-sm">
                  IG: {food.glycemicIndex ?? '—'} | CG: {food.glycemicLoad ?? '—'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100">
                <span className="text-gray-500 block text-2xs uppercase font-bold">Purinas & Oxalatos</span>
                <span className="font-extrabold text-purple-900 text-sm">
                  {food.purinesMg || 0} mg purinas • {food.oxalatesMg || 0} mg oxalatos
                </span>
              </div>
            </div>
          </div>

          {/* Section: Medidas Caseras y Cocinado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>Medidas Caseras Habituales</span>
              </span>
              {householdMeasures.length > 0 ? (
                <div className="space-y-1 text-xs">
                  {householdMeasures.map((m, idx) => (
                    <div key={idx} className="flex justify-between text-gray-600 border-b border-gray-100 pb-1">
                      <span>1 {m.name}:</span>
                      <span className="font-bold text-gray-900">{m.grams} g</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Porción estándar: 1 ración = 100g. Factor crudo a cocinado: {food.cookedConversionFactor || '1.0'}. Parte comestible: {food.ediblePartPercentage || 100}%.
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Sostenibilidad y Economía</span>
              </span>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Precio estimado:</span>
                  <span className="font-bold text-gray-900">{food.pricePerKg ? `${food.pricePerKg} €/kg` : 'No registrado'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Huella de carbono:</span>
                  <span className="font-bold text-gray-900">{food.carbonFootprintKgCo2 ? `${food.carbonFootprintKgCo2} kg CO2/kg` : 'Baja'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Huella hídrica:</span>
                  <span className="font-bold text-gray-900">{food.waterFootprintLiters ? `${food.waterFootprintLiters} L/kg` : 'Moderada'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Alérgenos y Etiquetas Dietéticas */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-700 block">Alérgenos y Etiquetas:</span>
            <div className="flex flex-wrap gap-1.5">
              {allergens.length > 0 ? (
                allergens.map((alg) => (
                  <Badge key={alg} variant="destructive" className="text-2xs font-bold rounded-lg">
                    ⚠️ {alg}
                  </Badge>
                ))
              ) : (
                <Badge className="bg-emerald-100 text-emerald-900 text-2xs font-semibold rounded-lg">
                  ✓ Libre de alérgenos de declaración obligatoria
                </Badge>
              )}
              {dietaryTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-2xs font-semibold rounded-lg bg-blue-50 text-blue-800 border-blue-200">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Barcode & Supermarket info */}
          {food.barcode && (
            <div className="p-3 rounded-2xl bg-gray-100/70 border border-gray-200 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-mono text-gray-700">
                <Barcode className="w-4 h-4 text-gray-600" />
                <span>Código de Barras EAN-13: <strong>{food.barcode}</strong></span>
              </span>
              {food.brandName && (
                <span className="text-gray-500 font-semibold">{food.brandName}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button onClick={onClose} variant="default" className="rounded-2xl text-xs font-bold px-6">
            Cerrar ficha clínica
          </Button>
        </div>
      </div>
    </div>
  )
}
