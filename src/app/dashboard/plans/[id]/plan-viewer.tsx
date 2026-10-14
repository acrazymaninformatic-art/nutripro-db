'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  ShoppingCart,
  Printer,
  Flame,
  Leaf,
  User,
  HeartPulse,
  Info,
  Clock,
  Sparkles,
  ChefHat,
  Droplets,
  Scale,
  ShieldCheck,
  CheckCircle2,
  FileText,
  BookOpen,
  X,
  Timer,
  Utensils,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Pill,
} from 'lucide-react'
import { getFoodImage, getRecipeForFood, FALLBACK_FOOD_SVG, type ClinicalRecipe, checkPatientAllergenConflict } from '@/lib/nutrition'
import { FOOD_EXCHANGE_GROUPS } from '@/lib/nutrition/exchange-system'
import { PrePublishChecklistModal } from './pre-publish-checklist-modal'
import { ExchangeGuide } from '@/components/nutrition/exchange-guide'

interface PlanViewerProps {
  plan: any
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

// Guía culinaria inteligente y apetitosa para la preparación de cada alimento
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

export function PlanViewer({ plan }: PlanViewerProps) {
  const [activeTab, setActiveTab] = useState<'dossier' | 'interactive' | 'grocery' | 'exchanges'>('dossier')
  const [activeDayNumber, setActiveDayNumber] = useState(1)
  const [selectedRecipe, setSelectedRecipe] = useState<ClinicalRecipe | null>(null)
  const [hideCaloriesTCA, setHideCaloriesTCA] = useState<boolean>(Boolean(plan.hideCaloriesTCA))

  // Grocery list consolidation categorized by supermarket departments
  const categorizedGrocery = useMemo(() => {
    const map = new Map<string, { name: string; category: string; quantityG: number; food: any }>()

    plan.days.forEach((day: any) => {
      day.meals.forEach((meal: any) => {
        meal.items.forEach((item: any) => {
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

  const currentDay = plan.days.find((d: any) => d.dayNumber === activeDayNumber) || plan.days[0]

  function handlePrint() {
    window.print()
  }

  // Encuentra la receta representativa del día para el dossier impreso
  function getDayFeaturedRecipe(day: any): ClinicalRecipe | null {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        if (item.food) {
          const rec = getRecipeForFood(item.food.name, item.food.category)
          if (rec) return rec
        }
      }
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Action Top Bar - Hidden when printing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-white rounded-3xl border border-gray-200/90 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-gray-100 rounded-2xl overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('dossier')}
              className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'dossier'
                  ? 'bg-white text-blue-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Dossier PDF Oficial (7-9 Hojas A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('interactive')}
              className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'interactive'
                  ? 'bg-white text-blue-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span>Ver Menú y Recetas por Días</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('exchanges')}
              className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'exchanges'
                  ? 'bg-white text-blue-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Intercambios (CESNID)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('grocery')}
              className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'grocery'
                  ? 'bg-white text-blue-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span>Consolidado de Alimentos ({totalGroceryCount})</span>
            </button>
          </div>
        </div>

        {/* PRIMARY PRINT / PDF DOWNLOAD BUTTON & TCA TOGGLE */}
        <div className="flex items-center gap-2 flex-wrap">
          <PrePublishChecklistModal
            planId={plan.id}
            planName={plan.name}
            patient={plan.patient}
            isPublished={plan.status === 'PUBLISHED'}
            publishedAt={plan.publishedAt}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => setHideCaloriesTCA(!hideCaloriesTCA)}
            className={`h-10 px-3.5 gap-2 text-xs rounded-2xl font-bold transition-all ${
              hideCaloriesTCA
                ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Oculta calorías y gramajes en pantalla y en el PDF para pacientes con TCA o enfoque en hábitos"
          >
            {hideCaloriesTCA ? <EyeOff className="h-4 w-4 text-purple-700" /> : <Eye className="h-4 w-4 text-gray-500" />}
            <span>{hideCaloriesTCA ? 'Modo TCA Activo (Sin Números)' : 'Modo TCA'}</span>
          </Button>

          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black h-10 px-5 gap-2 shadow-sm text-xs rounded-2xl"
            title="Genera el documento PDF oficial paginado a 8-10 hojas limpias con fotos y recetas"
          >
            <Printer className="h-4 w-4" />
            <span>Descargar / Imprimir Dossier PDF (A4)</span>
          </Button>
        </div>
      </div>

      {/* PRINT NOTICE BANNER (Only on screen in dossier tab) */}
      {activeTab === 'dossier' && (
        <div className="p-4 bg-gradient-to-r from-blue-50 via-sky-50 to-green-50 border border-blue-200/80 rounded-2xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-blue-950">
                Formato Editorial A4 Clínico con Recetas Integradas
              </p>
              <p className="text-blue-800 text-[11px] mt-0.5">
                Cada uno de los 7 días ocupa exactamente su propia hoja limpia, con las fotos HD de cada alimento, pautas culinarias y el paso a paso de la receta principal. Al imprimir, elige <em>"Guardar como PDF"</em> y tamaño <em>"A4"</em>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handlePrint}
            variant="outline"
            className="h-8 text-xs font-black border-blue-300 text-blue-900 bg-white hover:bg-blue-50 shrink-0 rounded-xl"
          >
            Guardar en PDF Ahora
          </Button>
        </div>
      )}

      {/* =========================================================================
          VISTA 1: EL DOSSIER COMPLETO IMPRESO / EXPORTABLE EN PDF (7-9 HOJAS)
          ========================================================================= */}
      {(activeTab === 'dossier' || typeof window === 'undefined') && (
        <div className="space-y-8 print:space-y-0">
          {/* ---------------------------------------------------------------------
              HOJA 1: PORTADA CLÍNICA Y RESUMEN DEL PACIENTE (A4 PAGE 1)
              --------------------------------------------------------------------- */}
          <section className="dossier-page relative bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 overflow-hidden">
            {/* Watermark con el logo de Eva Vidal con baja opacidad */}
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
                      Consulta Nutricional Eva Vidal <span className="text-blue-600 font-light">• EVSoftware</span>
                    </h1>
                    <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">
                      Dossier de Prescripción Dietética y Recetario Clínico
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-gray-600 space-y-0.5">
                  <p className="font-black text-gray-900 text-sm">Eva Vidal - Consulta Nutricional</p>
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
                    {plan.patient.firstName} {plan.patient.lastName}
                  </span>
                  <span className="text-xs text-gray-600 font-medium block">
                    {plan.patient.sex === 'FEMALE' ? 'Mujer' : 'Hombre'} • {plan.patient.heightCm} cm
                  </span>
                  {(plan.patient.allergies || plan.patient.intolerances) && (
                    <span className="inline-block mt-1 text-[9px] font-black bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded-md">
                      ⚠️ Alergias: {[plan.patient.allergies, plan.patient.intolerances].filter(Boolean).join(', ')}
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
                    {hideCaloriesTCA ? 'Pauta Cualitativa' : `${plan.targetKcal} kcal/día`}
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
                      <span className="text-blue-700">{plan.targetProteinG}g P</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-amber-700">{plan.targetCarbsG}g C</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-rose-700">{plan.targetFatG}g G</span>
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
              <span>Eva Vidal Nutrición • Expediente: {plan.patient.lastName}, {plan.patient.firstName}</span>
              <span className="font-bold">Hoja 1 de 10 • Portada y Prescripción General</span>
            </div>
          </section>

          {/* ---------------------------------------------------------------------
              HOJAS 2 A 8: CADA UNO DE LOS 7 DÍAS EN SU PROPIA HOJA A4 DEDICADA
              --------------------------------------------------------------------- */}
          {plan.days.map((day: any, dIdx: number) => {
            let dayKcal = 0
            let dayProt = 0
            let dayCarbs = 0
            let dayFat = 0

            day.meals.forEach((m: any) => {
              m.items.forEach((it: any) => {
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
                key={day.id}
                className="dossier-page relative bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 space-y-3.5 overflow-hidden"
              >
                {/* Watermark de Eva Vidal con baja opacidad */}
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
                          {day.customName || DAY_NAMES[dIdx] || `Día ${day.dayNumber}`}
                        </h2>
                        <span className="text-[10px] text-gray-300 font-medium">
                          Paciente: {plan.patient.firstName} {plan.patient.lastName} • Pauta Personalizada
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
                    {day.meals.map((meal: any) => {
                      let mealKcal = 0
                      let mealProt = 0
                      let mealCarbs = 0
                      let mealFat = 0

                      meal.items.forEach((it: any) => {
                        if (it.food && it.quantityG > 0) {
                          const factor = it.quantityG / 100
                          mealKcal += it.food.calories * factor
                          mealProt += it.food.proteinG * factor
                          mealCarbs += it.food.carbsG * factor
                          mealFat += it.food.fatG * factor
                        }
                      })

                      if (meal.items.length === 0) return null

                      return (
                        <div
                          key={meal.id}
                          className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs print:border-gray-300"
                        >
                          {/* Barra de Título de la Toma */}
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

                          {/* Tabla de Alimentos de la Toma */}
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
                              {meal.items.map((it: any) => {
                                const factor = it.quantityG / 100
                                const kcal = it.food ? Math.round(it.food.calories * factor) : 0
                                const imageUrl = it.food ? getFoodImage(it.food) : ''
                                const prepTip = getPreparationTip(it.food?.name || '', it.food?.category || null, it.notes)
                                const itemRecipe = it.food ? getRecipeForFood(it.food.name, it.food.category) : null
                                const itemConflict = it.food && plan.patient ? checkPatientAllergenConflict(it.food, plan.patient) : null

                                return (
                                  <tr key={it.id} className={`hover:bg-gray-50/40 ${itemConflict ? 'bg-red-50/60' : ''}`}>
                                    {/* Foto Culinaria HD */}
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

                                    {/* Nombre */}
                                    <td className="py-1 px-2.5 font-bold text-gray-900 align-middle">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={itemConflict ? 'text-red-950 font-black' : ''}>{it.food?.name || 'Alimento'}</span>
                                        {itemConflict && (
                                          <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded shadow-2xs" title={itemConflict.alertMessage}>
                                            🚨 {itemConflict.allergenLabel}
                                          </span>
                                        )}
                                        {itemRecipe && (
                                          <button
                                            type="button"
                                            onClick={() => setSelectedRecipe(itemRecipe)}
                                            className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.2 rounded-full border border-blue-200 cursor-pointer print:hidden"
                                            title="Ver receta completa paso a paso"
                                          >
                                            <Utensils className="h-2.5 w-2.5 text-blue-600" />
                                            <span>Receta</span>
                                          </button>
                                        )}
                                      </div>
                                    </td>

                                    {/* Cantidad en gramos / Ración */}
                                    <td className="py-1 px-2 text-center align-middle">
                                      <span className="inline-block px-2 py-0.5 rounded-full font-black text-[10px] bg-blue-50 text-blue-900 border border-blue-200">
                                        {hideCaloriesTCA ? '1 ración' : `${it.quantityG} g`}
                                      </span>
                                    </td>

                                    {/* Calorías */}
                                    <td className="py-1 px-2 text-right font-extrabold text-gray-800 align-middle text-[10px]">
                                      {hideCaloriesTCA ? '-' : `${kcal} kcal`}
                                    </td>

                                    {/* Pauta y Preparación de cada alimento */}
                                    <td className="py-1 px-2.5 text-[10px] text-gray-700 italic align-middle leading-snug">
                                      {prepTip}
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

                  {/* CAJA DE RECETA PRINCIPAL DEL DÍA EN EL DOSSIER */}
                  {featuredRecipe && (
                    <div className="border border-blue-200 rounded-2xl p-3 bg-gradient-to-r from-blue-50/70 via-sky-50/30 to-green-50/50 space-y-2">
                      <div className="flex items-center justify-between border-b border-blue-200/80 pb-1.5">
                        <div className="flex items-center gap-2">
                          <ChefHat className="h-4 w-4 text-blue-700" />
                          <span className="text-xs font-black text-blue-950">
                            Receta Culinaria Destacada: {featuredRecipe.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-blue-800 font-bold flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            {featuredRecipe.prepTimeMin + featuredRecipe.cookTimeMin} min
                          </span>
                          <span>•</span>
                          <span>Dificultad {featuredRecipe.difficulty}</span>
                          {!hideCaloriesTCA && (
                            <>
                              <span>•</span>
                              <span className="bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                <Flame className="h-3 w-3 text-blue-600" />
                                {featuredRecipe.caloriesPerServing} kcal
                              </span>
                              <span className="text-blue-950 font-extrabold bg-white/70 px-1.5 py-0.5 rounded border border-blue-200">
                                {featuredRecipe.proteinG}g P · {featuredRecipe.carbsG}g C · {featuredRecipe.fatG}g G
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <span className="font-bold text-gray-800 block mb-1">
                            Elaboración Paso a Paso:
                          </span>
                          <ol className="space-y-1 text-gray-700 list-decimal list-inside leading-tight">
                            {featuredRecipe.steps.slice(0, 3).map((st, sIdx) => (
                              <li key={sIdx}>{st}</li>
                            ))}
                          </ol>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-blue-200/60 flex flex-col justify-between">
                          <div>
                            <span className="font-bold text-blue-900 block mb-0.5">
                              💡 Consejo del Nutricionista:
                            </span>
                            <p className="text-blue-800 italic leading-snug">
                              {featuredRecipe.chefTip}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedRecipe(featuredRecipe)}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 print:hidden self-start cursor-pointer"
                          >
                            <span>Ver receta completa con todos los pasos</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pie de Página Hoja Diaria con Identidad de Eva Vidal */}
                <div className="dossier-footer relative z-10 pt-2.5 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <img src="/logo.png" alt="" className="h-4 w-4 object-contain inline-block" />
                    <span>Consulta Nutricional Eva Vidal • Paciente: {plan.patient.firstName} {plan.patient.lastName}</span>
                  </div>
                  <span className="font-bold text-gray-500">Hoja {pageNumber} de 10 • {day.customName || DAY_NAMES[dIdx]}</span>
                </div>
              </section>
            )
          })}

          {/* ---------------------------------------------------------------------
              HOJA 9: GUÍA OFICIAL DE RACIONES DE INTERCAMBIO (A4 PAGE 9)
              --------------------------------------------------------------------- */}
          <section className="dossier-page relative bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 space-y-4 overflow-hidden">
            {/* Watermark con el logo de Eva Vidal con baja opacidad */}
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
                      Guía Oficial de Raciones de Intercambio (Equivalencias)
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Estándar de la Academia Española de Nutrición y Dietética (CESNID / SEEDO). Flexibilidad garantizada.
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-bold text-gray-800 block">Sustituciones Seguras</span>
                  <span className="text-[10px] text-blue-700 font-semibold">1 intercambio = Mismos macros</span>
                </div>
              </div>

              {/* Pauta pedagógica para el paciente */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                <span className="font-black block text-[11px] uppercase tracking-wide text-blue-900">
                  ¿Cómo utilizar esta guía para sustituir alimentos?
                </span>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  Si un día no tienes el alimento pautado o comes fuera de casa, puedes sustituir 1 porción de ese alimento por cualquier otro de su misma lista. Por ejemplo: <strong>20 g de pan</strong> equivale exactamente a <strong>55 g de patata</strong> o <strong>15 g de avena</strong> sin alterar tus calorías ni tus macronutrientes.
                </p>
              </div>

              {/* Tablas de Intercambio por Grupos */}
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
            </div>

            {/* Pie de Página Hoja 9 */}
            <div className="dossier-footer relative z-10 pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="" className="h-3.5 w-3.5 object-contain" />
                <span>Consulta Nutricional Eva Vidal • Guía de Intercambios Clínicos</span>
              </div>
              <span className="font-bold text-gray-500">Hoja 9 de 10 • Flexibilidad Dietética</span>
            </div>
          </section>

          {/* ---------------------------------------------------------------------
              HOJA 10: LISTA DE LA COMPRA SEMANAL CONSOLIDADA (A4 PAGE 10)
              --------------------------------------------------------------------- */}
          <section className="dossier-page relative bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 space-y-4 overflow-hidden">
            {/* Watermark con el logo de Eva Vidal con baja opacidad */}
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
                <span>Consulta Nutricional Eva Vidal • Consolidado Semanal</span>
              </div>
              <span className="font-bold text-gray-500">Hoja 10 de 10 • Plan Nutricional</span>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: NAVEGADOR INTERACTIVO POR DÍAS (SOLO EN PANTALLA)
          ========================================================================= */}
      {activeTab === 'interactive' && (
        <div className="space-y-5 print:hidden">
          {/* Day Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {plan.days.map((day: any, idx: number) => {
              const isSelected = day.dayNumber === activeDayNumber
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setActiveDayNumber(day.dayNumber)}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className={`block text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-gray-900'}`}>
                    {day.customName || DAY_NAMES[idx] || `Día ${day.dayNumber}`}
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>
                    Día {day.dayNumber}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active Day Detail Card */}
          {currentDay && (
            <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">
                        {currentDay.customName || `Día ${currentDay.dayNumber}`}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Menú estructurado con ingredientes pesados y recetas completas
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs rounded-full px-3 py-1 font-bold bg-blue-100 text-blue-900 border-blue-300">
                    5 Tomas Diarias
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {currentDay.meals.map((meal: any) => (
                  <div key={meal.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between font-bold text-xs uppercase text-gray-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {MEAL_LABELS[meal.mealType] || meal.mealType}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">{meal.items.length} alimentos</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {meal.items.map((it: any) => {
                        const imageUrl = it.food ? getFoodImage(it.food) : ''
                        const prepTip = getPreparationTip(it.food?.name || '', it.food?.category || null, it.notes)
                        const itemRecipe = it.food ? getRecipeForFood(it.food.name, it.food.category) : null

                        return (
                          <div key={it.id} className="p-3.5 flex items-center gap-3.5 hover:bg-gray-50/50 transition-colors">
                            <div className="h-11 w-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs">
                              <img
                                src={imageUrl}
                                alt={it.food?.name || 'Alimento'}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null
                                  e.currentTarget.src = FALLBACK_FOOD_SVG
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-gray-900 block truncate">{it.food?.name}</span>
                                {itemRecipe && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRecipe(itemRecipe)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 transition-colors cursor-pointer"
                                  >
                                    <ChefHat className="h-3 w-3 text-blue-600" />
                                    <span>Ver Receta</span>
                                  </button>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 italic block mt-0.5">{prepTip}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-blue-800 block bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                {it.quantityG} g
                              </span>
                              <span className="text-[10px] text-gray-400 mt-0.5 block">
                                {it.food ? Math.round(it.food.calories * (it.quantityG / 100)) : 0} kcal
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          VISTA 3: CONSOLIDADO DE ALIMENTOS Y PESOS SEMANALES (VISTA CLÍNICA)
          ========================================================================= */}
      {activeTab === 'grocery' && (
        <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm print:hidden">
          <CardHeader className="border-b pb-4 bg-gradient-to-r from-gray-50 to-blue-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">
                    Consolidado de Alimentos y Pesos Semanales
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cantidades netas totales calculadas para la pauta nutricional completa
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="rounded-full px-3 py-1 font-bold bg-blue-100 text-blue-900 border-blue-300 text-xs">
                {totalGroceryCount} Alimentos Únicos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {Object.entries(categorizedGrocery).map(([category, items]) => (
              <div key={category} className="space-y-2.5 border border-gray-200 rounded-2xl p-4 bg-gray-50/40">
                <span className="text-xs font-black uppercase tracking-wider text-blue-950 border-b border-blue-200 pb-1.5 flex items-center justify-between">
                  <span>{category}</span>
                  <span className="text-[10px] text-gray-500 font-semibold">{items.length} alimentos</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {items.map((item, idx) => {
                    const imageUrl = item.food ? getFoodImage(item.food) : ''
                    const formattedQty =
                      item.quantityG >= 1000
                        ? `${(item.quantityG / 1000).toFixed(2)} kg`
                        : `${item.quantityG} g`

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-gray-200 bg-white shadow-2xs"
                      >
                        <div className="h-9 w-9 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = FALLBACK_FOOD_SVG
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-gray-900 block truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] font-black text-blue-900 block">
                            {formattedQty}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          VISTA 4: GUÍA INTERACTIVA DE INTERCAMBIOS (SOLO EN PANTALLA)
          ========================================================================= */}
      {activeTab === 'exchanges' && (
        <div className="print:hidden">
          <ExchangeGuide />
        </div>
      )}

      {/* =========================================================================
          MODAL DE RECETA CULINARIA CLÍNICA INTERACTIVA
          ========================================================================= */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 overflow-hidden">
            {/* Foto de cabecera de la receta */}
            <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
              <img
                src={selectedRecipe.imageUrl}
                alt={selectedRecipe.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = FALLBACK_FOOD_SVG
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <button
                type="button"
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300 block">
                  {selectedRecipe.category} • Dificultad {selectedRecipe.difficulty}
                </span>
                <h3 className="text-base font-black leading-snug drop-shadow-sm">
                  {selectedRecipe.name}
                </h3>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Tiempos y Valores Nutricionales */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">Tiempo</span>
                  <span className="font-extrabold text-blue-950">
                    {selectedRecipe.prepTimeMin + selectedRecipe.cookTimeMin} min
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">Energía</span>
                  <span className="font-extrabold text-blue-950">
                    {selectedRecipe.caloriesPerServing} kcal
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-blue-700 font-bold block uppercase">Proteína</span>
                  <span className="font-extrabold text-blue-900">
                    {selectedRecipe.proteinG}g
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-700 font-bold block uppercase">Carbos</span>
                  <span className="font-extrabold text-amber-900">
                    {selectedRecipe.carbsG}g
                  </span>
                </div>
              </div>

              {/* Ingredientes de la Receta */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5 text-blue-600" />
                  <span>Ingredientes Necesarios (1 ración)</span>
                </h4>
                <ul className="space-y-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  {selectedRecipe.ingredients.map((ing, iIdx) => (
                    <li key={iIdx} className="flex items-center justify-between text-gray-800">
                      <span className="font-medium">• {ing.name}</span>
                      <span className="font-bold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded-full text-[10px]">
                        {ing.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Paso a Paso */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  <span>Preparación Paso a Paso</span>
                </h4>
                <ol className="space-y-2">
                  {selectedRecipe.steps.map((st, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <p className="text-gray-700 leading-relaxed text-xs">{st}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Truco del Chef Nutricionista */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <span>💡 Consejo Nutricional del Especialista:</span>
                </span>
                <p className="text-xs text-amber-800 leading-relaxed italic">
                  {selectedRecipe.chefTip}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setSelectedRecipe(null)}
                  className="bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs"
                >
                  Cerrar Receta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
