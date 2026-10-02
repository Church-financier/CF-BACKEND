import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const getBalanceSheet: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStatementOfActivities: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBudgetVsActual: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTrialBalance: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCashFlow: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const exportReport: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMetrics: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getIncomeOverview: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reportController: {
    getBalanceSheet: typeof getBalanceSheet;
    getStatementOfActivities: typeof getStatementOfActivities;
    getBudgetVsActual: typeof getBudgetVsActual;
    getTrialBalance: typeof getTrialBalance;
    getCashFlow: typeof getCashFlow;
    exportReport: typeof exportReport;
    getMetrics: typeof getMetrics;
    getIncomeOverview: typeof getIncomeOverview;
};
//# sourceMappingURL=reportController.d.ts.map