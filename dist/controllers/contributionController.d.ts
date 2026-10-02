import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listContributions: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listContributionFunds: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getContribution: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateContribution: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteContribution: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMemberStatement: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSingleContribution: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const batchCreateContributions: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const generateDonorReceipt: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const downloadDonorReceiptPdf: (req: TenantRequest, res: Response) => Promise<undefined>;
export declare const contributionController: {
    listContributions: typeof listContributions;
    listContributionFunds: typeof listContributionFunds;
    getContribution: typeof getContribution;
    updateContribution: typeof updateContribution;
    deleteContribution: typeof deleteContribution;
    getMemberStatement: typeof getMemberStatement;
    createSingleContribution: typeof createSingleContribution;
    batchCreateContributions: typeof batchCreateContributions;
    generateDonorReceipt: typeof generateDonorReceipt;
    downloadDonorReceiptPdf: typeof downloadDonorReceiptPdf;
};
//# sourceMappingURL=contributionController.d.ts.map