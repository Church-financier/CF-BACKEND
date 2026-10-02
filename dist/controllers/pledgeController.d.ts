import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listPledges: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPledge: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPledge: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePledge: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelPledge: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePledge: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPledgeProgress: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const pledgeController: {
    listPledges: typeof listPledges;
    getPledge: typeof getPledge;
    createPledge: typeof createPledge;
    updatePledge: typeof updatePledge;
    cancelPledge: typeof cancelPledge;
    deletePledge: typeof deletePledge;
    getPledgeProgress: typeof getPledgeProgress;
};
//# sourceMappingURL=pledgeController.d.ts.map