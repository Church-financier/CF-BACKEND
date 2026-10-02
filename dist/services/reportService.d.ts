import { type ReportScope } from "./reportScopeService";
import { type ReportModel } from "./reportExportModel";
export declare const reportService: {
    getStatementOfActivities(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]): Promise<{
        startDate: Date | null;
        endDate: Date;
        totalIncome: string;
        totalExpenses: string;
        netIncome: string;
        byFund: {
            fundId: string;
            income: string;
            expenses: string;
            net: string;
        }[];
    }>;
    getBalanceSheet(organizationId: string, endDate?: Date, fundIds?: string[]): Promise<{
        asOf: Date;
        assets: any[];
        totalAssets: string;
        liabilities: any[];
        totalLiabilities: string;
        equity: any[];
        totalEquity: string;
        netIncome: string;
        equityWithEarnings: string;
        totalLiabilitiesAndEquity: string;
        balanced: boolean;
    }>;
    getCashFlow(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]): Promise<{
        startDate: Date | null;
        endDate: Date;
        openingBalance: string;
        cashInflow: string;
        cashOutflow: string;
        netCashFlow: string;
        closingBalance: string;
    }>;
    getTrialBalance(organizationId: string, startDate?: Date, endDate?: Date, fundIds?: string[]): Promise<{
        lines: {
            accountId: string;
            accountCode: string | undefined;
            accountName: string | undefined;
            accountType: import(".prisma/client").$Enums.AccountType | undefined;
            debitInKobo: string;
            creditInKobo: string;
            balance: string;
        }[];
        totals: {
            debit: string;
            credit: string;
        };
    }>;
    getBudgetVsActual(organizationId: string, departmentIds?: string[]): Promise<any[]>;
    getMetrics(organizationId: string, fundIds?: string[], departmentIds?: string[]): Promise<{
        totalFunds: string;
        totalContributions: string;
        totalExpenses: string;
        netIncome: string;
        cashInflow: string;
        cashOutflow: string;
        departmentBudget: string;
        fundBalances: {
            fundId: string;
            name: string;
            isRestricted: boolean;
            inflowInKobo: string;
            outflowInKobo: string;
            balanceInKobo: string;
        }[];
        pendingDisbursements: number;
        awaitingSecondApproval: number;
        awaitingPayout: number;
        recentLedger: number;
        recentContributions: number;
        activePledges: number;
        totalPledged: string;
        totalPledgeReceived: string;
        outstandingPledges: string;
        memberCount: number;
    }>;
    /**
     * Build the format-agnostic report model. Each report type groups its data
     * into titled sections with subtotal and total rows so PDF, Excel and CSV
     * all present the same structure.
     */
    buildReportModel(reportType: string, params: Record<string, string | undefined>, organizationId: string, scope?: ReportScope): Promise<ReportModel>;
    exportReport(format: "CSV" | "XLSX" | "PDF", reportType: string, params: Record<string, string | undefined>, organizationId: string, scope?: ReportScope): Promise<{
        format: "CSV";
        contentType: string;
        data: string;
        filename: string;
    } | {
        format: "XLSX";
        contentType: string;
        data: Buffer<ArrayBufferLike>;
        filename: string;
    } | {
        format: "PDF";
        contentType: string;
        data: Buffer<ArrayBufferLike>;
        filename: string;
    }>;
};
//# sourceMappingURL=reportService.d.ts.map