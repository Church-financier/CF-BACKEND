import { Router } from "express";
import { userController } from "../controllers/userController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { signupSchema, updateRoleSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("user:manage"), validateQuery(paginationQuerySchema), userController.listUsers);
router.post("/", checkPermission("user:manage"), validateBody(signupSchema), userController.createUser);
router.patch("/:id/role", checkPermission("user:manage"), validateBody(updateRoleSchema), userController.updateUserRole);
router.delete("/:id", checkPermission("user:manage"), userController.deleteUser);

export default router;