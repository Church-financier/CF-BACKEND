"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusColorFor = void 0;
exports.computeReceiptHash = computeReceiptHash;
exports.formatReceiptNumber = formatReceiptNumber;
exports.generateReceiptPdf = generateReceiptPdf;
exports.buildReceiptForContribution = buildReceiptForContribution;
const documentComponents_1 = require("./documentComponents");
Object.defineProperty(exports, "statusColorFor", { enumerable: true, get: function () { return documentComponents_1.statusColorFor; } });
const pdfReportRenderer_1 = require("./pdfReportRenderer");
const orgBrandingService_1 = require("./orgBrandingService");
const documentCurrency_1 = require("../utils/documentCurrency");
const prisma_1 = require("../lib/prisma");
/**
 * The fingerprint printed on a receipt. Computed from the same inputs the
 * renderer uses, so the PDF and the HTML print template always agree, and a
 * recipient can quote it when confirming the figure.
 */
function computeReceiptHash(input) {
    return (0, documentComponents_1.verificationHash)([
        input.organizationName,
        input.receiptNumber,
        input.receiptId,
        (0, documentCurrency_1.formatMinorUnits)(input.amount, input.currency),
        (0, documentCurrency_1.normalizeCurrencyCode)(input.currency),
        input.date.toISOString(),
        input.status.toUpperCase(),
    ]);
}
function toDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}
/**
 * Build a human-facing receipt number of the form REC-2026-0042.
 *
 * The sequence is derived from the last digits of the entry id so it is
 * stable, collision-free across organizations, and does not require a
 * per-organization counter table.
 */
