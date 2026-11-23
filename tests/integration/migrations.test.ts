import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TEST_ENV } from "../setup/env";

// Banco descartável para aplicar as migrações uma a uma, fora do banco de teste que o Vitest migra.
const SCRATCH_DB = "gado_certo_migration_test";

function statements(file: string) {
  const text = readFileSync(path.join(process.cwd(), "drizzle", file), "utf8");
  return text
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
}

function connect(database: string) {
  const url = new URL(TEST_ENV.DATABASE_URL);
  url.pathname = `/${database}`;
  return new pg.Client({ connectionString: url.toString() });
}

async function recreateScratch() {
  const admin = connect("postgres");
  await admin.connect();
  await admin.query(`drop database if exists ${SCRATCH_DB}`);
  await admin.query(`create database ${SCRATCH_DB}`);
  await admin.end();
}

let client: pg.Client;

beforeAll(async () => {
  await recreateScratch();
  client = connect(SCRATCH_DB);
  await client.connect();
});

afterAll(async () => {
  await client.end();
  const admin = connect("postgres");
  await admin.connect();
  await admin.query(`drop database if exists ${SCRATCH_DB}`);
  await admin.end();
});

describe("migracoes", () => {
  it("migracao 0001 falha com animal existente", async () => {
    for (const s of statements("0000_init.sql")) await client.query(s);
    await client.query(
      `insert into animals (id, external_id, category, sex, birth_date_estimated, age_input_unit, weight_kg)
       values ('11111111-1111-4111-8111-111111111111', '023', 'TAURINE', 'MALE', '2024-11-01', 'MONTHS', 485)`,
    );

    await client.query("begin");
    let failure: unknown = null;
    try {
      for (const s of statements("0001_dataset_labels.sql")) await client.query(s);
    } catch (error) {
      failure = error;
    }
    await client.query("rollback");

    expect((failure as { code?: string } | null)?.code).toBe("23502"); // not_null_violation
    const { rows } = await client.query(
      "select column_name from information_schema.columns where table_name = 'animals' and column_name = 'category'",
    );
    expect(rows).toHaveLength(1);
  });

  it("migracao 0003 so adiciona colunas anulaveis", () => {
    const sql = statements("0003_quality_metrics.sql");
    expect(sql).toHaveLength(3);
    for (const s of sql) {
      expect(s).toMatch(/^ALTER TABLE "animal_images" ADD COLUMN "\w+" \w+;?$/);
      expect(s.toUpperCase()).not.toContain("NOT NULL");
    }
  });

  it("migracao 0004 so adiciona coluna anulavel", () => {
    expect(statements("0004_category_image.sql")).toEqual(['ALTER TABLE "categories" ADD COLUMN "image_key" text;']);
  });

  it("migracao 0003 deixa fotos antigas sem medida", async () => {
    // Banco novo só para este caso: o anterior termina com a 0001 desfeita.
    const name = `${SCRATCH_DB}_q`;
    const admin = connect("postgres");
    await admin.connect();
    await admin.query(`drop database if exists ${name}`);
    await admin.query(`create database ${name}`);
    await admin.end();
    const db = connect(name);
    await db.connect();
    try {
      for (const file of ["0000_init.sql", "0001_dataset_labels.sql", "0002_drop_category_enum.sql"]) {
        for (const s of statements(file)) await db.query(s);
      }
      await db.query(
        `insert into animals (id, external_id, category_id, readiness, sex, birth_date_estimated, age_input_unit, weight_kg)
         values ('22222222-2222-4222-8222-222222222222', '023', '00000000-0000-4000-8000-000000000001', 'NOT_READY', 'MALE', '2024-11-01', 'MONTHS', 485)`,
      );
      await db.query(
        `insert into animal_images (id, animal_id, position, framing, min_distance_m, captured_at, width, height, bytes,
           weight_kg_at_capture, age_months_at_capture, readiness_at_capture, object_key, thumb_key)
         values ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'SIDE', 'FRAMED', 2.1,
           now(), 2048, 1536, 1000, 485, 24, 'NOT_READY', 'k.jpg', 'k_thumb.webp')`,
      );
      for (const s of statements("0003_quality_metrics.sql")) await db.query(s);
      const { rows } = await db.query("select brightness, sharpness, animal_count from animal_images");
      expect(rows).toEqual([{ brightness: null, sharpness: null, animal_count: null }]);
    } finally {
      await db.end();
      const cleanup = connect("postgres");
      await cleanup.connect();
      await cleanup.query(`drop database if exists ${name}`);
      await cleanup.end();
    }
  });
});
