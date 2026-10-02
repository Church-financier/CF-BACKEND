import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listAccounts: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAccount: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAccount: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAccount: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAccount: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const chartOfAccountsController: {
    listAccounts: typeof listAccounts;
    getAccount: typeof getAccount;
    createAccount: typeof createAccount;
    updateAccount: typeof updateAccount;
    deleteAccount: typeof deleteAccount;
};
//# sourceMappingURL=chartOfAccountsController.d.ts.map