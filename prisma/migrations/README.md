# Migraciones de base de datos

## Estado actual

| Migración | Contenido |
| --- | --- |
| `20261021000000_baseline` | Esquema completo existente antes de la remediación (generado desde `HEAD`). No se ejecuta sobre una base ya creada. |
| `20261021120000_security_hardening` | Sesiones versionadas, MFA, revisión legal de solicitudes RGPD, FK `SetNull`, valores por defecto seguros de planes y tabla de rate limiting. |

La migración de hardening es incremental y no elimina datos clínicos. Sí cambia
constraints y valores por defecto; revisa el SQL antes de aplicarlo.

### Estado en producción (24/10/2026)

- Baseline marcado como aplicado con `prisma migrate resolve --applied`.
- `20261021120000_security_hardening` **aplicada en producción** con
  `migrate deploy` el 24/10/2026.
- `_prisma_migrations` contiene las dos migraciones, finalizadas, y
  `prisma migrate status` responde «Database schema is up to date». Los
  checksums registrados coinciden con los archivos de migración.
- Verificado tras la migración: 39 tablas, 3 pacientes, 3 usuarios, 0
  documentos, 0 fotos, 4 cuestionarios, 3 solicitudes, 64 eventos de auditoría,
  0 huérfanos, FK en `SET NULL`, `RateLimitCounter` creada y defaults de
  `MealPlan` correctos.
- El esquema ya soporta el código actual. **Al desplegar el código**, las
  sesiones existentes se invalidarán y la administración exigirá enrolar MFA
  TOTP. El despliegue sigue pendiente de la configuración de Supabase Storage.
- Backups: `pg_dump` pre-baseline (505.653 bytes) y pre-migración (507.058
  bytes), verificados y restaurados en un PostgreSQL 17.11 aislado con
  recuentos idénticos. Ver `docs/data-retention-and-backups.md`.

## Base de datos existente (creada con `db push` o SQL manual)

Una base existente no tiene historial de Prisma. Si se ejecuta `migrate deploy`
sin más, Prisma intentará aplicar el baseline y fallará porque las tablas ya
existen. El procedimiento correcto es:

1. **Backup completo y restaurable** de la base de datos. No continúes sin él.
2. Comprueba que el esquema actual coincide con el baseline. Si hay diferencias,
   no marques el baseline como aplicado: reconcilia primero el esquema.
3. Marca el baseline como ya aplicado (no lo ejecuta):

   ```bash
   npx prisma migrate resolve --applied 20261021000000_baseline
   ```

4. Aplica la migración incremental:

   ```bash
   npx prisma migrate deploy
   ```

5. Verifica el estado:

   ```bash
   npx prisma migrate status
   ```

Si el proyecto ya tiene tabla `_prisma_migrations` y el baseline aparece como
aplicado, salta el paso 3 y ejecuta directamente `migrate deploy`.

## Base de datos nueva

```bash
npx prisma migrate deploy
```

Aplica el baseline y, después, el hardening. No uses `prisma db push` para
preparar una base de producción: deja el historial de migraciones sin registrar.

## Verificación previa recomendada

Con una copia de la base o en un entorno de staging:

```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

El resultado debe estar vacío (o contener solo diferencias conscientes y
revisadas). Si aparecen tablas o columnas inesperadas, detente y revisa el
estado real antes de aplicar nada.

## Reglas de operación

- **Nunca** ejecutes `prisma migrate dev` ni `prisma migrate reset` contra
  producción: `migrate dev` puede intentar resetear la base si detecta drift.
- No edites una migración que ya se haya aplicado. Crea una nueva.
- Las migraciones son forward-only. Para revertir, restaura el backup o aplica
  un SQL de reversión revisado y registra una nueva migración.
- No apliques el baseline con `migrate deploy` sobre una base existente.
- No despliegues el código nuevo antes de que exista `RateLimitCounter` y las
  columnas de MFA/sesión: los flujos con rate limiting fallan cerrados.

## Efectos del despliegue

- **Todas las sesiones existentes quedarán invalidadas** al añadir
  `sessionVersion` con valor `0`: los tokens antiguos no contienen ese campo.
  Los usuarios deberán volver a iniciar sesión.
- El acceso de administración exigirá MFA TOTP. Sin MFA, solo se podrá acceder
  a Configuración para completar el alta.
- `AUTH_SECRET` debe ser estable y estar configurado antes de guardar secretos
  MFA; se usa para cifrarlos con AES-256-GCM. Cambiarlo impide descifrarlos.
  En Vercel ya está definido un `AUTH_SECRET` dedicado (24/10/2026); no lo rotes
  sin planificar la migración de los secretos MFA.
- En producción, los archivos privados requieren `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY`. El fallback local no es apto para producción.
- La migración **no** rellena consentimientos históricos autoaceptados ni
  convierte URLs externas antiguas de documentos/fotos. Esos datos requieren
  una revisión y backfill separados.
