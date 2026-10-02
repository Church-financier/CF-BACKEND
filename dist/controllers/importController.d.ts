import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const importMembers: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const importLedgerEntries: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const importChartOfAccounts: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const importController: {
    importMembers: typeof importMembers;
    importLedgerEntries: typeof importLedgerEntries;
    importChartOfAccounts: typeof importChartOfAccounts;
};
//# sourceMappingURL=importController.d.ts.map