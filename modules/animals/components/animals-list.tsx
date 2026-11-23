"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/modules/core/ui/icon";
import { ReadinessBadge } from "@/modules/animals/components/readiness-badge";
import { matchesFilter, type FilterSpec } from "@/modules/animals/filters";
import type { Readiness } from "@/modules/core/db/schema";

export type AnimalRow = {
  id: string;
  externalId: string;
  categoryId: string;
  readiness: Readiness;
  sex: "MALE" | "FEMALE";
  title: string;
  line1: string;
  line2: string;
  photoCount: number;
  lastPhoto: string | null;
  thumbUrl: string | null;
};

// Lista das abas Animais e Dataset; cada aba passa os seus filtros (lib/animals/filters.ts).
export function AnimalsList({ rows, filters }: { rows: AnimalRow[]; filters: FilterSpec[] }) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState(filters[0]?.key ?? "ALL");

  const q = query.trim().toLowerCase();
  const active = filters.find((c) => c.key === chip) ?? filters[0];
  const visible = rows.filter((r) => (!active || matchesFilter(r, active)) && r.externalId.toLowerCase().includes(q));

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
        {filters.map((c) => {
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
                  <div className="mt-[3px] flex items-center gap-2">
                    <p className="min-w-0 truncate text-[14px] font-medium text-ink-2">{r.line1}</p>
                    <ReadinessBadge readiness={r.readiness} />
                  </div>
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
