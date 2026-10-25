/** Violação de unicidade do Postgres (23505), com o nome da constraint que disparou. */
export function uniqueViolation(error: unknown): string | null {
  const e = (error as { cause?: unknown })?.cause ?? error;
  const pg = e as { code?: string; constraint?: string };
  return pg?.code === "23505" ? pg.constraint ?? "" : null;
}
