/*
  Warnings:

  - Made the column `organizationId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Period` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "DisbursementStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "PledgeContribution" DROP CONSTRAINT "PledgeContribution_organizationId_fkey";

-- DropIndex
DROP INDEX "LedgerEntry_memberId_idx";

-- DropIndex
DROP INDEX "Period_fiscalYear_month_key";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DisbursementRequest" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "portalAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portalPasswordHash" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requireMfa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 480,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos';

-- AlterTable
ALTER TABLE "Period" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockoutUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vendor" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_tokenHash_idx" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
