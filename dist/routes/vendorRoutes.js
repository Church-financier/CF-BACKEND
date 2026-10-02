"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendorController_1 = require("../controllers/vendorController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("vendor:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), vendorController_1.vendorController.listVendors);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("vendor:read"), vendorController_1.vendorController.getVendor);
router.post("/", (0, rbacMiddleware_1.checkPermission)("vendor:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createVendorSchema), vendorController_1.vendorController.createVendor);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("vendor:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateVendorSchema), vendorController_1.vendorController.updateVendor);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("vendor:delete"), vendorController_1.vendorController.deleteVendor);
exports.default = router;
//# sourceMappingURL=vendorRoutes.js.map