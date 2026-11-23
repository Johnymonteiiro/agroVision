import { describe, expect, it } from "vitest";
import { buildDatasetSummary } from "@/modules/dataset/summary";

const TAURINO = { id: "t", name: "Taurino" };
const ZEBU = { id: "z", name: "Zebu" };
const NELORE = { id: "n", name: "Nelore" };

describe("resumo do dataset", () => {
  it("agrupa por rotulo e categoria em ordem de criacao", () => {
    const summary = buildDatasetSummary(
      [
        // Fora de ordem de propósito: a ordem vem das categorias, não das linhas.
        { readiness: "NOT_READY", categoryId: "z", photos: 1 },
        { readiness: "NOT_READY", categoryId: "t", photos: 2 },
        { readiness: "READY", categoryId: "t", photos: 1 },
      ],
      [TAURINO, ZEBU, NELORE],
    );
    expect(summary.groups.NOT_READY).toEqual({
      total: 3,
      parts: [
        { name: "Taurino", count: 2 },
        { name: "Zebu", count: 1 },
      ],
    });
    // Categoria sem foto naquele rótulo fica de fora (Zebu e Nelore em PRONTO).
    expect(summary.groups.READY).toEqual({ total: 1, parts: [{ name: "Taurino", count: 1 }] });
    expect(summary.total).toBe(4);
  });

  it("sem fotos o total e zero", () => {
    const summary = buildDatasetSummary([], [TAURINO, ZEBU]);
    expect(summary.total).toBe(0);
    expect(summary.groups.READY).toEqual({ total: 0, parts: [] });
    expect(summary.groups.NOT_READY).toEqual({ total: 0, parts: [] });
  });
});
