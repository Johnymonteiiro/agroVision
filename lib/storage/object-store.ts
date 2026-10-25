import type { Readable } from "node:stream";
import { Client } from "minio";

export type ObjectStore = {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Readable>;
  remove(key: string): Promise<void>;
};

const globalForStore = globalThis as unknown as { gadoStore?: ObjectStore };

function bucket() {
  const name = process.env.S3_BUCKET;
  if (!name) throw new Error("S3_BUCKET não definido");
  return name;
}

export function createMinioClient() {
  return new Client({
    endPoint: process.env.S3_ENDPOINT ?? "localhost",
    port: Number(process.env.S3_PORT ?? 9000),
    useSSL: process.env.S3_USE_SSL === "true",
    accessKey: process.env.S3_ACCESS_KEY ?? "",
    secretKey: process.env.S3_SECRET_KEY ?? "",
  });
}

export function getObjectStore(): ObjectStore {
  if (!globalForStore.gadoStore) {
    const client = createMinioClient();
    globalForStore.gadoStore = {
      async put(key, body, contentType) {
        await client.putObject(bucket(), key, body, body.length, { "Content-Type": contentType });
      },
      get: (key) => client.getObject(bucket(), key),
      remove: (key) => client.removeObject(bucket(), key),
    };
  }
  return globalForStore.gadoStore;
}
