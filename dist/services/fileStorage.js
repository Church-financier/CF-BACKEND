"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileStorage = void 0;
exports.generateStorageKey = generateStorageKey;
const client_s3_1 = require("@aws-sdk/client-s3");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
function getS3Client() {
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const endpoint = process.env.S3_ENDPOINT;
    if (!region || !bucket || !accessKeyId || !secretAccessKey)
        return null;
    return new client_s3_1.S3Client({
        region,
        endpoint,
        forcePathStyle: !!endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
}
const s3Client = getS3Client();
const s3Bucket = process.env.S3_BUCKET || null;
const localDir = process.env.STORAGE_LOCAL_DIR || path_1.default.join(process.cwd(), "storage");
async function ensureLocalDir() {
    try {
        await promises_1.default.mkdir(localDir, { recursive: true });
    }
    catch {
        // ignore
    }
}
exports.fileStorage = {
    async upload(key, buffer, contentType) {
        if (s3Client && s3Bucket) {
            const client = s3Client;
            const cmd = new client_s3_1.PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            });
            await client.send(cmd);
            return key;
        }
        await ensureLocalDir();
        const filePath = path_1.default.join(localDir, key);
        await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
        await promises_1.default.writeFile(filePath, buffer);
        return key;
    },
    async getStream(key) {
        if (s3Client && s3Bucket) {
            const client = s3Client;
            const cmd = new client_s3_1.GetObjectCommand({ Bucket: s3Bucket, Key: key });
            const response = await client.send(cmd);
            if (!response.Body)
                throw new Error("Empty S3 object");
            const chunks = [];
            for await (const chunk of response.Body) {
                chunks.push(Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        }
        const filePath = path_1.default.join(localDir, key);
        return promises_1.default.readFile(filePath);
    },
};
function generateStorageKey(prefix, extension) {
    return `${prefix}/${new Date().toISOString().slice(0, 10)}/${(0, crypto_1.randomUUID)()}${extension}`;
}
//# sourceMappingURL=fileStorage.js.map