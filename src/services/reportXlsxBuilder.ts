import ExcelJS from "exceljs";
import { excelCurrencyFormat, getCurrencyName, normalizeCurrencyCode } from "../utils/documentCurrency";
import { formatTimestamp } from "./pdfReportRenderer";
import type { ReportBlock, ReportColumn, ReportModel, ReportRow, ReportRowKind, ReportSection } from "./reportExportModel";

/** Slate palette mirroring the PDF headers so the two look like one product. */
const COLORS = {
  primary: "FF1E293B",
  primaryLight: "FF334155",
  stripe: "FFF8FAFC",
  border: "FFD8DEE7",
  white: "FFFFFFFF",
  muted: "FF64748B",
} as const;

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

/** Excel's double rule, used to close off a summary/total row. */
const DOUBLE_BOTTOM_BORDER: Partial<ExcelJS.Borders> = {
  bottom: { style: "double", color: { argb: COLORS.primary } },
};

const HEADER_ROW_HEIGHT = 26;
const DATA_ROW_HEIGHT = 18;

/** Spreadsheet-safe sheet name: <=31 chars, no []:*?/\ and not blank. */
export function safeSheetName(name: string, fallback = "Report"): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, " ").trim();
  const base = cleaned.length > 0 ? cleaned : fallback;
  return base.slice(0, 31);
}

/**
 * ExcelJS's `Alignment` type declares every field as required, but a partial
 * object is valid at runtime, so build cells through this helper to keep the
 * call sites readable.
 */
function alignment(cell: Partial<ExcelJS.Alignment>): ExcelJS.Alignment {
  return {
    horizontal: cell.horizontal ?? "left",
    vertical: cell.vertical ?? "middle",
    wrapText: cell.wrapText ?? false,
    indent: cell.indent ?? 0,
    readingOrder: cell.readingOrder ?? "ltr",
    textRotation: cell.textRotation ?? 0,
    shrinkToFit: cell.shrinkToFit ?? false,
  };
}

function alignOf(column: ReportColumn): ExcelJS.Alignment {
  if (column.type === "money" || column.type === "number") return alignment({ horizontal: "right" });
  if (column.type === "date" || column.type === "status") return alignment({ horizontal: "center" });
  if (column.align) return alignment({ horizontal: column.align });
  return alignment({ horizontal: "left" });
}

function excelNumberFormat(column: ReportColumn, currency: string): string | undefined {
  if (column.type === "money") return excelCurrencyFormat(currency);
  if (column.type === "number") return "#,##0.##";
  return undefined;
}

/**
 * Width from the widest rendered value, clamped so one long description
 * cannot push every other column off screen.
 */
function widthFor(values: Array<string | number | null | undefined>, minimum: number, maximum: number): number {
  let longest = minimum;
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const length = String(value).length;
    if (length > longest) longest = length;
  }
  return Math.min(maximum, Math.max(minimum, longest + 2));
}

/**
 * Emit the four title rows above the table: organization name (bold 14pt),
 * report title, date range/metadata, and the base currency indicator.
 */
