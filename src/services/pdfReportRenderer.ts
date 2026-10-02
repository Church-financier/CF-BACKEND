import PDFDocument from "pdfkit";
import { formatMinorUnits, normalizeCurrencyCode, toMajorUnits, toBigInt } from "../utils/documentCurrency";
import { isValidTimeZone, DEFAULT_TIMEZONE } from "../utils/date";
import { fetchLogoBuffer, formatContactLine, type OrgBranding } from "./orgBrandingService";

/**
 * Shared visual language for every generated PDF.
 *
 * The palette is deliberately slate-based: a deep navy header, near-white
 * alternating stripes, and dark grey body text. It prints legibly in greyscale
 * and keeps the colour budget low enough that a mixed page of a receipt and a
 * report still looks like one product.
 */
export const PDF_COLORS = {
  primary: "#1E293B",
  secondary: "#334155",
  stripe: "#F8FAFC",
  body: "#334155",
  muted: "#94A3B8",
  border: "#E2E8F0",
  white: "#FFFFFF",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
} as const;

/** A4 in PostScript points. */
export const A4 = { width: 595.28, height: 841.89 } as const;
/** US Letter in PostScript points. */
export const LETTER = { width: 612, height: 792 } as const;

export const PDF_MARGIN = 40;
export const PDF_CONTENT_WIDTH = A4.width - PDF_MARGIN * 2;

/** Height reserved at the bottom of every page for the footer band. */
const FOOTER_HEIGHT = 46;
const BOTTOM_LIMIT = A4.height - PDF_MARGIN - FOOTER_HEIGHT;

/** Fixed-width digits so numeric columns line up between rows. */
const FONT_REGULAR = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const FONT_MONO = "Courier";

export function resolveTimezone(timezone: string | null | undefined): string {
  return timezone && isValidTimeZone(timezone) ? timezone : DEFAULT_TIMEZONE;
}

/** "01 Oct 2026, 14:32" in the organization's timezone. */
export function formatTimestamp(date: Date, timezone: string): string {
  const tz = resolveTimezone(timezone);
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: tz,
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(date);
  return `${datePart}, ${timePart}`;
}

/** "01 Oct 2026" in the organization's timezone. */
export function formatDateOnly(date: Date | null | undefined, timezone: string): string {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: resolveTimezone(timezone),
  }).format(d);
}

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
  meta?: Array<{ label: string; value: string }>;
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

function cellText(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function distributeWidths(columns: PdfColumn[], totalWidth: number): number[] {
  const flexTotal = columns.reduce((sum, column) => sum + (column.flex ?? 1), 0) || 1;
  return columns.map((column) => Math.max(24, Math.floor((column.flex ?? 1) * (totalWidth / flexTotal))));
}

/**
 * Distribute the content width across columns, then hand any rounding
 * remainder to the widest column so the table always spans the full width
 * exactly (a 1pt gap on the right edge reads as a broken border).
 */
function normalizedWidths(columns: PdfColumn[], totalWidth: number): number[] {
  const widths = distributeWidths(columns, totalWidth);
  const used = widths.reduce((sum, width) => sum + width, 0);
  const diff = Math.round(totalWidth - used);
  if (diff === 0 || widths.length === 0) return widths;

  let widest = 0;
  for (let i = 1; i < widths.length; i++) {
    if (widths[i] > widths[widest]) widest = i;
  }
  const adjusted = [...widths];
  adjusted[widest] = Math.max(24, adjusted[widest] + diff);
  return adjusted;
}

function fontFor(column: PdfColumn, row: PdfRow): string {
  if (row.kind === "total" || row.kind === "subtotal") return FONT_BOLD;
  if (column.mono) return FONT_MONO;
  return FONT_REGULAR;
}

function textColorFor(row: PdfRow, kind: PdfColumn | undefined): string {
  if (row.kind === "total") return PDF_COLORS.white;
  if (row.kind === "subtotal") return PDF_COLORS.primary;
  if (row.kind === "section") return PDF_COLORS.primary;
  return kind?.align === "right" ? PDF_COLORS.secondary : PDF_COLORS.body;
}

/** Draw a rounded or square background behind a run of content. */
export function fillRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  doc.save();
  doc.rect(x, y, width, height).fill(color);
  doc.restore();
}

