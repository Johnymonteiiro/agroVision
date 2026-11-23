import { sql, type SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const sex = pgEnum("sex", ["MALE", "FEMALE"]);
export const ageUnit = pgEnum("age_unit", ["MONTHS", "YEARS"]);
// Rótulo do dataset; o mesmo vocabulário do modelo (PRD §30) e de `Decision`, sem INCONCLUSIVE.
export const readiness = pgEnum("readiness", ["READY", "NOT_READY"]);
export const position = pgEnum("position", ["REAR", "TOP", "SIDE"]);
export const framing = pgEnum("framing", [
  "FRAMED",
  "OUT_OF_FRAME",
  "TOO_FAR",
  "NOT_DETECTED",
  "UNAVAILABLE",
]);

function normalized(column: AnyPgColumn): SQL {
  return sql`lower(trim(${column}))`;
}

// Categorias cadastráveis; Taurino e Zebu entram como seed na migração 0001 (lib/categories/seed.ts).
export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey(),
    name: varchar({ length: 30 }).notNull(),
    description: varchar({ length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("categories_name_unique").on(normalized(table.name))],
);

export const animals = pgTable(
  "animals",
  {
    id: uuid().primaryKey(),
    externalId: varchar("external_id", { length: 20 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    readiness: readiness().notNull(),
    sex: sex().notNull(),
    birthDateEstimated: date("birth_date_estimated", { mode: "string" }).notNull(),
    ageInputUnit: ageUnit("age_input_unit").notNull(),
    weightKg: integer("weight_kg").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("animals_external_id_unique").on(normalized(table.externalId)),
    index("animals_category_id_idx").on(table.categoryId),
  ],
);

export const animalImages = pgTable(
  "animal_images",
  {
    id: uuid().primaryKey(),
    animalId: uuid("animal_id")
      .notNull()
      .references(() => animals.id),
    position: position().notNull(),
    framing: framing().notNull(),
    minDistanceM: numeric("min_distance_m", { precision: 4, scale: 1, mode: "number" }).notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    bytes: integer().notNull(),
    weightKgAtCapture: integer("weight_kg_at_capture").notNull(),
    ageMonthsAtCapture: integer("age_months_at_capture").notNull(),
    readinessAtCapture: readiness("readiness_at_capture").notNull(),
    // Checagem de qualidade (qualidade-imagem, door 1 e 2): null = não medido (fotos antigas) ou detector fora.
    brightness: real(),
    sharpness: real(),
    animalCount: smallint("animal_count"),
    objectKey: text("object_key").notNull().unique(),
    thumbKey: text("thumb_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("animal_images_animal_id_idx").on(table.animalId)],
);

export type Category = typeof categories.$inferSelect;
export type Animal = typeof animals.$inferSelect;
export type AnimalImage = typeof animalImages.$inferSelect;
export type Readiness = (typeof readiness.enumValues)[number];
