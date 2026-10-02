import {
  formatMinorUnits,
  getCurrencySymbol,
  getMinorUnitDigits,
  normalizeCurrencyCode,
  toMajorUnits,
} from "./documentCurrency";

/**
 * Minor-unit arithmetic and money formatting.
 *
 * Amounts are stored in the organization's base currency's minor unit, so the
 * 100x divisor is only correct for two-decimal currencies. Everything here is
 * therefore driven by an explicit ISO 4217 code and delegates to
 * `documentCurrency`, which is the single source of currency truth in the
 * backend. Nothing is hardcoded to naira.
 */
export const calculate = {
  /** Major units -> stored minor-unit amount for `currency`. */
  toKobo: (major: number, currency?: string | null): number =>
    Math.round(major * 10 ** getMinorUnitDigits(currency)),

  /** Stored minor-unit amount -> major units for `currency`. */
  fromKobo: (minor: number, currency?: string | null): number =>
    toMajorUnits(minor, currency),

  formatNaira: (minor: number, currency?: string | null): string =>
    formatMinorUnits(minor, currency),

  /** Compact form using the currency's own symbol, e.g. "₦1.20M" or "$1.20M". */
  formatCurrencyCompact: (minor: number, currency?: string | null): string => {
    const major = toMajorUnits(minor, currency);
    const symbol = getCurrencySymbol(currency);
    const normalized = normalizeCurrencyCode(currency);
    if (Math.abs(major) >= 1000000) {
      return `${symbol}${(major / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(major) >= 1000) {
      return `${symbol}${(major / 1000).toFixed(2)}K`;
    }
    return formatMinorUnits(minor, normalized);
  },

  sumKobo: (values: number[]): number => {
    return values.reduce((sum, v) => sum + v, 0);
  },

  subtractKobo: (a: number, b: number): number => {
    return a - b;
  },

  validateMonetaryPrecision: (value: number): boolean => {
    return Number.isInteger(value) && value >= 0;
  },

  calculateSplit: (
    totalKobo: number,
    percentages: number[]
  ): number[] => {
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (sum !== 100) throw new Error("Percentages must sum to 100");

    const allocations = percentages.map((pct) => Math.round(totalKobo * (pct / 100)));
    const allocated = allocations.reduce((a, b) => a + b, 0);
    const diff = totalKobo - allocated;

    if (diff !== 0) {
      allocations[allocations.length - 1] += diff;
    }

    return allocations;
  },
};
