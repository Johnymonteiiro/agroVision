import "server-only";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { getDb, type Db } from "@/modules/core/db/client";
import { foreignKeyViolation, uniqueViolation } from "@/modules/core/db/errors";
import { animalImages, animals, categories, type Animal, type AnimalImage } from "@/modules/core/db/schema";
import { birthDateFromAge } from "@/modules/animals/age";
import type { NewAnimal, ReadinessChange } from "@/modules/animals/validation";

export type AnimalWithCategory = Animal & { categoryName: string };

export type CreateResult =
  | { status: "created"; animal: Animal }
  | { status: "existing"; animal: Animal }
  | { status: "duplicate" }
  | { status: "unknown_category" };

export async function findAnimal(id: string, db: Db = getDb()): Promise<AnimalWithCategory | null> {
  const [row] = await db
    .select({ ...getTableColumns(animals), categoryName: categories.name })
    .from(animals)
    .innerJoin(categories, eq(categories.id, animals.categoryId))
    .where(eq(animals.id, id));
  return row ?? null;
}

async function findAnimalRow(id: string, db: Db): Promise<Animal | null> {
  const [row] = await db.select().from(animals).where(eq(animals.id, id));
  return row ?? null;
}

export async function createAnimal(input: NewAnimal, db: Db = getDb()): Promise<CreateResult> {
  const existing = await findAnimalRow(input.id, db);
  if (existing) return { status: "existing", animal: existing };

  try {
    const [animal] = await db
      .insert(animals)
      .values({
        id: input.id,
        externalId: input.externalId,
        categoryId: input.categoryId,
        readiness: input.readiness,
        sex: input.sex,
        birthDateEstimated: birthDateFromAge(input.age, input.ageUnit),
        ageInputUnit: input.ageUnit,
        weightKg: input.weightKg,
      })
      .returning();
    return { status: "created", animal };
  } catch (error) {
    if (foreignKeyViolation(error) === "animals_category_id_categories_id_fk") return { status: "unknown_category" };
    const constraint = uniqueViolation(error);
    if (constraint === "animals_external_id_unique") return { status: "duplicate" };
    if (constraint !== null) {
      const raced = await findAnimalRow(input.id, db);
      if (raced) return { status: "existing", animal: raced };
    }
    throw error;
  }
}

export type AnimalListItem = AnimalWithCategory & {
  photoCount: number;
  lastPhotoAt: Date | null;
  mainPhotoId: string | null;
};

export async function listAnimals(db: Db = getDb()): Promise<AnimalListItem[]> {
  const rows = await db
    .select({
      animal: animals,
      categoryName: categories.name,
      photoCount: sql<number>`count(${animalImages.id})::int`,
      lastPhotoAt: sql<string | null>`max(${animalImages.capturedAt})`,
      mainPhotoId: sql<string | null>`(
        select ai.id from ${animalImages} ai
        where ai.animal_id = ${animals.id}
        order by (ai.position = 'SIDE') desc, ai.captured_at desc
        limit 1
      )`,
    })
    .from(animals)
    .innerJoin(categories, eq(categories.id, animals.categoryId))
    .leftJoin(animalImages, eq(animalImages.animalId, animals.id))
    .groupBy(animals.id, categories.name)
    .orderBy(desc(animals.createdAt));

  return rows.map((r) => ({
    ...r.animal,
    categoryName: r.categoryName,
    photoCount: r.photoCount,
    lastPhotoAt: r.lastPhotoAt ? new Date(r.lastPhotoAt) : null,
    mainPhotoId: r.mainPhotoId,
  }));
}

export async function listImages(animalId: string, db: Db = getDb()): Promise<AnimalImage[]> {
  return db
    .select()
    .from(animalImages)
    .where(eq(animalImages.animalId, animalId))
    .orderBy(desc(animalImages.capturedAt));
}

export type ReadinessUpdate = { animal: Animal; photosUpdated: number };

/**
 * Muda o rótulo atual do animal. `FROM_NOW`: só as fotos enviadas depois recebem o rótulo novo.
 * `FIX_ALL_PHOTOS`: corrige também o rótulo de captura de todas as fotos dele, na mesma transação.
 */
export async function updateReadiness(
  id: string,
  change: ReadinessChange,
  db: Db = getDb(),
): Promise<ReadinessUpdate | null> {
  return db.transaction(async (tx) => {
    const [animal] = await tx.update(animals).set({ readiness: change.readiness }).where(eq(animals.id, id)).returning();
    if (!animal) return null;
    if (change.scope === "FROM_NOW") return { animal, photosUpdated: 0 };
    const photos = await tx
      .update(animalImages)
      .set({ readinessAtCapture: change.readiness })
      .where(eq(animalImages.animalId, id))
      .returning({ id: animalImages.id });
    return { animal, photosUpdated: photos.length };
  });
}
