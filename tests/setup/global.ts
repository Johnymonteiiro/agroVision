import { TEST_ENV } from "./env";

export async function setup() {
  Object.assign(process.env, TEST_ENV);
  const { runMigrations } = await import("../../lib/db/migrate");
  const { closeDb } = await import("../../lib/db/client");
  await runMigrations();
  await closeDb();
}
