"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTF8_BOM = void 0;
exports.csvField = csvField;
exports.buildCsvDocument = buildCsvDocument;
const documentCurrency_1 = require("../utils/documentCurrency");
const pdfReportRenderer_1 = require("./pdfReportRenderer");
/**
 * UTF-8 byte order mark.
 *
 * Without it, Excel on Windows reads a CSV as the local ANSI code page and
 * mangles the currency symbol (₦ becomes "N" or "?") and any accented member
 * name. Numbers.app and Google Sheets handle the BOM correctly too, so it is
 * safe to always emit.
 */
exports.UTF8_BOM = "\uFEFF";
/**
 * Quote a CSV field per RFC 4180. Always quoting keeps the output stable and
 * avoids surprises when a description contains a leading/trailing space.
 */
function csvField(value) {
    if (value === null || value === undefined)
        return '""';
    const text = String(value);
    // A leading =, +, - or @ is interpreted as a formula by Excel; prefix with
    // an apostrophe so a description can never execute on open.
    const needsGuard = /^[=+\-@\t\r]/.test(text);
    const guarded = needsGuard ? `'${text}` : text;
    return `"${guarded.replace(/"/g, '""')}"`;
}
function csvLine(values) {
    return values.map((value) => csvField(value)).join(",");
}
/**
 * Write a section's rows.
 *
 * Money keeps its currency symbol in CSV. The leading BOM is what lets Excel,
 * Numbers and Google Sheets read that symbol correctly instead of falling back
 * to the local code page and mangling it. XLSX is the format that stores money
 * as a native numeric type; CSV is the interchange-friendly one.
 */
function writeSection(lines, section) {
    if (section.title)
        lines.push(csvLine([section.title]));
    lines.push(csvLine(section.columns.map((column) => column.header)));
    for (const row of section.rows) {
        lines.push(csvLine(row.cells.map((cell) => cell.text)));
    }
    lines.push("");
}
function writeBlock(lines, block) {
    if (block.title)
        lines.push(csvLine([block.title]));
    for (const row of block.rows) {
        const value = row.cells[1];
        lines.push(csvLine([
            row.cells[0]?.text ?? "",
            value?.type === "number" && value.value !== undefined && value.value !== null
                ? value.value
                : value?.text ?? "",
        ]));
    }
    lines.push("");
}
/**
 * Render a report model to a CSV string prefixed with a UTF-8 BOM.
 *
 * The first three lines are provenance metadata (organization, report title,
 * period/currency) matching the Excel and PDF output, followed by the
 * standardized column header row and the data.
 */
function buildCsvDocument(model) {
    const lines = [];
    const currency = (0, documentCurrency_1.normalizeCurrencyCode)(model.currency);
    lines.push(csvLine([model.branding.name]));
    lines.push(csvLine([model.title]));
    lines.push(csvLine([
        model.meta.length > 0
            ? model.meta.map((item) => `${item.label}: ${item.value}`).join(" | ")
            : "Period: All dates",
    ]));
    lines.push(csvLine([
        `Base Currency: ${currency} (${(0, documentCurrency_1.getCurrencyName)(currency)}) | Generated: ${(0, pdfReportRenderer_1.formatTimestamp)(model.generatedAt, model.timezone)} | Timezone: ${model.timezone}`,
    ]));
    lines.push("");
    const hasContent = model.sections.some((section) => section.rows.length > 0) ||
        model.blocks.some((block) => block.rows.length > 0);
    if (!hasContent) {
        lines.push(csvLine([model.emptyMessage ?? "No data available for the selected period."]));
        lines.push("");
    }
    for (const section of model.sections) {
        if (section.rows.length === 0)
            continue;
        writeSection(lines, section);
    }
    for (const block of model.blocks) {
        if (block.rows.length === 0)
            continue;
        writeBlock(lines, block);
    }
    return `${exports.UTF8_BOM}${lines.join("\r\n")}\r\n`;
}
//# sourceMappingURL=reportCsvBuilder.js.map