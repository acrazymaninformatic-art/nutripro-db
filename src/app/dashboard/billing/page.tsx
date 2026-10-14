import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BillingClient } from './billing-client'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const userId = await requireUserId()
  const [patients, invoices] = await Promise.all([
    prisma.patient.findMany({ where: { userId, isActive: true }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: 'asc' } }),
    prisma.invoice.findMany({ where: { userId }, include: { patient: { select: { id: true, firstName: true, lastName: true } }, payments: true }, orderBy: { issuedAt: 'desc' } }),
  ])
  return <BillingClient patients={patients} invoices={invoices} />
}
