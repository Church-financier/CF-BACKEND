"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pledgeController_1 = require("../controllers/pledgeController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("pledge:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), pledgeController_1.pledgeController.listPledges);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("pledge:read"), pledgeController_1.pledgeController.getPledge);
router.post("/", (0, rbacMiddleware_1.checkPermission)("pledge:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createPledgeSchema), pledgeController_1.pledgeController.createPledge);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("pledge:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updatePledgeSchema), pledgeController_1.pledgeController.updatePledge);
router.patch("/:id/cancel", (0, rbacMiddleware_1.checkPermission)("pledge:update"), pledgeController_1.pledgeController.cancelPledge);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("pledge:delete"), pledgeController_1.pledgeController.deletePledge);
router.get("/:id/progress", (0, rbacMiddleware_1.checkPermission)("pledge:read"), pledgeController_1.pledgeController.getPledgeProgress);
exports.default = router;
//# sourceMappingURL=pledgeRoutes.js.map