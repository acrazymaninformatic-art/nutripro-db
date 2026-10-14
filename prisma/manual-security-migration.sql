-- Run once in Supabase SQL Editor after restoring database connectivity.
-- This migration is additive: it does not alter or delete existing patient data.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "anamnesisAccessTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "anamnesisAccessTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "consentAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "consentPolicyVersion" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Patient_anamnesisAccessTokenHash_key"
  ON "Patient"("anamnesisAccessTokenHash");

-- New patients use non-sequential UUIDs. Existing CUID identifiers are preserved.
ALTER TABLE "Patient"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Gestión de acceso, derechos RGPD, agenda y cobros. Todas las operaciones son aditivas.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordResetRequestedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetTokenHash_key"
  ON "User"("passwordResetTokenHash");

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "consentRevokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "consentRevocationReason" TEXT;

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "rescheduleTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "rescheduleTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_rescheduleTokenHash_key"
  ON "Appointment"("rescheduleTokenHash");
CREATE INDEX IF NOT EXISTS "Appointment_date_idx" ON "Appointment"("date");

CREATE TABLE IF NOT EXISTS "WaitlistEntry" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "preferredFrom" TIMESTAMP(3), "preferredTo" TIMESTAMP(3), "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'WAITING', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WaitlistEntry_userId_status_idx" ON "WaitlistEntry"("userId", "status");
CREATE INDEX IF NOT EXISTS "WaitlistEntry_patientId_idx" ON "WaitlistEntry"("patientId");

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "patientId" TEXT REFERENCES "Patient"("id") ON DELETE SET NULL, "number" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL, "amountCents" INTEGER NOT NULL, "paidCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'EUR', "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "dueDate" TIMESTAMP(3), "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3), "paymentMethod" TEXT, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Invoice_userId_status_idx" ON "Invoice"("userId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_patientId_idx" ON "Invoice"("patientId");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY, "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
  "amountCents" INTEGER NOT NULL, "method" TEXT NOT NULL, "reference" TEXT, "notes" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");

CREATE TABLE IF NOT EXISTS "DataSubjectRequest" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "requestType" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "notes" TEXT,
  "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DataSubjectRequest_userId_status_idx" ON "DataSubjectRequest"("userId", "status");
CREATE INDEX IF NOT EXISTS "DataSubjectRequest_patientId_idx" ON "DataSubjectRequest"("patientId");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "patientId" TEXT REFERENCES "Patient"("id") ON DELETE SET NULL, "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL, "entityId" TEXT, "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_patientId_idx" ON "AuditLog"("patientId");

-- Seguimiento clínico estructurado para mostrar evolución de adherencia, digestión y hábitos.
CREATE TABLE IF NOT EXISTS "ClinicalCheckIn" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "adherencePct" INTEGER NOT NULL,
  "digestionScore" INTEGER,
  "habitsScore" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicalCheckIn_adherencePct_range" CHECK ("adherencePct" BETWEEN 0 AND 100),
  CONSTRAINT "ClinicalCheckIn_digestionScore_range" CHECK ("digestionScore" IS NULL OR "digestionScore" BETWEEN 0 AND 10),
  CONSTRAINT "ClinicalCheckIn_habitsScore_range" CHECK ("habitsScore" IS NULL OR "habitsScore" BETWEEN 0 AND 10)
);
CREATE INDEX IF NOT EXISTS "ClinicalCheckIn_patientId_date_idx" ON "ClinicalCheckIn"("patientId", "date");
