import Link from 'next/link'
import { CalendarClock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { LEGAL_PROFILE } from '@/lib/legal'

const NAV = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/precios', label: 'Precios' },
  { href: '/contacto', label: 'Contacto' },
  { href: '/login', label: 'Acceso clientes' },
]

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ambient-eva text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/servicios" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
              <img src="/logo.png" alt="Eva Vidal Nutrición" className="h-7 w-7 object-contain" />
            </span>
            <span>
              <span className="block text-sm font-black leading-tight text-slate-900">
                {LEGAL_PROFILE.tradeName}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Nutrición clínica · Madrid
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-xs font-bold">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-2.5 py-2 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 sm:px-3"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-slate-200/80 bg-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-black text-slate-900">{LEGAL_PROFILE.tradeName}</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">
              Consulta de nutrición y dietética con planes personalizados, seguimiento clínico y
              portal privado para pacientes.
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-black uppercase tracking-wider text-slate-400">Contacto</p>
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-blue-600" /> Gran Vía 12, Madrid
            </p>
            <a href={`mailto:${LEGAL_PROFILE.email}`} className="flex items-center gap-2 hover:text-blue-700">
              <Mail className="h-3.5 w-3.5 text-blue-600" /> {LEGAL_PROFILE.email}
            </a>
            <a href={`tel:${LEGAL_PROFILE.phone}`} className="flex items-center gap-2 hover:text-blue-700">
              <Phone className="h-3.5 w-3.5 text-blue-600" /> {LEGAL_PROFILE.phone}
            </a>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-black uppercase tracking-wider text-slate-400">Legal</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/legal" className="hover:text-blue-700">
                Aviso legal
              </Link>
              <Link href="/privacy-policy" className="hover:text-blue-700">
                Privacidad y protección de datos
              </Link>
              <Link href="/terms" className="hover:text-blue-700">
                Condiciones de uso
              </Link>
              <Link href="/cookies" className="hover:text-blue-700">
                Política de cookies
              </Link>
            </div>
            <p className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Datos de salud tratados conforme al
              RGPD.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-4 text-center text-[11px] text-slate-400 sm:px-6">
          © {new Date().getFullYear()} {LEGAL_PROFILE.tradeName} · Todos los derechos reservados ·
          <span className="ml-1 inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> Consultas presenciales y online (Google Meet)
          </span>
        </div>
      </footer>
    </div>
  )
}
