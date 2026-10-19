import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal/legal-document'
import { LEGAL_PROFILE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Condiciones de uso · Eva Vidal Nutrición',
  robots: { index: false, follow: false, noarchive: true },
}

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Condiciones del portal"
      title="Condiciones de uso"
      summary="Reglas aplicables al acceso profesional y al portal privado del paciente."
    >
      <LegalSection title="1. Aceptación y acceso">
        <p>El acceso al portal requiere leer la información de privacidad y aceptar separadamente estas condiciones y el tratamiento de los datos de salud cuando corresponda. La aceptación queda versionada y registrada con fecha y datos técnicos mínimos de trazabilidad.</p>
        <p>Las credenciales son personales. La persona usuaria debe comunicar cualquier uso no autorizado, pérdida o sospecha de compromiso a {LEGAL_PROFILE.email} y cambiar su contraseña.</p>
      </LegalSection>

      <LegalSection title="2. Alcance clínico">
        <p>El portal facilita la comunicación y el seguimiento de una relación profesional ya existente. Las pautas, cálculos y alertas requieren revisión profesional y no sustituyen diagnóstico, tratamiento médico, medicación, análisis de laboratorio ni atención urgente.</p>
        <p>La persona paciente debe comunicar cambios relevantes de salud, medicación, embarazo, alergias o síntomas y no modificar tratamientos prescritos basándose únicamente en la aplicación.</p>
      </LegalSection>

      <LegalSection title="3. Citas, comunicaciones y servicios externos">
        <p>Las solicitudes de cita no garantizan una fecha hasta que la profesional la confirme. Los recordatorios y mensajes se envían al canal de contacto facilitado para fines asistenciales y administrativos.</p>
        <p>Al abrir enlaces de Google Calendar, Google Meet u otros servicios externos se aplican sus propias condiciones y políticas. No se realizan pagos online dentro de EVSoftware; los pagos presenciales, por transferencia o por Bizum se gestionan conforme a la información que facilite la profesional y a las obligaciones fiscales aplicables.</p>
      </LegalSection>

      <LegalSection title="4. Menores de edad">
        <p>Los expedientes de menores requieren que la profesional registre la identidad, relación y constancia de la intervención del padre, madre o representante legal que corresponda. La aplicación no debe utilizarse para crear o enviar datos de un menor sin esa verificación previa.</p>
        <p>Cuando la persona alcance la mayoría de edad, la profesional debe revisar la base jurídica, la información facilitada y los permisos del portal.</p>
      </LegalSection>

      <LegalSection title="5. Suspensión y cierre">
        <p>El acceso puede suspenderse por seguridad, impago, finalización de la relación asistencial, solicitud de la persona interesada o incumplimiento de estas condiciones. La suspensión no elimina automáticamente los datos sujetos a obligaciones legales de conservación.</p>
      </LegalSection>
    </LegalDocument>
  )
}
