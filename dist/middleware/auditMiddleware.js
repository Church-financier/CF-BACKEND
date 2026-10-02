"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditAction = void 0;
const auditService_1 = require("../services/auditService");
const serialize_1 = require("../utils/serialize");
const sanitize_1 = require("../utils/sanitize");
const clientIp_1 = require("../utils/clientIp");
const auditAction = (action) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            const duration = Date.now() - startTime;
            const statusCode = res.statusCode;
            if (statusCode >= 200 && statusCode < 400 && req.user?.id) {
                const entityId = body && typeof body === "object"
                    ? body.id ??
                        body.entityId ??
                        body.data?.id ??
                        body.budget?.id ??
                        body.fund?.id ??
                        body.member?.id ??
                        body.user?.id ??
                        body.request?.id ??
                        body.entry?.id
                    : undefined;
                auditService_1.auditService.log({
                    userId: req.user.id,
                    action,
                    details: {
                        method: req.method,
                        path: req.originalUrl,
                        body: (0, sanitize_1.sanitizeForLog)(req.body),
                        statusCode,
                        durationMs: duration,
                        ...(entityId ? { entityId } : {}),
                    },
                    ipAddress: (0, clientIp_1.getClientIp)(req),
                    organizationId: req.user.organizationId,
                });
            }
            return originalJson((0, serialize_1.serializeResponse)(body));
        };
        next();
    };
};
exports.auditAction = auditAction;
//# sourceMappingURL=auditMiddleware.js.map