"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrismaKnownError = isPrismaKnownError;
exports.prismaErrorStatus = prismaErrorStatus;
const client_1 = require("@prisma/client");
/**
 * Prisma's `PrismaClientKnownRequestError` is not importable as a value in
 * every bundling setup, so errors are inspected structurally. This keeps the
 * error handler dependency-light and testable without a live database.
 */
function isPrismaKnownError(err) {
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError)
        return true;
    return (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof err.code === "string" &&
        err.code.startsWith("P"));
}
/**
 * P2002 unique violation, P2003/P2014 foreign key constraint,
 * P2025 record not found.
 */
function prismaErrorStatus(err) {
    switch (err.code) {
        case "P2002":
            return 409;
        case "P2003":
        case "P2014":
            return 400;
        case "P2025":
            return 404;
        default:
            return 500;
    }
}
//# sourceMappingURL=prismaErrors.js.map