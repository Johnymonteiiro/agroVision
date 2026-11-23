import type { QualityMetrics } from "./metrics";
import { QUALITY_THRESHOLDS } from "./thresholds";

export type QualityIssue = "NO_ANIMAL" | "MULTIPLE_ANIMALS" | "BLURRY" | "TOO_DARK" | "TOO_BRIGHT";

export const QUALITY_LABEL: Record<QualityIssue, string> = {
  NO_ANIMAL: "Nenhum bovino encontrado",
  MULTIPLE_ANIMALS: "Mais de um animal na foto",
  BLURRY: "Foto desfocada",
  TOO_DARK: "Foto muito escura",
  TOO_BRIGHT: "Foto muito clara",
};

/** Problemas da foto, nesta ordem: animal, foco, luz. Sem contagem de bovinos, nada sobre animal. */
export function qualityIssues(m: QualityMetrics): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (m.animalCount === 0) issues.push("NO_ANIMAL");
  if (m.animalCount !== null && m.animalCount >= 2) issues.push("MULTIPLE_ANIMALS");
  if (m.sharpness < QUALITY_THRESHOLDS.minSharpness) issues.push("BLURRY");
  if (m.brightness < QUALITY_THRESHOLDS.minBrightness) issues.push("TOO_DARK");
  if (m.brightness > QUALITY_THRESHOLDS.maxBrightness) issues.push("TOO_BRIGHT");
  return issues;
}
