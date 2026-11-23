import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { count, eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/animals/[id]/images/route";
import { PUT as putReadiness } from "@/app/api/animals/[id]/readiness/route";
import { DELETE, GET } from "@/app/api/images/[id]/route";
import { deleteAnimalImage } from "@/modules/photos/server/delete";
import { getDb } from "@/modules/core/db/client";
import { animalImages } from "@/modules/core/db/schema";
import { MAX_UPLOAD_BYTES, uploadAnimalImage } from "@/modules/photos/server/upload";
import { getObjectStore, type ObjectStore } from "@/modules/core/storage/object-store";
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
const changeReadiness = (animalId: string, body: unknown) =>
  putReadiness(
    new Request(`http://test/api/animals/${animalId}/readiness`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: animalId }) },
  );
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
    for (const readiness of ["READY", "NOT_READY"]) {
      const animal = await createAnimal({ readiness });
      const { form, imageId } = uploadForm(jpegBlob(jpeg4000x3000), { position: "SIDE" });
      expect((await upload(animal.id, form)).status).toBe(201);
      const [row] = await getDb().select().from(animalImages).where(eq(animalImages.id, imageId));
      expect(row.objectKey).toBe(`animals/${animal.id}/SIDE/${imageId}.jpg`);
      expect(row.thumbKey).toBe(`animals/${animal.id}/SIDE/${imageId}_thumb.webp`);
      expect(await objectExists(`animals/${animal.id}/SIDE/${imageId}.jpg`)).toBe(true);
      expect(await objectExists(`animals/${animal.id}/SIDE/${imageId}_thumb.webp`)).toBe(true);
    }
  });

  it("grava as metricas de qualidade", async () => {
    const animal = await createAnimal();
    const { form, imageId } = uploadForm(jpegBlob(jpeg4000x3000), {
      brightness: "181.6",
      sharpness: "2261.1",
      animalCount: "1",
    });
    const res = await upload(animal.id, form);
    expect(res.status).toBe(201);
    expect((await res.json()).image).toMatchObject({ brightness: 181.6, sharpness: 2261.1, animalCount: 1 });
    const [row] = await getDb().select().from(animalImages).where(eq(animalImages.id, imageId));
    expect(row).toMatchObject({ brightness: 181.6, sharpness: 2261.1, animalCount: 1 });
  });

  it("foto sem metricas grava nulo", async () => {
    const animal = await createAnimal();
    const none = uploadForm(jpegBlob(jpeg4000x3000));
    expect((await upload(animal.id, none.form)).status).toBe(201);
    // Detector indisponível: chegam brilho e nitidez, sem a contagem.
    const noCount = uploadForm(jpegBlob(jpeg4000x3000), { brightness: "120", sharpness: "300" });
    expect((await upload(animal.id, noCount.form)).status).toBe(201);
    const rows = await getDb().select().from(animalImages);
    expect(rows.find((r) => r.id === none.imageId)).toMatchObject({ brightness: null, sharpness: null, animalCount: null });
    expect(rows.find((r) => r.id === noCount.imageId)).toMatchObject({ brightness: 120, sharpness: 300, animalCount: null });
  });

  it("metricas fora dos limites respondem 422", async () => {
    const animal = await createAnimal();
    const bad: Array<[string, string]> = [
      ["brightness", "-1"],
      ["brightness", "255.1"],
      ["sharpness", "-0.1"],
      ["animalCount", "1.5"],
      ["animalCount", "51"],
    ];
    for (const [field, value] of bad) {
      const { form } = uploadForm(jpegBlob(jpeg4000x3000), { [field]: value });
      const res = await upload(animal.id, form);
      expect(res.status, `${field}=${value}`).toBe(422);
      expect((await res.json()).fields[field], `${field}=${value}`).toBeTruthy();
    }
    expect(await rowCount()).toBe(0);
    expect(await listObjects(`animals/${animal.id}/`)).toEqual([]);
    const edges: Record<string, string>[] = [{ brightness: "0" }, { brightness: "255" }, { animalCount: "50" }];
    for (const fields of edges) {
      expect((await upload(animal.id, uploadForm(jpegBlob(jpeg4000x3000), fields).form)).status).toBe(201);
    }
  });

  it("linha com o rotulo da captura", async () => {
    const animal = await createAnimal({ readiness: "NOT_READY" });
    const first = uploadForm(jpegBlob(jpeg4000x3000));
    expect((await upload(animal.id, first.form)).status).toBe(201);
    expect((await changeReadiness(animal.id, { readiness: "READY", scope: "FROM_NOW" })).status).toBe(200);
    const second = uploadForm(jpegBlob(jpeg4000x3000));
    expect((await upload(animal.id, second.form)).status).toBe(201);
    const rows = await getDb().select().from(animalImages);
    expect(rows.find((r) => r.id === first.imageId)?.readinessAtCapture).toBe("NOT_READY");
    expect(rows.find((r) => r.id === second.imageId)?.readinessAtCapture).toBe("READY");
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

// dataset-ajustes S2: exclusão definitiva da foto (door 1).
describe("DELETE /api/images/{id}", () => {
  const remove = (id: string) => DELETE(new Request(`http://test/api/images/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });

  async function photo() {
    const animal = await createAnimal();
    const { form, imageId } = uploadForm(jpegBlob(jpeg4000x3000));
    expect((await upload(animal.id, form)).status).toBe(201);
    const [row] = await getDb().select().from(animalImages).where(eq(animalImages.id, imageId));
    return row;
  }

  it("DELETE apaga linha e objetos", async () => {
    const row = await photo();
    const res = await remove(row.id);
    expect(res.status).toBe(204);
    expect(await rowCount()).toBe(0);
    expect(await objectExists(row.objectKey)).toBe(false);
    expect(await objectExists(row.thumbKey)).toBe(false);
  });

  it("DELETE de foto inexistente responde 404", async () => {
    expect((await remove(randomUUID())).status).toBe(404);
    expect((await remove("abc")).status).toBe(404);
  });

  it("falha no MinIO depois da linha responde 204", async () => {
    const row = await photo();
    const failing: ObjectStore = {
      put: getObjectStore().put,
      get: getObjectStore().get,
      remove: async () => {
        throw new Error("S3Error: indisponível");
      },
    };
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await deleteAnimalImage(row.id, { db: getDb(), store: failing });
      expect(res.status).toBe(204);
      expect(await rowCount()).toBe(0);
      expect(logged).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ keys: [row.objectKey, row.thumbKey] }),
      );
    } finally {
      logged.mockRestore();
    }
  });

  describe("falha no banco", () => {
    beforeEach(async () => {
      await getDb().execute(sql`
        create or replace function test_fail_image_delete() returns trigger language plpgsql as $$
        begin raise exception 'falha simulada na exclusão'; end $$`);
      await getDb().execute(sql`
        create trigger test_fail_image_delete before delete on animal_images
        for each row execute function test_fail_image_delete()`);
    });
    afterEach(async () => {
      await getDb().execute(sql`drop trigger if exists test_fail_image_delete on animal_images`);
      await getDb().execute(sql`drop function if exists test_fail_image_delete()`);
    });

    it("falha no banco nao remove objetos", async () => {
      const row = await photo();
      const logged = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        expect((await remove(row.id)).status).toBe(500);
      } finally {
        logged.mockRestore();
      }
      expect(await rowCount()).toBe(1);
      expect(await objectExists(row.objectKey)).toBe(true);
      expect(await objectExists(row.thumbKey)).toBe(true);
    });
  });
});
