import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Mail, Phone } from 'lucide-react'
import {
  LEGAL_POLICY_VERSION,
  LEGAL_PROFILE,
  LEGAL_PROFILE_MISSING_FIELDS,
} from '@/lib/legal'

export function LegalDocument({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 sm:px-6">
      <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver al acceso
          </Link>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Versión {LEGAL_POLICY_VERSION}
          </span>
        </div>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{summary}</p>

        {LEGAL_PROFILE_MISSING_FIELDS.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold">Documento pendiente de completar antes de su publicación definitiva</p>
              <p className="mt-1 leading-6">
                Faltan: {LEGAL_PROFILE_MISSING_FIELDS.join(', ')}. Este aviso es transparente y no sustituye la revisión jurídica ni permite afirmar que la aplicación esté legalizada al 100 %.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">{children}</div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <p className="font-bold text-slate-800">{LEGAL_PROFILE.tradeName}</p>
          <p className="mt-1">{LEGAL_PROFILE.legalName}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            <a className="inline-flex items-center gap-1.5 text-blue-700 underline" href={`mailto:${LEGAL_PROFILE.email}`}>
              <Mail className="h-3.5 w-3.5" /> {LEGAL_PROFILE.email}
            </a>
            <a className="inline-flex items-center gap-1.5 text-blue-700 underline" href={`tel:${LEGAL_PROFILE.phone}`}>
              <Phone className="h-3.5 w-3.5" /> {LEGAL_PROFILE.phone}
            </a>
          </div>
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-semibold">
            <Link className="text-blue-700 hover:underline" href="/legal">Aviso legal</Link>
            <Link className="text-blue-700 hover:underline" href="/privacy-policy">Privacidad</Link>
            <Link className="text-blue-700 hover:underline" href="/terms">Condiciones</Link>
            <Link className="text-blue-700 hover:underline" href="/cookies">Cookies</Link>
          </nav>
        </footer>
      </article>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  )
}
