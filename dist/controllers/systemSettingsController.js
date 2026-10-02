"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingsController = exports.updateSystemSettings = exports.getSystemSettings = void 0;
const clientIp_1 = require("../utils/clientIp");
const systemSettingsService_1 = require("../services/systemSettingsService");
const serializeSettings = (org) => ({
    id: org.id,
    organizationName: org.name,
    baseCurrency: org.currency,
    fiscalYearStartMonth: org.fiscalYearStartMonth,
    timezone: org.timezone,
    requireMfa: org.requireMfa,
    sessionTimeoutMinutes: org.sessionTimeoutMinutes,
    address: org.address ?? "",
    phone: org.phone ?? "",
    email: org.email ?? "",
    logoUrl: org.logoUrl ?? "",
    createdAt: org.createdAt,
});
const getSystemSettings = async (req, res) => {
    const user = req.user;
    const settings = await systemSettingsService_1.systemSettingsService.getOrgSettings(user.organizationId);
    if (!settings) {
        return res.status(404).json({ error: "Organization not found" });
    }
    return res.status(200).json(serializeSettings(settings));
};
exports.getSystemSettings = getSystemSettings;
const updateSystemSettings = async (req, res) => {
    const user = req.user;
    const ipAddress = (0, clientIp_1.getClientIp)(req);
    const settings = await systemSettingsService_1.systemSettingsService.updateOrgSettings(user.organizationId, req.body, user.id, ipAddress);
    return res.status(200).json(serializeSettings(settings));
};
exports.updateSystemSettings = updateSystemSettings;
exports.systemSettingsController = {
    getSystemSettings: exports.getSystemSettings,
    updateSystemSettings: exports.updateSystemSettings,
};
//# sourceMappingURL=systemSettingsController.js.map