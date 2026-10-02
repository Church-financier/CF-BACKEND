import { Response } from "express";
import { PortalRequest } from "../services/portalAuthService";
export declare const portalLogin: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const portalRefresh: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const portalLogout: (_req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const portalMe: (req: PortalRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const portalSummary: (req: PortalRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const portalForgotPassword: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const portalChangePassword: (req: PortalRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const adminSetPortalAccess: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const portalController: {
    portalLogin: typeof portalLogin;
    portalRefresh: typeof portalRefresh;
    portalLogout: typeof portalLogout;
    portalMe: typeof portalMe;
    portalSummary: typeof portalSummary;
    portalForgotPassword: typeof portalForgotPassword;
    portalChangePassword: typeof portalChangePassword;
    adminSetPortalAccess: typeof adminSetPortalAccess;
};
//# sourceMappingURL=portalController.d.ts.map