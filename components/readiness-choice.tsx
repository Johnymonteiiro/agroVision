import type { Readiness } from "@/lib/db/schema";

const OPTIONS = [
  { value: "READY", label: "Pronto", hint: "Pronto para abate" },
  { value: "NOT_READY", label: "Não pronto", hint: "Ainda não está pronto" },
] as const;

// Cartões Pronto / Não pronto do cadastro e da tela "Alterar rótulo".
export function ReadinessChoice({ value, onChange }: { value: Readiness | null; onChange: (r: Readiness) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="Rótulo">
      {OPTIONS.map((o) => {
        const on = value === o.value;
        const look =
          o.value === "READY" ? "border-2 border-ready bg-ready-soft" : "border-2 border-not-ready bg-error-soft";
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`flex min-h-16 flex-col items-start justify-center rounded-card px-3.5 py-2.5 text-left ${
              on ? look : "border-[1.5px] border-line bg-white"
            }`}
          >
            <span className="text-[16px] font-semibold">{o.label}</span>
            <span className="text-[12px] text-muted">{o.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
