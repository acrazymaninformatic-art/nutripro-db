# Paquete de revisión legal · exportación y supresión

> Documento técnico de apoyo. No es asesoramiento jurídico ni sustituye la
> revisión de una profesional. Su objetivo es que la revisión legal se haga
> sobre hechos concretos: qué se exporta, qué se suprime, qué evidencia queda y
> qué decisiones siguen abiertas.

## 1. Alcance de esta revisión

Se revisan dos derechos del interesado:

1. **Acceso y portabilidad** (RGPD arts. 15 y 20): exportación de datos desde
   el panel de la profesional y desde el portal del paciente.
2. **Supresión** (RGPD art. 17): borrado definitivo del expediente, con
   revisión legal previa y conservación de la trazabilidad de la solicitud.

Quedan fuera de este documento la rectificación, la limitación, la oposición,
la conservación documental obligatoria y el régimen de menores, aunque se
mencionan cuando afectan a la exportación o a la supresión.

## 2. Exportación administrativa

**Código:** `src/app/dashboard/patients/actions.ts` (`exportPatientData`).

- Requiere sesión de administración con MFA activo (`requireUserId` →
  `requireAdmin`).
- Solo puede exportar un paciente cuyo `userId` coincide con la profesional
  autenticada.
- Genera un JSON con el expediente completo: datos identificativos, medidas,
  consultas, planes y comidas, análisis, citas, anamnesis, seguimiento,
  consentimientos, documentos y fotografías (metadatos), correos, cribados,
  cuestionarios, solicitudes de derechos y hasta 5.000 eventos de auditoría.
- No incluye los binarios de documentos ni fotografías. Incluye sus metadatos,
  el tipo de almacenamiento y la referencia privada. La descarga de binarios se
  hace por la ruta autenticada `/api/private-files/...`.
- Registra `PATIENT_DATA_EXPORTED` en auditoría con el usuario, el paciente y
  la fecha.
- El JSON declara expresamente que la base legal es el derecho de acceso y
  portabilidad y que la revisión legal está pendiente antes de entregarlo a
  terceros.

**Preguntas para revisión legal**

- ¿Debe incluirse la auditoría completa del paciente o solo los eventos
  relevantes? La auditoría puede contener datos de terceros y notas internas.
- ¿Deben incluirse las notas clínicas internas, las hipótesis diagnósticas y
  los campos de revisión profesional, o pueden entregarse con redacción?
- ¿Cómo se entregan los binarios (documentos, fotos, analíticas) de forma
  segura y trazable? Actualmente se descargan por separado con la sesión de la
  profesional.
- ¿Qué plazo y formato de entrega se documentan para el derecho de acceso?
- ¿Debe firmarse un recibo o conservarse una copia de lo entregado?

## 3. Exportación desde el portal del paciente

**Código:** `src/app/paciente/config-actions.ts`
(`exportPatientDataAction`).

- Requiere sesión de paciente con portal activo, consentimientos vigentes y
  paciente activo/no borrado (`requirePatient`).
- Bloqueada en la vista previa de administración.
- Genera un JSON con:
  - datos identificativos y de contacto;
  - antropometría **publicada** al paciente;
  - planes **compartidos** con el paciente;
  - citas y revisiones;
  - consentimientos firmados (sin firma gráfica ni IP);
  - envíos de anamnesis/cuestionarios.
- No incluye consultas clínicas internas, notas profesionales, planes no
  compartidos, documentos, fotografías, auditoría ni solicitudes de derechos.
- Registra `PATIENT_DATA_EXPORTED_SELF_SERVICE` en auditoría.
- El nombre del archivo y el texto de formato mencionan portabilidad
  (art. 20), aunque parte del contenido es de acceso (art. 15).

**Preguntas para revisión legal**

- ¿El alcance actual es suficiente para el derecho de acceso? Si el paciente
  tiene derecho a toda su información clínica, habría que incluir consultas,
  notas y documentos, con las cautelas del apartado anterior.
- ¿La exclusión de documentos y fotografías es una decisión de producto o un
  incumplimiento? Si se incluyen, ¿cómo se entregan sin enlaces permanentes?
- ¿Debe registrarse una solicitud formal de exportación o basta la auditoría
  de la descarga?
- ¿Cómo se evita que la exportación se use para extraer datos de terceros
  (por ejemplo, notas que mencionan a otras personas)?
- ¿Procede limitar la frecuencia de exportación y advertir al paciente?

