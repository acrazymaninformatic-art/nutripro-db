'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePatient, restorePatient } from '../actions'
import { Button } from '@/components/ui/button'
import { Trash2, RotateCcw, Loader2 } from 'lucide-react'

export function DeletePatientButton({
  patientId,
  patientName,
  isActive = true,
}: {
  patientId: string
  patientName: string
  isActive?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (isActive) {
      const confirmed = window.confirm(
        `¿Mover la ficha de ${patientName} a la papelera? Podrás recuperarla en cualquier momento.`
      )
      if (!confirmed) return

      setLoading(true)
      try {
        await deletePatient(patientId)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert('Error al mover paciente a la papelera')
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        await restorePatient(patientId)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert('Error al restaurar paciente')
      } finally {
        setLoading(false)
      }
    }
  }

  if (!isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold rounded-2xl"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        <span>Restaurar de Papelera</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-1.5 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-2xl"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-amber-600" />}
      <span>Mover a Papelera</span>
    </Button>
  )
}

