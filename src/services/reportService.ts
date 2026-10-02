import { prisma } from "../lib/prisma";
import { journalService } from "./journalService";
import { fileStorage, generateStorageKey } from "./fileStorage";
import { computeFundBalances, sumBalances } from "./balanceService";
import { fiscalYearOf } from "../utils/fiscalYear";
import { getOrgSettings } from "./systemSettingsService";
import { getOrgBranding } from "./orgBrandingService";
import { normalizeCurrencyCode } from "../utils/documentCurrency";
import { buildCsvDocument } from "./reportCsvBuilder";
import { buildPdfDocument } from "./reportPdfBuilder";
import { buildWorkbook } from "./reportXlsxBuilder";
import { formatDateOnly } from "./pdfReportRenderer";
import {
  constrainDepartmentId,
  constrainFundIds,
  type ReportScope,
} from "./reportScopeService";
import {
  moneyCell,
  moneyHeader,
  numberCell,
  textCell,
  type ReportBlock,
  type ReportModel,
  type ReportRow,
  type ReportSection,
} from "./reportExportModel";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Merge a fund restriction into a Prisma `where` clause.
 *
 * `fundIds === undefined` means the caller is allowed every fund. An empty
 * array is a real restriction — "no funds are in scope" — and must yield an
 * empty result set, never an unfiltered one.
 */
function fundRestriction(fundIds: string[] | undefined): Record<string, unknown> {
  return fundIds === undefined ? {} : { fundId: { in: fundIds } };
}

async function fetchStatementOfActivities(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]) {
  const where: any = { organizationId, ...fundRestriction(fundIds) };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const entries = await prisma.ledgerEntry.findMany({
    where: { ...where, reversedById: null },
    include: { fund: { select: { id: true, name: true } } },
  });

  const totals: Record<string, bigint> = { DONATION: BigInt(0), EXPENSE: BigInt(0), TRANSFER: BigInt(0) };
  const byFund: Record<string, { income: bigint; expenses: bigint }> = {};
  for (const e of entries) {
    totals[e.type] = (totals[e.type] ?? BigInt(0)) + e.amountInKobo;
    if (!byFund[e.fundId]) byFund[e.fundId] = { income: BigInt(0), expenses: BigInt(0) };
    if (e.type === "DONATION" || e.type === "TRANSFER") byFund[e.fundId].income += e.amountInKobo;
    if (e.type === "EXPENSE") byFund[e.fundId].expenses += e.amountInKobo;
  }

  return {
    totals,
    byFund,
    netIncome: (totals.DONATION ?? BigInt(0)) + (totals.TRANSFER ?? BigInt(0)) - (totals.EXPENSE ?? BigInt(0)),
    totalIncome: (totals.DONATION ?? BigInt(0)) + (totals.TRANSFER ?? BigInt(0)),
    totalExpenses: totals.EXPENSE ?? BigInt(0),
  };
}

async function fetchBalanceSheet(organizationId: string, endDate?: Date, fundIds?: string[]) {
  const dateFilter: any = {
    reversedById: null,
    ...(endDate ? { createdAt: { lte: endDate } } : {}),
    ...fundRestriction(fundIds),
  };

  const accounts = await prisma.chartOfAccounts.findMany({
    where: { organizationId, isActive: true },
    include: {
      journalLines: {
        where: {
          journalEntry: {
            status: "POSTED",
            ledgerEntries: { some: dateFilter },
          },
        },
      },
    },
  });

  const grouped: Record<string, { accounts: any[]; total: bigint }> = {
    ASSET: { accounts: [], total: BigInt(0) },
    LIABILITY: { accounts: [], total: BigInt(0) },
    EQUITY: { accounts: [], total: BigInt(0) },
    INCOME: { accounts: [], total: BigInt(0) },
    EXPENSE: { accounts: [], total: BigInt(0) },
  };

  for (const account of accounts) {
    const debit = account.journalLines.reduce<bigint>((s, l) => s + l.debitInKobo, BigInt(0));
    const credit = account.journalLines.reduce<bigint>((s, l) => s + l.creditInKobo, BigInt(0));
    const balance = debit - credit;
    grouped[account.type].accounts.push({
      id: account.id,
      code: account.code,
      name: account.name,
      balance,
    });
    grouped[account.type].total += balance;
  }

  const netIncome = grouped.INCOME.total - grouped.EXPENSE.total;
  const equityWithEarnings = grouped.EQUITY.total + netIncome;
  const totalLiabilitiesAndEquity = grouped.LIABILITY.total + equityWithEarnings;

  return {
    asOf: endDate ?? new Date(),
    sections: {
      ASSET: grouped.ASSET,
      LIABILITY: grouped.LIABILITY,
      EQUITY: grouped.EQUITY,
      INCOME: grouped.INCOME,
      EXPENSE: grouped.EXPENSE,
    },
    netIncome,
    equityWithEarnings,
    totalLiabilitiesAndEquity,
    balanced: grouped.ASSET.total === totalLiabilitiesAndEquity,
  };
}

