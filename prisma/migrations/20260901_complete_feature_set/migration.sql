-- Migration: 20260901_complete_feature_set
-- Adds: DisbursementLineItem, Member, PledgeContribution, PasswordResetToken, EmailVerificationToken, MfaChallenge
-- Changes: org-scoped uniques on ChartOfAccounts.code, Department.name, Vendor.name
-- Adds columns to DisbursementRequest: firstApprovedById, secondApprovedById, paymentMethod, paidAt, paymentReference, paymentNotes, updatedAt
-- Adds columns to LedgerEntry: reversedById (unique), reversalOf relation
-- Adds columns to User: emailVerified
-- Adds columns to Period: organizationId
-- Adds columns to AuditLog: organizationId
-- Extends DisbursementStatus: FIRST_APPROVED, PAID

-- 1. Create OrganizationId columns (nullable first for backfill safety)
ALTER TABLE "AuditLog" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Period" ADD COLUMN "organizationId" TEXT;

-- 1a. Backfill: derive AuditLog.organizationId from the user
UPDATE "AuditLog" a
SET "organizationId" = u."organizationId"
FROM "User" u
WHERE a."userId" = u."id" AND a."organizationId" IS NULL;

-- 2. Add new columns
ALTER TABLE "DisbursementRequest" ADD COLUMN "firstApprovedById" TEXT;
ALTER TABLE "DisbursementRequest" ADD COLUMN "secondApprovedById" TEXT;
ALTER TABLE "DisbursementRequest" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "DisbursementRequest" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "DisbursementRequest" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "DisbursementRequest" ADD COLUMN "paymentNotes" TEXT;
ALTER TABLE "DisbursementRequest" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "LedgerEntry" ADD COLUMN "reversedById" TEXT;
CREATE UNIQUE INDEX "LedgerEntry_reversedById_key" ON "LedgerEntry"("reversedById");

ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- 3. New enums must be created before the column alter
CREATE TYPE "DisbursementStatus_new" AS ENUM ('PENDING', 'FIRST_APPROVED', 'APPROVED', 'REJECTED', 'PAID');
ALTER TABLE "DisbursementRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DisbursementRequest" ALTER COLUMN "status" TYPE "DisbursementStatus_new" USING ("status"::text::"DisbursementStatus_new");
ALTER TYPE "DisbursementStatus" RENAME TO "DisbursementStatus_old";
ALTER TYPE "DisbursementStatus_new" RENAME TO "DisbursementStatus";
DROP TYPE "DisbursementStatus_old";
ALTER TABLE "DisbursementRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- 4. Drop old unique indexes
DROP INDEX IF EXISTS "ChartOfAccounts_code_key";
DROP INDEX IF EXISTS "Department_name_key";
DROP INDEX IF EXISTS "Vendor_name_key";

-- 5. Create new tables
CREATE TABLE "DisbursementLineItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "disbursementId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountInKobo" BIGINT NOT NULL,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisbursementLineItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DisbursementLineItem_disbursementId_idx" ON "DisbursementLineItem"("disbursementId");
CREATE INDEX "DisbursementLineItem_organizationId_idx" ON "DisbursementLineItem"("organizationId");

CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "memberNumber" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Member_email_organizationId_key" ON "Member"("email", "organizationId");
CREATE INDEX "Member_organizationId_idx" ON "Member"("organizationId");

CREATE TABLE "PledgeContribution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pledgeId" TEXT NOT NULL,
    "ledgerEntryId" TEXT NOT NULL,
    "amountInKobo" BIGINT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PledgeContribution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PledgeContribution_pledgeId_idx" ON "PledgeContribution"("pledgeId");
CREATE INDEX "PledgeContribution_ledgerEntryId_idx" ON "PledgeContribution"("ledgerEntryId");
CREATE INDEX "PledgeContribution_organizationId_idx" ON "PledgeContribution"("organizationId");

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

CREATE TABLE "MfaChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MfaChallenge_userId_idx" ON "MfaChallenge"("userId");
CREATE INDEX "MfaChallenge_code_idx" ON "MfaChallenge"("code");

-- 6. Recreate compound uniques
CREATE UNIQUE INDEX "ChartOfAccounts_code_organizationId_key" ON "ChartOfAccounts"("code", "organizationId");
CREATE UNIQUE INDEX "Department_name_organizationId_key" ON "Department"("name", "organizationId");
CREATE UNIQUE INDEX "Vendor_name_organizationId_key" ON "Vendor"("name", "organizationId");
CREATE UNIQUE INDEX "Period_organizationId_fiscalYear_month_key" ON "Period"("organizationId", "fiscalYear", "month");

-- 7. New foreign keys
ALTER TABLE "DisbursementLineItem" ADD CONSTRAINT "DisbursementLineItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisbursementLineItem" ADD CONSTRAINT "DisbursementLineItem_disbursementId_fkey" FOREIGN KEY ("disbursementId") REFERENCES "DisbursementRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DisbursementRequest" ADD CONSTRAINT "DisbursementRequest_firstApprovedById_fkey" FOREIGN KEY ("firstApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DisbursementRequest" ADD CONSTRAINT "DisbursementRequest_secondApprovedById_fkey" FOREIGN KEY ("secondApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Member" ADD CONSTRAINT "Member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill/normalize Pledge.memberId before adding the FK
ALTER TABLE "Pledge" ALTER COLUMN "memberId" DROP NOT NULL;
UPDATE "Pledge" SET "memberId" = NULL
WHERE "memberId" IS NOT NULL
  AND ("memberId" !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
       OR NOT EXISTS (SELECT 1 FROM "Member" m WHERE m."id" = "Pledge"."memberId"));
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PledgeContribution" ADD CONSTRAINT "PledgeContribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PledgeContribution" ADD CONSTRAINT "PledgeContribution_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "Pledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PledgeContribution" ADD CONSTRAINT "PledgeContribution_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PledgeContribution" ADD CONSTRAINT "PledgeContribution_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Period" ADD CONSTRAINT "Period_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "Period_organizationId_idx" ON "Period"("organizationId");
CREATE INDEX "DisbursementRequest_status_idx" ON "DisbursementRequest"("status");
