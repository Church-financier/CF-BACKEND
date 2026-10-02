import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
export declare const listPeriods: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const lockPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const unlockPeriod: (req: TenantRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const periodController: {
    listPeriods: typeof listPeriods;
    lockPeriod: typeof lockPeriod;
    unlockPeriod: typeof unlockPeriod;
};
//# sourceMappingURL=periodController.d.ts.map