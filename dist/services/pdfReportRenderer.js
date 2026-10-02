"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBigInt = exports.toMajorUnits = exports.PdfReportRenderer = exports.PDF_CONTENT_WIDTH = exports.PDF_MARGIN = exports.LETTER = exports.A4 = exports.PDF_COLORS = void 0;
exports.resolveTimezone = resolveTimezone;
exports.formatTimestamp = formatTimestamp;
exports.formatDateOnly = formatDateOnly;
exports.fillRect = fillRect;
exports.drawOrgHeader = drawOrgHeader;
const pdfkit_1 = __importDefault(require("pdfkit"));
const documentCurrency_1 = require("../utils/documentCurrency");
Object.defineProperty(exports, "toMajorUnits", { enumerable: true, get: function () { return documentCurrency_1.toMajorUnits; } });
Object.defineProperty(exports, "toBigInt", { enumerable: true, get: function () { return documentCurrency_1.toBigInt; } });
const date_1 = require("../utils/date");
const orgBrandingService_1 = require("./orgBrandingService");
/**
 * Shared visual language for every generated PDF.
 *
 * The palette is deliberately slate-based: a deep navy header, near-white
 * alternating stripes, and dark grey body text. It prints legibly in greyscale
 * and keeps the colour budget low enough that a mixed page of a receipt and a
 * report still looks like one product.
 */
exports.PDF_COLORS = {
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
};
/** A4 in PostScript points. */
exports.A4 = { width: 595.28, height: 841.89 };
/** US Letter in PostScript points. */
exports.LETTER = { width: 612, height: 792 };
exports.PDF_MARGIN = 40;
exports.PDF_CONTENT_WIDTH = exports.A4.width - exports.PDF_MARGIN * 2;
/** Height reserved at the bottom of every page for the footer band. */
const FOOTER_HEIGHT = 46;
const BOTTOM_LIMIT = exports.A4.height - exports.PDF_MARGIN - FOOTER_HEIGHT;
/** Fixed-width digits so numeric columns line up between rows. */
const FONT_REGULAR = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const FONT_MONO = "Courier";
function resolveTimezone(timezone) {
    return timezone && (0, date_1.isValidTimeZone)(timezone) ? timezone : date_1.DEFAULT_TIMEZONE;
}
/** "01 Oct 2026, 14:32" in the organization's timezone. */
function formatTimestamp(date, timezone) {
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
function formatDateOnly(date, timezone) {
    if (!date)
        return "-";
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime()))
        return "-";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: resolveTimezone(timezone),
    }).format(d);
}
function cellText(value) {
    if (value === null || value === undefined)
        return "";
    return String(value);
}
function distributeWidths(columns, totalWidth) {
    const flexTotal = columns.reduce((sum, column) => sum + (column.flex ?? 1), 0) || 1;
    return columns.map((column) => Math.max(24, Math.floor((column.flex ?? 1) * (totalWidth / flexTotal))));
}
/**
 * Distribute the content width across columns, then hand any rounding
 * remainder to the widest column so the table always spans the full width
 * exactly (a 1pt gap on the right edge reads as a broken border).
 */
function normalizedWidths(columns, totalWidth) {
    const widths = distributeWidths(columns, totalWidth);
    const used = widths.reduce((sum, width) => sum + width, 0);
    const diff = Math.round(totalWidth - used);
    if (diff === 0 || widths.length === 0)
        return widths;
    let widest = 0;
    for (let i = 1; i < widths.length; i++) {
        if (widths[i] > widths[widest])
            widest = i;
    }
    const adjusted = [...widths];
    adjusted[widest] = Math.max(24, adjusted[widest] + diff);
    return adjusted;
}
function fontFor(column, row) {
    if (row.kind === "total" || row.kind === "subtotal")
        return FONT_BOLD;
    if (column.mono)
        return FONT_MONO;
    return FONT_REGULAR;
}
function textColorFor(row, kind) {
    if (row.kind === "total")
        return exports.PDF_COLORS.white;
    if (row.kind === "subtotal")
        return exports.PDF_COLORS.primary;
    if (row.kind === "section")
        return exports.PDF_COLORS.primary;
    return kind?.align === "right" ? exports.PDF_COLORS.secondary : exports.PDF_COLORS.body;
}
/** Draw a rounded or square background behind a run of content. */
function fillRect(doc, x, y, width, height, color) {
    doc.save();
    doc.rect(x, y, width, height).fill(color);
    doc.restore();
}
/**
 * Organization header: logo (or a clean monogram placeholder), name and the
 * contact line. Drawn on the first page of a document.
 */
