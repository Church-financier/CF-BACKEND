/**
 * Errors that carry an HTTP status and a user-facing message.
 *
 * Services throw these for expected, actionable conditions (an illegal state
 * transition, a duplicate request, a locked period) so the client receives a
 * meaningful status code instead of a generic 500 from the error handler.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code?: string;
    readonly details?: unknown;
    constructor(statusCode: number, message: string, code?: string, details?: unknown);
}
export declare const badRequest: (message: string, details?: unknown) => AppError;
export declare const conflict: (message: string, code?: string, details?: unknown) => AppError;
export declare const unprocessable: (message: string, details?: unknown) => AppError;
//# sourceMappingURL=appError.d.ts.map