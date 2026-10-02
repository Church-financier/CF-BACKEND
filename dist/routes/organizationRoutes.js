"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizationController_1 = require("../controllers/organizationController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("user:manage"), organizationController_1.organizationController.getOrganization);
router.patch("/", (0, rbacMiddleware_1.checkPermission)("user:manage"), (0, validationMiddleware_1.validateBody)(schemas_1.updateOrganizationSchema), organizationController_1.organizationController.updateOrganization);
exports.default = router;
//# sourceMappingURL=organizationRoutes.js.map