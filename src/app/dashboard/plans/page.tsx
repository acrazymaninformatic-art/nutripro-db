import Link from 'next/link'
import { getMealPlans } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Plus, User, Flame, Calendar, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MealPlansPage() {
  const plans = await getMealPlans()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes Nutricionales</h1>
          <p className="text-sm text-gray-500">
            Pautas dietéticas semanales y quincenales personalizadas por paciente.
          </p>
        </div>
        <Link href="/dashboard/plans/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Crear Plan</span>
          </Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No hay planes nutricionales activos</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Crea una pauta semanal para tus pacientes con ajuste automático de macros y recetas clínicas calculadas.
            </p>
            <Link href="/dashboard/plans/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col hover:shadow-lg transition-all rounded-3xl border-gray-200 overflow-hidden hover:border-blue-300">
              <CardHeader className="pb-3 bg-gradient-to-br from-white to-gray-50/50">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={plan.isActive ? 'default' : 'secondary'} className="text-xs rounded-full px-3 py-0.5 font-bold">
                    {plan.isActive ? 'Pauta Activa' : 'Finalizado'}
                  </Badge>
                  <span className="text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-blue-600" />
                    {plan.targetKcal} kcal
                  </span>
                </div>
                <CardTitle className="text-lg mt-2.5 text-gray-900 line-clamp-1 font-bold">
                  {plan.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    Paciente: <strong>{plan.patient.firstName} {plan.patient.lastName}</strong>
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 p-5">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Inicio: {new Date(plan.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{plan.days.length} días</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-100">
                  <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Prot</span>
                    <span className="text-xs font-black text-blue-900">{plan.targetProteinG}g</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Carb</span>
                    <span className="text-xs font-black text-amber-900">{plan.targetCarbsG}g</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Grasa</span>
                    <span className="text-xs font-black text-rose-900">{plan.targetFatG}g</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t bg-gray-50/70 p-4">
                <Link href={`/dashboard/plans/${plan.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5 rounded-2xl font-bold border-gray-200 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300">
                    <span>Ver Dossier, Recetas & Compra</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
