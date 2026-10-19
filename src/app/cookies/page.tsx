import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal/legal-document'

export const metadata: Metadata = {
  title: 'Política de cookies · Eva Vidal Nutrición',
  robots: { index: false, follow: false, noarchive: true },
}

export default function CookiesPage() {
  return (
    <LegalDocument
      eyebrow="Transparencia técnica"
      title="Política de cookies"
      summary="Información sobre las cookies y tecnologías similares utilizadas por EVSoftware."
    >
      <LegalSection title="1. Cookies estrictamente necesarias">
        <p>EVSoftware utiliza una cookie técnica de sesión autenticada para mantener el acceso seguro al portal y otra cookie técnica de vista previa exclusivamente para la profesional. Son necesarias para prestar el servicio solicitado y no se utilizan para publicidad, perfiles ni analítica comportamental.</p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-800">
              <tr><th className="px-4 py-3">Cookie</th><th className="px-4 py-3">Finalidad</th><th className="px-4 py-3">Duración</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr><td className="px-4 py-3 font-mono">evsoftware_session</td><td className="px-4 py-3">Sesión autenticada</td><td className="px-4 py-3">Hasta 12 horas</td></tr>
              <tr><td className="px-4 py-3 font-mono">evsoftware_preview_patient_id</td><td className="px-4 py-3">Vista previa profesional</td><td className="px-4 py-3">Sesión temporal</td></tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="2. Servicios de terceros">
        <p>La aplicación puede abrir enlaces de Google Calendar, Google Meet o enviar correo mediante Gmail/Google Workspace cuando la profesional lo solicita. Esos servicios pueden aplicar sus propias cookies y políticas una vez que la persona abandona EVSoftware. La aplicación no instala cookies publicitarias de terceros.</p>
        <p>Las fuentes tipográficas se sirven mediante el mecanismo optimizado de Next.js y no se emplean para crear perfiles de navegación.</p>
      </LegalSection>

      <LegalSection title="3. Gestión desde el navegador">
        <p>La mayoría de navegadores permiten bloquear o borrar cookies. Si se bloquea la cookie de sesión, no será posible acceder al portal autenticado. No se debe borrar una cookie durante una operación sensible hasta comprobar que la acción ha terminado.</p>
      </LegalSection>
    </LegalDocument>
  )
}
