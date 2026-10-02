-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Vendor_taxId_idx" ON "Vendor"("taxId");
