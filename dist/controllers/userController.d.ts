import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listUsers: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createUser: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateUserRole: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteUser: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const userController: {
    listUsers: typeof listUsers;
    createUser: typeof createUser;
    updateUserRole: typeof updateUserRole;
    deleteUser: typeof deleteUser;
};
//# sourceMappingURL=userController.d.ts.map