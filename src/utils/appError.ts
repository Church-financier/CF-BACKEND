/**
 * Errors that carry an HTTP status and a user-facing message.
 *
 * Services throw these for expected, actionable conditions (an illegal state
 * transition, a duplicate request, a locked period) so the client receives a
 * meaningful status code instead of a generic 500 from the error handler.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, "BAD_REQUEST", details);

export const conflict = (message: string, code?: string, details?: unknown) =>
  new AppError(409, message, code ?? "CONFLICT", details);

export const unprocessable = (message: string, details?: unknown) =>
  new AppError(422, message, "UNPROCESSABLE", details);
