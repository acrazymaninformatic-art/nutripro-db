'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react'
import { publishMealPlan } from '../actions'

interface Props {
  planId: string
  planName: string
  patient: {
    id: string
    firstName: string
    lastName: string
    allergies?: string | null
    allergiesStatus?: string | null
    intolerances?: string | null
    intolerancesStatus?: string | null
    currentMedications?: string | null
    medicationsStatus?: string | null
  }
  isPublished?: boolean
  publishedAt?: string | null
}

export function PrePublishChecklistModal({
  planId,
  planName,
  patient,
  isPublished = false,
  publishedAt,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checks, setChecks] = useState({
    allergens: true,
    medications: true,
    calories: true,
    variety: true,
    recommendations: true,
  })
  const [notes, setNotes] = useState('')
  const [published, setPublished] = useState(isPublished)

  const allergiesStatus = patient.allergiesStatus || 'NO_CONSTA'
  const medicationsStatus = patient.medicationsStatus || 'NO_CONSTA'

  const allChecked = Object.values(checks).every(Boolean)

  const handlePublish = async () => {
    if (!allChecked) return
    setLoading(true)
    try {
      await publishMealPlan(planId, notes || undefined)
      setPublished(true)
      setOpen(false)
    } catch (e: any) {
      alert(e.message || 'Error al publicar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={`gap-1.5 font-bold shadow-xs ${
            published
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {published ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Plan Publicado (Revisar Checklist)
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Validar y Publicar para el Paciente
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8 bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-gray-900 tracking-tight">
                Validación de Seguridad Pre-Publicación
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Checklist clínico obligatorio para {patient.firstName} {patient.lastName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Advertencia de Estado de Alérgenos si es NO_CONSTA */}
          {allergiesStatus === 'NO_CONSTA' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Alergias en estado "NO CONSTA"</p>
                <p className="text-amber-800/90 text-2xs mt-0.5">
                  Aún no se ha verificado explícitamente si el paciente tiene alergias. Confirma antes de prescribir el menú.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checks.allergens}
                onChange={(e) => setChecks({ ...checks, allergens: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 leading-snug">
                <strong>Alérgenos e intolerancias:</strong> Ingredientes contrastados contra historial clínico (sin gluten, lactosa u otros alérgenos no autorizados).
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checks.medications}
                onChange={(e) => setChecks({ ...checks, medications: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 leading-snug">
                <strong>Interacciones farmacológicas:</strong> Pauta compatible con la medicación actual del paciente (p.ej. anticoagulantes, GLP-1, etc.).
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checks.calories}
                onChange={(e) => setChecks({ ...checks, calories: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 leading-snug">
                <strong>Equilibrio calórico y macronutrientes:</strong> Objetivos de energía y proteínas ajustados a su composición corporal y metas.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checks.variety}
                onChange={(e) => setChecks({ ...checks, variety: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 leading-snug">
                <strong>Variedad y practicidad culinaria:</strong> Menú variado, realista, con recetas estructuradas y pasos claros de preparación.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checks.recommendations}
                onChange={(e) => setChecks({ ...checks, recommendations: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 leading-snug">
                <strong>Instrucciones clínicas personalizadas:</strong> Pautas de hidratación y consejos dietéticos incluidos en el dossier.
              </span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1 text-2xs">
              Notas de validación interna (opcional):
            </label>
            <input
              type="text"
              placeholder="Ej. Revisado en consulta presencial, objetivo hipertrofia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs text-gray-500"
          >
            Cerrar
          </Button>
          <Button
            size="sm"
            disabled={!allChecked || loading}
            onClick={handlePublish}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            {loading ? 'Validando...' : published ? 'Guardar y Re-publicar' : 'Confirmar y Publicar para el Paciente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
