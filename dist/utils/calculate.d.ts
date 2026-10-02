/**
 * Minor-unit arithmetic and money formatting.
 *
 * Amounts are stored in the organization's base currency's minor unit, so the
 * 100x divisor is only correct for two-decimal currencies. Everything here is
 * therefore driven by an explicit ISO 4217 code and delegates to
 * `documentCurrency`, which is the single source of currency truth in the
 * backend. Nothing is hardcoded to naira.
 */
export declare const calculate: {
    /** Major units -> stored minor-unit amount for `currency`. */
    toKobo: (major: number, currency?: string | null) => number;
    /** Stored minor-unit amount -> major units for `currency`. */
    fromKobo: (minor: number, currency?: string | null) => number;
    formatNaira: (minor: number, currency?: string | null) => string;
    /** Compact form using the currency's own symbol, e.g. "₦1.20M" or "$1.20M". */
    formatCurrencyCompact: (minor: number, currency?: string | null) => string;
    sumKobo: (values: number[]) => number;
    subtractKobo: (a: number, b: number) => number;
    validateMonetaryPrecision: (value: number) => boolean;
    calculateSplit: (totalKobo: number, percentages: number[]) => number[];
};
//# sourceMappingURL=calculate.d.ts.map