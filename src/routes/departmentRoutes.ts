import { Router } from "express";
import { departmentController } from "../controllers/departmentController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createDepartmentSchema, updateDepartmentSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("department:read"), validateQuery(paginationQuerySchema), departmentController.listDepartments);
router.get("/:id", checkPermission("department:read"), departmentController.getDepartment);
router.post("/", checkPermission("department:create"), validateBody(createDepartmentSchema), departmentController.createDepartment);
router.patch("/:id", checkPermission("department:update"), validateBody(updateDepartmentSchema), departmentController.updateDepartment);
router.delete("/:id", checkPermission("department:delete"), departmentController.deleteDepartment);

export default router;