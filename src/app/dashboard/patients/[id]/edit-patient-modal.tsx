'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit3, Loader2, Save, User } from 'lucide-react'
import { updatePatient } from '../actions'

interface Props {
  patient: {
    id: string
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
    birthDate: Date | string
    sex: string
    heightCm: number
    objective: string
    activityLevel: string
    notes?: string | null
    medicalHistory?: string | null
    currentMedications?: string | null
    isGLP1Treatment?: boolean | null
    isTCAProtocol?: boolean | null
    allergies?: string | null
    allergiesStatus?: string | null
    intolerances?: string | null
    intolerancesStatus?: string | null
    medicationsStatus?: string | null
    pathologiesStatus?: string | null
    dietaryPreferences?: string | null
    guardianName?: string | null
    guardianRelationship?: string | null
    guardianEmail?: string | null
    guardianPhone?: string | null
    guardianConsentAt?: Date | string | null
    guardianConsentMethod?: string | null
  }
  iconOnly?: boolean
}

export function EditPatientModal({ patient, iconOnly = false }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isGLP1, setIsGLP1] = useState(Boolean(patient.isGLP1Treatment))
  const [isTCA, setIsTCA] = useState(Boolean(patient.isTCAProtocol))

  const birthDateFormatted = patient.birthDate
    ? new Date(patient.birthDate).toISOString().split('T')[0]
    : '1990-01-01'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    formData.set('isGLP1Treatment', isGLP1 ? 'true' : 'false')
    formData.set('isTCAProtocol', isTCA ? 'true' : 'false')

    startTransition(async () => {
      try {
        await updatePatient(patient.id, formData)
        setOpen(false)
      } catch (err: any) {
        alert(err?.message || 'Error al actualizar el paciente')
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        title="Editar Ficha del Paciente"
        aria-label="Editar Ficha"
        className={
          iconOnly
            ? 'w-9 h-9 p-0 rounded-xl border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100 font-bold shadow-2xs flex items-center justify-center transition-all active:scale-[0.96] shrink-0'
            : 'flex items-center gap-1.5 rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold'
        }
      >
        <Edit3 className="h-4 w-4 text-blue-600" />
        {!iconOnly && <span>Editar Ficha</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-gray-200">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-5 pb-3 bg-gradient-to-r from-blue-50/80 via-sky-50/30 to-white border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900">
                    Editar Expediente Clínico
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Modifica los datos de {patient.firstName} {patient.lastName} y guarda en tiempo real
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-5 space-y-4 text-xs">
              {/* Datos Personales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nombre *</Label>
                  <Input
                    name="firstName"
                    defaultValue={patient.firstName}
                    required
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Apellidos *</Label>
                  <Input
                    name="lastName"
                    defaultValue={patient.lastName}
                    required
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Teléfono de Contacto</Label>
                  <Input
                    name="phone"
                    defaultValue={patient.phone || ''}
                    placeholder="Ej. +34 611 222 333"
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Correo Electrónico</Label>
                  <Input
                    type="email"
                    name="email"
                    defaultValue={patient.email || ''}
                    placeholder="ejemplo@email.com"
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fecha Nacimiento</Label>
                  <Input
                    type="date"
                    name="birthDate"
                    defaultValue={birthDateFormatted}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Sexo</Label>
                    <select
                      name="sex"
                      defaultValue={patient.sex}
                      className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                    >
                      <option value="FEMALE">Mujer</option>
                      <option value="MALE">Hombre</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Altura (cm)</Label>
                    <Input
                      type="number"
                      name="heightCm"
                      defaultValue={patient.heightCm}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 space-y-3">
                <div>
                  <p className="font-bold">Representación legal si es menor de edad</p>
                  <p className="mt-1 leading-5">Si la fecha de nacimiento corresponde a una persona menor, completa estos datos y conserva la constancia de información del representante.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs font-semibold">Nombre del representante</Label><Input name="guardianName" defaultValue={patient.guardianName || ''} className="rounded-xl h-9 text-xs bg-white" /></div>
                  <div className="space-y-1"><Label className="text-xs font-semibold">Relación</Label><Input name="guardianRelationship" defaultValue={patient.guardianRelationship || ''} placeholder="Padre, madre, tutor..." className="rounded-xl h-9 text-xs bg-white" /></div>
                  <div className="space-y-1"><Label className="text-xs font-semibold">Correo del representante</Label><Input name="guardianEmail" type="email" defaultValue={patient.guardianEmail || ''} className="rounded-xl h-9 text-xs bg-white" /></div>
                  <div className="space-y-1"><Label className="text-xs font-semibold">Teléfono del representante</Label><Input name="guardianPhone" defaultValue={patient.guardianPhone || ''} className="rounded-xl h-9 text-xs bg-white" /></div>
                  <div className="space-y-1 sm:col-span-2"><Label className="text-xs font-semibold">Método de constancia</Label><select name="guardianConsentMethod" defaultValue={patient.guardianConsentMethod || 'PRESENCIAL'} className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium"><option value="PRESENCIAL">Información presencial</option><option value="TELEFONO">Información por teléfono</option><option value="DOCUMENTO">Documento firmado</option></select></div>
                </div>
                <label className="flex items-start gap-2 leading-5"><input name="guardianConsentAccepted" value="true" type="checkbox" className="mt-0.5" /><span>Confirmo o actualizo la constancia de representación e información legal cuando sea necesaria.</span></label>
                {patient.guardianConsentAt && <p className="text-[11px] text-amber-800">Constancia registrada el {new Date(patient.guardianConsentAt).toLocaleDateString('es-ES')}.</p>}
              </div>

              {/* Objetivos y Actividad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Objetivo Clínico</Label>
                  <select
                    name="objective"
                    defaultValue={patient.objective}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option value="WEIGHT_LOSS">Pérdida de peso / grasa</option>
                    <option value="MUSCLE_GAIN">Ganancia de masa muscular</option>
                    <option value="MAINTENANCE">Mantenimiento y recomposición</option>
                    <option value="HEALTH_IMPROVEMENT">Mejora de salud / patología</option>
                    <option value="SPORTS_PERFORMANCE">Rendimiento deportivo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nivel de Actividad</Label>
                  <select
                    name="activityLevel"
                    defaultValue={patient.activityLevel}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option value="SEDENTARY">Sedentario (poco o nada)</option>
                    <option value="LIGHT">Ligero (1-3 días/semana)</option>
                    <option value="MODERATE">Moderado (3-5 días/semana)</option>
                    <option value="ACTIVE">Activo (6-7 días/semana)</option>
                    <option value="VERY_ACTIVE">Muy activo (doble sesión / trabajo físico)</option>
                  </select>
                </div>
              </div>

              {/* Seguridad Clínica: Alergias e Intolerancias (3 Estados) */}
              <div className="space-y-3 pt-1 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Alergias</Label>
                      <select
                        name="allergiesStatus"
                        defaultValue={patient.allergiesStatus || (patient.allergies ? 'CONFIRMED' : 'NO_CONSTA')}
                        className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5 font-medium"
                      >
                        <option value="NO_CONSTA">No consta</option>
                        <option value="NINGUNA_CONOCIDA">Ninguna conocida</option>
                        <option value="CONFIRMED">Confirmadas (valores)</option>
                      </select>
                    </div>
                    <Input
                      name="allergies"
                      defaultValue={patient.allergies || ''}
                      placeholder="Ej. Frutos secos, marisco..."
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Intolerancias</Label>
                      <select
                        name="intolerancesStatus"
                        defaultValue={patient.intolerancesStatus || (patient.intolerances ? 'CONFIRMED' : 'NO_CONSTA')}
                        className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5 font-medium"
                      >
                        <option value="NO_CONSTA">No consta</option>
                        <option value="NINGUNA_CONOCIDA">Ninguna conocida</option>
                        <option value="CONFIRMED">Confirmadas (valores)</option>
                      </select>
                    </div>
                    <Input
                      name="intolerances"
                      defaultValue={patient.intolerances || ''}
                      placeholder="Ej. Lactosa, fructosa, gluten..."
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Medicación Habitual</Label>
                      <select
                        name="medicationsStatus"
                        defaultValue={patient.medicationsStatus || (patient.currentMedications ? 'CONFIRMED' : 'NO_CONSTA')}
                        className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5 font-medium"
                      >
                        <option value="NO_CONSTA">No consta</option>
                        <option value="NINGUNA_CONOCIDA">Ninguna conocida</option>
                        <option value="CONFIRMED">Confirmadas (valores)</option>
                      </select>
                    </div>
                    <Input
                      name="currentMedications"
                      defaultValue={patient.currentMedications || ''}
                      placeholder="Ej. Sintrom, Eutirox 50mcg, Metformina..."
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Patologías / Antecedentes</Label>
                      <select
                        name="pathologiesStatus"
                        defaultValue={patient.pathologiesStatus || (patient.medicalHistory ? 'CONFIRMED' : 'NO_CONSTA')}
                        className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-0.5 font-medium"
                      >
                        <option value="NO_CONSTA">No consta</option>
                        <option value="NINGUNA_CONOCIDA">Ninguna conocida</option>
                        <option value="CONFIRMED">Confirmadas (valores)</option>
                      </select>
                    </div>
                    <Input
                      name="medicalHistory"
                      defaultValue={patient.medicalHistory || ''}
                      placeholder="Ej. Hipotiroidismo, hipertensión..."
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Notas Clínicas Privadas</Label>
                  <Textarea
                    name="notes"
                    defaultValue={patient.notes || ''}
                    placeholder="Anotaciones de consulta..."
                    rows={2}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Protocolos Avanzados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="glp1-edit"
                    checked={isGLP1}
                    onChange={(e) => setIsGLP1(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600"
                  />
                  <label htmlFor="glp1-edit" className="text-2xs text-amber-950 cursor-pointer">
                    <strong className="block text-amber-900">Protocolo GLP-1 (Ozempic)</strong>
                    <span>Suelo proteico asistido y control muscular</span>
                  </label>
                </div>

                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="tca-edit"
                    checked={isTCA}
                    onChange={(e) => setIsTCA(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600"
                  />
                  <label htmlFor="tca-edit" className="text-2xs text-purple-950 cursor-pointer">
                    <strong className="block text-purple-900">Protocolo TCA</strong>
                    <span>Ocultar números y gramajes en PDFs</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isPending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 flex items-center gap-1.5 shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
