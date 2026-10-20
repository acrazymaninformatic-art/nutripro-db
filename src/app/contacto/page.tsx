import type { Metadata } from 'next'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { PublicShell } from '@/components/public/public-shell'
import { ContactForm } from './contact-form'
import { LEGAL_PROFILE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Contacto y cita · Consulta nutricional en Madrid · Eva Vidal Nutrición',
  description:
    'Contacta con la consulta de nutrición y dietética de Eva Vidal (Gran Vía 12, Madrid). Primera visita, seguimiento y consulta online. Respuesta en 24-48 horas laborables.',
  alternates: { canonical: '/contacto' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default function ContactoPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Contacto</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Cuéntame tu caso y te propongo plan
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Rellena el formulario o escríbeme directamente. Te respondo con honestidad si la
              nutrición clínica es la vía adecuada para tu caso y qué tipo de seguimiento necesita.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <p className="flex items-center gap-3 text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                  <MapPin className="h-4 w-4" />
                </span>
                Gran Vía 12, Madrid
              </p>
              <a
                href={`mailto:${LEGAL_PROFILE.email}`}
                className="flex items-center gap-3 text-slate-700 hover:text-blue-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                  <Mail className="h-4 w-4" />
                </span>
                {LEGAL_PROFILE.email}
              </a>
              <a
                href={`tel:${LEGAL_PROFILE.phone}`}
                className="flex items-center gap-3 text-slate-700 hover:text-blue-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                  <Phone className="h-4 w-4" />
                </span>
                {LEGAL_PROFILE.phone}
              </a>
              <p className="flex items-center gap-3 text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
                  <Clock className="h-4 w-4" />
                </span>
                Lunes a viernes de 9:00 a 19:00
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white/95 p-5 text-xs leading-6 text-slate-600">
              <p className="font-bold text-slate-900">Primera consulta presencial</p>
              <p className="mt-1">
                Incluye toma de medidas y lectura de analíticas. Si vienes con informe de otro
                profesional, tráelo: acelera mucho el plan.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-34px_rgba(15,23,42,.3)] sm:p-8">
            <h2 className="text-base font-black text-slate-900">Solicitar información</h2>
            <p className="mt-1 text-xs text-slate-500">
              Los campos marcados con * son obligatorios.
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
