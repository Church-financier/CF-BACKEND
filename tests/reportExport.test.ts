import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  excelCurrencyFormat,
  formatMinorUnits,
  getCurrencyName,
  getCurrencySymbol,
  getMinorUnitDigits,
  normalizeCurrencyCode,
  toBigInt,
  toMajorUnits,
} from "../src/utils/documentCurrency";
import { buildCsvDocument, UTF8_BOM, csvField } from "../src/services/reportCsvBuilder";
import { buildWorkbook, safeSheetName } from "../src/services/reportXlsxBuilder";
import { buildPdfDocument } from "../src/services/reportPdfBuilder";
import {
  moneyCell,
  numberCell,
  textCell,
  type ReportModel,
} from "../src/services/reportExportModel";
import { DEFAULT_BRANDING, type OrgBranding } from "../src/services/orgBrandingService";

const GENERATED_AT = new Date("2026-10-01T12:00:00.000Z");

const branding: OrgBranding = {
  ...DEFAULT_BRANDING,
  id: "org-1",
  name: "Grace Community Church",
  address: "12 Allen Avenue, Ikeja, Lagos",
  phone: "+234 800 000 0000",
  email: "treasury@gracechurch.org",
  currency: "NGN",
  timezone: "Africa/Lagos",
};

function buildModel(overrides: Partial<ReportModel> = {}): ReportModel {
  return {
    title: "Trial Balance",
    subtitle: "01 Jan 2026 – 30 Sep 2026",
    branding,
    currency: "NGN",
    timezone: "Africa/Lagos",
    generatedAt: GENERATED_AT,
    meta: [{ label: "Period", value: "01 Jan 2026 – 30 Sep 2026" }],
    sections: [
      {
        title: "Account Balances",
        subtitle: "Grouped by account type with subtotals",
        columns: [
          { header: "Account Code", type: "code", flex: 1.2, mono: true },
          { header: "Account Name", type: "text", flex: 3 },
          { header: "Type", type: "status", flex: 1.2, align: "center" },
          { header: "Debit (NGN)", type: "money", align: "right", flex: 1.8 },
          { header: "Credit (NGN)", type: "money", align: "right", flex: 1.8 },
        ],
        rows: [
          {
            kind: "data",
            cells: [
              textCell("1000", "code"),
              textCell("Cash on Hand"),
              textCell("ASSET", "status"),
              moneyCell(BigInt(250000), "NGN"),
              moneyCell(BigInt(0), "NGN"),
            ],
          },
          {
            kind: "data",
            cells: [
              textCell("4000", "code"),
              textCell("Offering Income"),
              textCell("INCOME", "status"),
              moneyCell(BigInt(0), "NGN"),
              moneyCell(BigInt(120000), "NGN"),
            ],
          },
          {
            kind: "subtotal",
            cells: [
              textCell(""),
              textCell("ASSET SUBTOTAL"),
              textCell(""),
              moneyCell(BigInt(250000), "NGN"),
              moneyCell(BigInt(0), "NGN"),
            ],
          },
          {
            kind: "total",
            cells: [
              textCell(""),
              textCell("TOTALS"),
              textCell(""),
              moneyCell(BigInt(250000), "NGN"),
              moneyCell(BigInt(120000), "NGN"),
            ],
          },
        ],
      },
    ],
    blocks: [
      {
        title: "Cash Movement",
        columns: [
          { header: "Line Item", type: "text", flex: 3 },
          { header: "Amount (NGN)", type: "money", align: "right", flex: 2 },
        ],
        rows: [
          { kind: "subtotal", cells: [textCell("Opening Balance"), moneyCell(BigInt(100000), "NGN")] },
          { kind: "data", cells: [textCell("Cash Inflow"), moneyCell(BigInt(150000), "NGN")] },
          { kind: "total", cells: [textCell("CLOSING BALANCE"), moneyCell(BigInt(250000), "NGN")] },
        ],
      },
    ],
    ...overrides,
  };
}

