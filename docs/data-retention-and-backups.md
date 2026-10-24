# Retención de datos y copias de seguridad

> **Borrador técnico pendiente de aprobación legal.** Este documento describe
> qué datos existen, durante cuánto tiempo se propone conservarlos y cómo se
> protegen las copias. No es asesoramiento jurídico. Los plazos marcados como
> «propuesta» deben ser confirmados por la asesoría jurídica y la responsable
> del tratamiento antes de aplicarse.

## 1. Hechos verificados (24/10/2026)

Comprobaciones realizadas en solo lectura sobre producción, salvo las
operaciones indicadas expresamente:

| Comprobación | Resultado |
| --- | --- |
| Motor y versión | PostgreSQL 17.11 (Supabase, pooler `aws-1-eu-central-1`) |
| Tamaño de la base | 14 MB |
| Tablas en `public` | 39 tras la migración de hardening (37 + `RateLimitCounter` + `_prisma_migrations`) |
| Pacientes / usuarios | 3 / 3 |
| Documentos / fotografías | 0 / 0 |
| Cuestionarios | 4 |
| Solicitudes de derechos | 3 |
| Archivos externos (`fileUrl`/`photoUrl`/adjuntos sin `private://`) | **0** |
| Conexión Prisma (`SELECT 1`) | Correcta |
| SMTP (`smtp.gmail.com:465`, TLS estricto) | Conexión y autenticación correctas |
| `_prisma_migrations` | Creada al marcar el baseline |
| Baseline `20261021000000_baseline` | Marcado como aplicado y verificado |
| Migración `20261021120000_security_hardening` | **Aplicada en producción el 24/10/2026** y verificada: 39 tablas, recuentos intactos, FK `SET NULL`, sin drift |
| Almacenamiento privado en producción | **No configurado** (ver §7) |

### Copia previa al baseline (destruida)

- Formato: `pg_dump` personalizado (`-Fc`), PostgreSQL 17.11.
- Tamaño: 505.653 bytes; 639 entradas en el índice TOC.
- SHA-256: `2a6c82171949fb264ffa874fc69ac7992c442e7492a117c505e98bc2b4ca8e0b`.
- Restauración de prueba: clúster PostgreSQL 17.11 aislado, esquema `public`,
  `pg_restore --no-owner --no-privileges`. Resultado: 37 tablas y recuentos
  idénticos al inventario previo (3 pacientes, 3 usuarios, 0 documentos, 0
  fotos, 4 cuestionarios, 3 solicitudes).
- Se tomó **antes** de marcar el baseline y no incluye `_prisma_migrations`.
- **Destruida el 24/10/2026** al quedar sustituida por la copia pre-migración,
  que sí incluye el baseline y fue restaurada y verificada. El archivo se
  sobrescribió con bytes aleatorios y se borró. El registro de destrucción
  (fecha, tamaño y hash) se conserva en
  `%LOCALAPPDATA%\NutriPro\backups\destruction-pre-baseline-2026-10-24.json`.

### Copia previa a la migración (24/10/2026)

