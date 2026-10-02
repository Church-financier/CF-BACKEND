import { TenantRequest } from "../middleware/tenantMiddleware";
import { Response } from "express";
export declare const createJournalEntry: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listJournalEntries: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reverseJournalEntry: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTrialBalance: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const journalController: {
    createJournalEntry: typeof createJournalEntry;
    listJournalEntries: typeof listJournalEntries;
    reverseJournalEntry: typeof reverseJournalEntry;
    getTrialBalance: typeof getTrialBalance;
};
//# sourceMappingURL=journalController.d.ts.map