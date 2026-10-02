"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingsSchema = exports.updateOrganizationSchema = exports.cancelDisbursementSchema = exports.approveBudgetPeriodSchema = exports.approveDepartmentBudgetSchema = exports.submitDepartmentBudgetSchema = exports.updateBudgetItemSchema = exports.createBudgetItemSchema = exports.updateDepartmentBudgetSchema = exports.createDepartmentBudgetSchema = exports.updateBudgetPeriodSchema = exports.createBudgetPeriodSchema = exports.updateBudgetSchema = exports.createBudgetSchema = exports.lockPeriodSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.mfaVerifySchema = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.updateMemberSchema = exports.createMemberSchema = exports.updateChartOfAccountSchema = exports.createChartOfAccountSchema = exports.updateDepartmentSchema = exports.createDepartmentSchema = exports.updateRoleSchema = exports.updateVendorSchema = exports.createVendorSchema = exports.reportQuerySchema = exports.reverseJournalEntrySchema = exports.createJournalEntrySchema = exports.reverseLedgerEntrySchema = exports.createLedgerEntrySchema = exports.updateFundSchema = exports.createFundSchema = exports.markPaidSchema = exports.rejectDisbursementSchema = exports.createDisbursementSchema = exports.updatePledgeSchema = exports.createPledgeSchema = exports.batchEntrySchema = exports.deleteContributionSchema = exports.updateContributionSchema = exports.singleContributionSchema = exports.paginationQuerySchema = exports.registerChurchSchema = exports.signupSchema = exports.loginSchema = void 0;
exports.systemSettingsUpdateSchema = void 0;
exports.isValidTimeZone = isValidTimeZone;
exports.isValidCurrencyCode = isValidCurrencyCode;
const zod_1 = require("zod");
const documentCurrency_1 = require("../utils/documentCurrency");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(1),
    role: zod_1.z.enum(["SUPER_ADMIN", "TREASURER", "FINANCIAL_SECRETARY", "AUDITOR", "DEPARTMENT_HEAD"]).optional(),
});
exports.registerChurchSchema = zod_1.z.object({
    churchName: zod_1.z.string().min(1),
    adminName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
});
exports.singleContributionSchema = zod_1.z.object({
    memberId: zod_1.z.string().optional(),
    memberName: zod_1.z.string().optional(),
    fundId: zod_1.z.string().min(1),
    amountInKobo: zod_1.z.number().int().positive(),
    type: zod_1.z.enum(["CASH", "CHECK", "ENVELOPE"]),
    date: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    pledgeId: zod_1.z.string().optional(),
});
exports.updateContributionSchema = zod_1.z.object({
    memberId: zod_1.z.string().optional(),
    memberName: zod_1.z.string().optional(),
    fundId: zod_1.z.string().min(1).optional(),
    amountInKobo: zod_1.z.number().int().positive().optional(),
    type: zod_1.z.enum(["CASH", "CHECK", "ENVELOPE"]).optional(),
    date: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    pledgeId: zod_1.z.string().optional(),
});
exports.deleteContributionSchema = zod_1.z.object({ reason: zod_1.z.string().min(1).max(500) });
exports.batchEntrySchema = zod_1.z.object({
    entries: zod_1.z.array(zod_1.z.object({
        memberId: zod_1.z.string().optional(),
        memberName: zod_1.z.string().optional(),
        fundId: zod_1.z.string().min(1),
        amountInKobo: zod_1.z.number().int().positive(),
        type: zod_1.z.enum(["CASH", "CHECK", "ENVELOPE"]),
        date: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        pledgeId: zod_1.z.string().optional(),
    })),
});
exports.createPledgeSchema = zod_1.z.object({
    memberId: zod_1.z.string().min(1),
    memberName: zod_1.z.string().min(1),
    fundId: zod_1.z.string().min(1),
    amountInKobo: zod_1.z.number().int().positive(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    recurring: zod_1.z.boolean().optional(),
});
exports.updatePledgeSchema = zod_1.z.object({
    memberId: zod_1.z.string().optional(),
    memberName: zod_1.z.string().min(1).optional(),
    fundId: zod_1.z.string().min(1).optional(),
    amountInKobo: zod_1.z.number().int().positive().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    recurring: zod_1.z.boolean().optional(),
});
exports.createDisbursementSchema = zod_1.z.object({
    amountInKobo: zod_1.z.number().int().positive(),
    purpose: zod_1.z.string().min(1),
    vendorId: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
    lineItems: zod_1.z
        .array(zod_1.z.object({
        description: zod_1.z.string().min(1),
        amountInKobo: zod_1.z.number().int().positive(),
        receiptUrl: zod_1.z.string().url().optional(),
    }))
        .optional(),
});
exports.rejectDisbursementSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1).optional(),
});
exports.markPaidSchema = zod_1.z.object({
    paymentMethod: zod_1.z.string().min(1),
    paymentReference: zod_1.z.string().optional(),
    paymentNotes: zod_1.z.string().optional(),
});
exports.createFundSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    isRestricted: zod_1.z.boolean().optional(),
});
exports.updateFundSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    isRestricted: zod_1.z.boolean().optional(),
});
exports.createLedgerEntrySchema = zod_1.z.object({
    fundId: zod_1.z.string().min(1),
    type: zod_1.z.enum(["DONATION", "EXPENSE", "TRANSFER"]),
    amountInKobo: zod_1.z.number().int().positive(),
    description: zod_1.z.string().min(1),
    memberId: zod_1.z.string().optional(),
});
exports.reverseLedgerEntrySchema = zod_1.z.object({
    reversalReason: zod_1.z.string().min(1),
});
exports.createJournalEntrySchema = zod_1.z.object({
    description: zod_1.z.string().min(1),
    reference: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
    lines: zod_1.z
        .array(zod_1.z.object({
        accountId: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        debitInKobo: zod_1.z.number().int().nonnegative().default(0),
        creditInKobo: zod_1.z.number().int().nonnegative().default(0),
    }))
        .min(2, "At least two journal lines are required"),
});
exports.reverseJournalEntrySchema = zod_1.z.object({
    reason: zod_1.z.string().min(1),
});
exports.reportQuerySchema = zod_1.z.object({
    fundId: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
    reportType: zod_1.z
        .enum(["balance-sheet", "statement-of-activities", "budget-vs-actual", "trial-balance", "cash-flow"])
        .optional(),
    format: zod_1.z.enum(["CSV", "XLSX", "PDF"]).optional(),
});
exports.createVendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    bankAccountName: zod_1.z.string().optional(),
    bankAccountNumber: zod_1.z.string().optional(),
});
exports.updateVendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    bankAccountName: zod_1.z.string().optional(),
    bankAccountNumber: zod_1.z.string().optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["SUPER_ADMIN", "TREASURER", "FINANCIAL_SECRETARY", "AUDITOR", "DEPARTMENT_HEAD"]),
});
exports.createDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    headId: zod_1.z.string().min(1),
});
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    headId: zod_1.z.string().min(1).optional(),
});
exports.createChartOfAccountSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
    parentId: zod_1.z.string().optional(),
    parentAccountCode: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateChartOfAccountSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).optional(),
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]).optional(),
    parentId: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.createMemberSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    memberNumber: zod_1.z.string().optional(),
});
exports.updateMemberSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    memberNumber: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
exports.mfaVerifySchema = zod_1.z.object({
    userId: zod_1.z.string(),
    code: zod_1.z.string().length(6),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
exports.lockPeriodSchema = zod_1.z.object({
    fiscalYear: zod_1.z.number().int().min(2000).max(2100),
    month: zod_1.z.number().int().min(1).max(12),
});
exports.createBudgetSchema = zod_1.z.object({
    departmentId: zod_1.z.string().min(1),
    fundId: zod_1.z.string().min(1),
    fiscalYear: zod_1.z.number().int().min(2000).max(2100),
    month: zod_1.z.number().int().min(1).max(12),
    amountInKobo: zod_1.z.number().int().positive(),
});
exports.updateBudgetSchema = zod_1.z.object({
    amountInKobo: zod_1.z.number().int().positive().optional(),
    departmentId: zod_1.z.string().min(1).optional(),
    fundId: zod_1.z.string().min(1).optional(),
    fiscalYear: zod_1.z.number().int().min(2000).max(2100).optional(),
    month: zod_1.z.number().int().min(1).max(12).optional(),
});
exports.createBudgetPeriodSchema = zod_1.z.object({
    fiscalYear: zod_1.z.number().int().min(2000).max(2100),
    submissionDeadline: zod_1.z.string().datetime().optional(),
});
exports.updateBudgetPeriodSchema = zod_1.z.object({
    fiscalYear: zod_1.z.number().int().min(2000).max(2100).optional(),
    status: zod_1.z.enum(["DRAFT", "SUBMISSION_OPEN", "UNDER_REVIEW", "APPROVED_AND_LOCKED"]).optional(),
    submissionDeadline: zod_1.z.string().datetime().optional().nullable(),
});
exports.createDepartmentBudgetSchema = zod_1.z.object({
    budgetPeriodId: zod_1.z.string().uuid(),
    departmentId: zod_1.z.string().uuid(),
    totalProposedAmount: zod_1.z.number().int().nonnegative().optional(),
    totalApprovedAmount: zod_1.z.number().int().nonnegative().optional(),
    status: zod_1.z.enum(["DRAFT", "SUBMITTED", "REVISED", "APPROVED", "REJECTED"]).optional(),
    rejectionNotes: zod_1.z.string().optional().nullable(),
});
exports.updateDepartmentBudgetSchema = zod_1.z.object({
    totalProposedAmount: zod_1.z.number().int().nonnegative().optional(),
    totalApprovedAmount: zod_1.z.number().int().nonnegative().optional(),
    status: zod_1.z.enum(["DRAFT", "SUBMITTED", "REVISED", "APPROVED", "REJECTED"]).optional(),
    rejectionNotes: zod_1.z.string().optional().nullable(),
});
exports.createBudgetItemSchema = zod_1.z.object({
    departmentBudgetId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid(),
    itemName: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional().nullable(),
    unitCost: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().int().positive().default(1),
    proposedTotal: zod_1.z.number().int().positive(),
    approvedTotal: zod_1.z.number().int().nonnegative().optional().nullable(),
});
exports.updateBudgetItemSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    itemName: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().optional().nullable(),
    unitCost: zod_1.z.number().int().positive().optional(),
    quantity: zod_1.z.number().int().positive().optional(),
    proposedTotal: zod_1.z.number().int().positive().optional(),
    approvedTotal: zod_1.z.number().int().nonnegative().optional().nullable(),
});
exports.submitDepartmentBudgetSchema = zod_1.z.object({
    rejectionNotes: zod_1.z.string().optional().nullable(),
});
exports.approveDepartmentBudgetSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        budgetItemId: zod_1.z.string().uuid(),
        approvedTotal: zod_1.z.number().int().nonnegative(),
    })),
});
exports.approveBudgetPeriodSchema = zod_1.z.object({
    budgetPeriodId: zod_1.z.string().uuid(),
});
exports.cancelDisbursementSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1),
});
exports.updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    currency: zod_1.z.string().min(3).max(3).optional().default(documentCurrency_1.DEFAULT_CURRENCY),
    fiscalYearStartMonth: zod_1.z.number().int().min(1).max(12).optional().default(1),
    timezone: zod_1.z.string().optional().default("Africa/Lagos"),
    requireMfa: zod_1.z.boolean().optional().default(false),
    sessionTimeoutMinutes: zod_1.z.number().int().positive().optional().default(480),
});
const ISO_CURRENCY = /^[A-Z]{3}$/;
const IANA_TIMEZONE = /^[A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?$/;
const SUPPORTED_CURRENCIES = (() => {
    const fn = Intl.supportedValuesOf;
    if (typeof fn === "function") {
        try {
            return fn("currency");
        }
        catch {
            return null;
        }
    }
    return null;
})();
function isValidTimeZone(tz) {
    if (tz !== "UTC" && !IANA_TIMEZONE.test(tz))
        return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    }
    catch {
        return false;
    }
}
function isValidCurrencyCode(code) {
    if (!ISO_CURRENCY.test(code))
        return false;
    if (SUPPORTED_CURRENCIES)
        return SUPPORTED_CURRENCIES.includes(code.toUpperCase());
    try {
        new Intl.NumberFormat("en-US", { style: "currency", currency: code });
        return true;
    }
    catch {
        return false;
    }
}
exports.systemSettingsSchema = zod_1.z.object({
    organizationName: zod_1.z.string().min(1, "Organization name is required").optional(),
    baseCurrency: zod_1.z
        .string()
        .min(1, "Base currency is required")
        .refine((val) => isValidCurrencyCode(val), { message: "Base currency must be a valid ISO 4217 currency code" }),
    fiscalYearStartMonth: zod_1.z
        .number()
        .int()
        .min(1, "Fiscal year start month must be between 1 and 12")
        .max(12, "Fiscal year start month must be between 1 and 12"),
    timezone: zod_1.z
        .string()
        .refine((val) => isValidTimeZone(val), { message: "Timezone must be a valid IANA timezone identifier" }),
    requireMfa: zod_1.z.boolean(),
    sessionTimeoutMinutes: zod_1.z
        .number()
        .int()
        .min(15, "Session timeout must be between 15 and 1440 minutes")
        .max(1440, "Session timeout must be between 15 and 1440 minutes"),
    address: zod_1.z.string().max(300, "Address must be 300 characters or fewer").optional(),
    phone: zod_1.z.string().max(60, "Phone must be 60 characters or fewer").optional(),
    email: zod_1.z
        .string()
        .max(160, "Email must be 160 characters or fewer")
        .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Email must be a valid email address",
    })
        .optional(),
    logoUrl: zod_1.z
        .string()
        .max(500, "Logo URL must be 500 characters or fewer")
        .refine((val) => {
        if (val === "")
            return true;
        try {
            const protocol = new URL(val).protocol;
            return protocol === "http:" || protocol === "https:";
        }
        catch {
            return false;
        }
    }, { message: "Logo URL must be a valid http(s) URL" })
        .optional(),
});
exports.systemSettingsUpdateSchema = exports.systemSettingsSchema.partial();
//# sourceMappingURL=index.js.map