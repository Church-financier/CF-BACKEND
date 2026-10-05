"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.emitToOrganization = emitToOrganization;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = process.env.DOTENV_PATH || path_1.default.resolve(process.cwd(), ".env");
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.warn("No .env loaded from:", envPath);
}
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./config/env");
const env = (0, env_1.validateEnv)();
const rateLimiter_1 = require("./middleware/rateLimiter");
const tenantMiddleware_1 = require("./middleware/tenantMiddleware");
const errorHandler_1 = require("./middleware/errorHandler");
const auditMiddleware_1 = require("./middleware/auditMiddleware");
const sessionTimeoutMiddleware_1 = require("./middleware/sessionTimeoutMiddleware");
const serialize_1 = require("./utils/serialize");
const jwt_1 = require("./utils/jwt");
const prisma_1 = require("./lib/prisma");
const idempotencyService_1 = require("./services/idempotencyService");
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const memberRoutes_1 = __importDefault(require("./routes/memberRoutes"));
const periodRoutes_1 = __importDefault(require("./routes/periodRoutes"));
const organizationRoutes_1 = __importDefault(require("./routes/organizationRoutes"));
const systemSettingsRoutes_1 = __importDefault(require("./routes/systemSettingsRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const fundRoutes_1 = __importDefault(require("./routes/fundRoutes"));
const ledgerRoutes_1 = __importDefault(require("./routes/ledgerRoutes"));
const journalRoutes_1 = __importDefault(require("./routes/journalRoutes"));
const disbursementRoutes_1 = __importDefault(require("./routes/disbursementRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const pledgeRoutes_1 = __importDefault(require("./routes/pledgeRoutes"));
const contributionRoutes_1 = __importDefault(require("./routes/contributionRoutes"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const departmentRoutes_1 = __importDefault(require("./routes/departmentRoutes"));
const chartOfAccountsRoutes_1 = __importDefault(require("./routes/chartOfAccountsRoutes"));
const budgetRoutes_1 = __importDefault(require("./routes/budgetRoutes"));
const budgetModuleRoutes_1 = __importDefault(require("./routes/budgetModuleRoutes"));
const portalRoutes_1 = __importDefault(require("./routes/portalRoutes"));
const importRoutes_1 = __importDefault(require("./routes/importRoutes"));
process.on("unhandledRejection", (reason) => {
    console.error("[UNHANDLED REJECTION]", reason);
});
process.on("uncaughtException", (err) => {
    console.error("[UNCAUGHT EXCEPTION]", err);
});
const app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)({
    level: 6,
    threshold: 1024,
}));
app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => originalJson((0, serialize_1.serializeResponse)(body));
    next();
});
app.get("/api/health", async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: "ok", database: "connected" });
    }
    catch {
        res.status(503).json({ status: "degraded", database: "unreachable" });
    }
});
app.get("/api/ready", async (_req, res) => {
    let ready = true;
    const details = {};
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        details.database = "connected";
    }
    catch (err) {
        ready = false;
        details.database = err.message;
    }
    if (typeof io !== "undefined" && io) {
        details.socketIo = "initialized";
    }
    res.status(ready ? 200 : 503).json({ ready, ...details });
});
app.use("/api", authRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/portal", portalRoutes_1.default);
const apiRouter = express_1.default.Router();
apiRouter.use(tenantMiddleware_1.tenantScoped, tenantMiddleware_1.requireOrganization);
apiRouter.use(sessionTimeoutMiddleware_1.sessionInactivityMiddleware);
apiRouter.use((req, res, next) => {
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
        const segments = req.path.replace(/^\/api\//, "").split("/").filter(Boolean);
        const resource = segments[0] || "request";
        return (0, auditMiddleware_1.auditAction)(`${req.method} /${resource}`)(req, res, next);
    }
    next();
});
apiRouter.use("/users", userRoutes_1.default);
apiRouter.use("/funds", fundRoutes_1.default);
apiRouter.use("/ledger", ledgerRoutes_1.default);
apiRouter.use("/journals", journalRoutes_1.default);
apiRouter.use("/disbursements", disbursementRoutes_1.default);
apiRouter.use("/reports", reportRoutes_1.default);
apiRouter.use("/pledges", pledgeRoutes_1.default);
apiRouter.use("/contributions", contributionRoutes_1.default);
apiRouter.use("/vendors", vendorRoutes_1.default);
apiRouter.use("/departments", departmentRoutes_1.default);
apiRouter.use("/chart-of-accounts", chartOfAccountsRoutes_1.default);
apiRouter.use("/budgets", budgetRoutes_1.default);
apiRouter.use("/budget", budgetModuleRoutes_1.default);
apiRouter.use("/audit-logs", auditRoutes_1.default);
apiRouter.use("/members", memberRoutes_1.default);
apiRouter.use("/periods", periodRoutes_1.default);
apiRouter.use("/import", importRoutes_1.default);
apiRouter.use("/organization", organizationRoutes_1.default);
apiRouter.use("/system/settings", systemSettingsRoutes_1.default);
app.use("/api", rateLimiter_1.apiLimiter, apiRouter);
app.use(errorHandler_1.errorHandler);
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
    },
});
exports.io = io;
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error("Authentication error: missing token"));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, (0, jwt_1.getJwtSecret)());
        socket.user = decoded;
        if (decoded.organizationId) {
            socket.organizationId = decoded.organizationId;
            socket.join(`org:${decoded.organizationId}`);
        }
        next();
    }
    catch {
        next(new Error("Authentication error: invalid token"));
    }
});
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (org=${socket.organizationId ?? "unknown"})`);
    socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
});
function emitToOrganization(organizationId, event, payload) {
    io.to(`org:${organizationId}`).emit(event, (0, serialize_1.serializeResponse)(payload));
}
server.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Replay cache housekeeping: drop keys that are past their window so the
    // table cannot grow without bound. Unref'd so it never holds the process open.
    const purge = () => {
        void idempotencyService_1.idempotencyService
            .purgeExpired()
            .then((count) => {
            if (count > 0)
                console.log(`[idempotency] purged ${count} expired key(s)`);
        })
            .catch((err) => console.error("[idempotency] purge failed:", err.message));
    };
    purge();
    setInterval(purge, 6 * 60 * 60 * 1000).unref();
    // Schema freshness check — helps the user spot a stale database
    try {
        const result = await prisma_1.prisma.$queryRaw `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'User'
          AND column_name = 'emailVerified'
      ) AS exists;
    `;
        if (!result?.[0]?.exists) {
            console.warn("\n\u26A0\uFE0F  Database schema is out of date.");
            console.warn("   The 'User.emailVerified' column is missing.");
            console.warn("   Run:  npx prisma migrate deploy\n");
        }
    }
    catch (err) {
        console.warn("[schema-check] could not verify database schema:", err.message);
    }
});
//# sourceMappingURL=index.js.map