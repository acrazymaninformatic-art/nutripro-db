import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth'
import {
  auditActionLabel,
  auditEntityLabel,
  buildAuditWhere,
  parseAuditFilters,
} from '@/lib/audit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  Download,
  Filter,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 40

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const userId = await requireUserId()
  const params = (await searchParams) || {}
  const filters = parseAuditFilters(params)

  const where = buildAuditWhere(userId, filters)

  const [total, entries, entityTypes, actions] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { OR: [{ userId }, { patient: { userId } }] },
      distinct: ['entityType'],
      select: { entityType: true },
      orderBy: { entityType: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { OR: [{ userId }, { patient: { userId } }] },
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const buildUrl = (page: number) => {
    const search = new URLSearchParams()
    if (filters.q) search.set('q', filters.q)
    if (filters.entity) search.set('entity', filters.entity)
    if (filters.action) search.set('action', filters.action)
    if (filters.from) search.set('from', filters.from)
    if (filters.to) search.set('to', filters.to)
    if (page > 1) search.set('page', String(page))
    const query = search.toString()
    return query ? `/dashboard/audit?${query}` : '/dashboard/audit'
  }

  const exportQuery = new URLSearchParams()
  if (filters.q) exportQuery.set('q', filters.q)
  if (filters.entity) exportQuery.set('entity', filters.entity)
  if (filters.action) exportQuery.set('action', filters.action)
  if (filters.from) exportQuery.set('from', filters.from)
  if (filters.to) exportQuery.set('to', filters.to)

  const hasFilters = Boolean(
    filters.q || filters.entity || filters.action || filters.from || filters.to
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Auditoría de actividad</h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Registro inalterable de las acciones realizadas sobre datos clínicos y de Facturación.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-xl text-xs font-bold border-slate-200 text-slate-700"
            >
              <Link href={`/dashboard/audit/export${exportQuery.toString() ? `?${exportQuery.toString()}` : ''}`}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Exportar CSV
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            Filtros
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Ajusta la búsqueda y exporta el resultado con los mismos filtros.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Buscar
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Acción, detalle o paciente"
                  className="h-9 rounded-xl pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Entidad
              </label>
              <select
                name="entity"
                defaultValue={filters.entity}
                className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3 text-xs font-medium"
              >
                <option value="">Todas</option>
                {entityTypes.map((item) => (
                  <option key={item.entityType} value={item.entityType}>
                    {auditEntityLabel(item.entityType)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Acción
              </label>
              <select
                name="action"
                defaultValue={filters.action}
                className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3 text-xs font-medium"
              >
                <option value="">Todas</option>
                {actions.map((item) => (
                  <option key={item.action} value={item.action}>
                    {auditActionLabel(item.action)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Desde
                </label>
                <Input
                  type="date"
                  name="from"
                  defaultValue={filters.from}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hasta
                </label>
                <Input
                  type="date"
                  name="to"
                  defaultValue={filters.to}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-5">
              <Button type="submit" className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Aplicar filtros
              </Button>
              {hasFilters && (
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-xl text-xs font-bold text-slate-500"
                >
                  <Link href="/dashboard/audit">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Limpiar
                  </Link>
                </Button>
              )}
              <span className="ml-auto text-[11px] font-semibold text-slate-500">
                {total} {total === 1 ? 'registro' : 'registros'}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Registro
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <History className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No hay registros con estos filtros</p>
              <p className="mt-1 text-xs text-slate-500">
                Prueba a ampliar el rango de fechas o a limpiar la búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-xs text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Fecha y hora</th>
                    <th className="px-5 py-3">Acción</th>
                    <th className="px-5 py-3">Entidad</th>
                    <th className="px-5 py-3">Paciente</th>
                    <th className="px-5 py-3">Registrado por</th>
                    <th className="px-5 py-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="align-top hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-500">
                        {new Date(entry.createdAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-800">
                          {auditActionLabel(entry.action)}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-slate-400">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {auditEntityLabel(entry.entityType)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {entry.patient ? (
                          <Link
                            href={`/dashboard/patients/${entry.patient.id}`}
                            className="font-semibold text-blue-700 hover:underline"
                          >
                            {entry.patient.firstName} {entry.patient.lastName}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[11px] text-slate-500">
                        {entry.user?.name || entry.user?.email || '—'}
                      </td>
                      <td className="px-5 py-3 text-[11px] leading-relaxed text-slate-500">
                        {entry.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <span className="text-[11px] font-semibold text-slate-500">
                Página {filters.page} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                {filters.page > 1 && (
                  <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold">
                    <Link href={buildUrl(filters.page - 1)}>
                      <ArrowRight className="mr-1.5 h-3.5 w-3.5 rotate-180" />
                      Anterior
                    </Link>
                  </Button>
                )}
                {filters.page < totalPages && (
                  <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold">
                    <Link href={buildUrl(filters.page + 1)}>
                      Siguiente
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
