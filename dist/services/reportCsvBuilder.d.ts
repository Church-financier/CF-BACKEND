import type { ReportModel } from "./reportExportModel";
/**
 * UTF-8 byte order mark.
 *
 * Without it, Excel on Windows reads a CSV as the local ANSI code page and
 * mangles the currency symbol (₦ becomes "N" or "?") and any accented member
 * name. Numbers.app and Google Sheets handle the BOM correctly too, so it is
 * safe to always emit.
 */
export declare const UTF8_BOM = "\uFEFF";
/**
 * Quote a CSV field per RFC 4180. Always quoting keeps the output stable and
 * avoids surprises when a description contains a leading/trailing space.
 */
export declare function csvField(value: string | number | null | undefined): string;
/**
 * Render a report model to a CSV string prefixed with a UTF-8 BOM.
 *
 * The first three lines are provenance metadata (organization, report title,
 * period/currency) matching the Excel and PDF output, followed by the
 * standardized column header row and the data.
 */
export declare function buildCsvDocument(model: ReportModel): string;
//# sourceMappingURL=reportCsvBuilder.d.ts.map