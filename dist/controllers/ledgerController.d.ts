import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const createLedgerEntry: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listLedgerEntries: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLedgerEntry: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reverseLedgerEntry: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const ledgerController: {
    createLedgerEntry: typeof createLedgerEntry;
    listLedgerEntries: typeof listLedgerEntries;
    getLedgerEntry: typeof getLedgerEntry;
    reverseLedgerEntry: typeof reverseLedgerEntry;
};
//# sourceMappingURL=ledgerController.d.ts.map