async function drawOrgHeader(doc, branding, options) {
    const { width, y } = options;
    const height = options.compact ? 56 : 64;
    const logoSize = height - 20;
    const textX = 40 + logoSize + 14;
    const textWidth = width - (textX - 40) - 12;
    fillRect(doc, 40, y, width, height, exports.PDF_COLORS.primary);
    const logo = await (0, orgBrandingService_1.fetchLogoBuffer)(branding.logoUrl);
    const logoX = 40 + 10;
    const logoY = y + 10;
    if (logo) {
        try {
            doc.image(logo.buffer, logoX, logoY, {
                fit: [logoSize, logoSize],
                align: "center",
                valign: "center",
            });
        }
        catch {
            drawMonogram(doc, logoX, logoY, logoSize, branding.name, exports.PDF_COLORS.white);
        }
    }
    else {
        // Clean placeholder: a light panel with the organization's initial.
        doc.save();
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 4).fill(exports.PDF_COLORS.white);
        doc.restore();
        doc
            .font(FONT_BOLD)
            .fontSize(logoSize * 0.5)
            .fillColor(exports.PDF_COLORS.primary)
            .text(branding.name.trim().charAt(0).toUpperCase() || "?", logoX, logoY + logoSize * 0.22, {
            width: logoSize,
            align: "center",
        });
    }
    doc
        .font(FONT_BOLD)
        .fontSize(options.compact ? 12 : 14)
        .fillColor(exports.PDF_COLORS.white)
        .text(branding.name.toUpperCase(), textX, y + 12, { width: textWidth, ellipsis: true });
    const contact = (0, orgBrandingService_1.formatContactLine)(branding);
    if (contact) {
        doc
            .font(FONT_REGULAR)
            .fontSize(7.5)
            .fillColor(exports.PDF_COLORS.white)
            .text(contact, textX, y + (options.compact ? 30 : 34), {
            width: textWidth,
            ellipsis: true,
        });
    }
    return y + height;
}
/** Fallback emblem drawn when no logo image is available. */
function drawMonogram(doc, x, y, size, name, color) {
    doc.save();
    doc.circle(x + size / 2, y + size / 2, size / 2).fill(color);
    doc.restore();
    doc
        .font(FONT_BOLD)
        .fontSize(size * 0.45)
        .fillColor(exports.PDF_COLORS.primary)
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
class PdfReportRenderer {
    constructor(options) {
        this.chunks = [];
        this.options = options;
        this.currency = (0, documentCurrency_1.normalizeCurrencyCode)(options.currency);
        this.y = exports.PDF_MARGIN;
        this.doc = new pdfkit_1.default({
            size: [exports.A4.width, exports.A4.height],
            margin: exports.PDF_MARGIN,
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
        this.doc.on("data", (chunk) => this.chunks.push(chunk));
    }
    money(value) {
        return (0, documentCurrency_1.formatMinorUnits)(value, this.currency);
    }
    /** Currency header suffix, e.g. "Amount (NGN)". */
    moneyHeader(label) {
        return `${label} (${this.currency})`;
    }
    ensureSpace(height) {
        if (this.options.paginate === false)
            return;
        if (this.y + height <= BOTTOM_LIMIT)
            return;
        this.doc.addPage();
        this.y = exports.PDF_MARGIN;
        this.drawContinuationHeader();
    }
    drawContinuationHeader() {
        const width = exports.PDF_CONTENT_WIDTH;
        fillRect(this.doc, 40, this.y, width, 22, exports.PDF_COLORS.primary);
        this.doc
            .font(FONT_BOLD)
            .fontSize(8)
            .fillColor(exports.PDF_COLORS.white)
            .text(this.options.title.toUpperCase(), 50, this.y + 7, { width: width / 2 });
        this.doc
            .font(FONT_REGULAR)
            .fontSize(8)
            .fillColor(exports.PDF_COLORS.white)
            .text(this.options.branding.name, 40 + width / 2, this.y + 7, {
            width: width / 2 - 10,
            align: "right",
            ellipsis: true,
        });
        this.y += 22 + 14;
    }
    drawTitleBlock() {
        this.doc
            .font(FONT_BOLD)
            .fontSize(20)
            .fillColor(exports.PDF_COLORS.primary)
            .text(this.options.title, 40, this.y, { width: exports.PDF_CONTENT_WIDTH, align: "center" });
        this.y += 26;
        if (this.options.subtitle) {
            this.doc
                .font(FONT_REGULAR)
                .fontSize(10)
                .fillColor(exports.PDF_COLORS.muted)
                .text(this.options.subtitle, 40, this.y, { width: exports.PDF_CONTENT_WIDTH, align: "center" });
            this.y += 16;
        }
        // Metadata strip: date range, base currency, generation time.
        const meta = [
            ...(this.options.meta ?? []),
            { label: "Base Currency", value: this.currency },
        ];
        if (meta.length > 0) {
            const stripHeight = 20 + Math.ceil(meta.length / 3) * 14;
            fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, stripHeight, exports.PDF_COLORS.stripe);
            this.doc.strokeColor(exports.PDF_COLORS.border).lineWidth(0.5);
            this.doc
                .rect(40, this.y, exports.PDF_CONTENT_WIDTH, stripHeight)
                .stroke(exports.PDF_COLORS.border);
            const colWidth = exports.PDF_CONTENT_WIDTH / 3;
            meta.forEach((item, index) => {
                const col = index % 3;
                const row = Math.floor(index / 3);
                const x = 40 + col * colWidth + 10;
                const cellY = this.y + 8 + row * 14;
                this.doc.font(FONT_REGULAR).fontSize(7).fillColor(exports.PDF_COLORS.muted);
                const labelText = `${item.label.toUpperCase()}: `;
                const labelWidth = this.doc.widthOfString(labelText);
                this.doc.text(labelText, x, cellY, { continued: true, lineBreak: false });
                this.doc
                    .font(FONT_BOLD)
                    .fontSize(7.5)
                    .fillColor(exports.PDF_COLORS.secondary)
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
    drawBlock(table, title) {
        if (title) {
            this.ensureSpace(30);
            this.doc
                .font(FONT_BOLD)
                .fontSize(9.5)
                .fillColor(exports.PDF_COLORS.primary)
                .text(title.toUpperCase(), 40, this.y, { width: exports.PDF_CONTENT_WIDTH });
            this.y += 16;
        }
        const labelFlex = table.columns[0]?.flex ?? 3;
        const valueFlex = table.columns[1]?.flex ?? 2;
        const totalFlex = labelFlex + valueFlex;
        const labelWidth = Math.floor((labelFlex / totalFlex) * exports.PDF_CONTENT_WIDTH);
        const valueWidth = exports.PDF_CONTENT_WIDTH - labelWidth;
        for (const row of table.rows) {
            const label = cellText(row.cells[0]);
            const value = cellText(row.cells[1]);
            const isTotal = row.kind === "total";
            const isSubtotal = row.kind === "subtotal";
            this.ensureSpace(24);
            const rowHeight = 22;
            if (isTotal) {
                fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, rowHeight, exports.PDF_COLORS.primary);
            }
            else if (isSubtotal) {
                fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, rowHeight, exports.PDF_COLORS.stripe);
            }
            else if (row.kind === "data") {
                fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, rowHeight, exports.PDF_COLORS.white);
            }
            const textY = this.y + 7;
            this.doc
                .font(isTotal || isSubtotal ? FONT_BOLD : FONT_REGULAR)
                .fontSize(9.5)
                .fillColor(isTotal ? exports.PDF_COLORS.white : exports.PDF_COLORS.body)
                .text(label || " ", 50, textY, { width: labelWidth - 20, ellipsis: true });
            this.doc
                .font(FONT_BOLD)
                .fontSize(9.5)
                .fillColor(isTotal ? exports.PDF_COLORS.white : exports.PDF_COLORS.primary)
                .text(value || " ", 40 + labelWidth, textY, { width: valueWidth - 10, align: "right" });
            this.y += rowHeight;
        }
        this.y += 16;
    }
    /**
     * Render a tabular block: navy header row, striped data rows, and shaded
     * subtotal/total rows with a rule above them.
     */
    drawTable(table, section) {
        const columns = table.columns;
        const widths = normalizedWidths(columns, exports.PDF_CONTENT_WIDTH);
        const headerHeight = 24;
        const rowHeight = 20;
        if (section?.title) {
            this.ensureSpace(40);
            this.doc
                .font(FONT_BOLD)
                .fontSize(9.5)
                .fillColor(exports.PDF_COLORS.primary)
                .text(section.title.toUpperCase(), 40, this.y, { width: exports.PDF_CONTENT_WIDTH });
            this.y += 15;
            if (section.subtitle) {
                this.doc
                    .font(FONT_REGULAR)
                    .fontSize(7.5)
                    .fillColor(exports.PDF_COLORS.muted)
                    .text(section.subtitle, 40, this.y, { width: exports.PDF_CONTENT_WIDTH });
                this.y += 12;
            }
            this.y += 2;
        }
        // Re-draw the header on every page so a long table stays readable.
        const drawHeader = () => {
            fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, headerHeight, exports.PDF_COLORS.primary);
            let x = 40;
            columns.forEach((column, index) => {
                const width = widths[index];
                const align = column.align ?? "left";
                this.doc
                    .font(FONT_BOLD)
                    .fontSize(7.5)
                    .fillColor(exports.PDF_COLORS.white)
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
                .fillColor(exports.PDF_COLORS.muted)
                .text("No data available for the selected period.", 48, this.y + 8, {
                width: exports.PDF_CONTENT_WIDTH - 16,
            });
            this.y += rowHeight + 4;
        }
        for (let index = 0; index < table.rows.length; index++) {
            const row = table.rows[index];
            this.ensureSpace(rowHeight);
            if (this.y + rowHeight > BOTTOM_LIMIT) {
                this.doc.addPage();
                this.y = exports.PDF_MARGIN;
                this.drawContinuationHeader();
                drawHeader();
            }
            if (row.kind === "total") {
                fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, rowHeight, exports.PDF_COLORS.primary);
            }
            else if (row.kind === "subtotal") {
                fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, rowHeight, exports.PDF_COLORS.stripe);
                this.doc.strokeColor(exports.PDF_COLORS.border).lineWidth(0.5);
                this.doc.moveTo(40, this.y + 0.25).lineTo(40 + exports.PDF_CONTENT_WIDTH, this.y + 0.25).stroke();
            }
            else if (index % 2 === 0) {
                fillRect(this.doc, 40, this.y, exports.PDF_CONTENT_WIDTH, rowHeight, exports.PDF_COLORS.stripe);
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
                this.doc.strokeColor(exports.PDF_COLORS.border).lineWidth(0.25);
                this.doc
                    .moveTo(40, this.y)
                    .lineTo(40 + exports.PDF_CONTENT_WIDTH, this.y)
                    .stroke(exports.PDF_COLORS.border);
            }
        }
        this.y += 20;
    }
    stampFooters() {
        const range = this.doc.bufferedPageRange();
        const total = range.count;
        for (let i = range.start; i < range.start + total; i++) {
            this.doc.switchToPage(i);
            const y = exports.A4.height - exports.PDF_MARGIN - 20;
            this.doc
                .strokeColor(exports.PDF_COLORS.border)
                .lineWidth(0.5)
                .moveTo(40, y - 6)
                .lineTo(40 + exports.PDF_CONTENT_WIDTH, y - 6)
                .stroke(exports.PDF_COLORS.border);
            this.doc.font(FONT_REGULAR).fontSize(7).fillColor(exports.PDF_COLORS.muted);
            this.doc.text(this.options.branding.name, 40, y, {
                width: exports.PDF_CONTENT_WIDTH / 2,
                ellipsis: true,
            });
            this.doc.text(`Page ${i - range.start + 1} of ${total}`, 40 + exports.PDF_CONTENT_WIDTH / 2, y, {
                width: exports.PDF_CONTENT_WIDTH / 4,
                align: "center",
            });
            this.doc.text(`Generated ${formatTimestamp(this.options.generatedAt, this.options.timezone)}`, 40, y, {
                width: exports.PDF_CONTENT_WIDTH,
                align: "right",
            });
            this.doc.font(FONT_REGULAR).fontSize(6.5).fillColor(exports.PDF_COLORS.muted);
            this.doc.text("Generated by Church Financier — Executive Financial Suite", 40, y + 9, { width: exports.PDF_CONTENT_WIDTH, align: "center" });
        }
    }
    async render() {
        const { branding } = this.options;
        const headerBottom = await drawOrgHeader(this.doc, branding, {
            width: exports.PDF_CONTENT_WIDTH,
            y: exports.PDF_MARGIN,
        });
        this.y = headerBottom + 18;
        this.drawTitleBlock();
        const hasData = (this.options.sections ?? []).some((section) => section.rows.length > 0) ||
            (this.options.blocks ?? []).some((block) => block.rows.length > 0);
        if (!hasData) {
            this.doc
                .font(FONT_REGULAR)
                .fontSize(10)
                .fillColor(exports.PDF_COLORS.muted)
                .text(this.options.emptyMessage ?? "No transactions were recorded for the selected period.", 40, this.y, { width: exports.PDF_CONTENT_WIDTH, align: "center" });
            this.y += 24;
        }
        for (const section of this.options.sections ?? []) {
            if (section.rows.length === 0)
                continue;
            this.drawTable({ columns: section.columns, rows: section.rows }, section);
        }
        for (const block of this.options.blocks ?? []) {
            this.drawBlock(block);
        }
        this.stampFooters();
        // Subscribe before end() so the 'end' event is never missed.
        const finished = new Promise((resolve, reject) => {
            this.doc.once("end", () => resolve());
            this.doc.once("error", reject);
        });
        this.doc.end();
        await finished;
        return Buffer.concat(this.chunks);
    }
}
exports.PdfReportRenderer = PdfReportRenderer;
//# sourceMappingURL=pdfReportRenderer.js.map