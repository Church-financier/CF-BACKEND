import { toMajorUnits, toBigInt } from "../utils/documentCurrency";
import { type OrgBranding } from "./orgBrandingService";
/**
 * Shared visual language for every generated PDF.
 *
 * The palette is deliberately slate-based: a deep navy header, near-white
 * alternating stripes, and dark grey body text. It prints legibly in greyscale
 * and keeps the colour budget low enough that a mixed page of a receipt and a
 * report still looks like one product.
 */
export declare const PDF_COLORS: {
    readonly primary: "#1E293B";
    readonly secondary: "#334155";
    readonly stripe: "#F8FAFC";
    readonly body: "#334155";
    readonly muted: "#94A3B8";
    readonly border: "#E2E8F0";
    readonly white: "#FFFFFF";
    readonly success: "#059669";
    readonly warning: "#D97706";
    readonly danger: "#DC2626";
};
/** A4 in PostScript points. */
export declare const A4: {
    readonly width: 595.28;
    readonly height: 841.89;
};
/** US Letter in PostScript points. */
export declare const LETTER: {
    readonly width: 612;
    readonly height: 792;
};
export declare const PDF_MARGIN = 40;
export declare const PDF_CONTENT_WIDTH: number;
export declare function resolveTimezone(timezone: string | null | undefined): string;
/** "01 Oct 2026, 14:32" in the organization's timezone. */
export declare function formatTimestamp(date: Date, timezone: string): string;
/** "01 Oct 2026" in the organization's timezone. */
export declare function formatDateOnly(date: Date | null | undefined, timezone: string): string;
/**
 * A document column definition. `align` drives both the PDF text alignment
 * and the Excel/CSV alignment so the three formats stay visually consistent.
 */
export interface PdfColumn {
    header: string;
    /** Relative width used to distribute the content area. */
    flex?: number;
    align?: "left" | "right" | "center";
    mono?: boolean;
}
export type PdfRowKind = "data" | "subtotal" | "total" | "section";
export interface PdfRow {
    kind: PdfRowKind;
    cells: Array<string | number | null>;
}
export interface PdfSection {
    /** Section heading, e.g. "Income by Fund". */
    title?: string;
    /** Optional note rendered under the heading, e.g. "Grouped by fund". */
    subtitle?: string;
    columns: PdfColumn[];
    rows: PdfRow[];
}
export interface PdfTable {
    columns: PdfColumn[];
    rows: PdfRow[];
}
export interface PdfDocumentOptions {
    title: string;
    subtitle?: string;
    branding: OrgBranding;
    /** Extra lines under the title, e.g. "Period: 01 Jan 2026 – 31 Dec 2026". */
    meta?: Array<{
        label: string;
        value: string;
    }>;
    currency: string;
    timezone: string;
    generatedAt: Date;
    /** Row-oriented tables such as a trial balance. */
    sections?: PdfSection[];
    /** Titled summary blocks such as a cash-flow statement. */
    blocks?: PdfTable[];
    /** Text shown when a report has no data at all. */
    emptyMessage?: string;
    /** Set false for one-page documents such as receipts. */
    paginate?: boolean;
}
/** Draw a rounded or square background behind a run of content. */
export declare function fillRect(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, color: string): void;
/**
 * Organization header: logo (or a clean monogram placeholder), name and the
 * contact line. Drawn on the first page of a document.
 */
export declare function drawOrgHeader(doc: PDFKit.PDFDocument, branding: OrgBranding, options: {
    width: number;
    y: number;
    compact?: boolean;
}): Promise<number>;
/**
 * Renders a structured PDF report: branded header, metadata block, grouped
 * tables with subtotal and total rows, and a footer carrying "Page X of Y"
 * plus the generation timestamp.
 */
export declare class PdfReportRenderer {
    private doc;
    private options;
    private currency;
    private y;
    private readonly chunks;
    constructor(options: PdfDocumentOptions);
    private money;
    /** Currency header suffix, e.g. "Amount (NGN)". */
    private moneyHeader;
    private ensureSpace;
    private drawContinuationHeader;
    private drawTitleBlock;
    /** Render a titled block of key/value rows, e.g. a cash-flow statement. */
    private drawBlock;
    /**
     * Render a tabular block: navy header row, striped data rows, and shaded
     * subtotal/total rows with a rule above them.
     */
    private drawTable;
    private stampFooters;
    render(): Promise<Buffer>;
}
export { toMajorUnits, toBigInt };
//# sourceMappingURL=pdfReportRenderer.d.ts.map