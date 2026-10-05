import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const signupSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        AUDITOR: "AUDITOR";
        DEPARTMENT_HEAD: "DEPARTMENT_HEAD";
        FINANCIAL_SECRETARY: "FINANCIAL_SECRETARY";
        SUPER_ADMIN: "SUPER_ADMIN";
        TREASURER: "TREASURER";
    }>>;
}, z.core.$strip>;
export declare const registerChurchSchema: z.ZodObject<{
    churchName: z.ZodString;
    adminName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
}, z.core.$strip>;
export declare const singleContributionSchema: z.ZodObject<{
    memberId: z.ZodOptional<z.ZodString>;
    memberName: z.ZodOptional<z.ZodString>;
    fundId: z.ZodString;
    amountInKobo: z.ZodNumber;
    type: z.ZodEnum<{
        CASH: "CASH";
        CHECK: "CHECK";
        ENVELOPE: "ENVELOPE";
    }>;
    date: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    pledgeId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateContributionSchema: z.ZodObject<{
    memberId: z.ZodOptional<z.ZodString>;
    memberName: z.ZodOptional<z.ZodString>;
    fundId: z.ZodOptional<z.ZodString>;
    amountInKobo: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<{
        CASH: "CASH";
        CHECK: "CHECK";
        ENVELOPE: "ENVELOPE";
    }>>;
    date: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    pledgeId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const deleteContributionSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export declare const batchEntrySchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        memberId: z.ZodOptional<z.ZodString>;
        memberName: z.ZodOptional<z.ZodString>;
        fundId: z.ZodString;
        amountInKobo: z.ZodNumber;
        type: z.ZodEnum<{
            CASH: "CASH";
            CHECK: "CHECK";
            ENVELOPE: "ENVELOPE";
        }>;
        date: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        pledgeId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const createPledgeSchema: z.ZodObject<{
    memberId: z.ZodString;
    memberName: z.ZodString;
    fundId: z.ZodString;
    amountInKobo: z.ZodNumber;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    recurring: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updatePledgeSchema: z.ZodObject<{
    memberId: z.ZodOptional<z.ZodString>;
    memberName: z.ZodOptional<z.ZodString>;
    fundId: z.ZodOptional<z.ZodString>;
    amountInKobo: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    recurring: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createDisbursementSchema: z.ZodObject<{
    amountInKobo: z.ZodNumber;
    purpose: z.ZodString;
    vendorId: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        amountInKobo: z.ZodNumber;
        receiptUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const rejectDisbursementSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const markPaidSchema: z.ZodObject<{
    paymentMethod: z.ZodString;
    paymentReference: z.ZodOptional<z.ZodString>;
    paymentNotes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createFundSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isRestricted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateFundSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isRestricted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createLedgerEntrySchema: z.ZodObject<{
    fundId: z.ZodString;
    type: z.ZodEnum<{
        DONATION: "DONATION";
        EXPENSE: "EXPENSE";
        TRANSFER: "TRANSFER";
    }>;
    amountInKobo: z.ZodNumber;
    description: z.ZodString;
    memberId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const reverseLedgerEntrySchema: z.ZodObject<{
    reversalReason: z.ZodString;
}, z.core.$strip>;
export declare const createJournalEntrySchema: z.ZodObject<{
    description: z.ZodString;
    reference: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        accountId: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        debitInKobo: z.ZodDefault<z.ZodNumber>;
        creditInKobo: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const reverseJournalEntrySchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export declare const reportQuerySchema: z.ZodObject<{
    fundId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    reportType: z.ZodOptional<z.ZodEnum<{
        "balance-sheet": "balance-sheet";
        "budget-vs-actual": "budget-vs-actual";
        "cash-flow": "cash-flow";
        "statement-of-activities": "statement-of-activities";
        "trial-balance": "trial-balance";
    }>>;
    format: z.ZodOptional<z.ZodEnum<{
        CSV: "CSV";
        PDF: "PDF";
        XLSX: "XLSX";
    }>>;
}, z.core.$strip>;
export declare const createVendorSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    bankName: z.ZodOptional<z.ZodString>;
    bankAccountName: z.ZodOptional<z.ZodString>;
    bankAccountNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateVendorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    bankName: z.ZodOptional<z.ZodString>;
    bankAccountName: z.ZodOptional<z.ZodString>;
    bankAccountNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateRoleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        AUDITOR: "AUDITOR";
        DEPARTMENT_HEAD: "DEPARTMENT_HEAD";
        FINANCIAL_SECRETARY: "FINANCIAL_SECRETARY";
        SUPER_ADMIN: "SUPER_ADMIN";
        TREASURER: "TREASURER";
    }>;
}, z.core.$strip>;
export declare const createDepartmentSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    headId: z.ZodString;
}, z.core.$strip>;
export declare const updateDepartmentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    headId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createChartOfAccountSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{
        ASSET: "ASSET";
        EQUITY: "EQUITY";
        EXPENSE: "EXPENSE";
        INCOME: "INCOME";
        LIABILITY: "LIABILITY";
    }>;
    parentId: z.ZodOptional<z.ZodString>;
    parentAccountCode: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateChartOfAccountSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        ASSET: "ASSET";
        EQUITY: "EQUITY";
        EXPENSE: "EXPENSE";
        INCOME: "INCOME";
        LIABILITY: "LIABILITY";
    }>>;
    parentId: z.ZodOptional<z.ZodString>;
    parentAccountCode: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createMemberSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    memberNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateMemberSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    memberNumber: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
export declare const mfaVerifySchema: z.ZodObject<{
    userId: z.ZodString;
    code: z.ZodString;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const lockPeriodSchema: z.ZodObject<{
    fiscalYear: z.ZodNumber;
    month: z.ZodNumber;
}, z.core.$strip>;
export declare const createBudgetSchema: z.ZodObject<{
    departmentId: z.ZodString;
    fundId: z.ZodString;
    fiscalYear: z.ZodNumber;
    month: z.ZodNumber;
    amountInKobo: z.ZodNumber;
}, z.core.$strip>;
export declare const updateBudgetSchema: z.ZodObject<{
    amountInKobo: z.ZodOptional<z.ZodNumber>;
    departmentId: z.ZodOptional<z.ZodString>;
    fundId: z.ZodOptional<z.ZodString>;
    fiscalYear: z.ZodOptional<z.ZodNumber>;
    month: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const createBudgetPeriodSchema: z.ZodObject<{
    fiscalYear: z.ZodNumber;
    submissionDeadline: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateBudgetPeriodSchema: z.ZodObject<{
    fiscalYear: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        APPROVED_AND_LOCKED: "APPROVED_AND_LOCKED";
        DRAFT: "DRAFT";
        SUBMISSION_OPEN: "SUBMISSION_OPEN";
        UNDER_REVIEW: "UNDER_REVIEW";
    }>>;
    submissionDeadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createDepartmentBudgetSchema: z.ZodObject<{
    budgetPeriodId: z.ZodString;
    departmentId: z.ZodString;
    totalProposedAmount: z.ZodOptional<z.ZodNumber>;
    totalApprovedAmount: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        APPROVED: "APPROVED";
        DRAFT: "DRAFT";
        REJECTED: "REJECTED";
        REVISED: "REVISED";
        SUBMITTED: "SUBMITTED";
    }>>;
    rejectionNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const updateDepartmentBudgetSchema: z.ZodObject<{
    totalProposedAmount: z.ZodOptional<z.ZodNumber>;
    totalApprovedAmount: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        APPROVED: "APPROVED";
        DRAFT: "DRAFT";
        REJECTED: "REJECTED";
        REVISED: "REVISED";
        SUBMITTED: "SUBMITTED";
    }>>;
    rejectionNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createBudgetItemSchema: z.ZodObject<{
    departmentBudgetId: z.ZodString;
    categoryId: z.ZodString;
    itemName: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unitCost: z.ZodNumber;
    quantity: z.ZodDefault<z.ZodNumber>;
    proposedTotal: z.ZodNumber;
    approvedTotal: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const updateBudgetItemSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    itemName: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unitCost: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodOptional<z.ZodNumber>;
    proposedTotal: z.ZodOptional<z.ZodNumber>;
    approvedTotal: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const submitDepartmentBudgetSchema: z.ZodObject<{
    rejectionNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const approveDepartmentBudgetSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        budgetItemId: z.ZodString;
        approvedTotal: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const approveBudgetPeriodSchema: z.ZodObject<{
    budgetPeriodId: z.ZodString;
}, z.core.$strip>;
export declare const cancelDisbursementSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    fiscalYearStartMonth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    timezone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    requireMfa: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sessionTimeoutMinutes: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare function isValidTimeZone(tz: string): boolean;
export declare function isValidCurrencyCode(code: string): boolean;
export declare const systemSettingsSchema: z.ZodObject<{
    organizationName: z.ZodOptional<z.ZodString>;
    baseCurrency: z.ZodString;
    fiscalYearStartMonth: z.ZodNumber;
    timezone: z.ZodString;
    requireMfa: z.ZodBoolean;
    sessionTimeoutMinutes: z.ZodNumber;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const systemSettingsUpdateSchema: z.ZodObject<{
    organizationName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    baseCurrency: z.ZodOptional<z.ZodString>;
    fiscalYearStartMonth: z.ZodOptional<z.ZodNumber>;
    timezone: z.ZodOptional<z.ZodString>;
    requireMfa: z.ZodOptional<z.ZodBoolean>;
    sessionTimeoutMinutes: z.ZodOptional<z.ZodNumber>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    logoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map