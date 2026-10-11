import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CalendarDays,
  ClipboardList,
  ChefHat,
  UserPlus,
  CalendarPlus,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { OBJECTIVE_LABELS, type Objective } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  // Fetch real data from SQLite
  const [patientCount, activePlanCount, consultationCount, recipeCount, recentPatients] =
    await Promise.all([
      prisma.patient.count({ where: { isActive: true } }),
      prisma.mealPlan.count({ where: { isActive: true } }),
      prisma.consultation.count({ where: { date: { gte: startOfMonth } } }),
      prisma.recipe.count(),
      prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          anthropometries: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      }),
    ])

  // Current date formatted in Spanish
  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panel de Control</h1>
          <p className="text-sm text-gray-500 capitalize">{todayFormatted}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/plans/new">
            <Button variant="outline" className="flex items-center gap-2 rounded-2xl">
              <CalendarPlus className="h-4 w-4 text-blue-600" />
              <span>Nuevo Plan</span>
            </Button>
          </Link>
          <Link href="/dashboard/patients/new">
            <Button className="flex items-center gap-2 shadow-sm rounded-2xl">
              <UserPlus className="h-4 w-4" />
              <span>Nuevo Paciente</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pacientes */}
        <Card className="border-l-4 border-l-green-600 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pacientes Activos
              </p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{patientCount}</h3>
              <p className="text-xs text-blue-700 mt-1 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Fichas en seguimiento
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Planes */}
        <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Planes Activos
              </p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{activePlanCount}</h3>
              <p className="text-xs text-blue-700 mt-1 font-medium flex items-center gap-1">
                Pautas nutricionales
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CalendarDays className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Consultas */}
        <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Consultas del Mes
              </p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{consultationCount}</h3>
              <p className="text-xs text-purple-700 mt-1 font-medium flex items-center gap-1">
                Revisiones periódicas
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ClipboardList className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Recetas */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recetas & Platos
              </p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{recipeCount}</h3>
              <p className="text-xs text-amber-700 mt-1 font-medium flex items-center gap-1">
                Menús personalizados
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ChefHat className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards (Sin duplicados y con estética redondeada moderna) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">Accesos Directos Clínicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/plans/new">
            <Card className="p-4.5 rounded-3xl hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-white to-blue-50/20 border-gray-200">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl group-hover:scale-105 transition-transform shadow-2xs">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                    Crear Nuevo Plan Semanal
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Generador automático adaptado y matriz semanal
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/foods">
            <Card className="p-4.5 rounded-3xl hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-white to-blue-50/20 border-gray-200">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl group-hover:scale-105 transition-transform shadow-2xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                    Alimentos y Macros (1.012 items)
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Base de datos nutricional con fotos HD
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/recipes">
            <Card className="p-4.5 rounded-3xl hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-white to-blue-50/20 border-gray-200">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl group-hover:scale-105 transition-transform shadow-2xs">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                    Recetario Culinario Clínico
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Platos saludables con tiempos y elaboración
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Patients Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Pacientes Recientes</span>
            </CardTitle>
            <CardDescription>Últimos expedientes clínicos atendidos</CardDescription>
          </div>
          <Link
            href="/dashboard/patients"
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentPatients.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Aún no hay pacientes dados de alta</p>
              <Link href="/dashboard/patients/new" className="mt-3 inline-block">
                <Button size="sm">Registrar Primer Paciente</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-y border-gray-200 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Objetivo</th>
                    <th className="px-6 py-3 text-center">Último Peso</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPatients.map((p) => {
                    const latest = p.anthropometries[0]
                    const objectiveLabel = OBJECTIVE_LABELS[p.objective as Objective] || p.objective

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <Link
                            href={`/dashboard/patients/${p.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline"
                          >
                            {p.lastName}, {p.firstName}
                          </Link>
                          <span className="block text-xs text-gray-400">
                            {p.sex === 'MALE' ? 'Hombre' : 'Mujer'} • {p.heightCm} cm
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {objectiveLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-900">
                          {latest ? `${latest.weightKg} kg` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.isActive ? (
                            <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/dashboard/patients/${p.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800">
                              Ver Ficha →
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
