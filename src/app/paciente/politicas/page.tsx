import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react'
import { acceptPatientPoliciesAction } from '../actions'

export const dynamic = 'force-dynamic'

export default async function PoliticasPage() {
  const { patientId, isAdminPreview } = await requirePatient()

  if (patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { consentAcceptedAt: true, consentPolicyVersion: true },
    })

    // Si ya aceptó la versión 1.0 y no es preview, redirigir al inicio
    if (patient?.consentAcceptedAt && patient?.consentPolicyVersion === '1.0' && !isAdminPreview) {
      redirect('/paciente')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-800 shadow-sm border border-blue-200">
            <ShieldCheck className="w-9 h-9" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Bienvenido/a a EVSoftware
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Consulta Nutricional Eva Vidal · Portal Clínico Seguro
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <Card className="rounded-3xl border border-gray-200 shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50/70 to-white pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>Aceptación Obligatoria de Políticas de Privacidad y Términos</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-600 leading-relaxed">
              De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la legislación sanitaria vigente,
              es necesario que confirmes la lectura y conformidad con los siguientes términos antes de acceder a tus datos clínicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* Resumen de Políticas */}
            <div className="h-64 overflow-y-auto p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-4 leading-relaxed">
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  1. Tratamiento de Datos de Salud (Categoría Especial Art. 9 RGPD)
                </h4>
                <p>
                  Tus datos personales y de salud (anamnesis, composición corporal, analíticas, planes nutricionales)
                  son tratados con la exclusiva finalidad de prestarte asesoramiento y dietoterapia nutricional personalizada
                  por parte de Eva Vidal (Nutricionista Colegiada). Tus datos no serán cedidos a terceros salvo obligación legal.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  2. Política de Cookies y Recursos Técnicos
                </h4>
                <p>
                  Este portal utiliza únicamente cookies técnicas estrictamente necesarias para el mantenimiento de tu sesión autenticada segura.
                  No utilizamos cookies de seguimiento publicitario ni compartimos datos con redes sociales. Las tipografías se cargan de forma optimizada
                  sin rastreo de actividad.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  3. Derechos de los Interesados (Acceso, Rectificación y Supresión)
                </h4>
                <p>
                  En cualquier momento puedes solicitar la descarga completa de tu expediente clínico, rectificación de datos inexactos
                  o la supresión de tu cuenta a través del portal o dirigiéndote por escrito a <strong>evavidalinfo@gmail.com</strong>.
                  La historia clínica se conservará durante el plazo legal mínimo exigido por la normativa sanitaria.
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span>
                Al hacer clic en <strong>"Aceptar términos y entrar al portal"</strong>, confirmas tu consentimiento expreso
                para el tratamiento de tus datos sanitarios y el uso de este portal clínico. Versión legal 1.0 (Octubre 2026).
              </span>
            </div>

            <form action={acceptPatientPoliciesAction}>
              <Button
                type="submit"
                className="w-full py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Aceptar términos y entrar al portal</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
