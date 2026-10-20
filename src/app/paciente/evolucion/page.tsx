import Link from 'next/link'
import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Scale,
  Activity,
  ArrowLeft,
  Calendar,
  FileSpreadsheet,
  PieChart,
  Sparkles,
} from 'lucide-react'
import { EvolutionChart } from '@/app/dashboard/patients/[id]/evolution-chart'

export const dynamic = 'force-dynamic'

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function PacienteEvolucionPage() {
  const { user, patientId: authPatientId, isAdminPreview } = await requirePatient()

  let patientId = authPatientId
  if (!patientId && isAdminPreview) {
    const firstPatient = await prisma.patient.findFirst({ select: { id: true } })
    patientId = firstPatient?.id || null
  }

  const measurements = patientId
    ? await prisma.anthropometry.findMany({
        where: {
          patientId,
          isPublishedToPatient: true,
        },
        orderBy: { date: 'desc' },
      })
    : []

  const patient = patientId
    ? await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          targetWeightKg: true,
          weeklyChangeTargetKg: true,
          milestonesMessage: true,
        },
      })
    : null

  const latest = measurements[0]
  const oldest = measurements[measurements.length - 1]
  const weightChange =
    measurements.length > 1 && latest && oldest
      ? Number((latest.weightKg - oldest.weightKg).toFixed(1))
      : null

  // Cálculo de composición en kilos (PDF pág 12)
  const latestFatKg =
    latest && latest.bodyFatPct != null
      ? Number(((latest.weightKg * latest.bodyFatPct) / 100).toFixed(1))
      : null

  const latestLeanKg =
    latest && latestFatKg != null
      ? Number((latest.weightKg - latestFatKg).toFixed(1))
      : null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/paciente"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors btn-tactile"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white glass-card hover-lift p-6 sm:p-7 rounded-3xl border-slate-200/80 shadow-xs animate-slide-up">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span>Mi Evolución y Composición Corporal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Historial de registros corporales y medidas antropométricas compartidas por Eva Vidal
          </p>
        </div>
      </div>

      {/* Metric Highlight Cards */}
      {measurements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <Card className="glass-card hover-lift hover-glow-teal rounded-3xl p-4.5 border-slate-200/80 animate-slide-up stagger-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Último Peso
            </span>
            <div className="text-2xl font-mono tabular-nums font-black text-slate-900 mt-1">
              {latest.weightKg} <span className="text-xs font-semibold text-slate-500 font-sans">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {formatDate(latest.date)}
            </span>
          </Card>

          <Card className="glass-card hover-lift hover-glow-teal rounded-3xl p-4.5 border-slate-200/80 animate-slide-up stagger-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              % Grasa Corporal
            </span>
            <div className="text-2xl font-mono tabular-nums font-black text-slate-900 mt-1">
              {latest.bodyFatPct != null ? `${latest.bodyFatPct}%` : 'N/D'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Último registro
            </span>
          </Card>

          <Card className="glass-card hover-lift hover-glow-teal rounded-3xl p-4.5 border-slate-200/80 animate-slide-up stagger-3">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
              Masa Grasa (kg)
            </span>
            <div className="text-2xl font-mono tabular-nums font-black text-amber-950 mt-1">
              {latestFatKg != null ? `${latestFatKg} kg` : 'N/D'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Grasa calculada
            </span>
          </Card>

          <Card className="glass-card hover-lift hover-glow-teal rounded-3xl p-4.5 border-slate-200/80 animate-slide-up stagger-4">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">
              Masa Magra (kg)
            </span>
            <div className="text-2xl font-mono tabular-nums font-black text-blue-950 mt-1">
              {latestLeanKg != null ? `${latestLeanKg} kg` : 'N/D'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Músculo + Hueso
            </span>
          </Card>

          <Card className="glass-card hover-lift hover-glow-teal rounded-3xl p-4.5 border-slate-200/80 animate-slide-up stagger-5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Variación Total
            </span>
            <div className="text-2xl font-mono tabular-nums font-black text-slate-900 mt-1">
              {weightChange !== null ? (
                <span className={weightChange <= 0 ? 'text-blue-600' : 'text-blue-600'}>
                  {weightChange > 0 ? `+${weightChange}` : weightChange} kg
                </span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {measurements.length > 1 ? `En ${measurements.length} sesiones` : 'Primer pesaje'}
            </span>
          </Card>
        </div>
      )}

      {/* Cartel de Felicitación / Mensaje de Hito Personalizado (5.2) */}
      {patient?.milestonesMessage && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 text-amber-950 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-amber-200 text-amber-900 rounded-2xl shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-xs uppercase tracking-wide text-amber-900">Mensaje de Eva Vidal</p>
            <p className="text-xs text-amber-950 font-medium mt-0.5">{patient.milestonesMessage}</p>
          </div>
        </div>
      )}

      {/* Gráfica de Evolución y Composición en Kilos Interactiva (5.2) */}
      {measurements.length > 0 && (
        <EvolutionChart
          measurements={measurements}
          targetWeightKg={patient?.targetWeightKg}
          weeklyChangeTargetKg={patient?.weeklyChangeTargetKg}
        />
      )}

      {/* Main Table or Empty State */}
      {measurements.length === 0 ? (
        <Card className="text-center py-16 px-6 border-dashed border-2 border-gray-300 rounded-3xl bg-white shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Aún no hay mediciones registradas</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Las medidas de composición corporal (peso, masa grasa, masa magra y perímetros)
            se registrarán durante tus consultas de seguimiento con Eva Vidal.
          </p>
          <div className="mt-6">
            <Link href="/paciente">
              <Button variant="outline" size="sm" className="rounded-2xl">
                Volver a Inicio
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-gray-200 rounded-3xl shadow-xs bg-white">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-5">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Historial Antropométrico y Composición en Kilos</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Datos registrados cronológicamente en orden descendente
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th scope="col" className="px-5 py-3">Fecha</th>
                    <th scope="col" className="px-5 py-3">Peso</th>
                    <th scope="col" className="px-5 py-3">% Grasa</th>
                    <th scope="col" className="px-5 py-3 text-amber-900">Grasa (kg)</th>
                    <th scope="col" className="px-5 py-3 text-blue-900">Magra (kg)</th>
                    <th scope="col" className="px-5 py-3">Masa Muscular</th>
                    <th scope="col" className="px-5 py-3">Cintura</th>
                    <th scope="col" className="px-5 py-3">Cadera</th>
                    <th scope="col" className="px-5 py-3">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {measurements.map((m) => {
                    const fatKg =
                      m.bodyFatPct != null
                        ? Number(((m.weightKg * m.bodyFatPct) / 100).toFixed(1))
                        : null
                    const leanKg =
                      fatKg != null ? Number((m.weightKg - fatKg).toFixed(1)) : null

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                          {formatDate(m.date)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-blue-900 whitespace-nowrap">
                          {m.weightKg} kg
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                          {m.bodyFatPct != null ? `${m.bodyFatPct}%` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-amber-900 font-semibold whitespace-nowrap">
                          {fatKg != null ? `${fatKg} kg` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-blue-900 font-semibold whitespace-nowrap">
                          {leanKg != null ? `${leanKg} kg` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                          {m.muscleMassKg != null ? `${m.muscleMassKg} kg` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                          {m.waistCm != null ? `${m.waistCm} cm` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                          {m.hipCm != null ? `${m.hipCm} cm` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 max-w-xs text-[11px] truncate" title={m.notes || ''}>
                          {m.notes || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
