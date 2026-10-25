import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { sql } from "drizzle-orm";
import { POST as postAnimal } from "@/app/api/animals/route";
import { getDb } from "@/lib/db/client";
import { createMinioClient } from "@/lib/storage/object-store";

export const minio = createMinioClient();
export const BUCKET = "animal-images";

export async function resetDb() {
  await getDb().execute(sql`truncate table animal_images, animals`);
}

export function animalBody(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    externalId: `T${Math.floor(Math.random() * 1e8)}`,
    category: "TAURINE",
    sex: "MALE",
    age: 24,
    ageUnit: "MONTHS",
    weightKg: 485,
    ...overrides,
  };
}

export function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function createAnimal(overrides: Record<string, unknown> = {}) {
  const body = animalBody(overrides);
  const res = await postAnimal(jsonRequest("http://test/api/animals", body));
  if (res.status !== 201) throw new Error(`animal não criado: ${res.status}`);
  return (await res.json()).animal as { id: string; externalId: string };
}

/** JPEG sintético; `orientation` grava a tag EXIF Orientation. */
export async function makeJpeg(width: number, height: number, orientation?: number) {
  let img = sharp({
    create: { width, height, channels: 3, background: { r: 120, g: 90, b: 60 } },
  }).jpeg({ quality: 80 });
  if (orientation) img = img.withMetadata({ orientation });
  return img.toBuffer();
}

export function uploadForm(file: Blob, overrides: Record<string, string> = {}) {
  const form = new FormData();
  form.set("file", file, "foto.jpg");
  const fields = {
    imageId: randomUUID(),
    position: "SIDE",
    framing: "FRAMED",
    minDistanceM: "2.1",
    capturedAt: new Date().toISOString(),
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return { form, imageId: fields.imageId };
}

export function formRequest(url: string, form: FormData) {
  return new Request(url, { method: "POST", body: form });
}

export async function objectExists(key: string) {
  try {
    await minio.statObject(BUCKET, key);
    return true;
  } catch {
    return false;
  }
}

export async function readObject(key: string) {
  const stream = await minio.getObject(BUCKET, key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

export async function listObjects(prefix: string) {
  const keys: string[] = [];
  for await (const item of minio.listObjectsV2(BUCKET, prefix, true)) {
    if (item.name) keys.push(item.name);
  }
  return keys;
}
