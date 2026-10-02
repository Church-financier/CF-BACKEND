import { Prisma } from "@prisma/client";

/**
 * Prisma's `PrismaClientKnownRequestError` is not importable as a value in
 * every bundling setup, so errors are inspected structurally. This keeps the
 * error handler dependency-light and testable without a live database.
 */
export function isPrismaKnownError(err: unknown): err is { code: string; message: string } {
  if (err instanceof Prisma.PrismaClientKnownRequestError) return true;
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    (err as { code: string }).code.startsWith("P")
  );
}

/**
 * P2002 unique violation, P2003/P2014 foreign key constraint,
 * P2025 record not found.
 */
export function prismaErrorStatus(err: { code: string; message: string }): number {
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
