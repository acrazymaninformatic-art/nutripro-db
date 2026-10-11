import Link from 'next/link'
import { getPatients } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, ArrowRight, Eye, Phone, Mail } from 'lucide-react'
import { OBJECTIVE_LABELS, type Objective } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  const patients = await getPatients()

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

      {/* Patients Table Card */}
      <Card className="rounded-3xl border-gray-200 overflow-hidden shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gradient-to-r from-gray-50 to-emerald-50/30 border-b border-gray-100">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold text-gray-900">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>Pacientes Registrados ({patients.length})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Fichas clínicas activas e historial de revisiones
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {patients.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-900">No hay pacientes registrados</p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Comienza registrando a tu primer paciente para calcular requerimientos y crear planes dietéticos.
              </p>
              <Link href="/dashboard/patients/new">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Registrar Paciente
                </Button>
              </Link>
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
                  {patients.map((patient) => {
                    const latestAnthropometry = patient.anthropometries[0]
                    const objectiveLabel = OBJECTIVE_LABELS[patient.objective as Objective] || patient.objective

                    return (
                      <tr key={patient.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <Link
                            href={`/dashboard/patients/${patient.id}`}
                            className="text-green-700 hover:text-green-800 hover:underline flex items-center gap-1.5"
                          >
                            <span>{patient.lastName}, {patient.firstName}</span>
                          </Link>
                          <span className="text-xs text-gray-400">
                            {patient.sex === 'MALE' ? 'Hombre' : 'Mujer'} • {patient.heightCm} cm
                          </span>
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
                          {patient.isActive ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/dashboard/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800">
                              <Eye className="h-4 w-4 mr-1" />
                              Ficha
                            </Button>
                          </Link>
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
