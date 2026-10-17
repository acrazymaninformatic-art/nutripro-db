import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsProfileForm } from './settings-profile-form'
import { EmergencyLockdownPanel } from './emergency-lockdown-panel'
import { FaqEditor } from './faq-editor'
import { getPortalFaqs } from '@/lib/faq-service'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireAdmin()
  const activeLockdown = await prisma.emergencyLockdown.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  const faqs = await getPortalFaqs()

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-700"><Settings className="h-6 w-6" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Configuración de Consulta</h1><p className="text-sm text-gray-500">Perfil profesional de la consulta.</p></div>
      </div>
      <SettingsProfileForm user={user} />
      
      {/* Editor de Preguntas Frecuentes y Textos del Portal (3.10) */}
      <FaqEditor initialFaqs={faqs} />

      {/* Protocolo de Aislamiento de Emergencia */}
      <EmergencyLockdownPanel
        initialIsActive={!!activeLockdown}
        activatedAt={activeLockdown?.activatedAt?.toISOString()}
        expiresAt={activeLockdown?.expiresAt?.toISOString()}
        reason={activeLockdown?.reason}
      />

      <Card className="rounded-3xl border-gray-200 shadow-sm">
        <CardHeader><CardTitle className="text-base">Configuración protegida</CardTitle><CardDescription>Los datos de conexión de correo y base de datos se administran en el entorno de despliegue y no se muestran en el panel.</CardDescription></CardHeader>
        <CardContent><p className="text-sm text-gray-600">Las credenciales y detalles de infraestructura no se envían al navegador.</p></CardContent>
      </Card>
    </div>
  )
}
