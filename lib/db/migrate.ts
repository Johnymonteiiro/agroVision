import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb } from "./client";

export async function runMigrations() {
  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), "drizzle") });
}
