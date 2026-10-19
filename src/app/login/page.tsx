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
    <main className="min-h-screen bg-ambient-eva flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-[#1C2B4A] bg-[#0F1A30]/92 p-7 shadow-2xl glass-card-premium sm:p-10 animate-slide-up">
        {/* Brand badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-300 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          <span>Acceso Seguro · EVSoftware</span>
        </div>

        <div className="mb-7 flex items-center gap-3.5">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-[#1C2B4A] bg-[#13213B] p-2 shadow-xs">
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
            <h1 className="text-2xl font-black tracking-tight text-[#E6EEFF]">Iniciar Sesión</h1>
            <p className="mt-0.5 text-xs font-semibold text-[#8FA3C7]">Eva Vidal Nutrición Clínica</p>
          </div>
        </div>

        <p className="mb-6 rounded-2xl border border-blue-300/15 bg-blue-500/8 p-3.5 text-xs font-medium leading-relaxed text-[#8FA3C7]">
          Introduce tus credenciales para acceder a tu consulta clínica profesional o a tu portal personal de paciente.
        </p>

        <LoginForm />

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#1C2B4A] pt-5 text-[11px] font-medium text-[#647A9F]">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Conexión cifrada RGPD · Datos de salud protegidos</span>
        </div>
      </section>
    </main>
  )
}
