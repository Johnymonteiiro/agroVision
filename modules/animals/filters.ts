import type { Readiness } from "@/modules/core/db/schema";

// Filtro serializável: atravessa do servidor para a lista (client), por isso não carrega função.
export type FilterSpec =
  | { key: string; label: string; field: "all" }
  | { key: string; label: string; field: "readiness" | "categoryId" | "sex"; value: string };

export type FilterableRow = { readiness: Readiness; categoryId: string; sex: "MALE" | "FEMALE" };

export function matchesFilter(row: FilterableRow, filter: FilterSpec): boolean {
  if (filter.field === "all") return true;
  return row[filter.field] === filter.value;
}

type CategoryRef = { id: string; name: string };

const ALL: FilterSpec = { key: "ALL", label: "Todos", field: "all" };
const byCategory = (c: CategoryRef): FilterSpec => ({ key: `cat-${c.id}`, label: c.name, field: "categoryId", value: c.id });

/** Aba Dataset: Todos · Pronto · Não pronto · uma por categoria. */
export function datasetFilters(categories: CategoryRef[]): FilterSpec[] {
  return [
    ALL,
    { key: "READY", label: "Pronto", field: "readiness", value: "READY" },
    { key: "NOT_READY", label: "Não pronto", field: "readiness", value: "NOT_READY" },
    ...categories.map(byCategory),
  ];
}

/** Aba Animais: Todos · uma por categoria · Machos · Fêmeas. */
export function animalsTabFilters(categories: CategoryRef[]): FilterSpec[] {
  return [
    ALL,
    ...categories.map(byCategory),
    { key: "MALE", label: "Machos", field: "sex", value: "MALE" },
    { key: "FEMALE", label: "Fêmeas", field: "sex", value: "FEMALE" },
  ];
}
