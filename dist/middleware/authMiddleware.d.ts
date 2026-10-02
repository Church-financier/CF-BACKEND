import { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        organizationId: string;
    };
}
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireRole: (...roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map