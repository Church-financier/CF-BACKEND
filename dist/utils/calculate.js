"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate = void 0;
const documentCurrency_1 = require("./documentCurrency");
/**
 * Minor-unit arithmetic and money formatting.
 *
 * Amounts are stored in the organization's base currency's minor unit, so the
 * 100x divisor is only correct for two-decimal currencies. Everything here is
 * therefore driven by an explicit ISO 4217 code and delegates to
 * `documentCurrency`, which is the single source of currency truth in the
 * backend. Nothing is hardcoded to naira.
 */
exports.calculate = {
    /** Major units -> stored minor-unit amount for `currency`. */
    toKobo: (major, currency) => Math.round(major * 10 ** (0, documentCurrency_1.getMinorUnitDigits)(currency)),
    /** Stored minor-unit amount -> major units for `currency`. */
    fromKobo: (minor, currency) => (0, documentCurrency_1.toMajorUnits)(minor, currency),
    formatNaira: (minor, currency) => (0, documentCurrency_1.formatMinorUnits)(minor, currency),
    /** Compact form using the currency's own symbol, e.g. "₦1.20M" or "$1.20M". */
    formatCurrencyCompact: (minor, currency) => {
        const major = (0, documentCurrency_1.toMajorUnits)(minor, currency);
        const symbol = (0, documentCurrency_1.getCurrencySymbol)(currency);
        const normalized = (0, documentCurrency_1.normalizeCurrencyCode)(currency);
        if (Math.abs(major) >= 1000000) {
            return `${symbol}${(major / 1000000).toFixed(2)}M`;
        }
        if (Math.abs(major) >= 1000) {
            return `${symbol}${(major / 1000).toFixed(2)}K`;
        }
        return (0, documentCurrency_1.formatMinorUnits)(minor, normalized);
    },
    sumKobo: (values) => {
        return values.reduce((sum, v) => sum + v, 0);
    },
    subtractKobo: (a, b) => {
        return a - b;
    },
    validateMonetaryPrecision: (value) => {
        return Number.isInteger(value) && value >= 0;
    },
    calculateSplit: (totalKobo, percentages) => {
        const sum = percentages.reduce((a, b) => a + b, 0);
        if (sum !== 100)
            throw new Error("Percentages must sum to 100");
        const allocations = percentages.map((pct) => Math.round(totalKobo * (pct / 100)));
        const allocated = allocations.reduce((a, b) => a + b, 0);
        const diff = totalKobo - allocated;
        if (diff !== 0) {
            allocations[allocations.length - 1] += diff;
        }
        return allocations;
    },
};
//# sourceMappingURL=calculate.js.map