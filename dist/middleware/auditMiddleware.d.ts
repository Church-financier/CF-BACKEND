import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
export declare const auditAction: (action: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auditMiddleware.d.ts.map