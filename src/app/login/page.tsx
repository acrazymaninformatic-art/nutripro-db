import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSessionUser, ADMIN_EMAIL } from '@/lib/auth'
import { LoginForm } from './login-form'
import { Sparkles, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Iniciar sesión · EVSoftware · Eva Vidal Nutrición',
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  const user = await getSessionUser()
  if (user) {
    if (user.role === 'ADMIN' && user.email.toLowerCase() === ADMIN_EMAIL) {
      redirect('/dashboard')
    }
    if (user.role === 'PATIENT') {
      redirect('/paciente')
    }
  }

  return (
    <main
      className="min-h-screen bg-ambient-eva flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      data-gsap-page
    >
      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-md glass-card-premium rounded-[2rem] p-7 sm:p-10 shadow-2xl border border-white/80 relative z-10 animate-slide-up">
        {/* Brand badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Acceso Seguro · EVSoftware</span>
        </div>

        <div className="mb-7 flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200/80 p-2 shadow-xs shrink-0 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Eva Vidal Nutrición"
              width={48}
              height={48}
              className="h-10 w-10 object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Eva Vidal Nutrición Clínica</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-gradient-to-br from-slate-50/90 to-blue-50/40 p-3.5 rounded-2xl border border-slate-200/60 mb-6">
          Introduce tus credenciales para acceder a tu consulta clínica profesional o a tu portal personal de paciente.
        </p>

        <LoginForm />

        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Conexión cifrada RGPD · Datos de salud protegidos</span>
        </div>
      </section>
    </main>
  )
}
