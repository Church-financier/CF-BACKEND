"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditMiddleware_1 = require("../middleware/auditMiddleware");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const fundRoutes_1 = __importDefault(require("./fundRoutes"));
const ledgerRoutes_1 = __importDefault(require("./ledgerRoutes"));
const disbursementRoutes_1 = __importDefault(require("./disbursementRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const pledgeRoutes_1 = __importDefault(require("./pledgeRoutes"));
const contributionRoutes_1 = __importDefault(require("./contributionRoutes"));
const vendorRoutes_1 = __importDefault(require("./vendorRoutes"));
const chartOfAccountsRoutes_1 = __importDefault(require("./chartOfAccountsRoutes"));
const router = (0, express_1.Router)();
router.use((req, res, next) => {
    if (["POST", "PATCH", "DELETE"].includes(req.method)) {
        return (0, auditMiddleware_1.auditAction)(`${req.method} ${req.path}`)(req, res, next);
    }
    next();
});
router.use("/auth", authRoutes_1.default);
router.use("/users", userRoutes_1.default);
router.use("/funds", fundRoutes_1.default);
router.use("/ledger", ledgerRoutes_1.default);
router.use("/disbursements", disbursementRoutes_1.default);
router.use("/reports", reportRoutes_1.default);
router.use("/pledges", pledgeRoutes_1.default);
router.use("/contributions", contributionRoutes_1.default);
router.use("/vendors", vendorRoutes_1.default);
router.use("/chart-of-accounts", chartOfAccountsRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map