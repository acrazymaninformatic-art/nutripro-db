'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePatient } from '../actions'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function DeletePatientButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la ficha de ${patientName}? Esta acción borrará todas sus mediciones y dietas asociadas.`
    )
    if (!confirmed) return

    setLoading(true)
    try {
      await deletePatient(patientId)
      router.push('/dashboard/patients')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al eliminar paciente')
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
      <span>Eliminar Paciente</span>
    </Button>
  )
}
