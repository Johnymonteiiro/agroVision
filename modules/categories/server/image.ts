import "server-only";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { getDb, type Db } from "@/modules/core/db/client";
import { categories } from "@/modules/core/db/schema";
import { getObjectStore, type ObjectStore } from "@/modules/core/storage/object-store";

export const MAX_CATEGORY_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 640;

export type CategoryImageDeps = { db: Db; store: ObjectStore };

const defaults = (): CategoryImageDeps => ({ db: getDb(), store: getObjectStore() });

export function categoryImageKey(id: string) {
  return `categories/${id}.webp`;
}

async function findCategory(db: Db, id: string) {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row ?? null;
}

/**
 * Imagem do cartão da categoria (dataset-ajustes, doors 2 e 3): WebP de até 640 px, orientação EXIF
 * aplicada, em `categories/{id}.webp`. Idempotente: reenviar troca o mesmo objeto.
 */
export async function uploadCategoryImage(
  request: Request,
  id: string,
  deps: CategoryImageDeps = defaults(),
): Promise<Response> {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "invalid", fields: { file: "Envie a imagem" } }, { status: 422 });
  if (file.size > MAX_CATEGORY_IMAGE_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "category_not_found" }, { status: 404 });

  const { db, store } = deps;
  const category = await findCategory(db, id);
  if (!category) return Response.json({ error: "category_not_found" }, { status: 404 });

  let image: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    await sharp(input).metadata();
    image = await sharp(input)
      .autoOrient()
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
  } catch {
    return Response.json({ error: "not_an_image" }, { status: 415 });
  }

  const key = categoryImageKey(id);
  try {
    await store.put(key, image, "image/webp");
  } catch (error) {
    console.error("imagem da categoria não foi gravada no armazenamento", { categoryId: id, error });
    return Response.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const [updated] = await db.update(categories).set({ imageKey: key }).where(eq(categories.id, id)).returning();
  return Response.json({ category: updated }, { status: 200 });
}

export async function readCategoryImage(id: string, deps: CategoryImageDeps = defaults()): Promise<Response> {
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "not_found" }, { status: 404 });
  const category = await findCategory(deps.db, id);
  if (!category?.imageKey) return Response.json({ error: "not_found" }, { status: 404 });
  const stream = await deps.store.get(category.imageKey);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    // Reenviar a imagem troca o mesmo objeto, então o navegador revalida em vez de guardar para sempre.
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-cache" },
  });
}
