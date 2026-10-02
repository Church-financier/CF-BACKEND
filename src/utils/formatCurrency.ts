import {
  formatMinorUnits,
  getCurrencySymbol,
  getMinorUnitDigits,
  normalizeCurrencyCode,
  toMajorUnits,
} from "./documentCurrency";

/**
 * Backwards-compatible money helpers.
 *
 * These are thin wrappers over `documentCurrency`, the single source of
 * currency truth in the backend. The organization's base currency is the
 * default, but every helper accepts an explicit ISO 4217 code so nothing is
 * tied to naira or to an `en-NG` locale.
 */

/** The organization's configured base currency, or the fallback when unknown. */
export function getOrgCurrency(): string {
  return normalizeCurrencyCode(process.env.ORG_CURRENCY);
}

export const formatNaira = (minor: number, currency?: string | null): string =>
  formatMinorUnits(minor, currency ?? getOrgCurrency());

export function formatCurrencyByOrg(minor: number, currency?: string | null): string {
  return formatMinorUnits(minor, currency ?? getOrgCurrency());
}

/** Compact form using the currency's own symbol, e.g. "₦1.20M" or "$1.20K". */
export const formatCurrencyCompact = (minor: number, currency?: string | null): string => {
  const code = normalizeCurrencyCode(currency ?? getOrgCurrency());
  const major = toMajorUnits(minor, code);
  const symbol = getCurrencySymbol(code);
  if (Math.abs(major) >= 1000000) {
    return `${symbol}${(major / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(major) >= 1000) {
    return `${symbol}${(major / 1000).toFixed(2)}K`;
  }
  return formatMinorUnits(minor, code);
};

/** Parse a major-unit user input into the stored minor-unit amount. */
export function parseCurrencyInput(input: string, currency?: string | null): number {
  const cleaned = input.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) throw new Error(`Invalid currency input: ${input}`);
  return Math.round(parsed * 10 ** getMinorUnitDigits(currency ?? getOrgCurrency()));
}