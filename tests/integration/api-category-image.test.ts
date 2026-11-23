import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "@/app/api/categories/[id]/image/route";
import { POST as postCategory } from "@/app/api/categories/route";
import { MAX_CATEGORY_IMAGE_BYTES, uploadCategoryImage } from "@/modules/categories/server/image";
import { getDb } from "@/modules/core/db/client";
import { categories } from "@/modules/core/db/schema";
import { getObjectStore, type ObjectStore } from "@/modules/core/storage/object-store";
import { jsonRequest, makeJpeg, readObject, resetDb } from "../helpers/fixtures";

// dataset-ajustes S4: imagem do cartão da categoria (doors 2 e 3).
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function imageForm(file?: Blob, name = "foto.jpg") {
  const form = new FormData();
  if (file) form.set("file", file, name);
  return form;
}

const put = (id: string, form: FormData) =>
  PUT(new Request(`http://test/api/categories/${id}/image`, { method: "PUT", body: form }), ctx(id));
const get = (id: string) => GET(new Request(`http://test/api/categories/${id}/image`), ctx(id));
const jpeg = (buf: Buffer) => new Blob([new Uint8Array(buf)], { type: "image/jpeg" });

async function newCategory(name = "Nelore") {
  const id = randomUUID();
  const res = await postCategory(jsonRequest("http://test/api/categories", { id, name, description: null }));
  expect(res.status).toBe(201);
  return id;
}

const imageKeyOf = async (id: string) =>
  (await getDb().select({ k: categories.imageKey }).from(categories).where(eq(categories.id, id)))[0]?.k;

beforeEach(resetDb);

describe("imagem da categoria", () => {
  it("imagem gravada em webp de ate 640 px", async () => {
    const id = await newCategory();
    const res = await put(id, imageForm(jpeg(await makeJpeg(4000, 3000))));
    expect(res.status).toBe(200);
    expect((await res.json()).category).toMatchObject({ id, imageKey: `categories/${id}.webp` });
    expect(await imageKeyOf(id)).toBe(`categories/${id}.webp`);
    const meta = await sharp(await readObject(`categories/${id}.webp`)).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(640);
  });

  it("erros do envio da imagem", async () => {
    const id = await newCategory();
    // Arquivo que não é imagem.
    expect((await put(id, imageForm(new Blob(["isto não é uma foto"], { type: "text/plain" }), "nota.txt"))).status).toBe(415);
    // Acima de 15 MB.
    const big = new Blob([new Uint8Array(MAX_CATEGORY_IMAGE_BYTES + 1)], { type: "image/jpeg" });
    expect((await put(id, imageForm(big))).status).toBe(413);
    // Sem arquivo.
    const missing = await put(id, imageForm());
    expect(missing.status).toBe(422);
    expect((await missing.json()).fields.file).toBeTruthy();
    // Categoria inexistente.
    expect((await put(randomUUID(), imageForm(jpeg(await makeJpeg(800, 600))))).status).toBe(404);
    // Armazenamento fora.
    const refusing: ObjectStore = {
      put: async () => {
        throw new Error("S3Error: AccessDenied");
      },
      get: getObjectStore().get,
      remove: async () => {},
    };
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await uploadCategoryImage(
        new Request("http://test", { method: "PUT", body: imageForm(jpeg(await makeJpeg(800, 600))) }),
        id,
        { db: getDb(), store: refusing },
      );
      expect(res.status).toBe(503);
    } finally {
      logged.mockRestore();
    }
    expect(await imageKeyOf(id)).toBeNull();
  });

  it("leitura da imagem da categoria", async () => {
    const withImage = await newCategory("Nelore");
    expect((await put(withImage, imageForm(jpeg(await makeJpeg(800, 600))))).status).toBe(200);
    const ok = await get(withImage);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("image/webp");

    const withoutImage = await newCategory("Angus");
    expect((await get(withoutImage)).status).toBe(404);
    expect((await get(randomUUID())).status).toBe(404);
  });
});
