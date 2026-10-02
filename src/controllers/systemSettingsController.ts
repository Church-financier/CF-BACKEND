import { Request, Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { getClientIp } from "../utils/clientIp";
import { systemSettingsService } from "../services/systemSettingsService";

const serializeSettings = (org: any) => ({
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

export const getSystemSettings = async (req: TenantRequest, res: Response) => {
  const user = req.user!;
  const settings = await systemSettingsService.getOrgSettings(user.organizationId);
  if (!settings) {
    return res.status(404).json({ error: "Organization not found" });
  }
  return res.status(200).json(serializeSettings(settings));
};

export const updateSystemSettings = async (req: TenantRequest, res: Response) => {
  const user = req.user!;
  const ipAddress = getClientIp(req as Request);
  const settings = await systemSettingsService.updateOrgSettings(
    user.organizationId,
    req.body,
    user.id,
    ipAddress
  );
  return res.status(200).json(serializeSettings(settings));
};

export const systemSettingsController = {
  getSystemSettings,
  updateSystemSettings,
};
