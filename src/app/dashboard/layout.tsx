import { DashboardShell } from '@/components/layout/dashboard-shell'
import { requireAdmin } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()
  return <DashboardShell professionalName={user.name}>{children}</DashboardShell>
}
