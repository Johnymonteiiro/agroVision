import type { ModelInfo, Probabilities } from "@/modules/model/classifier";

// Valores persistidos quando o registro de avaliações existir (plan.md, porta 2); o texto da tela vem à parte.
export type Decision = "READY" | "NOT_READY" | "INCONCLUSIVE";

export function decide(p: Probabilities, threshold: ModelInfo["threshold"]): Decision {
  const ready = p.ready >= threshold.READY;
  const notReady = p.notReady >= threshold.NOT_READY;
  // Com limiares abaixo de 0,5 as duas classes podem passar; vence a mais provável.
  if (ready && notReady) return p.ready >= p.notReady ? "READY" : "NOT_READY";
  if (ready) return "READY";
  if (notReady) return "NOT_READY";
  return "INCONCLUSIVE";
}

// Maior probabilidade truncada em porcentagem inteira: 0.849 vira 84, nunca 85. O epsilon evita que
// 0.29 * 100 = 28.999… perca um ponto.
export function confidencePercent(p: Probabilities) {
  return Math.floor(Math.max(p.ready, p.notReady) * 100 + 1e-9);
}
