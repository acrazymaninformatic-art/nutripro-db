import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { requireAdmin } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin({ allowPendingSetup: true })

  // El acceso de administración exige TOTP. Sin alta de MFA solo se permite
  // la pantalla de Configuración, donde se completa el enrolamiento.
  if (!user.mfaEnabled || user.passwordChangeRequired) {
    const headerList = await headers()
    const pathname = headerList.get('x-pathname') || ''
    if (!pathname.startsWith('/dashboard/settings')) {
      const reason = !user.mfaEnabled ? 'mfa=required' : 'passwordChangeRequired=1'
      redirect(`/dashboard/settings?${reason}`)
    }
  }

  return <DashboardShell professionalName={user.name}>{children}</DashboardShell>
}
