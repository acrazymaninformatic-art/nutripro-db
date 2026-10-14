'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, FileText, CheckCircle2, XCircle, Plus, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react'
import { createPatientConsent, acceptPatientConsentByAdmin, revokePatientConsent } from './consent-actions'
import { addPatientDocument, toggleDocumentSharing, deletePatientDocument } from './document-actions'

interface ConsentItem {
  id: string
  type: string
  title: string
  version: string
  accepted: boolean
  acceptedAt?: Date | string | null
  signatureData?: string | null
  revokedAt?: Date | string | null
}

interface DocumentItem {
  id: string
  title: string
  category: string
  fileUrl: string
  fileName: string
  isSharedWithPatient: boolean
  notes?: string | null
  uploadedAt: Date | string
}

interface Props {
  patientId: string
  consents: ConsentItem[]
  documents: DocumentItem[]
}

export function ConsentsDocumentsPanel({ patientId, consents, documents }: Props) {
  const [activeTab, setActiveTab] = useState<'consents' | 'documents'>('consents')
  const [showDocForm, setShowDocForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultConsentTemplates = [
    { type: 'RGPD', title: 'Tratamiento de Datos de Salud (Art. 9 RGPD)' },
    { type: 'INFORMED_CONSENT', title: 'Consentimiento Informado de Dietoterapia' },
    { type: 'IMAGE_RIGHTS', title: 'Cesión y Uso de Imágenes Clínicas de Evolución' },
    { type: 'ONLINE_CONSULTATION', title: 'Consentimiento de Teleconsulta Online' },
  ]

  const handleCreateDefaultConsent = async (tpl: { type: string; title: string }) => {
    setLoading(true)
    try {
      await createPatientConsent(patientId, tpl.type, tpl.title)
    } catch (e: any) {
      alert(e.message || 'Error al emitir consentimiento')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptByAdmin = async (consentId: string) => {
    setLoading(true)
    try {
      await acceptPatientConsentByAdmin(consentId, patientId)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (consentId: string) => {
    const reason = prompt('Motivo de revocación del consentimiento:')
    if (reason === null) return
    setLoading(true)
    try {
      await revokePatientConsent(consentId, patientId, reason)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDoc = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('patientId', patientId)
    try {
      await addPatientDocument(formData)
      setShowDocForm(false)
    } catch (e: any) {
      alert(e.message || 'Error al adjuntar documento')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDocSharing = async (docId: string, current: boolean) => {
    await toggleDocumentSharing(docId, patientId, !current)
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('¿Eliminar este documento del historial?')) return
    await deletePatientDocument(docId, patientId)
  }

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Consentimientos Legales & Documentación Clínica
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Cumplimiento RGPD, firmas informadas y custodia de informes médicos
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center bg-gray-200/60 p-1 rounded-2xl gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('consents')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'consents' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Consentimientos ({consents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'documents' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Documentos ({documents.length})
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {activeTab === 'consents' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <p className="text-xs text-gray-500">
                Modelos oficiales adaptados al Reglamento General de Protección de Datos (RGPD UE 2016/679):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {defaultConsentTemplates.map((tpl) => (
                  <Button
                    key={tpl.type}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleCreateDefaultConsent(tpl)}
                    className="text-2xs font-semibold rounded-xl border-gray-200 hover:bg-blue-50 text-gray-700"
                  >
                    <Plus className="w-3 h-3 text-blue-600 mr-1" />
                    + {tpl.type}
                  </Button>
                ))}
              </div>
            </div>

            {consents.length === 0 ? (
              <p className="text-center py-6 text-sm text-gray-400">
                No hay consentimientos emitidos para este paciente. Selecciona uno de los botones superiores para generar el primero.
              </p>
            ) : (
              <div className="space-y-3">
                {consents.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{c.title}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                          v{c.version}
                        </span>
                      </div>
                      {c.accepted ? (
                        <p className="text-emerald-700 font-semibold flex items-center gap-1.5 text-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aceptado el {new Date(c.acceptedAt!).toLocaleDateString('es-ES')}
                          {c.signatureData ? ` • (${c.signatureData})` : ''}
                        </p>
                      ) : c.revokedAt ? (
                        <p className="text-red-700 font-semibold flex items-center gap-1.5 text-2xs">
                          <XCircle className="w-3.5 h-3.5" />
                          Revocado el {new Date(c.revokedAt).toLocaleDateString('es-ES')}
                        </p>
                      ) : (
                        <p className="text-amber-700 font-semibold flex items-center gap-1.5 text-2xs">
                          <XCircle className="w-3.5 h-3.5" />
                          Pendiente de firma o aceptación del paciente
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!c.accepted && !c.revokedAt && (
                        <Button
                          size="sm"
                          disabled={loading}
                          onClick={() => handleAcceptByAdmin(c.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-2xs rounded-xl h-8 font-semibold"
                        >
                          Firma Presencial
                        </Button>
                      )}
                      {c.accepted && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => handleRevoke(c.id)}
                          className="text-red-700 border-red-200 hover:bg-red-50 text-2xs rounded-xl h-8 font-semibold"
                        >
                          Revocar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Informes médicos externos, analíticas clínicas y composiciones corporales:
              </p>
              <Button
                size="sm"
                onClick={() => setShowDocForm(!showDocForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                Adjuntar Documento
              </Button>
            </div>

            {showDocForm && (
              <form onSubmit={handleAddDoc} className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Título del documento</label>
                    <input
                      name="title"
                      required
                      placeholder="Ej. Analítica sanguínea Hospital La Paz"
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Categoría</label>
                    <select
                      name="category"
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white"
                    >
                      <option value="ANALYSIS">Analítica Sanguínea / Bioquímica</option>
                      <option value="MEDICAL_REPORT">Informe Médico / Especialista</option>
                      <option value="BODY_COMP">Informe de Composición Corporal</option>
                      <option value="DIET_HISTORY">Historial Dietético Previo</option>
                      <option value="OTHER">Otro Documento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">URL o enlace al archivo / PDF</label>
                  <input
                    name="fileUrl"
                    required
                    placeholder="https://... o ruta del archivo"
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isSharedWithPatient"
                    name="isSharedWithPatient"
                    value="true"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="isSharedWithPatient" className="font-semibold text-gray-700 cursor-pointer">
                    Compartir con el paciente en su portal web (descargable)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDocForm(false)}
                    className="text-gray-500 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                  >
                    {loading ? 'Guardando...' : 'Guardar Documento'}
                  </Button>
                </div>
              </form>
            )}

            {documents.length === 0 ? (
              <p className="text-center py-6 text-sm text-gray-400">
                No hay documentos adjuntos aún. Pulsa en "Adjuntar Documento" para agregar el primero.
              </p>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3 text-xs hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{doc.title}</p>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                            {doc.category}
                          </span>
                        </div>
                        <p className="text-gray-400 text-2xs mt-0.5">
                          Subido el {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDocSharing(doc.id, doc.isSharedWithPatient)}
                        className={`p-1.5 rounded-lg border text-2xs font-semibold flex items-center gap-1 transition-colors ${
                          doc.isSharedWithPatient
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                        title={doc.isSharedWithPatient ? 'Visible en portal paciente' : 'Privado (solo profesional)'}
                      >
                        {doc.isSharedWithPatient ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{doc.isSharedWithPatient ? 'Visible' : 'Oculto'}</span>
                      </button>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Abrir archivo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
