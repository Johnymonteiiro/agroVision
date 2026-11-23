import "server-only";
import { count, eq } from "drizzle-orm";
import { getDb, type Db } from "@/modules/core/db/client";
import { animalImages, animals, type Readiness } from "@/modules/core/db/schema";

export type SummaryRow = { readiness: Readiness; categoryId: string; photos: number };

/** Fotos por rótulo de captura × categoria do animal (a categoria é lida do animal, AD-001). */
export async function datasetPhotoCounts(db: Db = getDb()): Promise<SummaryRow[]> {
  return db
    .select({
      readiness: animalImages.readinessAtCapture,
      categoryId: animals.categoryId,
      photos: count(animalImages.id),
    })
    .from(animalImages)
    .innerJoin(animals, eq(animals.id, animalImages.animalId))
    .groupBy(animalImages.readinessAtCapture, animals.categoryId);
}
