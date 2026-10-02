import { PdfReportRenderer, type PdfDocumentOptions, type PdfRow, type PdfSection, type PdfTable } from "./pdfReportRenderer";
import type { ReportModel } from "./reportExportModel";

function toPdfRows(rows: ReportModel["sections"][number]["rows"]): PdfRow[] {
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
export async function buildPdfDocument(model: ReportModel): Promise<Buffer> {
  const sections: PdfSection[] = model.sections.map((section) => ({
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

  const blocks: PdfTable[] = model.blocks.map((block) => ({
    columns: block.columns.map((column) => ({
      header: column.header,
      align: column.align,
      flex: column.flex,
    })),
    rows: toPdfRows(block.rows),
  }));

  const options: PdfDocumentOptions = {
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

  const renderer = new PdfReportRenderer(options);
  return renderer.render();
}
