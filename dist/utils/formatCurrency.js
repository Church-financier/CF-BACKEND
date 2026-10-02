"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrencyCompact = exports.formatNaira = void 0;
exports.getOrgCurrency = getOrgCurrency;
exports.formatCurrencyByOrg = formatCurrencyByOrg;
exports.parseCurrencyInput = parseCurrencyInput;
const documentCurrency_1 = require("./documentCurrency");
/**
 * Backwards-compatible money helpers.
 *
 * These are thin wrappers over `documentCurrency`, the single source of
 * currency truth in the backend. The organization's base currency is the
 * default, but every helper accepts an explicit ISO 4217 code so nothing is
 * tied to naira or to an `en-NG` locale.
 */
/** The organization's configured base currency, or the fallback when unknown. */
function getOrgCurrency() {
    return (0, documentCurrency_1.normalizeCurrencyCode)(process.env.ORG_CURRENCY);
}
const formatNaira = (minor, currency) => (0, documentCurrency_1.formatMinorUnits)(minor, currency ?? getOrgCurrency());
exports.formatNaira = formatNaira;
function formatCurrencyByOrg(minor, currency) {
    return (0, documentCurrency_1.formatMinorUnits)(minor, currency ?? getOrgCurrency());
}
/** Compact form using the currency's own symbol, e.g. "₦1.20M" or "$1.20K". */
const formatCurrencyCompact = (minor, currency) => {
    const code = (0, documentCurrency_1.normalizeCurrencyCode)(currency ?? getOrgCurrency());
    const major = (0, documentCurrency_1.toMajorUnits)(minor, code);
    const symbol = (0, documentCurrency_1.getCurrencySymbol)(code);
    if (Math.abs(major) >= 1000000) {
        return `${symbol}${(major / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(major) >= 1000) {
        return `${symbol}${(major / 1000).toFixed(2)}K`;
    }
    return (0, documentCurrency_1.formatMinorUnits)(minor, code);
};
exports.formatCurrencyCompact = formatCurrencyCompact;
/** Parse a major-unit user input into the stored minor-unit amount. */
function parseCurrencyInput(input, currency) {
    const cleaned = input.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed))
        throw new Error(`Invalid currency input: ${input}`);
    return Math.round(parsed * 10 ** (0, documentCurrency_1.getMinorUnitDigits)(currency ?? getOrgCurrency()));
}
//# sourceMappingURL=formatCurrency.js.map