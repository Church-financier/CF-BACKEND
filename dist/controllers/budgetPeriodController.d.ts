import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const createBudgetPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listBudgetPeriods: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBudgetPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getActiveBudgetPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBudgetPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const openBudgetSubmission: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const closeBudgetSubmission: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveAndLockBudgetPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBudgetPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const budgetPeriodController: {
    createBudgetPeriod: typeof createBudgetPeriod;
    listBudgetPeriods: typeof listBudgetPeriods;
    getBudgetPeriod: typeof getBudgetPeriod;
    getActiveBudgetPeriod: typeof getActiveBudgetPeriod;
    updateBudgetPeriod: typeof updateBudgetPeriod;
    openBudgetSubmission: typeof openBudgetSubmission;
    closeBudgetSubmission: typeof closeBudgetSubmission;
    approveAndLockBudgetPeriod: typeof approveAndLockBudgetPeriod;
    deleteBudgetPeriod: typeof deleteBudgetPeriod;
};
//# sourceMappingURL=budgetPeriodController.d.ts.map