# EVSoftware · checklist de cumplimiento y puesta en producción

> Este documento es una lista operativa de cumplimiento, no asesoramiento jurídico ni una certificación. La aplicación no debe presentarse como «100 % legal» hasta que una profesional jurídica revise el caso real y se completen los bloqueos indicados.

## Estado actual

- Jurisdicción objetivo: España y RGPD/UE.
- Responsable declarado en la aplicación: Eva Maria Vidal Garcia.
- Contacto: `info@evavidalnutricion.com` · `644137667`.
- NIF: **pendiente**.
- Domicilio profesional completo: **pendiente**.
- Colegio profesional exacto del número 1222: **pendiente**.
- DPD: **pendiente de determinar y documentar**.
- Alcance: consulta nutricional, portal de paciente, menores, citas, comunicaciones y pagos fuera de la aplicación (presencial, transferencia o Bizum).
- Proveedores técnicos identificados: Vercel, Supabase/PostgreSQL y Gmail/Google; Google Calendar/Meet solo cuando se utiliza esa función.

## Bloqueos antes de publicitar el servicio

1. Completar NIF, domicilio y colegio profesional en `src/lib/legal.ts`.
2. Confirmar si existe obligación de designar DPD y publicar el canal correcto.
3. Revisar los textos con asesoría jurídica y adaptar el consentimiento sanitario a la habilitación profesional y a la relación asistencial real.
4. Firmar y archivar contratos de encargo con Vercel, Supabase, Google/Gmail y cualquier subencargado real; revisar transferencias internacionales y garantías aplicables.
5. Aprobar una tabla de conservación por categoría: expediente clínico, facturación, consentimientos, auditoría, correo, exportaciones y copias de seguridad.
6. Completar el registro de actividades de tratamiento, análisis de riesgos y, si procede, evaluación de impacto por datos de salud y menores.
7. Documentar el procedimiento de verificación del representante legal de menores, conflictos de patria potestad y transición al alcanzar la mayoría de edad.
8. Definir el procedimiento de brechas, responsables, evidencias, notificación a AEPD en su caso y comunicación a personas afectadas.
9. Revisar el uso real de Bizum/transferencias y las obligaciones fiscales, contables y de facturación; la app no procesa pagos online.
10. Rotar cualquier secreto que se haya compartido fuera del entorno seguro y comprobar que ningún `.env` se publica en Git.

## Controles implementados en el código

- Aviso legal, privacidad, condiciones y cookies separados y enlazados desde el acceso.
- Avisos transparentes cuando faltan datos jurídicos imprescindibles.
- Aceptación separada y versionada de privacidad, condiciones del portal y tratamiento de datos de salud.
- Registro de fecha, versión, agente de usuario y dirección técnica mínima de aceptación.
- Derechos de acceso, rectificación, exportación y supresión registrables desde el portal; control de solicitudes pendientes y resolución por la profesional.
- Plazo de derechos calculado como un mes natural, no como 30 días fijos.
- Anamnesis pública protegida por token de un solo uso, comprobación de expediente activo y registro separado de información/consentimiento.
- Bloqueo de anamnesis de menores sin constancia previa de representación legal.
- Ficha de menores con representante, relación, método y versión de la información registrada.
- Cabeceras de seguridad, no-cache en áreas sensibles, control de roles y auditoría de acciones sensibles.
- Exportación limitada a información visible para el paciente.

## Revisión manual periódica

- [ ] Revisar solicitudes RGPD abiertas semanalmente.
- [ ] Probar restauración de copias en un entorno aislado.
- [ ] Revisar usuarios, sesiones revocadas y acceso de pacientes suspendidos.
- [ ] Comprobar que las comunicaciones son asistenciales/administrativas o tienen base de marketing separada.
- [ ] Revisar enlaces de Google y el proveedor real de correo.
- [ ] Documentar incidentes y pruebas de seguridad.
