import { describe, expect, it } from "vitest";
import { confidencePercent, decide } from "@/lib/evaluation/decision";

const T85 = { READY: 0.85, NOT_READY: 0.85 };

describe("politica de decisao", () => {
  it("pronto no limiar: READY 0.85 com limiar 0.85", () => {
    expect(decide({ ready: 0.85, notReady: 0.15 }, T85)).toBe("READY");
  });

  it("nao pronto acima do limiar: NOT_READY 0.94 com limiar 0.85", () => {
    expect(decide({ ready: 0.06, notReady: 0.94 }, T85)).toBe("NOT_READY");
  });

  it("inconclusivo abaixo dos dois limiares: 0.62 / 0.38 com limiar 0.85", () => {
    expect(decide({ ready: 0.62, notReady: 0.38 }, T85)).toBe("INCONCLUSIVE");
  });

  it("limiar vem do modelo: READY 0.88 passa em 0.85 e nao passa em 0.90", () => {
    const p = { ready: 0.88, notReady: 0.12 };
    expect(decide(p, { READY: 0.85, NOT_READY: 0.85 })).toBe("READY");
    expect(decide(p, { READY: 0.9, NOT_READY: 0.85 })).toBe("INCONCLUSIVE");
  });

  it("as duas classes no limiar: vence a de maior probabilidade", () => {
    const low = { READY: 0.3, NOT_READY: 0.3 };
    expect(decide({ ready: 0.6, notReady: 0.4 }, low)).toBe("READY");
    expect(decide({ ready: 0.35, notReady: 0.65 }, low)).toBe("NOT_READY");
  });
});

describe("confianca exibida", () => {
  it("confianca truncada: maior probabilidade em porcentagem inteira", () => {
    expect(confidencePercent({ ready: 0.914, notReady: 0.086 })).toBe(91);
    expect(confidencePercent({ ready: 0.151, notReady: 0.849 })).toBe(84);
  });

  it("valores exatos nao perdem um ponto por arredondamento binario", () => {
    expect(confidencePercent({ ready: 0.29, notReady: 0.71 })).toBe(71);
    expect(confidencePercent({ ready: 0.85, notReady: 0.15 })).toBe(85);
  });
});
