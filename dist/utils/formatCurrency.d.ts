/**
 * Backwards-compatible money helpers.
 *
 * These are thin wrappers over `documentCurrency`, the single source of
 * currency truth in the backend. The organization's base currency is the
 * default, but every helper accepts an explicit ISO 4217 code so nothing is
 * tied to naira or to an `en-NG` locale.
 */
/** The organization's configured base currency, or the fallback when unknown. */
export declare function getOrgCurrency(): string;
export declare const formatNaira: (minor: number, currency?: string | null) => string;
export declare function formatCurrencyByOrg(minor: number, currency?: string | null): string;
/** Compact form using the currency's own symbol, e.g. "₦1.20M" or "$1.20K". */
export declare const formatCurrencyCompact: (minor: number, currency?: string | null) => string;
/** Parse a major-unit user input into the stored minor-unit amount. */
export declare function parseCurrencyInput(input: string, currency?: string | null): number;
//# sourceMappingURL=formatCurrency.d.ts.map