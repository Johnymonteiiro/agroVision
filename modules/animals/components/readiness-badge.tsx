import type { Readiness } from "@/modules/core/db/schema";

// Selo do rótulo (PRONTO / NÃO PRONTO) nas listas, no perfil, em "Qual posição?" e na prévia do cadastro.
export function ReadinessBadge({ readiness }: { readiness: Readiness }) {
  const ready = readiness === "READY";
  return (
    <span
      data-testid="readiness-badge"
      className={`inline-flex h-[22px] shrink-0 items-center rounded-[6px] px-[7px] text-[11px] font-bold ${
        ready ? "bg-ready-soft text-ready-ink" : "bg-error-soft text-not-ready"
      }`}
    >
      {ready ? "PRONTO" : "NÃO PRONTO"}
    </span>
  );
}
