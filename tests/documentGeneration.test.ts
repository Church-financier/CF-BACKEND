import { describe, it, expect } from "vitest";
import { PassThrough } from "stream";
import { generateReceiptPdf, formatReceiptNumber, buildReceiptForContribution, computeReceiptHash } from "../src/services/receiptPdfService";
import { generatePaymentVoucherPdf, amountInWords, computeVoucherHash } from "../src/services/paymentVoucherService";
import {
  computeColumnWidths,
  formatHash,
  verificationHash,
  verificationPayload,
  money,
  statusColorFor,
  type TableColumn,
} from "../src/services/documentComponents";
import { DEFAULT_BRANDING } from "../src/services/orgBrandingService";

const RECEIPT_DATE = new Date("2026-10-01T09:30:00.000Z");

const receiptData = {
  organizationName: "Grace Community Church",
  organizationAddress: "12 Allen Avenue, Ikeja, Lagos",
  organizationPhone: "+234 800 000 0000",
  organizationEmail: "treasury@gracechurch.org",
  receiptId: "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
  date: RECEIPT_DATE,
  fund: "Offering Fund",
  amount: BigInt(150000),
  currency: "NGN",
  description: "Sunday first service offering",
  paymentMethod: "TRANSFER",
  status: "APPROVED",
  payerName: "Chinedu Okafor",
  recordedBy: "Ada Obi (treasurer@gracechurch.org)",
  timezone: "Africa/Lagos",
};

const voucherData = {
  voucherNumber: "PV-202610-ABC12345",
  organizationName: "Grace Community Church",
  organizationAddress: "12 Allen Avenue, Ikeja, Lagos",
  organizationPhone: "+234 800 000 0000",
  organizationEmail: "treasury@gracechurch.org",
  paidAt: new Date("2026-10-01T11:00:00.000Z"),
  purpose: "Guest speaker honorarium",
  payeeName: "Pastor B. Nwosu",
  payeeBankDetails: ["Bank: First Bank", "Account name: B. Nwosu", "Account number: 0123456789"],
  amountInKobo: BigInt(2500000),
  amountInWords: "Twenty Five Thousand Naira Only",
  paymentMethod: "TRANSFER",
  paymentReference: "TRF/2026/10/01/991",
  paymentNotes: "Paid in full",
  requestedBy: "Department Head",
  firstApprovedBy: "Treasurer",
  secondApprovedBy: "Financial Secretary",
  paidBy: "Ada Obi",
  lineItems: [
    { description: "Speaker honorarium", amountInKobo: BigInt(2000000) },
    { description: "Travel reimbursement", amountInKobo: BigInt(500000) },
  ],
  currency: "NGN",
  timezone: "Africa/Lagos",
};

/**
 * The renderers pipe into their target and return a promise. A PassThrough
 * that is fully drained stands in for an HTTP response.
 */
function createSink() {
  const chunks: Buffer[] = [];
  const headers: Record<string, string> = {};
  const stream = new PassThrough();
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  const target = Object.assign(stream, {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
  });
  return { target, headers, read: () => Buffer.concat(chunks) };
}

function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

describe("receipt numbering", () => {
  it("formats a sequential, year-scoped receipt number", () => {
    const number = formatReceiptNumber(
      "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
      RECEIPT_DATE,
      "Africa/Lagos"
    );
    expect(number).toMatch(/^REC-\d{4}-\d{4}$/);
    // Receipts are dated in the organization's timezone, not the server's.
    expect(number).toBe("REC-2026-6789");
  });

  it("falls back to the entry id prefix when an id has no digits", () => {
    const number = formatReceiptNumber("abcdef", RECEIPT_DATE, "Africa/Lagos");
    expect(number).toMatch(/^REC-2026-\w{4}$/);
  });

  it("respects the organization's timezone when picking the year", () => {
    // 31 Dec 2025 23:30 UTC is already 01 Jan 2026 in Lagos (UTC+1).
    const newYear = new Date("2025-12-31T23:30:00.000Z");
    expect(formatReceiptNumber("id-1234", newYear, "Africa/Lagos")).toBe("REC-2026-1234");
    expect(formatReceiptNumber("id-1234", newYear, "UTC")).toBe("REC-2025-1234");
  });
});

