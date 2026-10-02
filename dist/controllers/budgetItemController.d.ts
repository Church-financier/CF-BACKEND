import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const createBudgetItem: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Expense categories for the budget line-item picker.
 *
 * Scoped to `budget:read` so a department head can categorise their own
 * request without being granted organization-wide chart-of-accounts access.
 */
export declare const listExpenseCategories: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBudgetItem: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listBudgetItemsByDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBudgetItem: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBudgetItemApprovedTotal: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkUpdateBudgetItemApprovedTotals: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBudgetItem: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const budgetItemController: {
    createBudgetItem: typeof createBudgetItem;
    listExpenseCategories: typeof listExpenseCategories;
    getBudgetItem: typeof getBudgetItem;
    listBudgetItemsByDepartmentBudget: typeof listBudgetItemsByDepartmentBudget;
    updateBudgetItem: typeof updateBudgetItem;
    updateBudgetItemApprovedTotal: typeof updateBudgetItemApprovedTotal;
    bulkUpdateBudgetItemApprovedTotals: typeof bulkUpdateBudgetItemApprovedTotals;
    deleteBudgetItem: typeof deleteBudgetItem;
};
//# sourceMappingURL=budgetItemController.d.ts.map