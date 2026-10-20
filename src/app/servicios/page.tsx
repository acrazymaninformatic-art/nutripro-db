import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  Dumbbell,
  HeartPulse,
  Scale,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { PublicShell } from '@/components/public/public-shell'
import { LEGAL_PROFILE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Servicios de nutrición y dietética en Madrid · Eva Vidal Nutrición',
  description:
    'Consulta nutricional y dietética en Gran Vía 12, Madrid: primera valoración, plan de alimentación personalizado, seguimiento clínico y portal privado para pacientes. Presencial y online.',
  alternates: { canonical: '/servicios' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: 'Servicios de nutrición y dietética en Madrid',
    description:
      'Primera valoración, plan personalizado, seguimiento clínico y portal privado para pacientes.',
    type: 'website',
  },
}

const SERVICES = [
  {
    icon: HeartPulse,
    title: 'Primera valoración nutricional',
    description:
      'Historia clínica, anthropometría, analíticas, medicación y hábitos. Punto de partida para un plan realista y seguro.',
    duration: '60 min',
  },
  {
    icon: UtensilsCrossed,
    title: 'Plan de alimentación personalizado',
    description:
      'Menús semanales por raciones, intercambios y recetas clínicas con macros calculados para tu objetivo y tus alergias.',
    duration: 'A medida',
  },
  {
    icon: Scale,
    title: 'Seguimiento de pérdida de peso',
    description:
      'Revisiones periódicas con medidas, adherencia y ajustes finos para que el plan no se estanque en el mesón.',
    duration: 'Cada 2-4 semanas',
  },
  {
    icon: Dumbbell,
    title: 'Rendimiento deportivo',
    description:
      'Pautas de nutrición por tipo de esfuerzo, con periodización de energía, proteína y recuperación.',
    duration: 'Por bloques',
  },
  {
    icon: Activity,
    title: 'Salud metabólica',
    description:
      'Apoyo en diabetes, resistencia a la insulina, colesterol, hipertensión y salud digestiva.',
    duration: 'Por protocolo',
  },
  {
    icon: CalendarCheck,
    title: 'Acompañamiento a largo plazo',
    description:
      'Consultas de seguimiento, informes para tu médico y portal privado con tu plan siempre a mano.',
    duration: 'Continuo',
  },
]

export default function ServicesPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          Consulta de Nutrición y Dietética · Madrid
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
          Nutrición clínica que se puede mantener en el día a día
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          En {LEGAL_PROFILE.tradeName} trabajamos la alimentación como parte de tu tratamiento, con
          planes que encajan en tu vida, seguimiento real y datos clínicos que tu médico puede
          interpretar. Presencial en Gran Vía 12 (Madrid) y online por videollamada.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700"
          >
            Solicitar primera cita
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            Ver precios orientativos
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const Icon = service.icon
            return (
              <article
                key={service.title}
                className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-34px_rgba(15,23,42,.3)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-sm font-black text-slate-900">{service.title}</h2>
                <p className="mt-2 text-xs leading-6 text-slate-600">{service.description}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Sparkles className="h-3 w-3 text-blue-600" />
                  {service.duration}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-white p-8">
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            ¿Hablamos de tu caso concreto?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Cuéntanos qué te han derivado, qué objetivo tienes en mente y si hay alergias,
            intolerancias o medicación. Con esa información te decimos con honestidad si la
            nutrición clínica es la vía adecuada y cuánto tiempo Tardaría en notarse.
          </p>
          <Link
            href="/contacto"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            Escríbeme
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicShell>
  )
}