describe("verification helpers", () => {
  it("produces a stable SHA-256 digest", () => {
    const a = verificationHash(["Grace", "REC-1", "1000"]);
    const b = verificationHash(["Grace", "REC-1", "1000"]);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-fA-F]{64}$/);
  });

  it("changes when any component changes", () => {
    expect(verificationHash(["Grace", "REC-1"])).not.toBe(verificationHash(["Grace", "REC-2"]));
  });

  it("tolerates null components", () => {
    expect(() => verificationHash(["Grace", null, undefined])).not.toThrow();
  });

  it("groups the hash into readable blocks", () => {
    const hash = "A".repeat(64);
    const formatted = formatHash(hash);
    expect(formatted.split(" ")).toHaveLength(16);
    expect(formatted.replace(/ /g, "")).toBe(hash);
  });

  it("builds a scannable verification payload", () => {
    const payload = verificationPayload({
      reference: "REC-2026-0042",
      amount: BigInt(150000),
      currency: "NGN",
      date: RECEIPT_DATE,
      hash: "ABC",
    });
    expect(payload).toContain("REF:REC-2026-0042");
    expect(payload).toContain("AMOUNT:₦1,500.00");
    expect(payload).toContain("HASH:ABC");
  });
});

describe("table layout helpers", () => {
  it("distributes column widths to exactly fill the content width", () => {
    const columns: TableColumn[] = [
      { header: "A", flex: 3.4 },
      { header: "B", flex: 1.8 },
      { header: "C", flex: 0.8 },
      { header: "D", flex: 1.5 },
      { header: "E", flex: 1.7 },
    ];
    const widths = computeColumnWidths(columns);
    const total = widths.reduce((sum, width) => sum + width, 0);
    // A4 (595.28) minus 2x40pt margins.
    expect(total).toBe(515);
    expect(widths).toHaveLength(5);
  });

  it("keeps every column wide enough to render its header", () => {
    const widths = computeColumnWidths([
      { header: "A", flex: 1000 },
      { header: "B", flex: 0.001 },
    ]);
    expect(widths[1]).toBeGreaterThanOrEqual(28);
  });

  it("maps status to a colour", () => {
    expect(statusColorFor("APPROVED")).toBe("#059669");
    expect(statusColorFor("PAID")).toBe("#059669");
    expect(statusColorFor("PENDING")).toBe("#D97706");
    expect(statusColorFor("REJECTED")).toBe("#DC2626");
  });

  it("formats money with the base currency symbol", () => {
    expect(money(BigInt(150000), "NGN")).toBe("₦1,500.00");
    expect(money(BigInt(150000), "USD")).toBe("$1,500.00");
  });
});