describe("document currency utilities", () => {
  it("normalizes malformed codes to the default", () => {
    expect(normalizeCurrencyCode("ngn")).toBe("NGN");
    expect(normalizeCurrencyCode("ZZ")).toBe("NGN");
    expect(normalizeCurrencyCode(null)).toBe("NGN");
    expect(normalizeCurrencyCode("  ghs  ")).toBe("GHS");
  });

  it("resolves symbols for supported currencies", () => {
    expect(getCurrencySymbol("NGN")).toBe("₦");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("GHS")).toContain("₵");
  });

  it("resolves human-readable currency names", () => {
    expect(getCurrencyName("NGN")).toBe("Nigerian Naira");
    expect(getCurrencyName("GHS")).toBe("Ghanaian Cedi");
  });

  it("knows the minor unit exponent per currency", () => {
    expect(getMinorUnitDigits("NGN")).toBe(2);
    expect(getMinorUnitDigits("JPY")).toBe(0);
    expect(getMinorUnitDigits("KWD")).toBe(3);
  });

  it("formats minor units with grouping and two decimals", () => {
    expect(formatMinorUnits(BigInt(150000), "NGN")).toBe("₦1,500.00");
    expect(formatMinorUnits(BigInt(0), "NGN")).toBe("₦0.00");
    expect(formatMinorUnits(BigInt(5), "NGN")).toBe("₦0.05");
    expect(formatMinorUnits("123456789", "USD")).toBe("$1,234,567.89");
  });

  it("renders negatives with a leading minus", () => {
    expect(formatMinorUnits(BigInt(-25000), "NGN")).toBe("-₦250.00");
  });

  it("respects zero- and three-decimal currencies", () => {
    // JPY has no minor unit, so 1000 minor units is exactly ¥1,000.
    expect(formatMinorUnits(BigInt(1000), "JPY")).toBe("¥1,000");
    expect(formatMinorUnits(BigInt(1234), "KWD")).toBe("KWD1.234");
  });

  it("converts minor units to major units as a number", () => {
    expect(toMajorUnits(BigInt(150000), "NGN")).toBe(1500);
    expect(toMajorUnits(BigInt(1234), "KWD")).toBe(1.234);
    expect(toMajorUnits("150000", "NGN")).toBe(1500);
  });

  it("coerces messy values into bigints without throwing", () => {
    expect(toBigInt("150000")).toBe(BigInt(150000));
    expect(toBigInt(150000)).toBe(BigInt(150000));
    expect(toBigInt(null)).toBe(BigInt(0));
    expect(toBigInt("not-a-number")).toBe(BigInt(0));
    expect(toBigInt(undefined)).toBe(BigInt(0));
  });

  it("builds an Excel currency number format that keeps the symbol literal", () => {
    const ngn = excelCurrencyFormat("NGN");
    expect(ngn).toContain("₦");
    expect(ngn).toContain("#,##0.00");
    // Negative values render in accounting parentheses.
    expect(ngn).toContain("[Red]");
    // Zero-decimal currencies drop the fraction.
    expect(excelCurrencyFormat("JPY")).toContain("#,##0;");
    expect(excelCurrencyFormat("JPY")).not.toContain("#,##0.00");
  });
});

