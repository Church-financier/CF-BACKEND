-- Migration: 20260904000000_annual_budgeting_module
-- Bottom-Up Annual Budgeting Module: BudgetPeriod, DepartmentBudget, BudgetItem
-- Adds the enums, tables, indexes and foreign keys for the new budgeting module.

-- 1. Enums
CREATE TYPE "BudgetPeriodStatus" AS ENUM ('DRAFT', 'SUBMISSION_OPEN', 'UNDER_REVIEW', 'APPROVED_AND_LOCKED');
CREATE TYPE "DepartmentBudgetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVISED', 'APPROVED', 'REJECTED');

-- 2. BudgetPeriod table
CREATE TABLE "BudgetPeriod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "status" "BudgetPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "submissionDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPeriod_pkey" PRIMARY KEY ("id")
);

-- 3. DepartmentBudget table
CREATE TABLE "DepartmentBudget" (
    "id" TEXT NOT NULL,
    "budgetPeriodId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "totalProposedAmount" BIGINT NOT NULL DEFAULT 0,
    "totalApprovedAmount" BIGINT NOT NULL DEFAULT 0,
    "status" "DepartmentBudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentBudget_pkey" PRIMARY KEY ("id")
);

-- 4. BudgetItem table
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "departmentBudgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "unitCost" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "proposedTotal" BIGINT NOT NULL,
    "approvedTotal" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- 5. Unique constraints & indexes
CREATE UNIQUE INDEX "BudgetPeriod_organizationId_fiscalYear_key" ON "BudgetPeriod"("organizationId", "fiscalYear");
CREATE INDEX "BudgetPeriod_organizationId_idx" ON "BudgetPeriod"("organizationId");
CREATE INDEX "BudgetPeriod_status_idx" ON "BudgetPeriod"("status");

CREATE UNIQUE INDEX "DepartmentBudget_budgetPeriodId_departmentId_key" ON "DepartmentBudget"("budgetPeriodId", "departmentId");
CREATE INDEX "DepartmentBudget_budgetPeriodId_idx" ON "DepartmentBudget"("budgetPeriodId");
CREATE INDEX "DepartmentBudget_departmentId_idx" ON "DepartmentBudget"("departmentId");
CREATE INDEX "DepartmentBudget_status_idx" ON "DepartmentBudget"("status");
CREATE INDEX "DepartmentBudget_submittedByUserId_idx" ON "DepartmentBudget"("submittedByUserId");

CREATE INDEX "BudgetItem_departmentBudgetId_idx" ON "BudgetItem"("departmentBudgetId");
CREATE INDEX "BudgetItem_categoryId_idx" ON "BudgetItem"("categoryId");

-- 6. Foreign keys
ALTER TABLE "BudgetPeriod" ADD CONSTRAINT "BudgetPeriod_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DepartmentBudget" ADD CONSTRAINT "DepartmentBudget_budgetPeriodId_fkey"
    FOREIGN KEY ("budgetPeriodId") REFERENCES "BudgetPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepartmentBudget" ADD CONSTRAINT "DepartmentBudget_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepartmentBudget" ADD CONSTRAINT "DepartmentBudget_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_departmentBudgetId_fkey"
    FOREIGN KEY ("departmentBudgetId") REFERENCES "DepartmentBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
