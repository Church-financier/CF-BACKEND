"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPdfDocument = buildPdfDocument;
const pdfReportRenderer_1 = require("./pdfReportRenderer");
function toPdfRows(rows) {
    return rows.map((row) => ({
        kind: row.kind === "section" ? "data" : row.kind,
        cells: row.cells.map((cell) => cell.text),
    }));
}
/**
 * Render a report model to a PDF buffer.
 *
 * Sections become striped tables with subtotal/total emphasis; blocks become
 * label/value statements. Currency symbols are already baked into each cell's
 * display text by the model builder, so the PDF inherits the organization's
 * base currency without any further formatting here.
 */
async function buildPdfDocument(model) {
    const sections = model.sections.map((section) => ({
        title: section.title,
        subtitle: section.subtitle,
        columns: section.columns.map((column) => ({
            header: column.header,
            align: column.align,
            flex: column.flex,
            mono: column.mono,
        })),
        rows: toPdfRows(section.rows),
    }));
    const blocks = model.blocks.map((block) => ({
        columns: block.columns.map((column) => ({
            header: column.header,
            align: column.align,
            flex: column.flex,
        })),
        rows: toPdfRows(block.rows),
    }));
    const options = {
        title: model.title,
        subtitle: model.subtitle,
        branding: model.branding,
        meta: model.meta,
        currency: model.currency,
        timezone: model.timezone,
        generatedAt: model.generatedAt,
        sections,
        blocks,
        emptyMessage: model.emptyMessage,
    };
    const renderer = new pdfReportRenderer_1.PdfReportRenderer(options);
    return renderer.render();
}
//# sourceMappingURL=reportPdfBuilder.js.map