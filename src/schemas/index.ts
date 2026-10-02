import { z } from "zod";
import { DEFAULT_CURRENCY } from "../utils/documentCurrency";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["SUPER_ADMIN", "TREASURER", "FINANCIAL_SECRETARY", "AUDITOR", "DEPARTMENT_HEAD"]).optional(),
});

export const registerChurchSchema = z.object({
  churchName: z.string().min(1),
  adminName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const singleContributionSchema = z.object({
  memberId: z.string().optional(),
  memberName: z.string().optional(),
  fundId: z.string().min(1),
  amountInKobo: z.number().int().positive(),
  type: z.enum(["CASH", "CHECK", "ENVELOPE"]),
  date: z.string().optional(),
  notes: z.string().optional(),
  pledgeId: z.string().optional(),
});

export const updateContributionSchema = z.object({
  memberId: z.string().optional(),
  memberName: z.string().optional(),
  fundId: z.string().min(1).optional(),
  amountInKobo: z.number().int().positive().optional(),
  type: z.enum(["CASH", "CHECK", "ENVELOPE"]).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  pledgeId: z.string().optional(),
});

export const deleteContributionSchema = z.object({ reason: z.string().min(1).max(500) });

export const batchEntrySchema = z.object({
  entries: z.array(
    z.object({
      memberId: z.string().optional(),
      memberName: z.string().optional(),
      fundId: z.string().min(1),
      amountInKobo: z.number().int().positive(),
      type: z.enum(["CASH", "CHECK", "ENVELOPE"]),
      date: z.string().optional(),
      notes: z.string().optional(),
      pledgeId: z.string().optional(),
    })
  ),
});

export const createPledgeSchema = z.object({
  memberId: z.string().min(1),
  memberName: z.string().min(1),
  fundId: z.string().min(1),
  amountInKobo: z.number().int().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  recurring: z.boolean().optional(),
});

export const updatePledgeSchema = z.object({
  memberId: z.string().optional(),
  memberName: z.string().min(1).optional(),
  fundId: z.string().min(1).optional(),
  amountInKobo: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  recurring: z.boolean().optional(),
});

export const createDisbursementSchema = z.object({
  amountInKobo: z.number().int().positive(),
  purpose: z.string().min(1),
  vendorId: z.string().optional(),
  departmentId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        amountInKobo: z.number().int().positive(),
        receiptUrl: z.string().url().optional(),
      })
    )
    .optional(),
});

export const rejectDisbursementSchema = z.object({
  reason: z.string().min(1).optional(),
});

export const markPaidSchema = z.object({
  paymentMethod: z.string().min(1),
  paymentReference: z.string().optional(),
  paymentNotes: z.string().optional(),
});

export const createFundSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isRestricted: z.boolean().optional(),
});

export const updateFundSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isRestricted: z.boolean().optional(),
});

export const createLedgerEntrySchema = z.object({
  fundId: z.string().min(1),
  type: z.enum(["DONATION", "EXPENSE", "TRANSFER"]),
  amountInKobo: z.number().int().positive(),
  description: z.string().min(1),
  memberId: z.string().optional(),
});

export const reverseLedgerEntrySchema = z.object({
  reversalReason: z.string().min(1),
});

export const createJournalEntrySchema = z.object({
  description: z.string().min(1),
  reference: z.string().optional(),
  date: z.string().optional(),
  lines: z
    .array(
      z.object({
        accountId: z.string().min(1),
        description: z.string().optional(),
        debitInKobo: z.number().int().nonnegative().default(0),
        creditInKobo: z.number().int().nonnegative().default(0),
      })
    )
    .min(2, "At least two journal lines are required"),
});

export const reverseJournalEntrySchema = z.object({
  reason: z.string().min(1),
});

export const reportQuerySchema = z.object({
  fundId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departmentId: z.string().optional(),
  reportType: z
    .enum(["balance-sheet", "statement-of-activities", "budget-vs-actual", "trial-balance", "cash-flow"])
    .optional(),
  format: z.enum(["CSV", "XLSX", "PDF"]).optional(),
});

export const createVendorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "TREASURER", "FINANCIAL_SECRETARY", "AUDITOR", "DEPARTMENT_HEAD"]),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  headId: z.string().min(1),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  headId: z.string().min(1).optional(),
});

export const createChartOfAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  parentId: z.string().optional(),
  parentAccountCode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateChartOfAccountSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]).optional(),
  parentId: z.string().optional(),
  // Parent linking by account code, as the chart-of-accounts form submits it.
  // An empty string detaches the account from its parent.
  parentAccountCode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createMemberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  memberNumber: z.string().optional(),
});

