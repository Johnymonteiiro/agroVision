export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@/modules/core/db/migrate");
    await runMigrations();
  }
}