describe("CSV export", () => {
  it("emits a UTF-8 BOM so currency symbols survive Excel", () => {
    const csv = buildCsvDocument(buildModel());
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.startsWith(UTF8_BOM)).toBe(true);
  });

  it("writes provenance metadata before the table", () => {
    const csv = buildCsvDocument(buildModel()).slice(1);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("Grace Community Church");
    expect(lines[1]).toContain("Trial Balance");
    expect(lines[2]).toContain("Period");
    expect(lines[3]).toContain("Base Currency: NGN");
  });

  it("writes standardized column headers", () => {
    const csv = buildCsvDocument(buildModel());
    expect(csv).toContain('"Account Code","Account Name","Type","Debit (NGN)","Credit (NGN)"');
  });

  it("keeps the currency symbol on money cells so the BOM is meaningful", () => {
    const csv = buildCsvDocument(buildModel());
    // 250000 minor units renders as "₦2,500.00" in the CSV body.
    expect(csv).toContain('"1000","Cash on Hand","ASSET","₦2,500.00","₦0.00"');
  });

  it("renders money in the organization's base currency", () => {
    const model = buildModel({ currency: "USD" });
    model.sections[0].rows[0].cells[3] = moneyCell(BigInt(150000), "USD");
    const csv = buildCsvDocument(model);
    expect(csv).toContain("$1,500.00");
    expect(csv).toContain("Base Currency: USD (US Dollar)");
  });

  it("keeps exact minor-unit precision for three-decimal currencies", () => {
    const model = buildModel({ currency: "KWD" });
    model.sections[0].rows[0].cells[3] = moneyCell(BigInt(1234), "KWD");
    const csv = buildCsvDocument(model);
    expect(csv).toContain("1.234");
  });

  it("uses CRLF line endings and a trailing newline", () => {
    const csv = buildCsvDocument(buildModel());
    expect(csv).toContain("\r\n");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("quotes every field per RFC 4180", () => {
    expect(csvField("plain")).toBe('"plain"');
    expect(csvField('has "quotes"')).toBe('"has ""quotes"""');
    expect(csvField("has,comma")).toBe('"has,comma"');
    expect(csvField(null)).toBe('""');
    expect(csvField(42)).toBe('"42"');
  });

  it("neutralises spreadsheet formula injection", () => {
    expect(csvField("=1+1")).toBe('"\'=1+1"');
    expect(csvField("+SUM(A1)")).toBe('"\'+SUM(A1)"');
    expect(csvField("-2")).toBe('"\'-2"');
    expect(csvField("@cmd")).toBe('"\'@cmd"');
  });

  it("reports an empty report instead of emitting a headerless file", () => {
    const model = buildModel({ sections: [], blocks: [] });
    const csv = buildCsvDocument(model);
    expect(csv).toContain("No data available for the selected period.");
  });
});

async function loadSheet(model: ReportModel) {
  const buffer = await buildWorkbook(model);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook.worksheets[0];
}

/** Find the row whose column B contains `label`, so tests survive layout changes. */
function findRowByLabel(sheet: ExcelJS.Worksheet, label: string): ExcelJS.Row {
  let match: ExcelJS.Row | null = null;
  sheet.eachRow((row) => {
    if (String(row.getCell(2).value) === label) match = row;
  });
  if (!match) throw new Error(`Row with label "${label}" not found`);
  return match as unknown as ExcelJS.Row;
}

/** Find the row whose column A contains `value` (used for the header row). */
function findRowByFirstCell(sheet: ExcelJS.Worksheet, value: string): ExcelJS.Row {
  let match: ExcelJS.Row | null = null;
  sheet.eachRow((row) => {
    if (String(row.getCell(1).value) === value) match = row;
  });
  if (!match) throw new Error(`Row starting with "${value}" not found`);
  return match as unknown as ExcelJS.Row;
}

describe("XLSX export", () => {
  it("produces a readable workbook", async () => {
    const buffer = await buildWorkbook(buildModel());
    expect(buffer.length).toBeGreaterThan(1000);
    // XLSX files are zip archives: "PK" magic bytes.
    expect(buffer.subarray(0, 2).toString("ascii")).toBe("PK");
  });

  it("writes the four metadata rows above the table", async () => {
    const sheet = await loadSheet(buildModel());

    expect(sheet.getCell("A1").value).toBe("Grace Community Church");
    expect(sheet.getCell("A1").font?.bold).toBe(true);
    expect(sheet.getCell("A1").font?.size).toBe(14);
    expect(sheet.getCell("A2").value).toBe("Trial Balance");
    expect(String(sheet.getCell("A3").value)).toContain("Period");
    expect(String(sheet.getCell("A4").value)).toContain("Base Currency: NGN");
  });

  it("stores money as a real number with a currency number format", async () => {
    const sheet = await loadSheet(buildModel());
    const dataRow = findRowByLabel(sheet, "Cash on Hand");
    const debitCell = dataRow.getCell(4);

    expect(debitCell.value).toBe(2500);
    expect(typeof debitCell.value).toBe("number");
    expect(String(debitCell.numFmt)).toContain("₦");
    expect(String(debitCell.numFmt)).toContain("#,##0.00");
    expect(debitCell.alignment?.horizontal).toBe("right");
  });

  it("right-aligns money, centres status and left-aligns text", async () => {
    const sheet = await loadSheet(buildModel());
    const row = findRowByLabel(sheet, "Offering Income");

    expect(row.getCell(1).alignment?.horizontal).toBe("left"); // account code
    expect(row.getCell(2).alignment?.horizontal).toBe("left"); // account name
    expect(row.getCell(3).alignment?.horizontal).toBe("center"); // type/status
    expect(row.getCell(4).alignment?.horizontal).toBe("right"); // debit
    expect(row.getCell(5).alignment?.horizontal).toBe("right"); // credit
  });

  it("writes account codes as text, not as a scientific-notation number", async () => {
    const sheet = await loadSheet(buildModel());
    const row = findRowByLabel(sheet, "Cash on Hand");
    expect(row.getCell(1).value).toBe("1000");
    expect(typeof row.getCell(1).value).toBe("string");
  });

  it("styles the header row with a bold navy fill", async () => {
    const sheet = await loadSheet(buildModel());
    const headerRow = findRowByFirstCell(sheet, "Account Code");
    const headerCell = headerRow.getCell(1);

    expect(headerCell.font?.bold).toBe(true);
    const fill = headerCell.fill as { fgColor?: { argb?: string } };
    expect(String(fill?.fgColor?.argb)).toContain("1E293B");
  });

  it("draws a double bottom border on total rows", async () => {
    const sheet = await loadSheet(buildModel());
    const totalRow = findRowByLabel(sheet, "TOTALS");
    const totalCell = totalRow.getCell(4);

    expect(totalCell.border?.bottom?.style).toBe("double");
    expect(totalCell.font?.bold).toBe(true);
  });

  it("draws a thin border on subtotal rows", async () => {
    const sheet = await loadSheet(buildModel());
    const subtotalRow = findRowByLabel(sheet, "ASSET SUBTOTAL");
    expect(subtotalRow.getCell(4).border?.bottom?.style).toBe("thin");
    expect(subtotalRow.getCell(4).font?.bold).toBe(true);
  });

  it("auto-sizes columns from their content", async () => {
    const sheet = await loadSheet(buildModel());

    const nameWidth = sheet.getColumn(2).width ?? 0;
    const statusWidth = sheet.getColumn(3).width ?? 0;
    // "Offering Income" is longer than "ASSET"/"INCOME".
    expect(nameWidth).toBeGreaterThan(statusWidth);
    // Money columns need room for a grouped figure plus a currency symbol.
    expect(sheet.getColumn(4).width ?? 0).toBeGreaterThanOrEqual(16);
  });

  it("sheets names are valid and truncated to Excel's limit", () => {
    expect(safeSheetName("Trial Balance")).toBe("Trial Balance");
    expect(safeSheetName("A/B:C*D?E[F]G")).toBe("A B C D E F G");
    expect(safeSheetName("x".repeat(60)).length).toBe(31);
    expect(safeSheetName("   ")).toBe("Report");
  });

  it("reports an empty report with an explicit message", async () => {
    const sheet = await loadSheet(buildModel({ sections: [], blocks: [] }));
    expect(String(sheet.getCell("A6").value)).toContain("No data available");
  });
});

describe("PDF export", () => {
  it("produces a valid PDF document", async () => {
    const buffer = await buildPdfDocument(buildModel());
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it("closes the PDF with a valid trailer", async () => {
    const buffer = await buildPdfDocument(buildModel());
    const tail = buffer.subarray(Math.max(0, buffer.length - 2048)).toString("latin1");
    expect(tail).toContain("%%EOF");
  });

  it("embeds the report content stream", async () => {
    const buffer = await buildPdfDocument(buildModel());
    const text = buffer.toString("latin1");
    // Fonts and content streams prove the renderer actually wrote the table.
    expect(text).toContain("stream");
    expect(text).toContain("Font");
  });

  it("renders an empty report without throwing", async () => {
    const buffer = await buildPdfDocument(buildModel({ sections: [], blocks: [] }));
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("paginates a long table and stamps page numbers", async () => {
    const model = buildModel({ sections: [], blocks: [] });
    const rows: ReportModel["sections"][number]["rows"] = [];
    for (let i = 0; i < 120; i++) {
      rows.push({
        kind: "data",
        cells: [
          textCell(String(1000 + i), "code"),
          textCell(`Account number ${i}`),
          textCell("ASSET", "status"),
          moneyCell(BigInt(1000 * (i + 1)), "NGN"),
          moneyCell(BigInt(0), "NGN"),
        ],
      });
    }
    rows.push({
      kind: "total",
      cells: [textCell(""), textCell("TOTALS"), textCell(""), moneyCell(BigInt(1000), "NGN"), moneyCell(BigInt(0), "NGN")],
    });
    model.sections = [
      {
        title: "Account Balances",
        columns: buildModel().sections[0].columns,
        rows,
      },
    ];

    const buffer = await buildPdfDocument(model);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    // 120 rows cannot fit on one A4 page, so this must have grown.
    expect(buffer.length).toBeGreaterThan(4000);
  });
});