export const updateMemberSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  memberNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const mfaVerifySchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const lockPeriodSchema = z.object({
  fiscalYear: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const createBudgetSchema = z.object({
  departmentId: z.string().min(1),
  fundId: z.string().min(1),
  fiscalYear: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  amountInKobo: z.number().int().positive(),
});

export const updateBudgetSchema = z.object({
  amountInKobo: z.number().int().positive().optional(),
  departmentId: z.string().min(1).optional(),
  fundId: z.string().min(1).optional(),
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export const createBudgetPeriodSchema = z.object({
  fiscalYear: z.number().int().min(2000).max(2100),
  submissionDeadline: z.string().datetime().optional(),
});

export const updateBudgetPeriodSchema = z.object({
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  status: z.enum(["DRAFT", "SUBMISSION_OPEN", "UNDER_REVIEW", "APPROVED_AND_LOCKED"]).optional(),
  submissionDeadline: z.string().datetime().optional().nullable(),
});

export const createDepartmentBudgetSchema = z.object({
  budgetPeriodId: z.string().uuid(),
  departmentId: z.string().uuid(),
  totalProposedAmount: z.number().int().nonnegative().optional(),
  totalApprovedAmount: z.number().int().nonnegative().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "REVISED", "APPROVED", "REJECTED"]).optional(),
  rejectionNotes: z.string().optional().nullable(),
});

export const updateDepartmentBudgetSchema = z.object({
  totalProposedAmount: z.number().int().nonnegative().optional(),
  totalApprovedAmount: z.number().int().nonnegative().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "REVISED", "APPROVED", "REJECTED"]).optional(),
  rejectionNotes: z.string().optional().nullable(),
});

export const createBudgetItemSchema = z.object({
  departmentBudgetId: z.string().uuid(),
  categoryId: z.string().uuid(),
  itemName: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  unitCost: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  proposedTotal: z.number().int().positive(),
  approvedTotal: z.number().int().nonnegative().optional().nullable(),
});

export const updateBudgetItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  itemName: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  unitCost: z.number().int().positive().optional(),
  quantity: z.number().int().positive().optional(),
  proposedTotal: z.number().int().positive().optional(),
  approvedTotal: z.number().int().nonnegative().optional().nullable(),
});

export const submitDepartmentBudgetSchema = z.object({
  rejectionNotes: z.string().optional().nullable(),
});

export const approveDepartmentBudgetSchema = z.object({
  items: z.array(z.object({
    budgetItemId: z.string().uuid(),
    approvedTotal: z.number().int().nonnegative(),
  })),
});

export const approveBudgetPeriodSchema = z.object({
  budgetPeriodId: z.string().uuid(),
});

export const cancelDisbursementSchema = z.object({
  reason: z.string().min(1),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().min(3).max(3).optional().default(DEFAULT_CURRENCY),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional().default(1),
  timezone: z.string().optional().default("Africa/Lagos"),
  requireMfa: z.boolean().optional().default(false),
  sessionTimeoutMinutes: z.number().int().positive().optional().default(480),
});

const ISO_CURRENCY = /^[A-Z]{3}$/;
const IANA_TIMEZONE = /^[A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?$/;
const SUPPORTED_CURRENCIES: string[] | null = (() => {
  const fn = (Intl as any).supportedValuesOf;
  if (typeof fn === "function") {
    try {
      return fn("currency");
    } catch {
      return null;
    }
  }
  return null;
})();

export function isValidTimeZone(tz: string): boolean {
  if (tz !== "UTC" && !IANA_TIMEZONE.test(tz)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isValidCurrencyCode(code: string): boolean {
  if (!ISO_CURRENCY.test(code)) return false;
  if (SUPPORTED_CURRENCIES) return SUPPORTED_CURRENCIES.includes(code.toUpperCase());
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}

export const systemSettingsSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").optional(),
  baseCurrency: z
    .string()
    .min(1, "Base currency is required")
    .refine((val) => isValidCurrencyCode(val), { message: "Base currency must be a valid ISO 4217 currency code" }),
  fiscalYearStartMonth: z
    .number()
    .int()
    .min(1, "Fiscal year start month must be between 1 and 12")
    .max(12, "Fiscal year start month must be between 1 and 12"),
  timezone: z
    .string()
    .refine((val) => isValidTimeZone(val), { message: "Timezone must be a valid IANA timezone identifier" }),
  requireMfa: z.boolean(),
  sessionTimeoutMinutes: z
    .number()
    .int()
    .min(15, "Session timeout must be between 15 and 1440 minutes")
    .max(1440, "Session timeout must be between 15 and 1440 minutes"),
  address: z.string().max(300, "Address must be 300 characters or fewer").optional(),
  phone: z.string().max(60, "Phone must be 60 characters or fewer").optional(),
  email: z
    .string()
    .max(160, "Email must be 160 characters or fewer")
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Email must be a valid email address",
    })
    .optional(),
  logoUrl: z
    .string()
    .max(500, "Logo URL must be 500 characters or fewer")
    .refine((val) => {
      if (val === "") return true;
      try {
        const protocol = new URL(val).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, { message: "Logo URL must be a valid http(s) URL" })
    .optional(),
});

export const systemSettingsUpdateSchema = systemSettingsSchema.partial();
