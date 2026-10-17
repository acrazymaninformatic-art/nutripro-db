'use client'

import { useState, useTransition } from 'react'
import { CreditCard, Plus, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createInvoice, registerPayment } from './actions'

type Patient = { id: string; firstName: string; lastName: string }
type Invoice = { id: string; number: string; description: string; amountCents: number; paidCents: number; status: string; dueDate: Date | string | null; issuedAt: Date | string; patient: Patient | null; payments: Array<{ id: string; amountCents: number; method: string; paidAt: Date | string }> }
const money = (cents: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export function BillingClient({ patients, invoices }: { patients: Patient[]; invoices: Invoice[] }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState<string | null>(null)
  const submitInvoice = (form: HTMLFormElement) => startTransition(async () => { try { await createInvoice(new FormData(form)); form.reset(); setOpen(false); setMessage('Factura creada y marcada como enviada.') } catch (error: any) { setMessage(error?.message || 'No se pudo crear la factura.') } })
  const pay = (invoiceId: string, form: HTMLFormElement) => startTransition(async () => { try { await registerPayment(invoiceId, new FormData(form)); form.reset(); setMessage('Pago registrado.') } catch (error: any) { setMessage(error?.message || 'No se pudo registrar el pago.') } })
  const outstanding = invoices.reduce((sum, i) => sum + Math.max(i.amountCents - i.paidCents, 0), 0)
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black text-slate-900 tracking-tight">
            <ReceiptText className="h-6 w-6 text-blue-600" />
            <span>Facturación & Cobros</span>
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Control de consultas, bonos y cobros sin exponer datos de salud a pasarelas externas.
          </p>
        </div>
        <Button
          onClick={() => setOpen(!open)}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 shadow-xs active:scale-[0.98] shrink-0"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva factura o presupuesto
        </Button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs p-5">
          <CardContent className="p-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pendiente de cobro</p>
            <p className="mt-1.5 text-2xl font-black text-amber-700 font-mono tabular-nums">{money(outstanding)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs p-5">
          <CardContent className="p-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Facturas registradas</p>
            <p className="mt-1.5 text-2xl font-black text-slate-900 font-mono tabular-nums">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs p-5">
          <CardContent className="p-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cobros completados</p>
            <p className="mt-1.5 text-2xl font-black text-emerald-700 font-mono tabular-nums">
              {invoices.filter((i) => i.status === 'PAID').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {open && (
        <Card className="rounded-3xl border-blue-200 bg-white shadow-md overflow-hidden">
          <CardHeader className="bg-blue-50/50 p-6 pb-4 border-b border-blue-100">
            <CardTitle className="text-base font-bold text-slate-900">Nueva factura / presupuesto</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Registra el importe y después anota el cobro por Bizum, Stripe, transferencia, tarjeta o efectivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                submitInvoice(event.currentTarget)
              }}
              className="grid gap-3.5 sm:grid-cols-2"
            >
              <select name="patientId" className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium bg-white">
                <option value="">Sin paciente asignado (presupuesto)</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <Input name="description" required placeholder="Ej. Bono de 4 consultas" className="rounded-xl text-xs" />
              <Input name="amount" type="number" min="0.01" step="0.01" required placeholder="Importe (€)" className="rounded-xl text-xs" />
              <Input name="dueDate" type="date" className="rounded-xl text-xs" />
              <Input name="notes" placeholder="Notas internas" className="rounded-xl text-xs sm:col-span-2" />
              <div className="flex gap-2 sm:col-span-2 pt-2">
                <Button disabled={pending} type="submit" className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white">
                  Guardar
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-medium">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {message && (
        <p role="status" className="rounded-2xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-900 font-medium">
          {message}
        </p>
      )}

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all">
            <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 font-bold">{invoice.number}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${
                      invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <p className="mt-1 font-bold text-slate-900 text-sm">{invoice.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : 'Presupuesto general'} ·{' '}
                  {invoice.dueDate ? `vence ${new Date(invoice.dueDate).toLocaleDateString('es-ES')}` : 'sin vencimiento'}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-lg font-black text-slate-900 font-mono tabular-nums">{money(invoice.amountCents)}</p>
                <p className="text-xs text-slate-500 font-mono tabular-nums">Cobrado: {money(invoice.paidCents)}</p>
              </div>
              {invoice.paidCents < invoice.amountCents && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    pay(invoice.id, event.currentTarget)
                  }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Input name="amount" type="number" min="0.01" step="0.01" required placeholder="Pago €" className="h-9 w-24 text-xs rounded-xl" />
                  <select name="method" className="h-9 rounded-xl border border-slate-200 px-2 text-xs bg-white font-medium">
                    <option value="BIZUM">Bizum</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="CASH">Efectivo</option>
                  </select>
                  <Input name="reference" className="h-9 w-28 text-xs rounded-xl" placeholder="Referencia" />
                  <Button disabled={pending} size="sm" type="submit" variant="outline" className="rounded-xl text-xs font-bold h-9">
                    <CreditCard className="mr-1 h-3.5 w-3.5 text-blue-600" />
                    Cobro
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
        {!invoices.length && (
          <Card className="rounded-3xl border border-slate-200/80 bg-white">
            <CardContent className="p-10 text-center text-xs text-slate-500 font-medium">
              Todavía no hay facturas. Crea la primera cuando cierres una consulta o prepares un bono.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
