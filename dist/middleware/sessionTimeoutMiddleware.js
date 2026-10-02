"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionInactivityMiddleware = void 0;
const sessionActivity_1 = require("../services/sessionActivity");
const systemSettingsService_1 = require("../services/systemSettingsService");
const sessionInactivityMiddleware = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        return next();
    }
    const userId = user.id;
    if (!sessionActivity_1.sessionActivity.isTracked(userId)) {
        try {
            const settings = await (0, systemSettingsService_1.getOrgSettings)(user.organizationId);
            const timeout = settings?.sessionTimeoutMinutes ?? 480;
            sessionActivity_1.sessionActivity.touch(userId, timeout);
        }
        catch {
            sessionActivity_1.sessionActivity.touch(userId);
        }
        return next();
    }
    if (sessionActivity_1.sessionActivity.isExpired(userId)) {
        sessionActivity_1.sessionActivity.revoke(userId);
        return res.status(401).json({
            error: "Session expired due to inactivity",
            code: "SESSION_EXPIRED",
        });
    }
    sessionActivity_1.sessionActivity.touch(userId, sessionActivity_1.sessionActivity.getTimeout(userId));
    next();
};
exports.sessionInactivityMiddleware = sessionInactivityMiddleware;
//# sourceMappingURL=sessionTimeoutMiddleware.js.map