"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const prisma_1 = require("../lib/prisma");
const journalService_1 = require("./journalService");
const fileStorage_1 = require("./fileStorage");
const balanceService_1 = require("./balanceService");
const fiscalYear_1 = require("../utils/fiscalYear");
const systemSettingsService_1 = require("./systemSettingsService");
const orgBrandingService_1 = require("./orgBrandingService");
const documentCurrency_1 = require("../utils/documentCurrency");
const reportCsvBuilder_1 = require("./reportCsvBuilder");
const reportPdfBuilder_1 = require("./reportPdfBuilder");
const reportXlsxBuilder_1 = require("./reportXlsxBuilder");
const pdfReportRenderer_1 = require("./pdfReportRenderer");
const reportScopeService_1 = require("./reportScopeService");
const reportExportModel_1 = require("./reportExportModel");
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
function fundRestriction(fundIds) {
    return fundIds === undefined ? {} : { fundId: { in: fundIds } };
}
async function fetchStatementOfActivities(organizationId, startDate, endDate, fundIds) {
    const where = { organizationId, ...fundRestriction(fundIds) };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = startDate;
        if (endDate)
            where.createdAt.lte = endDate;
    }
    const entries = await prisma_1.prisma.ledgerEntry.findMany({
        where: { ...where, reversedById: null },
        include: { fund: { select: { id: true, name: true } } },
    });
    const totals = { DONATION: BigInt(0), EXPENSE: BigInt(0), TRANSFER: BigInt(0) };
    const byFund = {};
    for (const e of entries) {
        totals[e.type] = (totals[e.type] ?? BigInt(0)) + e.amountInKobo;
        if (!byFund[e.fundId])
            byFund[e.fundId] = { income: BigInt(0), expenses: BigInt(0) };
        if (e.type === "DONATION" || e.type === "TRANSFER")
            byFund[e.fundId].income += e.amountInKobo;
        if (e.type === "EXPENSE")
            byFund[e.fundId].expenses += e.amountInKobo;
    }
    return {
        totals,
        byFund,
        netIncome: (totals.DONATION ?? BigInt(0)) + (totals.TRANSFER ?? BigInt(0)) - (totals.EXPENSE ?? BigInt(0)),
        totalIncome: (totals.DONATION ?? BigInt(0)) + (totals.TRANSFER ?? BigInt(0)),
        totalExpenses: totals.EXPENSE ?? BigInt(0),
    };
}
async function fetchBalanceSheet(organizationId, endDate, fundIds) {
    const dateFilter = {
        reversedById: null,
        ...(endDate ? { createdAt: { lte: endDate } } : {}),
        ...fundRestriction(fundIds),
    };
    const accounts = await prisma_1.prisma.chartOfAccounts.findMany({
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
    const grouped = {
        ASSET: { accounts: [], total: BigInt(0) },
        LIABILITY: { accounts: [], total: BigInt(0) },
        EQUITY: { accounts: [], total: BigInt(0) },
        INCOME: { accounts: [], total: BigInt(0) },
        EXPENSE: { accounts: [], total: BigInt(0) },
    };
    for (const account of accounts) {
        const debit = account.journalLines.reduce((s, l) => s + l.debitInKobo, BigInt(0));
        const credit = account.journalLines.reduce((s, l) => s + l.creditInKobo, BigInt(0));
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
async function fetchCashFlow(organizationId, startDate, endDate, fundIds) {
    const where = {
        organizationId,
        reversedById: null,
        ...fundRestriction(fundIds),
    };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = startDate;
        if (endDate)
            where.createdAt.lte = endDate;
    }
    const entries = await prisma_1.prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: "asc" },
    });
    let openingBalance = BigInt(0);
    if (startDate) {
        const priorWhere = {
            organizationId,
            createdAt: { lt: startDate },
            reversedById: null,
            ...fundRestriction(fundIds),
        };
        const prior = await prisma_1.prisma.ledgerEntry.findMany({
            where: priorWhere,
            select: { amountInKobo: true, type: true },
        });
        for (const e of prior) {
            if (e.type === "DONATION" || e.type === "TRANSFER")
                openingBalance += e.amountInKobo;
            else if (e.type === "EXPENSE")
                openingBalance -= e.amountInKobo;
        }
    }
    let cashInflow = BigInt(0);
    let cashOutflow = BigInt(0);
    for (const e of entries) {
        if (e.type === "DONATION" || e.type === "TRANSFER")
            cashInflow += e.amountInKobo;
        else if (e.type === "EXPENSE")
            cashOutflow += e.amountInKobo;
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
function periodLabel(startDate, endDate, timezone = "Africa/Lagos") {
    if (startDate && endDate) {
        return `${(0, pdfReportRenderer_1.formatDateOnly)(startDate, timezone)} – ${(0, pdfReportRenderer_1.formatDateOnly)(endDate, timezone)}`;
    }
    if (endDate)
        return `As at ${(0, pdfReportRenderer_1.formatDateOnly)(endDate, timezone)}`;
    if (startDate)
        return `From ${(0, pdfReportRenderer_1.formatDateOnly)(startDate, timezone)}`;
    return "All dates";
}
function monthName(month) {
    return MONTH_NAMES[month - 1] ?? String(month);
}
exports.reportService = {
    async getStatementOfActivities(organizationId, startDate, endDate, fundIds) {
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
    async getBalanceSheet(organizationId, endDate, fundIds) {
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
    async getCashFlow(organizationId, startDate, endDate, fundIds) {
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
    async getTrialBalance(organizationId, startDate, endDate, fundIds) {
        return journalService_1.journalService.getTrialBalance(organizationId, startDate, endDate, fundIds);
    },
    async getBudgetVsActual(organizationId, departmentIds) {
        const where = { organizationId };
        // An empty array is a real restriction: a caller with no department in
        // scope must not see every department's budget.
        if (departmentIds !== undefined)
            where.departmentId = { in: departmentIds };
        const budgets = await prisma_1.prisma.budget.findMany({
            where,
            include: { department: true, fund: true },
        });
        const results = [];
        for (const budget of budgets) {
            const start = new Date(budget.fiscalYear, budget.month - 1, 1);
            const end = new Date(budget.fiscalYear, budget.month, 0, 23, 59, 59);
            const actual = await prisma_1.prisma.ledgerEntry.aggregate({
                where: {
                    fundId: budget.fundId,
                    organizationId,
                    createdAt: { gte: start, lte: end },
                    type: { in: ["DONATION", "TRANSFER", "EXPENSE"] },
                    reversedById: null,
                    // Only expenses belong to a department's spend; donations and
                    // transfers on the same fund are organization-level income, so a
                    // department-scoped caller must not see them as its "actual".
                    ...(departmentIds === undefined ? {} : { type: "EXPENSE" }),
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
    async getMetrics(organizationId, fundIds, departmentIds) {
        const where = { organizationId, reversedById: null, ...fundRestriction(fundIds) };
        // `departmentIds === undefined` is organization-wide access. An empty array
        // is a real scope with nothing in it, so department-owned collections must
        // filter against it rather than being left unfiltered.
        const scopedDepartments = departmentIds;
        const disbursementWhere = { status: { in: ["PENDING", "FIRST_APPROVED"] }, organizationId };
        if (scopedDepartments)
            disbursementWhere.departmentId = { in: scopedDepartments };
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        // Pledges are held against a fund, so they follow the same fund scope as
        // the rest of the figures.
        const pledgeWhere = { organizationId, status: "ACTIVE", ...fundRestriction(fundIds) };
        const balances = await (0, balanceService_1.computeFundBalances)(organizationId, fundIds);
        const total = (0, balanceService_1.sumBalances)(balances.values());
        const funds = await prisma_1.prisma.fund.findMany({
            where: {
                organizationId,
                ...(fundIds === undefined ? {} : { id: { in: fundIds } }),
            },
            select: { id: true, name: true, isRestricted: true },
            orderBy: { name: "asc" },
        });
        const orgSettings = await (0, systemSettingsService_1.getOrgSettings)(organizationId);
        const year = (0, fiscalYear_1.fiscalYearOf)(new Date(), orgSettings?.fiscalYearStartMonth ?? 1);
        let departmentBudgetTotal = BigInt(0);
        if (scopedDepartments) {
            const budgets = await prisma_1.prisma.budget.findMany({
                where: { organizationId, departmentId: { in: scopedDepartments }, fiscalYear: year },
                select: { amountInKobo: true },
            });
            departmentBudgetTotal = budgets.reduce((sum, b) => sum + b.amountInKobo, BigInt(0));
        }
        const [pendingDisbursements, recentLedger, totalContributionsResult, totalExpensesResult, recentContributions, activePledges, totalPledgeAmount, totalPledgeReceived, memberCount,] = await Promise.all([
            prisma_1.prisma.disbursementRequest.count({ where: disbursementWhere }),
            prisma_1.prisma.ledgerEntry.count({
                where: { ...where, createdAt: { gte: thirtyDaysAgo } },
            }),
            prisma_1.prisma.ledgerEntry.aggregate({
                where: { ...where, type: { in: ["DONATION", "TRANSFER"] } },
                _sum: { amountInKobo: true },
            }),
            prisma_1.prisma.ledgerEntry.aggregate({
                where: { ...where, type: "EXPENSE" },
                _sum: { amountInKobo: true },
            }),
            prisma_1.prisma.ledgerEntry.count({
                where: { ...where, type: "DONATION", createdAt: { gte: thirtyDaysAgo } },
            }),
            prisma_1.prisma.pledge.count({ where: pledgeWhere }),
            prisma_1.prisma.pledge.aggregate({
                where: pledgeWhere,
                _sum: { amountInKobo: true },
            }),
            prisma_1.prisma.pledgeContribution.aggregate({
                where: {
                    organizationId,
                    ...(fundIds === undefined ? {} : { pledge: { fundId: { in: fundIds } } }),
                },
                _sum: { amountInKobo: true },
            }),
            // Member counts describe the organization, not a department's finances,
            // so they stay organization-wide.
            prisma_1.prisma.member.count({ where: { organizationId, isActive: true } }),
        ]);
        const pledgedTotal = totalPledgeAmount._sum.amountInKobo ?? BigInt(0);
        const receivedTotal = totalPledgeReceived._sum.amountInKobo ?? BigInt(0);
        const outstandingPledges = pledgedTotal - receivedTotal;
        const awaitingSecondApproval = await prisma_1.prisma.disbursementRequest.count({
            where: {
                status: "FIRST_APPROVED",
                organizationId,
                ...(scopedDepartments ? { departmentId: { in: scopedDepartments } } : {}),
            },
        });
        const awaitingPayout = await prisma_1.prisma.disbursementRequest.count({
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
            netIncome: ((totalContributionsResult._sum.amountInKobo ?? BigInt(0)) -
                (totalExpensesResult._sum.amountInKobo ?? BigInt(0))).toString(),
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
    async buildReportModel(reportType, params, organizationId, scope) {
        const startDate = params.startDate ? new Date(params.startDate) : undefined;
        const endDate = params.endDate ? new Date(params.endDate) : undefined;
        const requestedFundIds = params.fundId
            ? params.fundId.split(",").map((f) => f.trim()).filter(Boolean)
            : undefined;
        // An exported report must honour the same department scope as the on-screen
        // preview, so the fund list is constrained here rather than trusted.
        const fundIds = scope ? (0, reportScopeService_1.constrainFundIds)(requestedFundIds, scope) : requestedFundIds;
        const departmentIds = scope?.departmentIds;
        const departmentId = scope ? (0, reportScopeService_1.constrainDepartmentId)(params.departmentId, scope) : params.departmentId;
        const branding = await (0, orgBrandingService_1.getOrgBranding)(organizationId);
        const currency = (0, documentCurrency_1.normalizeCurrencyCode)(branding.currency);
        const timezone = branding.timezone;
        const generatedAt = new Date();
        const meta = [
            { label: "Period", value: periodLabel(startDate, endDate, timezone) },
        ];
        // State the scope on the document itself, so a department-scoped export
        // can never be mistaken for an organization-wide one.
        if (departmentIds !== undefined) {
            meta.push({
                label: "Department",
                value: departmentIds.length === 0
                    ? "No department assigned"
                    : scope.departmentNames.join(", ") || "Assigned department",
            });
        }
        if (fundIds && fundIds.length > 0) {
            const funds = await prisma_1.prisma.fund.findMany({
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
            { header: "Account Code", type: "code", flex: 1.2, mono: true },
            { header: "Account Name", type: "text", flex: 3 },
            { header: (0, reportExportModel_1.moneyHeader)("Balance", currency), type: "money", align: "right", flex: 2 },
        ];
        const accountSection = (title, accounts, totalLabel, total) => {
            const rows = accounts.map((account) => ({
                kind: "data",
                cells: [(0, reportExportModel_1.textCell)(account.code, "code"), (0, reportExportModel_1.textCell)(account.name), (0, reportExportModel_1.moneyCell)(account.balance, currency)],
            }));
            rows.push({
                kind: "total",
                cells: [(0, reportExportModel_1.textCell)(""), (0, reportExportModel_1.textCell)(totalLabel), (0, reportExportModel_1.moneyCell)(total, currency)],
            });
            return { title, columns: accountColumns, rows };
        };
        if (reportType === "balance-sheet") {
            const data = await fetchBalanceSheet(organizationId, endDate, fundIds);
            meta.push({ label: "Basis", value: "Accrual, posted journals only" });
            const equityRows = data.sections.EQUITY.accounts.map((account) => ({
                kind: "data",
                cells: [(0, reportExportModel_1.textCell)(account.code, "code"), (0, reportExportModel_1.textCell)(account.name), (0, reportExportModel_1.moneyCell)(account.balance, currency)],
            }));
            equityRows.push({
                kind: "subtotal",
                cells: [(0, reportExportModel_1.textCell)(""), (0, reportExportModel_1.textCell)("Net Income"), (0, reportExportModel_1.moneyCell)(data.netIncome, currency)],
            });
            equityRows.push({
                kind: "total",
                cells: [(0, reportExportModel_1.textCell)(""), (0, reportExportModel_1.textCell)("Total Equity (incl. earnings)"), (0, reportExportModel_1.moneyCell)(data.equityWithEarnings, currency)],
            });
            const checkRows = [
                { kind: "data", cells: [(0, reportExportModel_1.textCell)(""), (0, reportExportModel_1.textCell)("Total Liabilities + Equity"), (0, reportExportModel_1.moneyCell)(data.totalLiabilitiesAndEquity, currency)] },
                { kind: "total", cells: [(0, reportExportModel_1.textCell)(""), (0, reportExportModel_1.textCell)(data.balanced ? "BALANCED" : "OUT OF BALANCE"), (0, reportExportModel_1.textCell)(data.balanced ? "YES" : "NO", "status")] },
            ];
            const model = {
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
            const fundNames = await prisma_1.prisma.fund.findMany({
                where: { organizationId, id: { in: Object.keys(data.byFund) } },
                select: { id: true, name: true },
            });
            const nameById = new Map(fundNames.map((fund) => [fund.id, fund.name]));
            const columns = [
                { header: "Fund", type: "text", flex: 3 },
                { header: (0, reportExportModel_1.moneyHeader)("Income", currency), type: "money", align: "right", flex: 2 },
                { header: (0, reportExportModel_1.moneyHeader)("Expenses", currency), type: "money", align: "right", flex: 2 },
                { header: (0, reportExportModel_1.moneyHeader)("Net", currency), type: "money", align: "right", flex: 2 },
            ];
            // Grouped by fund: one subtotal per fund, then the grand total.
            const byFundRows = Object.entries(data.byFund)
                .sort(([leftId], [rightId]) => (nameById.get(leftId) ?? leftId).localeCompare(nameById.get(rightId) ?? rightId))
                .map(([fundId, value]) => ({
                kind: "subtotal",
                cells: [
                    (0, reportExportModel_1.textCell)(nameById.get(fundId) ?? "Unnamed fund"),
                    (0, reportExportModel_1.moneyCell)(value.income, currency),
                    (0, reportExportModel_1.moneyCell)(value.expenses, currency),
                    (0, reportExportModel_1.moneyCell)(value.income - value.expenses, currency),
                ],
            }));
            byFundRows.push({
                kind: "total",
                cells: [
                    (0, reportExportModel_1.textCell)("TOTAL"),
                    (0, reportExportModel_1.moneyCell)(data.totalIncome, currency),
                    (0, reportExportModel_1.moneyCell)(data.totalExpenses, currency),
                    (0, reportExportModel_1.moneyCell)(data.netIncome, currency),
                ],
            });
            const summaryRows = [
                { kind: "data", cells: [(0, reportExportModel_1.textCell)("Total Income (Donations + Transfers)"), (0, reportExportModel_1.moneyCell)(data.totalIncome, currency)] },
                { kind: "data", cells: [(0, reportExportModel_1.textCell)("Total Expenses"), (0, reportExportModel_1.moneyCell)(data.totalExpenses, currency)] },
                { kind: "total", cells: [(0, reportExportModel_1.textCell)("NET INCOME"), (0, reportExportModel_1.moneyCell)(data.netIncome, currency)] },
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
                            { header: (0, reportExportModel_1.moneyHeader)("Amount", currency), type: "money", align: "right", flex: 2 },
                        ],
                        rows: summaryRows,
                    },
                ],
            };
        }
        if (reportType === "trial-balance") {
            const data = await journalService_1.journalService.getTrialBalance(organizationId, startDate, endDate, fundIds);
            const columns = [
                { header: "Account Code", type: "code", flex: 1.2, mono: true },
                { header: "Account Name", type: "text", flex: 3 },
                { header: "Type", type: "status", flex: 1.2, align: "center" },
                { header: (0, reportExportModel_1.moneyHeader)("Debit", currency), type: "money", align: "right", flex: 1.8 },
                { header: (0, reportExportModel_1.moneyHeader)("Credit", currency), type: "money", align: "right", flex: 1.8 },
                { header: (0, reportExportModel_1.moneyHeader)("Balance", currency), type: "money", align: "right", flex: 1.8 },
            ];
            // Grouped by account type with a subtotal per type, then the grand total.
            const byType = new Map();
            const typeTotals = new Map();
            for (const line of data.lines) {
                const type = line.accountType ?? "OTHER";
                if (!byType.has(type)) {
                    byType.set(type, []);
                    typeTotals.set(type, { debit: BigInt(0), credit: BigInt(0) });
                }
                byType.get(type).push({
                    kind: "data",
                    cells: [
                        (0, reportExportModel_1.textCell)(line.accountCode ?? "", "code"),
                        (0, reportExportModel_1.textCell)(line.accountName ?? ""),
                        (0, reportExportModel_1.textCell)(type, "status"),
                        (0, reportExportModel_1.moneyCell)(BigInt(line.debitInKobo), currency),
                        (0, reportExportModel_1.moneyCell)(BigInt(line.creditInKobo), currency),
                        (0, reportExportModel_1.moneyCell)(BigInt(line.balance), currency),
                    ],
                });
                const totals = typeTotals.get(type);
                totals.debit += BigInt(line.debitInKobo);
                totals.credit += BigInt(line.creditInKobo);
            }
            const rows = [];
            for (const [type, typeRows] of byType) {
                rows.push(...typeRows);
                const totals = typeTotals.get(type);
                rows.push({
                    kind: "subtotal",
                    cells: [
                        (0, reportExportModel_1.textCell)(""),
                        (0, reportExportModel_1.textCell)(`${type} SUBTOTAL`),
                        (0, reportExportModel_1.textCell)(""),
                        (0, reportExportModel_1.moneyCell)(totals.debit, currency),
                        (0, reportExportModel_1.moneyCell)(totals.credit, currency),
                        (0, reportExportModel_1.moneyCell)(totals.debit - totals.credit, currency),
                    ],
                });
            }
            rows.push({
                kind: "total",
                cells: [
                    (0, reportExportModel_1.textCell)(""),
                    (0, reportExportModel_1.textCell)("TOTALS"),
                    (0, reportExportModel_1.textCell)(""),
                    (0, reportExportModel_1.moneyCell)(BigInt(data.totals.debit), currency),
                    (0, reportExportModel_1.moneyCell)(BigInt(data.totals.credit), currency),
                    (0, reportExportModel_1.moneyCell)(BigInt(data.totals.debit) - BigInt(data.totals.credit), currency),
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
                { header: "Line Item", type: "text", flex: 3 },
                { header: (0, reportExportModel_1.moneyHeader)("Amount", currency), type: "money", align: "right", flex: 2 },
            ];
            const rows = [
                { kind: "subtotal", cells: [(0, reportExportModel_1.textCell)("Opening Balance"), (0, reportExportModel_1.moneyCell)(data.openingBalance, currency)] },
                { kind: "data", cells: [(0, reportExportModel_1.textCell)("Cash Inflow (Donations + Transfers)"), (0, reportExportModel_1.moneyCell)(data.cashInflow, currency)] },
                { kind: "data", cells: [(0, reportExportModel_1.textCell)("Cash Outflow (Expenses)"), (0, reportExportModel_1.moneyCell)(data.cashOutflow, currency)] },
                { kind: "subtotal", cells: [(0, reportExportModel_1.textCell)("Net Cash Flow"), (0, reportExportModel_1.moneyCell)(data.netCashFlow, currency)] },
                { kind: "total", cells: [(0, reportExportModel_1.textCell)("CLOSING BALANCE"), (0, reportExportModel_1.moneyCell)(data.closingBalance, currency)] },
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
                { header: "Department", type: "text", flex: 2 },
                { header: "Fund", type: "text", flex: 2 },
                { header: "Fiscal Year", type: "number", flex: 1, align: "center" },
                { header: "Period", type: "status", flex: 1.2, align: "center" },
                { header: (0, reportExportModel_1.moneyHeader)("Budgeted", currency), type: "money", align: "right", flex: 1.6 },
                { header: (0, reportExportModel_1.moneyHeader)("Actual", currency), type: "money", align: "right", flex: 1.6 },
                { header: (0, reportExportModel_1.moneyHeader)("Variance", currency), type: "money", align: "right", flex: 1.6 },
            ];
            // Grouped by department: subtotal per department, grand total at the end.
            const byDepartment = new Map();
            for (const entry of data) {
                if (!byDepartment.has(entry.departmentId)) {
                    byDepartment.set(entry.departmentId, {
                        name: entry.departmentName,
                        rows: [],
                        budgeted: BigInt(0),
                        actual: BigInt(0),
                    });
                }
                const group = byDepartment.get(entry.departmentId);
                group.rows.push({
                    kind: "data",
                    cells: [
                        (0, reportExportModel_1.textCell)(entry.departmentName),
                        (0, reportExportModel_1.textCell)(entry.fundName),
                        (0, reportExportModel_1.numberCell)(entry.fiscalYear),
                        (0, reportExportModel_1.textCell)(`${monthName(entry.month)}`, "status"),
                        (0, reportExportModel_1.moneyCell)(BigInt(entry.budgetedAmount), currency),
                        (0, reportExportModel_1.moneyCell)(BigInt(entry.actualAmount), currency),
                        (0, reportExportModel_1.moneyCell)(BigInt(entry.variance), currency),
                    ],
                });
                group.budgeted += BigInt(entry.budgetedAmount);
                group.actual += BigInt(entry.actualAmount);
            }
            const rows = [];
            let totalBudgeted = BigInt(0);
            let totalActual = BigInt(0);
            for (const group of byDepartment.values()) {
                rows.push(...group.rows);
                rows.push({
                    kind: "subtotal",
                    cells: [
                        (0, reportExportModel_1.textCell)(`${group.name} SUBTOTAL`),
                        (0, reportExportModel_1.textCell)(""),
                        (0, reportExportModel_1.textCell)(""),
                        (0, reportExportModel_1.textCell)(""),
                        (0, reportExportModel_1.moneyCell)(group.budgeted, currency),
                        (0, reportExportModel_1.moneyCell)(group.actual, currency),
                        (0, reportExportModel_1.moneyCell)(group.budgeted - group.actual, currency),
                    ],
                });
                totalBudgeted += group.budgeted;
                totalActual += group.actual;
            }
            rows.push({
                kind: "total",
                cells: [
                    (0, reportExportModel_1.textCell)("GRAND TOTAL"),
                    (0, reportExportModel_1.textCell)(""),
                    (0, reportExportModel_1.textCell)(""),
                    (0, reportExportModel_1.textCell)(""),
                    (0, reportExportModel_1.moneyCell)(totalBudgeted, currency),
                    (0, reportExportModel_1.moneyCell)(totalActual, currency),
                    (0, reportExportModel_1.moneyCell)(totalBudgeted - totalActual, currency),
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
    async exportReport(format, reportType, params, organizationId, scope) {
        const model = await this.buildReportModel(reportType, params, organizationId, scope);
        const dateStamp = model.generatedAt.toISOString().slice(0, 10);
        if (format === "CSV") {
            const csv = (0, reportCsvBuilder_1.buildCsvDocument)(model);
            const result = {
                format: "CSV",
                // charset is explicit so browsers and spreadsheet apps honour the BOM.
                contentType: "text/csv; charset=utf-8",
                data: csv,
                filename: `${reportType}-${dateStamp}.csv`,
            };
            void fileStorage_1.fileStorage
                .upload((0, fileStorage_1.generateStorageKey)(`reports/${reportType}`, ".csv"), Buffer.from(csv, "utf8"), "text/csv; charset=utf-8")
                .catch((e) => console.error("[storage:report:upload:error]", e));
            return result;
        }
        if (format === "XLSX") {
            const buffer = await (0, reportXlsxBuilder_1.buildWorkbook)(model);
            const result = {
                format: "XLSX",
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                data: buffer,
                filename: `${reportType}-${dateStamp}.xlsx`,
            };
            void fileStorage_1.fileStorage
                .upload((0, fileStorage_1.generateStorageKey)(`reports/${reportType}`, ".xlsx"), buffer, result.contentType)
                .catch((e) => console.error("[storage:report:upload:error]", e));
            return result;
        }
        if (format === "PDF") {
            const buffer = await (0, reportPdfBuilder_1.buildPdfDocument)(model);
            const result = {
                format: "PDF",
                contentType: "application/pdf",
                data: buffer,
                filename: `${reportType}-${dateStamp}.pdf`,
            };
            void fileStorage_1.fileStorage
                .upload((0, fileStorage_1.generateStorageKey)(`reports/${reportType}`, ".pdf"), buffer, result.contentType)
                .catch((e) => console.error("[storage:report:upload:error]", e));
            return result;
        }
        throw new Error(`Unsupported format: ${format}`);
    },
};
//# sourceMappingURL=reportService.js.map