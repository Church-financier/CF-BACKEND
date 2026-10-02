"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingsService = void 0;
exports.getOrgSettings = getOrgSettings;
exports.updateOrgSettings = updateOrgSettings;
const prisma_1 = require("../lib/prisma");
const settingsCache_1 = require("../lib/settingsCache");
const index_1 = require("../index");
const auditService_1 = require("./auditService");
const ORG_SELECT = {
    id: true,
    name: true,
    currency: true,
    fiscalYearStartMonth: true,
    timezone: true,
    requireMfa: true,
    sessionTimeoutMinutes: true,
    address: true,
    phone: true,
    email: true,
    logoUrl: true,
    createdAt: true,
};
async function getOrgSettings(organizationId) {
    const cached = settingsCache_1.settingsCache.get(organizationId);
    if (cached)
        return { ...cached };
    const org = await prisma_1.prisma.organization.findUnique({
        where: { id: organizationId },
        select: ORG_SELECT,
    });
    if (!org)
        return null;
    const settings = (0, settingsCache_1.toCachedSettings)(org);
    settingsCache_1.settingsCache.set(organizationId, settings);
    return settings;
}
async function updateOrgSettings(organizationId, data, userId, ipAddress) {
    const payload = {};
    if (data.organizationName !== undefined)
        payload.name = data.organizationName;
    if (data.baseCurrency !== undefined)
        payload.currency = data.baseCurrency;
    if (data.fiscalYearStartMonth !== undefined)
        payload.fiscalYearStartMonth = data.fiscalYearStartMonth;
    if (data.timezone !== undefined)
        payload.timezone = data.timezone;
    if (data.requireMfa !== undefined)
        payload.requireMfa = data.requireMfa;
    if (data.sessionTimeoutMinutes !== undefined)
        payload.sessionTimeoutMinutes = data.sessionTimeoutMinutes;
    if (data.address !== undefined)
        payload.address = data.address;
    if (data.phone !== undefined)
        payload.phone = data.phone;
    if (data.email !== undefined)
        payload.email = data.email;
    if (data.logoUrl !== undefined)
        payload.logoUrl = data.logoUrl;
    const updated = await prisma_1.prisma.organization.update({
        where: { id: organizationId },
        data: payload,
        select: ORG_SELECT,
    });
    const settings = (0, settingsCache_1.toCachedSettings)(updated);
    settingsCache_1.settingsCache.purge(organizationId);
    settingsCache_1.settingsCache.set(organizationId, settings);
    await auditService_1.auditService.log({
        userId,
        organizationId,
        action: "UPDATE_ORGANIZATION_SETTINGS",
        details: { changed: Object.keys(data) },
        ipAddress,
    });
    (0, index_1.emitToOrganization)(organizationId, "organization:settings_updated", {
        currency: settings.currency,
        timezone: settings.timezone,
        fiscalYearStartMonth: settings.fiscalYearStartMonth,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        requireMfa: settings.requireMfa,
    });
    return settings;
}
exports.systemSettingsService = {
    getOrgSettings,
    updateOrgSettings,
};
//# sourceMappingURL=systemSettingsService.js.map