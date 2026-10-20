'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CalendarDays, ChefHat, CookingPot, Droplets, Info, Layers, ShieldCheck, ShoppingCart } from 'lucide-react'
import {
  getFoodImage,
  getRecipeForFood,
  FALLBACK_FOOD_SVG,
  type ClinicalRecipe,
  checkPatientAllergenConflict,
} from '@/lib/nutrition'
import { FOOD_EXCHANGE_GROUPS } from '@/lib/nutrition/exchange-system'

export interface PlanDossierPdfProps {
  plan: any
  hideCaloriesTCA?: boolean
  className?: string
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  MID_MORNING: 'Media Mañana',
  LUNCH: 'Comida',
  SNACK: 'Merienda',
  DINNER: 'Cena',
  LATE_SNACK: 'Recena',
}

const DAY_NAMES = [
  'Lunes (Día 1)',
  'Martes (Día 2)',
  'Miércoles (Día 3)',
  'Jueves (Día 4)',
  'Viernes (Día 5)',
  'Sábado (Día 6)',
  'Domingo (Día 7)',
]

function getPreparationTip(foodName: string, category: string | null, customNotes?: string | null): string {
  if (customNotes && customNotes.trim() && !customNotes.toLowerCase().includes('al gusto')) {
    return customNotes.trim()
  }

  const n = (foodName || '').toLowerCase()
  if (n.includes('pollo') || n.includes('pavo')) {
    return 'A la plancha vuelta y vuelta con unas gotas de AOVE, orégano y zumo de limón natural.'
  }
  if (n.includes('salmón') || n.includes('salmon')) {
    return 'A la plancha dorando 3 min por lado a fuego medio-alto con eneldo fresco.'
  }
  if (n.includes('merluza') || n.includes('dorada') || n.includes('lubina') || n.includes('bacalao')) {
    return 'Al horno a 180°C con rodajitas de limón o al vapor con ajo y perejil picado.'
  }
  if (n.includes('ternera') || n.includes('solomillo') || n.includes('lomo')) {
    return 'A la plancha bien caliente vuelta y vuelta (al punto) con pimienta negra recién molida.'
  }
  if (n.includes('huevo') || n.includes('clara')) {
    return 'Poché (escalfado 3 min en agua hirviendo), cocido 8 min o revuelto en sartén antiadherente.'
  }
  if (n.includes('tofu') || n.includes('tempeh')) {
    return 'Marinado 10 min en salsa de soja baja en sal y dorado a la plancha hasta que quede crujiente.'
  }
  if (n.includes('arroz')) {
    return 'Cocido al dente en agua hirviendo con un diente de ajo machacado y una hoja de laurel.'
  }
  if (n.includes('pasta') || n.includes('macarron') || n.includes('espagueti') || n.includes('penne')) {
    return 'Cocida al dente en abundante agua hirviendo con sal; escurrir sin lavar con agua fría.'
  }
  if (n.includes('avena')) {
    return 'Porridge templado cocinado en agua o bebida vegetal con una pizca de canela en rama.'
  }
  if (n.includes('patata') || n.includes('boniato')) {
    return 'Cocida al vapor o asada en láminas al horno con piel durante 25-30 minutos.'
  }
  if (n.includes('lenteja') || n.includes('garbanzo') || n.includes('alubia')) {
    return 'Guisadas con sofrito de verduras (cebolla, pimiento, zanahoria, tomate) sin grasas añadidas.'
  }
  if (n.includes('brócoli') || n.includes('judía verde') || n.includes('espárrago')) {
    return 'Al vapor durante 6-7 minutos para mantener su textura crujiente y preservar nutrientes.'
  }
  if (n.includes('calabacín') || n.includes('berenjena') || n.includes('champiñ') || n.includes('seta')) {
    return 'A la plancha en rodajas con unas gotas de aceite y una pizca de hierbas provenzales.'
  }
  if (n.includes('aceite')) {
    return 'Añadir siempre en crudo vertido directamente sobre el plato una vez servido.'
  }
  if (n.includes('nuez') || n.includes('almendra') || n.includes('cacahuete') || n.includes('avellana')) {
    return 'Consumir al natural o tostado sin sal añadida.'
  }
  if (n.includes('pan')) {
    return 'Ligeramente tostado para mejorar su digestibilidad.'
  }
  if (n.includes('manzana') || n.includes('pera') || n.includes('plátano') || n.includes('kiwi') || n.includes('fruta')) {
    return 'Pieza entera fresca, bien lavada y con piel si es comestible para aprovechar la fibra.'
  }
  if (n.includes('yogur') || n.includes('kéfir') || n.includes('queso fresco')) {
    return 'Servir frío, mezclado con la fruta o espolvoreado con canela.'
  }
  if (category === 'Verduras y Hortalizas') {
    return 'Lavar bien; cocinar al vapor o servir en ensalada fresca aliñada en crudo.'
  }
  return 'Cocción saludable a la plancha, al vapor o al horno respetando la porción indicada.'
}

