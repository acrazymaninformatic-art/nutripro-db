'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Activity, Plus, Trash2, Calendar, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { createBloodAnalysis, deleteBloodAnalysis } from '../blood-actions'
import { calculateBloodIndices } from '@/lib/nutrition/anthropometry'

interface BloodRecord {
  id: string
  patientId: string
  date: Date | string
  glucoseMgDl: number | null
  hba1cPct: number | null
  cholesterolMgDl: number | null
  hdlMgDl: number | null
  ldlMgDl: number | null
  triglyceridesMgDl: number | null
  ferritinNgMl: number | null
  tshUiuMl: number | null
  vitaminDNgMl: number | null
  creatinineMgDl: number | null
  uricAcidMgDl: number | null
  gotAstUL: number | null
  gptAltUL: number | null
  insulinUiuMl?: number | null
  plateletsKUl?: number | null
  notes: string | null
}

interface Props {
  patientId: string
  records: BloodRecord[]
  patientAge?: number
}

interface BiomarkerDef {
  key: keyof BloodRecord
  name: string
  unit: string
  normalRange: string
  checkStatus: (val: number) => 'normal' | 'warning' | 'danger'
}

const BIOMARKERS: BiomarkerDef[] = [
  {
    key: 'glucoseMgDl',
    name: 'Glucosa Basal',
    unit: 'mg/dL',
    normalRange: '70 - 100',
    checkStatus: (v) => (v < 70 || v > 125 ? 'danger' : v > 100 ? 'warning' : 'normal'),
  },
  {
    key: 'hba1cPct',
    name: 'HbA1c (Hemoglobina Glicosilada)',
    unit: '%',
    normalRange: '< 5.7',
    checkStatus: (v) => (v >= 6.5 ? 'danger' : v >= 5.7 ? 'warning' : 'normal'),
  },
  {
    key: 'cholesterolMgDl',
    name: 'Colesterol Total',
    unit: 'mg/dL',
    normalRange: '< 200',
    checkStatus: (v) => (v >= 240 ? 'danger' : v >= 200 ? 'warning' : 'normal'),
  },
  {
    key: 'hdlMgDl',
    name: 'Colesterol HDL',
    unit: 'mg/dL',
    normalRange: '> 50',
    checkStatus: (v) => (v < 40 ? 'danger' : v < 50 ? 'warning' : 'normal'),
  },
  {
    key: 'ldlMgDl',
    name: 'Colesterol LDL',
    unit: 'mg/dL',
    normalRange: '< 100',
    checkStatus: (v) => (v >= 160 ? 'danger' : v >= 130 ? 'warning' : 'normal'),
  },
  {
    key: 'triglyceridesMgDl',
    name: 'Triglicéridos',
    unit: 'mg/dL',
    normalRange: '< 150',
    checkStatus: (v) => (v >= 200 ? 'danger' : v >= 150 ? 'warning' : 'normal'),
  },
  {
    key: 'vitaminDNgMl',
    name: 'Vitamina D (25-OH)',
    unit: 'ng/mL',
    normalRange: '30 - 100',
    checkStatus: (v) => (v < 20 ? 'danger' : v < 30 ? 'warning' : 'normal'),
  },
  {
    key: 'ferritinNgMl',
    name: 'Ferritina',
    unit: 'ng/mL',
    normalRange: '30 - 300',
    checkStatus: (v) => (v < 20 || v > 400 ? 'danger' : v < 30 || v > 300 ? 'warning' : 'normal'),
  },
  {
    key: 'tshUiuMl',
    name: 'TSH (Tirotropina)',
    unit: 'µIU/mL',
    normalRange: '0.4 - 4.0',
    checkStatus: (v) => (v < 0.2 || v > 5.0 ? 'danger' : v < 0.4 || v > 4.0 ? 'warning' : 'normal'),
  },
  {
    key: 'creatinineMgDl',
    name: 'Creatinina',
    unit: 'mg/dL',
    normalRange: '0.7 - 1.2',
    checkStatus: (v) => (v > 1.3 ? 'danger' : 'normal'),
  },
  {
    key: 'uricAcidMgDl',
    name: 'Ácido Úrico',
    unit: 'mg/dL',
    normalRange: '3.5 - 7.0',
    checkStatus: (v) => (v > 7.0 ? 'danger' : 'normal'),
  },
  {
    key: 'gotAstUL',
    name: 'GOT / AST',
    unit: 'U/L',
    normalRange: '< 35',
    checkStatus: (v) => (v > 45 ? 'danger' : v > 35 ? 'warning' : 'normal'),
  },
  {
    key: 'gptAltUL',
    name: 'GPT / ALT',
    unit: 'U/L',
    normalRange: '< 45',
    checkStatus: (v) => (v > 55 ? 'danger' : v > 45 ? 'warning' : 'normal'),
  },
  {
    key: 'insulinUiuMl',
    name: 'Insulina Basal',
    unit: 'µIU/mL',
    normalRange: '2.6 - 24.9',
    checkStatus: (v) => (v > 25 ? 'danger' : v > 15 ? 'warning' : 'normal'),
  },
  {
    key: 'plateletsKUl',
    name: 'Plaquetas',
    unit: '10³/µL',
    normalRange: '150 - 450',
    checkStatus: (v) => (v < 150 || v > 450 ? 'warning' : 'normal'),
  },
]