- Volcado `pg_dump` personalizado: 507.058 bytes, 642 entradas TOC.
- SHA-256: `416f16454e16cffe4b11cb390742e66d6e3c4559ba2c3d4cc74cab8fc28258fc`.
- Incluye `_prisma_migrations` con el baseline ya marcado.
- **Ubicación:** `%LOCALAPPDATA%\NutriPro\backups\`, fuera del repositorio y de
  carpetas sincronizadas con la nube.
- **Cifrado:** EFS de Windows sobre NTFS, AES-256, ligado a la cuenta local.
- **ACL:** herencia deshabilitada; solo el usuario local puede leer, escribir y
  borrar. Manifiesto `.sha256.json` junto al volcado.
- **Restauración verificada el 24/10/2026:** `pg_restore --schema=public
  --no-owner --no-privileges` en un PostgreSQL 17.11 aislado. Resultado: 38
  tablas públicas, 3 pacientes, 3 usuarios, 4 cuestionarios, 3 solicitudes, 64
  eventos de auditoría, 1 migración y 0 huérfanos.
- Es la copia de referencia para revertir la migración de hardening.
- **Limitación:** al no haber agente de recuperación EFS, la copia depende de la
  cuenta de Windows. Antes de usarla como respaldo de disaster recovery hay que
  exportar el certificado o moverla a un almacén externo aprobado. Hoy es una
  copia local de reversión, no una copia offsite.

### Ensayo de la migración de seguridad

Sobre una segunda restauración de la misma copia se reprodujo el procedimiento
de producción:

1. `prisma migrate resolve --applied 20261021000000_baseline`.
2. `prisma migrate deploy` → aplicó `20261021120000_security_hardening` sin
   errores.
3. Verificación: 39 tablas (37 + `RateLimitCounter` + `_prisma_migrations`),
   recuentos intactos (3/3/0/0/4/3), 64 eventos de auditoría, 0 huérfanos,
   FK `DataSubjectRequest` y `AuditLog` en `SET NULL`, 3 usuarios con
   `sessionVersion = 0`.
4. `prisma migrate diff` contra el modelo: migración vacía (sin drift).

Conclusión: la migración es aplicable sobre los datos reales sin pérdida ni
reescritura. Se aplicó en producción el 24/10/2026 con el mismo resultado y se
verificó a continuación (39 tablas, recuentos intactos, 0 huérfanos, FK
`SET NULL`, ambas migraciones finalizadas).

## 2. Categorías y plazos propuestos

Los plazos son una propuesta de trabajo. La asesoría debe confirmarlos y, si
procede, ajustarlos por normativa autonómica, colegial o contractual.

| Categoría | Contenido | Plazo propuesto | Base / motivo | ¿Borrado con el expediente? |
| --- | --- | --- | --- | --- |
| Historia clínica | Consultas, antropometría, planes, análisis, seguimiento, anamnesis | 5 años desde el alta del proceso asistencial (mínimo legal, Ley 41/2002 art. 17) | Asistencial y defensa de reclamaciones | Sí, actualmente |
| Consentimientos | Privacidad, condiciones, datos de salud, representación de menores | Ligado a la historia clínica (5 años) | Prueba del consentimiento | Sí, actualmente |
| Documentos y fotografías clínicas | PDF, imágenes, adjuntos | Ligado a la historia clínica (5 años) | Asistencial | Sí, actualmente |
| Facturación | Facturas y datos fiscales | 6 años (Código de Comercio art. 30) | Obligación contable y fiscal | **No**: se conserva con `patientId = NULL` |
| Solicitudes de derechos | Solicitud, resolución, notas de revisión | 5 años | Evidencia de cumplimiento y defensa | **No**: sobrevive con `patientId = NULL` |
| Auditoría de seguridad | Accesos, exportaciones, cambios sensibles | 2 años (propuesta) | Seguridad y trazabilidad | **No** |
| Correos enviados | `EmailLog` con contenido y destinatario | 5 años si es comunicación clínica; 1 año si es administrativa | Asistencial / prueba de envío | Sí |
| Exportaciones | JSON entregado al paciente o a un tercero | 1 año en almacén seguro, o destrucción tras la entrega | Prueba de entrega | Fuera de la base de datos |
| Solicitudes de cita no convertidas | Nombre, contacto, motivo | 1 año | Gestión y seguimiento | No aplica |
| Copias de seguridad | Volcado completo de la base | 30 días (propuesta), salvo PITR contratado | Recuperación ante incidentes | Se rigen por su propio ciclo |

### 2.1 Decisiones que debe tomar la asesoría

1. **Historia clínica y supresión.** El borrado actual elimina el expediente
   completo. Si existe obligación de conservar la historia clínica, la
   supresión del art. 17 RGPD no ampara el borrado total (art. 17.3.b). Hay dos
   opciones:
   - **A (recomendada):** bloqueo de la supresión cuando exista obligación de
     conservación, con un estado de «retención legal» que conserve el mínimo
     necesario y elimine el resto.
   - **B:** mantener el borrado total y documentar que la responsable valora
     cada solicitud caso a caso antes de ejecutarla.
2. **Facturas.** Confirmar si basta con conservarlas sin `patientId` o si deben
   conservar datos identificativos por requerimiento fiscal.
3. **Auditoría.** Confirmar el plazo y si puede contener datos de terceros o
   notas internas que deban redactarse.
4. **Menores.** Plazo de conservación y transición al alcanzar la mayoría de
   edad; quién puede solicitar la supresión.
5. **Plazo de backups.** Confirmar 30 días o el periodo que ofrezca el plan de
   Supabase contratado.

## 3. Copias de seguridad: política operativa

### 3.1 Qué se protege

- Base de datos PostgreSQL (Supabase).
- Objetos del bucket privado `patient-private` (documentos, fotos y adjuntos).
- Variables de entorno y secretos (gestión separada, nunca en Git).

### 3.2 Frecuencia y retención propuestas

| Elemento | Frecuencia | Retención | Responsable |
| --- | --- | --- | --- |
| Backup automático de Supabase | Diario (según plan) | 7–30 días (verificar plan) | Proveedor |
| PITR (si está contratado) | Continuo | 7 días (verificar) | Proveedor |
| Volcado lógico antes de migraciones | Antes de cada cambio de esquema | Hasta validar el cambio | Responsable técnico |
| Prueba de restauración | Trimestral | Evidencia de la prueba | Responsable técnico |

- **RPO propuesto:** 24 h sin PITR; 5 min con PITR.
- **RTO propuesto:** 4 h para recuperar el servicio en un entorno limpio.
- Verificar en el panel de Supabase el plan real, la retención y si PITR está
  activo. **No se ha podido comprobar con las credenciales disponibles.**

### 3.3 Reglas de una copia

1. Cifrada en reposo (AES-256) si se descarga fuera del proveedor.
2. Acceso restringido a la responsable y al responsable técnico, con MFA.
3. Nunca en el repositorio, en `public/` ni en una carpeta sincronizada con
   nube personal.
4. Registrar fecha, tamaño, hash y resultado de la restauración de prueba.
5. Destruir la copia local cuando deje de ser necesaria y dejar constancia.
6. Probar la restauración en un proyecto o clúster aislado, nunca sobre
   producción.

### 3.4 Procedimiento de restauración

1. Crear un entorno aislado con la misma versión de PostgreSQL.
2. Restaurar el volcado con `pg_restore --no-owner --no-privileges`.
3. Comprobar recuentos de tablas críticas y integridad referencial.
4. Revisar que no se hayan restaurado credenciales o secretos obsoletos.
5. Si la restauración sustituye producción, **reaplicar las supresiones
   pendientes** antes de abrir el servicio (ver §4).
6. Registrar el resultado y cerrar el incidente.

## 4. Supresión y copias de seguridad

El borrado definitivo elimina los datos vivos y los objetos privados, pero no
reescribe copias históricas. Procedimiento propuesto:

1. Ejecutar la supresión en producción y conservar la solicitud `COMPLETED`.
2. Anotar la fecha y el alcance en la solicitud y en la auditoría.
3. Las copias anteriores caducan por su ciclo de retención (máximo 30 días).
4. Si se restaura una copia anterior a la supresión, localizar las solicitudes
   `COMPLETED` y volver a ejecutar el borrado antes de reabrir el servicio.
5. No prometer al interesado un borrado inmediato de copias históricas: indicar
   el plazo máximo y el procedimiento.

**Limitación actual:** no existe una lista de supresiones que se aplique
automáticamente tras una restauración. Es un control manual documentado en este
procedimiento. Si el volumen crece, debe automatizarse.

## 5. Retención legal selectiva (gap conocido)

Hoy `executeErasure` borra el expediente completo y conserva:

- facturas con `patientId = NULL`;
- la solicitud de derechos con `patientId = NULL`;
- la auditoría.

No existe un estado de «retención legal» que permita conservar únicamente los
datos exigidos por ley y borrar el resto. Hasta que la asesoría decida (§2.1),
**no deben ejecutarse supresiones sobre datos reales sin revisar antes si hay
obligación de conservación**.

## 6. Evidencia de la prueba del 24/10/2026

| Paso | Resultado |
| --- | --- |
| Inventario de solo lectura | 37 tablas, 0 archivos externos |
| Volcado lógico | 505.653 bytes, 639 entradas TOC |
| Volcado pre-migración | 507.058 bytes, 642 entradas TOC |
| Verificación de archivo | SHA-256 correcto en ambos antes de destruir el pre-baseline |
| Restauración aislada | Correcta, recuentos idénticos |
| Baseline de Prisma | Marcado y verificado |
| Migración de seguridad | Aplicada en producción y verificada |
| Integridad de migraciones | Checksums de baseline y hardening coinciden con los archivos |
| Custodia local | Pre-migración cifrada con EFS AES-256, ACL restringida, fuera del repo |
| Destrucción del pre-baseline | Sobrescritura con bytes aleatorios y borrado; registro conservado |

Los clústeres temporales se eliminaron al terminar. Se conserva únicamente la
copia pre-migración cifrada en `%LOCALAPPDATA%\NutriPro\backups\`; la copia
pre-baseline se destruyó al quedar sustituida. La custodia offsite sigue
pendiente.

## 7. Bloqueo detectado: almacenamiento privado en producción

El código con almacenamiento privado **se desplegó el 24/10/2026** (commits
`7d50103` y `c948915`). La configuración de Supabase Storage sigue pendiente; el despliegue
no la incluye porque la base tenía 0 archivos y el resto de mejoras de seguridad
eran prioritarias.

La consulta a las variables de entorno del proyecto de Vercel
(`nutripro`, producción y resto de entornos) muestra que **no existen**
`SUPABASE_URL` ni `SUPABASE_SERVICE_ROLE_KEY`. En producción,
`savePrivateFile` lanza un error explícito si faltan, de modo que **cualquier
subida de documento, fotografía o adjunto fallará** y la supresión estricta
tampoco podrá confirmar el borrado.

El servicio de Storage del proyecto responde (`/storage/v1/version` → 200),
pero sin la service role key no se puede listar ni crear el bucket. No es un
problema de código: falta configuración. Antes de publicitar la subida de
archivos hay que:

1. Crear el bucket privado `patient-private` en Supabase Storage.
2. Añadir `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel (producción y
   preview), marcadas como secretas.
3. Redesplegar y probar una subida y una descarga firmada reales.
4. Verificar que el bucket es privado y que la service role key no llega al
   cliente.

Mientras tanto, la base de datos no contiene documentos ni fotos (0/0), por lo
que no hay archivos que migrar.

## 8. Pendientes

- [ ] Aprobar los plazos de §2.
- [ ] Decidir el modelo de retención legal (§2.1).
- [ ] Verificar plan, retención y PITR de Supabase.
- [x] Destruir la copia pre-baseline redundante y cifrar la pre-migración
      (24/10/2026; EFS AES-256, ACL restringida).
- [ ] Mover la copia pre-migración a un almacén externo aprobado o exportar el
      certificado EFS; hoy depende de la cuenta de Windows.
- [ ] Configurar Supabase Storage y probar una subida real.
- [x] Aplicar `20261021120000_security_hardening` con `migrate deploy`
      (24/10/2026, verificado).
- [ ] Programar la primera prueba de restauración trimestral.
