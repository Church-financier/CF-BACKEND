import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const createBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listBudgets: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const budgetController: {
    createBudget: typeof createBudget;
    listBudgets: typeof listBudgets;
    getBudget: typeof getBudget;
    updateBudget: typeof updateBudget;
    deleteBudget: typeof deleteBudget;
};
//# sourceMappingURL=budgetController.d.ts.map