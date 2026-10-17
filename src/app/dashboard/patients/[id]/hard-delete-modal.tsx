'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { hardDeletePatient } from '../actions'
import { useRouter } from 'next/navigation'

interface Props {
  patientId: string
  patientName: string
  iconOnly?: boolean
}

export function HardDeleteModal({ patientId, patientName, iconOnly = false }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const router = useRouter()

  const isConfirmed = confirmText.trim().toUpperCase() === 'ELIMINAR'

  const handleDelete = async () => {
    if (!isConfirmed) return
    setLoading(true)
    try {
      await hardDeletePatient(patientId)
      router.push('/dashboard/patients')
    } catch (e: any) {
      alert(e.message || 'Error al eliminar el paciente.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            iconOnly
              ? 'w-9 h-9 p-0 rounded-xl border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold shadow-2xs flex items-center justify-center transition-all active:scale-[0.96] shrink-0'
              : 'flex items-center gap-1.5 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold'
          }
          title="Eliminar Paciente por Completo (Derecho al Olvido RGPD)"
          aria-label="Eliminar Paciente por Completo"
        >
          <Trash2 className="h-4 w-4 text-rose-600" />
          {!iconOnly && <span>Eliminar Paciente por Completo</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-red-200 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-red-950">
                Eliminación Definitiva (Derecho al Olvido)
              </DialogTitle>
              <DialogDescription className="text-xs text-red-800/80">
                Esta acción es completamente irreversible.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs text-gray-700">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-1.5 text-red-900">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Se borrarán permanentemente:
            </p>
            <ul className="list-disc list-inside text-2xs space-y-0.5 text-red-800 ml-1">
              <li>El expediente completo de <strong>{patientName}</strong></li>
              <li>Todos sus planes de alimentación y recetas guardadas</li>
              <li>Historial antropométrico, pesos y analíticas sanguíneas</li>
              <li>Citas pasadas, cuestionarios pre-consulta y consentimientos</li>
              <li>Cuenta de acceso al portal web de paciente</li>
            </ul>
          </div>

          <p className="leading-relaxed">
            Se registrará una entrada en la auditoría RGPD indicando la fecha y profesional responsable de la supresión.
          </p>

          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Escribe la palabra <strong>ELIMINAR</strong> para desbloquear la confirmación:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full text-xs px-3 py-2 rounded-xl border border-red-300 bg-white font-mono focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs text-gray-500"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!isConfirmed || loading}
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            {loading ? 'Eliminando definitivamente...' : 'Confirmar Supresión Total'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
