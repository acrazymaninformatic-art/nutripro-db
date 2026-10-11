import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Database, HardDrive, Mail, KeyRound } from 'lucide-react'

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
        <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-700 shadow-2xs">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Consulta</h1>
          <p className="text-sm text-gray-500">
            Perfil del profesional, servidor de correo para anamnesis automática y almacenamiento de datos.
          </p>
        </div>
      </div>

      {/* 1. Datos del Profesional */}
      <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            <span>Perfil del Profesional Nutricionista</span>
          </CardTitle>
          <CardDescription>
            Información que aparecerá en las portadas de los planes nutricionales y en los correos enviados a pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profName">Nombre y Apellidos</Label>
              <Input id="profName" defaultValue={user?.name || 'Dr. Nutricionista'} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="license">Nº de Colegiado Profesional</Label>
              <Input id="license" defaultValue="MAD-04821" placeholder="Ej. AND-01234" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo de Consulta (Remitente)</Label>
              <Input id="email" defaultValue={user?.email || 'nutricionista@nutripro.com'} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic">Nombre de la Clínica / Despacho</Label>
              <Input id="clinic" defaultValue="Centro Nutricional NutriPro" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono de Consulta</Label>
              <Input id="phone" placeholder="Ej. +34 611 222 333" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección del Centro</Label>
              <Input id="address" placeholder="Ej. C/ Velázquez 42, 28001 Madrid" className="rounded-xl" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-gray-50/50 py-3 px-5">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
            Guardar Cambios de Perfil
          </Button>
        </CardFooter>
      </Card>

      {/* 2. Configuración de Correo Electrónico para Envíos Automáticos (SMTP) */}
      <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Servidor de Correo (Envíos Automáticos de Anamnesis)</CardTitle>
            </div>
            <Badge variant="outline" className="text-2xs bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold rounded-full">
              Nodemailer SMTP
            </Badge>
          </div>
          <CardDescription>
            Conecta tu cuenta de Gmail o Outlook para que los formularios se envíen de forma 100% automática y desatendida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <KeyRound className="h-4 w-4 text-emerald-700" />
              <span>Cómo usar Gmail gratis sin pagar ningún servicio:</span>
            </div>
            <p className="text-2xs text-emerald-800 leading-relaxed">
              1. Entra en tu Cuenta de Google &gt; <strong>Seguridad</strong> &gt; Activa la <em>Verificación en dos pasos</em>.<br />
              2. Ve al buscador de tu cuenta de Google y escribe <strong>Contraseñas de aplicaciones</strong>.<br />
              3. Crea una para &quot;NutriPro&quot; y te dará una contraseña de 16 letras (ej. <code className="bg-white/70 px-1 py-0.5 rounded font-mono">abcd efgh ijkl mnop</code>).<br />
              4. Añádela a tu archivo <code className="bg-white/70 px-1 py-0.5 rounded font-mono">.env</code> como <code className="bg-white/70 px-1 py-0.5 rounded font-mono">SMTP_PASS</code> y tu correo como <code className="bg-white/70 px-1 py-0.5 rounded font-mono">SMTP_USER</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="smtpHost">Servidor SMTP</Label>
              <Input id="smtpHost" defaultValue={process.env.SMTP_HOST || 'smtp.gmail.com'} className="rounded-xl font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpPort">Puerto SMTP</Label>
              <Input id="smtpPort" defaultValue={process.env.SMTP_PORT || '465'} className="rounded-xl font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpUser">Correo SMTP (Remitente)</Label>
              <Input id="smtpUser" defaultValue={process.env.SMTP_USER || user?.email || ''} placeholder="tuconsulta@gmail.com" className="rounded-xl text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpPass">Contraseña de Aplicación (16 dígitos)</Label>
              <Input id="smtpPass" type="password" placeholder="••••••••••••••••" defaultValue={process.env.SMTP_PASS ? '••••••••••••••••' : ''} className="rounded-xl text-xs font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Estado de la Base de Datos Local */}
      <Card className="rounded-3xl border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            <span>Base de Datos y Almacenamiento Local</span>
          </CardTitle>
          <CardDescription>
            Motor SQLite local autónomo (sin necesidad de servidores externos de pago)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border text-xs">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-gray-700">Archivo de Datos:</span>
              <code className="text-gray-900 bg-gray-200/60 px-2 py-0.5 rounded">file:./dev.db</code>
            </div>
            <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-0">
              Conectado y Operativo
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-gray-50 border">
              <span className="text-xs text-gray-500 block">Pacientes</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{patientCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border">
              <span className="text-xs text-gray-500 block">Alimentos</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{foodCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border">
              <span className="text-xs text-gray-500 block">Recetas</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{recipeCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border">
              <span className="text-xs text-gray-500 block">Planes Dietéticos</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{planCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
