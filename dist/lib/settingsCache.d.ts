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
export declare const settingsCache: {
    get(organizationId: string): CachedOrganizationSettings | null;
    set(organizationId: string, value: CachedOrganizationSettings, ttlMs?: number): void;
    purge(organizationId: string): void;
    purgeAll(): void;
};
export declare function toCachedSettings(org: Pick<Organization, "id" | "name" | "currency" | "fiscalYearStartMonth" | "timezone" | "requireMfa" | "sessionTimeoutMinutes" | "address" | "phone" | "email" | "logoUrl" | "createdAt">): CachedOrganizationSettings;
//# sourceMappingURL=settingsCache.d.ts.map