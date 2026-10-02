import { TenantRequest } from "../middleware/tenantMiddleware";
import { Response } from "express";
export declare const createDisbursementRequest: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const listDisbursementRequests: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDisbursementRequest: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const firstApproveDisbursement: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const secondApproveDisbursement: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectDisbursement: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markDisbursementPaid: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Voucher data as JSON, for the in-app print preview. Mirrors exactly what
 * `downloadPaymentVoucher` renders, including the verification hash, so the
 * screen preview and the downloaded PDF cannot disagree.
 */
export declare const getPaymentVoucher: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const downloadPaymentVoucher: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelDisbursement: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const disbursementController: {
    createDisbursementRequest: typeof createDisbursementRequest;
    listDisbursementRequests: typeof listDisbursementRequests;
    getDisbursementRequest: typeof getDisbursementRequest;
    firstApproveDisbursement: typeof firstApproveDisbursement;
    secondApproveDisbursement: typeof secondApproveDisbursement;
    rejectDisbursement: typeof rejectDisbursement;
    markDisbursementPaid: typeof markDisbursementPaid;
    downloadPaymentVoucher: typeof downloadPaymentVoucher;
    getPaymentVoucher: typeof getPaymentVoucher;
    cancelDisbursement: typeof cancelDisbursement;
};
//# sourceMappingURL=disbursementController.d.ts.map