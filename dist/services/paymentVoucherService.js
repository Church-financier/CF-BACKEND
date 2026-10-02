"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOC_MARGIN = exports.DOC_CONTENT_WIDTH = void 0;
exports.amountInWords = amountInWords;
exports.computeVoucherHash = computeVoucherHash;
exports.generatePaymentVoucherPdf = generatePaymentVoucherPdf;
const documentComponents_1 = require("./documentComponents");
Object.defineProperty(exports, "DOC_MARGIN", { enumerable: true, get: function () { return documentComponents_1.DOC_MARGIN; } });
Object.defineProperty(exports, "DOC_CONTENT_WIDTH", { enumerable: true, get: function () { return documentComponents_1.DOC_CONTENT_WIDTH; } });
const pdfReportRenderer_1 = require("./pdfReportRenderer");
const orgBrandingService_1 = require("./orgBrandingService");
const documentCurrency_1 = require("../utils/documentCurrency");
async function resolveBranding(data, organizationId) {
    if (organizationId) {
        const branding = await (0, orgBrandingService_1.getOrgBranding)(organizationId);
        if (branding.id)
            return branding;
    }
    return {
        id: "",
        name: data.organizationName,
        address: data.organizationAddress ?? null,
        phone: data.organizationPhone ?? null,
        email: data.organizationEmail ?? null,
        logoUrl: data.organizationLogoUrl ?? null,
        currency: (0, documentCurrency_1.normalizeCurrencyCode)(data.currency),
        timezone: data.timezone ?? "Africa/Lagos",
    };
}
const ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function chunkToWords(chunk) {
    const parts = [];
    if (chunk >= 100) {
        parts.push(`${ONES[Math.floor(chunk / 100)]} Hundred`);
        chunk %= 100;
    }
    if (chunk >= 20) {
        parts.push(TENS[Math.floor(chunk / 10)]);
        chunk %= 10;
    }
    if (chunk > 0)
        parts.push(ONES[chunk]);
    return parts.join(" ");
}
/**
 * Currency names used when spelling an amount out.
 * The major unit is the currency name; the minor unit is its subdivision
 * ("Naira" / "Kobo", "CFA Franc" / "Centime", "Dollar" / "Cent").
 */
const MINOR_UNIT_NAMES = {
    NGN: { major: "Naira", minor: "Kobo" },
    USD: { major: "Dollar", minor: "Cent" },
    EUR: { major: "Euro", minor: "Cent" },
    GBP: { major: "Pound", minor: "Penny" },
    GHS: { major: "Cedi", minor: "Pesewa" },
    ZAR: { major: "Rand", minor: "Cent" },
    KES: { major: "Shilling", minor: "Cent" },
    EGP: { major: "Pound", minor: "Piastre" },
    ZMW: { major: "Kwacha", minor: "Ngwee" },
    TZS: { major: "Shilling", minor: "Cent" },
    UGX: { major: "Shilling", minor: "Cent" },
    RWF: { major: "Franc", minor: "Centime" },
    XOF: { major: "CFA Franc", minor: "Centime" },
    XAF: { major: "CFA Franc", minor: "Centime" },
    ETB: { major: "Birr", minor: "Santim" },
    CAD: { major: "Dollar", minor: "Cent" },
    AUD: { major: "Dollar", minor: "Cent" },
    INR: { major: "Rupee", minor: "Paisa" },
    JPY: { major: "Yen", minor: "Sen" },
    CNY: { major: "Yuan", minor: "Fen" },
    BRL: { major: "Real", minor: "Centavo" },
};
/** Default wording for any currency without an explicit entry above. */
const DEFAULT_UNIT_NAMES = { major: "Unit", minor: "Cent" };
/**
 * Spell a minor-unit amount in words, e.g.
 * "One Million, Two Hundred Thousand Naira, Fifty Kobo Only".
 */
