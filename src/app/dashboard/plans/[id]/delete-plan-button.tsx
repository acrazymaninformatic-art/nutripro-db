'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMealPlan } from '../actions'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function DeletePlanButton({ planId, planName }: { planId: string; planName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(`¿Deseas mover el plan "${planName}" a la papelera / archivo? Podrás recuperarlo en cualquier momento.`)
    if (!confirmed) return

    setLoading(true)
    try {
      await deleteMealPlan(planId)
      router.push('/dashboard/plans')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al mover el plan a la papelera')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span>Mover a Papelera</span>
    </Button>
  )
}