export function PlanDossierPdf({ plan, hideCaloriesTCA: hideCaloriesTCAProp, className }: PlanDossierPdfProps) {
  const hideCaloriesTCA = hideCaloriesTCAProp ?? Boolean(plan.hideCaloriesTCA)

  const patient = plan.patient || {
    firstName: 'Paciente',
    lastName: '',
    sex: null,
    heightCm: null,
    allergies: null,
    intolerances: null,
  }

  const categorizedGrocery = useMemo(() => {
    const map = new Map<string, { name: string; category: string; quantityG: number; food: any }>()

    ;(plan.days || []).forEach((day: any) => {
      ;(day.meals || []).forEach((meal: any) => {
        ;(meal.items || []).forEach((item: any) => {
          if (item.food) {
            const key = item.food.name
            const existing = map.get(key)
            if (existing) {
              existing.quantityG += item.quantityG
            } else {
              map.set(key, {
                name: item.food.name,
                category: item.food.category || 'Otros',
                quantityG: item.quantityG,
                food: item.food,
              })
            }
          }
        })
      })
    })

    const items = Array.from(map.values())
    const categoriesMap: Record<string, typeof items> = {}

    items.forEach((item) => {
      const cat = item.category || 'Varios y Despensa'
      if (!categoriesMap[cat]) categoriesMap[cat] = []
      categoriesMap[cat].push(item)
    })

    return categoriesMap
  }, [plan])

  const totalGroceryCount = useMemo(() => {
    let count = 0
    Object.values(categorizedGrocery).forEach((arr) => {
      count += arr.length
    })
    return count
  }, [categorizedGrocery])

  function getDayFeaturedRecipe(day: any): ClinicalRecipe | null {
    for (const meal of day.meals || []) {
      for (const item of meal.items || []) {
        if (item.food) {
          const rec = getRecipeForFood(item.food.name, item.food.category)
          if (rec) return rec
        }
      }
    }
    return null
  }

  return (
    <div className={className || 'space-y-8 print:space-y-0'}>
      {/* ---------------------------------------------------------------------
          HOJA 1: PORTADA CLÍNICA Y RESUMEN DEL PACIENTE (A4 PAGE 1)
          --------------------------------------------------------------------- */}
      <section className="dossier-page relative bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.035] print:opacity-[0.055] z-0 overflow-hidden" aria-hidden="true">
          <img
            src="/logo.png"
            alt=""
            className="w-[420px] max-w-[70%] object-contain filter grayscale"
          />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Encabezado Institucional */}
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white border border-blue-200 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Eva Vidal"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Eva Vidal Nutrición <span className="text-blue-600 font-light">• EVSoftware</span>
                </h1>
                <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">
                  Dossier de Prescripción Dietética y Recetario Clínico
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-gray-600 space-y-0.5">
              <p className="font-black text-gray-900 text-sm">Eva Vidal Nutrición</p>
              <p className="text-gray-500 font-medium">Nº Colegiado: MAD-4892 • Especialidad Médica</p>
              <p className="text-gray-400">
                Fecha de Emisión: {new Date(plan.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Ficha Resumen del Paciente */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-sky-50/40 border border-blue-200">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
                Paciente
              </span>
              <span className="text-base font-black text-gray-900 block mt-0.5">
                {patient.firstName} {patient.lastName}
              </span>
              <span className="text-xs text-gray-600 font-medium block">
                {patient.sex === 'FEMALE' ? 'Mujer' : patient.sex === 'MALE' ? 'Hombre' : 'Adulto'} {patient.heightCm ? `• ${patient.heightCm} cm` : ''}
              </span>
              {(patient.allergies || patient.intolerances) && (
                <span className="inline-block mt-1 text-[9px] font-black bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded-md">
                  <AlertTriangle className="h-[1em] w-[1em] shrink-0" /> Alergias: {[patient.allergies, patient.intolerances].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
                Plan Nutricional
              </span>
              <span className="text-sm font-black text-gray-900 block mt-0.5 truncate">
                {plan.name}
              </span>
              <span className="text-xs text-gray-600 font-medium">
                Programación: 7 Días Completos
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
                {hideCaloriesTCA ? 'Enfoque Clínico' : 'Meta Calórica Diaria'}
              </span>
              <span className="text-xl font-black text-blue-950 block mt-0.5 leading-none">
                {hideCaloriesTCA ? 'Pauta Cualitativa' : `${plan.targetKcal || '~2000'} kcal/día`}
              </span>
              <span className="text-[10px] text-blue-700 font-bold block mt-1">
                {hideCaloriesTCA ? 'Enfoque en hábitos y raciones' : 'Cálculo individualizado'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
                {hideCaloriesTCA ? 'Estructura Nutricional' : 'Macronutrientes Objetivo'}
              </span>
              {hideCaloriesTCA ? (
                <span className="text-xs font-bold text-gray-800 block mt-1">
                  Alimentación real y equilibrada
                </span>
              ) : (
                <div className="flex items-center gap-1.5 mt-1 font-black text-xs text-gray-800">
                  <span className="text-blue-700">{plan.targetProteinG || 90}g P</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-amber-700">{plan.targetCarbsG || 180}g C</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-rose-700">{plan.targetFatG || 60}g G</span>
                </div>
              )}
              <span className="text-[10px] text-gray-400 block mt-1">
                {hideCaloriesTCA ? 'Sin fijación cuantitativa' : 'Distribución metabólica'}
              </span>
            </div>
          </div>

          {/* Pautas Generales de Salud y Técnicas de Cocinado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wide">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span>Hidratación y Hábitos de Vida</span>
              </div>
              <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                <li>Beber de <strong>2 a 2.5 litros de agua</strong> al día repartidos entre tomas.</li>
                <li>Las infusiones y cafés sin azúcar añadido contabilizan para la hidratación.</li>
                <li>Mantener un descanso regular de <strong>7 a 8 horas</strong> de sueño reparador.</li>
                <li>Realizar actividad física diaria: caminar un mínimo de 8.000 a 10.000 pasos.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wide">
                <ChefHat className="h-4 w-4 text-blue-600" />
                <span>Técnicas Culinarias Recomendadas</span>
              </div>
              <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                <li>Priorizar cocciones <strong>a la plancha, al vapor, al horno o freidora de aire</strong>.</li>
                <li>Usar el aceite de oliva virgen extra preferentemente <strong>en crudo como aliño</strong>.</li>
                <li>Potenciar el sabor con especias, hierbas aromáticas, ajo, vinagre y limón.</li>
                <li>Pesar los alimentos en crudo y limpios antes de cocinarlos salvo indicación.</li>
              </ul>
            </div>
          </div>

          {/* Indicaciones Específicas del Nutricionista para este Paciente */}
          {plan.notes && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wide">
                <Info className="h-4 w-4 text-blue-700" />
                <span>Pautas Médicas y Observaciones Individuales</span>
              </div>
              <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                {plan.notes}
              </p>
            </div>
          )}

          {/* Sello y Compromiso Clínico */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Documento oficial de prescripción nutricional validado clínicamente.</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-gray-700">Firma del Especialista:</span> ___________________
            </div>
          </div>
        </div>

        {/* Pie de Página Hoja 1 */}
        <div className="dossier-footer pt-3 mt-6 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
          <span>Eva Vidal Nutrición • Expediente: {patient.lastName}, {patient.firstName}</span>
          <span className="font-bold">Hoja 1 de 10 • Portada y Prescripción General</span>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          HOJAS 2 A 8: CADA UNO DE LOS 7 DÍAS EN SU PROPIA HOJA A4 DEDICADA
          --------------------------------------------------------------------- */}
      {(plan.days || []).map((day: any, dIdx: number) => {
        let dayKcal = 0
        let dayProt = 0
        let dayCarbs = 0
        let dayFat = 0

        ;(day.meals || []).forEach((m: any) => {
          ;(m.items || []).forEach((it: any) => {
            if (it.food && it.quantityG > 0) {
              const factor = it.quantityG / 100
              dayKcal += it.food.calories * factor
              dayProt += it.food.proteinG * factor
              dayCarbs += it.food.carbsG * factor
              dayFat += it.food.fatG * factor
            }
          })
        })

        const pageNumber = dIdx + 2
        const featuredRecipe = getDayFeaturedRecipe(day)

        return (
          <section
            key={day.id || dIdx}
            className="dossier-page relative bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 space-y-3.5 overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.035] print:opacity-[0.055] z-0 overflow-hidden" aria-hidden="true">
              <img
                src="/logo.png"
                alt=""
                className="w-[380px] max-w-[65%] object-contain filter grayscale"
              />
            </div>

            <div className="relative z-10 space-y-3 flex-1">
              {/* Encabezado del Día */}
              <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-sm tracking-wide text-white">
                      {day.customName || DAY_NAMES[dIdx] || `Día ${day.dayNumber || dIdx + 1}`}
                    </h2>
                    <span className="text-[10px] text-gray-300 font-medium">
                      Paciente: {patient.firstName} {patient.lastName} • Pauta Personalizada
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {hideCaloriesTCA ? (
                    <span className="bg-purple-600/30 text-purple-200 font-extrabold px-2.5 py-1 rounded-lg border border-purple-500/40">
                      Pauta Cualitativa Equilibrada
                    </span>
                  ) : (
                    <>
                      <span className="bg-blue-600/30 text-blue-300 font-extrabold px-2.5 py-1 rounded-lg border border-blue-500/40">
                        {Math.round(dayKcal)} kcal
                      </span>
                      <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-gray-200 bg-white/10 px-2.5 py-1 rounded-lg">
                        <span className="text-blue-300">{dayProt.toFixed(0)}g Prot</span>
                        <span>•</span>
                        <span className="text-amber-300">{dayCarbs.toFixed(0)}g Carb</span>
                        <span>•</span>
                        <span className="text-rose-300">{dayFat.toFixed(0)}g Gras</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Las 5 Comidas del Día en Tablas Profesionales */}
              <div className="space-y-2">
                {(day.meals || []).map((meal: any) => {
                  let mealKcal = 0
                  let mealProt = 0
                  let mealCarbs = 0
                  let mealFat = 0

                  ;(meal.items || []).forEach((it: any) => {
                    if (it.food && it.quantityG > 0) {
                      const factor = it.quantityG / 100
                      mealKcal += it.food.calories * factor
                      mealProt += it.food.proteinG * factor
                      mealCarbs += it.food.carbsG * factor
                      mealFat += it.food.fatG * factor
                    }
                  })

                  if (!meal.items || meal.items.length === 0) return null

                  return (
                    <div
                      key={meal.id}
                      className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs print:border-gray-300"
                    >
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                        <span className="font-black text-[11px] uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                          {MEAL_LABELS[meal.mealType] || meal.mealType}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {hideCaloriesTCA
                            ? 'Toma Equilibrada'
                            : `${Math.round(mealKcal)} kcal (${mealProt.toFixed(0)}g P • ${mealCarbs.toFixed(0)}g C • ${mealFat.toFixed(0)}g G)`}
                        </span>
                      </div>

                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50/70 text-[9px] uppercase font-bold text-gray-500 border-b border-gray-200">
                            <th className="py-1 px-2 w-10 text-center">Foto</th>
                            <th className="py-1 px-2.5 w-48">Alimento</th>
                            <th className="py-1 px-2 w-20 text-center">Ración</th>
                            <th className="py-1 px-2 w-16 text-right">Energía</th>
                            <th className="py-1 px-2.5">Pauta y Preparación Culinaria</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px]">
                          {(meal.items || []).map((it: any) => {
                            const factor = it.quantityG / 100
                            const kcal = it.food ? Math.round(it.food.calories * factor) : 0
                            const imageUrl = it.food ? getFoodImage(it.food) : ''
                            const prepTip = getPreparationTip(it.food?.name || '', it.food?.category || null, it.notes)
                            const itemRecipe = it.food ? getRecipeForFood(it.food.name, it.food.category) : null
                            const itemConflict = it.food && patient ? checkPatientAllergenConflict(it.food, patient as any) : null

                            return (
                              <tr key={it.id} className={`hover:bg-gray-50/40 ${itemConflict ? 'bg-red-50/60' : ''}`}>
                                <td className="py-1 px-2 text-center align-middle">
                                  <div className={`h-8 w-8 mx-auto rounded-lg overflow-hidden bg-gray-100 border shadow-2xs ${itemConflict ? 'border-red-300' : 'border-gray-200'}`}>
                                    <img
                                      src={imageUrl}
                                      alt={it.food?.name || 'Alimento'}
                                      className="h-full w-full object-cover"
                                      loading="eager"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null
                                        e.currentTarget.src = FALLBACK_FOOD_SVG
                                      }}
                                    />
                                  </div>
                                </td>

                                <td className="py-1 px-2.5 align-middle">
                                  <div className="font-extrabold text-gray-900 leading-snug">
                                    {it.food?.name || 'Alimento no especificado'}
                                  </div>
                                  <div className="text-[10px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                                    <span>{it.food?.category || 'General'}</span>
                                    {itemConflict && (
                                      <span className="text-red-700 font-black bg-red-100 px-1 rounded text-[9px]">
                                        <AlertTriangle className="h-[1em] w-[1em] shrink-0" /> Alérgeno: {itemConflict.allergenLabel}
                                      </span>
                                    )}
                                    {itemRecipe && (
                                      <span className="text-blue-700 font-semibold bg-blue-50 px-1 rounded text-[9px]">
                                        <CookingPot className="h-4 w-4" /> {itemRecipe.name}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-1 px-2 text-center align-middle">
                                  <span className="font-black text-gray-950 text-xs block">
                                    {it.quantityG} g
                                  </span>
                                  {it.portionMeasureName && (
                                    <span className="text-[9px] text-gray-500 block leading-tight">
                                      ~{it.servings || 1} {it.portionMeasureName}
                                    </span>
                                  )}
                                </td>

                                <td className="py-1 px-2 text-right align-middle font-bold text-gray-700">
                                  {hideCaloriesTCA ? (
                                    <span className="text-gray-400 text-[10px] font-medium">—</span>
                                  ) : (
                                    <span>{kcal} kcal</span>
                                  )}
                                </td>

                                <td className="py-1 px-2.5 align-middle text-[10px] text-gray-600 leading-snug">
                                  <span>{prepTip}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>

              {/* Receta Destacada del Día */}
              {featuredRecipe && (
                <div className="border border-blue-200 rounded-2xl p-3 bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-white shadow-2xs space-y-1.5 print:border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-blue-950 flex items-center gap-1.5">
                      <ChefHat className="h-3.5 w-3.5 text-blue-700" />
                      Receta Sugerida del Día: {featuredRecipe.name}
                    </span>
                    <span className="text-[10px] font-bold text-blue-800">
                      ⏱ {featuredRecipe.prepTimeMin} min prep • {featuredRecipe.cookTimeMin} min cocción
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-700 leading-snug line-clamp-2">
                    <strong className="text-gray-900">Preparación rápida:</strong> {featuredRecipe.steps?.join(' ') || ''}
                  </div>
                </div>
              )}
            </div>

            {/* Pie de Página del Día */}
            <div className="dossier-footer relative z-10 pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="" className="h-3.5 w-3.5 object-contain" />
                <span>Eva Vidal Nutrición • {day.customName || `Día ${day.dayNumber || dIdx + 1}`}</span>
              </div>
              <span className="font-bold text-gray-500">Hoja {pageNumber} de 10 • Pauta Diaria</span>
            </div>
          </section>
        )
      })}

      {/* ---------------------------------------------------------------------
          HOJA 9: GUÍA CLÍNICA DE INTERCAMBIOS POR GRUPOS (A4 PAGE 9)
          --------------------------------------------------------------------- */}
      <section className="dossier-page relative bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 space-y-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.035] print:opacity-[0.055] z-0 overflow-hidden" aria-hidden="true">
          <img
            src="/logo.png"
            alt=""
            className="w-[420px] max-w-[70%] object-contain filter grayscale"
          />
        </div>

        <div className="relative z-10 space-y-4 flex-1">
          {/* Encabezado Hoja de Intercambios */}
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-800 shadow-2xs">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Guía Oficial de Equivalencias e Intercambios Clínicos
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Cualquier alimento de un grupo puede sustituirse libremente por otro del mismo grupo respetando la porción indicada
                </p>
              </div>
            </div>

            <Badge variant="outline" className="border-blue-300 text-blue-800 bg-blue-50 text-xs py-1 px-3 font-bold rounded-full">
              Sistema de Raciones Clínicas
            </Badge>
          </div>

          {/* Grilla de Grupos de Intercambio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(FOOD_EXCHANGE_GROUPS).map((group) => (
              <div key={group.id} className="p-3 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${group.badgeBg} ${group.badgeText}`}>
                    {group.name}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500">
                    {group.macronutrientsPerExchange.kcal} kcal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {group.examples.slice(0, 6).map((ex, i) => (
                    <div key={i} className="p-1.5 rounded-xl bg-white border border-gray-100 flex items-center justify-between">
                      <span className="text-gray-900 font-bold truncate pr-1">{ex.food}</span>
                      <span className="text-blue-800 font-extrabold shrink-0">{ex.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Consejo Clínico de Flexibilidad */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong>Regla de oro de la consulta:</strong> No es necesario comer exactamente el mismo alimento si no te apetece o no lo tienes a mano. Sustitúyelo por cualquiera de su mismo grupo con su ración equivalente para mantener exactamente el mismo impacto metabólico.
            </span>
          </div>
        </div>

        {/* Pie de Página Hoja 9 */}
        <div className="dossier-footer relative z-10 pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="" className="h-3.5 w-3.5 object-contain" />
            <span>Eva Vidal Nutrición • Guía de Intercambios Clínicos</span>
          </div>
          <span className="font-bold text-gray-500">Hoja 9 de 10 • Flexibilidad Dietética</span>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          HOJA 10: LISTA DE LA COMPRA SEMANAL CONSOLIDADA (A4 PAGE 10)
          --------------------------------------------------------------------- */}
      <section className="dossier-page relative bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 space-y-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.035] print:opacity-[0.055] z-0 overflow-hidden" aria-hidden="true">
          <img
            src="/logo.png"
            alt=""
            className="w-[420px] max-w-[70%] object-contain filter grayscale"
          />
        </div>

        <div className="relative z-10 space-y-4 flex-1">
          {/* Encabezado Lista de la Compra */}
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-800 shadow-2xs">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Lista de la Compra Semanal Completa
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Cantidades netas consolidadas para los 7 días de menú • Organizada por pasillos de supermercado
                </p>
              </div>
            </div>

            <Badge variant="default" className="bg-blue-100 text-blue-900 border-blue-300 text-xs py-1 px-3 font-bold rounded-full">
              {totalGroceryCount} artículos consolidados
            </Badge>
          </div>

          {/* Categorías de Supermercado */}
          <div className="space-y-3.5">
            {Object.entries(categorizedGrocery).map(([category, items]) => (
              <div key={category} className="space-y-2 border border-gray-200 rounded-2xl p-3.5 bg-gray-50/50 print:border-gray-300">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-950 border-b border-blue-200 pb-1 flex items-center justify-between">
                  <span>{category}</span>
                  <span className="text-[10px] text-gray-500 font-semibold">{items.length} productos</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map((item, idx) => {
                    const imageUrl = item.food ? getFoodImage(item.food) : ''
                    const formattedQty =
                      item.quantityG >= 1000
                        ? `${(item.quantityG / 1000).toFixed(2)} kg`
                        : `${item.quantityG} g`

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-gray-200 shadow-2xs"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <div className="h-7 w-7 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="eager"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = FALLBACK_FOOD_SVG
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-gray-900 block truncate">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-extrabold text-blue-800 block">
                            {formattedQty}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie de Página Hoja 10 con Identidad */}
        <div className="dossier-footer relative z-10 pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="" className="h-3.5 w-3.5 object-contain" />
            <span>Eva Vidal Nutrición • Consolidado Semanal</span>
          </div>
          <span className="font-bold text-gray-500">Hoja 10 de 10 • Plan Nutricional</span>
        </div>
      </section>
    </div>
  )
}
