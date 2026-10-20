import type { Metadata } from 'next'
import Image from 'next/image'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = { title: 'Recuperar acceso · EVSoftware · Eva Vidal Nutrición', robots: { index: false, follow: false, noarchive: true } }

export default function ForgotPasswordPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ambient-eva px-4 py-12"
      data-gsap-page
    >
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
      <section className="relative z-10 w-full max-w-md animate-slide-up rounded-[2rem] border border-white/80 bg-white/92 p-7 shadow-2xl backdrop-blur-md sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs">
            <Image src="/logo.png" alt="Eva Vidal Nutrición" width={48} height={48} className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">EVSoftware</p>
            <h1 className="text-2xl font-bold text-slate-900">Recuperar acceso</h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600">Te enviaremos un enlace de un solo uso que caduca en 30 minutos.</p>
        <ForgotPasswordForm />
      </section>
    </main>
  )
}
