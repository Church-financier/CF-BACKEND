"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const importController_1 = require("../controllers/importController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.post("/members", (0, rbacMiddleware_1.checkPermission)("member:create"), upload.single("file"), importController_1.importController.importMembers);
router.post("/ledger", (0, rbacMiddleware_1.checkPermission)("ledger:create"), upload.single("file"), importController_1.importController.importLedgerEntries);
router.post("/chart-of-accounts", (0, rbacMiddleware_1.checkPermission)("chart-of-accounts:create"), upload.single("file"), importController_1.importController.importChartOfAccounts);
exports.default = router;
//# sourceMappingURL=importRoutes.js.map