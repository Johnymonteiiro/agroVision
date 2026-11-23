import { describe, expect, it } from "vitest";
import { animalsTabFilters, datasetFilters, matchesFilter, type FilterableRow } from "@/lib/animals/filters";

const categories = [
  { id: "t", name: "Taurino" },
  { id: "z", name: "Zebu" },
];
const A: FilterableRow & { name: string } = { name: "A", readiness: "READY", categoryId: "t", sex: "MALE" };
const B: FilterableRow & { name: string } = { name: "B", readiness: "NOT_READY", categoryId: "z", sex: "FEMALE" };

function shown(filters: ReturnType<typeof datasetFilters>) {
  return Object.fromEntries(filters.map((f) => [f.label, [A, B].filter((r) => matchesFilter(r, f)).map((r) => r.name)]));
}

describe("filtros das listas", () => {
  it("filtro por rotulo, categoria e sexo", () => {
    const dataset = datasetFilters(categories);
    expect(dataset.map((f) => f.label)).toEqual(["Todos", "Pronto", "Não pronto", "Taurino", "Zebu"]);
    expect(shown(dataset)).toEqual({
      Todos: ["A", "B"],
      Pronto: ["A"],
      "Não pronto": ["B"],
      Taurino: ["A"],
      Zebu: ["B"],
    });

    const tab = animalsTabFilters(categories);
    expect(tab.map((f) => f.label)).toEqual(["Todos", "Taurino", "Zebu", "Machos", "Fêmeas"]);
    expect(shown(tab)).toEqual({
      Todos: ["A", "B"],
      Taurino: ["A"],
      Zebu: ["B"],
      Machos: ["A"],
      Fêmeas: ["B"],
    });
  });
});
