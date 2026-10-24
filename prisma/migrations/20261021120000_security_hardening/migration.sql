-- Remediación de seguridad clínica, RGPD y control de acceso.
-- Revisar y aplicar con `prisma migrate deploy` en un entorno controlado.
-- No se elimina ni se reescribe ningún dato clínico existente.

-- 1. Sesiones versionadas y MFA de administración.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "mfaEnrollmentSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "mfaEnrollmentExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mfaRecoveryCodesHash" TEXT,
  ADD COLUMN IF NOT EXISTS "mfaEnrolledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mfaLastVerifiedAt" TIMESTAMP(3);

-- 2. Trazabilidad de la revisión legal de solicitudes de derechos.
-- La solicitud debe sobrevivir al borrado del expediente para conservar la
-- evidencia de la supresión, por eso la FK pasa a SET NULL.
ALTER TABLE "DataSubjectRequest"
  ADD COLUMN IF NOT EXISTS "legalReviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalReviewedBy" TEXT,
  ALTER COLUMN "patientId" DROP NOT NULL;
ALTER TABLE "DataSubjectRequest" DROP CONSTRAINT IF EXISTS "DataSubjectRequest_patientId_fkey";
ALTER TABLE "DataSubjectRequest"
  ADD CONSTRAINT "DataSubjectRequest_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. La auditoría debe sobrevivir al borrado del usuario que la originó.
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Los planes nuevos no se publican ni se comparten por defecto.
ALTER TABLE "MealPlan" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "MealPlan" ALTER COLUMN "checklistPassed" SET DEFAULT false;
ALTER TABLE "MealPlan" ALTER COLUMN "isSharedWithPatient" SET DEFAULT false;

-- 5. Limitación de frecuencia compartida entre instancias.
CREATE TABLE IF NOT EXISTS "RateLimitCounter" (
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "RateLimitCounter_windowStart_idx"
  ON "RateLimitCounter"("windowStart");
