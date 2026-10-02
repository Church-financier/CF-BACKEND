import { TenantRequest } from "../middleware/tenantMiddleware";
import { Response } from "express";
export declare const createFund: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listFunds: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFund: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFund: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFund: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const fundController: {
    createFund: typeof createFund;
    listFunds: typeof listFunds;
    getFund: typeof getFund;
    updateFund: typeof updateFund;
    deleteFund: typeof deleteFund;
};
//# sourceMappingURL=fundController.d.ts.map