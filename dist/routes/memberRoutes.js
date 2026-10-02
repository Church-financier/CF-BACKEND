"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memberController_1 = require("../controllers/memberController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("member:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), memberController_1.memberController.listMembers);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("member:read"), memberController_1.memberController.getMember);
router.post("/", (0, rbacMiddleware_1.checkPermission)("member:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createMemberSchema), memberController_1.memberController.createMember);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("member:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateMemberSchema), memberController_1.memberController.updateMember);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("member:delete"), memberController_1.memberController.deleteMember);
exports.default = router;
//# sourceMappingURL=memberRoutes.js.map