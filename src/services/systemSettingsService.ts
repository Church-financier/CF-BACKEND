import { prisma } from "../lib/prisma";
import { settingsCache, toCachedSettings, CachedOrganizationSettings } from "../lib/settingsCache";
import { emitToOrganization } from "../index";
import { auditService } from "./auditService";

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
} as const;

export interface SystemSettingsData {
  organizationName?: string;
  baseCurrency?: string;
  fiscalYearStartMonth?: number;
  timezone?: string;
  requireMfa?: boolean;
  sessionTimeoutMinutes?: number;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export async function getOrgSettings(organizationId: string): Promise<CachedOrganizationSettings | null> {
  const cached = settingsCache.get(organizationId);
  if (cached) return { ...cached };

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: ORG_SELECT,
  });
  if (!org) return null;

  const settings = toCachedSettings(org);
  settingsCache.set(organizationId, settings);
  return settings;
}

export async function updateOrgSettings(
  organizationId: string,
  data: SystemSettingsData,
  userId: string,
  ipAddress?: string
): Promise<CachedOrganizationSettings> {
  const payload: Record<string, unknown> = {};
  if (data.organizationName !== undefined) payload.name = data.organizationName;
  if (data.baseCurrency !== undefined) payload.currency = data.baseCurrency;
  if (data.fiscalYearStartMonth !== undefined) payload.fiscalYearStartMonth = data.fiscalYearStartMonth;
  if (data.timezone !== undefined) payload.timezone = data.timezone;
  if (data.requireMfa !== undefined) payload.requireMfa = data.requireMfa;
  if (data.sessionTimeoutMinutes !== undefined) payload.sessionTimeoutMinutes = data.sessionTimeoutMinutes;
  if (data.address !== undefined) payload.address = data.address;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.logoUrl !== undefined) payload.logoUrl = data.logoUrl;

  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: payload,
    select: ORG_SELECT,
  });

  const settings = toCachedSettings(updated);
  settingsCache.purge(organizationId);
  settingsCache.set(organizationId, settings);

  await auditService.log({
    userId,
    organizationId,
    action: "UPDATE_ORGANIZATION_SETTINGS",
    details: { changed: Object.keys(data) },
    ipAddress,
  });

  emitToOrganization(organizationId, "organization:settings_updated", {
    currency: settings.currency,
    timezone: settings.timezone,
    fiscalYearStartMonth: settings.fiscalYearStartMonth,
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
    requireMfa: settings.requireMfa,
  });

  return settings;
}

export const systemSettingsService = {
  getOrgSettings,
  updateOrgSettings,
};
