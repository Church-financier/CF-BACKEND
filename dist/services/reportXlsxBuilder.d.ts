import type { ReportModel, ReportRow, ReportRowKind } from "./reportExportModel";
/** Spreadsheet-safe sheet name: <=31 chars, no []:*?/\ and not blank. */
export declare function safeSheetName(name: string, fallback?: string): string;
/**
 * Render a report model to a styled .xlsx workbook.
 *
 * Money cells are written as numbers with an explicit currency number format
 * (e.g. `"₦"#,##0.00`) rather than pre-formatted strings, so Excel, Numbers
 * and Google Sheets can sum, sort and chart them.
 */
export declare function buildWorkbook(model: ReportModel): Promise<Buffer>;
export type { ReportRow, ReportRowKind };
//# sourceMappingURL=reportXlsxBuilder.d.ts.map