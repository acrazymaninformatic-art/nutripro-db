'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toCents(value: FormDataEntryValue | null) {
  const numeric = Number(String(value || '').replace(',', '.'))
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('Introduce un importe válido.')
  return Math.round(numeric * 100)
}

export async function createInvoice(formData: FormData) {
  const userId = await requireUserId()
  const patientId = String(formData.get('patientId') || '') || null
  if (patientId && !await prisma.patient.findFirst({ where: { id: patientId, userId }, select: { id: true } })) throw new Error('Paciente no encontrado.')
  const description = String(formData.get('description') || '').trim().slice(0, 500)
  if (!description) throw new Error('Indica el concepto de la factura.')
  const invoice = await prisma.invoice.create({ data: { userId, patientId, number: `EV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, description, amountCents: toCents(formData.get('amount')), dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : null, notes: String(formData.get('notes') || '').trim().slice(0, 1000) || null, status: 'SENT' } })
  await prisma.auditLog.create({ data: { userId, patientId, action: 'INVOICE_CREATED', entityType: 'Invoice', entityId: invoice.id } })
  revalidatePath('/dashboard/billing')
}

export async function registerPayment(invoiceId: string, formData: FormData) {
  const userId = await requireUserId()
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId }, select: { id: true, patientId: true, amountCents: true, paidCents: true } })
  if (!invoice) throw new Error('Factura no encontrada.')
  const amountCents = toCents(formData.get('amount'))
  const paidCents = Math.min(invoice.amountCents, invoice.paidCents + amountCents)
  const status = paidCents >= invoice.amountCents ? 'PAID' : 'PARTIALLY_PAID'
  await prisma.$transaction([
    prisma.payment.create({ data: { invoiceId, amountCents, method: String(formData.get('method') || 'OTHER'), reference: String(formData.get('reference') || '').trim().slice(0, 250) || null } }),
    prisma.invoice.update({ where: { id: invoiceId }, data: { paidCents, status, paymentMethod: String(formData.get('method') || 'OTHER'), paidAt: status === 'PAID' ? new Date() : null } }),
    prisma.auditLog.create({ data: { userId, patientId: invoice.patientId, action: 'PAYMENT_REGISTERED', entityType: 'Invoice', entityId: invoiceId } }),
  ])
  revalidatePath('/dashboard/billing')
}
