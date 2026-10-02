import { Router } from "express";
import { auditController } from "../controllers/auditController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateQuery } from "../middleware/validationMiddleware";
import { paginationQuerySchema } from "../schemas";
import { z } from "zod";

const auditQuerySchema = paginationQuerySchema.extend({
  userId: z.string().optional(),
  action: z.string().optional(),
});

const router = Router();

router.get("/", checkPermission("audit:read"), validateQuery(auditQuerySchema), auditController.listAuditLogs);

export default router;
