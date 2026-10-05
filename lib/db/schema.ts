import { sql, type SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const category = pgEnum("category", ["TAURINE", "ZEBU"]);
export const sex = pgEnum("sex", ["MALE", "FEMALE"]);
export const ageUnit = pgEnum("age_unit", ["MONTHS", "YEARS"]);
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

export const animals = pgTable(
  "animals",
  {
    id: uuid().primaryKey(),
    externalId: varchar("external_id", { length: 20 }).notNull(),
    category: category().notNull(),
    sex: sex().notNull(),
    birthDateEstimated: date("birth_date_estimated", { mode: "string" }).notNull(),
    ageInputUnit: ageUnit("age_input_unit").notNull(),
    weightKg: integer("weight_kg").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("animals_external_id_unique").on(normalized(table.externalId))],
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
    objectKey: text("object_key").notNull().unique(),
    thumbKey: text("thumb_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("animal_images_animal_id_idx").on(table.animalId)],
);

export type Animal = typeof animals.$inferSelect;
export type AnimalImage = typeof animalImages.$inferSelect;
