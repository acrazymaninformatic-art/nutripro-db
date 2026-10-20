'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Plus, ArrowRightLeft } from 'lucide-react'
import { saveProgressPhoto, deleteProgressPhoto } from '../actions'

interface ProgressPhotosCardProps {
  patientId: string
  photos: Array<{
    id: string
    date: Date | string
    photoUrl: string
    label?: string | null
    notes?: string | null
    consentGiven: boolean
  }>
}

export function ProgressPhotosCard({ patientId, photos }: ProgressPhotosCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [label, setLabel] = useState('Frontal')
  const [notes, setNotes] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [loading, setLoading] = useState(false)

  // Compare mode: select two photos
  const [beforePhotoId, setBeforePhotoId] = useState<string>(photos[photos.length - 1]?.id || '')
  const [afterPhotoId, setAfterPhotoId] = useState<string>(photos[0]?.id || '')

  const beforePhoto = photos.find((p) => p.id === beforePhotoId) || photos[photos.length - 1]
  const afterPhoto = photos.find((p) => p.id === afterPhotoId) || photos[0]

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consentGiven) {
      alert('Es obligatorio registrar el consentimiento específico del paciente.')
      return
    }
    setLoading(true)
    try {
      await saveProgressPhoto(patientId, {
        photoUrl,
        label,
        notes,
        consentGiven,
      })
      setIsOpen(false)
      setPhotoUrl('')
      setNotes('')
      setConsentGiven(false)
    } catch (err: any) {
      alert(err.message || 'Error al guardar foto')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta fotografía de evolución?')) return
    try {
      await deleteProgressPhoto(id, patientId)
    } catch {
      alert('Error al eliminar foto')
    }
  }

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Fotografías de Evolución (Antes y Después) (5.2)
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Comparativa visual lado a lado con consentimiento informado específico según RGPD
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            {isOpen ? 'Cerrar' : 'Añadir Fotografía'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Modal / Formulario para añadir fotografía */}
        {isOpen && (
          <form onSubmit={handleSavePhoto} className="p-5 rounded-3xl bg-blue-50/40 border border-blue-200 space-y-4">
            <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wide">
              Registrar Nueva Fotografía de Seguimiento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="photoUrl" className="text-xs">URL o Enlace de la Fotografía *</Label>
                <Input
                  id="photoUrl"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://... o ruta de almacenamiento seguro"
                  className="rounded-xl text-xs bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="label" className="text-xs">Perspectiva</Label>
                <select
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
                >
                  <option value="Frontal">Frontal</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Posterior">Posterior</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-3">
                <Label htmlFor="notes" className="text-xs">Observaciones clínicas</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ej. Mejor definición abdominal y postura lumbar corregida..."
                  className="rounded-xl text-xs bg-white"
                />
              </div>
            </div>

            {/* Checkbox de consentimiento RGPD */}
            <div className="p-3 rounded-2xl bg-white border border-blue-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                required
              />
              <label htmlFor="consentCheck" className="text-xs text-gray-700 cursor-pointer leading-tight">
                <strong>Consentimiento Específico RGPD:</strong> Confirmo que el paciente ha prestado su consentimiento informado explícito para la toma y conservación de fotografías corporales con fines estrictamente clínicos y de valoración nutricional.
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 text-white font-bold">
                {loading ? 'Guardando...' : 'Guardar Fotografía'}
              </Button>
            </div>
          </form>
        )}

        {/* Comparativa Lado a Lado (Antes y Después) */}
        {photos.length >= 2 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                <span>Comparativa Directa Antes y Después</span>
              </h4>

              <div className="flex items-center gap-2">
                <select
                  value={beforePhotoId}
                  onChange={(e) => setBeforePhotoId(e.target.value)}
                  className="text-2xs p-1 rounded-lg border border-gray-200 bg-white"
                >
                  {photos.map((p) => (
                    <option key={p.id} value={p.id}>
                      Antes: {new Date(p.date).toLocaleDateString('es-ES')} ({p.label || 'Foto'})
                    </option>
                  ))}
                </select>

                <select
                  value={afterPhotoId}
                  onChange={(e) => setAfterPhotoId(e.target.value)}
                  className="text-2xs p-1 rounded-lg border border-gray-200 bg-white"
                >
                  {photos.map((p) => (
                    <option key={p.id} value={p.id}>
                      Después: {new Date(p.date).toLocaleDateString('es-ES')} ({p.label || 'Foto'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Antes */}
              {beforePhoto && (
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800">ANTES: {new Date(beforePhoto.date).toLocaleDateString('es-ES')}</span>
                    <Badge variant="outline" className="text-3xs font-bold">{beforePhoto.label}</Badge>
                  </div>
                  <div className="aspect-3/4 rounded-xl bg-gray-200 overflow-hidden relative border flex items-center justify-center">
                    {beforePhoto.photoUrl ? (
                      <img src={beforePhoto.photoUrl} alt="Antes" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  {beforePhoto.notes && <p className="text-2xs text-gray-500 italic">{beforePhoto.notes}</p>}
                </div>
              )}

              {/* Después */}
              {afterPhoto && (
                <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-950">DESPUÉS: {new Date(afterPhoto.date).toLocaleDateString('es-ES')}</span>
                    <Badge variant="outline" className="text-3xs font-bold bg-white text-blue-800 border-blue-300">{afterPhoto.label}</Badge>
                  </div>
                  <div className="aspect-3/4 rounded-xl bg-gray-200 overflow-hidden relative border border-blue-200 flex items-center justify-center">
                    {afterPhoto.photoUrl ? (
                      <img src={afterPhoto.photoUrl} alt="Después" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-blue-400" />
                    )}
                  </div>
                  {afterPhoto.notes && <p className="text-2xs text-blue-900 italic">{afterPhoto.notes}</p>}
                </div>
              )}
            </div>
          </div>
        ) : photos.length === 1 ? (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 max-w-xs mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800">{new Date(photos[0].date).toLocaleDateString('es-ES')}</span>
              <Badge variant="outline" className="text-3xs font-bold">{photos[0].label}</Badge>
            </div>
            <div className="aspect-3/4 rounded-xl bg-gray-200 overflow-hidden relative flex items-center justify-center">
              {photos[0].photoUrl ? (
                <img src={photos[0].photoUrl} alt="Foto de seguimiento" className="w-full h-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <p className="text-2xs text-gray-500 text-center">Añade una segunda foto para activar la comparativa antes/después.</p>
          </div>
        ) : (
          <p className="text-center py-6 text-xs text-gray-400 italic">
            Sin fotos de evolución registradas para este paciente.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
