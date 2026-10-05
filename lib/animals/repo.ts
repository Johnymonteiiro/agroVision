import { desc, eq, sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db/client";
import { uniqueViolation } from "@/lib/db/errors";
import { animalImages, animals, type Animal, type AnimalImage } from "@/lib/db/schema";
import { birthDateFromAge } from "./age";
import type { NewAnimal } from "./validation";

export type CreateResult =
  | { status: "created"; animal: Animal }
  | { status: "existing"; animal: Animal }
  | { status: "duplicate" };

export async function findAnimal(id: string, db: Db = getDb()): Promise<Animal | null> {
  const [row] = await db.select().from(animals).where(eq(animals.id, id));
  return row ?? null;
}

export async function createAnimal(input: NewAnimal, db: Db = getDb()): Promise<CreateResult> {
  const existing = await findAnimal(input.id, db);
  if (existing) return { status: "existing", animal: existing };

  try {
    const [animal] = await db
      .insert(animals)
      .values({
        id: input.id,
        externalId: input.externalId,
        category: input.category,
        sex: input.sex,
        birthDateEstimated: birthDateFromAge(input.age, input.ageUnit),
        ageInputUnit: input.ageUnit,
        weightKg: input.weightKg,
      })
      .returning();
    return { status: "created", animal };
  } catch (error) {
    const constraint = uniqueViolation(error);
    if (constraint === "animals_external_id_unique") return { status: "duplicate" };
    if (constraint !== null) {
      const raced = await findAnimal(input.id, db);
      if (raced) return { status: "existing", animal: raced };
    }
    throw error;
  }
}

export type AnimalListItem = Animal & {
  photoCount: number;
  lastPhotoAt: Date | null;
  mainPhotoId: string | null;
};

export async function listAnimals(db: Db = getDb()): Promise<AnimalListItem[]> {
  const rows = await db
    .select({
      animal: animals,
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
    .leftJoin(animalImages, eq(animalImages.animalId, animals.id))
    .groupBy(animals.id)
    .orderBy(desc(animals.createdAt));

  return rows.map((r) => ({
    ...r.animal,
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
