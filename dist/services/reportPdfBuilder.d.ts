import type { ReportModel } from "./reportExportModel";
/**
 * Render a report model to a PDF buffer.
 *
 * Sections become striped tables with subtotal/total emphasis; blocks become
 * label/value statements. Currency symbols are already baked into each cell's
 * display text by the model builder, so the PDF inherits the organization's
 * base currency without any further formatting here.
 */
export declare function buildPdfDocument(model: ReportModel): Promise<Buffer>;
//# sourceMappingURL=reportPdfBuilder.d.ts.map