async function fetchCashFlow(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]) {
  const where: any = {
    organizationId,
    reversedById: null,
    ...fundRestriction(fundIds),
  };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  let openingBalance = BigInt(0);
  if (startDate) {
    const priorWhere: any = {
      organizationId,
      createdAt: { lt: startDate },
      reversedById: null,
      ...fundRestriction(fundIds),
    };
    const prior = await prisma.ledgerEntry.findMany({
      where: priorWhere,
      select: { amountInKobo: true, type: true },
    });
    for (const e of prior) {
      if (e.type === "DONATION" || e.type === "TRANSFER") openingBalance += e.amountInKobo;
      else if (e.type === "EXPENSE") openingBalance -= e.amountInKobo;
    }
  }

  let cashInflow = BigInt(0);
  let cashOutflow = BigInt(0);
  for (const e of entries) {
    if (e.type === "DONATION" || e.type === "TRANSFER") cashInflow += e.amountInKobo;
    else if (e.type === "EXPENSE") cashOutflow += e.amountInKobo;
  }

  return {
    startDate: startDate ?? null,
    endDate: endDate ?? new Date(),
    openingBalance,
    cashInflow,
    cashOutflow,
    netCashFlow: cashInflow - cashOutflow,
    closingBalance: openingBalance + (cashInflow - cashOutflow),
  };
}

/** Human-readable period label used in report metadata rows. */
function periodLabel(startDate?: Date, endDate?: Date, timezone = "Africa/Lagos"): string {
  if (startDate && endDate) {
    return `${formatDateOnly(startDate, timezone)} – ${formatDateOnly(endDate, timezone)}`;
  }
  if (endDate) return `As at ${formatDateOnly(endDate, timezone)}`;
  if (startDate) return `From ${formatDateOnly(startDate, timezone)}`;
  return "All dates";
}

function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

