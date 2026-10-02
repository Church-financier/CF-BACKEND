export interface FileStorage {
    upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
    getStream(key: string): Promise<Buffer>;
}
export declare const fileStorage: FileStorage;
export declare function generateStorageKey(prefix: string, extension: string): string;
//# sourceMappingURL=fileStorage.d.ts.map