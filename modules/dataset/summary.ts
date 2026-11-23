import type { SummaryRow } from "@/modules/dataset/server/repo";
import type { Readiness } from "@/modules/core/db/schema";

export type SummaryGroup = { total: number; parts: { name: string; count: number }[] };
export type DatasetSummary = { total: number; groups: Record<Readiness, SummaryGroup> };

/**
 * Agrupa as contagens por rótulo de captura e, dentro de cada rótulo, por categoria na ordem
 * recebida (ordem de criação). Categoria sem foto naquele rótulo fica de fora.
 */
export function buildDatasetSummary(rows: SummaryRow[], categories: { id: string; name: string }[]): DatasetSummary {
  const group = (readiness: Readiness): SummaryGroup => {
    const parts = categories
      .map((c) => ({
        name: c.name,
        count: rows.filter((r) => r.readiness === readiness && r.categoryId === c.id).reduce((n, r) => n + r.photos, 0),
      }))
      .filter((p) => p.count > 0);
    return { total: parts.reduce((n, p) => n + p.count, 0), parts };
  };
  const groups = { READY: group("READY"), NOT_READY: group("NOT_READY") };
  return { total: groups.READY.total + groups.NOT_READY.total, groups };
}
