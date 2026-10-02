import dotenv from "dotenv";
import path from "path";
const envPath = process.env.DOTENV_PATH || path.resolve(process.cwd(), ".env");
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn("No .env loaded from:", envPath);
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

import { validateEnv } from "./config/env";
const env = validateEnv();

import { authLimiter, apiLimiter } from "./middleware/rateLimiter";
import { tenantScoped, requireOrganization } from "./middleware/tenantMiddleware";
import { errorHandler } from "./middleware/errorHandler";
import { auditAction } from "./middleware/auditMiddleware";
import { sessionInactivityMiddleware } from "./middleware/sessionTimeoutMiddleware";
import { serializeResponse } from "./utils/serialize";
import { getJwtSecret } from "./utils/jwt";
import { prisma } from "./lib/prisma";
import { idempotencyService } from "./services/idempotencyService";
import auditRoutes from "./routes/auditRoutes";
import memberRoutes from "./routes/memberRoutes";
import periodRoutes from "./routes/periodRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import systemSettingsRoutes from "./routes/systemSettingsRoutes";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import fundRoutes from "./routes/fundRoutes";
import ledgerRoutes from "./routes/ledgerRoutes";
import journalRoutes from "./routes/journalRoutes";
import disbursementRoutes from "./routes/disbursementRoutes";
import reportRoutes from "./routes/reportRoutes";
import pledgeRoutes from "./routes/pledgeRoutes";
import contributionRoutes from "./routes/contributionRoutes";
import vendorRoutes from "./routes/vendorRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import chartOfAccountsRoutes from "./routes/chartOfAccountsRoutes";
import budgetRoutes from "./routes/budgetRoutes";
import budgetModuleRoutes from "./routes/budgetModuleRoutes";
import portalRoutes from "./routes/portalRoutes";
import importRoutes from "./routes/importRoutes";

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(compression({
  level: 6,
  threshold: 1024,
}));

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => originalJson(serializeResponse(body));
  next();
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

app.get("/api/ready", async (_req, res) => {
  let ready = true;
  const details: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    details.database = "connected";
  } catch (err) {
    ready = false;
    details.database = (err as Error).message;
  }

  if (typeof io !== "undefined" && io) {
    details.socketIo = "initialized";
  }

  res.status(ready ? 200 : 503).json({ ready, ...details });
});

app.use("/api", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/portal", portalRoutes);

const apiRouter = express.Router();
apiRouter.use(tenantScoped, requireOrganization);
apiRouter.use(sessionInactivityMiddleware);

apiRouter.use((req, res, next) => {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    const segments = req.path.replace(/^\/api\//, "").split("/").filter(Boolean);
    const resource = segments[0] || "request";
    return auditAction(`${req.method} /${resource}`)(req, res, next);
  }
  next();
});

apiRouter.use("/users", userRoutes);
apiRouter.use("/funds", fundRoutes);
apiRouter.use("/ledger", ledgerRoutes);
apiRouter.use("/journals", journalRoutes);
apiRouter.use("/disbursements", disbursementRoutes);
apiRouter.use("/reports", reportRoutes);
apiRouter.use("/pledges", pledgeRoutes);
apiRouter.use("/contributions", contributionRoutes);
apiRouter.use("/vendors", vendorRoutes);
apiRouter.use("/departments", departmentRoutes);
apiRouter.use("/chart-of-accounts", chartOfAccountsRoutes);
apiRouter.use("/budgets", budgetRoutes);
apiRouter.use("/budget", budgetModuleRoutes);
apiRouter.use("/audit-logs", auditRoutes);
apiRouter.use("/members", memberRoutes);
apiRouter.use("/periods", periodRoutes);
apiRouter.use("/import", importRoutes);
apiRouter.use("/organization", organizationRoutes);
apiRouter.use("/system/settings", systemSettingsRoutes);

app.use("/api", apiLimiter, apiRouter);

app.use(errorHandler);

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error("Authentication error: missing token"));
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as Record<string, unknown>;
    (socket as any).user = decoded;
    if (decoded.organizationId) {
      (socket as any).organizationId = decoded.organizationId as string;
      socket.join(`org:${decoded.organizationId}`);
    }
    next();
  } catch {
    next(new Error("Authentication error: invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} (org=${(socket as any).organizationId ?? "unknown"})`);

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

export function emitToOrganization(organizationId: string, event: string, payload: unknown) {
  io.to(`org:${organizationId}`).emit(event, serializeResponse(payload));
}

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Replay cache housekeeping: drop keys that are past their window so the
  // table cannot grow without bound. Unref'd so it never holds the process open.
  const purge = () => {
    void idempotencyService
      .purgeExpired()
      .then((count) => {
        if (count > 0) console.log(`[idempotency] purged ${count} expired key(s)`);
      })
      .catch((err) => console.error("[idempotency] purge failed:", (err as Error).message));
  };
  purge();
  setInterval(purge, 6 * 60 * 60 * 1000).unref();

  // Schema freshness check — helps the user spot a stale database
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
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
  } catch (err) {
    console.warn("[schema-check] could not verify database schema:", (err as Error).message);
  }
});

export { io };