/**
 * Organization header: logo (or a clean monogram placeholder), name and the
 * contact line. Drawn on the first page of a document.
 */
export async function drawOrgHeader(
  doc: PDFKit.PDFDocument,
  branding: OrgBranding,
  options: { width: number; y: number; compact?: boolean }
): Promise<number> {
  const { width, y } = options;
  const height = options.compact ? 56 : 64;
  const logoSize = height - 20;
  const textX = 40 + logoSize + 14;
  const textWidth = width - (textX - 40) - 12;

  fillRect(doc, 40, y, width, height, PDF_COLORS.primary);

  const logo = await fetchLogoBuffer(branding.logoUrl);
  const logoX = 40 + 10;
  const logoY = y + 10;
  if (logo) {
    try {
      doc.image(logo.buffer, logoX, logoY, {
        fit: [logoSize, logoSize],
        align: "center",
        valign: "center",
      });
    } catch {
      drawMonogram(doc, logoX, logoY, logoSize, branding.name, PDF_COLORS.white);
    }
  } else {
    // Clean placeholder: a light panel with the organization's initial.
    doc.save();
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 4).fill(PDF_COLORS.white);
    doc.restore();
    doc
      .font(FONT_BOLD)
      .fontSize(logoSize * 0.5)
      .fillColor(PDF_COLORS.primary)
      .text(branding.name.trim().charAt(0).toUpperCase() || "?", logoX, logoY + logoSize * 0.22, {
        width: logoSize,
        align: "center",
      });
  }

  doc
    .font(FONT_BOLD)
    .fontSize(options.compact ? 12 : 14)
    .fillColor(PDF_COLORS.white)
    .text(branding.name.toUpperCase(), textX, y + 12, { width: textWidth, ellipsis: true });

  const contact = formatContactLine(branding);
  if (contact) {
    doc
      .font(FONT_REGULAR)
      .fontSize(7.5)
      .fillColor(PDF_COLORS.white)
      .text(contact, textX, y + (options.compact ? 30 : 34), {
        width: textWidth,
        ellipsis: true,
      });
  }

  return y + height;
}

/** Fallback emblem drawn when no logo image is available. */
function drawMonogram(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  name: string,
  color: string
): void {
  doc.save();
  doc.circle(x + size / 2, y + size / 2, size / 2).fill(color);
  doc.restore();
  doc
    .font(FONT_BOLD)
    .fontSize(size * 0.45)
    .fillColor(PDF_COLORS.primary)
    .text(name.trim().charAt(0).toUpperCase() || "?", x, y + size * 0.25, {
      width: size,
      align: "center",
    });
}

/**
 * Renders a structured PDF report: branded header, metadata block, grouped
 * tables with subtotal and total rows, and a footer carrying "Page X of Y"
 * plus the generation timestamp.
 */
export class PdfReportRenderer {
  private doc: PDFKit.PDFDocument;
  private options: PdfDocumentOptions;
  private currency: string;
  private y: number;
  private readonly chunks: Buffer[] = [];

  constructor(options: PdfDocumentOptions) {
    this.options = options;
    this.currency = normalizeCurrencyCode(options.currency);
    this.y = PDF_MARGIN;
    this.doc = new PDFDocument({
      size: [A4.width, A4.height],
      margin: PDF_MARGIN,
      bufferPages: true,
      info: {
        Title: `${options.title} — ${options.branding.name}`,
        Author: options.branding.name,
        Subject: options.title,
        Creator: "Church Financier — Executive Financial Suite",
        Producer: "Church Financier",
        CreationDate: options.generatedAt,
      },
    });
    this.doc.on("data", (chunk) => this.chunks.push(chunk as Buffer));
  }

  private money(value: bigint | number | string): string {
    return formatMinorUnits(value, this.currency);
  }

