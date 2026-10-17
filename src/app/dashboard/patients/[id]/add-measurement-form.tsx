'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnthropometry } from '../actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  X,
  Scale,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface AddMeasurementFormProps {
  patientId: string
  previousMeasurement?: any | null
  firstMeasurement?: any | null
  patientObjective?: string | null
  patientHeightCm?: number | null
}

export function AddMeasurementForm({
  patientId,
  previousMeasurement,
  firstMeasurement,
  patientObjective,
  patientHeightCm,
}: AddMeasurementFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showExtended, setShowExtended] = useState(false)

  // Track active input values for live comparison against previous and first visits
  const [weight, setWeight] = useState<string>(previousMeasurement?.weightKg ? String(previousMeasurement.weightKg) : '')
  const [fatPct, setFatPct] = useState<string>(previousMeasurement?.bodyFatPct ? String(previousMeasurement.bodyFatPct) : '')
  const [muscleKg, setMuscleKg] = useState<string>(previousMeasurement?.muscleMassKg ? String(previousMeasurement.muscleMassKg) : '')
  const [waist, setWaist] = useState<string>(previousMeasurement?.waistCm ? String(previousMeasurement.waistCm) : '')

  const currentWeightNum = parseFloat(weight)
  const prevWeightNum = previousMeasurement?.weightKg || null
  const firstWeightNum = firstMeasurement?.weightKg || null

  // Delta vs previous visit
  const deltaPrevWeight = currentWeightNum && prevWeightNum ? Math.round((currentWeightNum - prevWeightNum) * 10) / 10 : null
  // Delta vs basal / first visit
  const deltaBasalWeight = currentWeightNum && firstWeightNum ? Math.round((currentWeightNum - firstWeightNum) * 10) / 10 : null

  // Helper to determine if weight delta is improvement or deterioration according to patientObjective
  const getWeightStatus = (delta: number | null): 'positive' | 'negative' | 'neutral' => {
    if (delta === null || Math.abs(delta) < 0.1) return 'neutral'
    const isGainObjective = patientObjective?.includes('HYPERTROPHY') || patientObjective?.includes('MUSCLE') || patientObjective?.includes('GAIN')
    if (isGainObjective) {
      return delta > 0 ? 'positive' : 'negative'
    } else {
      // Default to fat loss / weight loss
      return delta < 0 ? 'positive' : 'negative'
    }
  }

  const prevStatus = getWeightStatus(deltaPrevWeight)
  const basalStatus = getWeightStatus(deltaBasalWeight)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createAnthropometry(patientId, formData)
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error al registrar la medición antropométrica')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs">
        <Plus className="h-4 w-4" />
        <span>{previousMeasurement ? 'Nueva Revisión de Seguimiento' : 'Registrar 1ª Medición'}</span>
      </Button>
    )
  }

  return (
    <Card className="border-blue-200 bg-white shadow-sm rounded-3xl animate-in fade-in-50 duration-200 overflow-hidden">
      <form onSubmit={handleSubmit} noValidate>
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-blue-50/70 to-white border-b border-gray-100">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-blue-950 font-bold">
              <Scale className="h-5 w-5 text-blue-600" />
              <span>{previousMeasurement ? 'Revisión de Seguimiento (Consulta)' : 'Medición Basal'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {previousMeasurement
                ? 'Datos de la visita anterior ya cargados; anota únicamente lo que haya variado.'
                : 'Introduce los valores antropométricos iniciales del paciente.'}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Banner de Diferencias en Tiempo Real (5.2) */}
          {previousMeasurement && currentWeightNum && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-600">Diferencia vs Visita Anterior:</span>
                {deltaPrevWeight !== null ? (
                  <Badge
                    variant="outline"
                    className={`font-black rounded-full px-2.5 py-0.5 flex items-center gap-1 ${
                      prevStatus === 'positive'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : prevStatus === 'negative'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    {deltaPrevWeight > 0 ? <TrendingUp className="h-3 w-3" /> : deltaPrevWeight < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    <span>{deltaPrevWeight > 0 ? `+${deltaPrevWeight}` : deltaPrevWeight} kg</span>
                    <span className="text-3xs font-medium">({prevStatus === 'positive' ? 'Mejora' : prevStatus === 'negative' ? 'Atención' : 'Mantenimiento'})</span>
                  </Badge>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>

              {firstMeasurement && firstMeasurement.id !== previousMeasurement.id && deltaBasalWeight !== null && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-600">Diferencia Total (vs 1ª Consulta):</span>
                  <Badge
                    variant="outline"
                    className={`font-black rounded-full px-2.5 py-0.5 flex items-center gap-1 ${
                      basalStatus === 'positive'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : basalStatus === 'negative'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    {deltaBasalWeight > 0 ? <TrendingUp className="h-3 w-3" /> : deltaBasalWeight < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    <span>{deltaBasalWeight > 0 ? `+${deltaBasalWeight}` : deltaBasalWeight} kg</span>
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* General measurements */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs font-semibold">Fecha de Consulta *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weightKg" className="text-xs font-semibold">Peso (kg) *</Label>
              <Input
                id="weightKg"
                name="weightKg"
                type="number"
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="ej. 70.5"
                className="rounded-xl font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bodyFatPct" className="text-xs font-semibold">% Grasa Corporal</Label>
              <Input
                id="bodyFatPct"
                name="bodyFatPct"
                type="number"
                step="any"
                value={fatPct}
                onChange={(e) => setFatPct(e.target.value)}
                placeholder="ej. 18.2"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="muscleMassKg" className="text-xs font-semibold">Masa Muscular (kg)</Label>
              <Input
                id="muscleMassKg"
                name="muscleMassKg"
                type="number"
                step="any"
                value={muscleKg}
                onChange={(e) => setMuscleKg(e.target.value)}
                placeholder="ej. 32.0"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Perimeters */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-700 uppercase mb-2">Perímetros Corporales (cm)</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label htmlFor="waistCm" className="text-xs">Cintura</Label>
                <Input
                  id="waistCm"
                  name="waistCm"
                  type="number"
                  step="any"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder="ej. 80"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hipCm" className="text-xs">Cadera</Label>
                <Input
                  id="hipCm"
                  name="hipCm"
                  type="number"
                  step="any"
                  defaultValue={previousMeasurement?.hipCm || ''}
                  placeholder="ej. 95"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="chestCm" className="text-xs">Pecho / Tórax</Label>
                <Input
                  id="chestCm"
                  name="chestCm"
                  type="number"
                  step="any"
                  defaultValue={previousMeasurement?.chestCm || ''}
                  placeholder="ej. 98"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="armCm" className="text-xs">Brazo contraído</Label>
                <Input
                  id="armCm"
                  name="armCm"
                  type="number"
                  step="any"
                  defaultValue={previousMeasurement?.armCm || ''}
                  placeholder="ej. 32"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="thighCm" className="text-xs">Muslo / Pantorrilla</Label>
                <Input
                  id="thighCm"
                  name="thighCm"
                  type="number"
                  step="any"
                  defaultValue={previousMeasurement?.thighCm || ''}
                  placeholder="ej. 54"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Toggle para Antropometría Avanzada ISAK (5.3) */}
          <div className="border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => setShowExtended(!showExtended)}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{showExtended ? 'Ocultar Antropometría Ampliada (ISAK)' : 'Mostrar Antropometría Ampliada ISAK (Pliegues, Diámetros, Bioimpedancia)'}</span>
              {showExtended ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {showExtended && (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-50/30 border border-blue-100">
              {/* Pliegues Cutáneos ISAK */}
              <div>
                <p className="text-2xs font-bold text-blue-900 uppercase tracking-wide mb-2">Pliegues Cutáneos ISAK (mm)</p>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="skinfoldTriceps" className="text-3xs">Tricipital</Label>
                    <Input id="skinfoldTriceps" name="skinfoldTriceps" type="number" step="any" defaultValue={previousMeasurement?.skinfoldTriceps || ''} placeholder="12" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="skinfoldSubscapular" className="text-3xs">Subescapular</Label>
                    <Input id="skinfoldSubscapular" name="skinfoldSubscapular" type="number" step="any" defaultValue={previousMeasurement?.skinfoldSubscapular || ''} placeholder="14" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="skinfoldSuprailiac" className="text-3xs">Supraespinal</Label>
                    <Input id="skinfoldSuprailiac" name="skinfoldSuprailiac" type="number" step="any" defaultValue={previousMeasurement?.skinfoldSuprailiac || ''} placeholder="16" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="skinfoldAbdominal" className="text-3xs">Abdominal</Label>
                    <Input id="skinfoldAbdominal" name="skinfoldAbdominal" type="number" step="any" defaultValue={previousMeasurement?.skinfoldAbdominal || ''} placeholder="18" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="skinfoldBiceps" className="text-3xs">Bicipital</Label>
                    <Input id="skinfoldBiceps" name="skinfoldBiceps" type="number" step="any" defaultValue={previousMeasurement?.skinfoldBiceps || ''} placeholder="8" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="skinfoldCalf" className="text-3xs">Pantorrilla Medial</Label>
                    <Input id="skinfoldCalf" name="skinfoldCalf" type="number" step="any" defaultValue={previousMeasurement?.skinfoldCalf || ''} placeholder="10" className="h-8 text-xs rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Diámetros Óseos & Bioimpedancia */}
              <div className="pt-2 border-t border-blue-100">
                <p className="text-2xs font-bold text-blue-900 uppercase tracking-wide mb-2">Diámetros Óseos (cm) y Bioimpedancia</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="boneDiameterWrist" className="text-3xs">Biestiloideo Muñeca</Label>
                    <Input id="boneDiameterWrist" name="boneDiameterWrist" type="number" step="any" defaultValue={previousMeasurement?.boneDiameterWrist || ''} placeholder="5.5" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="boneDiameterHumerus" className="text-3xs">Biepicondilar Húmero</Label>
                    <Input id="boneDiameterHumerus" name="boneDiameterHumerus" type="number" step="any" defaultValue={previousMeasurement?.boneDiameterHumerus || ''} placeholder="6.8" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="boneDiameterFemur" className="text-3xs">Biepicondilar Fémur</Label>
                    <Input id="boneDiameterFemur" name="boneDiameterFemur" type="number" step="any" defaultValue={previousMeasurement?.boneDiameterFemur || ''} placeholder="9.4" className="h-8 text-xs rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phaseAngle" className="text-3xs">Ángulo de Fase BIA (°)</Label>
                    <Input id="phaseAngle" name="phaseAngle" type="number" step="any" defaultValue={previousMeasurement?.phaseAngle || ''} placeholder="6.5" className="h-8 text-xs rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs">Observaciones de la sesión</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Ej. Buena adherencia al plan, comenta mayor energía en entrenamientos..."
              className="rounded-xl text-xs"
            />
          </div>

          {/* Visibilidad en el Portal del Paciente (3.5 - apagado por defecto) */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <input
              type="checkbox"
              id="isPublishedToPatient"
              name="isPublishedToPatient"
              value="true"
              defaultChecked={false}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <Label htmlFor="isPublishedToPatient" className="text-xs font-semibold text-gray-700 cursor-pointer">
              Visible para el paciente en su portal (apagado por defecto)
            </Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t bg-gray-50/50 px-6 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Revisión'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
