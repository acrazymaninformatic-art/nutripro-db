import type { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Iniciar sesión · EVSoftware · Eva Vidal Nutrición', robots: { index: false, follow: false } }

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl border border-slate-200 object-contain p-1" />
          <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">EVSoftware</p><h1 className="text-2xl font-bold text-slate-900">Acceso a la plataforma</h1></div>
        </div>
        <p className="text-sm text-slate-600">Inicia sesión para acceder a tu área de consulta o portal del paciente.</p>
        <LoginForm />
      </section>
    </main>
  )
}
