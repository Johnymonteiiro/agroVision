import { eq } from "drizzle-orm";
import { z } from "zod";
import { ageInMonths } from "@/lib/animals/age";
import { findAnimal } from "@/lib/animals/repo";
import { getDb, type Db } from "@/lib/db/client";
import { uniqueViolation } from "@/lib/db/errors";
import { animalImages, type AnimalImage } from "@/lib/db/schema";
import { getObjectStore, type ObjectStore } from "@/lib/storage/object-store";
import { NotAnImageError, processPhoto } from "./process-photo";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type UploadDeps = {
  db: Db;
  store: ObjectStore;
  insertImage?: (row: typeof animalImages.$inferInsert) => Promise<AnimalImage>;
};

const fieldsSchema = z.object({
  imageId: z.uuid(),
  position: z.enum(["REAR", "TOP", "SIDE"]),
  framing: z.enum(["FRAMED", "OUT_OF_FRAME", "TOO_FAR", "NOT_DETECTED", "UNAVAILABLE"]),
  minDistanceM: z.coerce.number().min(0).max(999),
  capturedAt: z.iso.datetime({ offset: true }),
});

export function objectKeys(animalId: string, position: string, imageId: string) {
  const base = `animals/${animalId}/${position}/${imageId}`;
  return { objectKey: `${base}.jpg`, thumbKey: `${base}_thumb.webp` };
}

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

async function findImage(db: Db, id: string) {
  const [row] = await db.select().from(animalImages).where(eq(animalImages.id, id));
  return row ?? null;
}

export async function uploadAnimalImage(
  request: Request,
  animalId: string,
  deps: UploadDeps = { db: getDb(), store: getObjectStore() },
): Promise<Response> {
  const { db, store } = deps;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return json({ error: "invalid", fields: { file: "Envie a foto" } }, 422);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "too_large" }, 413);

  const parsed = fieldsSchema.safeParse(Object.fromEntries([...form.entries()].filter(([k]) => k !== "file")));
  if (!parsed.success) {
    return json({ error: "invalid", fields: z.flattenError(parsed.error).fieldErrors }, 422);
  }
  const fields = parsed.data;

  const existing = await findImage(db, fields.imageId);
  if (existing) return json({ image: existing }, 200);

  const animal = await findAnimal(animalId, db);
  if (!animal) return json({ error: "animal_not_found" }, 404);

  let photo;
  try {
    photo = await processPhoto(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof NotAnImageError) return json({ error: "not_an_image" }, 415);
    throw error;
  }

  const { objectKey, thumbKey } = objectKeys(animal.id, fields.position, fields.imageId);
  const written: string[] = [];
  const cleanup = () => Promise.allSettled(written.map((key) => store.remove(key)));

  try {
    await store.put(objectKey, photo.full, "image/jpeg");
    written.push(objectKey);
    await store.put(thumbKey, photo.thumb, "image/webp");
    written.push(thumbKey);
  } catch (error) {
    console.error("upload de imagem falhou no armazenamento", { imageId: fields.imageId, error });
    await cleanup();
    return json({ error: "storage_unavailable" }, 503);
  }

  const capturedAt = new Date(fields.capturedAt);
  const row = {
    id: fields.imageId,
    animalId: animal.id,
    position: fields.position,
    framing: fields.framing,
    minDistanceM: fields.minDistanceM,
    capturedAt,
    width: photo.width,
    height: photo.height,
    bytes: photo.full.length,
    weightKgAtCapture: animal.weightKg,
    ageMonthsAtCapture: ageInMonths(animal.birthDateEstimated, capturedAt),
    objectKey,
    thumbKey,
  };

  try {
    const insert =
      deps.insertImage ?? (async (values) => (await db.insert(animalImages).values(values).returning())[0]);
    const image = await insert(row);
    return json({ image }, 201);
  } catch (error) {
    if (uniqueViolation(error) !== null) {
      // Outro envio com o mesmo imageId venceu a corrida; os objetos são os mesmos e ficam.
      const raced = await findImage(db, fields.imageId);
      if (raced) return json({ image: raced }, 200);
    }
    console.error("upload de imagem falhou no banco", { imageId: fields.imageId, error });
    await cleanup();
    return json({ error: "database_error" }, 500);
  }
}
