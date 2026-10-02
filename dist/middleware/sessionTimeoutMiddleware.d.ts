import { Response, NextFunction } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const sessionInactivityMiddleware: (req: TenantRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=sessionTimeoutMiddleware.d.ts.map