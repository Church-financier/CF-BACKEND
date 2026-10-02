"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentController_1 = require("../controllers/departmentController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("department:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), departmentController_1.departmentController.listDepartments);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("department:read"), departmentController_1.departmentController.getDepartment);
router.post("/", (0, rbacMiddleware_1.checkPermission)("department:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createDepartmentSchema), departmentController_1.departmentController.createDepartment);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("department:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateDepartmentSchema), departmentController_1.departmentController.updateDepartment);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("department:delete"), departmentController_1.departmentController.deleteDepartment);
exports.default = router;
//# sourceMappingURL=departmentRoutes.js.map