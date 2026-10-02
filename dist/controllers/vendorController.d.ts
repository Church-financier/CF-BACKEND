import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listVendors: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVendor: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVendor: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateVendor: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteVendor: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const vendorController: {
    listVendors: typeof listVendors;
    getVendor: typeof getVendor;
    createVendor: typeof createVendor;
    updateVendor: typeof updateVendor;
    deleteVendor: typeof deleteVendor;
};
//# sourceMappingURL=vendorController.d.ts.map