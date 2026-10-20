'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, Save, CheckCircle2, RotateCcw } from 'lucide-react'
import { updateFaqAction, resetFaqsAction } from './faq-actions'
import type { FAQItem } from '@/lib/faq-service'

interface Props {
  initialFaqs: FAQItem[]
}

export function FaqEditor({ initialFaqs }: Props) {
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFaqs)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const handleStartEdit = (faq: FAQItem) => {
    setEditingId(faq.id)
    setAnswerDraft(faq.answer)
  }

  const handleSave = async (id: string) => {
    setLoading(true)
    try {
      await updateFaqAction(id, answerDraft)
      setFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, answer: answerDraft } : f))
      )
      setEditingId(null)
      setSavedId(id)
      setTimeout(() => setSavedId(null), 3000)
    } catch (e: any) {
      alert(e.message || 'Error al guardar la respuesta')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Restaurar todas las respuestas a los textos predeterminados de la clínica?')) return
    setLoading(true)
    try {
      await resetFaqsAction()
      window.location.reload()
    } catch (e: any) {
      alert(e.message)
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50/70 via-white to-white pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Textos de Ayuda y FAQ del Portal del Paciente (3.10)
              </CardTitle>
              <CardDescription className="text-xs">
                Edita las respuestas que verán los pacientes al pulsar el botón de ayuda (ej. tus pautas para dudas entre consultas).
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={loading}
            className="rounded-2xl text-xs font-semibold border-gray-300 text-gray-700 hover:bg-gray-100 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar estándar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {faqs.map((faq) => {
          const isEditing = editingId === faq.id
          const isJustSaved = savedId === faq.id

          return (
            <div
              key={faq.id}
              className={`p-4 rounded-2xl border transition-all ${
                isEditing
                  ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-100'
                  : 'bg-gray-50/70 border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  {faq.category}
                </span>
                {isJustSaved && (
                  <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Publicado en portal</span>
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-gray-900 mb-1">{faq.question}</h4>

              {isEditing ? (
                <div className="space-y-3 mt-2">
                  <textarea
                    rows={3}
                    value={answerDraft}
                    onChange={(e) => setAnswerDraft(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-blue-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="rounded-xl text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleSave(faq.id)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar respuesta</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 mt-1">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEdit(faq)}
                    className="rounded-xl text-2xs font-bold shrink-0 border-gray-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Editar texto
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
