"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unprocessable = exports.conflict = exports.badRequest = exports.AppError = void 0;
/**
 * Errors that carry an HTTP status and a user-facing message.
 *
 * Services throw these for expected, actionable conditions (an illegal state
 * transition, a duplicate request, a locked period) so the client receives a
 * meaningful status code instead of a generic 500 from the error handler.
 */
class AppError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.AppError = AppError;
const badRequest = (message, details) => new AppError(400, message, "BAD_REQUEST", details);
exports.badRequest = badRequest;
const conflict = (message, code, details) => new AppError(409, message, code ?? "CONFLICT", details);
exports.conflict = conflict;
const unprocessable = (message, details) => new AppError(422, message, "UNPROCESSABLE", details);
exports.unprocessable = unprocessable;
//# sourceMappingURL=appError.js.map