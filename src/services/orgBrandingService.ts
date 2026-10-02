import { prisma } from "../lib/prisma";
import { settingsCache } from "../lib/settingsCache";
import { DEFAULT_CURRENCY } from "../utils/documentCurrency";
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

const BRANDING_SELECT = {
  id: true,
  name: true,
  address: true,
  phone: true,
  email: true,
  logoUrl: true,
  currency: true,
  timezone: true,
} as const;

export const DEFAULT_BRANDING: OrgBranding = {
  id: "",
  name: "Organization",
  address: null,
  phone: null,
  email: null,
  logoUrl: null,
  currency: DEFAULT_CURRENCY,
  timezone: "Africa/Lagos",
};

/**
 * Read branding for a report generation. Falls back to the settings cache
 * (populated by `/system/settings`) and finally to defaults, so a brand-new
 * organization can still render a document.
 */
export async function getOrgBranding(organizationId: string): Promise<OrgBranding> {
  const cached = settingsCache.get(organizationId);
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

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: BRANDING_SELECT,
  });
  if (!org) return { ...DEFAULT_BRANDING };
  return org;
}

/** Single-line contact string, e.g. "12 Allen Ave | +234 800 000 0000 | finance@org.org". */
export function formatContactLine(branding: OrgBranding): string {
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
export async function fetchLogoBuffer(
  logoUrl: string | null
): Promise<{ buffer: Buffer; format: "PNG" | "JPEG" } | null> {
  if (!logoUrl) return null;
  let url: URL;
  try {
    url = new URL(logoUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const isJpeg = contentType.includes("jpeg") || contentType.includes("jpg") || url.pathname.endsWith(".jpg") || url.pathname.endsWith(".jpeg");
    const isPng = contentType.includes("png") || url.pathname.endsWith(".png");
    if (!isJpeg && !isPng) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    // Guard against a misconfigured URL pointing at something enormous.
    if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) return null;
    return { buffer, format: isJpeg ? "JPEG" : "PNG" };
  } catch {
    return null;
  }
}

export type { Organization };
