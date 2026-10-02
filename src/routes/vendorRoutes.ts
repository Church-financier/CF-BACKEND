import { Router } from "express";
import { vendorController } from "../controllers/vendorController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createVendorSchema, updateVendorSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("vendor:read"), validateQuery(paginationQuerySchema), vendorController.listVendors);
router.get("/:id", checkPermission("vendor:read"), vendorController.getVendor);
router.post("/", checkPermission("vendor:create"), validateBody(createVendorSchema), vendorController.createVendor);
router.patch("/:id", checkPermission("vendor:update"), validateBody(updateVendorSchema), vendorController.updateVendor);
router.delete("/:id", checkPermission("vendor:delete"), vendorController.deleteVendor);

export default router;