import type { Metadata } from 'next'
import { LegalDocument, LegalSection } from '@/components/legal/legal-document'
import { LEGAL_PROFILE } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Aviso legal · Eva Vidal Nutrición',
  robots: { index: false, follow: false, noarchive: true },
}

export default function LegalNoticePage() {
  return (
    <LegalDocument
      eyebrow="EVSoftware · Eva Vidal Nutrición"
      title="Aviso legal"
      summary="Información del titular, del servicio digital y de las reglas básicas de uso de esta aplicación clínica."
    >
      <LegalSection title="1. Titular del servicio">
        <p><strong>Nombre:</strong> {LEGAL_PROFILE.legalName}</p>
        <p><strong>Nombre profesional:</strong> {LEGAL_PROFILE.tradeName}</p>
        <p><strong>NIF:</strong> pendiente de completar.</p>
        <p><strong>Domicilio profesional:</strong> pendiente de completar.</p>
        <p><strong>Correo:</strong> <a className="text-blue-700 underline" href={`mailto:${LEGAL_PROFILE.email}`}>{LEGAL_PROFILE.email}</a></p>
        <p><strong>Teléfono:</strong> <a className="text-blue-700 underline" href={`tel:${LEGAL_PROFILE.phone}`}>{LEGAL_PROFILE.phone}</a></p>
        <p><strong>Colegiación:</strong> número {LEGAL_PROFILE.professionalNumber}; el colegio profesional exacto debe completarse antes de la publicación definitiva.</p>
      </LegalSection>

      <LegalSection title="2. Objeto y alcance">
        <p>EVSoftware es una herramienta privada de gestión de consulta nutricional. Permite organizar expedientes, citas, cuestionarios, planes, documentos, comunicaciones y un portal autenticado para pacientes.</p>
        <p>La aplicación no es un servicio de urgencias, no sustituye la valoración de un profesional sanitario y no debe utilizarse para emergencias. Ante una urgencia, debe contactarse con el 112 o con el servicio sanitario correspondiente.</p>
      </LegalSection>

      <LegalSection title="3. Uso permitido">
        <p>El acceso está reservado a la profesional responsable, a personal autorizado y a pacientes o tutores que hayan recibido credenciales o enlaces personales. Queda prohibido compartir credenciales, intentar acceder a expedientes ajenos, automatizar consultas o introducir información de terceros sin autorización.</p>
        <p>La profesional debe revisar y validar cualquier cálculo, alerta, protocolo o pauta antes de aplicarlo. Ningún resultado automatizado constituye por sí solo diagnóstico, prescripción médica o decisión clínica.</p>
      </LegalSection>

      <LegalSection title="4. Propiedad intelectual y disponibilidad">
        <p>La interfaz, el código, la documentación y los contenidos propios están protegidos por la normativa aplicable. Las bases de datos de alimentos y recursos externos mantienen sus respectivas licencias y condiciones.</p>
        <p>Se aplican medidas razonables de seguridad, pero ningún sistema conectado a Internet puede garantizar disponibilidad o seguridad absoluta. Las incidencias deben comunicarse inmediatamente a {LEGAL_PROFILE.email}.</p>
      </LegalSection>

      <LegalSection title="5. Normativa y reclamaciones">
        <p>El uso del servicio se somete a la normativa española y de la Unión Europea que resulte aplicable, sin perjuicio de los derechos irrenunciables de las personas usuarias. Las reclamaciones pueden dirigirse al contacto indicado y, cuando proceda, a la Agencia Española de Protección de Datos.</p>
      </LegalSection>
    </LegalDocument>
  )
}
