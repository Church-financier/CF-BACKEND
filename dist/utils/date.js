"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TIMEZONE = void 0;
exports.isValidTimeZone = isValidTimeZone;
exports.isValidCurrencyCode = isValidCurrencyCode;
exports.formatInTimezone = formatInTimezone;
exports.DEFAULT_TIMEZONE = "Africa/Lagos";
function isValidTimeZone(tz) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    }
    catch {
        return false;
    }
}
function isValidCurrencyCode(code) {
    if (!/^[A-Z]{3}$/.test(code))
        return false;
    const supportedCurrencies = Intl.supportedValuesOf;
    if (typeof supportedCurrencies === "function") {
        try {
            return supportedCurrencies("currency").includes(code.toUpperCase());
        }
        catch {
            return true;
        }
    }
    try {
        new Intl.NumberFormat("en-US", { style: "currency", currency: code });
        return true;
    }
    catch {
        return false;
    }
}
function formatInTimezone(date, timezone = exports.DEFAULT_TIMEZONE, options = {}) {
    const d = typeof date === "number" ? new Date(date) : date instanceof Date ? date : new Date(date);
    const tz = isValidTimeZone(timezone) ? timezone : exports.DEFAULT_TIMEZONE;
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...options,
        timeZone: tz,
    }).format(d);
}
//# sourceMappingURL=date.js.map