function amountInWords(amountInKobo, currency) {
    const code = (0, documentCurrency_1.normalizeCurrencyCode)(currency);
    const names = MINOR_UNIT_NAMES[code] ?? DEFAULT_UNIT_NAMES;
    const digits = (0, documentCurrency_1.getMinorUnitDigits)(code);
    const divisor = BigInt(10 ** digits);
    const negative = amountInKobo < BigInt(0);
    const abs = negative ? -amountInKobo : amountInKobo;
    const major = Number(abs / divisor);
    const minorPart = digits > 0 ? Number(abs % divisor) : 0;
    if (major === 0 && minorPart === 0)
        return `Zero ${names.major} Only`;
    const groups = [
        [1000000000, "Billion"],
        [1000000, "Million"],
        [1000, "Thousand"],
    ];
    const majorWords = [];
    let remaining = major;
    for (const [value, label] of groups) {
        const count = Math.floor(remaining / value);
        if (count > 0) {
            majorWords.push(`${chunkToWords(count)} ${label}`);
            remaining %= value;
        }
    }
    if (remaining > 0)
        majorWords.push(chunkToWords(remaining));
    const minorWords = minorPart > 0 ? `${chunkToWords(minorPart)} ${names.minor}` : "";
    const majorPhrase = `${majorWords.join(" ")} ${names.major}`.trim();
    let body;
    if (majorWords.length > 0 && minorWords)
        body = `${majorPhrase}, ${minorWords} Only`;
    else if (majorWords.length > 0)
        body = `${majorPhrase} Only`;
    else
        body = `${minorWords} Only`;
    return negative ? `Minus ${body}` : body;
}
/**
 * The fingerprint printed on a voucher, shared by the PDF renderer and the
 * JSON endpoint that drives the HTML print template.
 */
function computeVoucherHash(input) {
    return (0, documentComponents_1.verificationHash)([
        input.organizationName,
        input.voucherNumber,
        (0, documentCurrency_1.formatMinorUnits)(input.amountInKobo, input.currency),
        (0, documentCurrency_1.normalizeCurrencyCode)(input.currency),
        input.paidAt.toISOString(),
        input.payeeName,
    ]);
}
const VOUCHER_COLUMNS = [
    { header: "Description", flex: 4 },
    { header: "Reference", flex: 1.6, align: "center" },
    { header: "Amount", flex: 2, align: "right" },
];
/**
 * Render a payment voucher as a one-page A4 PDF, sharing the e-Receipt's
 * design language: branded header, metadata bar, amount banner, line-item
 * table, authorization trail and a verification footer.
 */
