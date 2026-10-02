import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const getOrganization: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateOrganization: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const organizationController: {
    getOrganization: typeof getOrganization;
    updateOrganization: typeof updateOrganization;
};
//# sourceMappingURL=organizationController.d.ts.map