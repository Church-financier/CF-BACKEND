import { Request } from "express";
export interface PaginationParams {
    page: number;
    pageSize: number;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
export declare const DEFAULT_PAGE_SIZE = 10;
export declare const MAX_PAGE_SIZE = 100;
export declare function parsePagination(req: Request): PaginationParams;
export declare function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T>;
export declare function applyPagination<T>(items: T[], params: PaginationParams): {
    data: T[];
    total: number;
};
//# sourceMappingURL=pagination.d.ts.map