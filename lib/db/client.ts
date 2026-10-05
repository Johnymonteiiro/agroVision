import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { gadoPool?: Pool; gadoDb?: Db };

export function getDb(): Db {
  if (!globalForDb.gadoDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL não definido");
    globalForDb.gadoPool = new Pool({ connectionString });
    globalForDb.gadoDb = drizzle({ client: globalForDb.gadoPool, schema });
  }
  return globalForDb.gadoDb;
}

export async function closeDb() {
  await globalForDb.gadoPool?.end();
  globalForDb.gadoPool = undefined;
  globalForDb.gadoDb = undefined;
}
