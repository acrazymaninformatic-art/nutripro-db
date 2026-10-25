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
5. Aprobar la tabla de conservación propuesta en `docs/data-retention-and-backups.md` (expediente clínico, facturación, consentimientos, auditoría, correo, exportaciones y copias de seguridad).
6. Completar el registro de actividades de tratamiento, análisis de riesgos y, si procede, evaluación de impacto por datos de salud y menores.
7. Documentar el procedimiento de verificación del representante legal de menores, conflictos de patria potestad y transición al alcanzar la mayoría de edad.
8. Definir el procedimiento de brechas, responsables, evidencias, notificación a AEPD en su caso y comunicación a personas afectadas.
9. Revisar el uso real de Bizum/transferencias y las obligaciones fiscales, contables y de facturación; la app no procesa pagos online.
10. Rotar cualquier secreto compartido fuera del entorno seguro: **completado el 25/10/2026** para PostgreSQL (vía Management API y actualizado en Vercel/local) y `AUTH_SECRET` (aleatorio dedicado). Ningún `.env` se publica en Git.
11. Configurar Supabase Storage: **completado el 25/10/2026**. Bucket privado `patient-private` (15 MB, MIME restringidos), pruebas reales de subida/descarga/URL firmada superadas y variables configuradas en Vercel.

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
- Cabeceras de seguridad, CSP, no-cache en áreas sensibles, control de roles y auditoría de acciones sensibles.
- Sesiones firmadas con versión de credenciales, revocación inmediata y MFA TOTP obligatorio para administración.
- Limitación de frecuencia compartida en base de datos para login, recuperación y operaciones sensibles.
- Documentos, fotografías y adjuntos en almacenamiento privado; sin URLs públicas ni borradores clínicos en `localStorage`.
- Exportación administrativa completa con auditoría y exportación self-service limitada a la información visible en el portal.
- Supresión definitiva solo mediante solicitud RGPD, confirmación de revisión legal y notas; la solicitud y la auditoría sobreviven al expediente.
- **Pendiente de revisión legal:** alcance de la exportación y de la supresión. Ver `docs/legal-review-export-erasure.md`.
- **Verificación técnica (24/10/2026):** `tsc`, 107 tests, lint sin errores, build de producción (`prisma generate && next build`) y `npm audit` (0 vulnerabilidades en producción y desarrollo) correctos. Pruebas manuales en entorno aislado de MFA, consentimiento, portal, archivos privados, exportación, supresión bloqueada/abortada/completada y PWA.

## Verificación sobre producción (24/10/2026)

- Inventario de solo lectura: 37 tablas, 3 pacientes, 3 usuarios, 0 documentos,
  0 fotografías, 4 cuestionarios y 3 solicitudes de derechos. **0 archivos
  externos** que migrar.
- Conexión Prisma y `SELECT 1`: correctas.
- SMTP real: conexión y autenticación correctas con TLS estricto. No se enviaron
  correos a pacientes.
- Backup lógico verificado por hash y **restaurado con éxito** en un PostgreSQL
  17.11 aislado, con recuentos idénticos.
- Baseline `20261021000000_baseline` marcado como aplicado y verificado.
- `20261021120000_security_hardening` **aplicada en producción el 24/10/2026**
  con `migrate deploy`, tras ensayarla sobre una restauración real. Verificado:
  39 tablas, recuentos intactos, 0 huérfanos, FK en `SET NULL`,
  `RateLimitCounter` creada, ambas migraciones finalizadas y
  `prisma migrate status` al día.
- El esquema de producción ya soporta el código actual. El código **se desplegó
  el 24/10/2026** (hardening `7d50103` y ajuste de caché `c948915`; alias
  `https://nutripro-lyart.vercel.app`). Al desplegarse, las sesiones existentes
  quedaron invalidadas y la administración exigirá enrolar MFA TOTP en el
  siguiente acceso.
- **Almacenamiento privado (Supabase Storage):** configurado y verificado el 25/10/2026. Bucket privado `patient-private` (15 MB, MIME clínicos restringidos). Pruebas de integración reales superadas (subida 200, descarga autenticada 200, denegación sin auth 400, URL firmada 200, borrado 200). Variables `SUPABASE_URL`, `SUPABASE_STORAGE_BUCKET` y `SUPABASE_SERVICE_ROLE_KEY` (Secret) configuradas en Vercel (producción y preview); desarrollo aislado en almacenamiento local.
- **Rotación de credenciales PostgreSQL:** completada el 25/10/2026 vía Supabase Management API. Variables `DATABASE_URL` y `DIRECT_URL` actualizadas en Vercel y verificadas de extremo a extremo contra la base de datos de producción mediante Server Actions y limitación de frecuencia.
- **`AUTH_SECRET`:** definido en Vercel (producción, preview y desarrollo) el
  24/10/2026, con un valor aleatorio dedicado. Ya no depende de
  `NEXTAUTH_SECRET`; no debe rotarse sin planificar la migración de los secretos
  MFA.
- **Smoke test del despliegue (25/10/2026):** tras el redeploy a producción con las credenciales rotadas y Storage activo, `/login` responde 200 con
  `Cache-Control: private, no-cache, no-store` y CSP; `/legal` 200 con CSP;
  `/dashboard` 307 a login; `/api/private-files/...` y API sin sesión 401 con
  `Cache-Control: private, no-store`. No se ha probado el login completo con MFA
  porque no hay credenciales de una cuenta real. El alias
  `nutripro-eva-698a.vercel.app` está protegido por Vercel Authentication.
- Detalle y política: `docs/data-retention-and-backups.md`.

## Revisión manual periódica

- [ ] Revisar solicitudes RGPD abiertas semanalmente.
- [x] Probar restauración de copias en un entorno aislado (24/10/2026; repetir trimestralmente).
- [ ] Revisar usuarios, sesiones revocadas y acceso de pacientes suspendidos.
- [ ] Comprobar que las comunicaciones son asistenciales/administrativas o tienen base de marketing separada.
- [ ] Revisar enlaces de Google y el proveedor real de correo.
- [ ] Documentar incidentes y pruebas de seguridad.
