"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fundController_1 = require("../controllers/fundController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("fund:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), fundController_1.fundController.listFunds);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("fund:read"), fundController_1.fundController.getFund);
router.post("/", (0, rbacMiddleware_1.checkPermission)("fund:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createFundSchema), fundController_1.fundController.createFund);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("fund:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateFundSchema), fundController_1.fundController.updateFund);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("fund:delete"), fundController_1.fundController.deleteFund);
exports.default = router;
//# sourceMappingURL=fundRoutes.js.map