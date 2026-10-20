'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'
import { duplicateMealPlan } from './actions'

export function DuplicatePlanButton({ planId }: { planId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      title="Duplicar pauta (crea una copia editable)"
      aria-label="Duplicar pauta"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await duplicateMealPlan(planId)
            router.refresh()
          } catch {
            // El error se muestra en el centro de notificaciones global.
          }
        })
      }
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.95] disabled:opacity-60"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}
