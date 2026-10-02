-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TREASURER', 'FINANCIAL_SECRETARY', 'AUDITOR', 'DEPARTMENT_HEAD');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DONATION', 'EXPENSE', 'TRANSFER', 'REVERSAL');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "PledgeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPER_ADMIN',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amountInKobo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "journalId" TEXT,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisbursementRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amountInKobo" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "vendorId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DisbursementStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "DisbursementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ChartOfAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debitInKobo" INTEGER NOT NULL DEFAULT 0,
    "creditInKobo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pledge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "amountInKobo" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "status" "PledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amountInKobo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "publicKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedById" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Fund_organizationId_idx" ON "Fund"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_name_organizationId_key" ON "Fund"("name", "organizationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_fundId_idx" ON "LedgerEntry"("fundId");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_type_idx" ON "LedgerEntry"("type");

-- CreateIndex
CREATE INDEX "LedgerEntry_recordedById_idx" ON "LedgerEntry"("recordedById");

-- CreateIndex
CREATE INDEX "LedgerEntry_organizationId_idx" ON "LedgerEntry"("organizationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_fundId_createdAt_idx" ON "LedgerEntry"("fundId", "createdAt");

-- CreateIndex
CREATE INDEX "DisbursementRequest_requestedById_idx" ON "DisbursementRequest"("requestedById");

-- CreateIndex
CREATE INDEX "DisbursementRequest_createdAt_idx" ON "DisbursementRequest"("createdAt");

-- CreateIndex
CREATE INDEX "DisbursementRequest_organizationId_idx" ON "DisbursementRequest"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccounts_code_key" ON "ChartOfAccounts"("code");

-- CreateIndex
CREATE INDEX "ChartOfAccounts_type_idx" ON "ChartOfAccounts"("type");

-- CreateIndex
CREATE INDEX "ChartOfAccounts_parentId_idx" ON "ChartOfAccounts"("parentId");

-- CreateIndex
CREATE INDEX "ChartOfAccounts_organizationId_idx" ON "ChartOfAccounts"("organizationId");

-- CreateIndex
CREATE INDEX "JournalEntry_createdById_idx" ON "JournalEntry"("createdById");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "JournalEntry_organizationId_idx" ON "JournalEntry"("organizationId");

-- CreateIndex
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "Pledge_memberId_idx" ON "Pledge"("memberId");

-- CreateIndex
CREATE INDEX "Pledge_fundId_idx" ON "Pledge"("fundId");

-- CreateIndex
CREATE INDEX "Pledge_status_idx" ON "Pledge"("status");

-- CreateIndex
CREATE INDEX "Pledge_organizationId_idx" ON "Pledge"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_headId_idx" ON "Department"("headId");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE INDEX "Budget_departmentId_idx" ON "Budget"("departmentId");

-- CreateIndex
CREATE INDEX "Budget_fundId_idx" ON "Budget"("fundId");

-- CreateIndex
CREATE INDEX "Budget_fiscalYear_month_idx" ON "Budget"("fiscalYear", "month");

-- CreateIndex
CREATE INDEX "Budget_organizationId_idx" ON "Budget"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_departmentId_fundId_fiscalYear_month_key" ON "Budget"("departmentId", "fundId", "fiscalYear", "month");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_email_idx" ON "Vendor"("email");

-- CreateIndex
CREATE INDEX "Vendor_organizationId_idx" ON "Vendor"("organizationId");

-- CreateIndex
CREATE INDEX "Period_isLocked_idx" ON "Period"("isLocked");

-- CreateIndex
CREATE UNIQUE INDEX "Period_fiscalYear_month_key" ON "Period"("fiscalYear", "month");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisbursementRequest" ADD CONSTRAINT "DisbursementRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisbursementRequest" ADD CONSTRAINT "DisbursementRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisbursementRequest" ADD CONSTRAINT "DisbursementRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisbursementRequest" ADD CONSTRAINT "DisbursementRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisbursementRequest" ADD CONSTRAINT "DisbursementRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccounts" ADD CONSTRAINT "ChartOfAccounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccounts" ADD CONSTRAINT "ChartOfAccounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pledge" ADD CONSTRAINT "Pledge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headId_fkey" FOREIGN KEY ("headId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
