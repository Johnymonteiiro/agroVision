"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";

export type AnimalRow = {
  id: string;
  externalId: string;
  category: "TAURINE" | "ZEBU";
  sex: "MALE" | "FEMALE";
  title: string;
  line1: string;
  line2: string;
  photoCount: number;
  lastPhoto: string | null;
  thumbUrl: string | null;
};

const CHIPS = [
  { key: "ALL", label: "Todos", match: () => true },
  { key: "TAURINE", label: "Taurino", match: (r: AnimalRow) => r.category === "TAURINE" },
  { key: "ZEBU", label: "Zebu", match: (r: AnimalRow) => r.category === "ZEBU" },
  { key: "MALE", label: "Machos", match: (r: AnimalRow) => r.sex === "MALE" },
  { key: "FEMALE", label: "Fêmeas", match: (r: AnimalRow) => r.sex === "FEMALE" },
] as const;

export function AnimalsList({ rows }: { rows: AnimalRow[] }) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<(typeof CHIPS)[number]["key"]>("ALL");

  const q = query.trim().toLowerCase();
  const active = CHIPS.find((c) => c.key === chip)!;
  const visible = rows.filter((r) => active.match(r) && r.externalId.toLowerCase().includes(q));

  return (
    <>
      <label className="mx-4 mt-4 flex h-[50px] items-center gap-2.5 rounded-btn border border-line bg-white px-3.5 text-muted">
        <Icon name="search" size={22} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar brinco ou ID"
          aria-label="Buscar brinco ou ID"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto px-4 pt-2" role="group" aria-label="Filtros">
        {CHIPS.map((c) => {
          const on = c.key === chip;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => setChip(c.key)}
              className="flex h-11 shrink-0 items-center"
            >
              <span
                className={`flex h-9 items-center rounded-[18px] px-3.5 text-[14px] ${
                  on ? "bg-primary-dark font-semibold text-white" : "border border-line bg-white font-medium"
                }`}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mx-4 mt-6 text-center text-[15px] text-muted">Nenhum animal encontrado</p>
      ) : (
        <ul className="mx-4 mt-2.5 rounded-card bg-white shadow-[0_1px_2px_rgba(23,33,28,.04),0_4px_16px_rgba(23,33,28,.04)]">
          {visible.map((r) => (
            <li key={r.id} className="border-b border-line-soft last:border-b-0" data-testid="animal-item">
              <Link href={`/animais/${r.id}`} className="flex gap-3 p-3">
                {r.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.thumbUrl} alt="" className="size-[76px] flex-none rounded-[12px] object-cover" />
                ) : (
                  <div className="placeholder-stripes size-[76px] flex-none rounded-[12px]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[16px] font-bold">{r.title}</span>
                    {r.photoCount > 0 ? (
                      <span className="h-[22px] rounded-[6px] bg-ready-soft px-[7px] text-[11px] font-bold leading-[22px] text-ready-ink">
                        {r.photoCount} {r.photoCount === 1 ? "FOTO" : "FOTOS"}
                      </span>
                    ) : (
                      <span className="h-[22px] rounded-[6px] bg-disabled px-[7px] text-[11px] font-bold leading-[22px] text-ink-2">
                        SEM FOTOS
                      </span>
                    )}
                  </div>
                  <p className="mt-[3px] text-[14px] font-medium text-ink-2">{r.line1}</p>
                  <p className="text-[14px] text-muted">{r.line2}</p>
                  {r.lastPhoto && <p className="mt-[3px] text-[12px] text-muted">Última foto: {r.lastPhoto}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
