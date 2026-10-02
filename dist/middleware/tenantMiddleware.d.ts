import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
export interface TenantRequest extends AuthenticatedRequest {
    organizationId?: string;
}
export declare const tenantScoped: (req: TenantRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireOrganization: (req: TenantRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=tenantMiddleware.d.ts.map