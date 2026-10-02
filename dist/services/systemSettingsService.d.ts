import { CachedOrganizationSettings } from "../lib/settingsCache";
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
export declare function getOrgSettings(organizationId: string): Promise<CachedOrganizationSettings | null>;
export declare function updateOrgSettings(organizationId: string, data: SystemSettingsData, userId: string, ipAddress?: string): Promise<CachedOrganizationSettings>;
export declare const systemSettingsService: {
    getOrgSettings: typeof getOrgSettings;
    updateOrgSettings: typeof updateOrgSettings;
};
//# sourceMappingURL=systemSettingsService.d.ts.map