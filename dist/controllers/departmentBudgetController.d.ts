import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const createDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listDepartmentBudgetsByPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const submitDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const returnDepartmentBudgetForRevision: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDepartmentBudget: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const departmentBudgetController: {
    createDepartmentBudget: typeof createDepartmentBudget;
    getDepartmentBudget: typeof getDepartmentBudget;
    getMyDepartmentBudget: typeof getMyDepartmentBudget;
    listDepartmentBudgetsByPeriod: typeof listDepartmentBudgetsByPeriod;
    updateDepartmentBudget: typeof updateDepartmentBudget;
    submitDepartmentBudget: typeof submitDepartmentBudget;
    returnDepartmentBudgetForRevision: typeof returnDepartmentBudgetForRevision;
    approveDepartmentBudget: typeof approveDepartmentBudget;
    rejectDepartmentBudget: typeof rejectDepartmentBudget;
    deleteDepartmentBudget: typeof deleteDepartmentBudget;
};
//# sourceMappingURL=departmentBudgetController.d.ts.map