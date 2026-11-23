import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Classifier } from "@/lib/evaluation/classifier";

const fake: Classifier = {
  model: { name: "CattleClassifier", version: "1.4.0", threshold: { READY: 0.85, NOT_READY: 0.85 } },
  classify: async () => ({ ready: 0.9, notReady: 0.1 }),
};

// O módulo guarda o carregamento em andamento; cada teste começa com um módulo novo.
async function freshModule() {
  vi.resetModules();
  return import("@/lib/evaluation/classifier");
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("carregamento do classificador", () => {
  it("sem gancho rejeita com ModelUnavailableError", async () => {
    vi.stubGlobal("window", {});
    const { loadClassifier, ModelUnavailableError } = await freshModule();
    await expect(loadClassifier()).rejects.toBeInstanceOf(ModelUnavailableError);
  });

  it("com gancho resolve o classificador que o gancho devolve", async () => {
    vi.stubGlobal("window", { __agroClassifier: () => Promise.resolve(fake) });
    const { loadClassifier } = await freshModule();
    await expect(loadClassifier()).resolves.toBe(fake);
  });
});

describe("nova tentativa e reaproveitamento", () => {
  it("depois de uma falha, a chamada seguinte chama o gancho de novo e resolve", async () => {
    const hook = vi.fn().mockRejectedValueOnce(new Error("falha simulada")).mockResolvedValueOnce(fake);
    vi.stubGlobal("window", { __agroClassifier: hook });
    const { loadClassifier, ModelUnavailableError } = await freshModule();
    const first = loadClassifier();
    await expect(first).rejects.toThrow("falha simulada");
    await expect(first).rejects.not.toBeInstanceOf(ModelUnavailableError);
    await expect(loadClassifier()).resolves.toBe(fake);
    expect(hook).toHaveBeenCalledTimes(2);
  });

  it("dois carregamentos bem-sucedidos chamam o gancho uma vez so", async () => {
    const hook = vi.fn().mockResolvedValue(fake);
    vi.stubGlobal("window", { __agroClassifier: hook });
    const { loadClassifier } = await freshModule();
    await expect(loadClassifier()).resolves.toBe(fake);
    await expect(loadClassifier()).resolves.toBe(fake);
    expect(hook).toHaveBeenCalledTimes(1);
  });
});
