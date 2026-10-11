import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
/** HTTP verbs that mutate state. Anything an auditor may never invoke. */
export declare const WRITE_METHODS: readonly ["POST", "PUT", "PATCH", "DELETE"];
/**
 * Roles that are strictly view-only application-wide.
 *
 * The auditor exists to verify records, so it holds read permissions only and
 * must never be able to create, update or delete anything. The UI hides the
 * corresponding controls; `denyRoleWrites` below enforces the same rule at the
 * API so a hand-crafted request cannot get around the hidden buttons.
 */
export declare const READ_ONLY_ROLES: readonly string[];
export declare function isReadOnlyRole(role: string | undefined | null): boolean;
export declare const PERMISSIONS: Record<string, string[]>;
export declare const checkPermission: (permission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const checkAnyPermission: (...permissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Application-wide belt-and-braces guard for read-only roles.
 *
 * Mount immediately after `tenantScoped` on the tenant API router so it runs
 * before every resource router. Any state-changing verb from a read-only role
 * is rejected with 403 before it can reach a controller, which closes routes
 * that rely on per-route `checkPermission` alone (or that were missed).
 *
 * Reads, including report export, are untouched.
 */
export declare const denyRoleWrites: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=rbacMiddleware.d.ts.map