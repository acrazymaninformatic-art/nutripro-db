import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Info, Sparkles } from 'lucide-react'
import { PublicShell } from '@/components/public/public-shell'
import { LEGAL_PROFILE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Precios orientativos de consulta nutricional en Madrid · Eva Vidal Nutrición',
  description:
    'Precios orientativos de la consulta nutricional y dietética en Madrid: primera valoración, revisión de seguimiento, consulta online y programas de acompañamiento.',
  alternates: { canonical: '/precios' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

const SESSIONS = [
  {
    name: 'Primera valoración nutricional',
    price: '95 €',
    duration: '60 min',
    includes: [
      'Historia clínica completa (antecedentes, medicación, alérgenos)',
      'Antropometría y lectura de analíticas',
      'Diagnóstico nutricional y plan de acción',
      'Dossier del plan en PDF para el paciente',
    ],
    featured: true,
  },
  {
    name: 'Revisión de seguimiento',
    price: '55 €',
    duration: '30 min',
    includes: [
      'Peso, perímetro y adherencia',
      'Revisión de la agenda de comidas',
      'Ajustes finos de la pauta',
    ],
    featured: false,
  },
  {
    name: 'Consulta online (Google Meet)',
    price: '70 €',
    duration: '45 min',
    includes: [
      'Revisión de síntomas y digestión',
      'Ajustes de menús y recetas',
      'Soporte por mensaje durante 15 días',
    ],
    featured: false,
  },
  {
    name: 'Programa de 3 meses',
    price: '290 €',
    duration: '3 meses',
    includes: [
      'Valoración inicial + 5 revisiones',
      'Plan personalizado y recetario clínico',
      'Informe de evolución para tu médico',
    ],
    featured: false,
  },
]

export default function PreciosPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Precios orientativos</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
          Cuánto cuesta una consulta nutricional con informe para tu médico
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Estos importes son orientativos y pueden variar según la complejidad del caso, la
          duración de la consulta y si necesitas derivación con otros profesionales. Siempre te
          confirmamos el precio antes de empezar.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {SESSIONS.map((session) => (
            <article
              key={session.name}
              className={`rounded-3xl border p-6 transition-transform duration-300 hover:-translate-y-1 ${
                session.featured
                  ? 'border-blue-300 bg-gradient-to-br from-blue-50/80 via-white to-white shadow-[0_18px_50px_-34px_rgba(37,99,235,.45)]'
                  : 'border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-34px_rgba(15,23,42,.3)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-black text-slate-900">{session.name}</h2>
                {session.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" /> Más solicitado
                  </span>
                ) : null}
              </div>

              <p className="mt-3 font-mono text-3xl font-black tracking-tight text-slate-900">
                {session.price}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {session.duration} · IVA incluido
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                {session.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-xs leading-6 text-amber-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            Son importes orientativos de la consulta, y no constituyen una oferta vinculante. Si tu
            caso requiere un plan largo o coordinación con otros especialistas, lo valoramos antes
            de la primera cita. Consultas con justificación para la administración pública pueden
            ser bonificadas: consúltame.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <h2 className="text-lg font-black tracking-tight text-slate-900">
            ¿Prefieres que te lo cuente por teléfono?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
            Escríbeme a{' '}
            <a href={`mailto:${LEGAL_PROFILE.email}`} className="font-bold text-blue-700 underline">
              {LEGAL_PROFILE.email}
            </a>{' '}
            o llámame al {LEGAL_PROFILE.phone} y te explico qué opción encaja contigo.
          </p>
          <Link
            href="/contacto"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            Solicitar cita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicShell>
  )
}