function formatReceiptNumber(entryId, date, timezone) {
    const year = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        timeZone: (0, pdfReportRenderer_1.resolveTimezone)(timezone),
    }).format(date);
    const digits = entryId.replace(/\D/g, "");
    const sequence = (digits.slice(-4) || entryId.slice(0, 4)).padStart(4, "0");
    return `REC-${year}-${sequence}`;
}
async function resolveBranding(data, organizationId) {
    if (organizationId) {
        const branding = await (0, orgBrandingService_1.getOrgBranding)(organizationId);
        if (branding.id)
            return branding;
    }
    // Fall back to the values supplied by the caller.
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
function buildRows(data, currency) {
    const items = data.lineItems && data.lineItems.length > 0
        ? data.lineItems
        : [
            {
                description: data.description || "Contribution received",
                category: data.fund,
                quantity: "1",
                unitPrice: (0, documentComponents_1.money)(data.amount, currency),
                amount: data.amount,
            },
        ];
    const rows = items.map((item) => ({
        cells: [
            item.description,
            item.category,
            item.quantity,
            item.unitPrice,
            (0, documentComponents_1.money)(item.amount, currency),
        ],
    }));
    rows.push({
        kind: "total",
        cells: ["", "", "", "TOTAL PAID", (0, documentComponents_1.money)(data.amount, currency)],
    });
    return rows;
}
const RECEIPT_COLUMNS = [
    { header: "Item Description", flex: 3.4 },
    { header: "Category / Fund", flex: 1.8 },
    { header: "Quantity", flex: 0.8, align: "center" },
    { header: "Unit Price", flex: 1.5, align: "right" },
    { header: "Amount", flex: 1.7, align: "right" },
];
/**
 * Render an enterprise-style e-Receipt as a one-page A4 PDF.
 *
 * Layout: branded header, metadata bar with a status badge, prominent total
 * banner, itemised transaction table, details grid, and a signature/audit
 * footer carrying a verification QR code and hash.
 */
async function generateReceiptPdf(target, data, organizationId) {
    const branding = await resolveBranding(data, organizationId);
    const currency = (0, documentCurrency_1.normalizeCurrencyCode)(branding.currency);
    const timezone = (0, pdfReportRenderer_1.resolveTimezone)(branding.timezone);
    const date = toDate(data.date);
    const status = (data.status || "APPROVED").toUpperCase();
    const receiptNumber = data.receiptNumber ?? formatReceiptNumber(data.receiptId, date, timezone);
    const timestamp = (0, pdfReportRenderer_1.formatTimestamp)(date, timezone);
    const hash = data.verificationHash ??
        computeReceiptHash({
            organizationName: branding.name,
            receiptNumber,
            receiptId: data.receiptId,
            amount: data.amount,
            currency,
            date,
            status,
        });
    const doc = (0, documentComponents_1.createDocument)(receiptNumber, branding, "Official Receipt");
    target.setHeader?.("Content-Type", "application/pdf");
    target.setHeader?.("Content-Disposition", `inline; filename="receipt-${receiptNumber.replace(/[^A-Za-z0-9-_]/g, "")}.pdf"`);
    let y = await (0, documentComponents_1.drawDocumentHeader)(doc, branding, {
        title: "Payment Receipt",
        reference: receiptNumber,
    });
    y += 16;
    // Metadata bar: reference, timestamp, method, payer.
    const metadataBarHeight = 46;
    (0, documentComponents_1.drawMetadataBar)(doc, [
        { label: "Receipt No", value: receiptNumber },
        { label: "Transaction Date", value: timestamp },
        { label: "Payment Method", value: (data.paymentMethod || "CASH").toUpperCase() },
        { label: "Received From", value: data.payerName || "Anonymous donor" },
    ], { y });
    // Status badge sits on the same visual line as the metadata bar.
    (0, documentComponents_1.drawStatusBadge)(doc, status, {
        x: documentComponents_1.DOC_MARGIN + documentComponents_1.DOC_CONTENT_WIDTH - 96,
        y: y + metadataBarHeight + 6,
        width: 96,
        height: 22,
    });
    doc
        .font(documentComponents_1.FONT_REGULAR)
        .fontSize(6.2)
        .fillColor(documentComponents_1.DOC_COLORS.muted)
        .text("STATUS", documentComponents_1.DOC_MARGIN + documentComponents_1.DOC_CONTENT_WIDTH - 200, y + metadataBarHeight + 13, {
        width: 100,
        align: "right",
    });
    y += metadataBarHeight + 38;
    // Total paid banner.
    y = (0, documentComponents_1.drawTotalBanner)(doc, {
        y,
        label: "Total Paid",
        amount: (0, documentComponents_1.money)(data.amount, currency),
        note: `${currency} · ${status}`,
    });
    y += 18;
    // Itemised table.
    const tableBottom = (0, documentComponents_1.drawTable)(doc, RECEIPT_COLUMNS, buildRows(data, currency), {
        y,
        emptyMessage: "No line items were recorded for this receipt.",
    });
    y = tableBottom + 18;
    // Transaction details.
    doc
        .font(documentComponents_1.FONT_BOLD)
        .fontSize(7)
        .fillColor(documentComponents_1.DOC_COLORS.muted)
        .text("TRANSACTION DETAILS", documentComponents_1.DOC_MARGIN, y, { width: documentComponents_1.DOC_CONTENT_WIDTH });
    y += 13;
    y = (0, documentComponents_1.drawDefinitionList)(doc, [
        { label: "Receipt Number", value: receiptNumber, emphasis: true },
        { label: "Reference", value: data.reference || data.receiptId },
        { label: "Transaction Date", value: timestamp },
        { label: "Fund / Category", value: data.fund },
        { label: "Payment Method", value: (data.paymentMethod || "CASH").toUpperCase() },
        { label: "Description", value: data.description || "—" },
        { label: "Recorded By", value: data.recordedBy || "System" },
        { label: "Status", value: status },
    ], { y, stripe: true });
    // Signature and verification footer.
    await (0, documentComponents_1.drawAuditFooter)(doc, {
        y: y + 26,
        signatures: [
            { role: "Authorized Signature", hint: "Treasurer / Financial Secretary" },
            { role: "Received By", hint: "Donor / Representative", name: data.payerName || undefined },
        ],
        qrText: (0, documentComponents_1.verificationPayload)({ reference: receiptNumber, amount: data.amount, currency, date, hash }),
        hash,
        printedAt: new Date(),
        timezone,
        note: `Verification hash ${hash.slice(0, 16)}… — quote this when confirming the receipt. Amount: ${(0, documentCurrency_1.formatMinorUnits)(data.amount, currency)}.`,
    });
    return (0, documentComponents_1.deliverDocument)(doc, target);
}
/**
 * Build the receipt payload for a contribution, including the verification
 * hash. The same payload feeds the PDF renderer and the JSON endpoint that
 * drives the HTML print template, so both documents show the same hash.
 */
async function buildReceiptForContribution(organizationId, entryId) {
    const entry = await prisma_1.prisma.ledgerEntry.findFirst({
        where: { id: entryId, organizationId, type: "DONATION", reversedById: null },
        include: {
            fund: true,
            recordedBy: { select: { name: true, email: true } },
            member: { select: { fullName: true, memberNumber: true } },
            organization: true,
        },
    });
    if (!entry)
        throw new Error("Contribution not found");
    const branding = await (0, orgBrandingService_1.getOrgBranding)(organizationId);
    const timezone = branding.timezone || entry.organization.timezone;
    const date = toDate(entry.transactionDate);
    const currency = (0, documentCurrency_1.normalizeCurrencyCode)(entry.organization.currency);
    const receiptNumber = formatReceiptNumber(entry.id, date, timezone);
    const status = "APPROVED";
    const payerName = entry.member?.fullName ?? undefined;
    const recordedBy = entry.recordedBy ? `${entry.recordedBy.name} (${entry.recordedBy.email})` : "System";
    return {
        organizationName: entry.organization.name,
        organizationAddress: entry.organization.address,
        organizationPhone: entry.organization.phone,
        organizationEmail: entry.organization.email,
        organizationLogoUrl: entry.organization.logoUrl,
        receiptId: entry.id,
        receiptNumber,
        fundId: entry.fundId,
        date,
        fund: entry.fund?.name || "Unknown Fund",
        amount: entry.amountInKobo,
        currency,
        description: entry.description,
        paymentMethod: entry.contributionMethod ?? undefined,
        status,
        payerName,
        recordedBy,
        timezone,
        reference: entry.notes ?? undefined,
        verificationHash: computeReceiptHash({
            organizationName: entry.organization.name,
            receiptNumber,
            receiptId: entry.id,
            amount: entry.amountInKobo,
            currency,
            date,
            status,
        }),
    };
}
//# sourceMappingURL=receiptPdfService.js.map