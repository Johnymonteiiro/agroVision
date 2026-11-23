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
});
