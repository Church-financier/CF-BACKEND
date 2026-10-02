import type { Organization } from "@prisma/client";

export interface CachedOrganizationSettings {
  id: string;
  name: string;
  currency: string;
  fiscalYearStartMonth: number;
  timezone: string;
  requireMfa: boolean;
  sessionTimeoutMinutes: number;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  createdAt: Date;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: CachedOrganizationSettings;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export const settingsCache = {
  get(organizationId: string): CachedOrganizationSettings | null {
    const entry = cache.get(organizationId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cache.delete(organizationId);
      return null;
    }
    return entry.value;
  },

  set(organizationId: string, value: CachedOrganizationSettings, ttlMs: number = DEFAULT_TTL_MS): void {
    cache.set(organizationId, { value, expiresAt: Date.now() + ttlMs });
  },

  purge(organizationId: string): void {
    cache.delete(organizationId);
  },

  purgeAll(): void {
    cache.clear();
  },
};

export function toCachedSettings(org: Pick<
  Organization,
  | "id"
  | "name"
  | "currency"
  | "fiscalYearStartMonth"
  | "timezone"
  | "requireMfa"
  | "sessionTimeoutMinutes"
  | "address"
  | "phone"
  | "email"
  | "logoUrl"
  | "createdAt"
>): CachedOrganizationSettings {
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
