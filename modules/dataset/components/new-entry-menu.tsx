"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/modules/core/ui/icon";

const ITEMS = [
  { href: "/dataset/novo", label: "Animal", icon: "pets" },
  { href: "/dataset/categorias/nova", label: "Categoria", icon: "category" },
] as const;

// "Novo cadastro" da aba Dataset (dataset-ajustes, AC 15-18): abre um menu com Animal e Categoria.
export function NewEntryMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-1.5 rounded-[12px] bg-primary pl-2.5 pr-3.5 text-[15px] font-semibold text-white"
      >
        <Icon name="add" size={22} />
        Novo cadastro
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Novo cadastro"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 overflow-hidden rounded-card bg-white py-1 shadow-[0_1px_2px_rgba(23,33,28,.06),0_8px_24px_rgba(23,33,28,.14)]"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-12 items-center gap-3 px-4 text-[16px] font-semibold text-ink"
            >
              <Icon name={item.icon} className="text-primary" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
