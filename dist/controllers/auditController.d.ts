import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listAuditLogs: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const auditController: {
    listAuditLogs: typeof listAuditLogs;
};
//# sourceMappingURL=auditController.d.ts.map