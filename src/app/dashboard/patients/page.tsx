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
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Directorio de Pacientes</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Gestiona la información médica, objetivos y evolución antropométrica de tus clientes.
          </p>
        </div>
        <Link href="/dashboard/patients/new">
          <Button className="flex items-center gap-2 rounded-2xl h-10 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-[0.98]">
            <UserPlus className="h-4 w-4" />
            <span>Nuevo Paciente</span>
          </Button>
        </Link>
      </div>

      {/* Tabs Filter: Activos vs Papelera + Filtro por Etiquetas Privadas (5.2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="inline-flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-2xs">
          <Link
            href={`/dashboard/patients?tab=activos${selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : ''}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'activos'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Activos ({activePatients.length})</span>
          </Link>
          <Link
            href={`/dashboard/patients?tab=papelera${selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : ''}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentTab === 'papelera'
                ? 'bg-white text-amber-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-4 h-4 text-amber-600" />
            <span>Papelera ({archivedPatients.length})</span>
          </Link>
        </div>

        {/* Filtro por Etiquetas Privadas */}
        {allTags.length > 0 && currentTab === 'activos' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Etiquetas:</span>
            <Link
              href="/dashboard/patients?tab=activos"
              className={`text-2xs px-3 py-1 rounded-full font-bold transition-all border ${
                !selectedTag
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                  className="text-2xs px-3 py-1 rounded-full font-bold transition-all border shadow-2xs"
                >
                  {tag.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Patients Table Card */}
      <Card className="rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <CardHeader className="flex flex-row items-center justify-between p-6 pb-4 bg-slate-50/50 border-b border-slate-100">
          <div>
            <CardTitle className="text-base flex items-center gap-2.5 font-bold text-slate-900">
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
            <CardDescription className="text-xs text-slate-500 mt-0.5">
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
                  <Trash2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-bold text-slate-900">La papelera está vacía</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    No tienes ningún expediente clínico archivado en la papelera.
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-bold text-slate-900">No hay pacientes activos</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Comienza registrando a tu primer paciente para calcular requerimientos y crear planes dietéticos.
                  </p>
                  <Link href="/dashboard/patients/new">
                    <Button className="rounded-2xl text-xs font-bold">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrar Paciente
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Nombre</th>
                    <th scope="col" className="px-6 py-3.5">Contacto</th>
                    <th scope="col" className="px-6 py-3.5">Objetivo</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Último Peso</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Estado</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedPatients.map((patient) => {
                    const latestAnthropometry = patient.anthropometries[0]
                    const objectiveLabel = OBJECTIVE_LABELS[patient.objective as Objective] || patient.objective

                    let pTags: Array<{ name: string; color: string }> = []
                    try {
                      if (patient.tags) pTags = JSON.parse(patient.tags)
                    } catch {}

                    return (
                      <tr key={patient.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <Link
                            href={`/dashboard/patients/${patient.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                          >
                            <span>{patient.lastName}, {patient.firstName}</span>
                          </Link>
                          <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                            {patient.sex === 'MALE' ? 'Hombre' : 'Mujer'} • <span className="font-mono tabular-nums">{patient.heightCm} cm</span>
                          </span>
                          {pTags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {pTags.map((t) => (
                                <span
                                  key={t.name}
                                  style={{ backgroundColor: `${t.color}15`, color: t.color, borderColor: `${t.color}40` }}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {patient.email && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span>{patient.email}</span>
                            </div>
                          )}
                          {patient.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{patient.phone}</span>
                            </div>
                          )}
                          {!patient.email && !patient.phone && '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="medical" className="text-2xs font-bold">
                            {objectiveLabel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900 font-mono tabular-nums">
                          {latestAnthropometry ? (
                            <div>
                              <span>{latestAnthropometry.weightKg} kg</span>
                              {latestAnthropometry.bodyFatPct && (
                                <span className="block text-[11px] font-normal text-slate-400">
                                  {latestAnthropometry.bodyFatPct}% GC
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {patient.isDischarged ? (
                            <Badge variant="success" className="text-2xs font-bold">
                              Alta Clínica
                            </Badge>
                          ) : patient.isActive ? (
                            <Badge variant="teal" className="text-2xs font-bold">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-2xs font-bold">
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
                              <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-50/70 rounded-xl font-bold text-xs h-8 px-3">
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
