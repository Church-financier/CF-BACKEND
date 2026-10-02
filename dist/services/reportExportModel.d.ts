import type { OrgBranding } from "./orgBrandingService";
/**
 * Format-agnostic description of a financial report.
 *
 * Reports are described once, here, and then rendered to PDF, XLSX and CSV.
 * Carrying the *typed* value alongside its display text is what lets the Excel
 * writer emit a real number with a currency format while the PDF writer shows
 * a formatted string and the CSV writer emits a plain numeric field.
 */
export type CellType = "text" | "code" | "money" | "number" | "date" | "status";
export interface ReportCell {
    /** Already-formatted display text. */
    text: string;
    /** Raw value; when present, spreadsheet formats write a real number. */
    value?: number | null;
    /**
     * Exact stored amount in minor units. Kept as a bigint so spreadsheet
     * exports never route a figure through a float and lose a cent.
     */
    raw?: bigint;
    type: CellType;
}
export interface ReportColumn {
    header: string;
    align?: "left" | "right" | "center";
    type?: CellType;
    /** Relative width, used by the PDF renderer. */
    flex?: number;
    /** Render in a monospaced face (codes, references). */
    mono?: boolean;
}
export type ReportRowKind = "data" | "subtotal" | "total" | "section";
export interface ReportRow {
    kind: ReportRowKind;
    cells: ReportCell[];
}
export interface ReportSection {
    title?: string;
    subtitle?: string;
    columns: ReportColumn[];
    rows: ReportRow[];
}
export interface ReportBlock {
    title?: string;
    columns: ReportColumn[];
    rows: ReportRow[];
}
export interface ReportModel {
    title: string;
    subtitle?: string;
    branding: OrgBranding;
    currency: string;
    timezone: string;
    generatedAt: Date;
    meta: Array<{
        label: string;
        value: string;
    }>;
    sections: ReportSection[];
    blocks: ReportBlock[];
    emptyMessage?: string;
}
/** Build a plain-text cell. */
export declare function textCell(value: string | number | null | undefined, type?: CellType): ReportCell;
/**
 * Build a money cell from a minor-unit amount. Keeps the major-unit number so
 * Excel can store a numeric value with a currency format.
 */
export declare function moneyCell(amountInMinor: bigint | number | string, currency: string): ReportCell;
/** Build a numeric cell, e.g. a fiscal year or a month index. */
export declare function numberCell(value: number): ReportCell;
export declare function moneyHeader(label: string, currency: string): string;
/** True when a report has no rows at all, so the renderers can say so. */
export declare function isEmptyReport(model: ReportModel): boolean;
//# sourceMappingURL=reportExportModel.d.ts.map