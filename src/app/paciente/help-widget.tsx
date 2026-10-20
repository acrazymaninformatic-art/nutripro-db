'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  HelpCircle,
  X,
  Search,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEFAULT_FAQS, type FAQItem } from '@/lib/faq-data'

interface TourStep {
  targetId: string | null
  title: string
  subtitle: string
  content: string
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-nav-inicio',
    title: '1. Inicio del Portal',
    subtitle: 'Tu panel personal',
    content:
      'Aquí tienes un resumen inmediato de tu próxima cita asignada, las comidas pautadas para hoy, el estado de tu plan y tus avisos pendientes.',
  },
  {
    targetId: 'tour-nav-plan',
    title: '2. Mi Plan Nutricional',
    subtitle: 'Pautas y Recetario',
    content:
      'Consulta tu plan de comidas interactivo, pulsa en cada receta para ver sus ingredientes y pasos, y descarga tu dossier en PDF o lista de la compra.',
  },
  {
    targetId: 'tour-nav-citas',
    title: '3. Mis Citas y Revisiones',
    subtitle: 'Gestión sin complicaciones',
    content:
      'Solicita nuevas revisiones (online o presencial), consulta las fechas que te asigne Eva y accede a tu enlace de Google Meet sin salir del portal.',
  },
  {
    targetId: 'tour-nav-evolucion',
    title: '4. Mi Evolución Clínica',
    subtitle: 'Progreso y métricas',
    content:
      'Observa tus gráficas de peso, composición corporal y referencias clínicas cuando Eva las revise y comparta contigo tras cada control.',
  },
  {
    targetId: 'tour-nav-cuestionarios',
    title: '5. Cuestionarios y Firmas',
    subtitle: 'Digital y seguro',
    content:
      'Rellena tu anamnesis de salud previa a la consulta y firma tus consentimientos informados de forma 100% digital en pantalla.',
  },
  {
    targetId: 'tour-nav-documentos',
    title: '6. Mis Documentos',
    subtitle: 'Custodia médica',
    content:
      'Consulta y descarga tus informes clínicos, analíticas y documentos que Eva publique para ti en tu historial médico privado.',
  },
  {
    targetId: null,
    title: '📋 Preparación para tu primera consulta',
    subtitle: 'Qué tener a mano con Eva Vidal',
    content:
      'Para aprovechar al máximo tu sesión de valoración:\n• Analíticas de sangre recientes o informes médicos relevantes.\n• Lista de medicación habitual y suplementos que tomes.\n• Cuestionario de anamnesis completado (en la pestaña Cuestionarios).\n• Tus objetivos principales y dudas anotadas para tratarlas con calma.',
  },
]

