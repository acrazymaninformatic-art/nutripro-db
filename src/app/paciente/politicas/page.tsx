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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-teal-700/20 border border-teal-400/40">
            <ShieldCheck className="w-9 h-9" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Bienvenido/a a EVSoftware
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Eva Vidal Nutrición · Portal Clínico Seguro
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <Card className="rounded-3xl border border-slate-200/80 shadow-xl bg-white/95 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-50/80 via-white to-teal-50/40 p-6 sm:p-7 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-teal-600" />
              <span>Aceptación Obligatoria de Políticas de Privacidad y Términos</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 leading-relaxed mt-1">
              De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la legislación sanitaria vigente,
              es necesario que confirmes la lectura y conformidad con los siguientes términos antes de acceder a tus datos clínicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-7 space-y-5">
            {/* Resumen de Políticas */}
            <div className="h-64 overflow-y-auto p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 space-y-4 leading-relaxed medical-scrollbar">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  1. Tratamiento de Datos de Salud (Categoría Especial Art. 9 RGPD)
                </h4>
                <p>
                  Tus datos personales y de salud (anamnesis, composición corporal, analíticas, planes nutricionales)
                  son tratados con la exclusiva finalidad de prestarte asesoramiento y dietoterapia nutricional personalizada
                  por parte de Eva Vidal (Nutricionista Colegiada). Tus datos no serán cedidos a terceros salvo obligación legal.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  2. Política de Cookies y Recursos Técnicos
                </h4>
                <p>
                  Este portal utiliza únicamente cookies técnicas estrictamente necesarias para el mantenimiento de tu sesión autenticada segura.
                  No utilizamos cookies de seguimiento publicitario ni compartimos datos con redes sociales. Las tipografías se cargan de forma optimizada
                  sin rastreo de actividad.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  3. Derechos de los Interesados (Acceso, Rectificación y Supresión)
                </h4>
                <p>
                  En cualquier momento puedes solicitar la descarga completa de tu expediente clínico, rectificación de datos inexactos
                  o la supresión de tu cuenta a través del portal o dirigiéndote por escrito a <strong>info@evavidalnutricion.com</strong>.
                  La historia clínica se conservará durante el plazo legal mínimo exigido por la normativa sanitaria.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-teal-950 flex items-start gap-3 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <span>
                Al hacer clic en <strong>"Aceptar términos y entrar al portal"</strong>, confirmas tu consentimiento expreso
                para el tratamiento de tus datos sanitarios y el uso de este portal clínico. Versión legal 1.0 (Octubre 2026).
              </span>
            </div>

            <form action={acceptPatientPoliciesAction}>
              <Button
                type="submit"
                className="w-full h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
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
