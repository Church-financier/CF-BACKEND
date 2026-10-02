import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listDepartments: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDepartment: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createDepartment: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDepartment: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDepartment: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const departmentController: {
    listDepartments: typeof listDepartments;
    getDepartment: typeof getDepartment;
    createDepartment: typeof createDepartment;
    updateDepartment: typeof updateDepartment;
    deleteDepartment: typeof deleteDepartment;
};
//# sourceMappingURL=departmentController.d.ts.map