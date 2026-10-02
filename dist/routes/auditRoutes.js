"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const zod_1 = require("zod");
const auditQuerySchema = schemas_1.paginationQuerySchema.extend({
    userId: zod_1.z.string().optional(),
    action: zod_1.z.string().optional(),
});
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("audit:read"), (0, validationMiddleware_1.validateQuery)(auditQuerySchema), auditController_1.auditController.listAuditLogs);
exports.default = router;
//# sourceMappingURL=auditRoutes.js.map