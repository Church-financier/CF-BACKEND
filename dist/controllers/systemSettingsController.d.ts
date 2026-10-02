import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const getSystemSettings: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSystemSettings: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const systemSettingsController: {
    getSystemSettings: typeof getSystemSettings;
    updateSystemSettings: typeof updateSystemSettings;
};
//# sourceMappingURL=systemSettingsController.d.ts.map