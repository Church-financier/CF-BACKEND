import { Response, NextFunction } from "express";
import type { TenantRequest } from "./tenantMiddleware";
/**
 * Requires an `X-Idempotency-Key` (UUID v4) on state-changing financial
 * requests and guarantees each key executes at most once.
 *
 * A repeat of a key returns the stored response verbatim, so a double-click, a
 * client retry, or a request replayed over an unstable connection can never
 * create a second payment or a second set of ledger rows.
 */
export declare const requireIdempotencyKey: () => (req: TenantRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=idempotencyMiddleware.d.ts.map