"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textCell = textCell;
exports.moneyCell = moneyCell;
exports.numberCell = numberCell;
exports.moneyHeader = moneyHeader;
exports.isEmptyReport = isEmptyReport;
const documentCurrency_1 = require("../utils/documentCurrency");
/** Build a plain-text cell. */
function textCell(value, type = "text") {
    return { text: value === null || value === undefined ? "" : String(value), type };
}
/**
 * Build a money cell from a minor-unit amount. Keeps the major-unit number so
 * Excel can store a numeric value with a currency format.
 */
function moneyCell(amountInMinor, currency) {
    const minor = (0, documentCurrency_1.toBigInt)(amountInMinor);
    return {
        text: (0, documentCurrency_1.formatMinorUnits)(minor, currency),
        value: (0, documentCurrency_1.toMajorUnits)(minor, currency),
        raw: minor,
        type: "money",
    };
}
/** Build a numeric cell, e.g. a fiscal year or a month index. */
function numberCell(value) {
    return { text: String(value), value, type: "number" };
}
function moneyHeader(label, currency) {
    return `${label} (${(0, documentCurrency_1.normalizeCurrencyCode)(currency)})`;
}
/** True when a report has no rows at all, so the renderers can say so. */
function isEmptyReport(model) {
    return (model.sections.every((section) => section.rows.length === 0) &&
        model.blocks.every((block) => block.rows.length === 0));
}
//# sourceMappingURL=reportExportModel.js.map