"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsCache = void 0;
exports.toCachedSettings = toCachedSettings;
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const cache = new Map();
exports.settingsCache = {
    get(organizationId) {
        const entry = cache.get(organizationId);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            cache.delete(organizationId);
            return null;
        }
        return entry.value;
    },
    set(organizationId, value, ttlMs = DEFAULT_TTL_MS) {
        cache.set(organizationId, { value, expiresAt: Date.now() + ttlMs });
    },
    purge(organizationId) {
        cache.delete(organizationId);
    },
    purgeAll() {
        cache.clear();
    },
};
function toCachedSettings(org) {
    return {
        id: org.id,
        name: org.name,
        currency: org.currency,
        fiscalYearStartMonth: org.fiscalYearStartMonth,
        timezone: org.timezone,
        requireMfa: org.requireMfa,
        sessionTimeoutMinutes: org.sessionTimeoutMinutes,
        address: org.address,
        phone: org.phone,
        email: org.email,
        logoUrl: org.logoUrl,
        createdAt: org.createdAt,
    };
}
//# sourceMappingURL=settingsCache.js.map