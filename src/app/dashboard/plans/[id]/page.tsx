import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMealPlan } from '../actions'
import { PlanViewer } from './plan-viewer'
import { DeletePlanButton } from './delete-plan-button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { getOrCreateMenuConfig, listPatientsForMenu } from './menu-actions'

export const dynamic = 'force-dynamic'

interface MealPlanDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MealPlanDetailPage({ params }: MealPlanDetailPageProps) {
  const { id } = await params
  const plan = await getMealPlan(id)

  if (!plan) {
    notFound()
  }

  const [menu, patients] = await Promise.all([
    getOrCreateMenuConfig(id),
    listPatientsForMenu(),
  ])

  return (
    <div className="space-y-5 max-w-6xl mx-auto print:max-w-none print:w-full print:m-0 print:p-0">
      {/* Top bar (Solo web) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-2xs hover:border-gray-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a Planes</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <Badge variant={plan.isActive ? 'default' : 'secondary'} className="text-xs rounded-full px-3 py-0.5 font-bold">
            {plan.isActive ? 'Pauta Activa' : 'Inactivo'}
          </Badge>
          <DeletePlanButton planId={plan.id} planName={plan.name} />
        </div>
      </div>

      {/* Plan Viewer & Editorial Dossier */}
      <PlanViewer plan={plan} menu={menu} patients={patients} />
    </div>
  )
}