## 4. Supresión definitiva

**Código:** `src/app/dashboard/patients/privacy-actions.ts`
(`resolveDataSubjectRequest` → `executeErasure`).

Flujo actual:

1. La profesional registra una solicitud `ERASURE` desde la ficha.
2. La solicitud queda `PENDING`/`IN_PROGRESS` y es visible en operaciones.
3. Para ejecutarla, la profesional debe:
   - marcar la confirmación expresa de revisión legal;
   - escribir notas con la base jurídica y el alcance;
   - confirmar la acción.
4. Antes de reclamar la solicitud se ejecuta un **preflight**: se leen los
   documentos, fotos y adjuntos de cuestionario y se comprueba que todas las
   referencias son claves privadas válidas. Si hay una URL externa heredada o
   un adjunto ilegible, se aborta **sin reclamar** la solicitud, que permanece
   `PENDING`.
5. La solicitud se reclama de forma atómica (`PENDING`/`IN_PROGRESS` →
   `IN_PROGRESS`) para impedir dos ejecuciones simultáneas. Después se borran
   los objetos privados de:
   - documentos;
   - fotografías;
   - adjuntos de cuestionarios.
   Si el almacenamiento falla, la operación se aborta. Si el objeto ya no
   existe (404/ENOENT), se considera correcto.
6. Si el borrado falla después de reclamar la solicitud (por ejemplo, una
   clave privada corrupta), la solicitud vuelve a `PENDING`, se registra
   `RGPD_ERASURE_FAILED` y el expediente queda intacto para poder reintentar
   tras corregir la causa.
7. Si el borrado de archivos termina bien, en una transacción:
   - se crea el evento de auditoría con recuentos y notas de revisión;
   - la solicitud pasa a `COMPLETED`, con `legalReviewedAt` y
     `legalReviewedBy`;
   - se borra el paciente. El borrado en cascada elimina sus datos clínicos y
     su usuario de portal.
8. La solicitud conserva `patientId = NULL` y sobrevive al expediente. La
   auditoría también sobrevive.
9. Los registros de correo del paciente se eliminan expresamente. Las facturas
   se conservan con `patientId = NULL` por su posible valor contable y fiscal,
   y la auditoría se conserva como evidencia de seguridad. Ambas excepciones
   deben validarse en la revisión legal y, si procede, anonimizarse.

**Decisiones ya tomadas**

- El borrado definitivo no se ejecuta desde un botón directo: exige una
  solicitud y revisión legal.
- El borrado lógico (`isHardDeleted`/`isActive`) es distinto y no elimina
  datos; corta el acceso y permite restaurar el expediente.
- La restauración de un paciente no reactiva automáticamente el portal.
- La solicitud y la auditoría se conservan como evidencia de la supresión.
- **Archivos externos heredados:** la supresión se bloquea si el expediente
  contiene documentos, fotos o adjuntos con una URL que no sea `private://`.
  No se declara una supresión completa mientras existan copias fuera del
  almacenamiento privado. Antes de ejecutarla hay que inventariar esos
  archivos, migrarlos al storage privado o eliminarlos en el proveedor
  original y dejar evidencia. El error es accionable y la solicitud permanece
  `PENDING` para poder reintentarla tras la migración.
- **Fallo después de reclamar:** si el borrado falla con la solicitud ya
  reclamada, se libera a `PENDING`, se audita `RGPD_ERASURE_FAILED` y no se
  toca la base de datos. El expediente no queda atrapado en `IN_PROGRESS`.
- **Salida de la ficha:** si la supresión termina correctamente, la interfaz
  navega al directorio de pacientes con una confirmación, porque el expediente
  ya no existe y refrescar su ficha produciría un 404.

**Preguntas para revisión legal**

- ¿Qué datos deben conservarse pese a la supresión por obligación legal
  (facturación, historial clínico, seguros, reclamaciones)? Hoy no hay un
  mecanismo de retención legal selectiva: se borra el expediente completo.
- ¿Durante cuánto tiempo se conservan la solicitud y la auditoría? ¿Pueden
  contener datos personales del paciente?
- ¿Qué ocurre con copias de seguridad, réplicas y logs externos? La supresión
  no propaga el borrado a backups históricos. Hay que definir plazo y
  procedimiento.
- ¿Cómo se atiende una supresión cuando hay un menor o un conflicto de patria
  potestad?
