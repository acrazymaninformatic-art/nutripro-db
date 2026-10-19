import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal/legal-document'
import { LEGAL_PROFILE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Información de privacidad · Eva Vidal Nutrición',
  robots: { index: false, follow: false, noarchive: true },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Protección de datos"
      title="Información de privacidad"
      summary="Información ampliada sobre el tratamiento de datos personales y datos de salud realizado a través de la consulta y EVSoftware."
    >
      <LegalSection title="1. Responsable y contacto">
        <p>La responsable del tratamiento es <strong>{LEGAL_PROFILE.legalName}</strong>, que presta sus servicios bajo el nombre profesional <strong>{LEGAL_PROFILE.tradeName}</strong>.</p>
        <p>NIF: pendiente de completar. Domicilio profesional: pendiente de completar. Colegio profesional: pendiente de identificar; número comunicado: {LEGAL_PROFILE.professionalNumber}.</p>
        <p>Contacto para privacidad, ejercicio de derechos y consultas: <a className="text-blue-700 underline" href={`mailto:${LEGAL_PROFILE.email}`}>{LEGAL_PROFILE.email}</a> · <a className="text-blue-700 underline" href={`tel:${LEGAL_PROFILE.phone}`}>{LEGAL_PROFILE.phone}</a>.</p>
        <p>No se ha indicado todavía una persona delegada de protección de datos. Debe documentarse si resulta obligatoria o conveniente por el alcance real del tratamiento.</p>
      </LegalSection>

      <LegalSection title="2. Qué datos se tratan">
        <p>Según el servicio utilizado, pueden tratarse datos identificativos y de contacto, fecha de nacimiento, datos de menores y representantes, citas, comunicaciones, preferencias, facturación y datos de salud como alergias, intolerancias, medicación, antecedentes, síntomas, analíticas, antropometría, evolución y cuestionarios.</p>
        <p>Los campos deben cumplimentarse de forma proporcional y exacta. No deben introducirse datos de familiares, terceros o historias ajenas salvo que exista una base legítima y sea necesario para la atención.</p>
      </LegalSection>

      <LegalSection title="3. Finalidades y bases jurídicas">
        <ul className="list-disc space-y-2 pl-5">
          <li>Gestionar la relación asistencial, el expediente, las citas y los planes nutricionales.</li>
          <li>Tratar datos de salud para la prestación de asistencia sanitaria y nutricional por una profesional sujeta a deber de confidencialidad, cuando resulte aplicable la base del artículo 9.2.h del RGPD, junto con la base del artículo 6 que corresponda.</li>
          <li>Registrar consentimientos, solicitudes de derechos, incidencias y auditoría de seguridad.</li>
          <li>Enviar comunicaciones asistenciales y administrativas solicitadas o necesarias para la relación profesional. No se enviará marketing sin la base y el consentimiento que resulten exigibles.</li>
          <li>Cumplir obligaciones legales, contables, fiscales, sanitarias y atender reclamaciones.</li>
        </ul>
        <p>Cuando un tratamiento concreto no quede cubierto por la asistencia sanitaria, se solicitará una base jurídica específica y separada. La aceptación del portal no equivale a consentir publicidad ni cesiones no informadas.</p>
      </LegalSection>

      <LegalSection title="4. Menores y representantes">
        <p>Cuando el expediente corresponde a una persona menor de edad, la profesional debe verificar y registrar la intervención del representante legal que corresponda, su relación, el método de verificación y la versión de la información facilitada. El portal bloquea el uso de la anamnesis hasta que esa constancia exista.</p>
        <p>La profesional debe revisar caso por caso la capacidad, la patria potestad, la confidencialidad del menor y cualquier conflicto entre representantes. Esta pantalla no sustituye esa valoración jurídica.</p>
      </LegalSection>

      <LegalSection title="5. Encargados, destinatarios y transferencias">
        <p>Para operar el servicio se han identificado técnicamente Vercel (alojamiento), Supabase/PostgreSQL (base de datos), Gmail o Google Workspace (correo) y Google Calendar/Meet cuando se utilizan esas funciones. Deben existir contratos de encargo, medidas de seguridad, subencargados documentados y garantías de transferencia internacional antes de usar el servicio en producción.</p>
        <p>No se realizan pagos online dentro de la aplicación. Las operaciones por Bizum, transferencia o presencial deben documentarse por separado, con los proveedores y obligaciones fiscales que realmente se utilicen.</p>
      </LegalSection>

      <LegalSection title="6. Conservación">
        <p>Los datos se conservarán durante el tiempo necesario para cada finalidad y durante los plazos legales de conservación de documentación clínica, contable, fiscal o de defensa de reclamaciones que resulten aplicables. No se fija aquí un plazo único inventado: la responsable debe aprobar una tabla de conservación por categoría y aplicarla también a copias de seguridad, exportaciones y correo.</p>
        <p>La supresión puede limitarse cuando exista una obligación legal de conservación. En ese caso se bloquearán los datos para otros usos y se explicará la excepción a la persona solicitante.</p>
      </LegalSection>

      <LegalSection title="7. Derechos">
        <p>La persona interesada puede solicitar acceso, rectificación, supresión, limitación, oposición y, cuando proceda, portabilidad, además de no quedar sometida a una decisión basada únicamente en tratamiento automatizado con efectos jurídicos o similares. Puede solicitar también información sobre el origen, destinatarios y plazos.</p>
        <p>Las solicitudes pueden realizarse desde el portal o escribiendo a {LEGAL_PROFILE.email}. Se podrá pedir información adicional para verificar la identidad. La respuesta se gestionará, como regla general, en el plazo de un mes, ampliable en los supuestos legalmente previstos.</p>
        <p>También puede reclamarse ante la Agencia Española de Protección de Datos (<a className="text-blue-700 underline" href="https://www.aepd.es" rel="noreferrer">aepd.es</a>).</p>
      </LegalSection>

      <LegalSection title="8. Seguridad y brechas">
        <p>EVSoftware aplica autenticación, control de roles, sesiones firmadas, minimización de datos expuestos, registros de auditoría, enlaces de un solo uso y medidas de no almacenamiento en caché para áreas sensibles. Deben mantenerse además copias de seguridad, revisión de permisos, gestión de secretos, pruebas de restauración y un registro de incidentes.</p>
        <p>Las brechas de datos personales se evaluarán sin demora y se notificarán a la autoridad y a las personas afectadas cuando la normativa lo exija.</p>
      </LegalSection>

      <LegalSection title="9. Cookies y decisiones automatizadas">
        <p>Solo se utilizan cookies técnicas necesarias para sesión y vista previa profesional. No hay analítica publicitaria configurada. La información completa está disponible en la <a className="text-blue-700 underline" href="/cookies">Política de cookies</a>.</p>
        <p>Los cálculos nutricionales y protocolos son herramientas de apoyo. La profesional debe revisar los resultados antes de comunicarlos o incorporarlos a una decisión clínica.</p>
      </LegalSection>
    </LegalDocument>
  )
}