async function generatePaymentVoucherPdf(target, data, organizationId) {
    const branding = await resolveBranding(data, organizationId);
    const currency = (0, documentCurrency_1.normalizeCurrencyCode)(branding.currency);
    const timezone = (0, pdfReportRenderer_1.resolveTimezone)(branding.timezone);
    const paidAt = data.paidAt instanceof Date ? data.paidAt : new Date(data.paidAt);
    const timestamp = (0, pdfReportRenderer_1.formatTimestamp)(paidAt, timezone);
    const amountWords = data.amountInWords || amountInWords(data.amountInKobo, currency);
    const hash = data.verificationHash ??
        computeVoucherHash({
            organizationName: branding.name,
            voucherNumber: data.voucherNumber,
            amountInKobo: data.amountInKobo,
            currency,
            paidAt,
            payeeName: data.payeeName,
        });
    const doc = (0, documentComponents_1.createDocument)(data.voucherNumber, branding, "Official Payment Voucher");
    target.setHeader?.("Content-Type", "application/pdf");
    target.setHeader?.("Content-Disposition", `inline; filename="payment-voucher-${data.voucherNumber.replace(/[^A-Za-z0-9-_]/g, "")}.pdf"`);
    let y = await (0, documentComponents_1.drawDocumentHeader)(doc, branding, {
        title: "Payment Voucher",
        reference: data.voucherNumber,
    });
    y += 16;
    (0, documentComponents_1.drawMetadataBar)(doc, [
        { label: "Voucher No", value: data.voucherNumber },
        { label: "Payment Date", value: (0, pdfReportRenderer_1.formatDateOnly)(paidAt, timezone) },
        { label: "Payment Method", value: (data.paymentMethod || "Not recorded").toUpperCase() },
        { label: "Status", value: "PAID", tone: "success" },
    ], { y });
    y += 46 + 16;
    y = (0, documentComponents_1.drawTotalBanner)(doc, {
        y,
        label: "Amount Paid",
        amount: (0, documentComponents_1.money)(data.amountInKobo, currency),
        note: amountWords,
    });
    y += 18;
    // Payee and payment details.
    doc
        .font(documentComponents_1.FONT_BOLD)
        .fontSize(7)
        .fillColor(documentComponents_1.DOC_COLORS.muted)
        .text("PAYEE & PAYMENT DETAILS", documentComponents_1.DOC_MARGIN, y, { width: documentComponents_1.DOC_CONTENT_WIDTH });
    y += 13;
    y = (0, documentComponents_1.drawDefinitionList)(doc, [
        { label: "Payee", value: data.payeeName, emphasis: true },
        ...data.payeeBankDetails.map((detail) => ({ label: "Payment Details", value: detail })),
        { label: "Purpose", value: data.purpose },
        { label: "Payment Reference", value: data.paymentReference || "—" },
        { label: "Notes", value: data.paymentNotes || "—" },
    ], { y, stripe: true });
    y += 16;
    // Line items.
    const rows = data.lineItems.map((item, index) => ({
        cells: [item.description, String(index + 1).padStart(2, "0"), (0, documentComponents_1.money)(item.amountInKobo, currency)],
    }));
    rows.push({ kind: "total", cells: ["TOTAL", "", (0, documentComponents_1.money)(data.amountInKobo, currency)] });
    doc
        .font(documentComponents_1.FONT_BOLD)
        .fontSize(7)
        .fillColor(documentComponents_1.DOC_COLORS.muted)
        .text("LINE ITEMS", documentComponents_1.DOC_MARGIN, y, { width: documentComponents_1.DOC_CONTENT_WIDTH });
    y += 13;
    y = (0, documentComponents_1.drawTable)(doc, VOUCHER_COLUMNS, rows, {
        y,
        emptyMessage: "No line items were recorded; this voucher covers the full amount above.",
    });
    y += 18;
    // Authorization trail.
    doc
        .font(documentComponents_1.FONT_BOLD)
        .fontSize(7)
        .fillColor(documentComponents_1.DOC_COLORS.muted)
        .text("AUTHORIZATION TRAIL", documentComponents_1.DOC_MARGIN, y, { width: documentComponents_1.DOC_CONTENT_WIDTH });
    y += 13;
    y = (0, documentComponents_1.drawDefinitionList)(doc, [
        { label: "Requested By", value: data.requestedBy },
        { label: "First Approval", value: data.firstApprovedBy || "—" },
        { label: "Second Approval", value: data.secondApprovedBy || "—" },
        { label: "Paid By", value: data.paidBy, emphasis: true },
        { label: "Amount In Words", value: amountWords },
    ], { y, stripe: true });
    await (0, documentComponents_1.drawAuditFooter)(doc, {
        y: y + 26,
        signatures: [
            { role: "Treasurer / Authorized Signatory", hint: "Releasing officer", name: data.paidBy },
            { role: "Received By / Payee", hint: "Signature and date", name: data.payeeName },
        ],
        qrText: (0, documentComponents_1.verificationPayload)({
            reference: data.voucherNumber,
            amount: data.amountInKobo,
            currency,
            date: paidAt,
            hash,
        }),
        hash,
        printedAt: new Date(),
        timezone,
        note: `Retain for audit and reconciliation. Verification hash ${hash.slice(0, 16)}…`,
    });
    return (0, documentComponents_1.deliverDocument)(doc, target);
}
//# sourceMappingURL=paymentVoucherService.js.map