- ¿Debe notificarse al paciente la ejecución y el alcance de lo conservado?
- ¿Procede bloquear la supresión si hay un litigio o una reclamación en curso?
  Hoy no existe un estado de retención legal.
- ¿Los documentos y fotos se borran antes de la transacción; es aceptable que
  un fallo posterior de base de datos deje el expediente sin esos archivos?
  El expediente seguiría existiendo y podría reintentarse la operación.

## 5. Controles técnicos que sostienen el proceso

- Sesiones firmadas con HMAC, `sessionVersion` y revocación inmediata.
- MFA TOTP obligatorio para administración; el alta pendiente se guarda
  cifrada en servidor y caduca a los 10 minutos.
- Rate limiting en login, recuperación de contraseña, cambio de contraseña,
  alta de MFA y anamnesis pública.
- Almacenamiento privado con claves opacas, bucket privado de Supabase en
  producción y ruta autenticada con comprobación de rol, ownership, MFA,
  consentimiento y estado del paciente.
- Sin borradores clínicos en `localStorage`.
- Service worker que no cachea HTML autenticado, API, documentos ni fotos.
- CSP y cabeceras de seguridad; `upgrade-insecure-requests` solo en producción.
- Auditoría de exportación, supresión, consentimientos, accesos y cambios de
  seguridad.

## 6. Riesgos residuales que deben quedar por escrito

1. **Backups:** no hay borrado propagado a copias históricas.
2. **Retención legal:** no hay excepción selectiva para datos que deban
   conservarse.
3. **Documentos antiguos:** pueden existir URLs externas heredadas. Ya no se
   sirven y la supresión definitiva se bloquea si quedan referencias externas;
   hay que inventariarlas, migrarlas o eliminarlas con evidencia antes de
   ejecutar el borrado. En el entorno aislado de verificación se sembró a
   propósito un documento con `https://example.com/legacy.pdf`: bloqueó la
   supresión y la solicitud permaneció `PENDING`.

   **Inventario de producción completado el 24/10/2026:** 0 documentos,
   0 fotografías y 0 adjuntos externos. La consulta usada fue:

   ```sql
   SELECT 'document' AS kind, id, "patientId", "fileUrl" AS reference
   FROM "PatientDocument" WHERE "fileUrl" NOT LIKE 'private://%'
   UNION ALL
   SELECT 'photo', id, "patientId", "photoUrl"
   FROM "ProgressPhoto" WHERE "photoUrl" NOT LIKE 'private://%'
   UNION ALL
   SELECT 'questionnaire_attachment', id, "patientId", "attachmentsJson"
   FROM "PatientQuestionnaire"
   WHERE "attachmentsJson" IS NOT NULL
     AND "attachmentsJson" NOT LIKE '%private://%';
   ```

   Para los adjuntos de cuestionario hay que revisar además el JSON completo:
   una fila puede mezclar adjuntos privados y externos.
4. **Consentimientos históricos:** pueden existir consentimientos
   autoaceptados antes de la remediación. Requieren revisión y, si procede,
   nueva firma.
5. **Exportación self-service:** el alcance es limitado y debe validarse.
6. **Binarios:** la exportación administrativa entrega metadatos, no los
   archivos; la entrega de binarios es un proceso aparte.
7. **CSP:** mantiene `'unsafe-inline'` por los scripts inline de Next; no hay
   nonce.
8. **Producción:** `AUTH_SECRET` está definido en Vercel desde el 24/10/2026.
   Siguen faltando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`; sin ellas el
   almacenamiento privado no es operativo y las subidas fallan. Ver
   `docs/data-retention-and-backups.md` §7.

## 7. Verificación técnica

Comprobado el 23–24/10/2026 sobre el árbol de trabajo. Las pruebas de código no
aplicaron migraciones ni desplegaron; la migración de producción se detalla al
final de esta sección:

- `npx tsc --noEmit`: correcto.
- `npm test`: 16 archivos y 107 tests correctos.
- `npm run lint`: 0 errores; warnings preexistentes de deuda técnica.
- `npm run build`: compila y genera las rutas con Next.js 16.4.3, sin el aviso
  de seguridad que bloqueaba la versión anterior.
- `npm audit`: 0 vulnerabilidades en dependencias de producción y de
  desarrollo tras actualizar `nodemailer` a 10.2.1 y `vitest` a 4.1.12.
  Los avisos cambian con el tiempo; debe repetirse antes de cada despliegue.
- **Producción (24/10/2026):** conexión de solo lectura con Prisma (`SELECT 1`)
  correcta; SMTP real verificado por conexión y autenticación (sin enviar
  correos a pacientes); inventario de archivos externos con resultado 0.
- **Despliegue (24/10/2026):** commit `7d50103` desplegado en Vercel
  (`https://nutripro-lyart.vercel.app`). Smoke test: `/login` 200 con
  `no-store` y CSP; `/legal` 200; `/dashboard` 307 a login;
  `/api/private-files/...` 401. El login completo con MFA no se pudo probar sin
  credenciales de una cuenta real.
