import type { Organization } from "@prisma/client";
/**
 * Branding used on every generated document (PDF reports, e-receipts and
 * payment vouchers). Kept in one place so headers, footers and print
 * templates cannot drift apart.
 */
export interface OrgBranding {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    currency: string;
    timezone: string;
}
export declare const DEFAULT_BRANDING: OrgBranding;
/**
 * Read branding for a report generation. Falls back to the settings cache
 * (populated by `/system/settings`) and finally to defaults, so a brand-new
 * organization can still render a document.
 */
export declare function getOrgBranding(organizationId: string): Promise<OrgBranding>;
/** Single-line contact string, e.g. "12 Allen Ave | +234 800 000 0000 | finance@org.org". */
export declare function formatContactLine(branding: OrgBranding): string;
/**
 * Fetch a branding image as a PNG/JPEG buffer for embedding in a PDF.
 * Returns null when no logo is configured or the URL cannot be fetched, so
 * callers can fall back to the monogram placeholder.
 */
export declare function fetchLogoBuffer(logoUrl: string | null): Promise<{
    buffer: Buffer;
    format: "PNG" | "JPEG";
} | null>;
export type { Organization };
//# sourceMappingURL=orgBrandingService.d.ts.map