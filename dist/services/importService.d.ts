export interface ImportRow {
    [key: string]: string | number | boolean | null | undefined;
}
export interface ImportResult {
    imported: number;
    failed: number;
    errors: Array<{
        row: number;
        message: string;
    }>;
}
export declare function parseImportFile(buffer: Buffer, filename: string): Promise<ImportRow[]>;
//# sourceMappingURL=importService.d.ts.map