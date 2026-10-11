import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Database, Cloud, Mail, KeyRound } from 'lucide-react'
import { SettingsProfileForm } from './settings-profile-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [user, patientCount, foodCount, recipeCount, planCount] = await Promise.all([
    prisma.user.findFirst(),
    prisma.patient.count(),
    prisma.food.count(),
    prisma.recipe.count(),
    prisma.mealPlan.count(),
  ])

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-700 shadow-2xs">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Consulta</h1>
          <p className="text-sm text-gray-500">
            Perfil del profesional, servidor de correo para anamnesis automática y base de datos cloud.
          </p>
        </div>
      </div>

      {/* 1. Datos del Profesional (Formulario Interactivo con Guardado Real) */}
      <SettingsProfileForm
        user={{
          name: user?.name || 'Eva Vidal',
          email: user?.email || 'evavidalinfo@gmail.com',
          licenseNumber: user?.licenseNumber || 'MAD-04821',
          clinicName: user?.clinicName || 'Consulta Nutricional Eva Vidal',
          phone: user?.phone || '',
          address: user?.address || '',
        }}
      />

      {/* 2. Configuración de Correo Electrónico para Envíos Automáticos (SMTP) */}
      <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Servidor de Correo (Envíos Automáticos de Anamnesis)</CardTitle>
            </div>
            <Badge variant="outline" className="text-2xs bg-blue-50 text-blue-800 border-blue-300 font-bold rounded-full">
              Gmail SMTP Conectado
            </Badge>
          </div>
          <CardDescription>
            Conectado con tu cuenta de correo evavidalinfo@gmail.com para envíos 100% automáticos y seguros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl text-xs text-blue-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <KeyRound className="h-4 w-4 text-blue-700" />
              <span>Credenciales de Correo Activas:</span>
            </div>
            <p className="text-2xs text-blue-800 leading-relaxed">
              Los correos con los cuestionarios clínicos se envían directamente a través de los servidores de Gmail utilizando autenticación cifrada TLS por el puerto 587.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="smtpHost">Servidor SMTP</Label>
              <Input id="smtpHost" readOnly value="smtp.gmail.com" className="rounded-xl font-mono text-xs bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpPort">Puerto SMTP</Label>
              <Input id="smtpPort" readOnly value="587 (TLS)" className="rounded-xl font-mono text-xs bg-slate-50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpUser">Correo SMTP (Remitente)</Label>
              <Input id="smtpUser" readOnly value="evavidalinfo@gmail.com" className="rounded-xl text-xs bg-slate-50 font-medium" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpPass">Estado de Autenticación</Label>
              <Input id="smtpPass" type="password" readOnly value="••••••••••••••••" className="rounded-xl text-xs font-mono bg-slate-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Base de Datos Cloud en Supabase (Frankfurt EU) */}
      <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Base de Datos y Almacenamiento en la Nube</span>
          </CardTitle>
          <CardDescription>
            Cluster PostgreSQL de alta disponibilidad en Supabase (Región Frankfurt - Unión Europea)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/40 border border-blue-200/80 text-xs">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-gray-700">Servidor Cloud:</span>
              <code className="text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded text-2xs font-mono">aws-1-eu-central-1 (Frankfurt)</code>
            </div>
            <Badge variant="default" className="bg-blue-100 text-blue-800 border-0 font-bold">
              Conectado y En Producción
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 block">Pacientes</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{patientCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 block">Alimentos</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{foodCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 block">Recetas</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{recipeCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 block">Planes Dietéticos</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{planCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
