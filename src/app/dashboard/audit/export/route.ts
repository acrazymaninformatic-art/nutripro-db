import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/auth'
import { buildAuditWhere, parseAuditFilters, toCsvValue } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = await requireUserId()
  const url = new URL(request.url)
  const params: Record<string, string | string[] | undefined> = {}

  url.searchParams.forEach((value, key) => {
    params[key] = value
  })

  const filters = parseAuditFilters(params)
  const where = buildAuditWhere(userId, filters)

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5000,
    include: {
      patient: { select: { firstName: true, lastName: true } },
      user: { select: { name: true, email: true } },
    },
  })

  const header = [
    'Fecha y hora',
    'Acción',
    'Entidad',
    'Entidad ID',
    'Paciente',
    'Registrado por',
    'Detalle',
  ]

  const rows = entries.map((entry) => [
    new Date(entry.createdAt).toISOString(),
    entry.action,
    entry.entityType,
    entry.entityId || '',
    entry.patient ? `${entry.patient.firstName} ${entry.patient.lastName}` : '',
    entry.user?.name || entry.user?.email || '',
    entry.details || '',
  ])

  const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(';')).join('\r\n')

  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="auditoria-evsoftware-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
