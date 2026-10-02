"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.listAuditLogs = void 0;
const auditService_1 = require("../services/auditService");
const pagination_1 = require("../utils/pagination");
const listAuditLogs = async (req, res) => {
    const user = req.user;
    const { userId, action } = req.query;
    const params = (0, pagination_1.parsePagination)(req);
    const result = await auditService_1.auditService.list(user.organizationId, {
        userId,
        action,
        page: params.page,
        pageSize: params.pageSize,
    });
    return res.status(200).json({
        data: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
    });
};
exports.listAuditLogs = listAuditLogs;
exports.auditController = { listAuditLogs: exports.listAuditLogs };
//# sourceMappingURL=auditController.js.map