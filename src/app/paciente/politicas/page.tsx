import { requirePatient } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Lock, FileText, CheckCircle2, ExternalLink } from 'lucide-react'
import { acceptPatientPoliciesAction } from '../actions'
import { LEGAL_POLICY_VERSION, REQUIRED_PORTAL_CONSENTS } from '@/lib/legal'

export const dynamic = 'force-dynamic'

export default async function PoliticasPage() {
  const { patientId, isAdminPreview } = await requirePatient({
    allowPendingConsent: true,
    allowPasswordChangePending: true,
  })
  let hasAcceptedCurrentVersion = false

  if (patientId) {
    const [patient, consents] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        select: { consentAcceptedAt: true, consentPolicyVersion: true },
      }),
      prisma.patientConsent.findMany({
        where: { patientId, type: { in: REQUIRED_PORTAL_CONSENTS.map((consent) => consent.type) }, version: LEGAL_POLICY_VERSION, accepted: true, revokedAt: null, status: 'COMPLETED' },
        select: { type: true },
      }),
    ])
    hasAcceptedCurrentVersion = Boolean(
      patient?.consentAcceptedAt &&
      patient.consentPolicyVersion === LEGAL_POLICY_VERSION &&
      REQUIRED_PORTAL_CONSENTS.every((requiredConsent) => consents.some((consent) => consent.type === requiredConsent.type))
    )
  }

  if (hasAcceptedCurrentVersion && !isAdminPreview) redirect('/paciente')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="flex justify-center mb-5"><div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-700/20 border border-blue-400/40"><ShieldCheck className="w-9 h-9" /></div></div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">Antes de entrar al portal</h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">Eva Vidal Nutrición · Versión legal {LEGAL_POLICY_VERSION}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <Card className="rounded-3xl border border-slate-200/80 shadow-xl bg-white/95 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50/80 via-white to-sky-50/40 p-6 sm:p-7 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2.5"><Lock className="w-5 h-5 text-blue-600" /><span>Lectura y aceptación separadas</span></CardTitle>
            <CardDescription className="text-xs text-slate-600 leading-relaxed mt-1">Lee cada documento y marca cada casilla por separado. El portal no utiliza esta aceptación para publicidad ni para compartir datos con terceros no informados.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-7 space-y-5">
            <div className="h-72 overflow-y-auto p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 space-y-5 leading-relaxed">
              <div><h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />1. Privacidad y derechos</h4><p>La consulta tratará los datos necesarios para la relación nutricional, incluyendo datos de salud cuando exista la base jurídica aplicable. Puedes pedir acceso, rectificación, supresión, limitación, oposición y portabilidad cuando proceda.</p><Link className="mt-1 inline-flex items-center gap-1 font-bold text-blue-700 underline" href="/privacy-policy" target="_blank">Leer información completa <ExternalLink className="h-3 w-3" /></Link></div>
              <div><h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />2. Condiciones del portal</h4><p>El portal es privado y sirve de apoyo a una relación profesional. Las pautas y cálculos requieren revisión de Eva Vidal y no sustituyen atención urgente, diagnóstico médico ni tratamiento prescrito.</p><Link className="mt-1 inline-flex items-center gap-1 font-bold text-blue-700 underline" href="/terms" target="_blank">Leer condiciones completas <ExternalLink className="h-3 w-3" /></Link></div>
              <div><h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />3. Tratamiento de datos de salud</h4><p>Confirmas que has recibido información clara sobre la finalidad asistencial del tratamiento de tus datos de salud. Cuando la asistencia sanitaria no cubra un tratamiento concreto, se solicitará una base separada.</p></div>
              <div><h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />4. Cookies técnicas</h4><p>Solo se utilizan cookies necesarias para la sesión segura y la vista previa profesional. No se usan cookies publicitarias ni analítica de perfiles.</p><Link className="mt-1 inline-flex items-center gap-1 font-bold text-blue-700 underline" href="/cookies" target="_blank">Leer política de cookies <ExternalLink className="h-3 w-3" /></Link></div>
            </div>

            {isAdminPreview ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <span>Vista previa de solo lectura. La aceptación de políticas está deshabilitada.</span>
              </div>
            ) : (
              <form action={acceptPatientPoliciesAction} className="space-y-3">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs leading-5 text-slate-700"><input name="privacyNoticeAccepted" type="checkbox" required className="mt-0.5 h-4 w-4 accent-blue-600" /><span>He leído la <strong>información de privacidad</strong> y sé cómo ejercer mis derechos. *</span></label>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs leading-5 text-slate-700"><input name="portalTermsAccepted" type="checkbox" required className="mt-0.5 h-4 w-4 accent-blue-600" /><span>Acepto las <strong>condiciones de uso del portal</strong> y entiendo que no es un servicio de urgencias. *</span></label>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs leading-5 text-slate-700"><input name="healthDataConsentAccepted" type="checkbox" required className="mt-0.5 h-4 w-4 accent-blue-600" /><span>Confirmo que he recibido la información sobre el <strong>tratamiento de mis datos de salud</strong> para la atención nutricional. *</span></label>

                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-950 flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" /><span>La aceptación quedará registrada con la versión {LEGAL_POLICY_VERSION}, fecha y datos técnicos mínimos para demostrar la trazabilidad. No implica aceptar comunicaciones comerciales.</span></div>
                <Button type="submit" className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"><CheckCircle2 className="w-5 h-5" /><span>Aceptar y entrar al portal</span></Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