export function HelpWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [tourIndex, setTourIndex] = useState<number | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [faqs] = useState<FAQItem[]>(DEFAULT_FAQS)

  // Medir posición del botón iluminado (estilo Roblox)
  const updateTargetPosition = useCallback(() => {
    if (tourIndex === null) {
      setTargetRect(null)
      return
    }

    const step = TOUR_STEPS[tourIndex]
    if (!step || !step.targetId) {
      setTargetRect(null)
      return
    }

    const el = document.getElementById(step.targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
    } else {
      setTargetRect(null)
    }
  }, [tourIndex])

  useEffect(() => {
    updateTargetPosition()
    window.addEventListener('resize', updateTargetPosition)
    window.addEventListener('scroll', updateTargetPosition, true)
    return () => {
      window.removeEventListener('resize', updateTargetPosition)
      window.removeEventListener('scroll', updateTargetPosition, true)
    }
  }, [updateTargetPosition])

  useEffect(() => {
    // El tutorial solo debe abrirse al aterrizar en el inicio del portal. Si
    // se abre en una ruta interna (plan, citas, documentos…) tapa el contenido
    // clínico y obliga a cerrarlo antes de poder trabajar.
    if (pathname !== '/paciente') return

    const hasSeenTour = localStorage.getItem('ev_portal_tour_seen')
    if (!hasSeenTour) {
      // Pequeño retardo para dar tiempo a renderizar la navegación
      const timer = setTimeout(() => {
        setTourIndex(0)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  const handleFinishTour = () => {
    localStorage.setItem('ev_portal_tour_seen', 'true')
    setTourIndex(null)
  }

  const handleStartTourManual = () => {
    setIsOpen(false)
    setTourIndex(0)
  }

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'Todas' || faq.category === selectedCategory
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ['Todas', 'Citas', 'Mi Plan', 'Cuestionarios y Firmas', 'Mi Cuenta y RGPD', 'Dudas entre consultas']

  const currentStep = tourIndex !== null ? TOUR_STEPS[tourIndex] : null

  return (
    <>
      {/* Guía Interactiva Spotlight (Estilo Roblox Tutorial - 3.10) */}
      {tourIndex !== null && currentStep && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {/* Fondo oscuro: cuando hay targetRect, usamos box-shadow cutout para que el botón destacado NO quede desenfocado */}
          {targetRect ? (
            <>
              {/* Overlay clickable transparente para cerrar o saltar si se pulsa fuera */}
              <div
                className="fixed inset-0 z-50 pointer-events-auto bg-transparent"
                onClick={handleFinishTour}
              />
              {/* Recuadro brillante que ilumina el elemento sin taparlo ni desenfocarlo */}
              <div
                style={{
                  position: 'fixed',
                  top: Math.max(4, targetRect.top - 6),
                  left: Math.max(4, targetRect.left - 6),
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.78)',
                  zIndex: 55,
                }}
                className="pointer-events-none rounded-2xl ring-4 ring-amber-400 ring-offset-2 ring-offset-transparent shadow-[0_0_35px_rgba(251,191,36,0.95)] animate-pulse border-2 border-amber-300 transition-all duration-300"
              />
            </>
          ) : (
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300 z-50"
              onClick={handleFinishTour}
            />
          )}

          {/* Tarjeta explicativa con botón Siguiente */}
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4 z-[70]">
            <div
              className={`pointer-events-auto bg-white rounded-3xl p-6 sm:p-8 w-full shadow-2xl border-2 border-amber-300 animate-in fade-in zoom-in-95 duration-200 ${
                currentStep.targetId ? 'max-w-md' : 'max-w-lg'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Guía del Portal ({tourIndex + 1}/{TOUR_STEPS.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFinishTour}
                  className="text-2xs font-semibold text-gray-400 hover:text-gray-700 uppercase"
                >
                  Saltar
                </button>
              </div>

              <span className="text-2xs font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                {currentStep.subtitle}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {currentStep.title}
              </h3>

              {currentStep.targetId ? (
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  {currentStep.content}
                </p>
              ) : (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 pb-1 border-b border-amber-200">
                    <ClipboardList className="w-4 h-4 text-amber-700" />
                    <span>Recomendaciones para tu primera consulta:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-900/90 list-disc list-inside">
                    <li>Analíticas de sangre recientes o informes médicos relevantes.</li>
                    <li>Lista de medicación habitual y suplementos que tomes.</li>
                    <li>Cuestionario de anamnesis completado (en 'Cuestionarios').</li>
                    <li>Tus objetivos prioritarios y dudas cotidianas anotadas.</li>
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleFinishTour}
                  className="text-xs text-gray-400 hover:text-gray-700 font-semibold"
                >
                  Saltar guía
                </button>
                <div className="flex items-center gap-2">
                  {tourIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTourIndex(tourIndex - 1)}
                      className="rounded-2xl text-xs font-semibold"
                    >
                      Anterior
                    </Button>
                  )}
                  {tourIndex < TOUR_STEPS.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setTourIndex(tourIndex + 1)}
                      size="sm"
                      className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs gap-1 shadow-sm"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleFinishTour}
                      size="sm"
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Empezar a usar mi portal!</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante de ayuda (Abajo a la derecha, visible en todo el portal - 3.10) */}
      <div className="fixed bottom-20 right-4 z-40 print:hidden md:bottom-6 md:right-6">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 font-bold text-xs border-2 border-white"
          aria-label="Ayuda y preguntas frecuentes"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Ayuda & Preguntas frecuentes</span>
        </button>
      </div>

      {/* Modal / Panel de Preguntas Frecuentes con buscador (3.10) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Centro de Ayuda al Paciente</h3>
                  <p className="text-xs text-gray-500">Preguntas frecuentes sobre citas, tu plan y tus datos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Categories */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar dudas (ej: recetas, citas, videollamada, RGPD, contraseñas)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-2xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No se encontraron respuestas para tu búsqueda.
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1.5 hover:border-blue-200 transition-colors">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {faq.category}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900">{faq.question}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Restart Tour option */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleStartTourManual}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Volver a ver la guía de bienvenida interactiva</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
