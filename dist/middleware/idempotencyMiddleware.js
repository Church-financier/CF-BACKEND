"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireIdempotencyKey = void 0;
const idempotencyService_1 = require("../services/idempotencyService");
const serialize_1 = require("../utils/serialize");
const appError_1 = require("../utils/appError");
const IDEMPOTENCY_HEADER = "x-idempotency-key";
const REPLAY_HEADER = "idempotency-replayed";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH"]);
/**
 * Requires an `X-Idempotency-Key` (UUID v4) on state-changing financial
 * requests and guarantees each key executes at most once.
 *
 * A repeat of a key returns the stored response verbatim, so a double-click, a
 * client retry, or a request replayed over an unstable connection can never
 * create a second payment or a second set of ledger rows.
 */
const requireIdempotencyKey = () => {
    return async (req, res, next) => {
        if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
            return next();
        }
        const rawKey = req.header(IDEMPOTENCY_HEADER);
        if (!rawKey) {
            return res.status(400).json({
                error: `Missing ${IDEMPOTENCY_HEADER} header. State-changing financial requests must carry a UUID v4 idempotency key.`,
                code: "IDEMPOTENCY_KEY_REQUIRED",
            });
        }
        const key = rawKey.trim();
        if (!(0, idempotencyService_1.isValidIdempotencyKey)(key)) {
            return res.status(400).json({
                error: `Invalid ${IDEMPOTENCY_HEADER} header. Expected a UUID v4 value.`,
                code: "IDEMPOTENCY_KEY_INVALID",
            });
        }
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const path = req.originalUrl.split("?")[0];
        const record = {
            key,
            userId: req.user.id,
            organizationId: req.user.organizationId,
            endpoint: `${req.method.toUpperCase()} ${path}`,
            requestHash: (0, idempotencyService_1.hashRequest)({ method: req.method, path, body: req.body }),
        };
        let claim = await idempotencyService_1.idempotencyService.claim(record);
        if (claim.outcome === "in_progress") {
            // A duplicate arrived while the original was still executing (typically a
            // double-click). Give the original a moment to finish so this request
            // can be answered with its cached response instead of a conflict.
            claim = await idempotencyService_1.idempotencyService.waitForCompletion(record);
        }
        if (claim.outcome === "replay") {
            res.setHeader(REPLAY_HEADER, "true");
            return res.status(claim.status).json(claim.body ?? {});
        }
        if (claim.outcome === "key_reuse") {
            return next((0, appError_1.conflict)("This idempotency key was already used with a different request payload.", "IDEMPOTENCY_KEY_REUSE"));
        }
        if (claim.outcome === "in_progress") {
            return next((0, appError_1.conflict)("An identical request is still being processed. Please wait for it to finish before retrying.", "IDEMPOTENCY_KEY_IN_PROGRESS"));
        }
        // This request owns the key: capture its response so a later replay of the
        // same key returns exactly the same payload and status.
        let captured = null;
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);
        const capture = (body) => {
            if (captured)
                return;
            // The stored copy is serialized (BigInt -> string) so it round-trips
            // through JSON storage and matches what the client received.
            captured = { status: res.statusCode, body: (0, serialize_1.serializeResponse)(body) };
        };
        res.json = (body) => {
            capture(body);
            return originalJson(body);
        };
        res.send = (body) => {
            if (typeof body === "string" || Buffer.isBuffer(body)) {
                capture(Buffer.isBuffer(body) ? null : body);
            }
            else {
                capture(body);
            }
            return originalSend(body);
        };
        res.on("finish", () => {
            void (async () => {
                try {
                    if (captured && captured.status >= 200 && captured.status < 400) {
                        await idempotencyService_1.idempotencyService.complete(record.organizationId, record.key, captured.status, captured.body);
                    }
                    else {
                        // Failed requests are not cached: the client may retry the same key
                        // once the cause is fixed.
                        await idempotencyService_1.idempotencyService.release(record.organizationId, record.key);
                    }
                }
                catch (err) {
                    console.error("[idempotency] failed to finalise key", err);
                }
            })();
        });
        next();
    };
};
exports.requireIdempotencyKey = requireIdempotencyKey;
//# sourceMappingURL=idempotencyMiddleware.js.map