- **Supabase Storage:** no se pudo probar porque el proyecto de Vercel no
  define `SUPABASE_URL` ni `SUPABASE_SERVICE_ROLE_KEY`. En producción las
  subidas fallan con un error explícito; es un bloqueo de configuración, no de
  código. Ver `docs/data-retention-and-backups.md` §7.
- **Backup:** volcado lógico de producción verificado por hash y restaurado en
  un PostgreSQL 17.11 aislado con recuentos idénticos. Baseline de Prisma
  marcado como aplicado. `security_hardening` se ensayó sobre la restauración y
  después se aplicó en producción el 24/10/2026: sin pérdida de datos, sin
  huérfanos y sin drift. Ver `docs/data-retention-and-backups.md` §1.

### 7.1 Pruebas manuales en entorno aislado (24/10/2026)

Entorno aislado con SQLite y un esquema temporal equivalente, con datos
sembrados y sin tocar producción ni aplicar migraciones. Al terminar se
restauró el cliente Prisma de PostgreSQL y se eliminaron la base y los archivos
temporales:

- **MFA y sesiones:** administración bloqueada sin TOTP (solo Configuración);
  alta de TOTP con QR y 10 códigos de recuperación; login con TOTP y con código
  de recuperación; `sessionVersion` invalida cookies tras cambio de contraseña.
- **Consentimiento:** retirada desde el panel, bloqueo de portal y sesiones,
  nueva aceptación versionada y reactivación auditada.
- **Vista previa:** banner de solo lectura, sin cambio de contraseña y
  expulsión sin cookie; paciente inválido redirige al directorio, sin 500.
- **Archivos privados:** paciente solo accede a lo compartido (200) y recibe
  404 en lo no compartido, fotos, claves corruptas y traversal; administración
  accede a todo con `Cache-Control: private, no-store, max-age=0`; accesos
  auditados como `PRIVATE_DOCUMENT_ACCESSED`/`PRIVATE_PHOTO_ACCESSED`.
- **Exportación administrativa:** 146.758 bytes, `exportVersion: "2.0"`,
  documentos y fotos solo como metadatos, sin `private://`, sin `fileUrl`, el
  documento externo marcado `LEGACY_EXTERNAL_URL` y sin URL; auditoría
  `PATIENT_DATA_EXPORTED`.
- **Exportación self-service:** JSON real, sin documentos, fotos, consultas
  internas ni notas profesionales; auditoría
  `PATIENT_DATA_EXPORTED_SELF_SERVICE`.
- **Supresión bloqueada:** documento externo heredado → mensaje accionable,
  solicitud `PENDING`, sin auditoría de fallo (el preflight ocurre antes de
  reclamar) y expediente intacto.
- **Supresión abortada:** clave privada corrupta → error visible, solicitud
  liberada a `PENDING`, auditoría `RGPD_ERASURE_FAILED`, paciente y documento
  intactos.
- **Supresión completa:** paciente con antropometría, consentimiento, cita,
  correo, documento y foto → todos los recuentos a 0, archivos eliminados del
  almacenamiento privado, `EmailLog` eliminado, solicitud `COMPLETED` con
  `patientId = NULL`, `legalReviewedAt/By` y notas, y auditoría
  `RGPD_ERASURE_EXECUTED` conservada.
- **Rechazo:** solicitud de María rechazada con motivo documentado y auditoría
  `RGPD_ERASURE_REJECTED`.
- **PWA:** service worker controla la página, solo cachea
  `/manifest.webmanifest`, `/logo.png`, `/icon-192.png` y `/icon-512.png`;
  JavaScript y CSS de `_next/static` responden 200 y **no** se cachean; una
  caché v2 con JS se purga al activar v3; en desarrollo no se registra y se
  desregistran workers previos.
- **Cabeceras:** `/login` responde `Cache-Control: no-store` con CSP,
  `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` y
  `Permissions-Policy`; manifest, `sw.js` y logos públicos son revalidables
  (`max-age=0`).

