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
import { requireAdmin } from '@/lib/auth'
import { ScrollReveal } from '@/components/ui/page-motion'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireAdmin()
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  // Fetch real data from SQLite
  const [patientCount, activePlanCount, consultationCount, recipeCount, recentPatients] =
    await Promise.all([
      prisma.patient.count({ where: { userId: user.id, isActive: true } }),
      prisma.mealPlan.count({ where: { userId: user.id, isActive: true } }),
      prisma.consultation.count({ where: { patient: { userId: user.id }, date: { gte: startOfMonth } } }),
      prisma.recipe.count({ where: { userId: user.id } }),
      prisma.patient.findMany({
        where: { userId: user.id },
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
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Control Clínico</h1>
          <p className="text-xs font-semibold text-slate-500 capitalize mt-1">{todayFormatted}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/plans/new">
            <Button variant="outline" className="flex items-center gap-2 rounded-2xl h-10 px-4 text-xs font-bold btn-tactile hover-lift">
              <CalendarPlus className="h-4 w-4 text-blue-600" />
              <span>Nuevo Plan</span>
            </Button>
          </Link>
          <Link href="/dashboard/patients/new">
            <Button className="flex items-center gap-2 shadow-xs rounded-2xl h-10 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white btn-tactile hover-lift">
              <UserPlus className="h-4 w-4" />
              <span>Nuevo Paciente</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <ScrollReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" delay={0.06}>
        {/* Card 1: Pacientes */}
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs hover-lift hover-glow-blue transition-all group bg-gradient-to-br from-white via-white to-blue-50/20 animate-slide-up stagger-1">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pacientes Activos
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-mono tabular-nums tracking-tight">{patientCount}</h3>
              <p className="text-xs text-blue-700 mt-1.5 font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span>Fichas en seguimiento</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shadow-2xs group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Planes */}
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs hover-lift hover-glow-blue transition-all group bg-gradient-to-br from-white via-white to-teal-50/20 animate-slide-up stagger-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Planes Activos
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-mono tabular-nums tracking-tight">{activePlanCount}</h3>
              <p className="text-xs text-teal-700 mt-1.5 font-semibold flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-teal-600" />
                <span>Pautas nutricionales</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs group-hover:scale-110 transition-transform">
              <CalendarDays className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Consultas */}
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs hover-lift hover-glow-blue transition-all group bg-gradient-to-br from-white via-white to-purple-50/20 animate-slide-up stagger-3">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Consultas del Mes
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-mono tabular-nums tracking-tight">{consultationCount}</h3>
              <p className="text-xs text-purple-700 mt-1.5 font-semibold flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
                <span>Revisiones clínicas</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shadow-2xs group-hover:scale-110 transition-transform">
              <ClipboardList className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Recetas */}
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs hover-lift hover-glow-blue transition-all group bg-gradient-to-br from-white via-white to-amber-50/20 animate-slide-up stagger-4">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recetas & Platos
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-mono tabular-nums tracking-tight">{recipeCount}</h3>
              <p className="text-xs text-amber-800 mt-1.5 font-semibold flex items-center gap-1.5">
                <ChefHat className="h-3.5 w-3.5 text-amber-600" />
                <span>Menús de consulta</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shadow-2xs group-hover:scale-110 transition-transform">
              <ChefHat className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Recent Patients Table */}
      <ScrollReveal delay={0.12}>
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs hover-lift bg-white overflow-hidden animate-slide-up stagger-5">
        <CardHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-slate-100 bg-slate-50/40">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Pacientes Recientes</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">Últimos expedientes clínicos atendidos</CardDescription>
          </div>
          <Link
            href="/dashboard/patients"
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
          >
            <span>Ver todos</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentPatients.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Aún no hay pacientes dados de alta</p>
              <Link href="/dashboard/patients/new" className="mt-3 inline-block">
                <Button size="sm" className="rounded-xl text-xs font-bold">Registrar Primer Paciente</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Nombre</th>
                    <th className="px-6 py-3.5">Objetivo</th>
                    <th className="px-6 py-3.5 text-center">Último Peso</th>
                    <th className="px-6 py-3.5 text-center">Estado</th>
                    <th className="px-6 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPatients.map((p) => {
                    const latest = p.anthropometries[0]
                    const objectiveLabel = OBJECTIVE_LABELS[p.objective as Objective] || p.objective

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <Link
                            href={`/dashboard/patients/${p.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline"
                          >
                            {p.lastName}, {p.firstName}
                          </Link>
                          <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                            {p.sex === 'MALE' ? 'Hombre' : 'Mujer'} • <span className="font-mono tabular-nums">{p.heightCm} cm</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="medical" className="text-2xs font-bold">
                            {objectiveLabel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center font-mono tabular-nums font-bold text-slate-900">
                          {latest ? `${latest.weightKg} kg` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.isActive ? (
                            <Badge variant="teal" className="text-2xs font-bold">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-2xs font-semibold">Inactivo</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/dashboard/patients/${p.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-50/70 rounded-xl font-bold text-xs h-8 px-3">
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
      </ScrollReveal>
    </div>
  )
}
