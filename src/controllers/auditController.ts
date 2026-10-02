import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { auditService } from "../services/auditService";
import { parsePagination } from "../utils/pagination";

export const listAuditLogs = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { userId, action } = req.query as Record<string, string | undefined>;
  const params = parsePagination(req);
  const result = await auditService.list(user!.organizationId, {
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

export const auditController = { listAuditLogs };
