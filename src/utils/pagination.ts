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

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const rawPageSize = parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize));
  return { page, pageSize };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
    },
  };
}

export function applyPagination<T>(
  items: T[],
  params: PaginationParams
): { data: T[]; total: number } {
  const total = items.length;
  const skip = (params.page - 1) * params.pageSize;
  const data = items.slice(skip, skip + params.pageSize);
  return { data, total };
}