function writeHeaderMetadata(
  sheet: ExcelJS.Worksheet,
  model: ReportModel,
  columnCount: number
): void {
  const lastColumn = Math.max(columnCount, 2);

  const orgRow = sheet.addRow([model.branding.name]);
  sheet.mergeCells(1, 1, 1, lastColumn);
  const orgCell = orgRow.getCell(1);
  orgCell.font = { bold: true, size: 14, color: { argb: COLORS.primary }, name: "Calibri" };
  orgCell.alignment = alignment({ horizontal: "center" });
  orgRow.height = 24;

  const titleRow = sheet.addRow([model.title]);
  sheet.mergeCells(2, 1, 2, lastColumn);
  const titleCell = titleRow.getCell(1);
  titleCell.font = { bold: true, size: 12, color: { argb: COLORS.primaryLight } };
  titleCell.alignment = alignment({ horizontal: "center" });
  titleRow.height = 20;

  const periodRow = sheet.addRow([
    model.meta.length > 0 ? model.meta.map((item) => `${item.label}: ${item.value}`).join("   |   ") : "All dates",
  ]);
  sheet.mergeCells(3, 1, 3, lastColumn);
  const periodCell = periodRow.getCell(1);
  periodCell.font = { size: 10, color: { argb: COLORS.muted } };
  periodCell.alignment = alignment({ horizontal: "center" });

  const currencyCode = normalizeCurrencyCode(model.currency);
  const currencyRow = sheet.addRow([
    `Base Currency: ${currencyCode} (${getCurrencyName(currencyCode)})   |   Generated: ${formatTimestamp(model.generatedAt, model.timezone)}   |   Timezone: ${model.timezone}`,
  ]);
  sheet.mergeCells(4, 1, 4, lastColumn);
  const currencyCell = currencyRow.getCell(1);
  currencyCell.font = { size: 9, italic: true, color: { argb: COLORS.muted } };
  currencyCell.alignment = alignment({ horizontal: "center" });

  sheet.addRow([]);
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, columns: ReportColumn[]): void {
  const row = sheet.getRow(rowNumber);
  row.height = HEADER_ROW_HEIGHT;
  columns.forEach((column, index) => {
    const cell = row.getCell(index + 1);
    cell.font = { bold: true, size: 10, color: { argb: COLORS.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
    cell.alignment = alignment({ horizontal: "center", wrapText: true });
    cell.border = THIN_BORDER;
  });
}

function writeSection(
  sheet: ExcelJS.Worksheet,
  section: ReportSection,
  currency: string,
  startRow: number
): number {
  const columns = section.columns;
  let currentRow = startRow;

  if (section.title) {
    const headingRow = sheet.addRow([section.title]);
    sheet.mergeCells(currentRow, 1, currentRow, Math.max(columns.length, 2));
    const headingCell = headingRow.getCell(1);
    headingCell.font = { bold: true, size: 11, color: { argb: COLORS.primary } };
    headingCell.alignment = alignment({ horizontal: "left" });
    headingRow.height = 20;
    currentRow += 1;
  }

  const headerRow = sheet.addRow(columns.map((column) => column.header));
  styleHeaderRow(sheet, headerRow.number, columns);
  currentRow = headerRow.number + 1;

  const widthSamples: string[][] = columns.map((column) => [column.header]);

  for (const reportRow of section.rows) {
    const isData = reportRow.kind === "data";
    const isTotal = reportRow.kind === "total";
    const isSubtotal = reportRow.kind === "subtotal";

    const row = sheet.addRow(
      reportRow.cells.map((cell, index) => {
        const column = columns[index];
        if (cell.value !== undefined && cell.value !== null && (column?.type === "money" || column?.type === "number")) {
          return cell.value;
        }
        return cell.text;
      })
    );
    row.height = isTotal ? DATA_ROW_HEIGHT + 4 : DATA_ROW_HEIGHT;

    reportRow.cells.forEach((cell, index) => {
      const column = columns[index];
      const target = row.getCell(index + 1);
      target.alignment = alignOf(column ?? { header: "" });
      target.font = {
        bold: isTotal || isSubtotal,
        size: 10,
        color: { argb: isTotal ? COLORS.primary : COLORS.primaryLight },
      };

      const numberFormat = excelNumberFormat(column ?? { header: "" }, currency);
      if (numberFormat && (cell.type === "money" || cell.type === "number")) {
        target.numFmt = numberFormat;
      }

      if (isTotal) {
        target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.stripe } };
        target.border = { ...THIN_BORDER, ...DOUBLE_BOTTOM_BORDER };
      } else if (isSubtotal) {
        target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.stripe } };
        target.border = THIN_BORDER;
      } else {
        target.border = THIN_BORDER;
      }

      if (widthSamples[index]) {
        widthSamples[index].push(cell.type === "money" ? String(cell.value ?? 0) : cell.text);
      }
    });

    currentRow = row.number + 1;
  }

  // Auto-size once every value in the section is known.
  columns.forEach((column, index) => {
    const values = widthSamples[index] ?? [column.header];
    const isMoney = column.type === "money";
    sheet.getColumn(index + 1).width = widthFor(
      values,
      isMoney ? 16 : 12,
      column.type === "text" ? 48 : 24
    );
  });

  return currentRow + 1;
}

