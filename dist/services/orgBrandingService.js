"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BRANDING = void 0;
exports.getOrgBranding = getOrgBranding;
exports.formatContactLine = formatContactLine;
exports.fetchLogoBuffer = fetchLogoBuffer;
const prisma_1 = require("../lib/prisma");
const settingsCache_1 = require("../lib/settingsCache");
const documentCurrency_1 = require("../utils/documentCurrency");
const BRANDING_SELECT = {
    id: true,
    name: true,
    address: true,
    phone: true,
    email: true,
    logoUrl: true,
    currency: true,
    timezone: true,
};
exports.DEFAULT_BRANDING = {
    id: "",
    name: "Organization",
    address: null,
    phone: null,
    email: null,
    logoUrl: null,
    currency: documentCurrency_1.DEFAULT_CURRENCY,
    timezone: "Africa/Lagos",
};
/**
 * Read branding for a report generation. Falls back to the settings cache
 * (populated by `/system/settings`) and finally to defaults, so a brand-new
 * organization can still render a document.
 */
async function getOrgBranding(organizationId) {
    const cached = settingsCache_1.settingsCache.get(organizationId);
    if (cached) {
        return {
            id: cached.id,
            name: cached.name,
            address: cached.address ?? null,
            phone: cached.phone ?? null,
            email: cached.email ?? null,
            logoUrl: cached.logoUrl ?? null,
            currency: cached.currency,
            timezone: cached.timezone,
        };
    }
    const org = await prisma_1.prisma.organization.findUnique({
        where: { id: organizationId },
        select: BRANDING_SELECT,
    });
    if (!org)
        return { ...exports.DEFAULT_BRANDING };
    return org;
}
/** Single-line contact string, e.g. "12 Allen Ave | +234 800 000 0000 | finance@org.org". */
function formatContactLine(branding) {
    return [branding.address, branding.phone, branding.email]
        .map((part) => (part ?? "").trim())
        .filter(Boolean)
        .join("  |  ");
}
/**
 * Fetch a branding image as a PNG/JPEG buffer for embedding in a PDF.
 * Returns null when no logo is configured or the URL cannot be fetched, so
 * callers can fall back to the monogram placeholder.
 */
async function fetchLogoBuffer(logoUrl) {
    if (!logoUrl)
        return null;
    let url;
    try {
        url = new URL(logoUrl);
    }
    catch {
        return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:")
        return null;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok)
            return null;
        const contentType = (response.headers.get("content-type") || "").toLowerCase();
        const isJpeg = contentType.includes("jpeg") || contentType.includes("jpg") || url.pathname.endsWith(".jpg") || url.pathname.endsWith(".jpeg");
        const isPng = contentType.includes("png") || url.pathname.endsWith(".png");
        if (!isJpeg && !isPng)
            return null;
        const buffer = Buffer.from(await response.arrayBuffer());
        // Guard against a misconfigured URL pointing at something enormous.
        if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024)
            return null;
        return { buffer, format: isJpeg ? "JPEG" : "PNG" };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=orgBrandingService.js.map