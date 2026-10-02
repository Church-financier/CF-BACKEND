import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface FileStorage {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  getStream(key: string): Promise<Buffer>;
}

function getS3Client(): S3Client | null {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: !!endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const s3Client = getS3Client();
const s3Bucket = process.env.S3_BUCKET || null;
const localDir = process.env.STORAGE_LOCAL_DIR || path.join(process.cwd(), "storage");

async function ensureLocalDir() {
  try {
    await fs.mkdir(localDir, { recursive: true });
  } catch {
    // ignore
  }
}

export const fileStorage: FileStorage = {
  async upload(key, buffer, contentType) {
    if (s3Client && s3Bucket) {
      const client = s3Client;
      const cmd = new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
      await client.send(cmd);
      return key;
    }

    await ensureLocalDir();
    const filePath = path.join(localDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  },

  async getStream(key) {
    if (s3Client && s3Bucket) {
      const client = s3Client;
      const cmd = new GetObjectCommand({ Bucket: s3Bucket, Key: key });
      const response = await client.send(cmd);
      if (!response.Body) throw new Error("Empty S3 object");
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    const filePath = path.join(localDir, key);
    return fs.readFile(filePath);
  },
};

export function generateStorageKey(prefix: string, extension: string): string {
  return `${prefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
}
