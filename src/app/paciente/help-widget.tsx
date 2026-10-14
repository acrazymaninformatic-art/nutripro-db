'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, X, Search, Sparkles, ChevronRight, CheckCircle2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'citas-1',
    category: 'Citas',
    question: '¿Cómo pido, cambio o cancelo una cita?',
    answer: 'En la sección "Mis Citas", pulsa el botón "Solicitar Cita" indicando tu modalidad preferida (Online o Presencial) y tus notas. Como Eva organiza la agenda manualmente para dar el mejor servicio, ella fijará el día y hora exactos y recibirás una notificación de confirmación.',
  },
  {
    id: 'citas-2',
    category: 'Citas',
    question: '¿Dónde veo el enlace de mi videollamada?',
    answer: 'Si tu cita es de modalidad Online, el enlace de Google Meet aparecerá directamente en la tarjeta de tu cita dentro de la sección "Mis Citas" una vez que Eva haya confirmado el día y la hora.',
  },
  {
    id: 'plan-1',
    category: 'Mi Plan',
    question: '¿Dónde veo las recetas?',
    answer: 'En "Mi Plan", al consultar los días de la semana y pulsar sobre cualquier plato o preparación marcada, se abrirá el detalle completo de la receta con sus ingredientes en gramos, pasos e información nutricional.',
  },
  {
    id: 'plan-2',
    category: 'Mi Plan',
    question: '¿Cómo descargo el plan en PDF o imprimo la lista de la compra?',
    answer: 'En la cabecera de "Mi Plan" encontrarás el botón para descargar el Dossier Clínico en PDF de alta calidad con marcas de agua oficiales de Eva Vidal Nutrición y la lista de la compra organizada por pasillos.',
  },
  {
    id: 'plan-3',
    category: 'Mi Plan',
    question: '¿Puedo cambiar un alimento por otro?',
    answer: 'Sí, el dossier en PDF y tu plan incluyen una Guía de Intercambios equivalente dentro del mismo grupo de alimentos (proteínas por proteínas, hidratos por hidratos) respetando tus posibles alergias.',
  },
  {
    id: 'plan-4',
    category: 'Mi Plan',
    question: '¿Cada cuánto se renueva mi plan?',
    answer: 'Eva renueva o ajusta tu plan tras cada consulta de revisión y seguimiento según tu progreso, sensaciones digestivas y evolución antropométrica.',
  },
  {
    id: 'cuest-1',
    category: 'Cuestionarios y Firmas',
    question: '¿Cómo relleno un cuestionario o firmo un documento?',
    answer: 'Accede a la sección "Cuestionarios". Cuando Eva te asigne un cuestionario de alta o consentimiento informado, verás un aviso de color ámbar destacado. Podrás responderlo o firmarlo en pantalla directamente en tu dispositivo.',
  },
  {
    id: 'cuest-2',
    category: 'Cuestionarios y Firmas',
    question: '¿Por qué no puedo apuntar mi peso ni mis comidas?',
    answer: 'Este portal es estrictamente clínico e informativo, no una red social ni un diario de conteo. Para garantizar el rigor clínico y evitar obsesiones con la báscula (especialmente en protocolos TCA o de salud integral), los datos antropométricos válidos son los medidos por Eva en consulta.',
  },
  {
    id: 'cuenta-1',
    category: 'Mi Cuenta y RGPD',
    question: '¿Quién puede ver mis datos de salud?',
    answer: 'Únicamente tu nutricionista responsable (Eva Vidal). Este sistema cuenta con aislamiento estricto de datos en servidores de la Unión Europea bajo el Reglamento General de Protección de Datos (RGPD).',
  },
  {
    id: 'dudas-1',
    category: 'Dudas entre consultas',
    question: 'Tengo una duda sobre mi plan, ¿qué hago?',
    answer: 'Te recomendamos anotar todas tus dudas cotidianas para tratarlas con detalle y tiempo en tu próxima sesión de revisión programada.',
  },
]

const TOUR_STEPS = [
  {
    target: 'inicio',
    title: '¡Te damos la bienvenida a tu portal!',
    content: 'Desde aquí tienes el control de tu tratamiento nutricional con Eva Vidal. Vamos a recorrer brevemente las opciones clave.',
  },
  {
    target: 'plan',
    title: 'Mi Plan Nutricional',
    content: 'Aquí tienes tu plan semanal activo, con las recetas detalladas y la opción de descargar tu dossier en PDF.',
  },
  {
    target: 'citas',
    title: 'Mis Citas',
    content: 'Solicita nuevas revisiones, consulta los horarios asignados y accede a tu enlace de videollamada de Google Meet.',
  },
  {
    target: 'evolucion',
    title: 'Mi Evolución',
    content: 'Revisa tus registros de peso, composición corporal y referencias clínicas publicadas por Eva.',
  },
  {
    target: 'cuestionarios',
    title: 'Cuestionarios y Firmas',
    content: 'Rellena tu anamnesis previa y firma tus consentimientos informados de forma 100% digital y segura.',
  },
  {
    target: 'documentos',
    title: 'Documentos',
    content: 'Consulta y descarga tus informes clínicos y analíticas compartidas.',
  },
]

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [tourIndex, setTourIndex] = useState<number | null>(null)

  useEffect(() => {
    // Si es la primera visita, abrir el tutorial automáticamente
    const hasSeenTour = localStorage.getItem('ev_portal_tour_seen')
    if (!hasSeenTour) {
      setTourIndex(0)
    }
  }, [])

  const handleFinishTour = () => {
    localStorage.setItem('ev_portal_tour_seen', 'true')
    setTourIndex(null)
  }

  const handleStartTourManual = () => {
    setIsOpen(false)
    setTourIndex(0)
  }

  const filteredFaqs = FAQ_LIST.filter((faq) => {
    const matchesCategory = selectedCategory === 'Todas' || faq.category === selectedCategory
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ['Todas', 'Citas', 'Mi Plan', 'Cuestionarios y Firmas', 'Mi Cuenta y RGPD', 'Dudas entre consultas']

  return (
    <>
      {/* Guía Interactiva Tutorial (Estilo Spotlight) */}
      {tourIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3 text-blue-600">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Guía de Bienvenida ({tourIndex + 1}/{TOUR_STEPS.length})
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {TOUR_STEPS[tourIndex].title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {TOUR_STEPS[tourIndex].content}
            </p>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleFinishTour}
                className="text-xs text-gray-400 hover:text-gray-700 font-semibold"
              >
                Saltar guía
              </button>
              <div className="flex items-center gap-2">
                {tourIndex < TOUR_STEPS.length - 1 ? (
                  <Button
                    onClick={() => setTourIndex(tourIndex + 1)}
                    size="sm"
                    className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinishTour}
                    size="sm"
                    className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span>¡Empezar!</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante de ayuda */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 font-bold text-xs"
          aria-label="Ayuda y preguntas frecuentes"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Ayuda & FAQ</span>
        </button>
      </div>

      {/* Modal / Panel de Preguntas Frecuentes */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Centro de Ayuda al Paciente</h3>
                  <p className="text-xs text-gray-500">Preguntas frecuentes sobre tu portal y tu plan</p>
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
            <div className="p-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar dudas (ej: recetas, citas, videollamada, RGPD)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-2xs scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
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
                  <div key={faq.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {faq.category}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900">{faq.question}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Restart Tour option */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleStartTourManual}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Volver a ver la guía de bienvenida</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-xl text-xs"
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
