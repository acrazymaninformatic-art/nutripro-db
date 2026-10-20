'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  exportPatientData,
  importPatientFromCSV,
  importAnthropometryBatch,
} from '../actions'

interface ImportExportSectionProps {
  patientId: string
  patientName: string
}

interface ParsedMeasurement {
  date: string | Date
  weightKg: number
  bodyFatPct?: number | null
  muscleMassKg?: number | null
  visceralFat?: number | null
  waistCm?: number | null
  hipCm?: number | null
}

export function ImportExportSection({ patientId, patientName }: ImportExportSectionProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Section collapse state
  const [isOpen, setIsOpen] = useState(false)

  // Export states
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Import states
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [measurements, setMeasurements] = useState<ParsedMeasurement[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Handle patient data export
  const handleExport = async () => {
    setIsExporting(true)
    setExportError(null)

    try {
      const jsonString = await exportPatientData(patientId)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      const sanitizedName = patientName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')

      const today = new Date().toISOString().split('T')[0]
      link.href = url
      link.download = `paciente_${sanitizedName || 'datos'}_${today}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setExportError(err?.message || 'Error al exportar los datos del paciente.')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setSuccessMessage(null)
    setMeasurements([])
    setFileName(file.name)
    setIsParsing(true)

    const isJson = file.name.toLowerCase().endsWith('.json')
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        if (!content || content.trim() === '') {
          throw new Error('El archivo seleccionado está vacío.')
        }

        if (isJson) {
          // Parse JSON
          let data: any
          try {
            data = JSON.parse(content)
          } catch {
            throw new Error('El archivo no tiene una estructura JSON válida.')
          }

          let rawList: any[] = []
          if (Array.isArray(data)) {
            rawList = data
          } else if (Array.isArray(data.anthropometries)) {
            rawList = data.anthropometries
          } else if (Array.isArray(data.measurements)) {
            rawList = data.measurements
          } else {
            throw new Error('El archivo JSON no contiene un listado de mediciones reconocible.')
          }

          const parsed: ParsedMeasurement[] = rawList
            .map((item: any) => ({
              date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
              weightKg:
                typeof item.weightKg === 'number'
                  ? item.weightKg
                  : parseFloat(item.weightKg || item.peso || item.weight || '0'),
              bodyFatPct:
                item.bodyFatPct != null
                  ? parseFloat(String(item.bodyFatPct))
                  : item.fatPct != null
                  ? parseFloat(String(item.fatPct))
                  : null,
              muscleMassKg:
                item.muscleMassKg != null
                  ? parseFloat(String(item.muscleMassKg))
                  : item.muscleMass != null
                  ? parseFloat(String(item.muscleMass))
                  : null,
              visceralFat:
                item.visceralFat != null ? parseFloat(String(item.visceralFat)) : null,
              waistCm:
                item.waistCm != null
                  ? parseFloat(String(item.waistCm))
                  : item.waist != null
                  ? parseFloat(String(item.waist))
                  : null,
              hipCm:
                item.hipCm != null
                  ? parseFloat(String(item.hipCm))
                  : item.hip != null
                  ? parseFloat(String(item.hip))
                  : null,
            }))
            .filter((m) => m.weightKg > 0 && !isNaN(m.weightKg))

          if (parsed.length === 0) {
            throw new Error('No se encontraron mediciones con peso válido en el archivo JSON.')
          }

          setMeasurements(parsed)
        } else {
          // Parse CSV / TXT via server action
          const parsed = await importPatientFromCSV(content)
          setMeasurements(parsed)
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error al procesar el archivo seleccionado.')
        setMeasurements([])
      } finally {
        setIsParsing(false)
      }
    }

    reader.onerror = () => {
      setErrorMessage('No se pudo leer el archivo seleccionado.')
      setIsParsing(false)
    }

    reader.readAsText(file)
  }

  // Reset file selection
  const handleResetFile = () => {
    setMeasurements([])
    setFileName(null)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Confirm import and save to database
  const handleConfirmImport = async () => {
    if (measurements.length === 0) return

    setIsImporting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const count = await importAnthropometryBatch(patientId, measurements)
      setSuccessMessage(`Se han importado ${count} mediciones exitosamente.`)
      handleResetFile()
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar las mediciones en la base de datos.')
    } finally {
      setIsImporting(false)
    }
  }

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-4">
      {/* Action header with Export button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Datos e Historial Antropométrico
            </h3>
            <p className="text-xs text-gray-500">
              Exporta la ficha completa o importa mediciones desde básculas de bioimpedancia
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 border-gray-300 hover:bg-gray-50 shadow-sm"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <Download className="h-4 w-4 text-blue-600" />
          )}
          <span>Exportar Datos del Paciente</span>
        </Button>
      </div>

      {exportError && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Collapsible Card for scale import */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader
          className="cursor-pointer select-none py-4 px-5 hover:bg-gray-50/70 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Upload className="h-4 w-4 text-blue-600" />
                <span>Importar Datos de Báscula / Bioimpedancia</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Compatible con SECA, Tanita, InBody y archivos CSV genéricos
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-normal hidden sm:inline-flex">
                CSV, TXT, JSON
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-500"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(!isOpen)
                }}
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isOpen && (
          <CardContent className="px-5 pb-5 pt-2 space-y-4 border-t border-gray-100">
            {/* File input and details */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Seleccionar archivo de báscula (.csv, .txt, .json):
              </label>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.json"
                  onChange={handleFileChange}
                  disabled={isParsing || isImporting}
                  className="cursor-pointer file:cursor-pointer text-xs"
                />
                {fileName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFile}
                    title="Descartar archivo"
                    className="text-gray-400 hover:text-gray-600 h-9 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Parsing loading state */}
            {isParsing && (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Analizando archivo y procesando columnas...</span>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error al importar datos</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success banner */}
            {successMessage && (
              <div className="flex items-start gap-2 p-3 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg">
                <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium">Importación completada</p>
                  <p>{successMessage}</p>
                </div>
              </div>
            )}

            {/* Preview table and confirmation */}
            {measurements.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">
                      Vista previa de mediciones
                    </span>
                    <Badge variant="default" className="text-xs">
                      {measurements.length}{' '}
                      {measurements.length === 1 ? 'medición encontrada' : 'mediciones encontradas'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetFile}
                      disabled={isImporting}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirmImport}
                      disabled={isImporting}
                      className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          <span>
                            Confirmar Importación ({measurements.length}{' '}
                            {measurements.length === 1 ? 'medición' : 'mediciones'})
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 uppercase font-semibold text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2 text-right">Peso (kg)</th>
                        <th className="px-3 py-2 text-right">% Grasa</th>
                        <th className="px-3 py-2 text-right">Masa Muscular</th>
                        <th className="px-3 py-2 text-right">Grasa Visceral</th>
                        <th className="px-3 py-2 text-right">Cintura</th>
                        <th className="px-3 py-2 text-right">Cadera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {measurements.map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70">
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {formatDate(m.date)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900">
                            {m.weightKg.toFixed(1)} kg
                          </td>
                          <td className="px-3 py-2 text-right">
                            {m.bodyFatPct != null ? `${m.bodyFatPct}%` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {m.muscleMassKg != null ? `${m.muscleMassKg} kg` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {m.visceralFat != null ? m.visceralFat : '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {m.waistCm != null ? `${m.waistCm} cm` : '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {m.hipCm != null ? `${m.hipCm} cm` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
