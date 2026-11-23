import { TEST_ENV } from "./env";

export async function setup() {
  Object.assign(process.env, TEST_ENV);
  const { runMigrations } = await import("../../modules/core/db/migrate");
  const { closeDb } = await import("../../modules/core/db/client");
  await runMigrations();
  await closeDb();
}
