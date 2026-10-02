"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = void 0;
exports.parsePagination = parsePagination;
exports.buildPaginatedResponse = buildPaginatedResponse;
exports.applyPagination = applyPagination;
exports.DEFAULT_PAGE_SIZE = 10;
exports.MAX_PAGE_SIZE = 100;
function parsePagination(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const rawPageSize = parseInt(req.query.pageSize) || exports.DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(exports.MAX_PAGE_SIZE, Math.max(1, rawPageSize));
    return { page, pageSize };
}
function buildPaginatedResponse(data, total, params) {
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
function applyPagination(items, params) {
    const total = items.length;
    const skip = (params.page - 1) * params.pageSize;
    const data = items.slice(skip, skip + params.pageSize);
    return { data, total };
}
//# sourceMappingURL=pagination.js.map