import type { Metadata } from 'next'
import Image from 'next/image'
import { hashSecureLinkToken } from '@/lib/secure-link-token'
import { prisma } from '@/lib/prisma'
import { RescheduleForm } from './reschedule-form'

export const metadata: Metadata = { title: 'Reprogramar cita · Eva Vidal Nutrición', robots: { index: false, follow: false, noarchive: true } }

export default async function ReschedulePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams
  const appointment = token ? await prisma.appointment.findFirst({ where: { rescheduleTokenHash: hashSecureLinkToken(token), rescheduleTokenExpiresAt: { gt: new Date() }, status: 'CONFIRMED', date: { gt: new Date() } }, select: { date: true, durationMin: true, modality: true } }) : null
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mb-6 flex items-center gap-3"><Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl border border-slate-200 object-contain p-1" /><div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">EVSoftware</p><h1 className="text-2xl font-bold text-slate-900">Reprogramar cita</h1></div></div>{appointment ? <><p className="text-sm leading-6 text-slate-600">Tu cita actual es el <strong>{appointment.date.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</strong>. Selecciona otra franja y comprobaremos la disponibilidad.</p><RescheduleForm token={token} durationMin={appointment.durationMin} /></> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">El enlace no es válido o ha caducado. Contacta con la consulta para que pueda enviarte uno nuevo.</p>}</section></main>
}
