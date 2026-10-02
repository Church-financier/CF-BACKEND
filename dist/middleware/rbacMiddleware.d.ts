import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
export declare const checkPermission: (permission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const checkAnyPermission: (...permissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=rbacMiddleware.d.ts.map