  /** Currency header suffix, e.g. "Amount (NGN)". */
  private moneyHeader(label: string): string {
    return `${label} (${this.currency})`;
  }

  private ensureSpace(height: number): void {
    if (this.options.paginate === false) return;
    if (this.y + height <= BOTTOM_LIMIT) return;
    this.doc.addPage();
    this.y = PDF_MARGIN;
    this.drawContinuationHeader();
  }

  private drawContinuationHeader(): void {
    const width = PDF_CONTENT_WIDTH;
    fillRect(this.doc, 40, this.y, width, 22, PDF_COLORS.primary);
    this.doc
      .font(FONT_BOLD)
      .fontSize(8)
      .fillColor(PDF_COLORS.white)
      .text(this.options.title.toUpperCase(), 50, this.y + 7, { width: width / 2 });
    this.doc
      .font(FONT_REGULAR)
      .fontSize(8)
      .fillColor(PDF_COLORS.white)
      .text(this.options.branding.name, 40 + width / 2, this.y + 7, {
        width: width / 2 - 10,
        align: "right",
        ellipsis: true,
      });
    this.y += 22 + 14;
  }

  private drawTitleBlock(): void {
    this.doc
      .font(FONT_BOLD)
      .fontSize(20)
      .fillColor(PDF_COLORS.primary)
      .text(this.options.title, 40, this.y, { width: PDF_CONTENT_WIDTH, align: "center" });
    this.y += 26;

    if (this.options.subtitle) {
      this.doc
        .font(FONT_REGULAR)
        .fontSize(10)
        .fillColor(PDF_COLORS.muted)
        .text(this.options.subtitle, 40, this.y, { width: PDF_CONTENT_WIDTH, align: "center" });
      this.y += 16;
    }

    // Metadata strip: date range, base currency, generation time.
    const meta: Array<{ label: string; value: string }> = [
      ...(this.options.meta ?? []),
      { label: "Base Currency", value: this.currency },
    ];

    if (meta.length > 0) {
      const stripHeight = 20 + Math.ceil(meta.length / 3) * 14;
      fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, stripHeight, PDF_COLORS.stripe);
      this.doc.strokeColor(PDF_COLORS.border).lineWidth(0.5);
      this.doc
        .rect(40, this.y, PDF_CONTENT_WIDTH, stripHeight)
        .stroke(PDF_COLORS.border);

      const colWidth = PDF_CONTENT_WIDTH / 3;
      meta.forEach((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = 40 + col * colWidth + 10;
        const cellY = this.y + 8 + row * 14;
        this.doc.font(FONT_REGULAR).fontSize(7).fillColor(PDF_COLORS.muted);
        const labelText = `${item.label.toUpperCase()}: `;
        const labelWidth = this.doc.widthOfString(labelText);
        this.doc.text(labelText, x, cellY, { continued: true, lineBreak: false });
        this.doc
          .font(FONT_BOLD)
          .fontSize(7.5)
          .fillColor(PDF_COLORS.secondary)
          .text(item.value, x + labelWidth, cellY, {
            width: colWidth - 20,
            ellipsis: true,
            lineBreak: false,
          });
      });

      this.y += stripHeight + 18;
    }
  }

  /** Render a titled block of key/value rows, e.g. a cash-flow statement. */
  private drawBlock(table: PdfTable, title?: string): void {
    if (title) {
      this.ensureSpace(30);
      this.doc
        .font(FONT_BOLD)
        .fontSize(9.5)
        .fillColor(PDF_COLORS.primary)
        .text(title.toUpperCase(), 40, this.y, { width: PDF_CONTENT_WIDTH });
      this.y += 16;
    }

    const labelFlex = table.columns[0]?.flex ?? 3;
    const valueFlex = table.columns[1]?.flex ?? 2;
    const totalFlex = labelFlex + valueFlex;
    const labelWidth = Math.floor((labelFlex / totalFlex) * PDF_CONTENT_WIDTH);
    const valueWidth = PDF_CONTENT_WIDTH - labelWidth;

    for (const row of table.rows) {
      const label = cellText(row.cells[0]);
      const value = cellText(row.cells[1]);
      const isTotal = row.kind === "total";
      const isSubtotal = row.kind === "subtotal";

      this.ensureSpace(24);
      const rowHeight = 22;

      if (isTotal) {
        fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, rowHeight, PDF_COLORS.primary);
      } else if (isSubtotal) {
        fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, rowHeight, PDF_COLORS.stripe);
      } else if (row.kind === "data") {
        fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, rowHeight, PDF_COLORS.white);
      }

      const textY = this.y + 7;
      this.doc
        .font(isTotal || isSubtotal ? FONT_BOLD : FONT_REGULAR)
        .fontSize(9.5)
        .fillColor(isTotal ? PDF_COLORS.white : PDF_COLORS.body)
        .text(label || " ", 50, textY, { width: labelWidth - 20, ellipsis: true });

      this.doc
        .font(FONT_BOLD)
        .fontSize(9.5)
        .fillColor(isTotal ? PDF_COLORS.white : PDF_COLORS.primary)
        .text(value || " ", 40 + labelWidth, textY, { width: valueWidth - 10, align: "right" });

      this.y += rowHeight;
    }

    this.y += 16;
  }

  /**
   * Render a tabular block: navy header row, striped data rows, and shaded
   * subtotal/total rows with a rule above them.
   */
  private drawTable(table: PdfTable, section?: PdfSection): void {
    const columns = table.columns;
    const widths = normalizedWidths(columns, PDF_CONTENT_WIDTH);
    const headerHeight = 24;
    const rowHeight = 20;

    if (section?.title) {
      this.ensureSpace(40);
      this.doc
        .font(FONT_BOLD)
        .fontSize(9.5)
        .fillColor(PDF_COLORS.primary)
        .text(section.title.toUpperCase(), 40, this.y, { width: PDF_CONTENT_WIDTH });
      this.y += 15;
      if (section.subtitle) {
        this.doc
          .font(FONT_REGULAR)
          .fontSize(7.5)
          .fillColor(PDF_COLORS.muted)
          .text(section.subtitle, 40, this.y, { width: PDF_CONTENT_WIDTH });
        this.y += 12;
      }
      this.y += 2;
    }

    // Re-draw the header on every page so a long table stays readable.
    const drawHeader = () => {
      fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, headerHeight, PDF_COLORS.primary);
      let x = 40;
      columns.forEach((column, index) => {
        const width = widths[index];
        const align = column.align ?? "left";
        this.doc
          .font(FONT_BOLD)
          .fontSize(7.5)
          .fillColor(PDF_COLORS.white)
          .text(column.header.toUpperCase(), x + 8, this.y + 8, {
            width: width - 16,
            align,
            ellipsis: true,
            lineBreak: false,
          });
        x += width;
      });
      this.y += headerHeight;
    };

    this.ensureSpace(headerHeight + rowHeight);
    drawHeader();

    if (table.rows.length === 0) {
      this.doc
        .font(FONT_REGULAR)
        .fontSize(9)
        .fillColor(PDF_COLORS.muted)
        .text("No data available for the selected period.", 48, this.y + 8, {
          width: PDF_CONTENT_WIDTH - 16,
        });
      this.y += rowHeight + 4;
    }

    for (let index = 0; index < table.rows.length; index++) {
      const row = table.rows[index];
      this.ensureSpace(rowHeight);
      if (this.y + rowHeight > BOTTOM_LIMIT) {
        this.doc.addPage();
        this.y = PDF_MARGIN;
        this.drawContinuationHeader();
        drawHeader();
      }

      if (row.kind === "total") {
        fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, rowHeight, PDF_COLORS.primary);
      } else if (row.kind === "subtotal") {
        fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, rowHeight, PDF_COLORS.stripe);
        this.doc.strokeColor(PDF_COLORS.border).lineWidth(0.5);
        this.doc.moveTo(40, this.y + 0.25).lineTo(40 + PDF_CONTENT_WIDTH, this.y + 0.25).stroke();
      } else if (index % 2 === 0) {
        fillRect(this.doc, 40, this.y, PDF_CONTENT_WIDTH, rowHeight, PDF_COLORS.stripe);
      }

      let x = 40;
      columns.forEach((column, columnIndex) => {
        const width = widths[columnIndex];
        const text = cellText(row.cells[columnIndex]);
        this.doc
          .font(fontFor(column, row))
          .fontSize(8.5)
          .fillColor(textColorFor(row, column))
          .text(text || " ", x + 8, this.y + 6, {
            width: width - 16,
            align: column.align ?? "left",
            ellipsis: true,
            lineBreak: false,
          });
        x += width;
      });

      this.y += rowHeight;

      if (row.kind === "data") {
        this.doc.strokeColor(PDF_COLORS.border).lineWidth(0.25);
        this.doc
          .moveTo(40, this.y)
          .lineTo(40 + PDF_CONTENT_WIDTH, this.y)
          .stroke(PDF_COLORS.border);
      }
    }

    this.y += 20;
  }

  private stampFooters(): void {
    const range = this.doc.bufferedPageRange();
    const total = range.count;
    for (let i = range.start; i < range.start + total; i++) {
      this.doc.switchToPage(i);
      const y = A4.height - PDF_MARGIN - 20;
      this.doc
        .strokeColor(PDF_COLORS.border)
        .lineWidth(0.5)
        .moveTo(40, y - 6)
        .lineTo(40 + PDF_CONTENT_WIDTH, y - 6)
        .stroke(PDF_COLORS.border);
      this.doc.font(FONT_REGULAR).fontSize(7).fillColor(PDF_COLORS.muted);
      this.doc.text(this.options.branding.name, 40, y, {
        width: PDF_CONTENT_WIDTH / 2,
        ellipsis: true,
      });
      this.doc.text(`Page ${i - range.start + 1} of ${total}`, 40 + PDF_CONTENT_WIDTH / 2, y, {
        width: PDF_CONTENT_WIDTH / 4,
        align: "center",
      });
      this.doc.text(`Generated ${formatTimestamp(this.options.generatedAt, this.options.timezone)}`, 40, y, {
        width: PDF_CONTENT_WIDTH,
        align: "right",
      });
      this.doc.font(FONT_REGULAR).fontSize(6.5).fillColor(PDF_COLORS.muted);
      this.doc.text(
        "Generated by Church Financier — Executive Financial Suite",
        40,
        y + 9,
        { width: PDF_CONTENT_WIDTH, align: "center" }
      );
    }
  }

  async render(): Promise<Buffer> {
    const { branding } = this.options;

    const headerBottom = await drawOrgHeader(this.doc, branding, {
      width: PDF_CONTENT_WIDTH,
      y: PDF_MARGIN,
    });
    this.y = headerBottom + 18;
    this.drawTitleBlock();

    const hasData =
      (this.options.sections ?? []).some((section) => section.rows.length > 0) ||
      (this.options.blocks ?? []).some((block) => block.rows.length > 0);

    if (!hasData) {
      this.doc
        .font(FONT_REGULAR)
        .fontSize(10)
        .fillColor(PDF_COLORS.muted)
        .text(
          this.options.emptyMessage ?? "No transactions were recorded for the selected period.",
          40,
          this.y,
          { width: PDF_CONTENT_WIDTH, align: "center" }
        );
      this.y += 24;
    }

    for (const section of this.options.sections ?? []) {
      if (section.rows.length === 0) continue;
      this.drawTable({ columns: section.columns, rows: section.rows }, section);
    }

    for (const block of this.options.blocks ?? []) {
      this.drawBlock(block);
    }

    this.stampFooters();

    // Subscribe before end() so the 'end' event is never missed.
    const finished = new Promise<void>((resolve, reject) => {
      this.doc.once("end", () => resolve());
      this.doc.once("error", reject);
    });
    this.doc.end();
    await finished;

    return Buffer.concat(this.chunks);
  }
}

export { toMajorUnits, toBigInt };
