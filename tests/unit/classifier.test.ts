import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelUnavailableError, loadClassifier, type Classifier } from "@/lib/evaluation/classifier";

const fake: Classifier = {
  model: { name: "CattleClassifier", version: "1.4.0", threshold: { READY: 0.85, NOT_READY: 0.85 } },
  classify: async () => ({ ready: 0.9, notReady: 0.1 }),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("carregamento do classificador", () => {
  it("sem gancho rejeita com ModelUnavailableError", async () => {
    vi.stubGlobal("window", {});
    await expect(loadClassifier()).rejects.toBeInstanceOf(ModelUnavailableError);
  });

  it("com gancho resolve o classificador que o gancho devolve", async () => {
    vi.stubGlobal("window", { __agroClassifier: () => Promise.resolve(fake) });
    await expect(loadClassifier()).resolves.toBe(fake);
  });
});
