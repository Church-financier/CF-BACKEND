import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
import { auditService } from "../services/auditService";
import { serializeResponse } from "../utils/serialize";
import { sanitizeForLog } from "../utils/sanitize";
import { getClientIp } from "../utils/clientIp";

export const auditAction = (action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 400 && req.user?.id) {
        const entityId =
          body && typeof body === "object"
            ? (body as any).id ??
              (body as any).entityId ??
              (body as any).data?.id ??
              (body as any).budget?.id ??
              (body as any).fund?.id ??
              (body as any).member?.id ??
              (body as any).user?.id ??
              (body as any).request?.id ??
              (body as any).entry?.id
            : undefined;

        auditService.log({
          userId: req.user.id,
          action,
          details: {
            method: req.method,
            path: req.originalUrl,
            body: sanitizeForLog(req.body),
            statusCode,
            durationMs: duration,
            ...(entityId ? { entityId } : {}),
          },
          ipAddress: getClientIp(req),
          organizationId: req.user.organizationId,
        });
      }
      return originalJson(serializeResponse(body));
    };

    next();
  };
};
