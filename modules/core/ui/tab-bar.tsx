"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/modules/core/ui/icon";

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/historico", label: "Histórico", icon: "history" },
  { href: "/analisar", label: "Analisar", icon: "photo_camera" },
  { href: "/animais", label: "Animais", icon: "sell" },
  { href: "/dataset", label: "Dataset", icon: "dataset" },
] as const;

const CENTER = "/analisar";

// Barra inferior do design (telas 1a e 2d): quatro abas e o botão central de câmera, elevado.
// Ajustes saiu da barra (dataset-rotulos) e abre pela engrenagem da Home.
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pt-2 pb-[max(8px,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto grid max-w-[480px] grid-cols-5 px-1.5">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex justify-center">
              {tab.href === CENTER ? (
                // "de" diz ao fluxo para onde "Cancelar" volta.
                <Link
                  href={`${tab.href}?de=${encodeURIComponent(pathname)}`}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="-mt-[26px] flex size-[62px] items-center justify-center rounded-full bg-primary text-white shadow-[0_0_0_5px_white,0_6px_16px_rgba(21,76,53,.35)]"
                >
                  <Icon name={tab.icon} size={30} fill />
                </Link>
              ) : (
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-[50px] w-full flex-col items-center justify-center gap-1 text-[12px] ${
                    active ? "font-semibold text-primary" : "font-medium text-muted"
                  }`}
                >
                  <Icon name={tab.icon} fill={active} />
                  {tab.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
