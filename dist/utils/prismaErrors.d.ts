/**
 * Prisma's `PrismaClientKnownRequestError` is not importable as a value in
 * every bundling setup, so errors are inspected structurally. This keeps the
 * error handler dependency-light and testable without a live database.
 */
export declare function isPrismaKnownError(err: unknown): err is {
    code: string;
    message: string;
};
/**
 * P2002 unique violation, P2003/P2014 foreign key constraint,
 * P2025 record not found.
 */
export declare function prismaErrorStatus(err: {
    code: string;
    message: string;
}): number;
//# sourceMappingURL=prismaErrors.d.ts.map