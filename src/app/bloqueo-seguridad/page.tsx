import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert, PhoneCall, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mantenimiento de Seguridad · Eva Vidal Nutrición',
  robots: { index: false, follow: false, noarchive: true },
}

export default function LockdownPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-8 text-center shadow-2xl text-white">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-2">
          Aislamiento Preventivo de Seguridad
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          El portal de pacientes se encuentra temporalmente restringido por protocolo preventivo de seguridad técnica y protección de datos.
        </p>

        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50 text-xs text-slate-300 space-y-2 mb-6 text-left">
          <p className="font-semibold text-slate-200">¿Tienes una cita o necesitas consultar tu pauta?</p>
          <p>
            Puedes comunicarte directamente con tu nutricionista para cualquier urgencia dietética o consulta inmediata:
          </p>
          <div className="pt-2 flex items-center gap-2 text-blue-400 font-medium">
            <Mail className="w-4 h-4" />
            <a href="mailto:info@evavidalnutricion.com" className="hover:underline">info@evavidalnutricion.com</a>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-block text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Acceso profesional
        </Link>
      </div>
    </main>
  )
}
