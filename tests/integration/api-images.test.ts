import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { count, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/animals/[id]/images/route";
import { GET } from "@/app/api/images/[id]/route";
import { getDb } from "@/lib/db/client";
import { animalImages } from "@/lib/db/schema";
import { MAX_UPLOAD_BYTES, uploadAnimalImage } from "@/lib/images/upload";
import { getObjectStore, type ObjectStore } from "@/lib/storage/object-store";
import {
  createAnimal,
  formRequest,
  listObjects,
  makeJpeg,
  objectExists,
  readObject,
  resetDb,
  uploadForm,
} from "../helpers/fixtures";

const upload = (animalId: string, form: FormData) =>
  POST(formRequest(`http://test/api/animals/${animalId}/images`, form), {
    params: Promise.resolve({ id: animalId }),
  });
const read = (id: string, variant: string) =>
  GET(new Request(`http://test/api/images/${id}?variant=${variant}`), { params: Promise.resolve({ id }) });
const rowCount = async () => (await getDb().select({ n: count() }).from(animalImages))[0].n;
const jpegBlob = (buf: Buffer) => new Blob([new Uint8Array(buf)], { type: "image/jpeg" });

let jpeg4000x3000: Buffer;

beforeEach(async () => {
  await resetDb();
  jpeg4000x3000 ??= await makeJpeg(4000, 3000);
});

describe("POST /api/animals/{id}/images", () => {
  it("foto horizontal vira 2048x1536 sem exif e responde 201", async () => {
    const animal = await createAnimal();
    const { form } = uploadForm(jpegBlob(jpeg4000x3000));
    const res = await upload(animal.id, form);
    expect(res.status).toBe(201);
    const { image } = await res.json();
    const stored = await readObject(image.objectKey);
    const meta = await sharp(stored).metadata();
    expect(meta.format).toBe("jpeg");
    expect([meta.width, meta.height]).toEqual([2048, 1536]);
    expect(meta.exif).toBeUndefined();
  });

  it("orientacao 6 vira retrato 1536x2048", async () => {
    const animal = await createAnimal();
    const rotated = await makeJpeg(4000, 3000, 6);
    expect((await sharp(rotated).metadata()).orientation).toBe(6);
    const { form } = uploadForm(jpegBlob(rotated));
    const { image } = await (await upload(animal.id, form)).json();
    const meta = await sharp(await readObject(image.objectKey)).metadata();
    expect([meta.width, meta.height]).toEqual([1536, 2048]);
    expect(meta.orientation).toBeUndefined();
  });

  it("miniatura webp 320x240", async () => {
    const animal = await createAnimal();
    const { form } = uploadForm(jpegBlob(jpeg4000x3000));
    const { image } = await (await upload(animal.id, form)).json();
    const meta = await sharp(await readObject(image.thumbKey)).metadata();
    expect(meta.format).toBe("webp");
    expect([meta.width, meta.height]).toEqual([320, 240]);
  });

  it("chaves no bucket por animal, posicao e imagem", async () => {
    const animal = await createAnimal();
    const { form, imageId } = uploadForm(jpegBlob(jpeg4000x3000), { position: "SIDE" });
    expect((await upload(animal.id, form)).status).toBe(201);
    expect(await objectExists(`animals/${animal.id}/SIDE/${imageId}.jpg`)).toBe(true);
    expect(await objectExists(`animals/${animal.id}/SIDE/${imageId}_thumb.webp`)).toBe(true);
  });

  it("linha com snapshots do animal", async () => {
    const animal = await createAnimal({ weightKg: 485, age: 24, ageUnit: "MONTHS" });
    const capturedAt = new Date().toISOString();
    const { form, imageId } = uploadForm(jpegBlob(jpeg4000x3000), {
      position: "SIDE",
      framing: "FRAMED",
      minDistanceM: "2.1",
      capturedAt,
    });
    expect((await upload(animal.id, form)).status).toBe(201);
    const [row] = await getDb().select().from(animalImages).where(eq(animalImages.id, imageId));
    const jpegBytes = (await readObject(row.objectKey)).length;
    expect(row).toMatchObject({
      position: "SIDE",
      framing: "FRAMED",
      minDistanceM: 2.1,
      width: 2048,
      height: 1536,
      bytes: jpegBytes,
      weightKgAtCapture: 485,
      ageMonthsAtCapture: 24,
    });
    expect(row.capturedAt.toISOString()).toBe(capturedAt);
  });

  it("arquivo grande responde 413 sem objeto nem linha", async () => {
    const animal = await createAnimal();
    const big = new Blob([new Uint8Array(MAX_UPLOAD_BYTES + 1)], { type: "image/jpeg" });
    const { form } = uploadForm(big);
    expect((await upload(animal.id, form)).status).toBe(413);
    expect(await rowCount()).toBe(0);
    expect(await listObjects(`animals/${animal.id}/`)).toEqual([]);
  });

  it("nao imagem responde 415 sem objeto nem linha", async () => {
    const animal = await createAnimal();
    const { form } = uploadForm(new Blob(["isto não é uma foto"], { type: "image/jpeg" }));
    expect((await upload(animal.id, form)).status).toBe(415);
    expect(await rowCount()).toBe(0);
    expect(await listObjects(`animals/${animal.id}/`)).toEqual([]);
  });

  it("animal inexistente responde 404 sem objeto nem linha", async () => {
    const ghost = randomUUID();
    const { form } = uploadForm(jpegBlob(jpeg4000x3000));
    expect((await upload(ghost, form)).status).toBe(404);
    expect(await rowCount()).toBe(0);
    expect(await listObjects(`animals/${ghost}/`)).toEqual([]);
  });

  it.each([
    ["position", { position: "FRONT" }],
    ["framing", { framing: "OK" }],
  ])("enum invalido responde 422: %s", async (_field, overrides) => {
    const animal = await createAnimal();
    const { form } = uploadForm(jpegBlob(jpeg4000x3000), overrides);
    expect((await upload(animal.id, form)).status).toBe(422);
    expect(await rowCount()).toBe(0);
    expect(await listObjects(`animals/${animal.id}/`)).toEqual([]);
  });

  it("armazenamento fora responde 503 sem linha", async () => {
    const animal = await createAnimal();
    const refusing: ObjectStore = {
      put: async () => {
        throw new Error("S3Error: AccessDenied");
      },
      get: getObjectStore().get,
      remove: async () => {},
    };
    const { form } = uploadForm(jpegBlob(jpeg4000x3000));
    const res = await uploadAnimalImage(formRequest("http://test", form), animal.id, {
      db: getDb(),
      store: refusing,
    });
    expect(res.status).toBe(503);
    expect(await rowCount()).toBe(0);
  });

  it("falha no banco apaga objetos e responde 500", async () => {
    const animal = await createAnimal();
    const { form, imageId } = uploadForm(jpegBlob(jpeg4000x3000));
    const res = await uploadAnimalImage(formRequest("http://test", form), animal.id, {
      db: getDb(),
      store: getObjectStore(),
      insertImage: async () => {
        throw new Error("connection terminated");
      },
    });
    expect(res.status).toBe(500);
    expect(await objectExists(`animals/${animal.id}/SIDE/${imageId}.jpg`)).toBe(false);
    expect(await objectExists(`animals/${animal.id}/SIDE/${imageId}_thumb.webp`)).toBe(false);
    expect(await rowCount()).toBe(0);
  });

  it("mesmo imageId responde 200 com a imagem existente", async () => {
    const animal = await createAnimal();
    const imageId = randomUUID();
    const first = await upload(animal.id, uploadForm(jpegBlob(jpeg4000x3000), { imageId }).form);
    expect(first.status).toBe(201);
    const second = await upload(animal.id, uploadForm(jpegBlob(jpeg4000x3000), { imageId }).form);
    expect(second.status).toBe(200);
    expect((await second.json()).image.id).toBe(imageId);
    expect(await rowCount()).toBe(1);
    expect(await listObjects(`animals/${animal.id}/`)).toHaveLength(2);
  });
});

describe("GET /api/images/{id}", () => {
  it("leitura de imagem: thumb webp, full jpeg e 404", async () => {
    const animal = await createAnimal();
    const { form, imageId } = uploadForm(jpegBlob(jpeg4000x3000));
    await upload(animal.id, form);

    const thumb = await read(imageId, "thumb");
    expect(thumb.status).toBe(200);
    expect(thumb.headers.get("content-type")).toBe("image/webp");
    expect((await sharp(Buffer.from(await thumb.arrayBuffer())).metadata()).format).toBe("webp");

    const full = await read(imageId, "full");
    expect(full.status).toBe(200);
    expect(full.headers.get("content-type")).toBe("image/jpeg");

    expect((await read(randomUUID(), "thumb")).status).toBe(404);
  });
});
