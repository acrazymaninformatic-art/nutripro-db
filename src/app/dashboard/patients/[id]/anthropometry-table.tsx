'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toggleAnthropometryPublish } from '../actions'

export interface AnthropometryItem {
  id: string
  date: Date | string
  weightKg: number
  bodyFatPct?: number | null
  muscleMassKg?: number | null
  waistCm?: number | null
  hipCm?: number | null
  notes?: string | null
  isPublishedToPatient: boolean
}

interface Props {
  patientId: string
  measurements: AnthropometryItem[]
}

export function AnthropometryTable({ patientId, measurements }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggle = async (id: string, current: boolean) => {
    setLoadingId(id)
    try {
      await toggleAnthropometryPublish(id, patientId, !current)
    } catch (err: any) {
      alert(err.message || 'Error al actualizar visibilidad de la medición')
    } finally {
      setLoadingId(null)
    }
  }

  if (measurements.length === 0) {
    return (
      <Card className="rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <p className="text-center py-8 text-sm text-gray-400">
            Aún no hay mediciones registradas para este paciente.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3 text-right">Peso</th>
                <th className="px-5 py-3 text-right">% Grasa</th>
                <th className="px-5 py-3 text-right">Masa Muscular</th>
                <th className="px-5 py-3 text-right">Cintura</th>
                <th className="px-5 py-3 text-right">Cadera</th>
                <th className="px-5 py-3">Notas</th>
                <th className="px-5 py-3 text-center">Visibilidad Portal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {measurements.map((m) => {
                const isLoading = loadingId === m.id
                return (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {m.weightKg} kg
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {m.bodyFatPct ? `${m.bodyFatPct}%` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {m.muscleMassKg ? `${m.muscleMassKg} kg` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {m.waistCm ? `${m.waistCm} cm` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {m.hipCm ? `${m.hipCm} cm` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">
                      {m.notes || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleToggle(m.id, m.isPublishedToPatient)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-bold border transition-all ${
                          m.isPublishedToPatient
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                        title="Haz clic para publicar u ocultar esta medición en el portal del paciente"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : m.isPublishedToPatient ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-gray-400" />
                            <span>Oculto</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