export const reportService = {
  async getStatementOfActivities(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]) {
    const data = await fetchStatementOfActivities(organizationId, startDate, endDate, fundIds);
    return {
      startDate: startDate ?? null,
      endDate: endDate ?? new Date(),
      totalIncome: data.totalIncome.toString(),
      totalExpenses: data.totalExpenses.toString(),
      netIncome: data.netIncome.toString(),
      byFund: Object.entries(data.byFund).map(([fundId, v]) => ({
        fundId,
        income: v.income.toString(),
        expenses: v.expenses.toString(),
        net: (v.income - v.expenses).toString(),
      })),
    };
  },

  async getBalanceSheet(organizationId: string, endDate?: Date, fundIds?: string[]) {
    const data = await fetchBalanceSheet(organizationId, endDate, fundIds);
    return {
      asOf: data.asOf,
      assets: data.sections.ASSET.accounts.map((a) => ({ ...a, balance: a.balance.toString() })),
      totalAssets: data.sections.ASSET.total.toString(),
      liabilities: data.sections.LIABILITY.accounts.map((a) => ({ ...a, balance: a.balance.toString() })),
      totalLiabilities: data.sections.LIABILITY.total.toString(),
      equity: data.sections.EQUITY.accounts.map((a) => ({ ...a, balance: a.balance.toString() })),
      totalEquity: data.sections.EQUITY.total.toString(),
      netIncome: data.netIncome.toString(),
      equityWithEarnings: data.equityWithEarnings.toString(),
      totalLiabilitiesAndEquity: data.totalLiabilitiesAndEquity.toString(),
      balanced: data.balanced,
    };
  },

  async getCashFlow(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]) {
    const data = await fetchCashFlow(organizationId, startDate, endDate, fundIds);
    return {
      startDate: data.startDate,
      endDate: data.endDate,
      openingBalance: data.openingBalance.toString(),
      cashInflow: data.cashInflow.toString(),
      cashOutflow: data.cashOutflow.toString(),
      netCashFlow: data.netCashFlow.toString(),
      closingBalance: data.closingBalance.toString(),
    };
  },

  async getTrialBalance(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]) {
    return journalService.getTrialBalance(organizationId, startDate, endDate, fundIds);
  },

  async getBudgetVsActual(organizationId: string, departmentIds?: string[]) {
    const where: any = { organizationId };
    // An empty array is a real restriction: a caller with no department in
    // scope must not see every department's budget.
    if (departmentIds !== undefined) where.departmentId = { in: departmentIds };

    const budgets = await prisma.budget.findMany({
      where,
      include: { department: true, fund: true },
    });

    const results: any[] = [];
    for (const budget of budgets) {
      const start = new Date(budget.fiscalYear, budget.month - 1, 1);
      const end = new Date(budget.fiscalYear, budget.month, 0, 23, 59, 59);
      const actual = await prisma.ledgerEntry.aggregate({
        where: {
          fundId: budget.fundId,
          organizationId,
          createdAt: { gte: start, lte: end },
          type: { in: ["DONATION", "TRANSFER", "EXPENSE"] },
          reversedById: null,
          // Only expenses belong to a department's spend; donations and
          // transfers on the same fund are organization-level income, so a
          // department-scoped caller must not see them as its "actual".
          ...(departmentIds === undefined ? {} : { type: "EXPENSE" as const }),
        },
        _sum: { amountInKobo: true },
      });
      const actualAmount = actual._sum.amountInKobo ?? BigInt(0);
      results.push({
        departmentId: budget.departmentId,
        departmentName: budget.department.name,
        fundId: budget.fundId,
        fundName: budget.fund.name,
        fiscalYear: budget.fiscalYear,
        month: budget.month,
        budgetedAmount: budget.amountInKobo.toString(),
        actualAmount: actualAmount.toString(),
        variance: (budget.amountInKobo - actualAmount).toString(),
      });
    }
    return results;
  },

  async getMetrics(organizationId: string, fundIds?: string[], departmentIds?: string[]) {
    const where: any = { organizationId, reversedById: null, ...fundRestriction(fundIds) };
    // `departmentIds === undefined` is organization-wide access. An empty array
    // is a real scope with nothing in it, so department-owned collections must
    // filter against it rather than being left unfiltered.
    const scopedDepartments = departmentIds;
    const disbursementWhere: any = { status: { in: ["PENDING", "FIRST_APPROVED"] }, organizationId };
    if (scopedDepartments) disbursementWhere.departmentId = { in: scopedDepartments };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    // Pledges are held against a fund, so they follow the same fund scope as
    // the rest of the figures.
    const pledgeWhere: any = { organizationId, status: "ACTIVE", ...fundRestriction(fundIds) };

    const balances = await computeFundBalances(organizationId, fundIds);
    const total = sumBalances(balances.values());

    const funds = await prisma.fund.findMany({
      where: {
        organizationId,
        ...(fundIds === undefined ? {} : { id: { in: fundIds } }),
      },
      select: { id: true, name: true, isRestricted: true },
      orderBy: { name: "asc" },
    });

    const orgSettings = await getOrgSettings(organizationId);
    const year = fiscalYearOf(new Date(), orgSettings?.fiscalYearStartMonth ?? 1);
    let departmentBudgetTotal = BigInt(0);
    if (scopedDepartments) {
      const budgets = await prisma.budget.findMany({
        where: { organizationId, departmentId: { in: scopedDepartments }, fiscalYear: year },
        select: { amountInKobo: true },
      });
      departmentBudgetTotal = budgets.reduce((sum, b) => sum + b.amountInKobo, BigInt(0));
    }

    const [
      pendingDisbursements,
      recentLedger,
      totalContributionsResult,
      totalExpensesResult,
      recentContributions,
      activePledges,
      totalPledgeAmount,
      totalPledgeReceived,
      memberCount,
    ] = await Promise.all([
      prisma.disbursementRequest.count({ where: disbursementWhere }),
      prisma.ledgerEntry.count({
        where: { ...where, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.ledgerEntry.aggregate({
        where: { ...where, type: { in: ["DONATION", "TRANSFER"] } },
        _sum: { amountInKobo: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amountInKobo: true },
      }),
      prisma.ledgerEntry.count({
        where: { ...where, type: "DONATION", createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.pledge.count({ where: pledgeWhere }),
      prisma.pledge.aggregate({
        where: pledgeWhere,
        _sum: { amountInKobo: true },
      }),
      prisma.pledgeContribution.aggregate({
        where: {
          organizationId,
          ...(fundIds === undefined ? {} : { pledge: { fundId: { in: fundIds } } }),
        },
        _sum: { amountInKobo: true },
      }),
      // Member counts describe the organization, not a department's finances,
      // so they stay organization-wide.
      prisma.member.count({ where: { organizationId, isActive: true } }),
    ]);

    const pledgedTotal = totalPledgeAmount._sum.amountInKobo ?? BigInt(0);
    const receivedTotal = totalPledgeReceived._sum.amountInKobo ?? BigInt(0);
    const outstandingPledges = pledgedTotal - receivedTotal;

    const awaitingSecondApproval = await prisma.disbursementRequest.count({
      where: {
        status: "FIRST_APPROVED",
        organizationId,
        ...(scopedDepartments ? { departmentId: { in: scopedDepartments } } : {}),
      },
    });
    const awaitingPayout = await prisma.disbursementRequest.count({
      where: {
        status: "APPROVED",
        organizationId,
        ...(scopedDepartments ? { departmentId: { in: scopedDepartments } } : {}),
      },
    });

    return {
      totalFunds: total.balanceInKobo.toString(),
      totalContributions: (totalContributionsResult._sum.amountInKobo ?? BigInt(0)).toString(),
      totalExpenses: (totalExpensesResult._sum.amountInKobo ?? BigInt(0)).toString(),
      netIncome: (
        (totalContributionsResult._sum.amountInKobo ?? BigInt(0)) -
        (totalExpensesResult._sum.amountInKobo ?? BigInt(0))
      ).toString(),
      cashInflow: total.inflowInKobo.toString(),
      cashOutflow: total.outflowInKobo.toString(),
      departmentBudget: departmentBudgetTotal.toString(),
      fundBalances: funds.map((fund) => {
        const balance = balances.get(fund.id);
        return {
          fundId: fund.id,
          name: fund.name,
          isRestricted: fund.isRestricted,
          inflowInKobo: (balance?.inflowInKobo ?? BigInt(0)).toString(),
          outflowInKobo: (balance?.outflowInKobo ?? BigInt(0)).toString(),
          balanceInKobo: (balance?.balanceInKobo ?? BigInt(0)).toString(),
        };
      }),
      pendingDisbursements,
      awaitingSecondApproval,
      awaitingPayout,
      recentLedger,
      recentContributions,
      activePledges,
      totalPledged: pledgedTotal.toString(),
      totalPledgeReceived: receivedTotal.toString(),
      outstandingPledges: outstandingPledges.toString(),
      memberCount,
    };
  },

  /**
   * Build the format-agnostic report model. Each report type groups its data
   * into titled sections with subtotal and total rows so PDF, Excel and CSV
   * all present the same structure.
   */
  async buildReportModel(
    reportType: string,
    params: Record<string, string | undefined>,
    organizationId: string,
    scope?: ReportScope
  ): Promise<ReportModel> {
    const startDate = params.startDate ? new Date(params.startDate) : undefined;
    const endDate = params.endDate ? new Date(params.endDate) : undefined;
    const requestedFundIds = params.fundId
      ? params.fundId.split(",").map((f) => f.trim()).filter(Boolean)
      : undefined;
    // An exported report must honour the same department scope as the on-screen
    // preview, so the fund list is constrained here rather than trusted.
    const fundIds = scope ? constrainFundIds(requestedFundIds, scope) : requestedFundIds;
    const departmentIds = scope?.departmentIds;
    const departmentId = scope ? constrainDepartmentId(params.departmentId, scope) : params.departmentId;

    const branding = await getOrgBranding(organizationId);
    const currency = normalizeCurrencyCode(branding.currency);
    const timezone = branding.timezone;
    const generatedAt = new Date();

    const meta: Array<{ label: string; value: string }> = [
      { label: "Period", value: periodLabel(startDate, endDate, timezone) },
    ];
    // State the scope on the document itself, so a department-scoped export
    // can never be mistaken for an organization-wide one.
    if (departmentIds !== undefined) {
      meta.push({
        label: "Department",
        value:
          departmentIds.length === 0
            ? "No department assigned"
            : scope!.departmentNames.join(", ") || "Assigned department",
      });
    }
    if (fundIds && fundIds.length > 0) {
      const funds = await prisma.fund.findMany({
        where: { organizationId, id: { in: fundIds } },
        select: { name: true },
      });
      meta.push({
        label: "Funds",
        value: funds.length > 0 ? funds.map((fund) => fund.name).join(", ") : "Selected funds",
      });
    }

    const base = { branding, currency, timezone, generatedAt, meta };
    const accountColumns = [
      { header: "Account Code", type: "code" as const, flex: 1.2, mono: true },
      { header: "Account Name", type: "text" as const, flex: 3 },
      { header: moneyHeader("Balance", currency), type: "money" as const, align: "right" as const, flex: 2 },
    ];

    const accountSection = (
      title: string,
      accounts: Array<{ code: string; name: string; balance: bigint }>,
      totalLabel: string,
      total: bigint
    ): ReportSection => {
      const rows: ReportRow[] = accounts.map((account) => ({
        kind: "data",
        cells: [textCell(account.code, "code"), textCell(account.name), moneyCell(account.balance, currency)],
      }));
      rows.push({
        kind: "total",
        cells: [textCell(""), textCell(totalLabel), moneyCell(total, currency)],
      });
      return { title, columns: accountColumns, rows };
    };

    if (reportType === "balance-sheet") {
      const data = await fetchBalanceSheet(organizationId, endDate, fundIds);
      meta.push({ label: "Basis", value: "Accrual, posted journals only" });

      const equityRows: ReportRow[] = data.sections.EQUITY.accounts.map((account) => ({
        kind: "data" as const,
        cells: [textCell(account.code, "code"), textCell(account.name), moneyCell(account.balance, currency)],
      }));
      equityRows.push({
        kind: "subtotal",
        cells: [textCell(""), textCell("Net Income"), moneyCell(data.netIncome, currency)],
      });
      equityRows.push({
        kind: "total",
        cells: [textCell(""), textCell("Total Equity (incl. earnings)"), moneyCell(data.equityWithEarnings, currency)],
      });

      const checkRows: ReportRow[] = [
        { kind: "data", cells: [textCell(""), textCell("Total Liabilities + Equity"), moneyCell(data.totalLiabilitiesAndEquity, currency)] },
        { kind: "total", cells: [textCell(""), textCell(data.balanced ? "BALANCED" : "OUT OF BALANCE"), textCell(data.balanced ? "YES" : "NO", "status")] },
      ];

      const model: ReportModel = {
        ...base,
        title: "Balance Sheet",
        subtitle: periodLabel(undefined, endDate, timezone),
        sections: [
          accountSection("Assets", data.sections.ASSET.accounts, "TOTAL ASSETS", data.sections.ASSET.total),
          accountSection("Liabilities", data.sections.LIABILITY.accounts, "TOTAL LIABILITIES", data.sections.LIABILITY.total),
          { title: "Equity", columns: accountColumns, rows: equityRows },
          { title: "Balance Check", columns: accountColumns, rows: checkRows },
        ],
        blocks: [],
      };
      return model;
    }

    if (reportType === "statement-of-activities") {
      const data = await fetchStatementOfActivities(organizationId, startDate, endDate, fundIds);
      const fundNames = await prisma.fund.findMany({
        where: { organizationId, id: { in: Object.keys(data.byFund) } },
        select: { id: true, name: true },
      });
      const nameById = new Map(fundNames.map((fund) => [fund.id, fund.name]));

      const columns = [
        { header: "Fund", type: "text" as const, flex: 3 },
        { header: moneyHeader("Income", currency), type: "money" as const, align: "right" as const, flex: 2 },
        { header: moneyHeader("Expenses", currency), type: "money" as const, align: "right" as const, flex: 2 },
        { header: moneyHeader("Net", currency), type: "money" as const, align: "right" as const, flex: 2 },
      ];

      // Grouped by fund: one subtotal per fund, then the grand total.
      const byFundRows: ReportRow[] = Object.entries(data.byFund)
        .sort(([leftId], [rightId]) =>
          (nameById.get(leftId) ?? leftId).localeCompare(nameById.get(rightId) ?? rightId)
        )
        .map(([fundId, value]) => ({
          kind: "subtotal" as const,
          cells: [
            textCell(nameById.get(fundId) ?? "Unnamed fund"),
            moneyCell(value.income, currency),
            moneyCell(value.expenses, currency),
            moneyCell(value.income - value.expenses, currency),
          ],
        }));

      byFundRows.push({
        kind: "total",
        cells: [
          textCell("TOTAL"),
          moneyCell(data.totalIncome, currency),
          moneyCell(data.totalExpenses, currency),
          moneyCell(data.netIncome, currency),
        ],
      });

      const summaryRows: ReportRow[] = [
        { kind: "data", cells: [textCell("Total Income (Donations + Transfers)"), moneyCell(data.totalIncome, currency)] },
        { kind: "data", cells: [textCell("Total Expenses"), moneyCell(data.totalExpenses, currency)] },
        { kind: "total", cells: [textCell("NET INCOME"), moneyCell(data.netIncome, currency)] },
      ];

      return {
        ...base,
        title: "Statement of Activities",
        subtitle: periodLabel(startDate, endDate, timezone),
        sections: [
          {
            title: "Income and Expenses by Fund",
            subtitle: "Grouped by fund with subtotals",
            columns,
            rows: byFundRows,
          },
        ],
        blocks: [
          {
            title: "Consolidated Summary",
            columns: [
              { header: "Line Item", type: "text", flex: 3 },
              { header: moneyHeader("Amount", currency), type: "money", align: "right", flex: 2 },
            ],
            rows: summaryRows,
          },
        ],
      };
    }

    if (reportType === "trial-balance") {
      const data = await journalService.getTrialBalance(organizationId, startDate, endDate, fundIds);
      const columns = [
        { header: "Account Code", type: "code" as const, flex: 1.2, mono: true },
        { header: "Account Name", type: "text" as const, flex: 3 },
        { header: "Type", type: "status" as const, flex: 1.2, align: "center" as const },
        { header: moneyHeader("Debit", currency), type: "money" as const, align: "right" as const, flex: 1.8 },
        { header: moneyHeader("Credit", currency), type: "money" as const, align: "right" as const, flex: 1.8 },
        { header: moneyHeader("Balance", currency), type: "money" as const, align: "right" as const, flex: 1.8 },
      ];

      // Grouped by account type with a subtotal per type, then the grand total.
      const byType = new Map<string, ReportRow[]>();
      const typeTotals = new Map<string, { debit: bigint; credit: bigint }>();
      for (const line of data.lines) {
        const type = line.accountType ?? "OTHER";
        if (!byType.has(type)) {
          byType.set(type, []);
          typeTotals.set(type, { debit: BigInt(0), credit: BigInt(0) });
        }
        byType.get(type)!.push({
          kind: "data",
          cells: [
            textCell(line.accountCode ?? "", "code"),
            textCell(line.accountName ?? ""),
            textCell(type, "status"),
            moneyCell(BigInt(line.debitInKobo), currency),
            moneyCell(BigInt(line.creditInKobo), currency),
            moneyCell(BigInt(line.balance), currency),
          ],
        });
        const totals = typeTotals.get(type)!;
        totals.debit += BigInt(line.debitInKobo);
        totals.credit += BigInt(line.creditInKobo);
      }

      const rows: ReportRow[] = [];
      for (const [type, typeRows] of byType) {
        rows.push(...typeRows);
        const totals = typeTotals.get(type)!;
        rows.push({
          kind: "subtotal",
          cells: [
            textCell(""),
            textCell(`${type} SUBTOTAL`),
            textCell(""),
            moneyCell(totals.debit, currency),
            moneyCell(totals.credit, currency),
            moneyCell(totals.debit - totals.credit, currency),
          ],
        });
      }
      rows.push({
        kind: "total",
        cells: [
          textCell(""),
          textCell("TOTALS"),
          textCell(""),
          moneyCell(BigInt(data.totals.debit), currency),
          moneyCell(BigInt(data.totals.credit), currency),
          moneyCell(BigInt(data.totals.debit) - BigInt(data.totals.credit), currency),
        ],
      });

      return {
        ...base,
        title: "Trial Balance",
        subtitle: periodLabel(startDate, endDate, timezone),
        sections: [
          {
            title: "Account Balances",
            subtitle: "Grouped by account type with subtotals",
            columns,
            rows,
          },
        ],
        blocks: [],
      };
    }

    if (reportType === "cash-flow") {
      const data = await fetchCashFlow(organizationId, startDate, endDate, fundIds);
      const columns = [
        { header: "Line Item", type: "text" as const, flex: 3 },
        { header: moneyHeader("Amount", currency), type: "money" as const, align: "right" as const, flex: 2 },
      ];

      const rows: ReportRow[] = [
        { kind: "subtotal", cells: [textCell("Opening Balance"), moneyCell(data.openingBalance, currency)] },
        { kind: "data", cells: [textCell("Cash Inflow (Donations + Transfers)"), moneyCell(data.cashInflow, currency)] },
        { kind: "data", cells: [textCell("Cash Outflow (Expenses)"), moneyCell(data.cashOutflow, currency)] },
        { kind: "subtotal", cells: [textCell("Net Cash Flow"), moneyCell(data.netCashFlow, currency)] },
        { kind: "total", cells: [textCell("CLOSING BALANCE"), moneyCell(data.closingBalance, currency)] },
      ];

      return {
        ...base,
        title: "Cash Flow Statement",
        subtitle: periodLabel(startDate, endDate, timezone),
        sections: [],
        blocks: [{ title: "Cash Movement", columns, rows }],
      };
    }

    if (reportType === "budget-vs-actual") {
      const data = await this.getBudgetVsActual(organizationId, departmentIds);
      const columns = [
        { header: "Department", type: "text" as const, flex: 2 },
        { header: "Fund", type: "text" as const, flex: 2 },
        { header: "Fiscal Year", type: "number" as const, flex: 1, align: "center" as const },
        { header: "Period", type: "status" as const, flex: 1.2, align: "center" as const },
        { header: moneyHeader("Budgeted", currency), type: "money" as const, align: "right" as const, flex: 1.6 },
        { header: moneyHeader("Actual", currency), type: "money" as const, align: "right" as const, flex: 1.6 },
        { header: moneyHeader("Variance", currency), type: "money" as const, align: "right" as const, flex: 1.6 },
      ];

      // Grouped by department: subtotal per department, grand total at the end.
      const byDepartment = new Map<string, { name: string; rows: ReportRow[]; budgeted: bigint; actual: bigint }>();
      for (const entry of data) {
        if (!byDepartment.has(entry.departmentId)) {
          byDepartment.set(entry.departmentId, {
            name: entry.departmentName,
            rows: [],
            budgeted: BigInt(0),
            actual: BigInt(0),
          });
        }
        const group = byDepartment.get(entry.departmentId)!;
        group.rows.push({
          kind: "data",
          cells: [
            textCell(entry.departmentName),
            textCell(entry.fundName),
            numberCell(entry.fiscalYear),
            textCell(`${monthName(entry.month)}`, "status"),
            moneyCell(BigInt(entry.budgetedAmount), currency),
            moneyCell(BigInt(entry.actualAmount), currency),
            moneyCell(BigInt(entry.variance), currency),
          ],
        });
        group.budgeted += BigInt(entry.budgetedAmount);
        group.actual += BigInt(entry.actualAmount);
      }

      const rows: ReportRow[] = [];
      let totalBudgeted = BigInt(0);
      let totalActual = BigInt(0);
      for (const group of byDepartment.values()) {
        rows.push(...group.rows);
        rows.push({
          kind: "subtotal",
          cells: [
            textCell(`${group.name} SUBTOTAL`),
            textCell(""),
            textCell(""),
            textCell(""),
            moneyCell(group.budgeted, currency),
            moneyCell(group.actual, currency),
            moneyCell(group.budgeted - group.actual, currency),
          ],
        });
        totalBudgeted += group.budgeted;
        totalActual += group.actual;
      }
      rows.push({
        kind: "total",
        cells: [
          textCell("GRAND TOTAL"),
          textCell(""),
          textCell(""),
          textCell(""),
          moneyCell(totalBudgeted, currency),
          moneyCell(totalActual, currency),
          moneyCell(totalBudgeted - totalActual, currency),
        ],
      });

      return {
        ...base,
        title: "Budget vs Actual",
        subtitle: departmentIds ? "Department-scoped" : departmentId ? "Single department" : "All departments",
        sections: [
          {
            title: "Budget Performance",
            subtitle: "Grouped by department with subtotals",
            columns,
            rows,
          },
        ],
        blocks: [],
      };
    }

    throw new Error(`Unknown report type: ${reportType}`);
  },

  async exportReport(
    format: "CSV" | "XLSX" | "PDF",
    reportType: string,
    params: Record<string, string | undefined>,
    organizationId: string,
    scope?: ReportScope
  ) {
    const model = await this.buildReportModel(reportType, params, organizationId, scope);
    const dateStamp = model.generatedAt.toISOString().slice(0, 10);

    if (format === "CSV") {
      const csv = buildCsvDocument(model);
      const result = {
        format: "CSV" as const,
        // charset is explicit so browsers and spreadsheet apps honour the BOM.
        contentType: "text/csv; charset=utf-8",
        data: csv,
        filename: `${reportType}-${dateStamp}.csv`,
      };
      void fileStorage
        .upload(generateStorageKey(`reports/${reportType}`, ".csv"), Buffer.from(csv, "utf8"), "text/csv; charset=utf-8")
        .catch((e) => console.error("[storage:report:upload:error]", e));
      return result;
    }

    if (format === "XLSX") {
      const buffer = await buildWorkbook(model);
      const result = {
        format: "XLSX" as const,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        data: buffer,
        filename: `${reportType}-${dateStamp}.xlsx`,
      };
      void fileStorage
        .upload(generateStorageKey(`reports/${reportType}`, ".xlsx"), buffer, result.contentType)
        .catch((e) => console.error("[storage:report:upload:error]", e));
      return result;
    }

    if (format === "PDF") {
      const buffer = await buildPdfDocument(model);
      const result = {
        format: "PDF" as const,
        contentType: "application/pdf",
        data: buffer,
        filename: `${reportType}-${dateStamp}.pdf`,
      };
      void fileStorage
        .upload(generateStorageKey(`reports/${reportType}`, ".pdf"), buffer, result.contentType)
        .catch((e) => console.error("[storage:report:upload:error]", e));
      return result;
    }

    throw new Error(`Unsupported format: ${format}`);
  },
};