**Límites de las pruebas aisladas (§7.1):** no cubren SMTP real, Supabase
Storage real, PostgreSQL de producción, backups ni restauración. Esas
comprobaciones se hicieron por separado el 24/10/2026 y se detallan en §7 y en
`docs/data-retention-and-backups.md`; el despliegue y su smoke test también
están en §7. La revisión legal externa sigue pendiente.
Los datos y bases usados en el entorno aislado eran desechables y se eliminaron
al terminar.

## 8. Paquete de firma

### 8.1 Documentos que lo componen

1. Este documento (`legal-review-export-erasure.md`): alcance de exportación y
   supresión.
2. `legal-compliance-readiness.md`: estado de cumplimiento y bloqueos.
3. `data-retention-and-backups.md`: plazos propuestos, backups y restauración.
4. Textos legales publicados: aviso legal, privacidad, condiciones y cookies.
5. Evidencia técnica del 24/10/2026: inventario, hashes de backup, restauración
   verificada, SMTP, baseline, migración de seguridad aplicada, despliegue y
   smoke test.

### 8.2 Decisiones que se solicitan

| # | Decisión | Opción recomendada | Consecuencia si no se decide |
| --- | --- | --- | --- |
| 1 | Alcance de la exportación self-service | Mantener el alcance actual y documentarlo como acceso parcial; valorar incluir documentos por entrega segura | El paciente podría reclamar que faltan datos clínicos |
| 2 | Entrega de binarios | Entrega separada, autenticada y registrada, nunca por enlace público | Riesgo de exposición o de entrega incompleta |
| 3 | Conservación frente a supresión | Bloqueo por retención legal cuando exista obligación (opción A de `data-retention-and-backups.md` §2.1) | Borrados contrarios al art. 17.3.b RGPD |
| 4 | Facturas tras la supresión | Conservar sin identificadores clínicos; confirmar obligación fiscal | Pérdida de prueba contable o conservación excesiva |
| 5 | Plazo de auditoría y solicitudes | 2 y 5 años respectivamente (propuesta) | Conservación indefinida sin base |
| 6 | Plazo de backups | 30 días o el del plan contratado | Expectativa incorrecta en las respuestas a pacientes |
| 7 | Menores y representación | Procedimiento documentado y verificado antes del alta | Consentimientos inválidos |

### 8.3 Estado

- [ ] Revisión de la asesoría jurídica.
- [ ] Decisión sobre DPD y publicación del canal.
- [ ] Aprobación de los plazos de retención.
- [ ] Firma de la responsable del tratamiento.
- [ ] Firma de la asesoría / DPD.
- [ ] Firma del responsable técnico.

**Ninguna firma se ha completado.** Este paquete lo prepara el equipo técnico;
no sustituye la revisión ni la firma de un abogado o DPD. El agente no puede
firmar en nombre de terceros ni declarar cerrada la revisión.

### 8.4 Firmas

| Revisión | Nombre | Fecha | Observaciones |
| --- | --- | --- | --- |
| Responsable del tratamiento |  |  |  |
| Asesoría jurídica / DPD |  |  |  |
| Responsable técnico |  |  |  |

No ejecutar la supresión definitiva sobre datos reales hasta que esta revisión
esté cerrada y documentada. Tampoco deben publicitarse subidas de archivos
mientras falte la configuración de Supabase Storage descrita en
`data-retention-and-backups.md` §7.

### 8.5 Texto propuesto para el envío

> **Asunto:** Revisión legal de la puesta en producción de EVSoftware (RGPD,
> historiales y supresión)
>
> Hola:
>
> Adjunto el paquete de revisión legal de EVSoftware, la aplicación de gestión
> de la consulta. Incluye el alcance de exportación y supresión, el estado de
> cumplimiento, la política propuesta de retención y copias, los textos legales
> publicados y la evidencia técnica del 24/10/2026 (migración, despliegue,
> smoke test y restauración de una copia).
>
> Necesitamos que reviséis especialmente las siete decisiones de la sección 8.2
> del documento `legal-review-export-erasure.md`: alcance de la exportación,
> entrega de binarios, conservación frente a supresión, facturas, plazos de
> auditoría y solicitudes, plazo de backups y representación de menores.
>
> No se ejecutará ninguna supresión definitiva sobre datos reales ni se
> publicitará la subida de archivos hasta cerrar esta revisión y configurar el
> almacenamiento privado.
>
> Gracias.
