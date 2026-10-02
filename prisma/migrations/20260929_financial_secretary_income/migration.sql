ALTER TABLE "LedgerEntry"
ADD COLUMN "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "memberId" TEXT,
ADD COLUMN "contributionMethod" TEXT,
ADD COLUMN "notes" TEXT;

CREATE INDEX "LedgerEntry_memberId_idx" ON "LedgerEntry"("memberId");

ALTER TABLE "LedgerEntry"
ADD CONSTRAINT "LedgerEntry_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "LedgerEntry"
SET "transactionDate" = "createdAt"
WHERE "type" = 'DONATION';