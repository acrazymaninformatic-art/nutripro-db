import Link from 'next/link'
import { getPatients, restorePatient } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, ArrowRight, Eye, Phone, Mail, Trash2, RotateCcw } from 'lucide-react'
import { OBJECTIVE_LABELS, type Objective } from '@/types'

export const dynamic = 'force-dynamic'

interface PatientsPageProps {
  searchParams?: Promise<{ tab?: string; tag?: string }>
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const params = await searchParams
  const currentTab = params?.tab === 'papelera' ? 'papelera' : 'activos'
  const selectedTag = params?.tag || null
  const patients = await getPatients()

  const activePatients = patients.filter((p) => p.isActive)
  const archivedPatients = patients.filter((p) => !p.isActive)
  const tabPatients = currentTab === 'papelera' ? archivedPatients : activePatients

  // Extract all unique private tags across active patients
  const allTags: Array<{ name: string; color: string }> = []
  for (const p of activePatients) {
    try {
      if (p.tags) {
        const parsed = JSON.parse(p.tags)
        for (const t of parsed) {
          if (!allTags.some((at) => at.name === t.name)) {
            allTags.push(t)
          }
        }
      }
    } catch {}
  }

  // Filter by tag if selected
  const displayedPatients = tabPatients.filter((p) => {
    if (!selectedTag) return true
    try {
      if (!p.tags) return false
      const tags = JSON.parse(p.tags)
      return tags.some((t: any) => t.name === selectedTag)
    } catch {
      return false
    }
  })

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directorio de Pacientes</h1>
          <p className="text-sm text-gray-500">
            Gestiona la información médica, objetivos y evolución antropométrica de tus clientes.
          </p>
        </div>
        <Link href="/dashboard/patients/new">
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Nuevo Paciente</span>
          </Button>
        </Link>
      </div>

      {/* Tabs Filter: Activos vs Papelera + Filtro por Etiquetas Privadas (5.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/patients?tab=activos${selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : ''}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'activos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Activos ({activePatients.length})</span>
          </Link>
          <Link
            href={`/dashboard/patients?tab=papelera${selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : ''}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'papelera'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Papelera ({archivedPatients.length})</span>
          </Link>
        </div>

        {/* Filtro por Etiquetas Privadas */}
        {allTags.length > 0 && currentTab === 'activos' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-2xs font-bold text-gray-400 uppercase mr-1">Etiquetas:</span>
            <Link
              href="/dashboard/patients?tab=activos"
              className={`text-2xs px-2.5 py-1 rounded-full font-bold transition-all border ${
                !selectedTag
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Todas
            </Link>
            {allTags.map((tag) => {
              const isSelected = selectedTag === tag.name
              return (
                <Link
                  key={tag.name}
                  href={`/dashboard/patients?tab=activos&tag=${encodeURIComponent(tag.name)}`}
                  style={{
                    backgroundColor: isSelected ? tag.color : `${tag.color}15`,
                    color: isSelected ? '#ffffff' : tag.color,
                    borderColor: tag.color,
                  }}
                  className="text-2xs px-2.5 py-1 rounded-full font-bold transition-all border"
                >
                  {tag.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Patients Table Card */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
              {currentTab === 'papelera' ? (
                <>
                  <Trash2 className="h-5 w-5 text-amber-600" />
                  <span>Pacientes en Papelera ({archivedPatients.length})</span>
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Pacientes Activos ({activePatients.length})</span>
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {currentTab === 'papelera'
                ? 'Expedientes archivados. Puedes restaurarlos en cualquier momento.'
                : 'Fichas clínicas activas e historial de revisiones'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {displayedPatients.length === 0 ? (
            <div className="text-center py-12 px-4">
              {currentTab === 'papelera' ? (
                <>
                  <Trash2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-gray-900">La papelera está vacía</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                    No tienes ningún expediente clínico archivado en la papelera.
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-gray-900">No hay pacientes activos</p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Comienza registrando a tu primer paciente para calcular requerimientos y crear planes dietéticos.
                  </p>
                  <Link href="/dashboard/patients/new">
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrar Paciente
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-y border-gray-200 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Nombre</th>
                    <th scope="col" className="px-6 py-3.5">Contacto</th>
                    <th scope="col" className="px-6 py-3.5">Objetivo</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Último Peso</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Estado</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedPatients.map((patient) => {
                    const latestAnthropometry = patient.anthropometries[0]
                    const objectiveLabel = OBJECTIVE_LABELS[patient.objective as Objective] || patient.objective

                    let pTags: Array<{ name: string; color: string }> = []
                    try {
                      if (patient.tags) pTags = JSON.parse(patient.tags)
                    } catch {}

                    return (
                      <tr key={patient.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <Link
                            href={`/dashboard/patients/${patient.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                          >
                            <span>{patient.lastName}, {patient.firstName}</span>
                          </Link>
                          <span className="text-xs text-gray-400">
                            {patient.sex === 'MALE' ? 'Hombre' : 'Mujer'} • {patient.heightCm} cm
                          </span>
                          {pTags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {pTags.map((t) => (
                                <span
                                  key={t.name}
                                  style={{ backgroundColor: `${t.color}15`, color: t.color, borderColor: `${t.color}40` }}
                                  className="px-1.5 py-0.2 rounded-md text-[10px] font-bold border"
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {patient.email && (
                            <div className="flex items-center gap-1 mb-0.5">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>{patient.email}</span>
                            </div>
                          )}
                          {patient.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{patient.phone}</span>
                            </div>
                          )}
                          {!patient.email && !patient.phone && '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {objectiveLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-900">
                          {latestAnthropometry ? (
                            <div>
                              <span>{latestAnthropometry.weightKg} kg</span>
                              {latestAnthropometry.bodyFatPct && (
                                <span className="block text-xs text-gray-400">
                                  {latestAnthropometry.bodyFatPct}% GC
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {patient.isDischarged ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                              Alta Clínica
                            </Badge>
                          ) : patient.isActive ? (
                            <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">
                              En Papelera
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!patient.isActive && (
                              <form action={restorePatient.bind(null, patient.id)}>
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300 rounded-xl"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                  Restaurar
                                </Button>
                              </form>
                            )}
                            <Link href={`/dashboard/patients/${patient.id}`}>
                              <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800">
                                <Eye className="h-4 w-4 mr-1" />
                                Ficha
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
