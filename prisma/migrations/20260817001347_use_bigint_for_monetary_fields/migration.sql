-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "amountInKobo" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "DisbursementRequest" ALTER COLUMN "amountInKobo" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "JournalLine" ALTER COLUMN "debitInKobo" SET DATA TYPE BIGINT,
ALTER COLUMN "creditInKobo" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "amountInKobo" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Pledge" ALTER COLUMN "amountInKobo" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