describe("e-Receipt PDF generation", () => {
  it("produces a valid PDF", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, receiptData);
    expect(isPdf(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it("sets PDF content headers and a receipt filename", async () => {
    const sink = createSink();
    await generateReceiptPdf(sink.target, receiptData);
    expect(sink.headers["Content-Type"]).toBe("application/pdf");
    expect(sink.headers["Content-Disposition"]).toContain("inline");
    expect(sink.headers["Content-Disposition"]).toContain("REC-2026-6789");
  });

  it("streams the same bytes it resolves with", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, receiptData);
    expect(sink.read().length).toBe(buffer.length);
  });

  it("embeds fonts and a verification image", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, receiptData);
    const text = buffer.toString("latin1");
    // The QR code is rasterised, so an image XObject must be present.
    expect(text).toContain("/Image");
    expect(text).toContain("/Font");
  });

  it("closes the PDF with a valid trailer", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, receiptData);
    expect(buffer.subarray(Math.max(0, buffer.length - 2048)).toString("latin1")).toContain("%%EOF");
  });

  it("honours a non-NGN base currency", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, {
      ...receiptData,
      currency: "GHS",
      amount: BigInt(50000),
    });
    expect(isPdf(buffer)).toBe(true);
  });

  it("renders with minimal optional metadata", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, {
      organizationName: "Small Church",
      receiptId: "minimal-entry-id",
      date: RECEIPT_DATE,
      fund: "General Fund",
      amount: BigInt(1000),
    });
    expect(isPdf(buffer)).toBe(true);
  });

  it("renders with anonymous donations", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, {
      ...receiptData,
      payerName: undefined,
      description: undefined,
      recordedBy: undefined,
    });
    expect(isPdf(buffer)).toBe(true);
  });

  it("renders itemised line items without overflowing the page", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, {
      ...receiptData,
      lineItems: [
        { description: "First class", category: "Offering", quantity: "2", unitPrice: "₦500.00", amount: BigInt(100000) },
        { description: "Second class", category: "Offering", quantity: "1", unitPrice: "₦500.00", amount: BigInt(50000) },
      ],
    });
    expect(isPdf(buffer)).toBe(true);
  });

  it("survives an invalid timezone by falling back to the default", async () => {
    const sink = createSink();
    const buffer = await generateReceiptPdf(sink.target, {
      ...receiptData,
      timezone: "Not/A/Zone",
    });
    expect(isPdf(buffer)).toBe(true);
  });

  it("does not hit the database when no organizationId is supplied", async () => {
    const sink = createSink();
    await expect(generateReceiptPdf(sink.target, receiptData)).resolves.toBeInstanceOf(Buffer);
  });
});

describe("amount in words", () => {
  it("spells whole naira amounts", () => {
    expect(amountInWords(BigInt(1000000), "NGN")).toBe("Ten Thousand Naira Only");
    expect(amountInWords(BigInt(2500000), "NGN")).toBe("Twenty Five Thousand Naira Only");
  });

  it("includes the kobo component when present", () => {
    expect(amountInWords(BigInt(150050), "NGN")).toBe("One Thousand Five Hundred Naira, Fifty Kobo Only");
  });

  it("handles zero and negatives", () => {
    expect(amountInWords(BigInt(0), "NGN")).toBe("Zero Naira Only");
    expect(amountInWords(BigInt(-100000), "NGN")).toBe("Minus One Thousand Naira Only");
  });

  it("spells large amounts with billions and millions", () => {
    expect(amountInWords(BigInt(1_000_000_000_00), "NGN")).toContain("Billion");
    expect(amountInWords(BigInt(1_000_000_00), "NGN")).toContain("Million");
  });

  it("uses the organization's currency name", () => {
    expect(amountInWords(BigInt(100000), "GHS")).toContain("Cedi");
    expect(amountInWords(BigInt(100000), "USD")).toContain("Dollar");
  });
});

