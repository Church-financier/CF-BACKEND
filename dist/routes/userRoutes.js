"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("user:manage"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), userController_1.userController.listUsers);
router.post("/", (0, rbacMiddleware_1.checkPermission)("user:manage"), (0, validationMiddleware_1.validateBody)(schemas_1.signupSchema), userController_1.userController.createUser);
router.patch("/:id/role", (0, rbacMiddleware_1.checkPermission)("user:manage"), (0, validationMiddleware_1.validateBody)(schemas_1.updateRoleSchema), userController_1.userController.updateUserRole);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("user:manage"), userController_1.userController.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map