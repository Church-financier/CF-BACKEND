"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const appError_1 = require("../utils/appError");
const prismaErrors_1 = require("../utils/prismaErrors");
const errorHandler = (err, req, res, _next) => {
    // Expected, client-correctable conditions: log at warn level and answer
    // with the carried status and message instead of a generic 500.
    if (err instanceof appError_1.AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(err.code ? { code: err.code } : {}),
            ...(err.details ? { details: err.details } : {}),
        });
    }
    if (err.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: err });
    }
    // Prisma failures that map to a deterministic HTTP status: a unique
    // violation is a duplicate submission, a missing record is a 404.
    if ((0, prismaErrors_1.isPrismaKnownError)(err)) {
        const status = (0, prismaErrors_1.prismaErrorStatus)(err);
        if (status !== 500) {
            return res.status(status).json({ error: err.message });
        }
    }
    console.error(`[ERROR] ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map