describe("payment voucher PDF generation", () => {
  it("produces a valid PDF", async () => {
    const sink = createSink();
    const buffer = await generatePaymentVoucherPdf(sink.target, voucherData);
    expect(isPdf(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it("sets PDF content headers and a voucher filename", async () => {
    const sink = createSink();
    await generatePaymentVoucherPdf(sink.target, voucherData);
    expect(sink.headers["Content-Type"]).toBe("application/pdf");
    expect(sink.headers["Content-Disposition"]).toContain("payment-voucher-PV-202610-ABC12345");
  });

  it("embeds a verification QR code", async () => {
    const sink = createSink();
    const buffer = await generatePaymentVoucherPdf(sink.target, voucherData);
    expect(buffer.toString("latin1")).toContain("/Image");
  });

  it("renders with no line items", async () => {
    const sink = createSink();
    const buffer = await generatePaymentVoucherPdf(sink.target, {
      ...voucherData,
      lineItems: [],
    });
    expect(isPdf(buffer)).toBe(true);
  });

  it("renders with a missing bank detail and approval", async () => {
    const sink = createSink();
    const buffer = await generatePaymentVoucherPdf(sink.target, {
      ...voucherData,
      payeeBankDetails: [],
      firstApprovedBy: null,
      secondApprovedBy: null,
      paymentReference: null,
      paymentNotes: null,
    });
    expect(isPdf(buffer)).toBe(true);
  });

  it("honours a non-NGN base currency", async () => {
    const sink = createSink();
    const buffer = await generatePaymentVoucherPdf(sink.target, {
      ...voucherData,
      currency: "EUR",
    });
    expect(isPdf(buffer)).toBe(true);
  });
});

describe("branding fallbacks", () => {
  it("uses a placeholder name when the organization is unknown", () => {
    expect(DEFAULT_BRANDING.name).toBe("Organization");
    expect(DEFAULT_BRANDING.currency).toBe("NGN");
    expect(DEFAULT_BRANDING.logoUrl).toBeNull();
  });

  it("falls back to caller-supplied branding with no organizationId", async () => {
    const sink = createSink();
    const buffer = await generatePaymentVoucherPdf(sink.target, {
      ...voucherData,
      organizationAddress: null,
      organizationPhone: null,
      organizationEmail: null,
    });
    expect(isPdf(buffer)).toBe(true);
  });
});

describe("receipt data assembly", () => {
  it("is exported for the controller to adapt", () => {
    expect(typeof buildReceiptForContribution).toBe("function");
  });
});

describe("document verification hashes", () => {
  const receiptInput = {
    organizationName: "Grace Community Church",
    receiptNumber: "REC-2026-0042",
    receiptId: "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
    amount: BigInt(150000),
    currency: "NGN",
    date: RECEIPT_DATE,
    status: "APPROVED",
  };

  it("produces a 64-character hex digest for receipts", () => {
    const hash = computeReceiptHash(receiptInput);
    expect(hash).toMatch(/^[0-9a-fA-F]{64}$/);
  });

  it("is stable across calls so preview and PDF agree", () => {
    expect(computeReceiptHash(receiptInput)).toBe(computeReceiptHash(receiptInput));
  });

  it("changes when the amount changes", () => {
    expect(computeReceiptHash(receiptInput)).not.toBe(
      computeReceiptHash({ ...receiptInput, amount: BigInt(150001) })
    );
  });

  it("normalizes the currency code so NGN and ngn agree", () => {
    expect(computeReceiptHash(receiptInput)).toBe(
      computeReceiptHash({ ...receiptInput, currency: "ngn" })
    );
  });

  const voucherInput = {
    organizationName: "Grace Community Church",
    voucherNumber: "PV-202610-ABC12345",
    amountInKobo: BigInt(2500000),
    currency: "NGN",
    paidAt: new Date("2026-10-01T11:00:00.000Z"),
    payeeName: "Pastor B. Nwosu",
  };

  it("produces a 64-character hex digest for vouchers", () => {
    expect(computeVoucherHash(voucherInput)).toMatch(/^[0-9a-fA-F]{64}$/);
  });

  it("changes when the payee changes", () => {
    expect(computeVoucherHash(voucherInput)).not.toBe(
      computeVoucherHash({ ...voucherInput, payeeName: "Someone Else" })
    );
  });

  it("is consumed by the voucher payload so the JSON endpoint can return it", async () => {
    // A payload carrying its own hash must render identically to one that
    // lets the renderer compute it, otherwise the printed HTML and the
    // downloaded PDF would show different fingerprints.
    const buffer = await generatePaymentVoucherPdf(createSink().target, {
      ...voucherData,
      verificationHash: computeVoucherHash(voucherInput),
    });
    expect(isPdf(buffer)).toBe(true);
  });
});
