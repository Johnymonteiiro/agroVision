import type { Position } from "@/modules/vision/positions";

type Photo = { position: Position; capturedAt: Date };

/** Lateral mais recente; sem lateral, a mais recente de qualquer posição; sem foto, null. */
export function mainPhoto<T extends Photo>(photos: T[]): T | null {
  const newestFirst = [...photos].sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  return newestFirst.find((p) => p.position === "SIDE") ?? newestFirst[0] ?? null;
}
