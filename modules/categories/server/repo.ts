import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { getDb, type Db } from "@/modules/core/db/client";
import { uniqueViolation } from "@/modules/core/db/errors";
import { animals, categories, type Category } from "@/modules/core/db/schema";
import type { NewCategory } from "@/modules/categories/validation";

export type CreateCategoryResult =
  | { status: "created"; category: Category }
  | { status: "existing"; category: Category }
  | { status: "duplicate" };

export type CategoryListItem = Category & { animalCount: number };

// Ordem de criação; o id desempata Taurino e Zebu, que nascem no mesmo instante da migração.
const ORDER = [asc(categories.createdAt), asc(categories.id)];

export async function findCategory(id: string, db: Db = getDb()): Promise<Category | null> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row ?? null;
}

export async function listCategories(db: Db = getDb()): Promise<CategoryListItem[]> {
  const rows = await db
    .select({ category: categories, animalCount: count(animals.id) })
    .from(categories)
    .leftJoin(animals, eq(animals.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(...ORDER);
  return rows.map((r) => ({ ...r.category, animalCount: r.animalCount }));
}

export async function createCategory(input: NewCategory, db: Db = getDb()): Promise<CreateCategoryResult> {
  const existing = await findCategory(input.id, db);
  if (existing) return { status: "existing", category: existing };

  try {
    const [category] = await db
      .insert(categories)
      .values({ id: input.id, name: input.name, description: input.description ?? null })
      .returning();
    return { status: "created", category };
  } catch (error) {
    const constraint = uniqueViolation(error);
    if (constraint === "categories_name_unique") return { status: "duplicate" };
    if (constraint !== null) {
      const raced = await findCategory(input.id, db);
      if (raced) return { status: "existing", category: raced };
    }
    throw error;
  }
}
