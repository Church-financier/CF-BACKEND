import { Router } from "express";
import { memberController } from "../controllers/memberController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createMemberSchema, updateMemberSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("member:read"), validateQuery(paginationQuerySchema), memberController.listMembers);
router.get("/:id", checkPermission("member:read"), memberController.getMember);
router.post("/", checkPermission("member:create"), validateBody(createMemberSchema), memberController.createMember);
router.patch("/:id", checkPermission("member:update"), validateBody(updateMemberSchema), memberController.updateMember);
router.delete("/:id", checkPermission("member:delete"), memberController.deleteMember);

export default router;
