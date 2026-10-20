'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
    >
      <Printer className="mr-1.5 h-4 w-4" />
      Imprimir / Guardar PDF
    </Button>
  )
}
