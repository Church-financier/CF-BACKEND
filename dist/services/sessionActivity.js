"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionActivity = void 0;
const DEFAULT_TIMEOUT_MINUTES = 480;
const sessions = new Map();
exports.sessionActivity = {
    touch(userId, timeoutMinutes = DEFAULT_TIMEOUT_MINUTES) {
        sessions.set(userId, { lastActiveAt: Date.now(), timeoutMinutes });
    },
    isExpired(userId) {
        const info = sessions.get(userId);
        if (!info)
            return false;
        return Date.now() - info.lastActiveAt > info.timeoutMinutes * 60 * 1000;
    },
    isTracked(userId) {
        return sessions.has(userId);
    },
    setTimeout(userId, timeoutMinutes) {
        const info = sessions.get(userId);
        if (info) {
            info.timeoutMinutes = timeoutMinutes;
        }
    },
    revoke(userId) {
        sessions.delete(userId);
    },
    getTimeout(userId) {
        return sessions.get(userId)?.timeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES;
    },
};
//# sourceMappingURL=sessionActivity.js.map