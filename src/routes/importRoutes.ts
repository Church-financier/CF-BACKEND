import { Router } from "express";
import { importController } from "../controllers/importController";
import { checkPermission } from "../middleware/rbacMiddleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post(
  "/members",
  checkPermission("member:create"),
  upload.single("file"),
  importController.importMembers
);
router.post(
  "/ledger",
  checkPermission("ledger:create"),
  upload.single("file"),
  importController.importLedgerEntries
);
router.post(
  "/chart-of-accounts",
  checkPermission("chart-of-accounts:create"),
  upload.single("file"),
  importController.importChartOfAccounts
);

export default router;