function writeBlock(
  sheet: ExcelJS.Worksheet,
  block: ReportBlock,
  currency: string,
  startRow: number
): number {
  let currentRow = startRow;

  if (block.title) {
    const headingRow = sheet.addRow([block.title]);
    sheet.mergeCells(currentRow, 1, currentRow, Math.max(block.columns.length, 2));
    const headingCell = headingRow.getCell(1);
    headingCell.font = { bold: true, size: 11, color: { argb: COLORS.primary } };
    headingRow.height = 20;
    currentRow += 1;
  }

  for (const reportRow of block.rows) {
    const isTotal = reportRow.kind === "total";
    const isSubtotal = reportRow.kind === "subtotal";
    const label = reportRow.cells[0];
    const value = reportRow.cells[1];

    const row = sheet.addRow([
      label?.text ?? "",
      value && value.value !== undefined && value.value !== null ? value.value : value?.text ?? "",
    ]);
    row.height = DATA_ROW_HEIGHT;

    const labelCell = row.getCell(1);
    labelCell.alignment = alignment({ horizontal: "left" });
    labelCell.font = { bold: isTotal || isSubtotal, size: 10, color: { argb: COLORS.primaryLight } };
    labelCell.border = isTotal
      ? { ...THIN_BORDER, ...DOUBLE_BOTTOM_BORDER }
      : THIN_BORDER;
    if (isTotal || isSubtotal) {
      labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.stripe } };
    }

    const valueCell = row.getCell(2);
    valueCell.alignment = alignment({ horizontal: "right" });
    valueCell.font = { bold: true, size: 10, color: { argb: COLORS.primary } };
    valueCell.border = isTotal
      ? { ...THIN_BORDER, ...DOUBLE_BOTTOM_BORDER }
      : THIN_BORDER;
    if (isTotal || isSubtotal) {
      valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.stripe } };
    }
    const numberFormat = excelCurrencyFormat(currency);
    if (value && (value.type === "money" || value.type === "number")) {
      valueCell.numFmt = numberFormat;
    }

    currentRow = row.number + 1;
  }

  sheet.getColumn(1).width = Math.max(sheet.getColumn(1).width ?? 12, 34);
  sheet.getColumn(2).width = 20;

  return currentRow + 1;
}

/**
 * Render a report model to a styled .xlsx workbook.
 *
 * Money cells are written as numbers with an explicit currency number format
 * (e.g. `"₦"#,##0.00`) rather than pre-formatted strings, so Excel, Numbers
 * and Google Sheets can sum, sort and chart them.
 */
export async function buildWorkbook(model: ReportModel): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Church Financier — Executive Financial Suite";
  workbook.lastModifiedBy = "Church Financier";
  workbook.created = model.generatedAt;
  workbook.modified = model.generatedAt;
  workbook.title = `${model.title} — ${model.branding.name}`;

  const sheet = workbook.addWorksheet(safeSheetName(model.title, "Report"), {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  const columnCount = Math.max(
    2,
    ...model.sections.map((section) => section.columns.length),
    ...model.blocks.map((block) => block.columns.length)
  );

  writeHeaderMetadata(sheet, model, columnCount);

  let currentRow = 6;
  const hasContent =
    model.sections.some((section) => section.rows.length > 0) ||
    model.blocks.some((block) => block.rows.length > 0);

  if (!hasContent) {
    const emptyRow = sheet.addRow([model.emptyMessage ?? "No data available for the selected period."]);
    sheet.mergeCells(currentRow, 1, currentRow, columnCount);
    const emptyCell = emptyRow.getCell(1);
    emptyCell.font = { italic: true, size: 10, color: { argb: COLORS.muted } };
    emptyCell.alignment = alignment({ horizontal: "center" });
    currentRow = emptyRow.number + 2;
  }

  for (const section of model.sections) {
    if (section.rows.length === 0) continue;
    currentRow = writeSection(sheet, section, model.currency, currentRow);
  }

  for (const block of model.blocks) {
    if (block.rows.length === 0) continue;
    currentRow = writeBlock(sheet, block, model.currency, currentRow);
  }

  sheet.pageSetup.printTitlesRow = "1:5";
  sheet.headerFooter = {
    oddHeader: `&L&"Calibri,Bold"${model.branding.name}&R&"Calibri"${model.title}`,
    oddFooter: `&LGenerated by Church Financier&CPage &P of &N&R${formatTimestamp(model.generatedAt, model.timezone)}`,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export type { ReportRow, ReportRowKind };