export function BloodAnalysisCard({ patientId, records, patientAge }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0)

  const activeRecord = records[selectedRecordIndex] || null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await createBloodAnalysis({
        patientId,
        date: (formData.get('date') as string) || new Date().toISOString(),
        glucoseMgDl: formData.get('glucose') ? Number(formData.get('glucose')) : undefined,
        hba1cPct: formData.get('hba1c') ? Number(formData.get('hba1c')) : undefined,
        cholesterolMgDl: formData.get('cholesterol') ? Number(formData.get('cholesterol')) : undefined,
        hdlMgDl: formData.get('hdl') ? Number(formData.get('hdl')) : undefined,
        ldlMgDl: formData.get('ldl') ? Number(formData.get('ldl')) : undefined,
        triglyceridesMgDl: formData.get('triglycerides') ? Number(formData.get('triglycerides')) : undefined,
        vitaminDNgMl: formData.get('vitaminD') ? Number(formData.get('vitaminD')) : undefined,
        ferritinNgMl: formData.get('ferritin') ? Number(formData.get('ferritin')) : undefined,
        tshUiuMl: formData.get('tsh') ? Number(formData.get('tsh')) : undefined,
        creatinineMgDl: formData.get('creatinine') ? Number(formData.get('creatinine')) : undefined,
        uricAcidMgDl: formData.get('uricAcid') ? Number(formData.get('uricAcid')) : undefined,
        gotAstUL: formData.get('gotAst') ? Number(formData.get('gotAst')) : undefined,
        gptAltUL: formData.get('gptAlt') ? Number(formData.get('gptAlt')) : undefined,
        insulinUiuMl: formData.get('insulin') ? Number(formData.get('insulin')) : undefined,
        plateletsKUl: formData.get('platelets') ? Number(formData.get('platelets')) : undefined,
        notes: (formData.get('notes') as string) || undefined,
      })
      setShowAddForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este registro analítico?')) {
      await deleteBloodAnalysis(id, patientId)
    }
  }

  return (
    <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-sm">
      <CardHeader className="bg-gradient-to-r from-red-50/60 via-white to-white border-b border-gray-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100/70 text-red-700 rounded-2xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Analíticas Sanguíneas y Biomarcadores</span>
                <Badge variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200 rounded-full font-bold">
                  {records.length} {records.length === 1 ? 'analítica' : 'analíticas'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Semáforo clínico y seguimiento bioquímico (glucemia, lípidos, tiroides, vitaminas).
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {showAddForm ? 'Cerrar Formulario' : 'Nueva Analítica'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Formulario desplegable */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-red-50/40 border border-red-100 space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <span>Registrar Valores de Analítica Clínica</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <Label className="text-xs">Fecha Analítica</Label>
                <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Glucosa (mg/dL)</Label>
                <Input type="number" step="any" name="glucose" placeholder="Ej. 88" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">HbA1c (%)</Label>
                <Input type="number" step="any" name="hba1c" placeholder="Ej. 5.3" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Colesterol Total (mg/dL)</Label>
                <Input type="number" step="any" name="cholesterol" placeholder="Ej. 195" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">HDL (mg/dL)</Label>
                <Input type="number" step="any" name="hdl" placeholder="Ej. 58" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">LDL (mg/dL)</Label>
                <Input type="number" step="any" name="ldl" placeholder="Ej. 112" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Triglicéridos (mg/dL)</Label>
                <Input type="number" step="any" name="triglycerides" placeholder="Ej. 110" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vitamina D (ng/mL)</Label>
                <Input type="number" step="any" name="vitaminD" placeholder="Ej. 34" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ferritina (ng/mL)</Label>
                <Input type="number" step="any" name="ferritin" placeholder="Ej. 65" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">TSH (µIU/mL)</Label>
                <Input type="number" step="any" name="tsh" placeholder="Ej. 2.1" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Creatinina (mg/dL)</Label>
                <Input type="number" step="any" name="creatinine" placeholder="Ej. 0.9" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ácido Úrico (mg/dL)</Label>
                <Input type="number" step="any" name="uricAcid" placeholder="Ej. 5.1" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GOT / AST (U/L)</Label>
                <Input type="number" step="any" name="gotAst" placeholder="Ej. 22" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GPT / ALT (U/L)</Label>
                <Input type="number" step="any" name="gptAlt" placeholder="Ej. 25" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Insulina Basal (µIU/mL)</Label>
                <Input type="number" step="any" name="insulin" placeholder="Ej. 8.5" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plaquetas (10³/µL)</Label>
                <Input type="number" step="any" name="platelets" placeholder="Ej. 240" className="h-9 text-xs" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Notas Clínicas del Laboratorio</Label>
                <Input type="text" name="notes" placeholder="Ej. Muestra en ayunas de 12 horas, analítica previa a inicio de dieta" className="h-9 text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                {isSubmitting ? 'Guardando...' : 'Guardar Analítica'}
              </Button>
            </div>
          </form>
        )}

        {records.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Sin analíticas de sangre registradas</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-0.5 mb-3">
              Registra los parámetros analíticos de tu paciente para contrastar su evolución metabólica junto con el peso y la masa muscular.
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="rounded-xl">
              <Plus className="h-4 w-4 mr-1.5" />
              Añadir Primera Analítica
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selector de fecha de analítica si hay varias */}
            {records.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-semibold text-gray-500 shrink-0">Historial:</span>
                {records.map((rec, idx) => (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedRecordIndex(idx)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all shrink-0 ${
                      selectedRecordIndex === idx
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {new Date(rec.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </button>
                ))}
              </div>
            )}

            {/* Ficha activa de analítica con Semáforo Clínico */}
            {activeRecord && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-gray-700">
                      Fecha de extracción:{' '}
                      {new Date(activeRecord.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    {activeRecord.notes && (
                      <span className="italic text-gray-400">· {activeRecord.notes}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(activeRecord.id)}
                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs"
                    title="Eliminar analítica"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar
                  </Button>
                </div>

                {/* Índices Clínicos y Metabólicos Avanzados (5.3) */}
                {(() => {
                  const indices = calculateBloodIndices({
                    cholesterolTotalMgDl: activeRecord.cholesterolMgDl,
                    hdlMgDl: activeRecord.hdlMgDl,
                    triglyceridesMgDl: activeRecord.triglyceridesMgDl,
                    glucoseMgDl: activeRecord.glucoseMgDl,
                    insulinUiuMl: activeRecord.insulinUiuMl,
                    ageYears: patientAge || 35,
                    astUL: activeRecord.gotAstUL,
                    altUL: activeRecord.gptAltUL,
                    plateletsKUl: activeRecord.plateletsKUl,
                  })

                  const hasAnyIndex = indices.tgHdlRatio || indices.friedewaldLdl || indices.homaIr || indices.fib4
                  if (!hasAnyIndex) return null

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50/50 via-slate-50 to-blue-50/40 border border-red-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-black uppercase tracking-wider text-red-950 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-red-600" />
                          <span>Índices Metabólicos y Clínicos Calculados (5.3)</span>
                        </span>
                        <Badge variant="outline" className="bg-white text-3xs font-bold text-gray-700">
                          Algoritmos Clínicos Estandarizados
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {indices.homaIr && (
                          <div className={`p-3 rounded-xl border bg-white shadow-2xs space-y-1 ${
                            indices.homaIr.status === 'danger' ? 'border-rose-300' : indices.homaIr.status === 'warning' ? 'border-amber-300' : 'border-blue-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-2xs font-bold text-gray-700">HOMA-IR</span>
                              <Badge className={`text-3xs font-black rounded-full ${
                                indices.homaIr.status === 'danger' ? 'bg-rose-600' : indices.homaIr.status === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
                              }`}>
                                {indices.homaIr.value}
                              </Badge>
                            </div>
                            <p className="text-3xs text-gray-500 leading-tight">{indices.homaIr.interpretation}</p>
                          </div>
                        )}

                        {indices.tgHdlRatio && (
                          <div className={`p-3 rounded-xl border bg-white shadow-2xs space-y-1 ${
                            indices.tgHdlRatio.status === 'danger' ? 'border-rose-300' : indices.tgHdlRatio.status === 'warning' ? 'border-amber-300' : 'border-blue-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-2xs font-bold text-gray-700">Ratio TG / HDL</span>
                              <Badge className={`text-3xs font-black rounded-full ${
                                indices.tgHdlRatio.status === 'danger' ? 'bg-rose-600' : indices.tgHdlRatio.status === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
                              }`}>
                                {indices.tgHdlRatio.value}
                              </Badge>
                            </div>
                            <p className="text-3xs text-gray-500 leading-tight">{indices.tgHdlRatio.interpretation}</p>
                          </div>
                        )}

                        {indices.friedewaldLdl && (
                          <div className={`p-3 rounded-xl border bg-white shadow-2xs space-y-1 ${
                            indices.friedewaldLdl.status === 'danger' ? 'border-rose-300' : indices.friedewaldLdl.status === 'warning' ? 'border-amber-300' : 'border-blue-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-2xs font-bold text-gray-700">LDL Friedewald</span>
                              <Badge className={`text-3xs font-black rounded-full ${
                                indices.friedewaldLdl.status === 'danger' ? 'bg-rose-600' : indices.friedewaldLdl.status === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
                              }`}>
                                {indices.friedewaldLdl.value} mg/dL
                              </Badge>
                            </div>
                            <p className="text-3xs text-gray-500 leading-tight">
                              {indices.friedewaldLdl.valid ? 'Cálculo válido (TG < 400 mg/dL)' : 'Advertencia: TG ≥ 400 mg/dL'}
                            </p>
                          </div>
                        )}

                        {indices.fib4 && (
                          <div className={`p-3 rounded-xl border bg-white shadow-2xs space-y-1 ${
                            indices.fib4.status === 'danger' ? 'border-rose-300' : indices.fib4.status === 'warning' ? 'border-amber-300' : 'border-blue-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-2xs font-bold text-gray-700">Índice FIB-4</span>
                              <Badge className={`text-3xs font-black rounded-full ${
                                indices.fib4.status === 'danger' ? 'bg-rose-600' : indices.fib4.status === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
                              }`}>
                                {indices.fib4.value}
                              </Badge>
                            </div>
                            <p className="text-3xs text-gray-500 leading-tight">{indices.fib4.interpretation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Grid de biomarcadores con semáforo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {BIOMARKERS.map((bm) => {
                    const value = activeRecord[bm.key] as number | null
                    if (value === null || value === undefined) return null

                    const status = bm.checkStatus(value)

                    return (
                      <div
                        key={bm.key}
                        className={`p-3 rounded-2xl border transition-all ${
                          status === 'normal'
                            ? 'bg-blue-50/40 border-blue-100 text-blue-950'
                            : status === 'warning'
                            ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                            : 'bg-rose-50/60 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="truncate pr-1 text-gray-700">{bm.name}</span>
                          {status === 'normal' && (
                            <span title="Valor Normal"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" /></span>
                          )}
                          {status === 'warning' && (
                            <span title="Valor Límite"><AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /></span>
                          )}
                          {status === 'danger' && (
                            <span title="Valor Alterado"><XCircle className="h-4 w-4 text-rose-600 shrink-0" /></span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-black">{value}</span>
                          <span className="text-2xs text-gray-500">{bm.unit}</span>
                        </div>

                        <div className="text-3xs text-gray-500 mt-1 flex justify-between">
                          <span>Ref: {bm.normalRange}</span>
                          <span className={`font-bold ${
                            status === 'normal' ? 'text-blue-700' : status === 'warning' ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                            {status === 'normal' ? 'Normal' : status === 'warning' ? 'Límite' : 'Alterado'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
